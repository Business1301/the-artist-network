"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type ArtistEligibilityState,
  type ArtistGigDetail,
  type GigApplicationStatus,
  formatDeadlineIst,
  formatEventDateIst,
  formatGigBudgetInr,
  formatTime12h,
} from "@/lib/gigs/types";
import { useNowMs } from "@/lib/gigs/useNowMs";
import {
  getArtistBusinessGigDetailAction,
  withdrawGigApplicationAction,
} from "@/app/actions/businessGigs";
import GigApplicationModal from "./GigApplicationModal";

interface ArtistGigDetailClientProps {
  initialGig: ArtistGigDetail;
  eligibility: ArtistEligibilityState | null;
}

const APP_STATUS_UI: Record<GigApplicationStatus, { label: string; cls: string }> = {
  submitted: {
    label: "Submitted · Under Business Review",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  shortlisted: {
    label: "Shortlisted by Business",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Not Selected",
    cls: "bg-gray-100 text-gray-600 border-gray-200",
  },
  withdrawn: {
    label: "Withdrawn",
    cls: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

export default function ArtistGigDetailClient({
  initialGig,
  eligibility,
}: ArtistGigDetailClientProps) {
  const [gig, setGig] = useState<ArtistGigDetail>(initialGig);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  async function refreshDetail() {
    const res = await getArtistBusinessGigDetailAction(gig.id);
    if (res.success && res.data) {
      setGig(res.data);
    }
  }

  async function handleWithdraw() {
    if (!gig.my_application_id) return;
    setIsWithdrawing(true);
    setBanner(null);
    const res = await withdrawGigApplicationAction(gig.my_application_id);
    setIsWithdrawing(false);
    setConfirmWithdraw(false);

    if (!res.success) {
      setBanner({
        type: "error",
        text: res.error || "Unable to withdraw application.",
      });
      return;
    }

    setBanner({
      type: "success",
      text: res.message || "Your application has been withdrawn.",
    });
    await refreshDetail();
  }

  const nowMs = useNowMs();
  const deadlinePassed =
    nowMs > 0 && new Date(gig.application_deadline).getTime() <= nowMs;
  const canApplyNow =
    !gig.my_application_id &&
    gig.status === "open" &&
    gig.business_active &&
    !deadlinePassed;
  const canWithdrawNow =
    Boolean(gig.my_application_id) &&
    (gig.my_application_status === "submitted" ||
      gig.my_application_status === "shortlisted");

  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link
            href="/opportunities/business-gigs"
            className="font-semibold text-purple-600 hover:text-purple-800"
          >
            ← Back to Business Gigs
          </Link>
          <Link
            href="/dashboard/artist"
            className="font-semibold text-gray-600 hover:text-gray-900"
          >
            Artist Dashboard →
          </Link>
        </div>

        {banner && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 ${
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

        <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {gig.artist_category}
              </span>
              {gig.business_verified && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  ✓ Verified Business
                </span>
              )}
              {gig.status !== "open" && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 capitalize">
                  Gig {gig.status}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {gig.title}
            </h1>

            <p className="text-xs sm:text-sm text-gray-600">
              Posted by <strong className="text-gray-900">{gig.business_name}</strong>
              {" · "}
              {gig.venue_location}, {gig.city}
            </p>
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
              <strong className="text-emerald-700">
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
              {deadlinePassed && (
                <span className="block text-[11px] text-amber-700 font-semibold mt-0.5">
                  Deadline passed
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                About This Opportunity
              </h2>
              <p className="whitespace-pre-line leading-relaxed">{gig.description}</p>
            </div>

            {gig.requirements && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Requirements &amp; Logistics
                </h2>
                <p className="whitespace-pre-line leading-relaxed">{gig.requirements}</p>
              </div>
            )}
          </div>

          {/* Application Status / CTA Footer */}
          <div className="pt-5 border-t border-gray-100">
            {gig.my_application_id && gig.my_application_status ? (
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800">
                      Your Application Status:
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        APP_STATUS_UI[gig.my_application_status].cls
                      }`}
                    >
                      {APP_STATUS_UI[gig.my_application_status].label}
                    </span>
                  </div>
                  {canWithdrawNow && (
                    confirmWithdraw ? (
                      <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                        <span className="text-[11px] font-semibold text-amber-900">
                          Withdraw permanently?
                        </span>
                        <button
                          type="button"
                          disabled={isWithdrawing}
                          onClick={handleWithdraw}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          {isWithdrawing ? "Saving…" : "Confirm"}
                        </button>
                        <button
                          type="button"
                          disabled={isWithdrawing}
                          onClick={() => setConfirmWithdraw(false)}
                          className="px-2 py-1 rounded-lg bg-white text-gray-600 text-[11px] font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmWithdraw(true)}
                        className="px-3.5 py-1.5 rounded-xl border border-amber-200 bg-white text-amber-800 hover:bg-amber-50 text-xs font-semibold cursor-pointer"
                      >
                        Withdraw Application
                      </button>
                    )
                  )}
                </div>

                {gig.my_pitch_message && (
                  <div className="text-xs text-gray-700 bg-white rounded-xl border border-gray-200 p-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Submitted Pitch
                      {gig.my_proposed_fee !== null &&
                        ` · Quoted Fee: ₹${Number(gig.my_proposed_fee).toLocaleString("en-IN")}`}
                    </span>
                    <p className="whitespace-pre-line">{gig.my_pitch_message}</p>
                  </div>
                )}

                {gig.my_business_feedback && (
                  <div className="text-xs text-purple-900 bg-purple-50 rounded-xl border border-purple-200 p-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-0.5">
                      Business Feedback
                    </span>
                    <p>{gig.my_business_feedback}</p>
                  </div>
                )}
              </div>
            ) : canApplyNow ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-800">
                    Interested in performing for {gig.business_name}?
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {eligibility && !eligibility.canApply
                      ? "Publish your Artist Profile to unlock applications."
                      : "Your published Artist Profile and portfolio are shared automatically with your pitch."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(true)}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Apply Now →
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gray-100 border border-gray-200 text-xs text-gray-600">
                This business gig is currently closed to new applications.
              </div>
            )}
          </div>
        </section>
      </div>

      {showApplyModal && (
        <GigApplicationModal
          key={gig.id}
          gig={gig}
          eligibility={eligibility}
          onClose={() => setShowApplyModal(false)}
          onSuccess={async (_gid, _appId, message) => {
            setShowApplyModal(false);
            setBanner({ type: "success", text: message });
            await refreshDetail();
          }}
        />
      )}
    </main>
  );
}
