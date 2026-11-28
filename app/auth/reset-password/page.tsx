import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/app/auth/actions";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ResetPasswordClient from "./ResetPasswordClient";

export const instant = false;

export default async function ResetPasswordPage() {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?unauthorized=true");
  }

  const destination = getSafeRedirectPath(undefined, user.role);

  return (
    <>
      <Navbar initialUser={user} />
      <ResetPasswordClient
        userEmail={user.email || ""}
        redirectDestination={destination}
      />
      <Footer user={user} />
    </>
  );
}
