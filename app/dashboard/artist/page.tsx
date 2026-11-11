"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getArtistProfile, ArtistProfileData, PortfolioItemData } from "@/app/actions/artist";
import { createClient } from "@/lib/supabase/client";

// ⚠️ MOCK DEMONSTRATION DATA ONLY — Will connect to real database inquiries in Phase 5
const mockEnquiries = [
  {
    id: 1,
    clientName: "The Olive Courtyard (Restaurant & Lounge)",
    contactPerson: "Rishi Kapoor (Events Manager)",
    location: "Bandra West, Mumbai",
    eventType: "Saturday Sufi & Bollywood Dinner Night",
    date: "Saturday, Nov 14, 2026",
    time: "8:00 PM – 11:00 PM (2 x 60 min sets)",
    budget: "₹22,000",
    status: "New (Action Required)",
    statusColor: "bg-amber-100 text-amber-800 border-amber-200",
    message: "Hi, we loved your playback demos! We are curating our November Saturday dinner series and want a soulful Bollywood/Sufi acoustic set. Sound system is provided in-house.",
  },
  {
    id: 2,
    clientName: "TechNova Systems Pvt Ltd",
    contactPerson: "Anita Deshmukh (HR & Culture)",
    location: "Kharadi, Pune",
    eventType: "Annual Corporate Awards Gala",
    date: "Friday, Nov 27, 2026",
    time: "7:00 PM – 9:30 PM",
    budget: "₹35,000",
    status: "In Negotiation",
    statusColor: "bg-blue-100 text-blue-800 border-blue-200",
    message: "We'd like to book you for our 2026 awards night dinner. Would your fee include an accompanying keyboardist or guitarist?",
  },
  {
    id: 3,
    clientName: "Elite Celebrations (Wedding Planners)",
    contactPerson: "Kunal Singhania",
    location: "Udaipur, Rajasthan",
    eventType: "Destination Wedding Sangeet",
    date: "Friday, Dec 18, 2026",
    time: "9:00 PM – Midnight",
    budget: "₹50,000 + Travel & Stay",
    status: "Confirmed",
    statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    message: "Booking confirmed! Contract signed and 50% advance deposit scheduled as per terms.",
  },
];

const mockUpcomingGigs = [
  {
    date: "Nov 07",
    day: "Sat",
    venue: "Café Terraza Rooftop",
    city: "Mumbai",
    slot: "8:00 PM – 10:30 PM",
    type: "Acoustic Pop & Bollywood",
  },
  {
    date: "Nov 14",
    day: "Sat",
    venue: "The Olive Courtyard (Tentative)",
    city: "Mumbai",
    slot: "8:00 PM – 11:00 PM",
    type: "Sufi & Bollywood",
  },
  {
    date: "Nov 27",
    day: "Fri",
    venue: "TechNova Gala",
    city: "Pune",
    slot: "7:00 PM – 9:30 PM",
    type: "Corporate Feature Set",
  },
  {
    date: "Dec 18",
    day: "Fri",
    venue: "Jagmandir Island Palace",
    city: "Udaipur",
    slot: "9:00 PM – Midnight",
    type: "Destination Wedding Sangeet",
  },
];

export default function ArtistDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"enquiries" | "calendar" | "portfolio">("enquiries");
  const [enquiryList, setEnquiryList] = useState(mockEnquiries);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Real Database State
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ArtistProfileData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItemData[]>([]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // If not logged in, redirect to login
        router.push("/login?redirect=/dashboard/artist");
        return;
      }

      setUserEmail(user.email || null);

      const res = await getArtistProfile();
      if (res.success) {
        setProfile(res.profile || null);
        setPortfolio(res.portfolio || []);
      }
      setIsLoading(false);
    }

    loadData();
  }, [router]);

  const handleStatusUpdate = (id: number, newStatus: string) => {
    setEnquiryList((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
    );
    setActionAlert(`Enquiry #${id} marked as "${newStatus}" (UI Demonstration).`);
    setTimeout(() => setActionAlert(null), 4000);
  };

  // Calculate real completion score
  const calculateCompleteness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.stage_name?.trim()) score += 15;
    if (profile.category) score += 10;
    if (profile.city?.trim()) score += 10;
    if (profile.bio && profile.bio.trim().length >= 30) score += 20;
    if (profile.starting_price && Number(profile.starting_price) > 0) score += 15;
    if (profile.genres?.length > 0) score += 10;
    if (profile.specialities?.length > 0) score += 5;
    if (profile.profile_image_url?.trim()) score += 10;
    if (profile.instagram_url?.trim() || profile.youtube_url?.trim()) score += 5;
    if (portfolio.length > 0) score += 10;
    return Math.min(score, 100);
  };

  const completeness = calculateCompleteness();

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-semibold">Loading artist workspace...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* User Status / Account Bar */}
          <div className="mb-6 mt-4 p-4 rounded-2xl bg-white border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Authenticated as <strong className="text-gray-900">{userEmail}</strong> (Artist Account)
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/artist/edit"
                className="text-blue-600 hover:text-blue-800 font-bold transition-colors"
              >
                Edit Profile &amp; Portfolio →
              </Link>
            </div>
          </div>

          {/* Action toast */}
          {actionAlert && (
            <div className="mb-4 p-3 rounded-xl bg-purple-600 text-white text-xs font-semibold shadow-md flex items-center justify-between">
              <span>✓ {actionAlert}</span>
              <button onClick={() => setActionAlert(null)} className="text-white/80 hover:text-white">✕</button>
            </div>
          )}

          {/* FIRST TIME ONBOARDING CALLOUT (if profile not yet created) */}
          {!profile ? (
            <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-xl">
              <div className="max-w-2xl">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-purple-200 uppercase tracking-wider inline-block mb-3">
                  🎨 Onboarding Step 1 of 2
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
                  Welcome to The Artist Network!
                </h2>
                <p className="text-purple-200 text-xs sm:text-sm mb-6 leading-relaxed">
                  Your artist account is active. Complete your stage profile, upload your portfolio, and set your starting fees to get discovered and hired by top event planners and venues.
                </p>
                <Link
                  href="/dashboard/artist/edit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs sm:text-sm font-bold shadow-lg transition-transform hover:scale-105"
                >
                  <span>Complete Artist Profile Now</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Suspended Alert Banner */}
              {profile.profile_status === "suspended" && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm flex items-start gap-3">
                  <span className="text-xl">🚫</span>
                  <div>
                    <h3 className="text-sm font-bold text-rose-900">Your artist profile has been suspended</h3>
                    <p className="text-xs text-rose-700 mt-0.5">
                      {profile.rejection_reason
                        ? `Administrative reason: "${profile.rejection_reason}"`
                        : "Your profile has been suspended due to a moderation review. Your public profile and portfolio edits are currently frozen."}
                    </p>
                    <p className="text-xs text-rose-600 mt-2 font-semibold">
                      Please contact platform administration if you believe this was in error.
                    </p>
                  </div>
                </div>
              )}

              {/* Legacy Pending Review Banner */}
              {profile.profile_status === "pending_review" && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⏳</span>
                    <div>
                      <h3 className="text-sm font-bold text-amber-900">Platform Update: Admin Approval No Longer Required!</h3>
                      <p className="text-xs text-amber-700 mt-0.5">
                        The Artist Network is now an open marketplace. You can publish your profile immediately to go live.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/artist/edit"
                    className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    Publish Now &rarr;
                  </Link>
                </div>
              )}

              {/* REAL ARTIST PROFILE HEADER CARD */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md flex-shrink-0">
                      {profile.profile_image_url ? (
                        <img
                          src={profile.profile_image_url}
                          alt={profile.stage_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{profile.stage_name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                          {profile.stage_name}
                        </h1>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            profile.profile_status === "published"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : profile.profile_status === "suspended"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : profile.profile_status === "pending_review"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : profile.profile_status === "rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {profile.profile_status === "published"
                            ? "● Live on Marketplace"
                            : profile.profile_status === "suspended"
                            ? "🚫 Suspended by Admin"
                            : profile.profile_status === "pending_review"
                            ? "⏳ In Review"
                            : profile.profile_status === "rejected"
                            ? "⚠️ Changes Needed"
                            : "📝 Draft in Progress"}
                        </span>
                      {profile.is_verified && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          ✓ Verified Artist
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {profile.category} • {profile.city}
                      {profile.state ? `, ${profile.state}` : ""}
                    </p>
                    <p className="text-xs text-purple-600 font-medium mt-1">
                      Public Slug: <code className="bg-purple-50 px-2 py-0.5 rounded">/artists/{profile.slug}</code>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <Link
                    href={`/artists/${profile.slug}`}
                    target="_blank"
                    className="flex-1 md:flex-none text-center px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                  >
                    View Public Profile ↗
                  </Link>
                  <Link
                    href="/dashboard/artist/edit"
                    className="flex-1 md:flex-none text-center px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    Edit Profile &amp; Rates
                  </Link>
                </div>
              </div>

              {/* Profile Completeness Bar */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-gray-700">Profile Completeness</span>
                  <span className="font-bold text-purple-600">{completeness}% Complete</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  {completeness < 100
                    ? "Tip: Add portfolio photos and social links in the profile editor to reach 100%."
                    : "Excellent! Your profile is 100% complete."}
                </p>
              </div>
            </div>
            </>
          )}

          {/* Analytics Snapshot KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-medium text-gray-500 block mb-1">Portfolio Items</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {portfolio.length}
                </span>
                <span className="text-[11px] font-semibold text-purple-600">media assets</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-medium text-gray-500 block mb-1">Indicative Fee</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  {profile?.starting_price ? `₹${profile.starting_price.toLocaleString("en-IN")}` : "Not Set"}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-medium text-gray-500 block mb-1">Review Status</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-purple-700 capitalize">
                  {profile ? profile.profile_status.replace("_", " ") : "Not Started"}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-medium text-gray-500 block mb-1">Booking Enquiries</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">3</span>
                <span className="text-[11px] font-semibold text-amber-600">Sample preview</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
            <button
              onClick={() => setActiveTab("enquiries")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "enquiries"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              Enquiries &amp; Requests ({enquiryList.length})
            </button>
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "portfolio"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              Portfolio Media ({portfolio.length})
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "calendar"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              Gig Schedule ({mockUpcomingGigs.length})
            </button>
          </div>

          {/* TAB 1: Enquiries */}
          {activeTab === "enquiries" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <span>
                  ℹ️ <strong>Demonstration Enquiries:</strong> Live booking inquiry management between clients and artists will be connected in Phase 5.
                </span>
              </div>

              {enquiryList.map((enquiry) => (
                <div
                  key={enquiry.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:border-purple-200 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">
                        {enquiry.eventType}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-0.5">
                        {enquiry.clientName}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Contact: {enquiry.contactPerson} • {enquiry.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${enquiry.statusColor}`}>
                        {enquiry.status}
                      </span>
                      <span className="text-sm font-extrabold text-gray-900 ml-2">
                        {enquiry.budget}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4 italic">
                    &ldquo;{enquiry.message}&rdquo;
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
                    <span className="text-gray-500">
                      📅 Date: <strong>{enquiry.date}</strong> | ⏰ Time: {enquiry.time}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusUpdate(enquiry.id, "Accepted")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
                      >
                        Accept Enquiry
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(enquiry.id, "Declined")}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Portfolio Media Overview */}
          {activeTab === "portfolio" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Your Portfolio Showcase</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Media items currently uploaded to your public profile.
                  </p>
                </div>
                <Link
                  href="/dashboard/artist/edit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
                >
                  Manage Portfolio Media →
                </Link>
              </div>

              {portfolio.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl">
                  <span className="text-3xl block mb-2">📸</span>
                  <p className="text-xs font-semibold text-gray-700">No media items uploaded yet.</p>
                  <p className="text-[11px] text-gray-400 mt-1 mb-4">
                    Add performance photos and YouTube links to show venues your talent.
                  </p>
                  <Link
                    href="/dashboard/artist/edit"
                    className="inline-block px-4 py-2 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200 hover:bg-purple-100"
                  >
                    Open Profile Editor &amp; Upload Media
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolio.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      <div className="aspect-video bg-gray-100 relative overflow-hidden">
                        {item.media_type === "image" ? (
                          <img
                            src={item.media_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : item.media_type === "youtube" ? (
                          <iframe
                            src={item.media_url}
                            title={item.title}
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                            🎵 Audio / Link
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white uppercase tracking-wider">
                          {item.media_type}
                        </span>
                      </div>
                      <div className="p-3">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{item.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Schedule */}
          {activeTab === "calendar" && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                <span>
                  ℹ️ <strong>Gig Calendar:</strong> Dates will be populated automatically when inquiries are confirmed in Phase 5.
                </span>
              </div>

              {mockUpcomingGigs.map((gig, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex flex-col items-center justify-center text-purple-700 flex-shrink-0">
                      <span className="text-[10px] uppercase font-bold">{gig.day}</span>
                      <span className="text-base font-extrabold">{gig.date.split(" ")[1]}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{gig.venue}</h4>
                      <p className="text-xs text-gray-500">
                        {gig.city} • {gig.type}
                      </p>
                      <p className="text-[11px] text-purple-600 font-semibold mt-0.5">
                        Slot: {gig.slot}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                    Confirmed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
