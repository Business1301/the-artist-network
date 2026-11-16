import { connection } from "next/server";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { getCurrentUser } from "@/app/auth/actions";

export const instant = false;

export const metadata = {
  title: "Community Guidelines | The Artist Network",
  description:
    "Standards of authenticity, respect, intellectual property, and safety for artists, venues, and clients on The Artist Network.",
};

export default async function CommunityGuidelinesPage() {
  await connection();
  const currentUser = await getCurrentUser();

  return (
    <>
      <Navbar initialUser={currentUser} />

      <main className="min-h-screen bg-white text-gray-900 pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="border-b border-gray-200 pb-8 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold mb-4">
              <span>🌟</span> Marketplace Standards
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
              Community Guidelines
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600">
              The Artist Network exists to empower Indian creative talent and connect performers with real opportunities in an atmosphere of trust, professional integrity, and mutual respect.
            </p>
          </div>

          {/* Guidelines Body */}
          <div className="space-y-10 text-sm sm:text-base text-gray-700 leading-relaxed">
            {/* 1. Authentic Profiles */}
            <section id="authenticity">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span>1.</span> Authentic Artist Profiles &amp; Honest Representation
              </h2>
              <p className="mb-3">
                Integrity is the foundation of our creative marketplace. We require every artist and performer to represent their identity, experience, and artistic capabilities honestly:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <strong>True Identity:</strong> While you may perform under a creative stage name, your profile must represent your actual creative work.
                </li>
                <li>
                  <strong>Accurate Experience &amp; Specialities:</strong> Do not fabricate years of experience, awards, playback credits, or notable performances that you did not actually participate in.
                </li>
                <li>
                  <strong>Accurate Indicative Pricing:</strong> Starting prices and fee units listed on your profile should reflect realistic baseline figures to provide venue managers and clients with genuine expectations.
                </li>
              </ul>
            </section>

            {/* 2. Zero Tolerance for Impersonation */}
            <section id="impersonation">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span>2.</span> Zero Tolerance for Impersonation &amp; Identity Theft
              </h2>
              <p className="mb-3">
                Impersonating another artist, band, celebrity, management agency, or business is strictly prohibited and constitutes an immediate violation of platform rules and applicable Indian law:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>Never register or submit a profile claiming to be an artist or band without express, verifiable legal authority to represent them.</li>
                <li>Do not create parody or spoof artist profiles that deceive clients or harm an artist&apos;s commercial reputation.</li>
                <li>Do not claim false affiliations with record labels, television shows, reality competitions, or commercial venues.</li>
              </ul>
            </section>

            {/* 3. Respectful Communication */}
            <section id="respect">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span>3.</span> Respectful Communication &amp; Professional Conduct
              </h2>
              <p className="mb-3">
                Whether negotiating requirements, discussing technical riders, or communicating offline, we expect all participants in our community to maintain professional decorum:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li><strong>No Harassment or Bullying:</strong> Stalking, hate speech, abusive language, intimidation, and unwarranted personal attacks are strictly forbidden.</li>
                <li><strong>No Discrimination:</strong> Discrimination or derogatory behavior based on religion, caste, gender, sexual orientation, disability, language, or regional origin will result in immediate expulsion.</li>
                <li><strong>Honoring Commitments:</strong> If you commit to an event, performance, or schedule, treat that commitment with utmost professional responsibility. Repeated unexcused cancellations harm the reputation of the creative community.</li>
              </ul>
            </section>

            {/* 4. Copyright & Portfolio Integrity */}
            <section id="copyright">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span>4.</span> Intellectual Property &amp; Portfolio Media Integrity
              </h2>
              <p className="mb-3">
                Originality and respect for creative work are central to The Artist Network:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <strong>Only Upload Authorized Media:</strong> Upload only photos, audio tracks, and performance videos that you created, own, or have written permission/licensing to distribute.
                </li>
                <li>
                  <strong>Do Not Misappropriate Other Artists&apos; Work:</strong> Using another artist&apos;s recorded vocals, audition clips, or portfolio photography to pass off as your own is grounds for immediate profile removal and permanent ban.
                </li>
                <li>
                  <strong>External Social Media:</strong> When linking Instagram and YouTube channels, ensure the connected handles belong to your official artistic presence.
                </li>
              </ul>
            </section>

            {/* 5. Prohibited & Harmful Content */}
            <section id="prohibited-content">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span>5.</span> Prohibited Content &amp; Illegal Activities
              </h2>
              <p className="mb-3">
                The following content types are strictly prohibited from being hosted, linked, or shared anywhere on the Platform:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>Sexually explicit, pornographic, or non-consensual sexual material.</li>
                <li>Graphic depictions of violence, self-harm, or animal cruelty.</li>
                <li>Promotion or facilitation of illegal drugs, unauthorized weapons, or unlawful activities under Indian law.</li>
                <li>Phishing links, malicious URLs, scam solicitations, or deceptive financial schemes.</li>
                <li>Content that threatens the sovereignty, integrity, or public order of India.</li>
              </ul>
            </section>

            {/* 6. Moderation & Enforcement Capabilities */}
            <section id="moderation-enforcement">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span>6.</span> How We Enforce Standards: Moderation Architecture
              </h2>
              <p className="mb-3">
                Our platform enforces community standards through technical and human safeguards:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm mb-1">Pre-Publication Review</h3>
                  <p className="text-xs text-gray-600">
                    Newly submitted profiles undergo administrative review before appearing in public directory searches. Incomplete or suspicious submissions are returned with clear guidance.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm mb-1">Mandatory Rejection Reasons</h3>
                  <p className="text-xs text-gray-600">
                    If an administrator rejects an artist submission, the database enforces a mandatory, detailed explanation so the artist can rectify their submission.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm mb-1">Immediate Profile Suspension</h3>
                  <p className="text-xs text-gray-600">
                    Administrators have the capability to instantly suspend non-compliant profiles, hiding them from public search, while immutable audit trails log the action.
                  </p>
                </div>
              </div>
            </section>

            {/* 7. Reporting Suspicious Profiles */}
            <section id="reporting">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span>7.</span> Reporting Inappropriate Profiles or Conduct
              </h2>
              <p className="mb-3">
                If you encounter a profile that impersonates someone, infringes your copyright, displays offensive material, or violates these guidelines, please report it immediately:
              </p>
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs sm:text-sm text-purple-900 space-y-2">
                <p>
                  <strong>How to Report:</strong> Contact our team via <Link href="/contact" className="underline font-bold">our Contact Page</Link> or email our moderation desk with:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The URL or stage name of the profile.</li>
                  <li>A description of the violation (e.g. copyright infringement, fake bio, harassment).</li>
                  <li>Any supporting links or documentation.</li>
                </ul>
                <p className="text-xs text-purple-800">
                  Reports are treated confidentially and reviewed by our administrative team.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

