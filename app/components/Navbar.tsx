"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOutAction, type CurrentUser } from "@/app/auth/actions";

export type NavbarUser = CurrentUser;

interface NavbarProps {
  initialUser?: NavbarUser | null;
}

const navLinks = [
  { label: "Discover Artists", href: "/artists" },
  { label: "Categories", href: "/categories" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "For Venues & Clients", href: "/#for-businesses" },
  { label: "How It Works", href: "/#how-it-works" },
];

export default function Navbar({ initialUser }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Derive a stable user ID string for effect comparisons.
  // `undefined` means SSR did not provide a value (public page).
  // `null` means SSR confirmed the user is logged out.
  // An object means SSR provided an authenticated user.
  const initialUserId =
    initialUser === undefined ? undefined : initialUser?.id ?? null;

  // Never read localStorage during useState initializer — that causes hydration
  // mismatch between SSR HTML and Client DOM, crashing React and causing an
  // infinite reload loop in dev mode.
  const [user, setUser] = useState<NavbarUser | null>(initialUser ?? null);

  // Synchronously adjust state when SSR prop changes (React recommended pattern)
  const [prevUserId, setPrevUserId] = useState(initialUserId);
  if (initialUserId !== prevUserId) {
    setPrevUserId(initialUserId);
    setUser(initialUser ?? null);
  }

  // Ref used to prevent duplicate async getCurrentUser() calls.
  const asyncFetchDoneRef = useRef(false);

  // ── Sync effect: runs ONLY on client after hydration is complete ──
  useEffect(() => {
    // If SSR provided a definitive user value, sync to localStorage
    if (initialUser !== undefined) {
      if (initialUser) {
        localStorage.setItem("tan_auth_user", JSON.stringify(initialUser));
      } else {
        localStorage.removeItem("tan_auth_user");
      }
      return;
    }

    // SSR did not provide initialUser (e.g. client pages rendering <Navbar />).
    // Perform a single async DB verification call. The async callback is safe
    // and does not trigger React's cascading render warning.
    if (asyncFetchDoneRef.current) return;
    asyncFetchDoneRef.current = true;

    let isMounted = true;

    getCurrentUser()
      .then((verified) => {
        if (!isMounted) return;
        setUser(verified);
        if (verified) {
          localStorage.setItem("tan_auth_user", JSON.stringify(verified));
        } else {
          localStorage.removeItem("tan_auth_user");
        }
      })
      .catch(() => {
        if (isMounted) setUser(null);
      });

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserId]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);

    try {
      await signOutAction();
    } catch (err) {
      console.error("Sign out error:", err);
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("tan_auth_user");
    }

    setUser(null);
    setIsLoggingOut(false);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const getDashboardDestination = (role?: string) => {
    switch (role) {
      case "admin":
        return { href: "/admin", label: "Admin Dashboard", badge: "🛡️" };
      case "business":
        return { href: "/dashboard/restaurant", label: "Business Dashboard", badge: "🏢" };
      default:
        return { href: "/dashboard/artist", label: "Artist Dashboard", badge: "🎨" };
    }
  };

  const dashboard = getDashboardDestination(user?.role);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo matching Reference Design */}
          <Link href="/" className="flex items-center gap-1 group flex-shrink-0 py-1">
            <div className="flex flex-col leading-none">
              <span className="text-[8px] font-black tracking-widest text-gray-500 uppercase">
                THE
              </span>
              <span className="text-2xl font-black text-gray-950 tracking-tighter hover:text-blue-600 transition-colors font-serif">
                Artist
              </span>
              <span className="text-[8px] font-black tracking-[0.2em] text-gray-900 uppercase -mt-0.5">
                NETWORK
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-gray-700 hover:text-blue-600 font-semibold transition-colors text-sm whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Controls: Authenticated Dashboard vs Guest Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              // Authenticated State (Admin, Artist, or Business)
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  href={dashboard.href}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition-colors ${
                    user.role === "admin"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : user.role === "business"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <span>{dashboard.badge}</span>
                  <span>{dashboard.label}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="text-xs font-semibold text-gray-500 hover:text-rose-600 px-2.5 py-1.5 transition-colors cursor-pointer"
                >
                  {isLoggingOut ? "Signing out..." : "Log Out"}
                </button>
              </div>
            ) : (
              // Guest State
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex text-sm font-bold text-gray-700 hover:text-blue-600 px-3 py-1.5 transition-colors"
                >
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Join as Artist
                </Link>
              </>
            )}

            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <svg
                className="w-6 h-6 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 shadow-xl space-y-3 animate-fadeIn">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            {user ? (
              <>
                <div className="px-3 py-1.5 text-xs text-gray-500 flex items-center justify-between">
                  <span className="truncate font-medium">{user.fullName || user.email}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                    {user.role}
                  </span>
                </div>

                <Link
                  href={dashboard.href}
                  onClick={() => setMenuOpen(false)}
                  className={`w-full text-center py-2.5 rounded-xl text-white text-sm font-bold shadow-xs transition-colors ${
                    user.role === "admin"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : user.role === "business"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {dashboard.badge} {dashboard.label}
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="w-full text-center py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  {isLoggingOut ? "Signing out..." : "Log Out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-colors"
                >
                  Join as Artist
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
