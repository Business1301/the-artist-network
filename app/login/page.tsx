import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/app/auth/actions";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import LoginClient from "./LoginClient";

export const instant = false;

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Instruct Next.js 16 App Router that this execution requires request-time data
  await connection();

  // Authoritative server-side session and database role check
  const currentUser = await getCurrentUser();

  const resolvedSearchParams = await searchParams;
  const rawRedirectTo =
    typeof resolvedSearchParams.redirectTo === "string"
      ? resolvedSearchParams.redirectTo
      : typeof resolvedSearchParams.redirect === "string"
      ? resolvedSearchParams.redirect
      : undefined;
  const isUnauthorized = resolvedSearchParams.unauthorized === "true";

  if (currentUser) {
    // Authenticated users navigating to /login must be redirected to their dashboard
    // or to a validated internal redirect path matching their role permissions
    const safeTarget = getSafeRedirectPath(rawRedirectTo, currentUser.role);
    redirect(safeTarget);
  }

  return (
    <LoginClient
      redirectTo={rawRedirectTo}
      isUnauthorized={isUnauthorized}
    />
  );
}
