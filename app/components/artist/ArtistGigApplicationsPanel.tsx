"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  type ArtistGigApplicationItem,
  type GigApplicationStatus,
  formatDeadlineIst,
  formatEventDateIst,
  formatGigBudgetInr,
  formatTime12h,
} from "@/lib/gigs/types";
import {
  getArtistGigApplicationsAction,
  withdrawGigApplicationAction,
} from "@/app/actions/businessGigs";

interface ArtistGigApplicationsPanelProps {
  initialApplications: ArtistGigApplicationItem[];
  onCountChange?: (apps: ArtistGigApplicationItem[]) => void;
}

const APP_STATUS_UI: Record<GigApplicationStatus, { label: string; cls: string }> = {
  submitted: {
    label: "Submitted",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  shortlisted: {
    label: "Shortlisted",
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

export default function ArtistGigApplicationsPanel({
  initialApplications,
  onCountChange,
}: ArtistGigApplicationsPanelProps) {
  const [applications, setApplications] =
    useState<ArtistGigApplicationItem[]>(initialApplications);
  const [filter, setFilter] = useState<"all" | GigApplicationStatus>("all");
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const reloadApplications = useCallback(async () => {
    const res = await getArtistGigApplicationsAction();
    if (res.success && res.data) {
      setApplications(res.data);
      onCountChange?.(res.data);
    }
  }, [onCountChange]);

  async function handleWithdraw(applicationId: string) {
    setWithdrawingId(applicationId);
    setBanner(null);
    const res = await withdrawGigApplicationAction(applicationId);
    setWithdrawingId(null);
    setConfirmWithdrawId(null);

    if (!res.success) {
      setBanner({
        type: "error",
        text: res.error || "Unable to withdraw application.",
      });
      return;
    }

    setBanner({
      type: "success",
      text: res.message || "Application withdrawn.",
    });
    await reloadApplications();
  }

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.application_status === filter);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-gray-900">
            My Gig Applications ({applications.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Track live gig pitches submitted to restaurants and hospitality venues.
          </p>
        </div>
        <Link
          href="/opportunities/business-gigs"
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-center"
        >
          Browse Business Gigs →
        </Link>
      </div>

      {banner && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
            banner.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <span>{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {applications.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: `All (${applications.length})` },
              {
                id: "submitted",
                label: `Submitted (${applications.filter((a) => a.application_status === "submitted").length})`,
              },
              {
                id: "shortlisted",
                label: `Shortlisted (${applications.filter((a) => a.application_status === "shortlisted").length})`,
              },
              {
                id: "rejected",
                label: `Not Selected (${applications.filter((a) => a.application_status === "rejected").length})`,
              },
              {
                id: "withdrawn",
                label: `Withdrawn (${applications.filter((a) => a.application_status === "withdrawn").length})`,
              },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilter(pill.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                filter === pill.id
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-3 shadow-xs">
          <div className="text-3xl">🎤</div>
          <h4 className="text-base font-bold text-gray-900">
            {applications.length === 0
              ? "You haven't applied to any business gigs yet"
              : "No applications under this filter"}
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Browse private venue openings posted by hospitality businesses and pitch directly with your stage profile.
          </p>
          <Link
            href="/opportunities/business-gigs"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs"
          >
            Explore Live Business Gigs →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const st = APP_STATUS_UI[app.application_status];
            const isWorking = withdrawingId === app.application_id;
            const canWithdraw =
              app.application_status === "submitted" ||
              app.application_status === "shortlisted";

            return (
              <div
                key={app.application_id}
                className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        {app.artist_category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${st.cls}`}
                      >
                        {st.label}
                      </span>
                      {app.business_verified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          ✓ Verified Business
                        </span>
                      )}
                      {app.gig_status !== "open" && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          Gig {app.gig_status}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/opportunities/business-gigs/${app.gig_id}`}
                      className="block text-base sm:text-lg font-extrabold text-gray-900 hover:text-purple-700 transition-colors"
                    >
                      {app.gig_title}
                    </Link>

                    <p className="text-xs text-gray-600">
                      <strong>{app.business_name}</strong> · {app.venue_location}, {app.city}
                    </p>
                    <p className="text-xs text-gray-500">
                      📅 {formatEventDateIst(app.event_date)} · {formatTime12h(app.event_start_time)}
                      {" · "}
                      Budget: {formatGigBudgetInr(app.compensation_type, app.budget_min, app.budget_max)}
                      {app.proposed_fee !== null && (
                        <>
                          {" · "}
                          <strong className="text-gray-800">
                            Your quote: ₹{Number(app.proposed_fee).toLocaleString("en-IN")}
                          </strong>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/opportunities/business-gigs/${app.gig_id}`}
                      className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold"
                    >
                      View Gig
                    </Link>
                    {canWithdraw && (
                      confirmWithdrawId === app.application_id ? (
                        <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                          <span className="text-[11px] font-semibold text-amber-900">
                            Withdraw?
                          </span>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleWithdraw(app.application_id)}
                            className="px-2 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-bold cursor-pointer"
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
                          onClick={() => setConfirmWithdrawId(app.application_id)}
                          className="px-3.5 py-2 rounded-xl border border-amber-200 text-amber-800 hover:bg-amber-50 text-xs font-semibold cursor-pointer"
                        >
                          Withdraw Application
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs text-gray-700">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Your Pitch
                  </span>
                  <p className="whitespace-pre-line">{app.pitch_message}</p>
                </div>

                {app.business_feedback && (
                  <div className="bg-purple-50/70 rounded-xl p-3 border border-purple-200 text-xs text-purple-900">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-0.5">
                      Business Feedback
                    </span>
                    <p>{app.business_feedback}</p>
                  </div>
                )}

                <p className="text-[11px] text-gray-400">
                  Applied {formatDeadlineIst(app.applied_at)} · Deadline was{" "}
                  {formatDeadlineIst(app.application_deadline)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
