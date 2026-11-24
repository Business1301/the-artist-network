"use client";

import { useState, useEffect, useCallback, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  BookingEnquiryWithDetails,
  BookingEnquiryStatus,
  BookingEventType,
  isOpenStatus,
  isTerminalStatus,
} from "@/lib/enquiries/types";
import {
  getClientEnquiriesAction,
  clarifyEnquiryAction,
  withdrawEnquiryAction,
} from "@/app/actions/enquiries";

type FilterTab = "all" | "action_needed" | "awaiting_artist" | "interested" | "concluded";

const EVENT_TYPE_LABELS: Record<BookingEventType, string> = {
  corporate: "Corporate Event",
  wedding: "Wedding / Reception",
  restaurant: "Restaurant / Cafe",
  festival: "Festival / Public Event",
  private: "Private Party / Celebration",
  concert: "Concert / Show",
  other: "Other Event",
};

function StatusBadge({ status }: { status: BookingEnquiryStatus }) {
  switch (status) {
    case "submitted":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Enquiry Sent
        </span>
      );
    case "seen":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          Viewed by Artist
        </span>
      );
    case "info_requested":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
          Action Needed: Clarification Requested
        </span>
      );
    case "clarified":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          Clarification Sent
        </span>
      );
    case "interested":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
          ✓ Artist Interested
        </span>
      );
    case "declined":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Declined
        </span>
      );
    case "withdrawn":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
          Withdrawn
        </span>
      );
    default:
      return null;
  }
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState<BookingEnquiryWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Clarification Modal State
  const [clarifyEnquiry, setClarifyEnquiry] = useState<BookingEnquiryWithDetails | null>(null);
  const [clarifyMessage, setClarifyMessage] = useState("");
  const [isClarifying, setIsClarifying] = useState(false);
  const [clarifyError, setClarifyError] = useState<string | null>(null);

  // Withdrawal State
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const modalTitleId = useId();

  const loadEnquiries = useCallback(async () => {
    setIsLoading(true);
    const res = await getClientEnquiriesAction({ status: "all", limit: 50 });
    if (res.success && res.data) {
      setEnquiries(res.data);
    } else if (res.error) {
      setFeedback({ type: "error", message: res.error });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirectTo=/dashboard/client");
        return;
      }

      setUserEmail(user.email || null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserName(profile.full_name || null);
      }

      await loadEnquiries();
    }
    init();
  }, [router, loadEnquiries]);

  // Derived counts
  const totalCount = enquiries.length;
  const actionNeededCount = enquiries.filter((e) => e.status === "info_requested").length;
  const interestedCount = enquiries.filter((e) => e.status === "interested").length;
  const awaitingArtistCount = enquiries.filter(
    (e) => e.status === "submitted" || e.status === "seen" || e.status === "clarified"
  ).length;
  const concludedCount = enquiries.filter((e) => isTerminalStatus(e.status)).length;

  // Filtered list
  const filteredEnquiries = enquiries.filter((e) => {
    if (activeTab === "action_needed") return e.status === "info_requested";
    if (activeTab === "interested") return e.status === "interested";
    if (activeTab === "awaiting_artist") {
      return e.status === "submitted" || e.status === "seen" || e.status === "clarified";
    }
    if (activeTab === "concluded") return isTerminalStatus(e.status);
    return true; // "all"
  });

  // Handle Clarification Submit
  const handleClarifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarifyEnquiry || isClarifying) return;

    if (clarifyMessage.trim().length < 5) {
      setClarifyError("Clarification message must be at least 5 characters long.");
      return;
    }

    setIsClarifying(true);
    setClarifyError(null);

    const res = await clarifyEnquiryAction({
      enquiryId: clarifyEnquiry.id,
      clarification: clarifyMessage.trim(),
    });

    setIsClarifying(false);

    if (res.success) {
      setFeedback({
        type: "success",
        message: "Your clarification was sent to the artist successfully!",
      });
      setClarifyEnquiry(null);
      setClarifyMessage("");
      await loadEnquiries();
    } else {
      setClarifyError(res.error || "Failed to submit clarification.");
    }
  };

  // Handle Withdraw Submit
  const handleWithdraw = async (enquiryId: string) => {
    if (isWithdrawing) return;
    setIsWithdrawing(true);

    const res = await withdrawEnquiryAction(enquiryId);
    setIsWithdrawing(false);
    setWithdrawingId(null);

    if (res.success) {
      setFeedback({
        type: "success",
        message: "Enquiry withdrawn successfully.",
      });
      await loadEnquiries();
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Failed to withdraw enquiry.",
      });
    }
  };

  return (
    <main className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Account Info Bar */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>
              Signed in as <strong className="text-gray-900">{userName || userEmail || "..."}</strong> (Individual Client Account)
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/artists"
              className="text-purple-600 hover:text-purple-800 font-bold transition-colors"
            >
              Discover Artists Directory →
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-start justify-between gap-3 text-xs sm:text-sm font-semibold border ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{feedback.type === "success" ? "✓" : "⚠️"}</span>
              <p>{feedback.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-gray-400 hover:text-gray-700 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
                👤
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    My Booking Enquiries
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Individual Account
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                  Track your direct enquiries with artists for private events, weddings, and celebrations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link
                href="/artists"
                className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors text-center"
              >
                + Find Another Artist
              </Link>
            </div>
          </div>
        </div>

        {/* Non-Binding Advisory Banner */}
        <div className="mb-8 p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3 text-xs sm:text-sm text-blue-900">
          <span className="text-lg flex-shrink-0" aria-hidden="true">
            ℹ️
          </span>
          <p className="leading-relaxed">
            <strong>Important Notice:</strong> Booking enquiries sent through The Artist Network are non-binding expressions of interest. Artists review availability and fees directly. No payment or binding contract is created through this portal.
          </p>
        </div>

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Total Enquiries
            </span>
            <span className="text-2xl sm:text-3xl font-black text-gray-900">
              {isLoading ? "..." : totalCount}
            </span>
          </div>

          <div
            className={`p-5 rounded-2xl border shadow-xs ${
              actionNeededCount > 0
                ? "bg-amber-50/70 border-amber-300"
                : "bg-white border-gray-200"
            }`}
          >
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Action Needed
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl sm:text-3xl font-black ${
                  actionNeededCount > 0 ? "text-amber-600" : "text-gray-900"
                }`}
              >
                {isLoading ? "..." : actionNeededCount}
              </span>
              {actionNeededCount > 0 && (
                <span className="text-[11px] font-bold text-amber-600 animate-pulse">
                  Response Needed
                </span>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Awaiting Artist
            </span>
            <span className="text-2xl sm:text-3xl font-black text-gray-900">
              {isLoading ? "..." : awaitingArtistCount}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Artist Interested
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                {isLoading ? "..." : interestedCount}
              </span>
              <span className="text-[11px] text-gray-400">non-binding</span>
            </div>
          </div>
        </div>

        {/* Action Needed Callout if any */}
        {!isLoading && actionNeededCount > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">❓</span>
              <div>
                <p className="text-sm font-bold text-amber-900">
                  {actionNeededCount} artist{actionNeededCount > 1 ? "s have" : " has"} asked for clarification
                </p>
                <p className="text-xs text-amber-700">
                  Please respond to their questions so they can confirm availability.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("action_needed")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              View &amp; Reply →
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            All Enquiries ({enquiries.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("action_needed")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "action_needed"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <span>Action Needed</span>
            {actionNeededCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-200 text-amber-900">
                {actionNeededCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("interested")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "interested"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Artist Interested ({interestedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("awaiting_artist")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "awaiting_artist"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Awaiting Artist ({awaitingArtistCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("concluded")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "concluded"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Concluded ({concludedCount})
          </button>
        </div>

        {/* Enquiry List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse space-y-3"
              >
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-10 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredEnquiries.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4">
            <div className="text-5xl">🎨</div>
            <h3 className="text-lg font-black text-gray-900">
              {activeTab === "action_needed"
                ? "No Action Needed"
                : activeTab === "interested"
                ? "No Interested Responses Yet"
                : activeTab === "awaiting_artist"
                ? "No Enquiries Awaiting Artists"
                : activeTab === "concluded"
                ? "No Concluded Enquiries"
                : "You Haven't Sent Any Enquiries Yet"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Explore our curated roster of verified musicians, singers, dancers, and performers to plan your special event.
            </p>
            <div className="pt-2">
              <Link
                href="/artists"
                className="inline-flex px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
              >
                Browse All Artists →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnquiries.map((enquiry) => {
              const isExpanded = expandedId === enquiry.id;
              const artistName =
                enquiry.artist_profile?.stage_name || "Artist";
              const formattedDate = new Date(
                enquiry.event_date + "T00:00:00"
              ).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={enquiry.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    enquiry.status === "info_requested"
                      ? "border-amber-300 shadow-sm ring-1 ring-amber-200"
                      : "border-gray-200/90 shadow-xs"
                  }`}
                >
                  {/* Card Header (Clickable) */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : enquiry.id)}
                    className="p-5 sm:p-6 cursor-pointer hover:bg-gray-50/70 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={
                            enquiry.artist_profile?.slug
                              ? `/artists/${enquiry.artist_profile.slug}`
                              : "/artists"
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="text-base sm:text-lg font-black text-gray-900 hover:text-purple-600 transition-colors"
                        >
                          {artistName}
                        </Link>

                        {enquiry.artist_profile?.is_verified && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200"
                            title="Verified Artist"
                          >
                            <span>✓</span>
                            <span>VERIFIED</span>
                          </span>
                        )}

                        <StatusBadge status={enquiry.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1 font-semibold text-gray-700">
                          <span>📅</span>
                          <span>{formattedDate}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          <span>🏷️</span>
                          <span>{EVENT_TYPE_LABELS[enquiry.event_type]}</span>
                        </span>

                        {enquiry.event_location && (
                          <span className="flex items-center gap-1">
                            <span>📍</span>
                            <span>{enquiry.event_location}</span>
                          </span>
                        )}

                        <span className="flex items-center gap-1 font-bold text-gray-800">
                          <span>💰</span>
                          <span>
                            {enquiry.indicative_budget !== null
                              ? `₹${enquiry.indicative_budget.toLocaleString("en-IN")}`
                              : "Budget: Open"}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                      {/* Action Button: Reply to Clarification */}
                      {enquiry.status === "info_requested" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClarifyEnquiry(enquiry);
                            setClarifyMessage("");
                            setClarifyError(null);
                          }}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          Reply to Question
                        </button>
                      )}

                      {/* Expand / Collapse Indicator */}
                      <span className="text-gray-400 text-sm">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Accordion Body */}
                  {isExpanded && (
                    <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50/40 space-y-5 animate-in fade-in duration-150">

                      {/* Artist Clarification Request Notice */}
                      {enquiry.status === "info_requested" && enquiry.artist_response && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 space-y-2">
                          <div className="flex items-center gap-1.5 font-black text-amber-800">
                            <span>❓</span>
                            <span>Question from Artist:</span>
                          </div>
                          <p className="leading-relaxed bg-white/70 p-3 rounded-lg border border-amber-100">
                            {enquiry.artist_response}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setClarifyEnquiry(enquiry);
                              setClarifyMessage("");
                              setClarifyError(null);
                            }}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            Send Clarification Response
                          </button>
                        </div>
                      )}

                      {/* Artist Interested Expression */}
                      {enquiry.status === "interested" && (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-black text-emerald-800">
                            <span>✓</span>
                            <span>Artist Expressed Interest!</span>
                          </div>
                          {enquiry.artist_response ? (
                            <p className="leading-relaxed bg-white/70 p-3 rounded-lg border border-emerald-100">
                              {enquiry.artist_response}
                            </p>
                          ) : (
                            <p className="text-xs text-emerald-700">
                              The artist reviewed your event and expressed interest in performing.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Requirements and Message Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-1">
                            Your Event Requirements
                          </span>
                          <p className="text-xs sm:text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                            {enquiry.requirements || "No specific requirements provided."}
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-1">
                            Your Initial Message
                          </span>
                          <p className="text-xs sm:text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                            {enquiry.business_message || "No initial message provided."}
                          </p>
                        </div>
                      </div>

                      {/* Client Clarification Sent History */}
                      {enquiry.business_clarification && (
                        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-1">
                          <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider block">
                            Your Sent Clarification:
                          </span>
                          <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed">
                            {enquiry.business_clarification}
                          </p>
                        </div>
                      )}

                      {/* Enquiry Action Controls */}
                      <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-[11px] text-gray-400">
                          Reference ID: <code>{enquiry.id.slice(0, 8)}</code>
                        </div>

                        {isOpenStatus(enquiry.status) && (
                          <div>
                            {withdrawingId === enquiry.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-rose-600 font-bold">
                                  Withdraw enquiry?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleWithdraw(enquiry.id)}
                                  disabled={isWithdrawing}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {isWithdrawing ? "Withdrawing..." : "Confirm"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setWithdrawingId(null)}
                                  disabled={isWithdrawing}
                                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setWithdrawingId(enquiry.id)}
                                className="text-xs font-bold text-gray-500 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                Withdraw Enquiry
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* CLARIFICATION MODAL DIALOG */}
      {clarifyEnquiry && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
        >
          <div className="relative bg-white rounded-2xl max-w-lg w-full border border-gray-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3
                  id={modalTitleId}
                  className="text-base sm:text-lg font-black text-gray-900"
                >
                  Reply to Artist Question
                </h3>
                <p className="text-xs text-gray-500">
                  Artist: <strong>{clarifyEnquiry.artist_profile?.stage_name || "Artist"}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClarifyEnquiry(null)}
                disabled={isClarifying}
                className="text-gray-400 hover:text-gray-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Question Display */}
            {clarifyEnquiry.artist_response && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block mb-1">Artist Question:</span>
                <p className="leading-relaxed">{clarifyEnquiry.artist_response}</p>
              </div>
            )}

            {/* Error banner */}
            {clarifyError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {clarifyError}
              </div>
            )}

            {/* Clarification Form */}
            <form onSubmit={handleClarifySubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="clarify-input"
                  className="block text-xs font-bold text-gray-700 mb-1"
                >
                  Your Clarification
                </label>
                <textarea
                  id="clarify-input"
                  rows={4}
                  maxLength={2000}
                  value={clarifyMessage}
                  onChange={(e) => setClarifyMessage(e.target.value)}
                  placeholder="Provide details about your venue, stage, timing, or performance requirements..."
                  disabled={isClarifying}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-purple-500 leading-relaxed disabled:bg-gray-100"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Minimum 5 characters. This is delivered directly to the artist.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setClarifyEnquiry(null)}
                  disabled={isClarifying}
                  className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClarifying || clarifyMessage.trim().length < 5}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isClarifying ? "Sending..." : "Send Clarification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
