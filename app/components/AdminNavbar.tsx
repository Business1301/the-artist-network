"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOutAction } from "@/app/auth/actions";

interface AdminNavbarProps {
  adminName: string;
  adminEmail: string;
}

export default function AdminNavbar({ adminName, adminEmail }: AdminNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const navLinks = [
    { href: "/admin", label: "Overview", icon: "📊" },
    { href: "/admin/applications", label: "Applications", icon: "📝" },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: "📜" },
  ];

  const handleSignOut = async () => {
    setIsSigningOut(true);
    if (typeof window !== "undefined") {
      localStorage.removeItem("tan_auth_user");
    }
    await signOutAction();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-900 border-b border-zinc-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Badge */}
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-md">
                TAN
              </span>
              <span className="hidden sm:inline font-extrabold text-white">
                The Artist Network
              </span>
              <span className="text-zinc-400 font-semibold text-xs border-l border-zinc-700 pl-2.5">
                Admin Portal
              </span>
            </Link>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Owner Admin
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-zinc-800 text-purple-400 border border-zinc-700 shadow-inner"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-800/60"
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-zinc-200">{adminName}</div>
              <div className="text-[10px] text-zinc-400 truncate max-w-[150px]">{adminEmail}</div>
            </div>

            <Link
              href="/artists"
              className="text-xs text-zinc-300 hover:text-white px-3 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors font-medium flex items-center gap-1.5"
            >
              <span>Marketplace</span>
              <span className="text-[10px]">↗</span>
            </Link>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 transition-colors disabled:opacity-50"
            >
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 px-4 pt-3 pb-4 space-y-2 bg-zinc-950">
          <div className="px-3 py-2 rounded-xl bg-zinc-900 text-xs">
            <div className="font-bold text-zinc-200">{adminName}</div>
            <div className="text-[11px] text-zinc-400">{adminEmail}</div>
          </div>

          {navLinks.map((link) => {
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  isActive
                    ? "bg-zinc-800 text-purple-400"
                    : "text-zinc-300 hover:bg-zinc-800/60"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
            <Link
              href="/artists"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Marketplace ↗
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-red-400 hover:text-red-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

