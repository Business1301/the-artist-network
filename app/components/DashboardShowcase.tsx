"use client";

import { useState } from "react";
import Link from "next/link";

export default function DashboardShowcase() {
  const [activePortal, setActivePortal] = useState<"artist" | "restaurant">("artist");

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
            <span>✨</span> Interactive Platform Preview
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Built for Both Artists &amp; Venues
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Switch between the two workspaces below to preview how talent receives gigs and how restaurants manage entertainment.
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
              <span>🎨</span> Artist Dashboard Preview
            </button>
            <button
              onClick={() => setActivePortal("restaurant")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activePortal === "restaurant"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>🍽️</span> Restaurant &amp; Venue Portal Preview
            </button>
          </div>
        </div>

        {/* Portal 1: Artist Preview */}
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
                Logged in as Arjun Sharma (Singer)
              </span>
            </div>

            <div className="p-6 sm:p-8">
              {/* Snapshot Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <span className="text-[11px] font-semibold text-purple-700 block mb-0.5">Incoming Enquiries</span>
                  <span className="text-2xl font-extrabold text-purple-900">3 New</span>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500 block mb-0.5">Profile Views</span>
                  <span className="text-2xl font-extrabold text-gray-900">482</span>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500 block mb-0.5">Saved by Venues</span>
                  <span className="text-2xl font-extrabold text-gray-900">19</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-700 block mb-0.5">Confirmed Gigs</span>
                  <span className="text-2xl font-extrabold text-emerald-900">4 Shows</span>
                </div>
              </div>

              {/* Sample Lead */}
              <div className="p-5 rounded-2xl border border-purple-100 bg-purple-50/30 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                    New Gig Request
                  </span>
                  <span className="text-xs font-bold text-emerald-700">Offered Fee: ₹22,000</span>
                </div>
                <h4 className="text-base font-bold text-gray-900">
                  Saturday Sufi &amp; Bollywood Dinner Night — The Olive Courtyard (Bandra West)
                </h4>
                <p className="text-xs text-gray-600 mt-1 mb-3">
                  Date: <strong>Saturday, Nov 14, 2026 (8:00 PM – 11:00 PM)</strong> • In-house PA system and mics provided.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-purple-600 bg-white px-3 py-1.5 rounded-lg border border-purple-200">
                    Accept &amp; Message Venue
                  </span>
                  <span className="text-xs text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">
                    Propose Alternate Fee
                  </span>
                </div>
              </div>

              {/* Action Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center sm:text-left">
                  Explore full features: Enquiries inbox, calendar blocker, and media upload manager.
                </p>
                <Link
                  href="/dashboard/artist"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all text-center"
                >
                  Open Full Artist Workspace →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Portal 2: Restaurant Preview */}
        {activePortal === "restaurant" && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden max-w-5xl mx-auto animate-fadeIn">
            {/* Window bar */}
            <div className="bg-gray-900 text-gray-300 px-6 py-3 flex items-center justify-between text-xs border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                <span className="ml-2 font-mono text-gray-400">theartistnetwork.in/dashboard/restaurant</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-800">
                Logged in as The Olive Courtyard (Manager)
              </span>
            </div>

            <div className="p-6 sm:p-8">
              {/* Snapshot Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-700 block mb-0.5">Weekend Roster</span>
                  <span className="text-2xl font-extrabold text-emerald-900">2 / 3 Slots Filled</span>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-[11px] font-semibold text-amber-700 block mb-0.5">Awaiting Reply</span>
                  <span className="text-2xl font-extrabold text-amber-900">1 Enquiry</span>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500 block mb-0.5">Shortlisted Artists</span>
                  <span className="text-2xl font-extrabold text-gray-900">14 Bookmarked</span>
                </div>
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <span className="text-[11px] font-semibold text-purple-700 block mb-0.5">Monthly Music Budget</span>
                  <span className="text-2xl font-extrabold text-purple-900">₹56k / ₹80k</span>
                </div>
              </div>

              {/* Sample Weekend Schedule Cards */}
              <div className="space-y-2.5 mb-6">
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900 mr-2">Fri 8:00 PM:</span>
                    <span className="text-purple-700 font-semibold">Dev Singh (Acoustic Guitar)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                    Confirmed (₹18,000)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900 mr-2">Sat 8:30 PM:</span>
                    <span className="text-purple-700 font-semibold">Arjun Sharma (Bollywood/Sufi Vocalist)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                    Awaiting Artist Response (₹22,000)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900 mr-2">Sun 1:00 PM:</span>
                    <span className="text-purple-700 font-semibold">Priya Nair (Lounge DJ Brunch)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                    Confirmed (₹16,000)
                  </span>
                </div>
              </div>

              {/* Action Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center sm:text-left">
                  Explore full features: Weekly roster scheduler, sent enquiries pipeline, and stage sound specs.
                </p>
                <Link
                  href="/dashboard/restaurant"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all text-center"
                >
                  Open Full Venue Portal →
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

