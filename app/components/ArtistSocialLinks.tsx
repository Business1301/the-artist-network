"use client";

import { validateInstagramUrl, validateYouTubeUrl } from "@/lib/utils/socialUrls";

interface ArtistSocialLinksProps {
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  stageName?: string;
  size?: "sm" | "md";
  className?: string;
}

export default function ArtistSocialLinks({
  instagramUrl,
  youtubeUrl,
  stageName,
  size = "sm",
  className = "",
}: ArtistSocialLinksProps) {
  const igValidation = validateInstagramUrl(instagramUrl);
  const ytValidation = validateYouTubeUrl(youtubeUrl);

  const cleanIg = igValidation.isValid ? igValidation.normalized : null;
  const cleanYt = ytValidation.isValid ? ytValidation.normalized : null;

  // If neither valid link exists, render nothing
  if (!cleanIg && !cleanYt) {
    return null;
  }

  const isSmall = size === "sm";

  // Dimension classes
  const buttonCls = isSmall
    ? "w-7 h-7 sm:w-7 sm:h-7 rounded-lg text-gray-500 hover:text-gray-900 border border-gray-200/90 bg-white shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
    : "w-8 h-8 sm:w-9 sm:h-9 rounded-full text-gray-600 hover:text-gray-950 border border-gray-200/90 bg-white hover:bg-gray-50 shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1";

  const iconCls = isSmall ? "w-3.5 h-3.5" : "w-4 h-4 sm:w-4.5 sm:h-4.5";

  const artistPrefix = stageName ? `${stageName}'s ` : "";

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label={`${stageName ? `${stageName} ` : ""}Social Links`}
    >
      {/* Instagram Link */}
      {cleanIg && (
        <a
          href={cleanIg}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={`Visit ${artistPrefix}Instagram profile`}
          aria-label={`Visit ${artistPrefix}Instagram profile (opens in new tab)`}
          className={`${buttonCls} hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50/60`}
        >
          <svg
            className={iconCls}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={2.5} />
          </svg>
        </a>
      )}

      {/* YouTube Link */}
      {cleanYt && (
        <a
          href={cleanYt}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={`Visit ${artistPrefix}YouTube channel`}
          aria-label={`Visit ${artistPrefix}YouTube channel (opens in new tab)`}
          className={`${buttonCls} hover:text-red-600 hover:border-red-300 hover:bg-red-50/60`}
        >
          <svg
            className={iconCls}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </a>
      )}
    </div>
  );
}
