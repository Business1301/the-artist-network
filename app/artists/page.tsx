import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ArtistCard from "@/app/components/ArtistCard";
import DirectoryFilters from "@/app/components/DirectoryFilters";
import ArtistCTA from "@/app/components/ArtistCTA";
import { getCurrentUser, type CurrentUser } from "@/app/auth/actions";
import {
  getPublishedArtists,
  getPublishedCategoriesAndCities,
  getCurrentArtistStatus,
  ArtistDiscoveryFilters,
  type ArtistCTAStatus,
} from "@/lib/data/artists";
import { DEMO_SHOWCASE_ARTISTS } from "@/lib/data/demoArtists";

export const instant = false;

export const metadata: Metadata = {
  title: "Discover Live Artists & Performers in India | The Artist Network",
  description:
    "Explore verified singers, DJs, live bands, stand-up comedians, and performers across India. Filter by city, budget, and genre to book top talent.",
};

// Fallback baseline lists ensuring filters are populated even before artists are added
const DEFAULT_CATEGORIES = [
  "Singers & Vocalists",
  "DJs & Electronic Music",
  "Live Bands & Instrumentalists",
  "Stand-up Comedians",
  "Dancers & Choreographers",
  "Painters & Visual Artists",
  "Magicians & Illusionists",
  "Anchors & Event Hosts",
  "Classical & Folk Artists",
];

const DEFAULT_CITIES = [
  "Mumbai",
  "Delhi NCR",
  "Bangalore",
  "Pune",
  "Goa",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Jaipur",
];

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
    price?: string;
    sortBy?: "recommended" | "price_low_high" | "price_high_low" | "newest";
    page?: string;
    demo?: string;
  }>;
}

// Convert price slug to numeric range
function parsePriceRange(priceSlug?: string): { minPrice?: number; maxPrice?: number } {
  switch (priceSlug) {
    case "under15k":
      return { maxPrice: 15000 };
    case "15k-35k":
      return { minPrice: 15000, maxPrice: 35000 };
    case "35k-75k":
      return { minPrice: 35000, maxPrice: 75000 };
    case "above75k":
      return { minPrice: 75000 };
    default:
      return {};
  }
}

interface DirectoryContentProps extends PageProps {
  currentUser: CurrentUser | null;
  artistStatus: ArtistCTAStatus | null;
}

async function DirectoryContent({
  searchParams,
  currentUser,
  artistStatus,
}: DirectoryContentProps) {
  await connection();
  const params = await searchParams;

  const { minPrice, maxPrice } = parsePriceRange(params.price);
  const currentPage = Math.max(1, Number(params.page) || 1);
  const pageSize = 9;

  const filters: ArtistDiscoveryFilters = {
    query: params.q,
    category: params.category,
    city: params.city,
    minPrice,
    maxPrice,
    sortBy: params.sortBy || "recommended",
    page: currentPage,
    pageSize,
  };

  // 1 & 2. Fetch live published artists and category/city metadata in parallel
  const [result, meta] = await Promise.all([
    getPublishedArtists(filters),
    getPublishedCategoriesAndCities(),
  ]);

  // Merge database options with defaults (ensuring URL-selected values appear in filters)
  const categoriesSet = new Set([...meta.categories, ...DEFAULT_CATEGORIES]);
  if (params.category && params.category !== "all") {
    categoriesSet.add(params.category);
  }
  const allCategories = Array.from(categoriesSet).sort();

  const citiesSet = new Set([...meta.cities, ...DEFAULT_CITIES]);
  if (params.city && params.city !== "all") {
    citiesSet.add(params.city);
  }
  const allCities = Array.from(citiesSet).sort();

  const isDemoActive = params.demo === "true";
  const hasActiveFilters = Boolean(
    params.q ||
      (params.category && params.category !== "all") ||
      (params.city && params.city !== "all") ||
      (params.price && params.price !== "all") ||
      (params.sortBy && params.sortBy !== "recommended")
  );

  // Determine which list to display
  // Real database records always take precedence
  let displayArtists = result.artists;
  let totalCount = result.totalCount;

  if (isDemoActive) {
    let demoList = [...DEMO_SHOWCASE_ARTISTS];
    if (params.category && params.category !== "all") {
      const catFilter = params.category.toLowerCase();
      demoList = demoList.filter((a) =>
        a.category.toLowerCase().includes(catFilter) ||
        catFilter.includes(a.category.toLowerCase())
      );
    }
    if (params.city && params.city !== "all") {
      const cityFilter = params.city.toLowerCase();
      demoList = demoList.filter((a) =>
        a.city.toLowerCase().includes(cityFilter)
      );
    }
    if (params.q) {
      const q = params.q.toLowerCase();
      demoList = demoList.filter(
        (a) =>
          a.stage_name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          (a.bio && a.bio.toLowerCase().includes(q)) ||
          a.genres.some((g) => g.toLowerCase().includes(q))
      );
    }
    if (minPrice || maxPrice) {
      demoList = demoList.filter((a) => {
        if (!a.starting_price) return false;
        if (minPrice && a.starting_price < minPrice) return false;
        if (maxPrice && a.starting_price > maxPrice) return false;
        return true;
      });
    }
    displayArtists = demoList;
    totalCount = demoList.length;
  }

  // Build pagination links
  const createPageUrl = (pageNumber: number) => {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (params.category && params.category !== "all") p.set("category", params.category);
    if (params.city && params.city !== "all") p.set("city", params.city);
    if (params.price && params.price !== "all") p.set("price", params.price);
    if (params.sortBy && params.sortBy !== "recommended") p.set("sortBy", params.sortBy);
    if (isDemoActive) p.set("demo", "true");
    p.set("page", pageNumber.toString());
    return `/artists?${p.toString()}`;
  };

  return (
    <main className="min-h-screen bg-white pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Compact Clean Header matching Reference */}
        <div className="mb-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            Discover Live Artists
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Book verified singers, DJs, bands, and performers across India
          </p>
        </div>

        {/* Demo Mode Notice Banner (If user toggled demo showcase) */}
        {isDemoActive && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                <strong>Demonstration Showcase Mode:</strong> Showing sample demonstration profiles. These are separate from real database records.
              </span>
            </div>
            <Link
              href="/artists"
              className="text-amber-800 hover:text-amber-950 font-bold underline whitespace-nowrap"
            >
              Switch to Live Database Results →
            </Link>
          </div>
        )}

        {/* Interactive Filter Controller */}
        <DirectoryFilters
          categories={allCategories}
          cities={allCities}
          totalResults={totalCount}
        />

        {/* RESULTS GRID OR EMPTY STATES */}
        {displayArtists.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {displayArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} isDemo={isDemoActive} />
              ))}
            </div>

            {/* Pagination Controls */}
            {result.totalPages > 1 && !isDemoActive && (
              <div className="flex items-center justify-center gap-2 border-t border-gray-200 pt-8">
                <Link
                  href={createPageUrl(Math.max(1, currentPage - 1))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    currentPage <= 1
                      ? "pointer-events-none text-gray-300 border-gray-100"
                      : "text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  ← Previous
                </Link>

                <div className="flex items-center gap-1">
                  {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((pNum) => (
                    <Link
                      key={pNum}
                      href={createPageUrl(pNum)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                        currentPage === pNum
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 border border-transparent"
                      }`}
                    >
                      {pNum}
                    </Link>
                  ))}
                </div>

                <Link
                  href={createPageUrl(Math.min(result.totalPages, currentPage + 1))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    currentPage >= result.totalPages
                      ? "pointer-events-none text-gray-300 border-gray-100"
                      : "text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  Next →
                </Link>
              </div>
            )}
          </div>
        ) : hasActiveFilters ? (
          /* EMPTY STATE B: No results matching current filters */
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-lg mx-auto shadow-sm my-8">
            <div className="text-4xl mb-3" aria-hidden="true">🔍</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No artists match your criteria</h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              We couldn&apos;t find any published artists matching your current search and filter settings. Try clearing keywords, adjusting your budget range, or selecting another category.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/artists"
                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 shadow-sm transition-colors"
              >
                Clear All Filters
              </Link>
              <Link
                href="/artists?demo=true"
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
              >
                View Sample Showcase
              </Link>
            </div>
          </div>
        ) : (
          /* EMPTY STATE A: Zero published artists in database */
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-xl mx-auto shadow-sm my-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-3xl mx-auto mb-4">
              🎨
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Curating Our Artist Roster
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed max-w-md mx-auto">
              Our artist review and curation team is currently reviewing new talent applications. Approved artist profiles will appear here as soon as they are verified and published.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/artists?demo=true"
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                View Demonstration Showcase →
              </Link>
              <Link
                href="/dashboard/artist/edit"
                className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
              >
                Submit Your Artist Profile
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Call to Action */}
        <ArtistCTA
          user={currentUser}
          artistStatus={artistStatus}
          variant="embedded"
          className="mt-16"
        />

      </div>
    </main>
  );
}

function DirectoryLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-64 bg-gray-200 rounded-xl animate-pulse mb-3" />
        <div className="h-4 w-96 bg-gray-200 rounded-lg animate-pulse mb-8" />
        <div className="h-32 bg-white rounded-2xl border border-gray-200 animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-white rounded-2xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}

export default async function ArtistsPage(props: PageProps) {
  await connection();
  const currentUser = await getCurrentUser();
  const artistStatus =
    currentUser?.role === "artist"
      ? await getCurrentArtistStatus(currentUser.id)
      : null;

  return (
    <>
      <Navbar initialUser={currentUser} />
      <Suspense fallback={<DirectoryLoadingSkeleton />}>
        <DirectoryContent
          searchParams={props.searchParams}
          currentUser={currentUser}
          artistStatus={artistStatus}
        />
      </Suspense>
      <Footer />
    </>
  );
}
