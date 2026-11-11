import Link from "next/link";

// Section 7: Opportunities Teaser per PROJECT_PLAN.md §5.7 & §13
const upcomingTypes = [
  {
    title: "Auditions & Casting",
    icon: "🎭",
    description: "Casting calls for theatre, screen, live shows and touring productions.",
  },
  {
    title: "Competitions",
    icon: "🏆",
    description: "Singing, dancing and instrumental competitions with industry recognition.",
  },
  {
    title: "Exhibitions & Open Calls",
    icon: "🎨",
    description: "Gallery exhibitions, art fairs and open submissions for visual artists.",
  },
  {
    title: "Mural & Public Art Commissions",
    icon: "🖼️",
    description: "Paid wall murals and public art installations for venues and city initiatives.",
  },
];

export default function OpportunitiesTeaser() {
  return (
    <section id="opportunities" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" aria-hidden="true" />
            Coming in Phase 6
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Auditions, Competitions &amp; Creative Calls
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-base">
            Beyond direct hiring, The Artist Network will curate legitimate opportunities to help artists gain visibility, win commissions and advance their creative careers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {upcomingTypes.map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl mb-4" aria-hidden="true">
                {item.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Link to full opportunities preview board */}
        <div className="mt-10 text-center">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-purple-200 text-purple-700 font-semibold text-xs sm:text-sm rounded-full hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all shadow-sm"
          >
            Explore Opportunities Board Preview →
          </Link>
          <p className="text-xs text-gray-400 mt-3">
            Real, verified opportunities will be published and managed directly by administrators and verified organizers.
          </p>
        </div>
      </div>
    </section>
  );
}
