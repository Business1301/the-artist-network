"use client";

import { useState } from "react";
import Link from "next/link";


// ⚠️ MOCK DEMONSTRATION DATA ONLY
const mockLineup = [
  {
    day: "Friday Night",
    date: "Nov 13, 2026",
    slot: "8:00 PM – 11:00 PM",
    theme: "Acoustic Unplugged Night",
    artist: "Dev Singh",
    category: "Acoustic Fingerstyle Guitar",
    fee: "₹18,000",
    status: "Confirmed",
    statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    day: "Saturday Night",
    date: "Nov 14, 2026",
    slot: "8:30 PM – 11:30 PM",
    theme: "Sufi & Bollywood Dinner Special",
    artist: "Arjun Sharma",
    category: "Lead Vocalist & Playback",
    fee: "₹22,000",
    status: "Awaiting Artist Response",
    statusColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    day: "Sunday Brunch",
    date: "Nov 15, 2026",
    slot: "1:00 PM – 4:00 PM",
    theme: "Sunset & Retro Jazz Brunch",
    artist: "Priya Nair",
    category: "Chillout & Lounge DJ",
    fee: "₹16,000",
    status: "Confirmed",
    statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
];

const mockSentEnquiries = [
  {
    id: 101,
    artistName: "Arjun Sharma",
    category: "Singers & Vocalists",
    proposedDate: "Nov 14, 2026 (Sat 8:30 PM)",
    budgetOffered: "₹22,000",
    status: "Awaiting Artist Response",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    notes: "Invited for Saturday Sufi dinner special. In-house PA provided.",
  },
  {
    id: 102,
    artistName: "Dev Singh",
    category: "Solo Musicians (Guitar)",
    proposedDate: "Nov 13, 2026 (Fri 8:00 PM)",
    budgetOffered: "₹18,000",
    status: "Confirmed",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    notes: "Contract locked. Soundcheck at 6:30 PM on Friday.",
  },
  {
    id: 103,
    artistName: "The Groove Collective",
    category: "Live 4-Piece Band",
    proposedDate: "Dec 31, 2026 (New Year's Eve Gala)",
    budgetOffered: "₹65,000",
    status: "Negotiating Terms",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    notes: "Discussing sound rider requirements and extra stage lighting.",
  },
];

const mockSavedArtists = [
  {
    name: "Priya Nair",
    category: "DJ & Producer",
    location: "Bangalore",
    rate: "₹15k – ₹40k",
    tag: "High Energy",
  },
  {
    name: "Sneha Kulkarni",
    category: "Classical Vocalist",
    location: "Pune",
    rate: "₹12k – ₹28k",
    tag: "Cultural Repertoire",
  },
  {
    name: "Kabir Joshi",
    category: "Live Sketch Artist",
    location: "Jaipur",
    rate: "₹6k – ₹18k",
    tag: "Guest Favors",
  },
];

export default function RestaurantDashboardPage() {
  const [activeTab, setActiveTab] = useState<"lineup" | "enquiries" | "shortlist" | "specs">("lineup");
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [requirementSuccess, setRequirementSuccess] = useState(false);

  return (
    <>
      <main className="min-h-screen bg-gray-50 pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Prototype disclaimer banner */}
          <div className="mb-6 mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="text-base">🍽️</span>
              <span>
                <strong>Restaurant &amp; Venue Portal Mockup:</strong> Logged in as venue manager for <strong>The Olive Courtyard (Restaurant &amp; Lounge, Bandra)</strong>.
              </span>
            </div>
            <Link
              href="/dashboard/artist"
              className="text-purple-700 hover:text-purple-900 font-bold underline whitespace-nowrap"
            >
              Switch to Artist Dashboard →
            </Link>
          </div>

          {/* Success notice */}
          {requirementSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center justify-between">
              <span>✓ Live requirement posted to talent directory! (UI Demonstration)</span>
              <button onClick={() => setRequirementSuccess(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
          )}

          {/* Venue Header Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
                  OC
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">The Olive Courtyard</h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      Verified Venue Host
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Fine Dining &amp; Open Courtyard Lounge • 140 Seating Capacity • Bandra West, Mumbai
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Manager: Rishi Kapoor • Live Music Slots: Fri, Sat, Sun
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <Link
                  href="/artists"
                  className="flex-1 md:flex-none text-center px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                >
                  Browse Artists
                </Link>
                <button
                  onClick={() => setShowRequirementModal(true)}
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  + Post Live Gig Requirement
                </button>
              </div>
            </div>

            {/* Monthly Budget Tracker */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">November Entertainment Budget Allocation</span>
                  <span className="font-bold text-gray-900">₹56,000 / ₹80,000 Committed</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: "70%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-medium text-gray-500 block mb-1">Weekend Slots Filled</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">2 / 3</span>
                <span className="text-[11px] font-semibold text-emerald-600">67% Ready</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-medium text-gray-500 block mb-1">Outgoing Enquiries</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">3</span>
                <span className="text-[11px] font-semibold text-amber-600">1 awaiting reply</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-medium text-gray-500 block mb-1">Shortlisted Talent</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">14</span>
                <span className="text-[11px] text-gray-400">saved profiles</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-medium text-gray-500 block mb-1">Soundcheck Status</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">Ready</span>
                <span className="text-[11px] text-gray-400">PA &amp; Mics Checked</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-3 border-b border-gray-200 mb-8 pb-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("lineup")}
              className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "lineup"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Weekend Roster (3)
            </button>
            <button
              onClick={() => setActiveTab("enquiries")}
              className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "enquiries"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Sent Enquiries (3)
            </button>
            <button
              onClick={() => setActiveTab("shortlist")}
              className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "shortlist"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Saved Talent Shortlist
            </button>
            <button
              onClick={() => setActiveTab("specs")}
              className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "specs"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Stage &amp; PA Specs
            </button>
          </div>

          {/* TAB 1: Weekend Lineup */}
          {activeTab === "lineup" && (
            <div className="space-y-4">
              {mockLineup.map((slot, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-purple-50 text-purple-800 flex flex-col items-center justify-center font-bold flex-shrink-0">
                      <span className="text-[11px] uppercase">{slot.day.split(" ")[0]}</span>
                      <span className="text-xs text-gray-500 leading-tight">{slot.date.split(",")[0]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900">{slot.theme}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${slot.statusColor}`}>
                          {slot.status}
                        </span>
                      </div>
                      <p className="text-xs text-purple-700 font-semibold">
                        Artist: {slot.artist} • <span className="text-gray-500 font-normal">{slot.category}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Timing: {slot.slot} • Performance Fee: <strong>{slot.fee}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => alert("Message thread with artist will be connected in Phase 5.")}
                      className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold"
                    >
                      Message Artist
                    </button>
                    <button
                      onClick={() => alert("Roster editor will be connected in Phase 5.")}
                      className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold"
                    >
                      Modify Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Sent Enquiries */}
          {activeTab === "enquiries" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Enquiries Sent to Artists</h3>
                  <p className="text-xs text-gray-500">Track responses, negotiate fees, and confirm dates</p>
                </div>
                <Link
                  href="/artists"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                >
                  + Contact New Artist
                </Link>
              </div>

              <div className="divide-y divide-gray-100">
                {mockSentEnquiries.map((enq) => (
                  <div key={enq.id} className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-gray-900">{enq.artistName}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${enq.badgeColor}`}>
                          {enq.status}
                        </span>
                      </div>
                      <p className="text-xs text-purple-600 font-medium">{enq.category}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Target Slot: <strong>{enq.proposedDate}</strong> • Offered Fee: <strong>{enq.budgetOffered}</strong>
                      </p>
                      <p className="text-xs text-gray-400 mt-1 italic">&ldquo;{enq.notes}&rdquo;</p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => alert("Thread modal will open here.")}
                        className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100"
                      >
                        View Conversation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Saved Shortlist */}
          {activeTab === "shortlist" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockSavedArtists.map((artist, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {artist.tag}
                    </span>
                    <button
                      onClick={() => alert("Bookmark removed (demo).")}
                      className="text-xs text-gray-400 hover:text-red-500"
                      title="Remove from favorites"
                    >
                      ♥ Saved
                    </button>
                  </div>
                  <h4 className="text-base font-bold text-gray-900">{artist.name}</h4>
                  <p className="text-xs text-purple-600 font-semibold mb-1">{artist.category}</p>
                  <p className="text-xs text-gray-400 mb-4">{artist.location} • Est: {artist.rate}</p>

                  <div className="mt-auto flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Link
                      href="/artists"
                      className="flex-1 text-center py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => alert("Booking request modal will open in Phase 5.")}
                      className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                    >
                      Enquire
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Stage & Sound Equipment Specs */}
          {activeTab === "specs" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Venue Audio &amp; Stage Specification</h3>
              <p className="text-xs text-gray-500 mb-6">
                These specs are automatically displayed to artists when you send them booking requests.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider text-purple-700">Audio Setup Available</h4>
                  <p>• <strong>Mixer:</strong> Yamaha MG12XU (12-Channel)</p>
                  <p>• <strong>Speakers:</strong> 2 x JBL EON615 Active PA Speakers + 1 Monitor</p>
                  <p>• <strong>Microphones:</strong> 2 x Shure SM58 Corded + 1 Wireless Mic</p>
                  <p>• <strong>Direct Boxes:</strong> 2 x Active DI Boxes available</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider text-purple-700">House Rules &amp; Timings</h4>
                  <p>• <strong>Stage Area:</strong> 14 ft x 9 ft elevated wooden deck in courtyard</p>
                  <p>• <strong>Soundcheck Slot:</strong> 6:00 PM – 7:00 PM</p>
                  <p>• <strong>Outdoor Music Cutoff:</strong> Strict 11:30 PM (local sound ordinance)</p>
                  <p>• <strong>Hospitality:</strong> Artist meals and non-alcoholic beverages provided</p>
                </div>
              </div>
            </div>
          )}

          {/* Requirement Posting Modal (Mockup) */}
          {showRequirementModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Post a Live Entertainment Requirement</h3>
                  <button onClick={() => setShowRequirementModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Broadcast your need to vetted artists in Mumbai. Artists matching your criteria can review and send proposals.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Target Genre / Category</label>
                    <input
                      type="text"
                      defaultValue="Acoustic Sufi & Bollywood Singer"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Date &amp; Slot</label>
                    <input
                      type="text"
                      defaultValue="Saturday, Nov 21, 2026 (8:00 PM – 11:00 PM)"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Budget Allocation</label>
                    <input
                      type="text"
                      defaultValue="₹20,000 – ₹25,000"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRequirementModal(false);
                      setRequirementSuccess(true);
                      setTimeout(() => setRequirementSuccess(false), 5000);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors"
                  >
                    Publish Requirement
                  </button>
                  <button
                    onClick={() => setShowRequirementModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}

