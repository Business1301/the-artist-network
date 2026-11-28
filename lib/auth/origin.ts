import type { NextRequest } from "next/server";

export const PRODUCTION_CANONICAL_ORIGIN = "https://artist-net-v1.netlify.app";

const LOOPBACK_HOST_REGEX = /^(localhost|127\.0\.0\.1)(:\d+)?$/i;

/**
 * Resolves the canonical origin for auth callbacks and server-side redirects.
 * Strictly pinned so arbitrary Host, X-Forwarded-Host, Origin, Referer,
 * or untrusted preview subdomains can never hijack redirect destinations.
 */
export function getCanonicalSiteOrigin(request?: NextRequest): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.URL?.trim();

  if (envUrl) {
    try {
      const parsed = new URL(envUrl);
      if (
        parsed.origin === PRODUCTION_CANONICAL_ORIGIN ||
        (parsed.protocol === "http:" && LOOPBACK_HOST_REGEX.test(parsed.host))
      ) {
        return parsed.origin;
      }
    } catch {
      // Ignore malformed env value and fall through safely
    }
  }

  // On Netlify or any non-Netlify production environment unless direct Host is strictly loopback
  const isNetlify = process.env.NETLIFY === "true";
  if (!isNetlify && request) {
    const headerHost = request.headers.get("host")?.split(",")[0]?.trim() || "";
    if (LOOPBACK_HOST_REGEX.test(headerHost)) {
      return `http://${headerHost}`;
    }
    const reqHost = request.nextUrl.host;
    if (LOOPBACK_HOST_REGEX.test(reqHost)) {
      return `http://${reqHost}`;
    }
  }

  return PRODUCTION_CANONICAL_ORIGIN;
}

/**
 * Resolves a canonical origin inside Server Actions without trusting
 * arbitrary Host/Origin/Referer/X-Forwarded-Host domains.
 */
export function getServerActionSiteOrigin(hostHeader?: string | null): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.URL?.trim();

  if (envUrl) {
    try {
      const parsed = new URL(envUrl);
      if (
        parsed.origin === PRODUCTION_CANONICAL_ORIGIN ||
        (parsed.protocol === "http:" && LOOPBACK_HOST_REGEX.test(parsed.host))
      ) {
        return parsed.origin;
      }
    } catch {
      // Ignore malformed env value
    }
  }

  const isNetlify = process.env.NETLIFY === "true";
  const trimmedHost = hostHeader?.trim() || "";
  if (!isNetlify && LOOPBACK_HOST_REGEX.test(trimmedHost)) {
    return `http://${trimmedHost}`;
  }

  return PRODUCTION_CANONICAL_ORIGIN;
}
