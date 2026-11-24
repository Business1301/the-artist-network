import Link from "next/link";
import { PublicArtistSummary } from "@/lib/data/artists";
import ArtistSocialLinks from "@/app/components/ArtistSocialLinks";

interface ArtistCardProps {
  artist: PublicArtistSummary;
  isDemo?: boolean;
}

export default function ArtistCard({ artist, isDemo = false }: ArtistCardProps) {
  const profileUrl = `/artists/${artist.slug}`;
  // Prefer profile image for the portrait showcase, fallback to cover image
  const displayImage = artist.profile_image_url || artist.cover_image_url || "";
  const initials = artist.stage_name ? artist.stage_name.slice(0, 2).toUpperCase() : "AN";

  return (
    <div className="group relative block bg-white rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Primary Card Navigation Link covering the whole card */}
      <Link
        href={profileUrl}
        className="absolute inset-0 z-0 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-2xl"
        aria-label={`View ${artist.stage_name}'s full profile`}
      />

      {/* Featured Portrait Media */}
      <div className="relative aspect-[4/5] w-full bg-zinc-900 overflow-hidden pointer-events-none">
        {displayImage ? (
          <img
            src={displayImage}
            alt={artist.stage_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-zinc-400 font-extrabold text-4xl">
            {initials}
          </div>
        )}

        {/* Verification Status Badge Overlay */}
        {!isDemo ? (
          artist.is_verified ? (
            <div className="absolute top-3 left-3 z-10">
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-emerald-700 border border-emerald-200/90 shadow-sm backdrop-blur-sm flex items-center gap-1.5"
                title="Identity verified by platform administration. Platform verification does not guarantee performance, safety, or suitability."
                aria-label="Verified Artist Profile"
              >
                <svg
                  className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Verified Artist</span>
              </span>
            </div>
          ) : (
            <div className="absolute top-3 left-3 z-10">
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/90 text-zinc-600 border border-zinc-200/90 shadow-2xs backdrop-blur-xs flex items-center gap-1.5"
                title="Published community profile — identity verification not requested or pending review."
                aria-label="Unverified Community Profile"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0" aria-hidden="true" />
                <span>Not Verified</span>
              </span>
            </div>
          )
        ) : (
          /* Demo Profile Indicator — Clearly separated from real database verification */
          <div className="absolute top-3 left-3 z-10">
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/95 text-white shadow-sm flex items-center gap-1"
              title="Demonstration showcase profile only — not a real artist."
              aria-label="Demonstration Sample Profile"
            >
              <span>Sample Profile</span>
            </span>
          </div>
        )}
      </div>

      {/* Card Info Body matching Screenshot: bottom-right social icons alongside category & location */}
      <div className="p-4 sm:p-5 flex items-end justify-between gap-3 pointer-events-none">
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-gray-900 text-base sm:text-lg uppercase tracking-wide group-hover:text-purple-600 transition-colors line-clamp-1">
            {artist.stage_name}
          </h3>

          <div className="mt-2.5 space-y-1.5 text-xs sm:text-sm text-gray-500 font-medium">
            {/* Category with Person Icon */}
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="capitalize truncate">{artist.category}</span>
            </div>

            {/* Location with Compass Icon */}
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M14.5 9.5l-5 2 2 5 3-7z"
                />
              </svg>
              <span className="truncate">{artist.city || "India"}</span>
            </div>
          </div>
        </div>

        {/* Social Icons at bottom-right of the white info section */}
        <div className="relative z-10 pointer-events-auto flex-shrink-0 self-end pb-0.5">
          <ArtistSocialLinks
            instagramUrl={artist.instagram_url}
            youtubeUrl={artist.youtube_url}
            stageName={artist.stage_name}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
