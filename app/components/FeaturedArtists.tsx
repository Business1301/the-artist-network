import Link from "next/link";

// ⚠️ SAMPLE DATA — These are demonstration profiles only. Not real artists.
const featuredArtists = [
  {
    id: 1,
    name: "Arjun Sharma",
    category: "Singer",
    speciality: "Bollywood & Sufi",
    location: "Mumbai, MH",
    priceRange: "₹10,000 – ₹25,000",
    emoji: "🎤",
    tags: ["Live Events", "Weddings", "Corporate"],
    avatarBg: "from-rose-400 to-pink-600",
    initials: "AS",
  },
  {
    id: 2,
    name: "Priya Nair",
    category: "DJ",
    speciality: "EDM & Bollywood Fusion",
    location: "Bangalore, KA",
    priceRange: "₹15,000 – ₹40,000",
    emoji: "🎧",
    tags: ["Clubs", "Weddings", "Festivals"],
    avatarBg: "from-violet-400 to-purple-600",
    initials: "PN",
  },
  {
    id: 3,
    name: "Zara Khan",
    category: "Painter",
    speciality: "Abstract & Portrait Art",
    location: "Delhi, DL",
    priceRange: "₹5,000 – ₹50,000",
    emoji: "🎨",
    tags: ["Exhibitions", "Commissions", "Galleries"],
    avatarBg: "from-teal-400 to-emerald-600",
    initials: "ZK",
  },
  {
    id: 4,
    name: "Rohan Mehta",
    category: "Dancer",
    speciality: "Contemporary & Bollywood",
    location: "Pune, MH",
    priceRange: "₹8,000 – ₹20,000",
    emoji: "💃",
    tags: ["Stage Shows", "Weddings", "Workshops"],
    avatarBg: "from-orange-400 to-red-600",
    initials: "RM",
  },
  {
    id: 5,
    name: "Meera Iyer",
    category: "Mural Artist",
    speciality: "Street Art & Murals",
    location: "Chennai, TN",
    priceRange: "₹20,000 – ₹1,00,000",
    emoji: "🖼️",
    tags: ["Cafes", "Offices", "Public Spaces"],
    avatarBg: "from-yellow-400 to-orange-600",
    initials: "MI",
  },
  {
    id: 6,
    name: "Dev Singh",
    category: "Musician",
    speciality: "Classical Guitar & Jazz",
    location: "Hyderabad, TS",
    priceRange: "₹8,000 – ₹30,000",
    emoji: "🎸",
    tags: ["Restaurants", "Lounges", "Events"],
    avatarBg: "from-blue-400 to-indigo-600",
    initials: "DS",
  },
];

export default function FeaturedArtists() {
  return (
    <section id="featured" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-block text-purple-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Featured Talent
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Meet Some of Our Artists
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base">
            A look at the kinds of creative professionals you&apos;ll find on the platform.
          </p>
          {/* Prominent sample data notice — required by PROJECT_PLAN.md §3 principle 10 */}
          <div className="inline-flex items-center gap-2 mt-5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-2 rounded-full">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Demonstration profiles only — not real artists on the platform
          </div>
        </div>

        {/* Artist cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredArtists.map((artist) => (
            <article
              key={artist.id}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-purple-100/50 hover:-translate-y-1 transition-all duration-300"
              aria-label={`${artist.name}, ${artist.category}`}
            >
              {/* Card top colour accent */}
              <div className={`h-2 w-full bg-gradient-to-r ${artist.avatarBg}`} aria-hidden="true" />

              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar with initials */}
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${artist.avatarBg} flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0`}
                    aria-hidden="true"
                  >
                    {artist.initials}
                  </div>
                  {/* Name & category */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{artist.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm" aria-hidden="true">{artist.emoji}</span>
                      <span className="text-sm text-purple-600 font-medium">{artist.category}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{artist.speciality}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {artist.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-purple-50 text-purple-600 border border-purple-100 px-2.5 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Location & Price */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {artist.location}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block">Starting from</span>
                    <span className="text-xs font-semibold text-gray-700">{artist.priceRange}</span>
                  </div>
                </div>

                {/* View Profile link */}
                <Link
                  href="/artists"
                  className="mt-4 block w-full py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold text-center group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-500 group-hover:text-white group-hover:border-transparent transition-all duration-300"
                >
                  View Sample Profile
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Browse all */}
        <div className="text-center mt-12">
          <Link
            href="/artists"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border-2 border-purple-200 text-purple-700 font-semibold rounded-full hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-200"
          >
            Browse All Artists
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
