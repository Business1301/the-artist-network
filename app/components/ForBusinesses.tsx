import Link from "next/link";
import type { CurrentUser } from "@/app/auth/actions";

const perks = [
  {
    icon: "🏢",
    title: "Corporate Events",
    description: "Find performers for product launches, gala dinners, team events and conferences.",
  },
  {
    icon: "🎪",
    title: "Venues & Spaces",
    description: "Restaurants, lounges and cafés — discover musicians and performers to enhance your ambiance.",
  },
  {
    icon: "📋",
    title: "Event Organizers",
    description: "One platform to source creative talent for festivals, weddings, exhibitions and private events.",
  },
  {
    icon: "🔍",
    title: "Reviewed Profiles",
    description: "Profiles undergo administrative review before publication. Browse portfolios and explore creative talent.",
  },
];

interface ForBusinessesProps {
  user?: CurrentUser | null;
}

export default function ForBusinesses({ user }: ForBusinessesProps) {
  return (
    <section id="for-businesses" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-900 relative overflow-hidden">

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left content */}
          <div>
            <span className="inline-block text-purple-300 font-semibold text-sm uppercase tracking-widest mb-4">
              For Businesses &amp; Organizers
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 leading-tight">
              Find the Right Artist{" "}
              <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                for Every Occasion
              </span>
            </h2>
            <p className="text-purple-200 text-base leading-relaxed mb-8">
              Whether you&apos;re planning a corporate event, setting the mood at a restaurant,
              or producing a festival — The Artist Network gives you direct access
              to creative talent across India.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/artists"
                className="px-7 py-3.5 bg-white text-purple-700 font-bold rounded-full hover:bg-purple-50 hover:scale-105 transition-all text-sm shadow-lg text-center"
              >
                Discover Artists
              </Link>
              {!user && (
                <Link
                  href="/signup?role=business"
                  className="px-7 py-3.5 border border-white/30 text-white font-bold rounded-full hover:bg-white/10 transition-all text-sm text-center"
                >
                  Register as Venue
                </Link>
              )}
              {user?.role === "business" && (
                <Link
                  href="/dashboard/restaurant"
                  className="px-7 py-3.5 border border-white/30 text-white font-bold rounded-full hover:bg-white/10 transition-all text-sm text-center"
                >
                  Venue Dashboard
                </Link>
              )}
              {user?.role === "artist" && (
                <Link
                  href="/dashboard/artist"
                  className="px-7 py-3.5 border border-white/30 text-white font-bold rounded-full hover:bg-white/10 transition-all text-sm text-center"
                >
                  Artist Dashboard
                </Link>
              )}
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="px-7 py-3.5 border border-white/30 text-white font-bold rounded-full hover:bg-white/10 transition-all text-sm text-center"
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Right perks grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 hover:bg-white/15 transition-colors"
              >
                <div className="text-3xl mb-3" aria-hidden="true">{perk.icon}</div>
                <h3 className="text-white font-bold text-base mb-2">{perk.title}</h3>
                <p className="text-purple-200 text-sm leading-relaxed">{perk.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
