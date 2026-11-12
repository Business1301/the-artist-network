import { requireBusiness } from "@/lib/auth/business";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

/**
 * Server-side layout gate for all /dashboard/restaurant routes.
 * requireBusiness() runs on every request before any child page renders,
 * blocking unauthenticated and non-business accounts server-side.
 *
 * Renders verified Navbar and Footer in the layout shell, passing the
 * server-verified business identity directly as `initialUser`.
 */
export const instant = false;

export default async function RestaurantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const verifiedBusiness = await requireBusiness();

  return (
    <>
      <Navbar initialUser={verifiedBusiness} />
      {children}
      <Footer />
    </>
  );
}

