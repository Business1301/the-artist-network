import Link from "next/link";

// Category cards per PROJECT_PLAN.md §5.4
// The `filter` value must exactly match the category strings stored in artist_profiles.category
// and used by the directory page's ?category= URL parameter.
const categories = [
  { emoji: "🎤", name: "Singers", type: "Performing Arts", color: "from-rose-400 to-pink-500",      filter: "Singers & Vocalists" },
  { emoji: "🎧", name: "DJs",     type: "Music & Club",    color: "from-purple-400 to-violet-600",  filter: "DJs & Electronic Music" },
  { emoji: "🥁", name: "Bands",   type: "Live Music",      color: "from-orange-400 to-red-500",     filter: "Live Bands & Instrumentalists" },
  { emoji: "🎹", name: "Musicians", type: "Instrumental",  color: "from-blue-400 to-indigo-500",    filter: "Live Bands & Instrumentalists" },
  { emoji: "💃", name: "Dancers", type: "Performing Arts", color: "from-pink-400 to-fuchsia-500",   filter: "Dancers & Choreographers" },
  { emoji: "🎭", name: "Comedians", type: "Stand-up & Comedy", color: "from-amber-400 to-yellow-500", filter: "Stand-up Comedians" },
  { emoji: "🎙️", name: "Hosts & Emcees", type: "Event Hosting", color: "from-emerald-400 to-teal-500", filter: "Anchors & Event Hosts" },
  { emoji: "🎨", name: "Painters", type: "Visual Arts",    color: "from-teal-400 to-cyan-500",      filter: "Painters & Visual Artists" },
  { emoji: "🖼️", name: "Mural Artists", type: "Wall & Public Art", color: "from-yellow-400 to-orange-500", filter: "Painters & Visual Artists" },
  { emoji: "✏️", name: "Sketch Artists", type: "Portraits & Live", color: "from-slate-400 to-gray-600", filter: "Painters & Visual Artists" },
  { emoji: "📸", name: "Photographers", type: "Visual & Event", color: "from-cyan-400 to-sky-500",  filter: "Painters & Visual Artists" },
  { emoji: "✨", name: "Other Creatives", type: "Specialized Talent", color: "from-violet-400 to-purple-600", filter: "" },
];

export default function ArtistCategories() {
  return (
    <section id="categories" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-block text-purple-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Browse by Category
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Every Type of Creative Talent
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base">
            From live stage performances to bespoke visual artistry, find the perfect talent for your requirement.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            // Build the filtered directory URL.
            // encodeURIComponent handles spaces, ampersands and special characters correctly.
            const href = cat.filter
              ? `/artists?category=${encodeURIComponent(cat.filter)}`
              : "/artists";

            return (
              <Link
                key={cat.name}
                href={href}
                className="group flex flex-col items-center p-5 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-100 bg-white hover:bg-gradient-to-b hover:from-purple-50 hover:to-white transition-all duration-200 cursor-pointer text-center"
              >
                {/* Emoji icon */}
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-md mb-3 group-hover:scale-110 transition-transform duration-200`}
                  aria-hidden="true"
                >
                  {cat.emoji}
                </div>
                <span className="font-semibold text-gray-800 text-sm leading-tight mb-1 group-hover:text-purple-700 transition-colors">
                  {cat.name}
                </span>
                <span className="text-xs text-gray-400 group-hover:text-purple-500 transition-colors">
                  {cat.type}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Link to full categories directory */}
        <div className="text-center mt-10">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-purple-200 text-purple-700 font-semibold text-xs sm:text-sm rounded-full hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all shadow-sm"
          >
            Explore Complete Categories Taxonomy →
          </Link>
        </div>
      </div>
    </section>
  );
}
