import Link from "next/link";
import { getCurrentUser, type CurrentUser } from "@/app/auth/actions";
import { getCurrentArtistStatus, type ArtistCTAStatus } from "@/lib/data/artists";

export interface ArtistCTAProps {
  user?: CurrentUser | null;
  artistStatus?: ArtistCTAStatus | null;
  variant?: "standalone" | "embedded";
  className?: string;
}

/**
 * Authentication-aware Call-to-Action section.
 * Adapts dynamically based on whether the visitor is a guest, an artist
 * (draft, live, pending, or suspended), a business client, or an administrator.
 */
export default async function ArtistCTA({
  user,
  artistStatus,
  variant = "standalone",
  className = "",
}: ArtistCTAProps) {
  // Use passed props to avoid redundant Supabase queries when data is already available
  let resolvedUser = user;
  let resolvedArtistStatus = artistStatus;

  if (resolvedUser === undefined) {
    resolvedUser = await getCurrentUser();
  }

  if (resolvedUser?.role === "artist" && resolvedArtistStatus === undefined) {
    resolvedArtistStatus = await getCurrentArtistStatus(resolvedUser.id);
  }

  // Determine copy and action configuration based on authentication & profile state
  let badge = "Are you an artist or performer?";
  let badgeColor = "text-purple-300";
  let heading = "Showcase Your Talent to People Who Want to Hire You";
  let description =
    "Join The Artist Network to build your professional presence, receive direct enquiries from event organizers and businesses, and grow your artistic career.";
  let primaryButton = {
    label: "Join as an Artist",
    href: "/signup",
    className:
      "w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 transition-all inline-block",
  };
  let secondaryButton: { label: string; href: string } | null = {
    label: "How It Works for Artists",
    href: "/#how-it-works",
  };
  let footnote =
    "Create your free profile, upload your portfolio, and get discovered by clients across India.";

  if (resolvedUser) {
    if (resolvedUser.role === "admin") {
      // 6. Logged-in admin
      badge = "Platform Administration";
      badgeColor = "text-purple-300";
      heading = "Admin Control Center";
      description =
        "Review incoming artist applications, manage verifications, inspect moderation audit trails, and oversee marketplace operations.";
      primaryButton = {
        label: "Open Admin Dashboard",
        href: "/admin",
        className:
          "w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 transition-all inline-block",
      };
      secondaryButton = {
        label: "Review Applications",
        href: "/admin/applications",
      };
      footnote = "Logged in with administrator privileges.";
    } else if (resolvedUser.role === "business") {
      // 5. Logged-in business user
      badge = "Venue & Business Portal";
      badgeColor = "text-purple-300";
      heading = "Find & Discover Exceptional Artists";
      description =
        "Discover singers, DJs, live bands, dancers, and visual artists tailored for your venue, corporate functions, and private celebrations.";
      primaryButton = {
        label: "Discover Artists",
        href: "/artists",
        className:
          "w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 transition-all inline-block",
      };
      secondaryButton = {
        label: "Venue Dashboard",
        href: "/dashboard/restaurant",
      };
      footnote =
        "Browse artist portfolios, compare indicative rates, and explore creative talent across India.";
    } else if (resolvedUser.role === "artist") {
      const status = resolvedArtistStatus?.profile_status;

      if (status === "suspended") {
        // 4. Logged-in artist with a suspended profile
        badge = "Account Notice";
        badgeColor = "text-amber-300";
        heading = "Your Artist Profile Is Suspended";
        description =
          "Your artist profile is currently suspended by platform moderation and is hidden from public discovery. Please review your dashboard for details and resolution steps.";
        primaryButton = {
          label: "View Profile Status",
          href: "/dashboard/artist",
          className:
            "w-full sm:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-base rounded-full shadow-lg shadow-rose-600/30 hover:shadow-xl hover:scale-105 transition-all inline-block",
        };
        // Do not encourage republishing while suspended
        secondaryButton = null;
        footnote =
          "Please review the moderation notice on your artist dashboard for resolution guidance.";
      } else if (status === "published") {
        // 3. Logged-in artist with a published profile
        badge = "Profile Active & Discoverable";
        badgeColor = "text-emerald-300";
        heading = "Your Artist Profile Is Live";
        description =
          "Your public profile and portfolio are actively showcased to event organizers, restaurants, and clients across India.";
        primaryButton = {
          label: "Manage My Profile",
          href: "/dashboard/artist",
          className:
            "w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 transition-all inline-block",
        };
        secondaryButton = {
          label: "View Public Profile",
          href: resolvedArtistStatus?.slug
            ? `/artists/${resolvedArtistStatus.slug}`
            : "/artists",
        };
        footnote =
          "Keep your portfolio and indicative rates up-to-date to present your work to prospective clients.";
      } else if (status === "pending_review") {
        // Artist profile submitted and awaiting moderation
        badge = "Submission Under Review";
        badgeColor = "text-amber-300";
        heading = "Your Artist Profile Is Under Review";
        description =
          "Our moderation team is reviewing your profile and portfolio. You will be notified once reviewed and published to the directory.";
        primaryButton = {
          label: "View Application Status",
          href: "/dashboard/artist",
          className:
            "w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 transition-all inline-block",
        };
        secondaryButton = {
          label: "Edit Submission",
          href: "/dashboard/artist/edit",
        };
        footnote =
          "Administrative review typically takes 24–48 hours. Submissions are checked to maintain high community standards.";
      } else {
        // 2. Logged-in artist with no profile or an unpublished draft (draft, rejected, or not yet created)
        badge = "Artist Profile Setup";
        badgeColor = "text-purple-300";
        heading = "Complete Your Artist Profile";
        description =
          "Your artist account is active, but your profile is not live yet. Add your stage details, genres, pricing, and portfolio to submit for review.";
        primaryButton = {
          label: "Continue Profile Setup",
          href: "/dashboard/artist/edit",
          className:
            "w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 transition-all inline-block",
        };
        secondaryButton = {
          label: "Artist Dashboard",
          href: "/dashboard/artist",
        };
        footnote =
          "Complete your profile to showcase your talent and get discovered across India.";
      }
    }
  }

  const cardContent = (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 px-6 py-16 sm:px-12 sm:py-20 text-center shadow-2xl">
      {/* Subtle background glow */}
      <div
        className="absolute top-0 right-0 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-2xl mx-auto">
        <span
          className={`inline-block font-semibold text-xs sm:text-sm uppercase tracking-widest mb-4 ${badgeColor}`}
        >
          {badge}
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
          {heading}
        </h2>
        <p className="text-purple-200 text-base sm:text-lg leading-relaxed mb-8">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href={primaryButton.href} className={primaryButton.className}>
            {primaryButton.label}
          </Link>
          {secondaryButton && (
            <Link
              href={secondaryButton.href}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-base rounded-full hover:bg-white/20 transition-all inline-block"
            >
              {secondaryButton.label}
            </Link>
          )}
        </div>

        <p className="mt-6 text-purple-300/80 text-xs">{footnote}</p>
      </div>
    </div>
  );

  if (variant === "embedded") {
    return <div className={`max-w-5xl mx-auto ${className}`}>{cardContent}</div>;
  }

  return (
    <section className={`py-20 px-4 sm:px-6 lg:px-8 bg-white ${className}`}>
      <div className="max-w-5xl mx-auto">{cardContent}</div>
    </section>
  );
}
