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
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 text-gray-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Badge */}
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-md">
                TAN
              </span>
              <span className="hidden sm:inline font-extrabold text-gray-900">
                The Artist Network
              </span>
              <span className="text-gray-500 font-semibold text-xs border-l border-gray-200 pl-2.5">
                Admin Portal
              </span>
            </Link>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                      ? "bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs font-bold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
              <div className="text-xs font-bold text-gray-900">{adminName}</div>
              <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{adminEmail}</div>
            </div>

            <Link
              href="/artists"
              className="text-xs text-gray-700 hover:text-gray-900 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors font-medium flex items-center gap-1.5 shadow-2xs"
            >
              <span>Marketplace</span>
              <span className="text-[10px]">↗</span>
            </Link>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-700 border border-gray-200 hover:border-rose-200 transition-colors disabled:opacity-50"
            >
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 px-4 pt-3 pb-4 space-y-2 bg-white">
          <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <div className="font-bold text-gray-900">{adminName}</div>
            <div className="text-[11px] text-gray-500">{adminEmail}</div>
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
                    ? "bg-purple-50 text-purple-700 font-bold border border-purple-200"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
            <Link
              href="/artists"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-gray-600 hover:text-gray-900 font-semibold"
            >
              Marketplace ↗
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

