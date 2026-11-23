"use client";

import { useState, useEffect, useCallback, useId } from "react";
import {
  BookingEnquiryWithDetails,
  BookingEnquiryStatus,
  BookingEventType,
  isPastEventDate,
  isOpenStatus,
  isTerminalStatus,
} from "@/lib/enquiries/types";
import {
  getArtistEnquiriesAction,
  markEnquirySeenAction,
  expressInterestAction,
  declineEnquiryAction,
  requestInfoAction,
} from "@/app/actions/enquiries";

interface ArtistEnquiriesInboxProps {
  initialEnquiries?: BookingEnquiryWithDetails[];
}

type FilterTab = "all" | "action_needed" | "awaiting_business" | "concluded";

const EVENT_TYPE_LABELS: Record<BookingEventType, string> = {
  corporate: "Corporate Event",
  wedding: "Wedding / Reception",
  restaurant: "Restaurant / Cafe",
  festival: "Festival / Public Event",
  private: "Private Gathering",
  concert: "Concert / Show",
  other: "Other Event",
};

export default function ArtistEnquiriesInbox({
  initialEnquiries,
}: ArtistEnquiriesInboxProps) {
  const [enquiries, setEnquiries] = useState<BookingEnquiryWithDetails[]>(
    initialEnquiries || []
  );
  const [isLoading, setIsLoading] = useState(!initialEnquiries);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Action Modals State
  const [activeActionModal, setActiveActionModal] = useState<{
    type: "request_info" | "express_interest" | "decline";
    enquiry: BookingEnquiryWithDetails;
  } | null>(null);

  const [actionInput, setActionInput] = useState("");
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const modalTitleId = useId();

  // Load enquiries from database
  const loadEnquiries = useCallback(async () => {
    setIsLoading(true);
    const res = await getArtistEnquiriesAction({ status: "all", limit: 50 });
    if (res.success && res.data) {
      setEnquiries(res.data);
    } else if (res.error) {
      setFeedbackNotice({
        type: "error",
        message: res.error || "Failed to load enquiries.",
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    if (!initialEnquiries) {
      getArtistEnquiriesAction({ status: "all", limit: 50 }).then((res) => {
        if (!ignore) {
          if (res.success && res.data) {
            setEnquiries(res.data);
          } else if (res.error) {
            setFeedbackNotice({
              type: "error",
              message: res.error || "Failed to load enquiries.",
            });
          }
          setIsLoading(false);
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [initialEnquiries]);

  // Handle explicit expand & mark seen
  const handleToggleExpand = async (enquiry: BookingEnquiryWithDetails) => {
    const isExpanding = expandedId !== enquiry.id;
    setExpandedId(isExpanding ? enquiry.id : null);

    // If expanding an enquiry that is currently 'submitted', explicitly mark it as seen
    if (isExpanding && enquiry.status === "submitted") {
      try {
        const res = await markEnquirySeenAction(enquiry.id);
        if (res.success) {
          // Optimistically update local state to 'seen'
          setEnquiries((prev) =>
            prev.map((e) =>
              e.id === enquiry.id
                ? {
                    ...e,
                    status: "seen",
                    seen_at: new Date().toISOString(),
                    events: [
                      ...(e.events || []),
                      {
                        id: `optimistic-${Date.now()}`,
                        enquiry_id: e.id,
                        actor_id: null,
                        actor_role: "artist",
                        action: "seen",
                        notes: "Enquiry opened and viewed by artist",
                        created_at: new Date().toISOString(),
                      },
                    ],
                  }
                : e
            )
          );
        }
      } catch {
        // Non-blocking error for seen transition
      }
    }
  };

  // Open action modal
  const handleOpenActionModal = (
    type: "request_info" | "express_interest" | "decline",
    enquiry: BookingEnquiryWithDetails
  ) => {
    setActiveActionModal({ type, enquiry });
    setActionInput("");
    setActionError(null);
  };

  // Close action modal
  const handleCloseActionModal = () => {
    if (!isActionPending) {
      setActiveActionModal(null);
      setActionInput("");
      setActionError(null);
    }
  };

  // Submit Artist Action
  const handleConfirmAction = async () => {
    if (!activeActionModal || isActionPending) return;

    const { type, enquiry } = activeActionModal;
    setIsActionPending(true);
    setActionError(null);

    try {
      if (type === "request_info") {
        if (!actionInput.trim() || actionInput.trim().length < 5) {
          setActionError("Please provide a question of at least 5 characters.");
          setIsActionPending(false);
          return;
        }

        const res = await requestInfoAction(enquiry.id, actionInput.trim());
        if (!res.success) {
          setActionError(res.error || "Failed to request clarification.");
          setIsActionPending(false);
          return;
        }

        setFeedbackNotice({
          type: "success",
          message: "Clarification request sent to the business.",
        });
      } else if (type === "express_interest") {
        const res = await expressInterestAction(
          enquiry.id,
          actionInput.trim() || null
        );
        if (!res.success) {
          setActionError(res.error || "Failed to express interest.");
          setIsActionPending(false);
          return;
        }

        setFeedbackNotice({
          type: "success",
          message: "Non-binding interest expressed. Enquiry concluded.",
        });
      } else if (type === "decline") {
        const res = await declineEnquiryAction(
          enquiry.id,
          actionInput.trim() || null
        );
        if (!res.success) {
          setActionError(res.error || "Failed to decline enquiry.");
          setIsActionPending(false);
          return;
        }

        setFeedbackNotice({
          type: "success",
          message: "Enquiry declined. Status updated.",
        });
      }

      // Reload fresh data from database
      await loadEnquiries();
      handleCloseActionModal();
    } catch {
      setActionError("A network error occurred. Please try again.");
    } finally {
      setIsActionPending(false);
    }
  };

  // Derived counts for inbox tabs
  const unseenCount = enquiries.filter((e) => e.status === "submitted").length;
  const actionNeededCount = enquiries.filter(
    (e) => e.status === "submitted" || e.status === "seen" || e.status === "clarified"
  ).length;
  const awaitingBusinessCount = enquiries.filter(
    (e) => e.status === "info_requested"
  ).length;
  const concludedCount = enquiries.filter((e) => isTerminalStatus(e.status)).length;

  // Filtered list
  const filteredEnquiries = enquiries.filter((e) => {
    if (activeTab === "action_needed") {
      return (
        e.status === "submitted" || e.status === "seen" || e.status === "clarified"
      );
    }
    if (activeTab === "awaiting_business") {
      return e.status === "info_requested";
    }
    if (activeTab === "concluded") {
      return isTerminalStatus(e.status);
    }
    return true; // "all"
  });

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedbackNotice && (
        <div
          className={`p-4 rounded-2xl flex items-start justify-between gap-3 text-xs sm:text-sm font-semibold border ${
            feedbackNotice.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedbackNotice.type === "success" ? "✓" : "⚠️"}</span>
            <p>{feedbackNotice.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-gray-400 hover:text-gray-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header and Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Booking Enquiries Inbox
              </h2>
              {unseenCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                  {unseenCount} New
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Direct enquiries submitted by business and venue clients. Non-binding initial inquiries.
            </p>
          </div>

          <button
            type="button"
            onClick={loadEnquiries}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className={isLoading ? "animate-spin" : ""}>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "all"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>All Enquiries</span>
            <span className="opacity-80">({enquiries.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("action_needed")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "action_needed"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Action Needed</span>
            {actionNeededCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-purple-200 text-purple-900">
                {actionNeededCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("awaiting_business")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "awaiting_business"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Awaiting Business</span>
            <span className="opacity-80">({awaitingBusinessCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("concluded")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "concluded"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Concluded</span>
            <span className="opacity-80">({concludedCount})</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse space-y-3"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-10 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredEnquiries.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-3">
          <div className="text-4xl">📬</div>
          <h3 className="text-base font-black text-gray-900">
            {activeTab === "action_needed"
              ? "All Caught Up!"
              : activeTab === "awaiting_business"
              ? "No Pending Business Clarifications"
              : activeTab === "concluded"
              ? "No Concluded Enquiries"
              : "No Booking Enquiries Yet"}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            {activeTab === "action_needed"
              ? "You have reviewed all incoming enquiries. When venues submit new requests or provide requested clarifications, they will appear here in Action Needed."
              : "When businesses discover your public profile and send event requirements, their enquiries will arrive in this inbox."}
          </p>
        </div>
      ) : (
        /* Enquiry Cards List */
        <div className="space-y-4">
          {filteredEnquiries.map((enquiry) => {
            const isExpanded = expandedId === enquiry.id;
            const isPast = isPastEventDate(enquiry.event_date);
            const isOpen = isOpenStatus(enquiry.status);
            const formattedDate = new Date(
              enquiry.event_date + "T00:00:00"
            ).toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const submittedDate = new Date(enquiry.created_at).toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
              }
            );

            // Business display name
            const clientName =
              enquiry.business_profile?.full_name || "Business Client";

            return (
              <div
                key={enquiry.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  enquiry.status === "submitted"
                    ? "border-blue-400 shadow-sm ring-1 ring-blue-300/50"
                    : "border-gray-200/90 shadow-xs"
                }`}
              >
                {/* CARD SUMMARY HEADER (Clickable) */}
                <div
                  onClick={() => handleToggleExpand(enquiry)}
                  className="p-5 sm:p-6 cursor-pointer hover:bg-gray-50/70 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-black text-gray-900">
                        {clientName}
                      </span>

                      {/* Status Badge */}
                      <StatusBadge status={enquiry.status} />

                      {/* Past Event Badge */}
                      {isPast && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                          ⌛ Past Event
                        </span>
                      )}

                      {/* New Indicator */}
                      {enquiry.status === "submitted" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                          NEW
                        </span>
                      )}
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
                            ? `₹${enquiry.indicative_budget.toLocaleString(
                                "en-IN"
                              )} (Indicative)`
                            : "Budget: Open"}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <span className="text-[11px] text-gray-400 font-medium">
                      Submitted {submittedDate}
                    </span>

                    <button
                      type="button"
                      className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                      <span>{isExpanded ? "▲" : "▼"}</span>
                    </button>
                  </div>
                </div>

                {/* EXPANDED DETAILS ACCORDION */}
                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50/40 space-y-5 animate-in fade-in duration-150">
                    {/* Event Specifications Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                      {/* Requirements */}
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-1">
                          Performance &amp; Technical Requirements
                        </span>
                        <p className="text-xs sm:text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                          {enquiry.requirements || "No specific technical requirements noted."}
                        </p>
                      </div>

                      {/* Business Message */}
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-1">
                          Client Message
                        </span>
                        <p className="text-xs sm:text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                          {enquiry.business_message || "No introductory note provided."}
                        </p>
                      </div>
                    </div>

                    {/* TWO-WAY COMMUNICATION HISTORY */}
                    {(enquiry.artist_response || enquiry.business_clarification) && (
                      <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider block">
                          Enquiry Conversation &amp; Notes
                        </span>

                        {enquiry.artist_response && (
                          <div className="p-3 rounded-lg bg-purple-50/80 border border-purple-200 text-xs text-purple-900 leading-relaxed">
                            <span className="font-bold block mb-0.5">
                              {enquiry.status === "info_requested"
                                ? "❓ Your Question to Business:"
                                : enquiry.status === "declined"
                                ? "🚫 Decline Reason:"
                                : "💬 Your Response / Note:"}
                            </span>
                            <p>{enquiry.artist_response}</p>
                          </div>
                        )}

                        {enquiry.business_clarification && (
                          <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                            <span className="font-bold block mb-0.5">
                              💬 Client Clarification:
                            </span>
                            <p>{enquiry.business_clarification}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actionable Banner for Clarified Enquiries */}
                    {enquiry.status === "clarified" && (
                      <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs leading-relaxed">
                        <span className="font-bold block mb-0.5">
                          ⚡ Action Needed: Client Clarification Received
                        </span>
                        <p>
                          The client has provided the clarification requested. This enquiry is active and awaiting your decision. Please review and express interest or decline below.
                        </p>
                      </div>
                    )}

                    {/* Non-Binding Notice */}
                    {enquiry.status === "interested" && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
                        <p className="font-bold mb-0.5">
                          ✓ Mutual Non-Binding Interest Expressed
                        </p>
                        <p>
                          You have expressed interest in this event. This enquiry is now concluded. Offline arrangements or Phase 5.2 contract negotiations can proceed directly. This does not block your calendar.
                        </p>
                      </div>
                    )}

                    {/* ACTION TOOLBAR (For Open Enquiries) */}
                    {isOpen && (
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        {/* 1. Request Info (Valid from 'submitted' or 'seen') */}
                        {(enquiry.status === "submitted" || enquiry.status === "seen") && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenActionModal("request_info", enquiry)
                            }
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>❓</span>
                            <span>Request Information</span>
                          </button>
                        )}

                        {/* 2. Express Interest (Valid from 'submitted', 'seen', 'clarified') */}
                        {enquiry.status !== "info_requested" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenActionModal("express_interest", enquiry)
                            }
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>✓</span>
                            <span>Express Interest (Non-Binding)</span>
                          </button>
                        )}

                        {/* If in info_requested state, show helper note */}
                        {enquiry.status === "info_requested" && (
                          <span className="text-xs text-amber-700 font-medium bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                            ⏳ Awaiting client clarification before expressing interest.
                          </span>
                        )}

                        {/* 3. Decline Action (Valid from any open status) */}
                        <button
                          type="button"
                          onClick={() => handleOpenActionModal("decline", enquiry)}
                          className="px-4 py-2 bg-white hover:bg-gray-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          <span>✕</span>
                          <span>Decline Enquiry</span>
                        </button>
                      </div>
                    )}

                    {/* Audit Event Trail */}
                    {enquiry.events && enquiry.events.length > 0 && (
                      <div className="pt-3 border-t border-gray-200/60">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                          Activity Log ({enquiry.events.length})
                        </span>
                        <div className="space-y-1.5">
                          {enquiry.events.map((evt) => (
                            <div
                              key={evt.id}
                              className="text-[11px] text-gray-600 flex items-center gap-2"
                            >
                              <span className="text-gray-400">
                                {new Date(evt.created_at).toLocaleTimeString(
                                  "en-IN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                              <span className="font-semibold capitalize text-gray-700">
                                [{evt.actor_role}]
                              </span>
                              <span>{evt.notes || evt.action}</span>
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

      {/* ACTION DIALOG MODAL */}
      {activeActionModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
        >
          <div className="relative bg-white rounded-2xl max-w-lg w-full border border-gray-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3
                id={modalTitleId}
                className="text-lg font-black text-gray-900 tracking-tight"
              >
                {activeActionModal.type === "request_info"
                  ? "Request Information from Client"
                  : activeActionModal.type === "express_interest"
                  ? "Express Non-Binding Interest"
                  : "Decline Booking Enquiry"}
              </h3>
              <button
                type="button"
                onClick={handleCloseActionModal}
                disabled={isActionPending}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                ⚠️ {actionError}
              </div>
            )}

            {/* Modal Specific Notice */}
            {activeActionModal.type === "express_interest" && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                <strong>Non-Binding Notice:</strong> Expressing interest signals to the venue that you are available and interested. It does not create a contract, invoice, or calendar reservation.
              </div>
            )}

            {activeActionModal.type === "request_info" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                Ask the client for necessary event details (e.g., stage dimensions, sound rider, exact performance window). Minimum 5 characters required.
              </div>
            )}

            {/* Input field */}
            <div>
              <label
                htmlFor="action-modal-input"
                className="block text-xs font-bold text-gray-700 mb-1"
              >
                {activeActionModal.type === "request_info"
                  ? "Question / Required Information *"
                  : activeActionModal.type === "express_interest"
                  ? "Optional Note to Client"
                  : "Optional Reason for Declining"}
              </label>
              <textarea
                id="action-modal-input"
                rows={4}
                maxLength={2000}
                required={activeActionModal.type === "request_info"}
                placeholder={
                  activeActionModal.type === "request_info"
                    ? "e.g. Could you confirm whether a drum kit and acoustic monitors are provided on stage?"
                    : activeActionModal.type === "express_interest"
                    ? "e.g. Sounds like a great event! Looking forward to performing."
                    : "e.g. Already committed on this date / Outside my primary performance style."
                }
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                disabled={isActionPending}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
              />
              <span className="text-[10px] text-gray-400 block text-right mt-0.5">
                {actionInput.length}/2000
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCloseActionModal}
                disabled={isActionPending}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isActionPending}
                className={`px-5 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer ${
                  activeActionModal.type === "decline"
                    ? "bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400"
                    : activeActionModal.type === "express_interest"
                    ? "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400"
                    : "bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400"
                }`}
              >
                {isActionPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {activeActionModal.type === "request_info"
                      ? "Send Question"
                      : activeActionModal.type === "express_interest"
                      ? "Express Interest"
                      : "Confirm Decline"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// STATUS BADGE HELPER COMPONENT
// -------------------------------------------------------------
function StatusBadge({ status }: { status: BookingEnquiryStatus }) {
  switch (status) {
    case "submitted":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
          ● Submitted
        </span>
      );
    case "seen":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
          Seen
        </span>
      );
    case "info_requested":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
          ⏳ Info Requested
        </span>
      );
    case "clarified":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">
          💬 Clarified
        </span>
      );
    case "interested":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
          ✓ Interested (Non-Binding)
        </span>
      );
    case "declined":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
          ✕ Declined
        </span>
      );
    case "withdrawn":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
          Withdrawn
        </span>
      );
    default:
      return null;
  }
}

