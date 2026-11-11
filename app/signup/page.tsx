"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { signUpAction } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();

  const initialRole = searchParams.get("role") === "business" ? "business" : "artist";
  const [role, setRole] = useState<"artist" | "business">(initialRole);

  // Artist Fields
  const [fullName, setFullName] = useState("");

  // Business Fields
  const [contactName, setContactName] = useState("");
  const [businessName, setBusinessName] = useState("");

  // Common Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Submission States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ message: string; error?: boolean } | null>(null);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotice(null);

    const newErrors: Record<string, string> = {};

    // Validate based on role
    if (role === "artist") {
      if (!fullName.trim()) newErrors.fullName = "Full name is required.";
    } else {
      if (!contactName.trim()) newErrors.contactName = "Contact person's name is required.";
      if (!businessName.trim()) newErrors.businessName = "Business or venue name is required.";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!termsAccepted) {
      newErrors.terms = "You must agree to the Terms of Service and Privacy Policy.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);

      const res = await signUpAction({
        email,
        password,
        role,
        fullName,
        contactName,
        businessName,
      });

      setIsSubmitting(false);

      // Security: Clear passwords from state immediately
      setPassword("");
      setConfirmPassword("");

      if (res.success) {
        if (res.needsEmailConfirmation) {
          setEmailConfirmationRequired(true);
        } else if (res.redirectTo) {
          if (res.user && typeof window !== "undefined") {
            localStorage.setItem("tan_auth_user", JSON.stringify(res.user));
          }
          router.push(res.redirectTo);
          router.refresh();
        } else {
          setNotice({ message: res.message || "Registration successful!" });
        }
      } else {
        setNotice({ message: res.message || "Unable to register.", error: true });
      }
    }
  };

  // If email verification screen is active
  if (emailConfirmationRequired) {
    return (
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 text-3xl font-bold flex items-center justify-center mx-auto mb-4">
          ✉️
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
          Verify your email
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
          We&apos;ve sent a verification link to <strong className="text-gray-900">{email}</strong>. Please check your inbox and click the link to confirm your account.
        </p>
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-900 leading-relaxed mb-6 text-left">
          <strong>Tip for local development:</strong> If you are testing locally and want instant sign-in without waiting for emails, you can temporarily disable <em>&ldquo;Confirm email&rdquo;</em> in your Supabase Dashboard under <strong>Authentication &gt; Providers &gt; Email</strong>.
        </div>
        <Link
          href="/login"
          className="inline-block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all text-center"
        >
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg w-full mx-auto">

      {/* Supabase Status Banner (Only shown if setup is missing) */}
      {!configured && (
        <div className="mb-6 p-4 rounded-2xl border bg-amber-50 border-amber-200 text-amber-900 text-xs leading-relaxed shadow-sm">
          <div className="flex items-start gap-2.5">
            <span className="text-base flex-shrink-0" aria-hidden="true">
              ⚙️
            </span>
            <div>
              <strong className="block font-semibold mb-0.5">
                Supabase Setup Pending:
              </strong>
              <span>
                Add your real project URL and anon key to <code>.env.local</code> to activate live account creation. Form validation and UI remain fully functional.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Registration Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10">

        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white font-extrabold text-base flex items-center justify-center mx-auto mb-3 shadow-md">
            TAN
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Join The Artist Network
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Choose your account type to get started
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => {
              setRole("artist");
              setErrors({});
              setNotice(null);
            }}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              role === "artist"
                ? "bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs"
                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200/80"
            }`}
          >
            <span>🎨</span>
            <span>I&apos;m an Artist</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("business");
              setErrors({});
              setNotice(null);
            }}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              role === "business"
                ? "bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs"
                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200/80"
            }`}
          >
            <span>🏢</span>
            <span>Business / Venue</span>
          </button>
        </div>

        {/* Role Description Sub-banner */}
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 text-center">
          {role === "artist" ? (
            <span>Creating an <strong>Artist Profile</strong> to showcase your work and receive booking enquiries.</span>
          ) : (
            <span>Creating a <strong>Client / Venue Account</strong> to discover talent, hire performers, and manage bookings.</span>
          )}
        </div>

        {/* Status Notification */}
        {notice && (
          <div
            role="status"
            className={`mb-6 p-3.5 rounded-2xl border text-xs leading-relaxed ${
              notice.error
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : "bg-emerald-50 border-emerald-200 text-emerald-900"
            }`}
          >
            <div className="flex items-start gap-2">
              <span aria-hidden="true">{notice.error ? "⚠️" : "✓"}</span>
              <span>{notice.message}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Artist: Full Name */}
          {role === "artist" && (
            <div>
              <label htmlFor="full-name" className="block text-xs font-bold text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                id="full-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
                }}
                placeholder="e.g. Arjun Sharma"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "full-name-error" : undefined}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-900 bg-white outline-none transition-all ${
                  errors.fullName
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-gray-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                }`}
              />
              {errors.fullName && (
                <p id="full-name-error" role="alert" className="text-rose-600 text-xs mt-1 font-semibold">
                  {errors.fullName}
                </p>
              )}
            </div>
          )}

          {/* Business: Contact Person's Name */}
          {role === "business" && (
            <div>
              <label htmlFor="contact-name" className="block text-xs font-bold text-gray-700 mb-1.5">
                Contact Person&apos;s Name
              </label>
              <input
                id="contact-name"
                type="text"
                autoComplete="name"
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value);
                  if (errors.contactName) setErrors((prev) => ({ ...prev, contactName: "" }));
                }}
                placeholder="e.g. Rishi Kapoor"
                aria-invalid={!!errors.contactName}
                aria-describedby={errors.contactName ? "contact-name-error" : undefined}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-900 bg-white outline-none transition-all ${
                  errors.contactName
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-gray-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                }`}
              />
              {errors.contactName && (
                <p id="contact-name-error" role="alert" className="text-rose-600 text-xs mt-1 font-semibold">
                  {errors.contactName}
                </p>
              )}
            </div>
          )}

          {/* Business: Organization Name */}
          {role === "business" && (
            <div>
              <label htmlFor="business-name" className="block text-xs font-bold text-gray-700 mb-1.5">
                Business, Venue, or Organization Name
              </label>
              <input
                id="business-name"
                type="text"
                autoComplete="organization"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  if (errors.businessName) setErrors((prev) => ({ ...prev, businessName: "" }));
                }}
                placeholder="e.g. The Olive Courtyard or TechNova Events"
                aria-invalid={!!errors.businessName}
                aria-describedby={errors.businessName ? "business-name-error" : undefined}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-900 bg-white outline-none transition-all ${
                  errors.businessName
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-gray-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                }`}
              />
              {errors.businessName && (
                <p id="business-name-error" role="alert" className="text-rose-600 text-xs mt-1 font-semibold">
                  {errors.businessName}
                </p>
              )}
            </div>
          )}

          {/* Email Address */}
          <div>
            <label htmlFor="signup-email" className="block text-xs font-bold text-gray-700 mb-1.5">
              {role === "business" ? "Business Email Address" : "Email Address"}
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
              placeholder="name@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "signup-email-error" : undefined}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-900 bg-white outline-none transition-all ${
                errors.email
                  ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-gray-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              }`}
            />
            {errors.email && (
              <p id="signup-email-error" role="alert" className="text-rose-600 text-xs mt-1 font-semibold">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="signup-password" className="block text-xs font-bold text-gray-700 mb-1.5">
              Create Password <span className="font-normal text-gray-400">(min. 8 characters)</span>
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                }}
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "signup-password-error" : undefined}
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm text-gray-900 bg-white outline-none transition-all ${
                  errors.password
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-gray-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p id="signup-password-error" role="alert" className="text-rose-600 text-xs mt-1 font-semibold">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-password" className="block text-xs font-bold text-gray-700 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                placeholder="Re-type your password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm text-gray-900 bg-white outline-none transition-all ${
                  errors.confirmPassword
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-gray-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
              >
                {showConfirmPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirm-password-error" role="alert" className="text-rose-600 text-xs mt-1 font-semibold">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms Checkbox */}
          <div className="pt-2">
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (errors.terms) setErrors((prev) => ({ ...prev, terms: "" }));
                }}
                aria-invalid={!!errors.terms}
                aria-describedby={errors.terms ? "terms-error" : undefined}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer mt-0.5"
              />
              <label htmlFor="terms" className="ml-2.5 block text-xs text-gray-600 leading-normal cursor-pointer">
                I agree to The Artist Network&apos;s{" "}
                <Link href="/" className="text-purple-600 underline hover:text-purple-800">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/" className="text-purple-600 underline hover:text-purple-800">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
            {errors.terms && (
              <p id="terms-error" role="alert" className="text-rose-600 text-xs mt-1 font-semibold">
                {errors.terms}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-purple-600 hover:text-purple-800 transition-colors"
          >
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 flex flex-col justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-center text-xs text-gray-400 py-12">Loading form...</div>}>
          <SignUpForm />
        </Suspense>
      </main>

      <Footer />
    </>
  );
}
