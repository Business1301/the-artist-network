"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Canonical categories matching database and directory taxonomy
const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "" },
  { label: "Singers & Vocalists", value: "Singers & Vocalists" },
  { label: "DJs & Electronic Music", value: "DJs & Electronic Music" },
  { label: "Live Bands & Instrumentalists", value: "Live Bands & Instrumentalists" },
  { label: "Dancers & Choreographers", value: "Dancers & Choreographers" },
  { label: "Stand-up Comedians", value: "Stand-up Comedians" },
  { label: "Anchors & Event Hosts", value: "Anchors & Event Hosts" },
  { label: "Painters & Visual Artists", value: "Painters & Visual Artists" },
  { label: "Magicians & Illusionists", value: "Magicians & Illusionists" },
  { label: "Classical & Folk Artists", value: "Classical & Folk Artists" },
];

export default function SearchBar() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (category.trim()) params.set("category", category.trim());
    if (city.trim()) params.set("city", city.trim());

    const qs = params.toString();
    router.push(`/artists${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-2 sm:p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">

          {/* Keyword */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus-within:border-purple-300 focus-within:bg-white transition-colors">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Artist name or keyword"
              className="bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none w-full"
              aria-label="Search by artist name or keyword"
            />
          </div>

          {/* Category */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus-within:border-purple-300 focus-within:bg-white transition-colors">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h8" />
            </svg>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-sm text-gray-600 outline-none w-full cursor-pointer"
              aria-label="Select artist category"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus-within:border-purple-300 focus-within:bg-white transition-colors">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City or location"
              className="bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none w-full"
              aria-label="Enter city or location"
            />
          </div>

          {/* Search Button pointing to /artists */}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-sm rounded-xl hover:opacity-90 hover:scale-[1.02] transition-all shadow-md cursor-pointer"
            aria-label="Search artists directory"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Artists
          </button>
        </div>
      </form>

      {/* Helper link */}
      <p className="text-purple-300/80 text-xs text-center mt-3">
        Looking to browse all artists? Visit the <Link href="/artists" className="underline hover:text-white">Artists Directory</Link> or view <Link href="/categories" className="underline hover:text-white">Categories</Link>.
      </p>
    </div>
  );
}
