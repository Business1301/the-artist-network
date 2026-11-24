import { getArtistApplications } from "@/app/actions/admin";
import ApplicationsManager from "@/app/components/ApplicationsManager";

export const instant = false;

interface ApplicationsPageProps {
  searchParams: Promise<{ review?: string; status?: string; verified?: string }>;
}

export default async function ApplicationsPage({
  searchParams,
}: ApplicationsPageProps) {
  const resolvedParams = await searchParams;
  const initialApplications = await getArtistApplications("all");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Artist Applications & Moderation
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Review submitted artist onboarding applications, examine media portfolios, manage verification badges, and execute atomic moderation decisions.
        </p>
      </div>

      {/* Main Interactive Applications Manager */}
      <ApplicationsManager
        initialApplications={initialApplications}
        initialSelectedId={resolvedParams.review}
        initialStatusFilter={resolvedParams.status}
        initialVerifiedFilter={resolvedParams.verified}
      />
    </div>
  );
}

