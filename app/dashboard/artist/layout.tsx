import { requireArtist } from "@/lib/auth/artist";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

/**
 * Server-side layout gate for all /dashboard/artist routes.
 * requireArtist() runs on every request before any child page renders,
 * blocking unauthenticated and non-artist accounts server-side.
 * Covers both /dashboard/artist and /dashboard/artist/edit automatically.
 *
 * Renders the verified Navbar and Footer in the layout shell, passing the
 * server-verified artist identity directly as `initialUser` so the navbar
 * displays the authenticated Artist Dashboard badge and Log Out button with
 * zero client-side delay, zero flicker, and never falls back to guest state.
 */
export const instant = false;

export default async function ArtistDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const verifiedArtist = await requireArtist();

  return (
    <>
      <Navbar initialUser={verifiedArtist} />
      {children}
      <Footer />
    </>
  );
}

