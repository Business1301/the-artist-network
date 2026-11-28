"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GIG_ARTIST_CATEGORIES,
  type ArtistEligibilityState,
  type ArtistVisibleGig,
  type GigApplicationStatus,
  formatDeadlineIst,
  formatEventDateIst,
  formatGigBudgetInr,
  formatTime12h,
} from "@/lib/gigs/types";
import { getArtistBusinessGigsAction } from "@/app/actions/businessGigs";
import GigApplicationModal from "./GigApplicationModal";

interface ArtistBusinessGigsBoardProps {
  viewerState: "unauthenticated" | "non_artist" | "artist";
  viewerRoleLabel?: string;
  initialGigs?: ArtistVisibleGig[];
  initialEligibility?: ArtistEligibilityState | null;
  initialLoadError?: string | null;
  loginRedirectPath?: string;
}

const APP_BADGE: Record<GigApplicationStatus, { label: string; cls: string }> = {
  submitted: {
    label: "Applied · Submitted",
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
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

export default function ArtistBusinessGigsBoard({
  viewerState,
  viewerRoleLabel,
  initialGigs = [],
  initialEligibility = null,
  initialLoadError = null,
  loginRedirectPath = "/opportunities/business-gigs",
}: ArtistBusinessGigsBoardProps) {
  const [gigs, setGigs] = useState<ArtistVisibleGig[]>(initialGigs);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(initialLoadError);
  const [notice, setNotice] = useState<string | null>(null);
  const [applyingGig, setApplyingGig] = useState<ArtistVisibleGig | null>(null);

  // Filter controls
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  if (viewerState === "unauthenticated") {
    return (
      <section className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 text-center shadow-sm space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-2xl">
          🔒
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Please log in as an Artist to see business gigs.
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Private hospitality and venue performance opportunities posted by businesses are exclusively accessible to authenticated Artist accounts.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={`/login?redirectTo=${encodeURIComponent(loginRedirectPath)}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors"
          >
            Log in as Artist
          </Link>
          <Link
            href="/signup?role=artist"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs sm:text-sm font-semibold transition-colors"
          >
            Sign up as an Artist
          </Link>
        </div>
      </section>
    );
  }

  if (viewerState === "non_artist") {
    return (
      <section className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 text-center shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
          🛡️
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
          Artist-Only Directory
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
          Business Gigs are private to registered Artist accounts. You are currently logged in with{" "}
          <strong>
            {viewerRoleLabel === "business"
              ? "a Business account"
              : viewerRoleLabel === "admin"
              ? "an Admin account"
              : "a non-Artist account"}
          </strong>
          .
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {viewerRoleLabel === "business" ? (
            <Link
              href="/dashboard/restaurant"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
            >
              Manage Your Venue Gigs →
            </Link>
          ) : (
            <Link
              href="/artists"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
            >
              Browse Public Artists
            </Link>
          )}
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold"
          >
            Return Home
          </Link>
        </div>
      </section>
    );
  }

  async function applyFilters(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsLoading(true);
    setLoadError(null);
    const res = await getArtistBusinessGigsAction({
      query: query.trim() || undefined,
      category: category || undefined,
      city: city.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minBudget: minBudget.trim() ? Number(minBudget) : null,
      maxBudget: maxBudget.trim() ? Number(maxBudget) : null,
    });
    setIsLoading(false);
    if (res.success && res.data) {
      setGigs(res.data);
    } else {
      setLoadError(res.error || "Unable to fetch business gigs.");
    }
  }

  async function clearFilters() {
    setQuery("");
    setCategory("");
    setCity("");
    setDateFrom("");
    setDateTo("");
    setMinBudget("");
    setMaxBudget("");
    setIsLoading(true);
    setLoadError(null);
    const res = await getArtistBusinessGigsAction({});
    setIsLoading(false);
    if (res.success && res.data) {
      setGigs(res.data);
    } else {
      setLoadError(res.error || "Unable to refresh business gigs.");
    }
  }

  function handleApplicationCreated(
    gigId: string,
    applicationId: string,
    message: string
  ) {
    setApplyingGig(null);
    setNotice(message);
    setGigs((prev) =>
      prev.map((g) =>
        g.id === gigId
          ? {
              ...g,
              my_application_id: applicationId,
              my_application_status: "submitted",
            }
          : g
      )
    );
  }

  return (
    <div className="space-y-6">
      {/* Artist Eligibility Callout (Draft / Unpublished profile) */}
      {initialEligibility && !initialEligibility.canApply && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-amber-900">
              Publish Your Artist Profile to Submit Applications
            </p>
            <p className="text-amber-800 mt-0.5">
              {initialEligibility.message}
            </p>
          </div>
          {initialEligibility.profileStatus !== "suspended" && (
            <Link
              href="/dashboard/artist/edit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap self-start sm:self-center"
            >
              Complete Profile →
            </Link>
          )}
        </div>
      )}

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-sm flex items-center justify-between gap-3">
          <span>✓ {notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Panel */}
      <form
        onSubmit={applyFilters}
        className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-3 text-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Search</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, venue, style..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            >
              <option value="">All Categories</option>
              {GIG_ARTIST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-gray-600 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Bengaluru, Mumbai"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Min Budget (₹)</label>
            <input
              type="number"
              min={0}
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              placeholder="e.g., 10000"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block font-semibold text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Max Budget (₹)</label>
            <input
              type="number"
              min={0}
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="Optional upper bound"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors cursor-pointer"
            >
              {isLoading ? "Searching…" : "Apply Filters"}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              disabled={isLoading}
              className="py-2.5 px-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      {/* Header count + Dashboard shortcut */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span>
          Showing <strong className="text-gray-900">{gigs.length}</strong> live{" "}
          {gigs.length === 1 ? "gig" : "gigs"}
        </span>
        <Link
          href="/dashboard/artist"
          className="font-bold text-purple-600 hover:text-purple-800"
        >
          View My Applications in Artist Dashboard →
        </Link>
      </div>

      {/* Results */}
      {loadError ? (
        <div className="bg-white rounded-2xl border border-amber-200 p-6 text-xs text-amber-800 flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => applyFilters()}
            className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : gigs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center space-y-2 shadow-xs">
          <div className="text-3xl mb-1">🎶</div>
          <h3 className="text-base font-bold text-gray-900">
            No live business gigs match your criteria right now
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Try broadening your city, date range, or category filters — or check back shortly as venues publish new slots directly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {gigs.map((gig) => {
            const appBadge = gig.my_application_status
              ? APP_BADGE[gig.my_application_status]
              : null;
            const hasExistingApplication = Boolean(gig.my_application_id);

            return (
              <article
                key={gig.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-md hover:border-purple-200 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {gig.artist_category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {gig.business_verified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          ✓ Verified Business
                        </span>
                      )}
                      {appBadge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${appBadge.cls}`}
                        >
                          {appBadge.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Link
                      href={`/opportunities/business-gigs/${gig.id}`}
                      className="text-lg font-extrabold text-gray-900 hover:text-purple-700 transition-colors leading-snug block"
                    >
                      {gig.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      Hosted by <strong className="text-gray-800">{gig.business_name}</strong>
                      {" · "}
                      {gig.venue_location}, {gig.city}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {gig.description}
                  </p>

                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500">Event Date &amp; Time</span>
                      <span className="font-semibold text-gray-900">
                        {formatEventDateIst(gig.event_date)} · {formatTime12h(gig.event_start_time)}
                        {gig.event_end_time ? ` – ${formatTime12h(gig.event_end_time)}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-1.5">
                      <span className="text-gray-500">Compensation</span>
                      <span className="font-bold text-emerald-700">
                        {formatGigBudgetInr(gig.compensation_type, gig.budget_min, gig.budget_max)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-1.5">
                      <span className="text-gray-500">Apply Before</span>
                      <span className="font-medium text-gray-800">
                        {formatDeadlineIst(gig.application_deadline)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  {hasExistingApplication ? (
                    <Link
                      href={`/opportunities/business-gigs/${gig.id}`}
                      className={`flex-1 text-center py-2.5 px-4 rounded-xl border font-bold text-xs transition-colors ${
                        gig.my_application_status === "withdrawn"
                          ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {gig.my_application_status === "withdrawn"
                        ? "Application Withdrawn · Details →"
                        : "View Application Status →"}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setApplyingGig(gig)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Apply Now
                    </button>
                  )}
                  <Link
                    href={`/opportunities/business-gigs/${gig.id}`}
                    className="py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {applyingGig && (
        <GigApplicationModal
          key={applyingGig.id}
          gig={applyingGig}
          eligibility={initialEligibility}
          onClose={() => setApplyingGig(null)}
          onSuccess={handleApplicationCreated}
        />
      )}
    </div>
  );
}
