import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ShareArtistButton from "@/app/components/ShareArtistButton";
import { getPublicArtistBySlug } from "@/app/actions/artist";
import { getCurrentUser } from "@/app/auth/actions";

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const { profile } = await getPublicArtistBySlug(slug);

  if (!profile) {
    return {
      title: "Artist Not Found | The Artist Network",
    };
  }

  return {
    title: `${profile.stage_name} (${profile.category}) | The Artist Network`,
    description: profile.bio?.slice(0, 160) || `Book ${profile.stage_name} on The Artist Network.`,
    openGraph: {
      title: `${profile.stage_name} - ${profile.category}`,
      description: profile.bio?.slice(0, 160) || `Hire ${profile.stage_name}`,
      images: profile.profile_image_url ? [profile.profile_image_url] : [],
    },
  };
}

async function ArtistProfileContent({ params }: PageProps) {
  await connection();
  const { slug } = await params;
  const { profile, portfolio, isOwnerPreview } = await getPublicArtistBySlug(slug);

  if (!profile) {
    notFound();
  }

  const heroImage = profile.cover_image_url || profile.profile_image_url || "";
  const initials = profile.stage_name ? profile.stage_name.slice(0, 2).toUpperCase() : "AN";

  // About card rows matching Screenshots 2 & 3
  const genreList = profile.genres?.length ? profile.genres.join(", ") : "All Styles, Live Entertainment";
  const eventList = profile.specialities?.length
    ? profile.specialities.join(", ")
    : "Concert, Corporate Event, Birthday Party, Festival, Private Event, Club";
  const instrumentList = profile.performance_types?.length
    ? profile.performance_types.join(", ")
    : "Vocals, Instruments, Live Performance";
  const languageList = profile.languages?.length ? profile.languages.join(", ") : "English, Hindi";

  return (
    <main className="min-h-screen bg-white text-gray-900 pt-20 pb-24">
      {/* Owner Preview Banner */}
      {isOwnerPreview && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 text-xs sm:text-sm font-semibold mb-6">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span>👁️</span>
              <span>
                <strong>Private Owner Preview:</strong> Status is currently{" "}
                <span className="uppercase font-bold underline">{profile.profile_status}</span>.
              </span>
            </div>
            <Link
              href="/dashboard/artist/edit"
              className="text-white bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded-lg font-bold text-xs transition-colors"
            >
              ← Back to Editor
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* TOP PROFILE CARD matching Screenshot 2 */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden mb-10">
          {/* Main Hero Photo */}
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-zinc-950 overflow-hidden">
            {heroImage ? (
              <img
                src={heroImage}
                alt={profile.stage_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-zinc-500 font-extrabold text-5xl">
                {initials}
              </div>
            )}

            {profile.is_verified && (
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-blue-600 shadow-sm backdrop-blur-sm">
                  ✓ Verified Artist
                </span>
              </div>
            )}
          </div>

          {/* Card Info Details */}
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-wide">
                {profile.stage_name}
              </h1>

              {/* Share Icon Button */}
              <ShareArtistButton title={profile.stage_name} />
            </div>

            {/* Category with Person Icon */}
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 font-medium">
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="capitalize">{profile.category}</span>
              {profile.city && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>{profile.city}</span>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-5" />

            {/* Pricing / Client Check Callout matching Screenshot 2 */}
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/login?redirectTo=/artists/${profile.slug}`}
                className="text-sm sm:text-base font-semibold text-gray-800 hover:text-blue-600 transition-colors"
              >
                Login as Client to check prices!
              </Link>

              {/* Circular Info Icon */}
              <Link
                href={`/login?redirectTo=/artists/${profile.slug}`}
                className="w-6 h-6 rounded-full border-2 border-blue-400 text-blue-500 hover:border-blue-600 flex items-center justify-center text-xs font-bold transition-colors"
                title="Login to view rates and booking fees"
              >
                ℹ
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION: ABOUT matching Screenshots 2 & 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-4">
            About
          </h2>

          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {/* Genre */}
            <div className="p-4 sm:p-5 flex items-start gap-3.5">
              <span className="text-2xl flex-shrink-0" aria-hidden="true">
                🎶
              </span>
              <div>
                <span className="block text-sm font-bold text-gray-900">
                  Genre -
                </span>
                <span className="text-sm text-gray-600 leading-relaxed mt-0.5 block">
                  {genreList}
                </span>
              </div>
            </div>

            {/* Event */}
            <div className="p-4 sm:p-5 flex items-start gap-3.5">
              <span className="text-2xl flex-shrink-0" aria-hidden="true">
                📅
              </span>
              <div>
                <span className="block text-sm font-bold text-gray-900">
                  Event -
                </span>
                <span className="text-sm text-gray-600 leading-relaxed mt-0.5 block">
                  {eventList}
                </span>
              </div>
            </div>

            {/* Instruments */}
            <div className="p-4 sm:p-5 flex items-start gap-3.5">
              <span className="text-2xl flex-shrink-0" aria-hidden="true">
                🎸
              </span>
              <div>
                <span className="block text-sm font-bold text-gray-900">
                  Instruments -
                </span>
                <span className="text-sm text-gray-600 leading-relaxed mt-0.5 block">
                  {instrumentList}
                </span>
              </div>
            </div>

            {/* Languages */}
            <div className="p-4 sm:p-5 flex items-start gap-3.5">
              <span className="text-2xl flex-shrink-0" aria-hidden="true">
                🗣️
              </span>
              <div>
                <span className="block text-sm font-bold text-gray-900">
                  Languages -
                </span>
                <span className="text-sm text-gray-600 leading-relaxed mt-0.5 block">
                  {languageList}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: BIO PARAGRAPH matching Screenshot 4 */}
        {profile.bio && (
          <section className="mb-10">
            <div className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </div>
          </section>
        )}

        {/* SECTION: GALLERY matching Screenshots 4 & 5 */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Gallery
            </h2>
            <span className="text-xs text-gray-400 font-semibold">
              {portfolio.length} item{portfolio.length === 1 ? "" : "s"}
            </span>
          </div>

          {portfolio.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-xs font-semibold">
              Performance media and videos will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {portfolio.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs flex flex-col group"
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    {item.media_type === "youtube" ? (
                      <iframe
                        src={item.media_url}
                        title={item.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : item.media_type === "image" ? (
                      <img
                        src={item.media_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 text-center text-xs text-white">
                        <a
                          href={item.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-300 font-semibold"
                        >
                          🎵 Listen to Audio Performance Track ↗
                        </a>
                      </div>
                    )}
                  </div>

                  {item.title && (
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-gray-900 truncate">
                        {item.title}
                      </h4>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION: ARTIST TERMS AND CONDITION matching Screenshot 5 */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-4">
            Artist Terms And Condition
          </h2>

          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm divide-y divide-gray-100 overflow-hidden">
            <div className="p-4 sm:p-5 text-sm text-gray-700 leading-relaxed">
              PA system: Speakers, amplifiers, and mixers for sound.
            </div>

            <div className="p-4 sm:p-5 text-sm text-gray-700 leading-relaxed">
              Monitors: Stage monitors for band members.
            </div>

            <div className="p-4 sm:p-5 text-sm text-gray-700 leading-relaxed">
              Microphones: For vocals and instruments (with stands).
            </div>

            <div className="p-4 sm:p-5 text-sm text-gray-700 leading-relaxed">
              Instruments: Drums set required on stage.
            </div>

            <div className="p-4 sm:p-5 text-sm text-gray-700 leading-relaxed">
              Power supply: Adequate outlets and extension cords.
            </div>

            <div className="p-4 sm:p-5 text-sm text-gray-700 leading-relaxed">
              Air travel to venue: Flight arrangements for the band and crew.
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

function ProfileLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center text-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 font-semibold">Loading artist profile...</p>
      </div>
    </div>
  );
}

export default async function PublicArtistProfilePage({ params }: PageProps) {
  await connection();
  const currentUser = await getCurrentUser();

  return (
    <>
      <Navbar initialUser={currentUser} />
      <Suspense fallback={<ProfileLoadingSkeleton />}>
        <ArtistProfileContent params={params} />
      </Suspense>
      <Footer />
    </>
  );
}
