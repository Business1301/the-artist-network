import { connection } from "next/server";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ArtistCategories from "./components/ArtistCategories";
import FeaturedArtists from "./components/FeaturedArtists";
import HowItWorks from "./components/HowItWorks";
import DashboardShowcase from "./components/DashboardShowcase";
import OpportunitiesTeaser from "./components/OpportunitiesTeaser";
import ForBusinesses from "./components/ForBusinesses";
import ArtistCTA from "./components/ArtistCTA";
import Footer from "./components/Footer";
import { getCurrentUser } from "./auth/actions";
import { getCurrentArtistStatus } from "@/lib/data/artists";

export const instant = false;

export default async function HomePage() {
  await connection();
  const currentUser = await getCurrentUser();
  const artistStatus =
    currentUser?.role === "artist"
      ? await getCurrentArtistStatus(currentUser.id)
      : null;

  return (
    <>
      {/* 1. Navigation */}
      <Navbar initialUser={currentUser} />

      <main className="flex-1">
        {/* 2 & 3. Hero and Search */}
        <Hero user={currentUser} />

        {/* 4. Browse Categories */}
        <ArtistCategories />

        {/* 5. Featured Artists (Sample Demonstration Data) */}
        <FeaturedArtists />

        {/* 6. How It Works (For Clients & For Artists) */}
        <HowItWorks />

        {/* Interactive Dashboard Showcase for Artists & Restaurants */}
        <DashboardShowcase initialUser={currentUser} />

        {/* 7. Opportunities Teaser */}
        <OpportunitiesTeaser />

        {/* 8. For Businesses & Event Organizers */}
        <ForBusinesses user={currentUser} />

        {/* 9. Artist Call to Action */}
        <ArtistCTA user={currentUser} artistStatus={artistStatus} />
      </main>

      {/* 10. Footer */}
      <Footer user={currentUser} />
    </>
  );
}
