"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface DirectoryFiltersProps {
  categories: string[];
  cities: string[];
  totalResults: number;
}

const PRICE_RANGES = [
  { label: "Any Budget", value: "all" },
  { label: "Under ₹15,000", value: "under15k" },
  { label: "₹15,000 – ₹35,000", value: "15k-35k" },
  { label: "₹35,000 – ₹75,000", value: "35k-75k" },
  { label: "₹75,000+", value: "above75k" },
];

const SORT_OPTIONS = [
  { label: "Recommended (Verified First)", value: "recommended" },
  { label: "Price: Low to High", value: "price_low_high" },
  { label: "Price: High to Low", value: "price_high_low" },
  { label: "Newest Joined", value: "newest" },
];

export default function DirectoryFilters({
  categories,
  cities,
  totalResults,
}: DirectoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // URL-driven state
  const currentQuery = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "all";
  const currentCity = searchParams.get("city") || "all";
  const currentPrice = searchParams.get("price") || "all";
  const currentSort = searchParams.get("sortBy") || "recommended";

  // Modals state for city picker & filter drawer
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Local state for debounced keyword input
  const [searchInput, setSearchInput] = useState(currentQuery);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (!value || value === "all" || value === "All Categories" || value === "All Locations") {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      params.delete("page");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition]
  );

  const lastPushedQuery = useRef(currentQuery);
  useEffect(() => {
    if (currentQuery !== lastPushedQuery.current) {
      lastPushedQuery.current = currentQuery;
      setSearchInput(currentQuery);
    }
  }, [currentQuery]);

  useEffect(() => {
    if (searchInput === currentQuery) return;

    const timer = setTimeout(() => {
      lastPushedQuery.current = searchInput.trim();
      updateFilter("q", searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, currentQuery, updateFilter]);

  const handleReset = () => {
    lastPushedQuery.current = "";
    setSearchInput("");
    setCityModalOpen(false);
    setFilterModalOpen(false);
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const activeFiltersCount = [
    currentCategory !== "all",
    currentPrice !== "all",
    currentSort !== "recommended",
  ].filter(Boolean).length;

  return (
    <div className="w-full mb-8">
      {/* 1. Search Artist Input matching Screenshot 1 */}
      <div className="relative w-full max-w-xl mx-auto mb-3">
        <div className="flex items-center rounded-xl border border-gray-300 bg-white px-4 py-3 shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search Artist"
            className="w-full bg-transparent text-sm sm:text-base text-gray-900 placeholder-gray-400 outline-none"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateFilter("q", "");
              }}
              className="text-gray-400 hover:text-gray-600 text-sm font-bold mr-2"
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : null}
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* 2. Action Pill Buttons matching Screenshot 1 */}
      <div className="flex items-center justify-center gap-3 max-w-xl mx-auto">
        {/* City Pill Button */}
        <button
          type="button"
          onClick={() => setCityModalOpen(true)}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <svg
            className="w-4 h-4 text-white flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M14.5 9.5l-5 2 2 5 3-7z"
            />
          </svg>
          <span className="truncate">
            {currentCity === "all" ? "All Cities" : currentCity}
          </span>
        </button>

        {/* Filter Pill Button */}
        <button
          type="button"
          onClick={() => setFilterModalOpen(true)}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold text-sm shadow-xs transition-all relative"
        >
          <svg
            className="w-4 h-4 text-gray-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span>Filter</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Quick Reset if filters active */}
        {(currentCity !== "all" || currentCategory !== "all" || currentQuery || currentPrice !== "all") && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-gray-500 hover:text-gray-900 underline font-medium px-2 py-2"
          >
            Reset
          </button>
        )}
      </div>

      {/* Results Count bar */}
      <div className="max-w-xl mx-auto mt-3 text-center text-xs text-gray-400 font-medium">
        Showing {totalResults} artist{totalResults === 1 ? "" : "s"}
      </div>

      {/* CITY SELECTION MODAL */}
      {cityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>🧭</span> Select City
              </h3>
              <button
                type="button"
                onClick={() => setCityModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-1 divide-y divide-gray-50 flex-1">
              <button
                type="button"
                onClick={() => {
                  updateFilter("city", "all");
                  setCityModalOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                  currentCity === "all"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>All Cities (Pan India)</span>
                {currentCity === "all" && <span>✓</span>}
              </button>

              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    updateFilter("city", city);
                    setCityModalOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                    currentCity === city
                      ? "bg-blue-50 text-blue-600 font-bold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{city}</span>
                  {currentCity === city && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FILTER DRAWER / MODAL */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>⚙️</span> Filter &amp; Sort
              </h3>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-5 flex-1 text-left">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Category
                </label>
                <select
                  value={currentCategory}
                  onChange={(e) => updateFilter("category", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 outline-none focus:bg-white focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Budget / Fee Range
                </label>
                <select
                  value={currentPrice}
                  onChange={(e) => updateFilter("price", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 outline-none focus:bg-white focus:border-blue-500 transition-colors"
                >
                  {PRICE_RANGES.map((tier) => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Sort By
                </label>
                <select
                  value={currentSort}
                  onChange={(e) => updateFilter("sortBy", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 outline-none focus:bg-white focus:border-blue-500 transition-colors"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
              >
                Clear All
              </button>

              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
