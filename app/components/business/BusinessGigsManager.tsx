"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type BusinessPostedGig,
  type GigStatus,
  formatDeadlineIst,
  formatEventDateIst,
  formatGigBudgetInr,
  formatTime12h,
} from "@/lib/gigs/types";
import { useNowMs } from "@/lib/gigs/useNowMs";
import { setBusinessGigStatusAction } from "@/app/actions/businessGigs";
import GigApplicantsPanel from "./GigApplicantsPanel";

interface BusinessGigsManagerProps {
  gigs: BusinessPostedGig[];
  isLoading: boolean;
  loadError?: string | null;
  onRefresh: () => Promise<void>;
  onOpenCreateModal: () => void;
  onEditGig: (gig: BusinessPostedGig) => void;
  onStatusChanged?: (message: string) => void;
}

const STATUS_STYLES: Record<GigStatus, { label: string; cls: string }> = {
  open: {
    label: "Live / Open",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  closed: {
    label: "Closed",
    cls: "bg-gray-100 text-gray-700 border-gray-200",
  },
  withdrawn: {
    label: "Withdrawn",
    cls: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

export default function BusinessGigsManager({
  gigs,
  isLoading,
  loadError,
  onRefresh,
  onOpenCreateModal,
  onEditGig,
  onStatusChanged,
}: BusinessGigsManagerProps) {
  const [filter, setFilter] = useState<"all" | GigStatus>("all");
  const [expandedGigId, setExpandedGigId] = useState<string | null>(null);
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(null);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const nowMs = useNowMs();

  const isSuspended = gigs.some((g) => g.business_suspended);

  async function handleStatusChange(gigId: string, nextStatus: GigStatus) {
    setStatusLoadingId(gigId);
    setActionError(null);
    const res = await setBusinessGigStatusAction(gigId, nextStatus);
    setStatusLoadingId(null);
    setConfirmWithdrawId(null);

    if (!res.success) {
      setActionError(res.error || "Could not update gig status.");
      return;
    }

    if (onStatusChanged) {
      onStatusChanged(res.message || "Gig status updated.");
    }
    await onRefresh();
  }

  const filteredGigs =
    filter === "all" ? gigs : gigs.filter((gig) => gig.status === filter);

  const counts = {
    all: gigs.length,
    open: gigs.filter((g) => g.status === "open").length,
    closed: gigs.filter((g) => g.status === "closed").length,
    withdrawn: gigs.filter((g) => g.status === "withdrawn").length,
  };

  return (
    <div className="space-y-5">
      {isSuspended && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
          <strong className="block font-bold mb-0.5">Business Account Suspended</strong>
          Your business gigs are hidden from Artist discovery and new gig creation or edits are locked. Existing applications remain accessible for your records.
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center justify-between gap-2">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-500 hover:text-red-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter & Post CTA Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: `All Gigs (${counts.all})` },
              { id: "open", label: `Open (${counts.open})` },
              { id: "closed", label: `Closed (${counts.closed})` },
              { id: "withdrawn", label: `Withdrawn (${counts.withdrawn})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                filter === tab.id
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                  : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          disabled={isSuspended}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          + Post a New Gig
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-xs text-gray-500">
          Loading your posted gigs…
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-2xl border border-amber-200 p-6 text-xs text-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold text-amber-900">Unable to load posted gigs</p>
            <p className="text-amber-700 mt-0.5">{loadError}</p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold cursor-pointer self-start sm:self-center"
          >
            Retry
          </button>
        </div>
      ) : filteredGigs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-xl">
            🎤
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {gigs.length === 0
              ? "No gigs posted yet"
              : "No gigs under this filter"}
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {gigs.length === 0
              ? "Publish your venue's performance openings directly to verified and emerging Artists on The Artist Network. Gigs appear immediately in Opportunities → Business Gigs."
              : "Try switching status filters above or post a new gig opening."}
          </p>
          {!isSuspended && gigs.length === 0 && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              + Post Your First Gig
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGigs.map((gig) => {
            const st = STATUS_STYLES[gig.status];
            const isRemoved = gig.moderation_status === "removed";
            const isExpanded = expandedGigId === gig.id;
            const isWorking = statusLoadingId === gig.id;
            const deadlinePassed =
              nowMs > 0 && new Date(gig.application_deadline).getTime() <= nowMs;

            return (
              <div
                key={gig.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        {gig.artist_category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${st.cls}`}
                      >
                        {st.label}
                      </span>
                      {gig.business_verified ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          ✓ Verified Business
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          Unverified Business
                        </span>
                      )}
                      {isRemoved && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                          Removed by Moderation
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/dashboard/restaurant/gigs/${gig.id}`}
                      className="block text-base sm:text-lg font-extrabold text-gray-900 hover:text-purple-700 transition-colors"
                    >
                      {gig.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                      <span>
                        📅 <strong>{formatEventDateIst(gig.event_date)}</strong> ·{" "}
                        {formatTime12h(gig.event_start_time)}
                        {gig.event_end_time ? ` – ${formatTime12h(gig.event_end_time)}` : ""}
                      </span>
                      <span>
                        📍 {gig.venue_location}, {gig.city}
                      </span>
                      <span className="font-semibold text-gray-900">
                        💰 {formatGigBudgetInr(gig.compensation_type, gig.budget_min, gig.budget_max)}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500">
                      Applications close: <strong>{formatDeadlineIst(gig.application_deadline)}</strong>
                      {deadlinePassed && gig.status === "open" && (
                        <span className="ml-2 text-amber-700 font-semibold">
                          (Deadline passed — edit deadline or close gig)
                        </span>
                      )}
                    </p>

                    {isRemoved && gig.moderation_reason && (
                      <p className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700">
                        Moderation note: {gig.moderation_reason}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons & Counts */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-2.5 flex-shrink-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-3 py-1 rounded-xl bg-gray-100 text-gray-800 font-bold">
                        {gig.total_applicants}{" "}
                        {gig.total_applicants === 1 ? "Applicant" : "Applicants"}
                      </span>
                      {gig.shortlisted_count > 0 && (
                        <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          {gig.shortlisted_count} Shortlisted
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedGigId((prev) => (prev === gig.id ? null : gig.id))
                        }
                        className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        {isExpanded ? "Hide Applicants ▲" : "Review Applicants ▼"}
                      </button>

                      <Link
                        href={`/dashboard/restaurant/gigs/${gig.id}`}
                        className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                      >
                        Full View
                      </Link>

                      {!isRemoved && !isSuspended && gig.status !== "withdrawn" && (
                        <>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => onEditGig(gig)}
                            className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Edit
                          </button>

                          {gig.status === "open" ? (
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => handleStatusChange(gig.id, "closed")}
                              className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {isWorking ? "Saving…" : "Close Gig"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isWorking || deadlinePassed}
                              title={
                                deadlinePassed
                                  ? "Update deadline to a future time before reopening"
                                  : "Reopen gig to artists"
                              }
                              onClick={() => handleStatusChange(gig.id, "open")}
                              className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Reopen
                            </button>
                          )}

                          {confirmWithdrawId === gig.id ? (
                            <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-xl border border-red-200">
                              <span className="text-[11px] font-semibold text-red-700">
                                Withdraw permanently?
                              </span>
                              <button
                                type="button"
                                disabled={isWorking}
                                onClick={() => handleStatusChange(gig.id, "withdrawn")}
                                className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                disabled={isWorking}
                                onClick={() => setConfirmWithdrawId(null)}
                                className="px-2 py-1 rounded-lg bg-white text-gray-600 text-[11px] font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => setConfirmWithdrawId(gig.id)}
                              className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Withdraw
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-4 border-t border-gray-100">
                    <GigApplicantsPanel
                      gigId={gig.id}
                      gigTitle={gig.title}
                      isSuspended={gig.business_suspended}
                      isRemoved={isRemoved}
                      onReviewed={onRefresh}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
