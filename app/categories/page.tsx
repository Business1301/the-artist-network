import Link from "next/link";
import { connection } from "next/server";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCurrentUser } from "@/app/auth/actions";

export const instant = false;

// Categories grouped per PROJECT_PLAN.md §2 & §5.4
// `filter` matches the category value used in artist_profiles and directory filters
const performingCategories = [
  {
    name: "Singers & Vocalists",
    icon: "🎤",
    color: "from-rose-500 to-pink-600",
    description: "Playback singers, classical vocalists, Ghazal & Sufi performers, and acoustic pop artists for concerts and celebrations.",
    popularFor: ["Weddings & Sangeet", "Concerts", "Corporate Galas", "Private Parties"],
    filter: "Singers & Vocalists",
  },
  {
    name: "DJs & Electronic Music",
    icon: "🎧",
    color: "from-purple-500 to-indigo-600",
    description: "Club DJs, wedding party specialists, Bollywood-EDM mixers, and techno producers with custom stage sets.",
    popularFor: ["Club Nights", "After-Parties", "College Fests", "Cocktail Receptions"],
    filter: "DJs & Electronic Music",
  },
  {
    name: "Bands & Music Ensembles",
    icon: "🥁",
    color: "from-orange-500 to-red-600",
    description: "Multi-genre live bands, rock groups, fusion ensembles, brass bands, and acoustic unplugged collectives.",
    popularFor: ["Music Festivals", "Destination Weddings", "Resorts", "College Fests"],
    filter: "Live Bands & Instrumentalists",
  },
  {
    name: "Solo Musicians & Instrumentalists",
    icon: "🎹",
    color: "from-blue-500 to-cyan-600",
    description: "Pianists, violinists, saxophonists, sitarists, flutists, and acoustic guitarists providing sophisticated ambient sound.",
    popularFor: ["Fine Dining Lounges", "Corporate Receptions", "Ceremonies", "Art Openings"],
    filter: "Live Bands & Instrumentalists",
  },
  {
    name: "Dancers & Choreographers",
    icon: "💃",
    color: "from-pink-500 to-fuchsia-600",
    description: "Solo dancers, contemporary troupes, classical Bharatnatyam & Kathak exponents, Bollywood troupes, and hip-hop crews.",
    popularFor: ["Stage Shows", "Award Ceremonies", "Cultural Festivals", "Music Videos"],
    filter: "Dancers & Choreographers",
  },
  {
    name: "Stand-up Comedians",
    icon: "🎭",
    color: "from-amber-500 to-yellow-600",
    description: "Engaging comedy writers and stand-up acts delivering sharp observational humor customized for corporate or open audiences.",
    popularFor: ["Corporate Offsites", "College Shows", "Private Birthday Parties", "Auditorium Shows"],
    filter: "Stand-up Comedians",
  },
  {
    name: "Hosts & Emcees",
    icon: "🎙️",
    color: "from-emerald-500 to-teal-600",
    description: "Polished bilingual and multilingual anchors who run stages smoothly, manage crowd energy, and conduct proceedings.",
    popularFor: ["Conferences", "Award Galas", "Product Launches", "High-End Weddings"],
    filter: "Anchors & Event Hosts",
  },
  {
    name: "Magicians & Live Entertainers",
    icon: "🪄",
    color: "from-violet-500 to-purple-600",
    description: "Illusionists, close-up sleight-of-hand magicians, mentalists, and interactive entertainers for awe-inspiring guest experiences.",
    popularFor: ["Corporate Gatherings", "Private Receptions", "Family Events", "Dinner Shows"],
    filter: "Magicians & Illusionists",
  },
];

const visualCategories = [
  {
    name: "Painters & Canvas Artists",
    icon: "🎨",
    color: "from-teal-500 to-emerald-600",
    description: "Fine artists creating oil paintings, acrylic abstracts, customized canvas commissions, and gallery-grade collections.",
    popularFor: ["Art Commissions", "Home Interiors", "Corporate Collections", "Galleries"],
    filter: "Painters & Visual Artists",
  },
  {
    name: "Mural Artists",
    icon: "🖼️",
    color: "from-yellow-500 to-amber-600",
    description: "Large-scale wall artists and street muralists transforming interior walls, building facades, and commercial environments.",
    popularFor: ["Cafes & Bistros", "Corporate Offices", "Coworking Spaces", "Public Art Initiatives"],
    filter: "Painters & Visual Artists",
  },
  {
    name: "Sketch & Caricature Artists",
    icon: "✏️",
    color: "from-slate-500 to-gray-700",
    description: "Fast-sketch illustrators who capture live charcoal portraits and playful caricatures for guests to take home on the spot.",
    popularFor: ["Wedding Receptions", "Brand Activations", "Corporate Dinners", "Parties"],
    filter: "Painters & Visual Artists",
  },
  {
    name: "Event & Creative Photographers",
    icon: "📸",
    color: "from-cyan-500 to-blue-600",
    description: "Visual storytellers documenting stage performances, fashion portraits, corporate celebrations, and artist portfolios.",
    popularFor: ["Concerts & Festivals", "Portfolio Shoots", "Brand Events", "Exhibitions"],
    filter: "Painters & Visual Artists",
  },
  {
    name: "Digital Artists & Illustrators",
    icon: "💻",
    color: "from-indigo-500 to-violet-600",
    description: "Concept artists, 2D/3D visualizers, character designers, and graphic illustrators for commercial creative projects.",
    popularFor: ["Advertising Campaigns", "Album Artwork", "Merchandise", "Brand Storytelling"],
    filter: "Painters & Visual Artists",
  },
  {
    name: "Sculptors & Installation Artists",
    icon: "🗿",
    color: "from-stone-500 to-zinc-700",
    description: "Craftspeople working in metal, clay, stone, and mixed media to produce distinctive decorative 3D installations.",
    popularFor: ["Luxury Properties", "Public Spaces", "Art Exhibitions", "Hospitality Venues"],
    filter: "Painters & Visual Artists",
  },
];

export default async function CategoriesPage() {
  await connection();
  const currentUser = await getCurrentUser();

  return (
    <>
      <Navbar initialUser={currentUser} />

      <main className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Page Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block text-purple-600 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-2">
              Marketplace Taxonomy
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
              Explore Artist Categories
            </h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Find the exact discipline of talent you need. The Artist Network features performing, visual, and fine artists ready for hire across India.
            </p>
          </div>

          {/* Section 1: Performing Arts */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold" aria-hidden="true">
                🎭
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Performing Arts</h2>
                <p className="text-xs sm:text-sm text-gray-500">Live stage, music, dance, humor, and event entertainment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {performingCategories.map((item) => (
                <div
                  key={item.name}
                  className="bg-white rounded-2xl border border-gray-200/80 p-6 flex flex-col hover:shadow-lg hover:border-purple-200 transition-all group"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl shadow-md mb-4 group-hover:scale-105 transition-transform`} aria-hidden="true">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    <Link href={`/artists?category=${encodeURIComponent(item.filter || item.name)}`}>
                      {item.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4 flex-1">
                    {item.description}
                  </p>

                  <div className="border-t border-gray-100 pt-3 mt-auto">
                    <span className="text-[11px] font-semibold text-gray-400 block mb-1.5 uppercase tracking-wider">
                      Popular for:
                    </span>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.popularFor.map((use) => (
                        <span key={use} className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                          {use}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/artists?category=${encodeURIComponent(item.filter || item.name)}`}
                      className="block w-full text-center py-2 rounded-xl bg-gray-50 hover:bg-purple-600 hover:text-white text-gray-700 font-semibold text-xs border border-gray-200 hover:border-transparent transition-all"
                    >
                      Browse Talent →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Visual & Creative Arts */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl font-bold" aria-hidden="true">
                🎨
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Visual &amp; Fine Arts</h2>
                <p className="text-xs sm:text-sm text-gray-500">Murals, canvas paintings, live sketches, photography and bespoke creations</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visualCategories.map((item) => (
                <div
                  key={item.name}
                  className="bg-white rounded-2xl border border-gray-200/80 p-6 flex flex-col hover:shadow-lg hover:border-teal-200 transition-all group"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl shadow-md mb-4 group-hover:scale-105 transition-transform`} aria-hidden="true">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                    <Link href={`/artists?category=${encodeURIComponent(item.filter || item.name)}`}>
                      {item.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4 flex-1">
                    {item.description}
                  </p>

                  <div className="border-t border-gray-100 pt-3 mt-auto">
                    <span className="text-[11px] font-semibold text-gray-400 block mb-1.5 uppercase tracking-wider">
                      Popular for:
                    </span>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.popularFor.map((use) => (
                        <span key={use} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-medium">
                          {use}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/artists?category=${encodeURIComponent(item.filter || item.name)}`}
                      className="block w-full text-center py-2 rounded-xl bg-gray-50 hover:bg-teal-600 hover:text-white text-gray-700 font-semibold text-xs border border-gray-200 hover:border-transparent transition-all"
                    >
                      Browse Talent →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Suggestion Box */}
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center max-w-2xl mx-auto">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Do not see your artistic craft listed?
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              We continually expand our taxonomy to represent every creative domain in India. Administrators review and introduce new categories regularly.
            </p>
            <Link
              href="/artists"
              className="inline-block px-5 py-2.5 bg-gray-900 text-white rounded-full text-xs font-semibold hover:bg-purple-600 transition-colors"
            >
              Search All Profiles
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

