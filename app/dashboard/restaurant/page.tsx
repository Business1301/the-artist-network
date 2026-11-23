"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getBusinessEnquiriesAction } from "@/app/actions/enquiries";
import { BookingEnquiryWithDetails } from "@/lib/enquiries/types";
import BusinessEnquiriesPanel from "@/app/components/BusinessEnquiriesPanel";

// ⚠️ MOCK DEMONSTRATION DATA for non-enquiry sections only
// (Weekend Lineup, Shortlist, Stage Specs remain mockups until Phase 5.2+)
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"lineup" | "enquiries" | "shortlist" | "specs">("enquiries");
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [requirementSuccess, setRequirementSuccess] = useState(false);

  // Real authenticated user state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState<BookingEnquiryWithDetails[]>([]);
  const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(true);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/dashboard/restaurant");
        return;
      }
      setUserEmail(user.email || null);

      // Load real enquiries
      setIsLoadingEnquiries(true);
      const res = await getBusinessEnquiriesAction({ status: "all", limit: 50 });
      if (res.success && res.data) {
        setEnquiries(res.data);
      }
      setIsLoadingEnquiries(false);
    }
    init();
  }, [router]);

  // Derived real counts
  const openEnquiriesCount = enquiries.filter((e) =>
    ["submitted", "seen", "info_requested", "clarified"].includes(e.status)
  ).length;
  const actionNeededCount = enquiries.filter(
    (e) => e.status === "info_requested"
  ).length;
  const interestedCount = enquiries.filter((e) => e.status === "interested").length;

  return (
    <>
      <main className="min-h-screen bg-gray-50 pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Account Bar */}
          <div className="mb-6 mt-4 p-4 rounded-2xl bg-white border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Authenticated as <strong className="text-gray-900">{userEmail || "…"}</strong> (Business Account)
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/artists"
                className="text-blue-600 hover:text-blue-800 font-bold transition-colors"
              >
                Browse Artists →
              </Link>
            </div>
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
                  🏢
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Business Dashboard</h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      Venue / Organiser
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Send enquiries to artists, track responses, and manage your bookings.
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
                  + Post Gig Requirement
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics — Live where real data exists */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setActiveTab("enquiries")}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-left hover:border-purple-200 transition-colors cursor-pointer"
            >
              <span className="text-xs font-medium text-gray-500 block mb-1">Sent Enquiries</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {isLoadingEnquiries ? "…" : enquiries.length}
                </span>
                <span className="text-[11px] font-semibold text-amber-600">
                  {isLoadingEnquiries ? "" : openEnquiriesCount > 0 ? `${openEnquiriesCount} open` : "all resolved"}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("enquiries")}
              className={`bg-white p-5 rounded-2xl border shadow-sm text-left transition-colors cursor-pointer ${
                actionNeededCount > 0
                  ? "border-amber-300 hover:border-amber-400"
                  : "border-gray-200 hover:border-purple-200"
              }`}
            >
              <span className="text-xs font-medium text-gray-500 block mb-1">Your Response Needed</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-extrabold ${actionNeededCount > 0 ? "text-amber-600" : "text-gray-900"}`}>
                  {isLoadingEnquiries ? "…" : actionNeededCount}
                </span>
                {actionNeededCount > 0 && (
                  <span className="text-[11px] font-bold text-amber-600 animate-pulse">Action Needed</span>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("enquiries")}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-left hover:border-emerald-200 transition-colors cursor-pointer"
            >
              <span className="text-xs font-medium text-gray-500 block mb-1">Artist Interested</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {isLoadingEnquiries ? "…" : interestedCount}
                </span>
                <span className="text-[11px] text-gray-400">non-binding</span>
              </div>
            </button>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-medium text-gray-500 block mb-1">Shortlisted Talent</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">3</span>
                <span className="text-[11px] text-gray-400">saved profiles</span>
              </div>
            </div>
          </div>

          {/* Action Needed Alert Banner */}
          {!isLoadingEnquiries && actionNeededCount > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">❓</span>
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    {actionNeededCount} {actionNeededCount === 1 ? "artist has" : "artists have"} asked a question
                  </p>
                  <p className="text-xs text-amber-700">
                    Reply to their question so they can express interest or decline.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("enquiries")}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                View & Reply →
              </button>
            </div>
          )}

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
              className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === "enquiries"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Sent Enquiries
              {!isLoadingEnquiries && enquiries.length > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  actionNeededCount > 0
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {actionNeededCount > 0 ? `${actionNeededCount} pending` : enquiries.length}
                </span>
              )}
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

          {/* TAB 1: Weekend Lineup (mock — preserved as-is) */}
          {activeTab === "lineup" && (
            <div className="space-y-4">
              <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800">
                <strong>Demo Data:</strong> The Weekend Roster shows example bookings. Live booking management will be added in a future phase.
              </div>
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
                        Artist: {slot.artist} · <span className="text-gray-500 font-normal">{slot.category}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Timing: {slot.slot} · Performance Fee: <strong>{slot.fee}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => alert("Message thread with artist will be connected in a future phase.")}
                      className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold"
                    >
                      Message Artist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Sent Enquiries — Live */}
          {activeTab === "enquiries" && (
            <BusinessEnquiriesPanel initialEnquiries={isLoadingEnquiries ? undefined : enquiries} />
          )}

          {/* TAB 3: Saved Shortlist (mock — preserved) */}
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
                  <p className="text-xs text-gray-400 mb-4">{artist.location} · Est: {artist.rate}</p>
                  <div className="mt-auto flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Link
                      href="/artists"
                      className="flex-1 text-center py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/artists"
                      className="flex-1 text-center py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                    >
                      Enquire
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Stage & Sound Equipment Specs (mock — preserved) */}
          {activeTab === "specs" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Venue Audio & Stage Specification</h3>
              <p className="text-xs text-gray-500 mb-6">
                These specs are automatically displayed to artists when you send them booking requests.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider text-purple-700">Audio Setup Available</h4>
                  <p>· <strong>Mixer:</strong> Yamaha MG12XU (12-Channel)</p>
                  <p>· <strong>Speakers:</strong> 2 × JBL EON615 Active PA + 1 Monitor</p>
                  <p>· <strong>Microphones:</strong> 2 × Shure SM58 Corded + 1 Wireless</p>
                  <p>· <strong>Direct Boxes:</strong> 2 × Active DI Boxes</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider text-purple-700">House Rules & Timings</h4>
                  <p>· <strong>Stage Area:</strong> 14 ft × 9 ft elevated wooden deck</p>
                  <p>· <strong>Soundcheck Slot:</strong> 6:00 PM – 7:00 PM</p>
                  <p>· <strong>Music Cutoff:</strong> Strict 11:30 PM (sound ordinance)</p>
                  <p>· <strong>Hospitality:</strong> Meals & beverages provided</p>
                </div>
              </div>
            </div>
          )}

          {/* Requirement Posting Modal (Demo) */}
          {showRequirementModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Post a Live Entertainment Requirement</h3>
                  <button onClick={() => setShowRequirementModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Broadcast your need to vetted artists. This feature is coming soon.
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
                    <label className="font-semibold text-gray-700 block mb-1">Date & Slot</label>
                    <input
                      type="text"
                      defaultValue="Saturday, Dec 6, 2026 (8:00 PM – 11:00 PM)"
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
