import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface PublicArtistSummary {
  id: string;
  stage_name: string;
  slug: string;
  category: string;
  city: string;
  state: string | null;
  country: string;
  bio: string | null;
  experience_years: number;
  genres: string[];
  specialities: string[];
  starting_price: number | null;
  pricing_unit: string;
  profile_image_url: string | null;
  cover_image_url: string | null;
  is_verified: boolean;
}

export interface ArtistDiscoveryFilters {
  query?: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "recommended" | "price_low_high" | "price_high_low" | "newest";
  page?: number;
  pageSize?: number;
}

export interface ArtistDiscoveryResult {
  artists: PublicArtistSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Columns explicitly selected for public discovery (Zero sensitive/private data)
const PUBLIC_ARTIST_FIELDS = `
  id,
  stage_name,
  slug,
  category,
  city,
  state,
  country,
  bio,
  experience_years,
  genres,
  specialities,
  starting_price,
  pricing_unit,
  profile_image_url,
  cover_image_url,
  is_verified
`;

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 4000, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs);
  });
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timer!)),
    timeoutPromise,
  ]);
}

/**
 * Server-only data access function for discovering published artists.
 * Strictly queries rows with profile_status = 'published'.
 * Handles database-side filtering, case-insensitive keyword search, sorting, and pagination.
 */
export async function getPublishedArtists(
  filters: ArtistDiscoveryFilters = {}
): Promise<ArtistDiscoveryResult> {
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(24, Math.max(1, Number(filters.pageSize) || 9));
  const sortBy = filters.sortBy || "recommended";

  if (!isSupabaseConfigured()) {
    return {
      artists: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  const supabase = await createClient();

  // 1. Base query: Strictly limit to published profiles only
  let query = supabase
    .from("artist_profiles")
    .select(PUBLIC_ARTIST_FIELDS, { count: "exact" })
    .eq("profile_status", "published");

  // 2. Keyword Search across stage_name, bio, category, genres, and specialities
  if (filters.query?.trim()) {
    // Sanitize PostgREST structural delimiters (commas, parentheses, quotes, wildcards)
    // Preserves legitimate terms with apostrophes (D'Souza), hyphens (Semi-Classical), ampersands (Rock & Roll), plus (100+)
    const clean = filters.query.trim().replace(/[,()%"\\]/g, "");
    if (clean) {
      const titleClean = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
      // Combine ilike for text fields and array contains (.cs.) for genres & specialities
      query = query.or(
        `stage_name.ilike.%${clean}%,bio.ilike.%${clean}%,category.ilike.%${clean}%,genres.cs.{"${clean}"},genres.cs.{"${titleClean}"},specialities.cs.{"${clean}"},specialities.cs.{"${titleClean}"}`
      );
    }
  }

  // 3. Category Filter
  if (
    filters.category?.trim() &&
    filters.category.trim() !== "All Categories" &&
    filters.category.trim() !== "all"
  ) {
    query = query.ilike("category", `%${filters.category.trim()}%`);
  }

  // 4. City Location Filter
  if (
    filters.city?.trim() &&
    filters.city.trim() !== "All Locations" &&
    filters.city.trim() !== "All Cities" &&
    filters.city.trim() !== "all"
  ) {
    query = query.ilike("city", `%${filters.city.trim()}%`);
  }

  // 5. Price Range Filters
  if (typeof filters.minPrice === "number" && filters.minPrice > 0) {
    query = query.gte("starting_price", filters.minPrice);
  }
  if (typeof filters.maxPrice === "number" && filters.maxPrice > 0) {
    query = query.lte("starting_price", filters.maxPrice);
  }

  // 6. Sorting Order
  switch (sortBy) {
    case "price_low_high":
      query = query
        .order("starting_price", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
    case "price_high_low":
      query = query
        .order("starting_price", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "recommended":
    default:
      // Verified artists first, then most recently joined
      query = query
        .order("is_verified", { ascending: false })
        .order("created_at", { ascending: false });
      break;
  }

  // 7. Database Pagination (LIMIT & OFFSET)
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const fallbackResult = { data: null, count: 0, error: null } as unknown as Awaited<typeof query>;
  const { data, count, error } = await withTimeout(
    query,
    4000,
    fallbackResult
  );

  if (error) {
    console.error("Error fetching published artists:", error.message);
    return {
      artists: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    artists: (data as PublicArtistSummary[]) || [],
    totalCount,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Retrieve unique categories and cities currently available among published artists.
 * Used to dynamically populate filter dropdowns and pills.
 */
export async function getPublishedCategoriesAndCities(): Promise<{
  categories: string[];
  cities: string[];
}> {
  if (!isSupabaseConfigured()) {
    return { categories: [], cities: [] };
  }

  const supabase = await createClient();
  const query = supabase
    .from("artist_profiles")
    .select("category, city")
    .eq("profile_status", "published");

  const { data, error } = await withTimeout(
    query,
    4000,
    { data: null, error: null } as unknown as Awaited<typeof query>
  );

  if (error || !data) {
    return { categories: [], cities: [] };
  }

  const categories = Array.from(new Set(data.map((d) => d.category).filter(Boolean))).sort();
  const cities = Array.from(new Set(data.map((d) => d.city).filter(Boolean))).sort();

  return { categories, cities };
}

