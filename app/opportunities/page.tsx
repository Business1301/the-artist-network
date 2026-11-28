import { connection } from "next/server";
import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OpportunitiesClient from "../components/OpportunitiesClient";
import { getCurrentUser } from "@/app/auth/actions";
import {
  getArtistBusinessGigsAction,
  getArtistEligibilityAction,
} from "@/app/actions/businessGigs";
import type { ArtistEligibilityState, ArtistVisibleGig } from "@/lib/gigs/types";

export const instant = false;

export const metadata: Metadata = {
  title: "Opportunities & Business Gigs | The Artist Network",
  description: "Explore creative opportunities and private Artist gig listings across India.",
  robots: { index: false, follow: false },
};

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await connection();
  const [currentUser, sp] = await Promise.all([getCurrentUser(), searchParams]);

  const initialTab = sp?.tab === "business-gigs" ? "business-gigs" : "curated";

  const viewerState: "unauthenticated" | "non_artist" | "artist" = !currentUser
    ? "unauthenticated"
    : currentUser.role === "artist"
    ? "artist"
    : "non_artist";

  let initialBusinessGigs: ArtistVisibleGig[] = [];
  let initialEligibility: ArtistEligibilityState | null = null;
  let initialGigsError: string | null = null;

  // Strictly fetch private Business Gigs ONLY when DB-verified role === "artist"
  if (viewerState === "artist") {
    const [gigsRes, eligRes] = await Promise.all([
      getArtistBusinessGigsAction({}),
      getArtistEligibilityAction(),
    ]);
    if (gigsRes.success && gigsRes.data) {
      initialBusinessGigs = gigsRes.data;
    } else {
      initialGigsError = gigsRes.error || "Unable to fetch business gigs.";
    }
    if (eligRes.success && eligRes.data) {
      initialEligibility = eligRes.data;
    }
  }

  return (
    <>
      <Navbar initialUser={currentUser} />
      <OpportunitiesClient
        initialTab={initialTab}
        viewerState={viewerState}
        viewerRoleLabel={currentUser?.role}
        initialBusinessGigs={initialBusinessGigs}
        initialEligibility={initialEligibility}
        initialGigsError={initialGigsError}
      />
      <Footer user={currentUser} />
    </>
  );
}
