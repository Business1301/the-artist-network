import Link from "next/link";

// Section 9: Artist Call to Action per PROJECT_PLAN.md §5.9
export default function ArtistCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 px-6 py-16 sm:px-12 sm:py-20 text-center shadow-2xl">
          
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-block text-purple-300 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-4">
              Are you an artist or performer?
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
              Showcase Your Talent to People Who Want to Hire You
            </h2>
            <p className="text-purple-200 text-base sm:text-lg leading-relaxed mb-8">
              Join The Artist Network to build your professional presence, receive direct enquiries from event organizers and businesses, and grow your artistic career.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 transition-all inline-block"
              >
                Join as an Artist
              </Link>
              <Link
                href="/#how-it-works"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-base rounded-full hover:bg-white/20 transition-all inline-block"
              >
                How It Works for Artists
              </Link>
            </div>

            <p className="mt-6 text-purple-300/80 text-xs">
              Create your free profile, upload your portfolio, and get discovered by clients across India.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
