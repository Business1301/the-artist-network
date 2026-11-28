import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ArtistBusinessGigsBoard from "@/app/components/gigs/ArtistBusinessGigsBoard";
import ArtistGigDetailClient from "@/app/components/gigs/ArtistGigDetailClient";
import { getCurrentUser } from "@/app/auth/actions";
import {
  getArtistBusinessGigDetailAction,
  getArtistEligibilityAction,
} from "@/app/actions/businessGigs";

export const instant = false;

// Static generic metadata ONLY — never query DB or reveal gig titles to crawlers
export const metadata: Metadata = {
  title: "Business Gig Details | The Artist Network",
  description: "Artist-only business gig details on The Artist Network.",
  robots: { index: false, follow: false },
};

export default async function BusinessGigDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const [currentUser, { id }] = await Promise.all([getCurrentUser(), params]);

  // Fail closed BEFORE checking gig existence (no UUID oracle for anon/non-artists)
  if (!currentUser) {
    return (
      <>
        <Navbar initialUser={null} />
        <main className="min-h-screen bg-gray-50 pt-24 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <ArtistBusinessGigsBoard
              viewerState="unauthenticated"
              loginRedirectPath={`/opportunities/business-gigs/${id}`}
            />
          </div>
        </main>
        <Footer user={null} />
      </>
    );
  }

  if (currentUser.role !== "artist") {
    return (
      <>
        <Navbar initialUser={currentUser} />
        <main className="min-h-screen bg-gray-50 pt-24 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <ArtistBusinessGigsBoard
              viewerState="non_artist"
              viewerRoleLabel={currentUser.role}
            />
          </div>
        </main>
        <Footer user={currentUser} />
      </>
    );
  }

  const [detailRes, eligRes] = await Promise.all([
    getArtistBusinessGigDetailAction(id),
    getArtistEligibilityAction(),
  ]);

  const gig = detailRes.success ? detailRes.data ?? null : null;
  const eligibility = eligRes.success ? eligRes.data ?? null : null;

  if (!gig) {
    return (
      <>
        <Navbar initialUser={currentUser} />
        <main className="min-h-screen bg-gray-50 pt-24 pb-20">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-4 shadow-xs">
              <h1 className="text-xl font-extrabold text-gray-900">
                Gig Not Found or No Longer Available
              </h1>
              <p className="text-xs text-gray-500">
                {!detailRes.success
                  ? detailRes.error || "Unable to load gig details."
                  : "This business gig may have been closed, removed, or the link is invalid."}
              </p>
              <Link
                href="/opportunities/business-gigs"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
              >
                ← Return to Business Gigs
              </Link>
            </div>
          </div>
        </main>
        <Footer user={currentUser} />
      </>
    );
  }

  return (
    <>
      <Navbar initialUser={currentUser} />
      <ArtistGigDetailClient initialGig={gig} eligibility={eligibility} />
      <Footer user={currentUser} />
    </>
  );
}
