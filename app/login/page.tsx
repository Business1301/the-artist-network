"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { signInAction, resetPasswordAction } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();

  const redirectTo = searchParams.get("redirectTo") || undefined;
  const isUnauthorized = searchParams.get("unauthorized") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Modal for Forgot Password
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<{ message: string; error?: boolean } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Form states — initialize notice from URL param directly (no useEffect needed)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ message: string; error?: boolean } | null>(
    isUnauthorized
      ? {
          message: "Administrator access required. Please sign in with an authorized administrator account.",
          error: true,
        }
      : null
  );

  // Email format validation helper
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotice(null);

    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);

      const res = await signInAction({ email, password, redirectTo });
      setIsSubmitting(false);

      // Security: Clear password from state immediately
      setPassword("");

      if (res.success && res.redirectTo) {
        if (res.user && typeof window !== "undefined") {
          localStorage.setItem("tan_auth_user", JSON.stringify(res.user));
        }
        setNotice({ message: res.message || "Login successful! Redirecting..." });
        router.push(res.redirectTo);
        router.refresh();
      } else {
        setNotice({ message: res.message || "Unable to sign in.", error: true });
      }
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetStatus(null);

    if (!resetEmail.trim() || !isValidEmail(resetEmail)) {
      setResetStatus({ message: "Please enter a valid email address.", error: true });
      return;
    }

    setIsResetting(true);
    const res = await resetPasswordAction(resetEmail);
    setIsResetting(false);

    setResetStatus({
      message: res.message || "Password reset request completed.",
      error: !res.success,
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">

        {/* Supabase Status Banner */}
        <div
          className={`mb-6 p-4 rounded-2xl border text-xs leading-relaxed shadow-sm ${
            configured
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span className="text-base flex-shrink-0" aria-hidden="true">
              {configured ? "🟢" : "⚙️"}
            </span>
            <div>
              <strong className="block font-semibold mb-0.5">
                {configured ? "Supabase Connected" : "Supabase Setup Pending:"}
              </strong>
              {configured ? (
                <span>Live authentication is active against your Supabase backend.</span>
              ) : (
                <span>
                  Add your real project URL and anon key to <code>.env.local</code> to activate live login. Form validation and UI remain fully functional.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xl p-8 sm:p-10">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white font-bold text-sm flex items-center justify-center mx-auto mb-3 shadow-md">
              TAN
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Log in to your Artist, Restaurant, or Admin account
            </p>
          </div>

          {/* Server Feedback Notice */}
          {notice && (
            <div
              className={`p-4 rounded-2xl text-xs mb-6 leading-relaxed border flex items-start gap-3 ${
                notice.error
                  ? "bg-red-50 text-red-900 border-red-200"
                  : "bg-emerald-50 text-emerald-900 border-emerald-200"
              }`}
            >
              <span className="text-base flex-shrink-0">
                {notice.error ? "⚠️" : "✅"}
              </span>
              <span>{notice.message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="artist@example.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white focus:outline-none transition-colors ${
                  errors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white focus:outline-none transition-colors ${
                    errors.password
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-gray-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="font-medium text-purple-600 hover:text-purple-800"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? "Authenticating..." : "Sign in to Dashboard"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/signup"
              className="font-bold text-purple-600 hover:text-purple-800 transition-colors"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Quick Demo Workspace Links */}
        <div className="mt-6 text-center text-xs text-gray-400 space-y-1">
          <p>Looking to preview user workspaces?</p>
          <div className="flex justify-center gap-4 text-purple-600 font-semibold">
            <Link href="/dashboard/artist" className="hover:underline">Artist Portal Demo →</Link>
            <Link href="/dashboard/restaurant" className="hover:underline">Restaurant Portal Demo →</Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 text-xl font-bold flex items-center justify-center mx-auto mb-3">
              🔑
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Reset Password</h3>
            <p className="text-xs text-gray-500 text-center mb-4 leading-relaxed">
              Enter your email address and we will send a password reset link.
            </p>

            {resetStatus && (
              <div
                className={`p-3 rounded-xl text-xs mb-4 leading-relaxed ${
                  resetStatus.error
                    ? "bg-red-50 text-red-900 border border-red-200"
                    : "bg-emerald-50 text-emerald-900 border border-emerald-200"
                }`}
              >
                {resetStatus.message}
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-3">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 bg-gray-50 focus:bg-white focus:border-purple-600 outline-none"
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors disabled:opacity-60"
                >
                  {isResetting ? "Sending..." : "Send Reset Email"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetStatus(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24 pb-16">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
      <Footer />
    </>
  );
}
