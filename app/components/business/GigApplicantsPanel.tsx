"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type {
  BusinessGigApplicantItem,
  GigApplicationStatus,
} from "@/lib/gigs/types";
import {
  getBusinessGigApplicantsAction,
  reviewGigApplicationAction,
} from "@/app/actions/businessGigs";

interface GigApplicantsPanelProps {
  gigId: string;
  gigTitle: string;
  isSuspended?: boolean;
  isRemoved?: boolean;
  initialApplicants?: BusinessGigApplicantItem[];
  onReviewed?: () => Promise<void> | void;
}

const STATUS_BADGE: Record<GigApplicationStatus, { label: string; cls: string }> = {
  submitted: {
    label: "Submitted",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  shortlisted: {
    label: "Shortlisted",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-gray-100 text-gray-600 border-gray-200",
  },
  withdrawn: {
    label: "Withdrawn by Artist",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

export default function GigApplicantsPanel({
  gigId,
  gigTitle,
  isSuspended = false,
  isRemoved = false,
  initialApplicants,
  onReviewed,
}: GigApplicantsPanelProps) {
  const [applicants, setApplicants] = useState<BusinessGigApplicantItem[]>(
    initialApplicants || []
  );
  const [isLoading, setIsLoading] = useState(!initialApplicants);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | GigApplicationStatus>("all");
  const [feedbackByApp, setFeedbackByApp] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchApplicants = useCallback(async () => {
    const res = await getBusinessGigApplicantsAction(gigId);
    if (res.success && res.data) {
      setApplicants(res.data);
      setError(null);
    } else {
      setError(res.error || "Unable to load applicants.");
    }
    setIsLoading(false);
  }, [gigId]);

  const loadApplicants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await fetchApplicants();
  }, [fetchApplicants]);

  useEffect(() => {
    if (initialApplicants) return;
    let active = true;
    getBusinessGigApplicantsAction(gigId).then((res) => {
      if (!active) return;
      if (res.success && res.data) {
        setApplicants(res.data);
        setError(null);
      } else {
        setError(res.error || "Unable to load applicants.");
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [gigId, initialApplicants]);

  async function handleReview(
    applicationId: string,
    decision: "shortlisted" | "rejected"
  ) {
    setActingId(applicationId);
    setNotice(null);
    const feedbackText = feedbackByApp[applicationId]?.trim() || null;

    const res = await reviewGigApplicationAction({
      applicationId,
      decision,
      feedback: feedbackText,
    });

    setActingId(null);

    if (!res.success) {
      setNotice({
        type: "error",
        text: res.error || "Unable to update application status.",
      });
      return;
    }

    setNotice({
      type: "success",
      text: res.message || `Application marked as ${decision}.`,
    });
    await loadApplicants();
    if (onReviewed) await onReviewed();
  }

  const filtered =
    statusFilter === "all"
      ? applicants
      : applicants.filter((a) => a.status === statusFilter);

  const counts = {
    all: applicants.length,
    submitted: applicants.filter((a) => a.status === "submitted").length,
    shortlisted: applicants.filter((a) => a.status === "shortlisted").length,
    rejected: applicants.filter((a) => a.status === "rejected").length,
    withdrawn: applicants.filter((a) => a.status === "withdrawn").length,
  };

  const canReview = !isSuspended && !isRemoved;

  if (isLoading) {
    return (
      <div className="p-6 text-center text-xs text-gray-500">
        Loading artist applications for <span className="font-semibold">{gigTitle}</span>…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between gap-3">
        <span>{error}</span>
        <button
          type="button"
          onClick={loadApplicants}
          className="px-3 py-1.5 rounded-lg bg-white border border-red-200 font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
            notice.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {applicants.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: `All (${counts.all})` },
              { id: "submitted", label: `New (${counts.submitted})` },
              { id: "shortlisted", label: `Shortlisted (${counts.shortlisted})` },
              { id: "rejected", label: `Rejected (${counts.rejected})` },
              { id: "withdrawn", label: `Withdrawn (${counts.withdrawn})` },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                statusFilter === pill.id
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
        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 text-center">
          <p className="text-xs font-semibold text-gray-700 mb-1">
            {applicants.length === 0
              ? "No artist applications yet"
              : "No applications match this filter"}
          </p>
          <p className="text-[11px] text-gray-500">
            {applicants.length === 0
              ? "Registered Artists viewing Opportunities → Business Gigs can apply until your application deadline."
              : "Switch tabs above to inspect other applicant statuses."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const badge = STATUS_BADGE[app.status];
            const isWorking = actingId === app.application_id;
            const feedbackValue =
              feedbackByApp[app.application_id] ?? (app.business_feedback || "");

            return (
              <div
                key={app.application_id}
                className="bg-gray-50/70 rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {app.profile_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={app.profile_image_url}
                        alt={app.stage_name}
                        className="w-11 h-11 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                        {app.stage_name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {app.artist_slug ? (
                          <Link
                            href={`/artists/${app.artist_slug}`}
                            className="text-sm font-bold text-gray-900 hover:text-purple-700 underline-offset-2 hover:underline"
                          >
                            {app.stage_name}
                          </Link>
                        ) : (
                          <span className="text-sm font-bold text-gray-900">
                            {app.stage_name}
                          </span>
                        )}
                        {app.artist_verified && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                            ✓ Verified Artist
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {app.artist_category}
                        {app.artist_city ? ` · ${app.artist_city}` : ""}
                        {" · Applied "}
                        {new Date(app.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Asia/Kolkata",
                        })}
                      </p>
                    </div>
                  </div>

                  {app.proposed_fee !== null && (
                    <div className="text-left sm:text-right flex-shrink-0">
                      <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                        Proposed Fee
                      </span>
                      <span className="text-sm font-extrabold text-gray-900">
                        ₹{Number(app.proposed_fee).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-3 text-xs text-gray-700 whitespace-pre-line">
                  {app.pitch_message}
                </div>

                {app.status !== "withdrawn" && canReview ? (
                  <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
                    <div className="flex-1">
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Optional note to artist (max 500 chars)
                      </label>
                      <input
                        type="text"
                        maxLength={500}
                        value={feedbackValue}
                        onChange={(e) =>
                          setFeedbackByApp((prev) => ({
                            ...prev,
                            [app.application_id]: e.target.value,
                          }))
                        }
                        placeholder="e.g., Loved your live acoustic reel — let's schedule a call."
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isWorking || app.status === "shortlisted"}
                        onClick={() => handleReview(app.application_id, "shortlisted")}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {isWorking
                          ? "Updating…"
                          : app.status === "shortlisted"
                          ? "✓ Shortlisted"
                          : "Shortlist Artist"}
                      </button>
                      <button
                        type="button"
                        disabled={isWorking || app.status === "rejected"}
                        onClick={() => handleReview(app.application_id, "rejected")}
                        className="px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {app.status === "rejected" ? "Rejected" : "Reject"}
                      </button>
                    </div>
                  </div>
                ) : app.business_feedback ? (
                  <p className="text-[11px] text-gray-600 italic">
                    Note shared: &ldquo;{app.business_feedback}&rdquo;
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
