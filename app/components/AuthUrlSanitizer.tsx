"use client";

import { useEffect } from "react";

const TOKEN_HASH_KEYS = new Set([
  "access_token",
  "refresh_token",
  "provider_token",
  "provider_refresh_token",
  "expires_in",
  "expires_at",
  "token_type",
]);

const TOKEN_QUERY_KEYS = [
  "access_token",
  "refresh_token",
  "provider_token",
  "provider_refresh_token",
];

/**
 * Removes any bearer tokens or session credentials from browser URLs on mount
 * without consuming them into an active session. Prevents accidental token leakage
 * when copying or sharing links from the address bar or email redirects.
 */
export default function AuthUrlSanitizer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentUrl = new URL(window.location.href);
    let modified = false;

    for (const key of TOKEN_QUERY_KEYS) {
      if (currentUrl.searchParams.has(key)) {
        currentUrl.searchParams.delete(key);
        modified = true;
      }
    }

    if (currentUrl.hash && currentUrl.hash.length > 1) {
      const hashParams = new URLSearchParams(currentUrl.hash.slice(1));
      const hasAuthFragment = Array.from(hashParams.keys()).some((k) =>
        TOKEN_HASH_KEYS.has(k)
      );
      if (hasAuthFragment) {
        currentUrl.hash = "";
        modified = true;
      }
    }

    if (modified) {
      window.history.replaceState(
        window.history.state,
        "",
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
      );
    }
  }, []);

  return null;
}
