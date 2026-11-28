"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ResetPasswordClientProps {
  userEmail: string;
  redirectDestination: string;
}

export default function ResetPasswordClient({
  userEmail,
  redirectDestination,
}: ResetPasswordClientProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ message: string; error?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    if (password.length < 8) {
      setStatus({ message: "Password must be at least 8 characters long.", error: true });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ message: "Passwords do not match.", error: true });
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      setPassword("");
      setConfirmPassword("");

      if (error) {
        setStatus({ message: error.message, error: true });
        setIsSubmitting(false);
        return;
      }

      setStatus({ message: "Password updated! Redirecting to your dashboard..." });
      setTimeout(() => {
        window.location.assign(redirectDestination);
      }, 900);
    } catch {
      setStatus({ message: "Unable to update password. Please try again.", error: true });
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-3 shadow-md">
            TAN
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Set a new password
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Account: <span className="font-semibold text-gray-700">{userEmail}</span>
          </p>
        </div>

        {status && (
          <div
            className={`p-3.5 rounded-xl text-xs mb-5 border ${
              status.error
                ? "bg-rose-50 text-rose-900 border-rose-200"
                : "bg-emerald-50 text-emerald-900 border-emerald-200"
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="new-password"
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-new-password"
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <input
              id="confirm-new-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Re-enter password"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href={redirectDestination}
            className="text-xs font-medium text-gray-500 hover:text-gray-800"
          >
            Cancel and continue to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
