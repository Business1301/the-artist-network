import { requireArtist } from "@/lib/auth/artist";

/**
 * Server-side layout gate for all /dashboard/artist routes.
 * requireArtist() runs on every request before any child page renders,
 * blocking unauthenticated and non-artist accounts server-side.
 * Covers both /dashboard/artist and /dashboard/artist/edit automatically.
 */
export const instant = false;

export default async function ArtistDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireArtist();
  return <>{children}</>;
}

