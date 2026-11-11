import Link from "next/link";

// Footer links per PROJECT_PLAN.md §5.10
const footerColumns = [
  {
    heading: "Platform",
    links: [
      { label: "Discover Artists", href: "/artists" },
      { label: "Categories", href: "/categories" },
      { label: "Opportunities", href: "/opportunities" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Restaurant Portal (Demo)", href: "/dashboard/restaurant" },
    ],
  },
  {
    heading: "For Artists",
    links: [
      { label: "Artist Dashboard (Demo)", href: "/dashboard/artist" },
      { label: "Join as an Artist", href: "/#how-it-works" },
      { label: "How It Works for Talent", href: "/#how-it-works" },
      { label: "Portfolio Guidelines", href: "/#how-it-works" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/" },
      { label: "Contact Us", href: "/" },
      { label: "Blog", href: "/" },
    ],
  },
  {
    heading: "Trust & Legal",
    links: [
      { label: "Community Guidelines", href: "/" },
      { label: "Privacy Policy", href: "/" },
      { label: "Terms of Service", href: "/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                TAN
              </div>
              <span className="font-bold text-white text-base">
                The Artist <span className="text-purple-400">Network</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              India&apos;s marketplace for discovering, hiring and supporting creative talent. Connecting artists with businesses, event organizers, venues and clients.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-gray-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
              Phase 1 Visual Prototype
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-white font-semibold text-xs mb-4 uppercase tracking-wider">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-900 bg-gray-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>
            © 2026 The Artist Network. All rights reserved.
          </p>
          <p>
            Built with Next.js, TypeScript &amp; Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  );
}
