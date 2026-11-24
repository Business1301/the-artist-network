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

  // Must begin with single forward slash and must not contain //, \, or control characters
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("\0")
  ) {
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

