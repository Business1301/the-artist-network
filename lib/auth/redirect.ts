/**
 * Validates that a redirect path is a safe, relative internal path.
 * Defends against open redirects, protocol-relative URLs (//evil.com),
 * backslashes (/\evil.com), and unauthorized admin path redirects.
 */
export function getSafeRedirectPath(
  requestedPath: string | undefined | null,
  role: string
): string {
  const defaultPath =
    role === "admin"
      ? "/admin"
      : role === "business"
      ? "/dashboard/restaurant"
      : role === "individual"
      ? "/dashboard/client"
      : "/dashboard/artist";

  if (!requestedPath || typeof requestedPath !== "string") {
    return defaultPath;
  }

  const trimmed = requestedPath.trim();

  // Must begin with single forward slash and must not contain //, \, control characters, or cross-origin ambiguity
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    /[\x00-\x1f\x7f]/.test(trimmed)
  ) {
    return defaultPath;
  }

  try {
    const resolved = new URL(trimmed, "https://artist-net-v1.netlify.app");
    if (resolved.origin !== "https://artist-net-v1.netlify.app") {
      return defaultPath;
    }
  } catch {
    return defaultPath;
  }

  // Prevent unauthorized redirection to /admin or subpaths for non-admins
  if (trimmed === "/admin" || trimmed.startsWith("/admin/")) {
    if (role !== "admin") {
      return defaultPath;
    }
  }

  return trimmed;
}

