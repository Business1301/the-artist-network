/**
 * Utility functions for validating, normalizing, and safely formatting social media URLs.
 * Strictly enforces HTTPS and approved domain lists to protect against XSS/phishing.
 */

export interface SocialUrlValidationResult {
  isValid: boolean;
  normalized: string | null;
  error?: string;
}

/**
 * Validate an Instagram URL.
 * Permitted: empty/null, or https://(www.)instagram.com/<handle> or https://(www.)instagr.am/<handle>
 */
export function validateInstagramUrl(rawUrl?: string | null): SocialUrlValidationResult {
  if (!rawUrl || !rawUrl.trim()) {
    return { isValid: true, normalized: null };
  }

  const trimmed = rawUrl.trim();

  // Guard against dangerous schemes
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) {
    return {
      isValid: false,
      normalized: null,
      error: "Unsafe URL scheme detected. Only secure HTTPS links are allowed.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      normalized: null,
      error: "Please enter a valid Instagram URL (e.g., https://instagram.com/yourhandle).",
    };
  }

  if (parsed.protocol !== "https:") {
    return {
      isValid: false,
      normalized: null,
      error: "Instagram URL must start with https://",
    };
  }

  const host = parsed.hostname.toLowerCase();
  const validInstagramHosts = [
    "instagram.com",
    "www.instagram.com",
    "instagr.am",
    "www.instagr.am",
  ];

  if (!validInstagramHosts.includes(host)) {
    return {
      isValid: false,
      normalized: null,
      error: "URL must be from instagram.com (e.g., https://instagram.com/yourhandle).",
    };
  }

  // Pathname must have a non-empty handle
  const cleanPath = parsed.pathname.replace(/^\/+|\/+$/g, "");
  if (!cleanPath) {
    return {
      isValid: false,
      normalized: null,
      error: "Please provide an Instagram profile handle (e.g., https://instagram.com/yourhandle).",
    };
  }

  // Normalized HTTPS URL
  const normalized = `https://${host}/${cleanPath}${parsed.search}`;
  return { isValid: true, normalized };
}

/**
 * Validate a YouTube URL.
 * Permitted: empty/null, or https://(www.|m.|music.)youtube.com/... or https://youtu.be/...
 */
export function validateYouTubeUrl(rawUrl?: string | null): SocialUrlValidationResult {
  if (!rawUrl || !rawUrl.trim()) {
    return { isValid: true, normalized: null };
  }

  const trimmed = rawUrl.trim();

  // Guard against dangerous schemes
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) {
    return {
      isValid: false,
      normalized: null,
      error: "Unsafe URL scheme detected. Only secure HTTPS links are allowed.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      normalized: null,
      error: "Please enter a valid YouTube URL (e.g., https://youtube.com/@yourchannel).",
    };
  }

  if (parsed.protocol !== "https:") {
    return {
      isValid: false,
      normalized: null,
      error: "YouTube URL must start with https://",
    };
  }

  const host = parsed.hostname.toLowerCase();
  const validYouTubeHosts = [
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
    "www.youtu.be",
  ];

  if (!validYouTubeHosts.includes(host)) {
    return {
      isValid: false,
      normalized: null,
      error: "URL must be from youtube.com or youtu.be (e.g., https://youtube.com/@channel).",
    };
  }

  const cleanPath = parsed.pathname.replace(/^\/+|\/+$/g, "");
  if (!cleanPath && !parsed.search) {
    return {
      isValid: false,
      normalized: null,
      error: "Please include a YouTube channel handle or video path.",
    };
  }

  const normalized = `https://${host}/${cleanPath}${parsed.search}`;
  return { isValid: true, normalized };
}

/**
 * Helper to check if an Instagram URL is safe to display.
 */
export function isSafeInstagramUrl(rawUrl?: string | null): boolean {
  return validateInstagramUrl(rawUrl).isValid && !!validateInstagramUrl(rawUrl).normalized;
}

/**
 * Helper to check if a YouTube URL is safe to display.
 */
export function isSafeYouTubeUrl(rawUrl?: string | null): boolean {
  return validateYouTubeUrl(rawUrl).isValid && !!validateYouTubeUrl(rawUrl).normalized;
}
