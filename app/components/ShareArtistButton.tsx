"use client";

import { useState } from "react";

interface ShareArtistButtonProps {
  title: string;
}

export default function ShareArtistButton({ title }: ShareArtistButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    // Copy strictly canonical origin + path without query strings or hash fragments
    const url = `${window.location.origin}${window.location.pathname}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} | The Artist Network`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard if share was cancelled or dismissed
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // In case clipboard permission is denied
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleShare}
        className="p-1.5 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
        title="Share artist profile"
        aria-label="Share profile"
      >
        <svg
          className="w-5 h-5 fill-none stroke-current"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>

      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-zinc-900 text-white text-[11px] font-semibold whitespace-nowrap shadow-md animate-fadeIn">
          Link copied!
        </span>
      )}
    </div>
  );
}

