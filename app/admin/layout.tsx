import { requireAdmin } from "@/lib/auth/admin";
import AdminNavbar from "@/app/components/AdminNavbar";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authorization gate across all /admin child routes
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased">
      <AdminNavbar adminName={admin.fullName} adminEmail={admin.email} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-600">
        The Artist Network &bull; Platform Management &bull; Owner-Only Administration
      </footer>
    </div>
  );
}

