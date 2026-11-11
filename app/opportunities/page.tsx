import { connection } from "next/server";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OpportunitiesClient from "../components/OpportunitiesClient";
import { getCurrentUser } from "@/app/auth/actions";

export const instant = false;

export default async function OpportunitiesPage() {
  await connection();
  const currentUser = await getCurrentUser();

  return (
    <>
      <Navbar initialUser={currentUser} />
      <OpportunitiesClient />
      <Footer />
    </>
  );
}
