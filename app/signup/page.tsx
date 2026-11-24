import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/app/auth/actions";
import SignUpClient from "./SignUpClient";

export const instant = false;

interface SignUpPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  // Instruct Next.js 16 App Router that this execution requires request-time data
  await connection();

  // Authoritative server-side session and database role check
  const currentUser = await getCurrentUser();

  if (currentUser) {
    // Authenticated users must never see or submit the signup form
    if (currentUser.role === "admin") {
      redirect("/admin");
    } else if (currentUser.role === "business") {
      redirect("/dashboard/restaurant");
    } else if (currentUser.role === "individual") {
      redirect("/dashboard/client");
    } else {
      redirect("/dashboard/artist");
    }
  }

  const resolvedSearchParams = await searchParams;
  const initialRole =
    resolvedSearchParams.role === "business"
      ? "business"
      : resolvedSearchParams.role === "individual"
      ? "individual"
      : "artist";
  const redirectTo =
    typeof resolvedSearchParams.redirectTo === "string"
      ? resolvedSearchParams.redirectTo
      : undefined;

  return <SignUpClient initialRole={initialRole} redirectTo={redirectTo} />;
}
