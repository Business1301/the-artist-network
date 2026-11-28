"use client";

import { useState } from "react";
import Link from "next/link";
import type { ArtistEligibilityState, ArtistVisibleGig } from "@/lib/gigs/types";
import ArtistBusinessGigsBoard from "./gigs/ArtistBusinessGigsBoard";

// ⚠️ SAMPLE DEMONSTRATION DATA ONLY per PROJECT_PLAN.md §5.7 & §13
const sampleOpportunities = [
  {
    id: 1,
    title: "Bollywood & Semi-Classical Playback Vocal Audition",
    type: "Auditions",
    organizer: "Sangeet Dhwani Records & Production",
    category: "Singers & Vocalists",
    location: "Mumbai, MH (In-Person)",
    compensation: "₹30,000 – ₹60,000 per recorded track",
    deadline: "Nov 30, 2026",
    dates: "Dec 10–12, 2026",
    eligibility: "Open to solo female and male vocalists with classical training or previous studio demo recordings.",
    description: "Seeking fresh, emotive voices for an upcoming independent Hindi soundtrack and web series album. Shortlisted singers will be invited to record a scratch track at our Andheri studio.",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: 2,
    title: "Tech-Park Atrium Wall Mural Commission",
    type: "Commissions",
    organizer: "UrbanSpaces Commercial Infrastructure",
    category: "Mural Artists",
    location: "Bangalore, KA (On-Site)",
    compensation: "₹1,50,000 – ₹2,20,000 (all materials covered)",
    deadline: "Dec 15, 2026",
    dates: "Jan 10–25, 2027",
    eligibility: "Artists or muralist duos with verified large-scale interior wall portfolio experience.",
    description: "Commissioning a 35 ft x 14 ft vibrant indoor mural reflecting themes of nature, technology, and Bengaluru's garden heritage for a newly renovated tech-campus lobby in Whitefield.",
    badgeColor: "bg-yellow-50 text-yellow-800 border-yellow-200",
  },
  {
    id: 3,
    title: "Weekend Acoustic & Jazz Residency (3 Months)",
    type: "Residencies",
    organizer: "The Tamarind Courtyard Hotel & Bistro",
    category: "Musicians & Solo Instrumentalists",
    location: "Anjuna, Goa (On-Site)",
    compensation: "₹18,000 per weekend + hospitality",
    deadline: "Dec 05, 2026",
    dates: "Starts Jan 2027",
    eligibility: "Solo acoustic guitarists, saxophonists, or keyboardists capable of 2 x 45-min sets per evening.",
    description: "A prestigious 3-month weekend performance residency at our boutique heritage courtyard. Selected musician will perform serene ambient jazz and soul sets every Friday and Saturday night.",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: 4,
    title: "National Contemporary Dance Ensemble Open Call",
    type: "Auditions",
    organizer: "Pravah Dance Company & Cultural Trust",
    category: "Dancers & Choreographers",
    location: "Delhi NCR (Studio Audition)",
    compensation: "₹45,000 per month during production & touring",
    deadline: "Nov 25, 2026",
    dates: "Dec 02–04, 2026",
    eligibility: "Dancers aged 18+ with strong contemporary, ballet, or classical Indian dance fundamentals.",
    description: "Auditioning 6 company dancers for an upcoming multi-city performing arts tour. Production explores human connection and folklore through modern experimental movement.",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-200",
  },
  {
    id: 5,
    title: "Annual Rising Comedian Talent Showcase",
    type: "Competitions",
    organizer: "LaughHouse Comedy Network India",
    category: "Stand-up Comedians",
    location: "Pune, MH (Live Stage)",
    compensation: "₹75,000 Cash Prize Pool + Opening Tour Slots",
    deadline: "Dec 10, 2026",
    dates: "Dec 20, 2026",
    eligibility: "Comedians with at least 5 minutes of original, clean/semi-clean stage material in Hindi or English.",
    description: "A juried competition celebrating emerging comedy voices. Finalists perform in front of industry judges, talent scouts, and live comedy club audiences.",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: 6,
    title: "Heritage Fort Wedding Live Portrait Residency",
    type: "Commissions",
    organizer: "Royal Rajasthan Events & Weddings",
    category: "Sketch & Fine Artists",
    location: "Jaipur, RJ (On-Site)",
    compensation: "₹40,000 for 2-day wedding celebration",
    deadline: "Dec 01, 2026",
    dates: "Dec 18–19, 2026",
    eligibility: "Fast charcoal sketchers or watercolorists with experience in live guest portraiture.",
    description: "Seeking a talented live sketch artist to illustrate mini guest portraits and live ceremony scenes on textured parchment during a 2-day royal destination wedding.",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
];

const opportunityTypes = [
  "All Opportunities",
  "Auditions",
  "Commissions",
  "Residencies",
  "Competitions",
];

interface OpportunitiesClientProps {
  initialTab?: "curated" | "business-gigs";
  viewerState?: "unauthenticated" | "non_artist" | "artist";
  viewerRoleLabel?: string;
  initialBusinessGigs?: ArtistVisibleGig[];
  initialEligibility?: ArtistEligibilityState | null;
  initialGigsError?: string | null;
}

export default function OpportunitiesClient({
  initialTab = "curated",
  viewerState = "unauthenticated",
  viewerRoleLabel,
  initialBusinessGigs = [],
  initialEligibility = null,
  initialGigsError = null,
}: OpportunitiesClientProps) {
  const [sectionTab, setSectionTab] = useState<"curated" | "business-gigs">(initialTab);
  const [selectedType, setSelectedType] = useState("All Opportunities");

  const filteredList = sampleOpportunities.filter(
    (item) => selectedType === "All Opportunities" || item.type === selectedType
  );

  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="inline-block text-purple-600 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-2">
            Opportunities &amp; Live Gigs
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Creative Opportunities Board
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Discover casting calls and explore live private gig openings posted directly by hospitality venues and businesses for registered Artists.
          </p>
        </div>

        {/* Primary Section Switcher: Curated vs Private Business Gigs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button
            type="button"
            onClick={() => setSectionTab("curated")}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
              sectionTab === "curated"
                ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
            }`}
          >
            Auditions &amp; Commissions (Preview)
          </button>
          <button
            type="button"
            onClick={() => setSectionTab("business-gigs")}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer flex items-center gap-2 ${
              sectionTab === "business-gigs"
                ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200"
                : "bg-white text-purple-700 border-purple-200 hover:bg-purple-50"
            }`}
          >
            <span>🔒 Business Gigs</span>
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                sectionTab === "business-gigs"
                  ? "bg-white/20 text-white"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              Artist Only
            </span>
          </button>
          <Link
            href="/opportunities/business-gigs"
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 underline underline-offset-2 px-2 py-1"
          >
            Open Full Business Gigs Page →
          </Link>
        </div>

        {sectionTab === "business-gigs" ? (
          <ArtistBusinessGigsBoard
            viewerState={viewerState}
            viewerRoleLabel={viewerRoleLabel}
            initialGigs={initialBusinessGigs}
            initialEligibility={initialEligibility}
            initialLoadError={initialGigsError}
            loginRedirectPath="/opportunities?tab=business-gigs"
          />
        ) : (
          <>
            {/* Feature stage notice */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold px-4 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" aria-hidden="true" />
                Curated Auditions Preview — Switch to Business Gigs above for live venue postings
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {opportunityTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    selectedType === type
                      ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Opportunities Listing Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
              {filteredList.map((opp) => (
                <article
                  key={opp.id}
                  className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-7 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all flex flex-col"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${opp.badgeColor}`}>
                      {opp.type}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Deadline: <strong className="text-gray-700">{opp.deadline}</strong>
                    </div>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug mb-2">
                    {opp.title}
                  </h2>

                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <p>
                      Organized by: <strong className="text-gray-800">{opp.organizer}</strong>
                    </p>
                    <p className="flex items-center gap-1.5 text-purple-600 font-medium">
                      <span>Target: {opp.category}</span>
                      <span>•</span>
                      <span>{opp.location}</span>
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4 flex-1">
                    {opp.description}
                  </p>

                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 mb-5 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-gray-500 font-medium">Compensation:</span>
                      <span className="font-bold text-emerald-700 text-right">{opp.compensation}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 border-t border-gray-100 pt-1.5">
                      <span className="text-gray-500 font-medium">Dates:</span>
                      <span className="font-semibold text-gray-800 text-right">{opp.dates}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 border-t border-gray-100 pt-1.5">
                      <span className="text-gray-500 font-medium">Eligibility:</span>
                      <span className="text-gray-700 text-right max-w-xs">{opp.eligibility}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-auto">
                    <button
                      type="button"
                      onClick={() => setSectionTab("business-gigs")}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition-colors text-center cursor-pointer"
                    >
                      Explore Live Business Gigs →
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Organizer Callout Box */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 rounded-2xl p-8 sm:p-10 text-white text-center">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                Are you a restaurant, lounge, hotel or event venue?
              </h3>
              <p className="text-purple-200 text-sm max-w-xl mx-auto mb-6">
                Post live paid gigs directly from your Business Dashboard so registered Artists across India can apply with their portfolios and stage rates.
              </p>
              <Link
                href="/dashboard/restaurant"
                className="inline-block px-6 py-3 bg-white text-purple-900 font-bold text-xs sm:text-sm rounded-full shadow-md hover:bg-purple-50 transition-colors"
              >
                Post a Business Gig →
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
