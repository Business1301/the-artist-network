"use client";

import { useState } from "react";
import Link from "next/link";

export default function DashboardShowcase() {
  const [activePortal, setActivePortal] = useState<"artist" | "venue">("artist");

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
            <span>✨</span> Implemented Platform Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Designed for Artists &amp; Venues
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Switch between the two workspaces below to see the actual features built into The Artist Network.
          </p>

          {/* Tab Switcher */}
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-gray-200 shadow-sm mt-6">
            <button
              onClick={() => setActivePortal("artist")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activePortal === "artist"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>🎨</span> Artist Workspace
            </button>
            <button
              onClick={() => setActivePortal("venue")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activePortal === "venue"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>🏢</span> Venue &amp; Client Workspace
            </button>
          </div>
        </div>

        {/* Portal 1: Artist Workspace */}
        {activePortal === "artist" && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden max-w-5xl mx-auto animate-fadeIn">
            {/* Window bar */}
            <div className="bg-gray-900 text-gray-300 px-6 py-3 flex items-center justify-between text-xs border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                <span className="ml-2 font-mono text-gray-400">theartistnetwork.in/dashboard/artist</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800">
                Artist Dashboard
              </span>
            </div>

            <div className="p-6 sm:p-8">
              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="text-xl mb-1">🖼️</div>
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                    Showcase &amp; Portfolio
                  </h4>
                  <p className="text-xs text-purple-700 leading-relaxed">
                    Custom stage name, bio, genres, starting rates, YouTube performance embeds, and photo galleries.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="text-xl mb-1">📅</div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                    Private Gig Calendar
                  </h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Schedule personal gigs and block dates with overlap detection and private client &amp; fee records.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-xl mb-1">🔗</div>
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                    Social Connectivity
                  </h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Connect official Instagram and YouTube channels directly to your public discovery profile.
                  </p>
                </div>
              </div>

              {/* Sample Profile Status Card */}
              <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider">
                    Live Artist Features
                  </span>
                  <span className="text-xs font-bold text-gray-500">Self-Publishing + Administrative Review</span>
                </div>
                <h4 className="text-base font-bold text-gray-900">
                  Multi-Step Profile Editor with Technical Rider
                </h4>
                <p className="text-xs text-gray-600 mt-1 mb-3 leading-relaxed">
                  Artists customize their sound specifications, PA requirements, performance formats, and travel terms to set clear expectations before accepting engagements.
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-lg bg-white border border-gray-200 font-semibold text-gray-700">
                    ✓ Stage &amp; Sound Specs
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white border border-gray-200 font-semibold text-gray-700">
                    ✓ Asia/Kolkata Timezone Calendar
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white border border-gray-200 font-semibold text-gray-700">
                    ✓ Atomic Conflict Safeguards
                  </span>
                </div>
              </div>

              {/* Action Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center sm:text-left">
                  Sign up as an artist to create your showcase and manage your availability.
                </p>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all text-center"
                >
                  Join as an Artist →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Portal 2: Venue & Client Workspace */}
        {activePortal === "venue" && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden max-w-5xl mx-auto animate-fadeIn">
            {/* Window bar */}
            <div className="bg-gray-900 text-gray-300 px-6 py-3 flex items-center justify-between text-xs border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                <span className="ml-2 font-mono text-gray-400">theartistnetwork.in/artists</span>
              </div>
              <span className="text-[11px] font-semibold text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-800">
                Talent Discovery Directory
              </span>
            </div>

            <div className="p-6 sm:p-8">
              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="text-xl mb-1">🔍</div>
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                    Granular Filters
                  </h4>
                  <p className="text-xs text-purple-700 leading-relaxed">
                    Filter by 9+ performance categories, major Indian cities, genres, and starting budget brackets.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="text-xl mb-1">🎬</div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                    Live Video Samples
                  </h4>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Watch embedded YouTube performance clips and review genuine artist audio samples directly on profiles.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                  <div className="text-xl mb-1">📋</div>
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">
                    Technical Specifications
                  </h4>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Review required sound equipment, microphones, stage dimensions, and logistical rider details.
                  </p>
                </div>
              </div>

              {/* Roadmap Transparency Card */}
              <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/50 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                    Roadmap Transparency
                  </span>
                  <span className="text-xs font-bold text-blue-700">Upcoming Features</span>
                </div>
                <h4 className="text-base font-bold text-gray-900">
                  Direct In-App Enquiries &amp; Venue Booking (Planned)
                </h4>
                <p className="text-xs text-gray-600 mt-1 mb-2 leading-relaxed">
                  In-platform booking requests, venue roster planning, and direct messaging workflows are scheduled for future development phases. Currently, clients can discover talent, inspect portfolios, and explore artists across India.
                </p>
              </div>

              {/* Action Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center sm:text-left">
                  Explore our public directory to find singers, DJs, bands, dancers, and visual artists.
                </p>
                <Link
                  href="/artists"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all text-center"
                >
                  Explore Artist Directory →
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
