import Link from "next/link";
import { getCurrentUser, type CurrentUser } from "@/app/auth/actions";

interface FooterProps {
  user?: CurrentUser | null;
}

export default async function Footer({ user }: FooterProps) {
  let resolvedUser = user;
  if (resolvedUser === undefined) {
    resolvedUser = await getCurrentUser();
  }

  // Build role-aware navigation columns
  const platformLinks = [
    { label: "Discover Artists", href: "/artists" },
    { label: "Categories", href: "/categories" },
    { label: "Opportunities Preview", href: "/opportunities" },
    { label: "How It Works", href: "/#how-it-works" },
  ];

  if (!resolvedUser) {
    platformLinks.push({ label: "For Venues & Clients", href: "/#for-businesses" });
    platformLinks.push({ label: "Register as Venue", href: "/signup?role=business" });
  } else if (resolvedUser.role === "business") {
    platformLinks.push({ label: "Venue Dashboard", href: "/dashboard/restaurant" });
  } else if (resolvedUser.role === "admin") {
    platformLinks.push({ label: "Admin Dashboard", href: "/admin" });
    platformLinks.push({ label: "Review Applications", href: "/admin/applications" });
  }

  const artistLinks: { label: string; href: string }[] = [];
  if (!resolvedUser) {
    artistLinks.push({ label: "Join as an Artist", href: "/signup?role=artist" });
    artistLinks.push({ label: "Community Guidelines", href: "/community-guidelines" });
  } else if (resolvedUser.role === "artist") {
    artistLinks.push({ label: "Artist Dashboard", href: "/dashboard/artist" });
    artistLinks.push({ label: "Artist Calendar", href: "/dashboard/artist/calendar" });
    artistLinks.push({ label: "Edit Showcase Profile", href: "/dashboard/artist/edit" });
    artistLinks.push({ label: "Community Guidelines", href: "/community-guidelines" });
  } else if (resolvedUser.role === "business") {
    artistLinks.push({ label: "Browse Artists Directory", href: "/artists" });
    artistLinks.push({ label: "Categories", href: "/categories" });
    artistLinks.push({ label: "Community Guidelines", href: "/community-guidelines" });
  } else {
    // Admin
    artistLinks.push({ label: "Manage Artists", href: "/admin" });
    artistLinks.push({ label: "Community Guidelines", href: "/community-guidelines" });
  }

  const footerColumns = [
    {
      heading: "Platform",
      links: platformLinks,
    },
    {
      heading: resolvedUser?.role === "business" ? "Talent Sourcing" : "For Artists",
      links: artistLinks,
    },
    {
      heading: "Support & Trust",
      links: [
        { label: "Contact Us", href: "/contact" },
        { label: "Community Guidelines", href: "/community-guidelines" },
        { label: "Platform Disclaimer", href: "/disclaimer" },
      ],
    },
    {
      heading: "Legal & Privacy",
      links: [
        { label: "Terms & Conditions", href: "/terms" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Platform Disclaimer", href: "/disclaimer" },
      ],
    },
  ];

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
              India&apos;s marketplace for discovering, exploring, and connecting with creative talent. Connecting artists with businesses, event organizers, venues, and clients.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-gray-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
              Testing &amp; Evaluation Preview
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
                  <li key={`${col.heading}-${link.label}`}>
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
            © 2026 The Artist Network. Pre-launch testing preview. Commercial booking &amp; payments are not yet operational.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-purple-400 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-purple-400 transition-colors">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-purple-400 transition-colors">
              Contact
            </Link>
            <Link href="/disclaimer" className="hover:text-purple-400 transition-colors">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
