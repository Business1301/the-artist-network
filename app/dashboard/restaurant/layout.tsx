import { requireBusiness } from "@/lib/auth/business";

/**
 * Server-side layout gate for all /dashboard/restaurant routes.
 * requireBusiness() runs on every request before any child page renders,
 * blocking unauthenticated and non-business accounts server-side.
 */
export const instant = false;

export default async function RestaurantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireBusiness();
  return <>{children}</>;
}

