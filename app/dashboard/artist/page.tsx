"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getArtistProfile, ArtistProfileData, PortfolioItemData } from "@/app/actions/artist";
import { createClient } from "@/lib/supabase/client";

// Completeness field definitions — each has a key, label, weight, and check function
interface CompletenessField {
  key: string;
  label: string;
  weight: number;
  check: (profile: ArtistProfileData, portfolio: PortfolioItemData[]) => boolean;
}

const COMPLETENESS_FIELDS: CompletenessField[] = [
  { key: "stage_name", label: "Stage name", weight: 15, check: (p) => !!p.stage_name?.trim() },
  { key: "category", label: "Category", weight: 10, check: (p) => !!p.category?.trim() },
  { key: "city", label: "City / location", weight: 10, check: (p) => !!p.city?.trim() },
  { key: "bio", label: "Bio (30+ characters)", weight: 20, check: (p) => !!(p.bio && p.bio.trim().length >= 30) },
  { key: "starting_price", label: "Starting price", weight: 15, check: (p) => !!(p.starting_price && Number(p.starting_price) > 0) },
  { key: "genres", label: "Genres", weight: 10, check: (p) => !!(p.genres && p.genres.length > 0) },
  { key: "profile_image", label: "Profile photo", weight: 10, check: (p) => !!p.profile_image_url?.trim() },
  { key: "portfolio", label: "Portfolio item(s)", weight: 10, check: (_p, port) => port.length > 0 },
];

export default function ArtistDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "portfolio">("overview");

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

  // Calculate real completion score (0 to 100%) based strictly on completed fields
  const getCompleteness = () => {
    if (!profile) return { score: 0, completed: [] as string[], missing: COMPLETENESS_FIELDS.map((f) => f.label) };
    let score = 0;
    const completed: string[] = [];
    const missing: string[] = [];
    for (const field of COMPLETENESS_FIELDS) {
      if (field.check(profile, portfolio)) {
        score += field.weight;
        completed.push(field.label);
      } else {
        missing.push(field.label);
      }
    }
    return { score: Math.min(score, 100), completed, missing };
  };

  const { score: completeness, missing: missingFields } = getCompleteness();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-semibold">Loading artist workspace...</p>
        </div>
      </div>
    );
  }

  return (
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

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {profile.profile_status === "published" && (
                  <Link
                    href={`/artists/${profile.slug}`}
                    target="_blank"
                    className="flex-1 md:flex-none text-center px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                  >
                    View Public Profile ↗
                  </Link>
                )}
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
                {completeness < 100 && missingFields.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="text-[11px] text-gray-500 mr-1">Missing:</span>
                    {missingFields.map((field) => (
                      <span
                        key={field}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                      >
                        ○ {field}
                      </span>
                    ))}
                    <Link
                      href="/dashboard/artist/edit"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      Complete now →
                    </Link>
                  </div>
                ) : completeness >= 100 ? (
                  <p className="text-[11px] text-emerald-600 mt-2 font-semibold">
                    ✓ Excellent! Your profile is 100% complete.
                  </p>
                ) : null}
              </div>
            </div>
            </>
          )}

        {/* KPI Cards — Only real data */}
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
            <span className="text-xs font-medium text-gray-500 block mb-1">Profile Status</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-purple-700 capitalize">
                {profile ? profile.profile_status.replace("_", " ") : "Not Started"}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-xs font-medium text-gray-500 block mb-1">Profile Completion</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">{completeness}%</span>
              <span className="text-[11px] font-semibold text-purple-600">complete</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Overview &amp; Actions
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
        </div>

        {/* TAB 1: Overview & Actions */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/dashboard/artist/edit"
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:border-purple-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg group-hover:bg-purple-100 transition-colors">
                    ✏️
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Edit Profile &amp; Rates</h3>
                    <p className="text-[11px] text-gray-500">Update your bio, pricing, and details</p>
                  </div>
                </div>
                <span className="text-xs text-purple-600 font-semibold">Open Editor →</span>
              </Link>

              <Link
                href="/dashboard/artist/edit"
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:border-purple-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-lg group-hover:bg-pink-100 transition-colors">
                    📸
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Manage Portfolio</h3>
                    <p className="text-[11px] text-gray-500">Upload photos, videos, and media</p>
                  </div>
                </div>
                <span className="text-xs text-purple-600 font-semibold">Open Portfolio Manager →</span>
              </Link>

              {profile?.profile_status === "published" && profile.slug ? (
                <Link
                  href={`/artists/${profile.slug}`}
                  target="_blank"
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg group-hover:bg-emerald-100 transition-colors">
                      🌐
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">View Public Profile</h3>
                      <p className="text-[11px] text-gray-500">See how clients view your page</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-600 font-semibold">Open Public Page ↗</span>
                </Link>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg">
                      🌐
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Public Profile</h3>
                      <p className="text-[11px] text-gray-500">
                        {profile?.profile_status === "draft" || !profile
                          ? "Publish your profile to go live on the marketplace"
                          : profile.profile_status === "suspended"
                          ? "Profile suspended — not publicly visible"
                          : "Profile is not yet published"}
                      </p>
                    </div>
                  </div>
                  {(profile?.profile_status === "draft" || !profile) && (
                    <Link
                      href="/dashboard/artist/edit"
                      className="text-xs text-purple-600 font-semibold"
                    >
                      Complete &amp; Publish →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Booking Enquiries — Coming Soon Notice */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">💬</span>
                <h3 className="text-sm font-bold text-gray-900">Booking Enquiries</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Direct booking enquiries from venues, event organizers, and clients will appear here once the messaging and booking system is live. You will receive notifications for new requests and be able to respond, negotiate, and manage confirmations from this dashboard.
              </p>
            </div>

            {/* Gig Schedule & Calendar — Live */}
            <Link
              href="/dashboard/artist/calendar"
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:border-purple-200 hover:shadow-md transition-all group flex flex-col gap-3 no-underline"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors flex items-center justify-center text-lg shrink-0">
                  📅
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">Gig Schedule &amp; Calendar</h3>
                  <p className="text-[11px] text-gray-500">Manage your availability and external bookings</p>
                </div>
              </div>
              <span className="text-xs text-purple-600 font-semibold group-hover:underline">
                Open Calendar →
              </span>
            </Link>
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
      </div>
    </main>
  );
}
