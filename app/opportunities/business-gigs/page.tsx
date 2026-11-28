import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ArtistBusinessGigsBoard from "@/app/components/gigs/ArtistBusinessGigsBoard";
import { getCurrentUser } from "@/app/auth/actions";
import {
  getArtistBusinessGigsAction,
  getArtistEligibilityAction,
} from "@/app/actions/businessGigs";
import type { ArtistEligibilityState, ArtistVisibleGig } from "@/lib/gigs/types";

export const instant = false;

export const metadata: Metadata = {
  title: "Business Gigs for Artists | The Artist Network",
  description: "Artist-only live gig board from restaurants, hospitality venues, and event businesses.",
  robots: { index: false, follow: false },
};

export default async function BusinessGigsPage() {
  await connection();
  const currentUser = await getCurrentUser();

  const viewerState: "unauthenticated" | "non_artist" | "artist" = !currentUser
    ? "unauthenticated"
    : currentUser.role === "artist"
    ? "artist"
    : "non_artist";

  let initialGigs: ArtistVisibleGig[] = [];
  let initialEligibility: ArtistEligibilityState | null = null;
  let loadError: string | null = null;

  // Strictly block gig data fetches unless verified DB role === "artist"
  if (viewerState === "artist") {
    const [gigsRes, eligRes] = await Promise.all([
      getArtistBusinessGigsAction({}),
      getArtistEligibilityAction(),
    ]);
    if (gigsRes.success && gigsRes.data) {
      initialGigs = gigsRes.data;
    } else {
      loadError = gigsRes.error || "Unable to load business gigs.";
    }
    if (eligRes.success && eligRes.data) {
      initialEligibility = eligRes.data;
    }
  }

  return (
    <>
      <Navbar initialUser={currentUser} />
      <main className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <Link
                href="/opportunities"
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 inline-block mb-2"
              >
                ← Back to Opportunities
              </Link>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
                  Business Gigs
                </h1>
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Artist Only
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1.5">
                Direct performance openings published by businesses and hospitality venues across India.
              </p>
            </div>
          </div>

          <ArtistBusinessGigsBoard
            viewerState={viewerState}
            viewerRoleLabel={currentUser?.role}
            initialGigs={initialGigs}
            initialEligibility={initialEligibility}
            initialLoadError={loadError}
            loginRedirectPath="/opportunities/business-gigs"
          />
        </div>
      </main>
      <Footer user={currentUser} />
    </>
  );
}
