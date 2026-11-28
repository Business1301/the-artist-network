"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type {
  BusinessGigApplicantItem,
  BusinessPostedGig,
  GigStatus,
} from "@/lib/gigs/types";
import {
  formatDeadlineIst,
  formatEventDateIst,
  formatGigBudgetInr,
  formatTime12h,
} from "@/lib/gigs/types";
import { useNowMs } from "@/lib/gigs/useNowMs";
import {
  getBusinessPostedGigsAction,
  setBusinessGigStatusAction,
} from "@/app/actions/businessGigs";
import GigFormModal from "./GigFormModal";
import GigApplicantsPanel from "./GigApplicantsPanel";

interface BusinessGigDetailClientProps {
  initialGig: BusinessPostedGig;
  initialApplicants: BusinessGigApplicantItem[];
}

export default function BusinessGigDetailClient({
  initialGig,
  initialApplicants,
}: BusinessGigDetailClientProps) {
  const [gig, setGig] = useState<BusinessPostedGig>(initialGig);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const refreshGig = useCallback(async () => {
    const res = await getBusinessPostedGigsAction();
    if (res.success && res.data) {
      const updated = res.data.find((g) => g.id === gig.id);
      if (updated) setGig(updated);
    }
  }, [gig.id]);

  async function handleStatusChange(nextStatus: GigStatus) {
    setIsUpdatingStatus(true);
    setBanner(null);
    const res = await setBusinessGigStatusAction(gig.id, nextStatus);
    setIsUpdatingStatus(false);
    setConfirmWithdraw(false);

    if (!res.success) {
      setBanner({
        type: "error",
        text: res.error || "Unable to update gig status.",
      });
      return;
    }

    setBanner({
      type: "success",
      text: res.message || "Gig status updated.",
    });
    await refreshGig();
  }

  const nowMs = useNowMs();
  const isRemoved = gig.moderation_status === "removed";
  const deadlinePassed =
    nowMs > 0 && new Date(gig.application_deadline).getTime() <= nowMs;

  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link
            href="/dashboard/restaurant"
            className="inline-flex items-center gap-1.5 font-semibold text-gray-600 hover:text-purple-700 transition-colors"
          >
            ← Back to Business Dashboard
          </Link>
          <span className="text-gray-400">
            Gig ID: <span className="font-mono">{gig.id.slice(0, 8)}</span>
          </span>
        </div>

        {gig.business_suspended && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
            <strong className="font-bold block mb-0.5">Account Suspended</strong>
            Editing and application review are disabled while your business account is suspended.
          </div>
        )}

        {banner && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
              banner.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            <span>{banner.text}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="opacity-80 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Gig Overview Card */}
        <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {gig.artist_category}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    gig.status === "open"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : gig.status === "closed"
                      ? "bg-gray-100 text-gray-700 border-gray-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {gig.status === "open"
                    ? "Live / Open"
                    : gig.status === "closed"
                    ? "Closed"
                    : "Withdrawn"}
                </span>
                {gig.business_verified ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    ✓ Verified Business
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    Unverified Business
                  </span>
                )}
                {isRemoved && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                    Removed by Moderation
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {gig.title}
              </h1>
              <p className="text-xs text-gray-500">
                Posted under <strong>{gig.business_name}</strong> ·{" "}
                {gig.venue_location}, {gig.city}
              </p>
            </div>

            {!isRemoved && !gig.business_suspended && gig.status !== "withdrawn" && (
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Edit Gig
                </button>
                {gig.status === "open" ? (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange("closed")}
                    className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Close Applications
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdatingStatus || deadlinePassed}
                    onClick={() => handleStatusChange("open")}
                    title={
                      deadlinePassed
                        ? "Edit deadline to a future time before reopening"
                        : "Reopen gig"
                    }
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reopen Gig
                  </button>
                )}
                {confirmWithdraw ? (
                  <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
                    <span className="text-[11px] font-semibold text-red-700">
                      Confirm permanent withdraw?
                    </span>
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange("withdrawn")}
                      className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Yes, Withdraw
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => setConfirmWithdraw(false)}
                      className="px-2 py-1 rounded-lg bg-white text-gray-600 text-[11px] font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => setConfirmWithdraw(true)}
                    className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Withdraw Gig
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                Event Schedule
              </span>
              <strong className="text-gray-900">
                {formatEventDateIst(gig.event_date)}
              </strong>
              <p className="text-gray-600 mt-0.5">
                {formatTime12h(gig.event_start_time)}
                {gig.event_end_time ? ` – ${formatTime12h(gig.event_end_time)}` : ""} IST
              </p>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                Compensation Budget
              </span>
              <strong className="text-gray-900">
                {formatGigBudgetInr(gig.compensation_type, gig.budget_min, gig.budget_max)}
              </strong>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                Application Deadline
              </span>
              <strong className="text-gray-900">
                {formatDeadlineIst(gig.application_deadline)}
              </strong>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Gig Description
              </h2>
              <p className="whitespace-pre-line leading-relaxed">{gig.description}</p>
            </div>
            {gig.requirements && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Requirements & Logistics
                </h2>
                <p className="whitespace-pre-line leading-relaxed">{gig.requirements}</p>
              </div>
            )}
          </div>
        </section>

        {/* Applicants Section */}
        <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                Artist Applications ({gig.total_applicants})
              </h2>
              <p className="text-xs text-gray-500">
                Shortlist or decline candidates directly. Shortlisted count: {gig.shortlisted_count}.
              </p>
            </div>
          </div>

          <GigApplicantsPanel
            gigId={gig.id}
            gigTitle={gig.title}
            isSuspended={gig.business_suspended}
            isRemoved={isRemoved}
            initialApplicants={initialApplicants}
            onReviewed={refreshGig}
          />
        </section>
      </div>

      {showEditModal && (
        <GigFormModal
          key={gig.id}
          isOpen={showEditModal}
          editingGig={gig}
          onClose={() => setShowEditModal(false)}
          onSuccess={async (_id, _mode, message) => {
            setShowEditModal(false);
            setBanner({ type: "success", text: message });
            await refreshGig();
          }}
        />
      )}
    </main>
  );
}
