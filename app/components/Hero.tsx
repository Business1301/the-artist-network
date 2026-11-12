import Link from "next/link";
import SearchBar from "./SearchBar";
import type { CurrentUser } from "@/app/auth/actions";

interface HeroProps {
  user?: CurrentUser | null;
}

export default function Hero({ user }: HeroProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-900 pt-16">

      {/* Decorative background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      {/* Decorative floating icons — visual only, hidden from screen readers */}
      <div className="absolute top-28 left-[8%] text-4xl opacity-20 rotate-12 select-none hidden lg:block" aria-hidden="true">🎸</div>
      <div className="absolute top-40 right-[10%] text-4xl opacity-20 -rotate-12 select-none hidden lg:block" aria-hidden="true">🎨</div>
      <div className="absolute bottom-36 left-[15%] text-3xl opacity-20 rotate-6 select-none hidden lg:block" aria-hidden="true">🎤</div>
      <div className="absolute bottom-44 right-[12%] text-3xl opacity-20 -rotate-6 select-none hidden lg:block" aria-hidden="true">💃</div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-purple-200 text-sm font-medium px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
          India&apos;s Creative Marketplace
        </div>

        {/* Main Headline — per PROJECT_PLAN.md §5.2 */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
          Where Talent Meets{" "}
          <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
            Opportunity.
          </span>
        </h1>

        {/* Supporting copy — per PROJECT_PLAN.md §5.2 */}
        <p className="text-lg sm:text-xl text-purple-200 max-w-2xl mx-auto mb-10 leading-relaxed">
          Discover incredible artists, connect with creative talent and turn
          artistic passion into real opportunities.
        </p>

        {/* Hero CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link
            href="/artists"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 transition-all inline-block"
          >
            Discover Artists
          </Link>
          {user ? (
            user.role === "artist" ? (
              <Link
                href="/dashboard/artist"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-bold text-base rounded-full hover:bg-white/20 hover:scale-105 transition-all inline-block"
              >
                Artist Dashboard
              </Link>
            ) : user.role === "business" ? (
              <Link
                href="/dashboard/restaurant"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-bold text-base rounded-full hover:bg-white/20 hover:scale-105 transition-all inline-block"
              >
                Business Dashboard
              </Link>
            ) : (
              <Link
                href="/admin"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-bold text-base rounded-full hover:bg-white/20 hover:scale-105 transition-all inline-block"
              >
                Admin Dashboard
              </Link>
            )
          ) : (
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-bold text-base rounded-full hover:bg-white/20 hover:scale-105 transition-all inline-block"
            >
              Join as an Artist
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <SearchBar />
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 80L60 72C120 64 240 48 360 44C480 40 600 48 720 52C840 56 960 56 1080 50C1200 44 1320 32 1380 26L1440 20V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
