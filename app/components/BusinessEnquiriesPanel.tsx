"use client";

import { useState, useEffect, useCallback, useId } from "react";
import Link from "next/link";
import {
  BookingEnquiryWithDetails,
  BookingEnquiryStatus,
  BookingEventType,
  isPastEventDate,
  isOpenStatus,
  isTerminalStatus,
} from "@/lib/enquiries/types";
import {
  getBusinessEnquiriesAction,
  clarifyEnquiryAction,
  withdrawEnquiryAction,
} from "@/app/actions/enquiries";

interface BusinessEnquiriesPanelProps {
  initialEnquiries?: BookingEnquiryWithDetails[];
}

type FilterTab =
  | "all"
  | "awaiting_artist"
  | "action_needed"
  | "interested"
  | "concluded";

const EVENT_TYPE_LABELS: Record<BookingEventType, string> = {
  corporate: "Corporate Event",
  wedding: "Wedding / Reception",
  restaurant: "Restaurant / Cafe",
  festival: "Festival / Public Event",
  private: "Private Gathering",
  concert: "Concert / Show",
  other: "Other Event",
};

/** Status label and style for business-side display */
function getStatusBadge(status: BookingEnquiryStatus): {
  label: string;
  cls: string;
} {
  switch (status) {
    case "submitted":
      return {
        label: "Submitted",
        cls: "bg-blue-50 text-blue-800 border-blue-200",
      };
    case "seen":
      return {
        label: "Viewed by Artist",
        cls: "bg-indigo-50 text-indigo-800 border-indigo-200",
      };
    case "info_requested":
      return {
        label: "Your Response Needed",
        cls: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case "clarified":
      return {
        label: "Clarification Sent",
        cls: "bg-purple-50 text-purple-800 border-purple-200",
      };
    case "interested":
      return {
        label: "Artist Interested",
        cls: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    case "declined":
      return {
        label: "Declined",
        cls: "bg-red-50 text-red-800 border-red-200",
      };
    case "withdrawn":
      return {
        label: "Withdrawn",
        cls: "bg-gray-100 text-gray-700 border-gray-200",
      };
  }
}

/** Audit event action labels */
function getAuditActionLabel(action: string): string {
  switch (action) {
    case "submitted":
      return "Enquiry submitted";
    case "seen":
      return "Artist viewed enquiry";
    case "info_requested":
      return "Artist requested information";
    case "clarified":
      return "You provided clarification";
    case "interested":
      return "Artist expressed interest (non-binding)";
    case "declined":
      return "Artist declined";
    case "withdrawn":
      return "Enquiry withdrawn";
    default:
      return action;
  }
}

export default function BusinessEnquiriesPanel({
  initialEnquiries,
}: BusinessEnquiriesPanelProps) {
  const [enquiries, setEnquiries] = useState<BookingEnquiryWithDetails[]>(
    initialEnquiries || []
  );
  const [isLoading, setIsLoading] = useState(!initialEnquiries);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Clarification modal state
  const [clarifyModal, setClarifyModal] = useState<BookingEnquiryWithDetails | null>(null);
  const [clarifyText, setClarifyText] = useState("");
  const [clarifyPending, setClarifyPending] = useState(false);
  const [clarifyError, setClarifyError] = useState<string | null>(null);

  // Withdrawal confirmation state
  const [withdrawModal, setWithdrawModal] = useState<BookingEnquiryWithDetails | null>(null);
  const [withdrawPending, setWithdrawPending] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const modalTitleId = useId();

  const loadEnquiries = useCallback(async () => {
    setIsLoading(true);
    const res = await getBusinessEnquiriesAction({ status: "all", limit: 50 });
    if (res.success && res.data) {
      setEnquiries(res.data);
    } else if (res.error) {
      setFeedbackNotice({ type: "error", message: res.error });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    if (!initialEnquiries) {
      getBusinessEnquiriesAction({ status: "all", limit: 50 }).then((res) => {
        if (!ignore) {
          if (res.success && res.data) {
            setEnquiries(res.data);
          } else if (res.error) {
            setFeedbackNotice({ type: "error", message: res.error });
          }
          setIsLoading(false);
        }
      });
    }
    return () => { ignore = true; };
  }, [initialEnquiries]);

  // Computed filter counts
  const awaitingArtistCount = enquiries.filter((e) =>
    ["submitted", "seen", "clarified"].includes(e.status)
  ).length;
  const actionNeededCount = enquiries.filter(
    (e) => e.status === "info_requested"
  ).length;
  const interestedCount = enquiries.filter(
    (e) => e.status === "interested"
  ).length;
  const concludedCount = enquiries.filter(
    (e) => e.status === "declined" || e.status === "withdrawn"
  ).length;

  // Filtered list
  const filtered = enquiries.filter((e) => {
    if (activeTab === "awaiting_artist") return ["submitted", "seen", "clarified"].includes(e.status);
    if (activeTab === "action_needed") return e.status === "info_requested";
    if (activeTab === "interested") return e.status === "interested";
    if (activeTab === "concluded") return e.status === "declined" || e.status === "withdrawn";
    return true;
  });

  // Clarification submit
  const handleClarify = async () => {
    if (!clarifyModal) return;
    if (clarifyText.trim().length < 5) {
      setClarifyError("Your clarification must be at least 5 characters.");
      return;
    }
    if (clarifyText.trim().length > 2000) {
      setClarifyError("Your clarification cannot exceed 2,000 characters.");
      return;
    }
    setClarifyPending(true);
    setClarifyError(null);
    const res = await clarifyEnquiryAction({
      enquiryId: clarifyModal.id,
      clarification: clarifyText.trim(),
    });
    setClarifyPending(false);
    if (res.success) {
      setClarifyModal(null);
      setClarifyText("");
      setFeedbackNotice({ type: "success", message: "Your clarification was sent. The artist will review it." });
      await loadEnquiries();
    } else {
      setClarifyError(res.error || "Failed to submit clarification.");
    }
  };

  // Withdrawal submit
  const handleWithdraw = async () => {
    if (!withdrawModal) return;
    setWithdrawPending(true);
    setWithdrawError(null);
    const res = await withdrawEnquiryAction(withdrawModal.id);
    setWithdrawPending(false);
    if (res.success) {
      setWithdrawModal(null);
      setFeedbackNotice({ type: "success", message: "Enquiry withdrawn successfully." });
      await loadEnquiries();
    } else {
      setWithdrawError(res.error || "Failed to withdraw enquiry.");
    }
  };

  const emptyMessages: Record<FilterTab, string> = {
    all: "You have not sent any booking enquiries yet.",
    awaiting_artist: "No enquiries are currently awaiting an artist response.",
    action_needed: "No enquiries require your response right now.",
    interested: "No artists have expressed interest yet.",
    concluded: "No declined or withdrawn enquiries.",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">Sent Booking Enquiries</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Track artist responses, reply to questions, and manage your sent enquiries.
          </p>
        </div>
        <Link
          href="/artists"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors self-start sm:self-auto"
        >
          + Send New Enquiry
        </Link>
      </div>

      {/* Feedback Notice */}
      {feedbackNotice && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
            feedbackNotice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedbackNotice.type === "success" ? "✓ " : "⚠ "}{feedbackNotice.message}</span>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
          {(
            [
              { id: "all", label: "All Enquiries", count: enquiries.length },
              { id: "awaiting_artist", label: "Awaiting Artist", count: awaitingArtistCount },
              { id: "action_needed", label: "Your Response Needed", count: actionNeededCount, urgent: true },
              { id: "interested", label: "Artist Interested", count: interestedCount },
              { id: "concluded", label: "Declined / Withdrawn", count: concludedCount },
            ] as { id: FilterTab; label: string; count: number; urgent?: boolean }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-xs"
                  : tab.urgent && tab.count > 0
                  ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{tab.label}</span>
              {tab.urgent && tab.count > 0 ? (
                <span className="px-1.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                  {tab.count}
                </span>
              ) : (
                <span className="opacity-70">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-6 animate-pulse space-y-3"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-10 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-3xl block mb-3">📬</span>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {activeTab === "all" ? "No enquiries sent yet" : emptyMessages[activeTab]}
            </p>
            {activeTab === "all" && (
              <p className="text-xs text-gray-400 mb-4">
                Discover artists and send them a booking enquiry to get started.
              </p>
            )}
            {activeTab === "all" && (
              <Link
                href="/artists"
                className="inline-block px-4 py-2 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200 hover:bg-purple-100"
              >
                Browse Artists →
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((enq) => {
              const isExpanded = expandedId === enq.id;
              const badge = getStatusBadge(enq.status);
              const isPast = isPastEventDate(enq.event_date);
              const isOpen = isOpenStatus(enq.status);
              const isTerminal = isTerminalStatus(enq.status);
              const canClarify = enq.status === "info_requested";
              const canWithdraw = isOpen;
              const artistName =
                enq.artist_profile?.stage_name || "Artist";
              const artistSlug = enq.artist_profile?.slug;
              const artistCategory = enq.artist_profile?.category;
              const eventDateFormatted = new Date(enq.event_date + "T00:00:00+05:30").toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const submittedFormatted = new Date(enq.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={enq.id} className="p-4 sm:p-6">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Artist name + status row */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {artistSlug ? (
                          <Link
                            href={`/artists/${artistSlug}`}
                            target="_blank"
                            className="text-sm font-bold text-purple-700 hover:text-purple-900 hover:underline"
                          >
                            {artistName}
                          </Link>
                        ) : (
                          <span className="text-sm font-bold text-gray-900">{artistName}</span>
                        )}
                        {artistCategory && (
                          <span className="text-[11px] text-gray-500">· {artistCategory}</span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        {isPast && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                            ⌛ Past Event
                          </span>
                        )}
                      </div>

                      {/* Event meta */}
                      <p className="text-xs text-gray-600 mb-0.5">
                        <strong>Event:</strong> {EVENT_TYPE_LABELS[enq.event_type]} ·{" "}
                        <strong>{eventDateFormatted}</strong>
                        {enq.event_location && ` · ${enq.event_location}`}
                      </p>
                      {enq.indicative_budget && (
                        <p className="text-xs text-gray-600">
                          <strong>Budget:</strong>{" "}
                          ₹{Number(enq.indicative_budget).toLocaleString("en-IN")}{" "}
                          <span className="text-gray-400">(indicative, non-binding)</span>
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1">
                        Submitted: {submittedFormatted}
                      </p>

                      {/* Action Needed Alert */}
                      {canClarify && (
                        <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                          <span className="text-base shrink-0">❓</span>
                          <div>
                            <strong>Response Required:</strong> The artist has asked a question.
                            Your reply will transition this enquiry to &ldquo;Clarification Sent&rdquo; so the artist can proceed.
                          </div>
                        </div>
                      )}

                      {/* Artist Interested non-binding notice */}
                      {enq.status === "interested" && (
                        <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                          <span className="text-base shrink-0">✅</span>
                          <div>
                            <strong>Artist Interested (Non-binding):</strong>{" "}
                            The artist has expressed interest in your event. This is not a confirmed booking, payment obligation, or calendar reservation. Contact the artist directly to finalise details.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
                      {canClarify && (
                        <button
                          type="button"
                          onClick={() => {
                            setClarifyModal(enq);
                            setClarifyText("");
                            setClarifyError(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Reply to Artist
                        </button>
                      )}
                      {canWithdraw && (
                        <button
                          type="button"
                          onClick={() => {
                            setWithdrawModal(enq);
                            setWithdrawError(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Withdraw
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : enq.id)}
                        className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {isExpanded ? "Hide Details ↑" : "View Details ↓"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                      {/* Requirements */}
                      {enq.requirements && (
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Your Requirements</p>
                          <p className="text-xs text-gray-800 whitespace-pre-wrap">{enq.requirements}</p>
                        </div>
                      )}

                      {/* Business message */}
                      {enq.business_message && (
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                          <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1">Your Message to Artist</p>
                          <p className="text-xs text-gray-800 whitespace-pre-wrap">{enq.business_message}</p>
                        </div>
                      )}

                      {/* Artist's question (info_requested) */}
                      {enq.artist_response && (
                        <div className={`p-3 rounded-xl border ${
                          enq.status === "info_requested"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-gray-50 border-gray-100"
                        }`}>
                          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
                            {enq.status === "info_requested"
                              ? "🎵 Artist's Question — Reply Required"
                              : enq.status === "interested"
                              ? "🎵 Artist's Interest Note"
                              : enq.status === "declined"
                              ? "🎵 Artist's Response"
                              : "🎵 Artist Response"}
                          </p>
                          <p className="text-xs text-gray-800 whitespace-pre-wrap">{enq.artist_response}</p>
                        </div>
                      )}

                      {/* Business clarification */}
                      {enq.business_clarification && (
                        <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                          <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider mb-1">Your Clarification</p>
                          <p className="text-xs text-gray-800 whitespace-pre-wrap">{enq.business_clarification}</p>
                          {enq.clarified_at && (
                            <p className="text-[10px] text-gray-400 mt-1">
                              Sent {new Date(enq.clarified_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Terminal state summary */}
                      {isTerminal && (
                        <div className={`p-3 rounded-xl border text-xs ${
                          enq.status === "interested"
                            ? "bg-emerald-50 border-emerald-100 text-emerald-900"
                            : enq.status === "declined"
                            ? "bg-red-50 border-red-100 text-red-900"
                            : "bg-gray-50 border-gray-100 text-gray-700"
                        }`}>
                          {enq.status === "interested" && "This enquiry has concluded with the artist expressing non-binding interest. No booking or payment has been created."}
                          {enq.status === "declined" && "The artist declined this enquiry. You may send a new enquiry to a different artist."}
                          {enq.status === "withdrawn" && "You withdrew this enquiry. The enquiry history is preserved."}
                        </div>
                      )}

                      {/* Audit event history */}
                      {enq.events && enq.events.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Enquiry Activity
                          </p>
                          <div className="relative pl-4 space-y-2">
                            <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-200" />
                            {enq.events.map((ev) => (
                              <div key={ev.id} className="relative flex items-start gap-2">
                                <div className="absolute -left-2.5 top-1 w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                                <div className="pl-3">
                                  <p className="text-xs text-gray-800 font-medium">
                                    {getAuditActionLabel(ev.action)}
                                  </p>
                                  {ev.notes && ev.notes !== "Enquiry submitted for event on " + enq.event_date + " (" + enq.event_type + ")" && (
                                    <p className="text-[11px] text-gray-500 mt-0.5 italic whitespace-pre-wrap">
                                      &ldquo;{ev.notes}&rdquo;
                                    </p>
                                  )}
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    {new Date(ev.created_at).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clarification Modal */}
      {clarifyModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${modalTitleId}-clarify`}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3
                  id={`${modalTitleId}-clarify`}
                  className="text-base font-bold text-gray-900"
                >
                  Reply to Artist
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Responding to {clarifyModal.artist_profile?.stage_name || "the artist"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setClarifyModal(null); setClarifyText(""); setClarifyError(null); }}
                className="text-gray-400 hover:text-gray-700 text-lg leading-none cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Artist's question */}
            {clarifyModal.artist_response && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1">
                  Artist&apos;s Question
                </p>
                <p className="text-xs text-gray-800 whitespace-pre-wrap">
                  {clarifyModal.artist_response}
                </p>
              </div>
            )}

            <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="clarify-input">
              Your Clarification
            </label>
            <textarea
              id="clarify-input"
              value={clarifyText}
              onChange={(e) => setClarifyText(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="Provide the information the artist needs (minimum 5 characters)…"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 outline-none text-xs resize-none"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1 mb-3">
              <span>Min 5 characters required</span>
              <span>{clarifyText.length}/2000</span>
            </div>

            <p className="text-[11px] text-gray-500 mb-4 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              After you send this, the enquiry status will change to &ldquo;Clarification Sent&rdquo;.
              The artist can then express interest or decline. This is the only clarification round.
            </p>

            {clarifyError && (
              <p className="text-xs text-red-700 font-semibold mb-3 p-2 bg-red-50 rounded-xl border border-red-200">
                ⚠ {clarifyError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClarify}
                disabled={clarifyPending}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {clarifyPending ? "Sending…" : "Send Clarification"}
              </button>
              <button
                type="button"
                onClick={() => { setClarifyModal(null); setClarifyText(""); setClarifyError(null); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Confirmation Modal */}
      {withdrawModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${modalTitleId}-withdraw`}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3
                id={`${modalTitleId}-withdraw`}
                className="text-base font-bold text-gray-900"
              >
                Withdraw Enquiry?
              </h3>
              <button
                type="button"
                onClick={() => { setWithdrawModal(null); setWithdrawError(null); }}
                className="text-gray-400 hover:text-gray-700 text-lg leading-none cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-700 mb-2">
              You are about to withdraw your enquiry to{" "}
              <strong>{withdrawModal.artist_profile?.stage_name || "this artist"}</strong>{" "}
              for the event on <strong>{withdrawModal.event_date}</strong>.
            </p>
            <p className="text-xs text-gray-500 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
              Withdrawing is permanent. The enquiry will be marked as <strong>Withdrawn</strong> in your dashboard and the artist&apos;s dashboard. No email or SMS notification is sent; the artist will see the updated status in their enquiry inbox. The artist will no longer be able to respond. Your enquiry history will be preserved.
            </p>

            {withdrawError && (
              <p className="text-xs text-red-700 font-semibold mb-3 p-2 bg-red-50 rounded-xl border border-red-200">
                ⚠ {withdrawError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={withdrawPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {withdrawPending ? "Withdrawing…" : "Yes, Withdraw Enquiry"}
              </button>
              <button
                type="button"
                onClick={() => { setWithdrawModal(null); setWithdrawError(null); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

