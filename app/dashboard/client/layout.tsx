import { ReactNode } from "react";
import { requireClient } from "@/lib/auth/client";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export const instant = false;

interface ClientDashboardLayoutProps {
  children: ReactNode;
}

export default async function ClientDashboardLayout({
  children,
}: ClientDashboardLayoutProps) {
  // Authoritative server-side authorization guard
  // Fails closed if not authenticated as role === 'individual'
  const clientUser = await requireClient("/dashboard/client");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar initialUser={clientUser} />
      <div className="flex-1">{children}</div>
      <Footer user={clientUser} />
    </div>
  );
}
