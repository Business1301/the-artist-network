import { connection } from "next/server";
import Link from "next/link";
import { requireBusiness } from "@/lib/auth/business";
import {
  getBusinessGigApplicantsAction,
  getBusinessPostedGigsAction,
} from "@/app/actions/businessGigs";
import BusinessGigDetailClient from "@/app/components/business/BusinessGigDetailClient";

export const instant = false;

export default async function RestaurantGigDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  await requireBusiness();
  const { id } = await params;

  const [gigsRes, applicantsRes] = await Promise.all([
    getBusinessPostedGigsAction(),
    getBusinessGigApplicantsAction(id),
  ]);

  const matchedGig = gigsRes.success
    ? gigsRes.data?.find((g) => g.id === id)
    : undefined;

  if (!matchedGig) {
    return (
      <main className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-4 shadow-xs">
            <h1 className="text-xl font-extrabold text-gray-900">
              Gig Not Found or Unavailable
            </h1>
            <p className="text-xs text-gray-500">
              {!gigsRes.success
                ? gigsRes.error || "Unable to verify gig record."
                : "This gig does not belong to your business account or could not be found."}
            </p>
            <Link
              href="/dashboard/restaurant"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
            >
              ← Return to Business Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <BusinessGigDetailClient
      initialGig={matchedGig}
      initialApplicants={applicantsRes.success && applicantsRes.data ? applicantsRes.data : []}
    />
  );
}
