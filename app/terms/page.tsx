import { connection } from "next/server";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { getCurrentUser } from "@/app/auth/actions";

export const instant = false;

export const metadata = {
  title: "Terms & Conditions | The Artist Network",
  description:
    "Terms & Conditions governing the use of The Artist Network, an India-focused artist discovery and creative showcase platform.",
};

export default async function TermsPage() {
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
              <span>📜</span> Legal Documentation
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
              Terms &amp; Conditions
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last Updated: November 2026 • Effective Version: Pre-Launch Testing &amp; Preview
            </p>
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <strong>Notice:</strong> The Artist Network is currently operating in a testing and evaluation version (not an officially launched commercial booking service). By accessing or registering an account, you acknowledge and agree to these Terms.
            </div>
          </div>

          {/* Document Content */}
          <div className="space-y-10 text-sm sm:text-base text-gray-700 leading-relaxed">
            {/* 1. Purpose & Scope */}
            <section id="purpose">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                1. Purpose &amp; Scope of the Platform
              </h2>
              <p className="mb-3">
                The Artist Network (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a digital talent discovery and creative showcase directory focused on the Indian creative economy. The Platform enables artists (singers, musicians, DJs, bands, dancers, visual artists, and performers) to build professional portfolios, manage private availability calendars, and showcase their talents to event organizers, businesses, hospitality venues, and the general public.
              </p>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:text-sm font-medium space-y-2">
                <p>
                  <strong>Important Operational Clarification:</strong> The Platform enables direct, non-binding booking enquiries between registered businesses and published artists. Submitting an enquiry or receiving an artist&apos;s expression of interest does <strong>NOT</strong> constitute a confirmed booking, reservation, or legally binding contract.
                </p>
                <p className="text-xs text-gray-600">
                  The Platform does <strong>NOT</strong> operate or provide completed online booking checkouts, payment processing, advance escrow deposits, contracts of engagement, refunds, or dispute-management workflows. Any commercial contracts, fee payments, rider arrangements, and performance schedules are conducted directly and independently between artists and clients off-platform.
                </p>
              </div>
            </section>

            {/* 2. Eligibility & Account Registration */}
            <section id="eligibility">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                2. Eligibility &amp; Account Registration
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Age Eligibility:</strong> You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to register an account or create a profile on the Platform. If you are under 18, you may not register an account.
                </li>
                <li>
                  <strong>Account Types:</strong> Registration is permitted strictly under two user roles:
                  <ul className="list-circle pl-5 mt-1 space-y-1 text-gray-600">
                    <li><strong>Artist Account:</strong> For individual performers, musicians, bands, or creators showcasing their talent.</li>
                    <li><strong>Business Account:</strong> For venues, event organizers, hospitality companies, or corporate organizers seeking talent.</li>
                  </ul>
                </li>
                <li>
                  <strong>Accurate Information:</strong> You agree to provide true, accurate, current, and complete information during registration and keep your account details up to date.
                </li>
                <li>
                  <strong>Account Security:</strong> You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized access.
                </li>
              </ul>
            </section>

            {/* 3. Artist Profiles, Self-Publishing & Verification */}
            <section id="verification">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                3. Artist Profiles, Self-Publishing &amp; Verification
              </h2>
              <p className="mb-3">
                To maintain transparency and prevent deception, users must understand the distinction between profile submission, publication, and verification:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">Administrative Profile Review</h3>
                  <p className="text-xs text-gray-600">
                    When an artist submits a profile, it enters an administrative review queue before publication. Administrative review checks for baseline compliance with community standards, completeness, and decency. Approval to publish does <em>not</em> imply any endorsement, background check, or certification of talent or reliability.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">Verified Artist Badge (&quot;✓ Verified&quot;)</h3>
                  <p className="text-xs text-gray-600">
                    The &quot;✓ Verified&quot; badge is an administrative designation granted solely at our discretion to artists who have undergone independent identity and portfolio cross-checks. A verified badge does <strong>not</strong> constitute a legal warranty, safety guarantee, or performance insurance for any event.
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Artists are not automatically verified upon registration or upon submitting a profile. Self-publishing does not equal verification.
              </p>
            </section>

            {/* 4. Indicative Rates & Artist Rider Terms */}
            <section id="pricing">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                4. Indicative Rates &amp; Technical Riders
              </h2>
              <p className="mb-3">
                Any starting prices, fee ranges, or technical requirements (such as sound systems, stage dimensions, microphones, or travel provisions) displayed on an artist profile are indicative estimates configured directly by the artist.
              </p>
              <p>
                The Platform does not set, control, or guarantee artist fees or terms. All commercial pricing, deposits, technical riders, cancellations, and performance logistics must be independently negotiated and agreed upon directly between the artist and the prospective client off-platform.
              </p>
            </section>

            {/* 5. User-Generated Content & Intellectual Property */}
            <section id="intellectual-property">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                5. User-Generated Content &amp; Intellectual Property
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Ownership Retained:</strong> You retain all intellectual property rights, copyright, and ownership in the photos, recordings, bios, audio tracks, and materials (&quot;User Content&quot;) that you submit or link to the Platform.
                </li>
                <li>
                  <strong>Limited Display License:</strong> By submitting User Content, you grant The Artist Network a worldwide, non-exclusive, royalty-free, transferable license solely to host, store, cache, reformat, publicly display, and distribute your User Content across our website, mobile layouts, and discovery directories for the purpose of operating and promoting your artist profile.
                </li>
                <li>
                  <strong>Representations &amp; Warranties:</strong> You represent and warrant that you own or possess all necessary rights, licenses, consents, and permissions to upload and display all User Content submitted to the Platform, and that your content does not infringe the intellectual property, privacy, or publicity rights of any third party.
                </li>
              </ul>
            </section>

            {/* 6. Prohibited Activities & Conduct */}
            <section id="prohibited-conduct">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                6. Prohibited Conduct &amp; Content
              </h2>
              <p className="mb-3">You agree not to use the Platform to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>Impersonate any person, artist, band, musical group, or entity, or falsely claim affiliation with any organization.</li>
                <li>Submit false, fraudulent, deceptive, or misleading profile details, experience levels, or portfolio samples.</li>
                <li>Upload or transmit content that is obscene, sexually explicit, defamatory, abusive, harassing, hateful, or promotes illegal acts.</li>
                <li>Upload copyrighted audio, video, or photography belonging to third parties without express legal authorization.</li>
                <li>Interfere with, tamper with, or compromise the security, integrity, or availability of the Platform, its database, or APIs.</li>
                <li>Engage in automated scraping, data mining, crawling, or bulk harvesting of user data without prior written permission.</li>
                <li>Attempt to bypass or defeat authentication controls, role-based security mechanisms, or administrative moderation features.</li>
              </ul>
            </section>

            {/* 7. External Links (Instagram, YouTube & Third-Party Sites) */}
            <section id="external-links">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                7. External Third-Party Links &amp; Embeds
              </h2>
              <p className="mb-3">
                The Platform provides features allowing artists to link external social profiles (such as Instagram and YouTube) and embed media players. These external services are operated independently by third parties (e.g., Meta Platforms, Inc., Google LLC).
              </p>
              <p>
                We do not endorse, monitor, or exercise control over third-party websites or services. Your interaction with any external website is governed strictly by the terms and privacy policies of that third party. We accept no liability or responsibility for third-party content, tracking, or services.
              </p>
            </section>

            {/* 8. Copyright Infringement & Takedown Notices (India IT Rules) */}
            <section id="copyright-takedown">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                8. Copyright Infringement &amp; Notice-and-Takedown Procedure
              </h2>
              <p className="mb-3">
                The Artist Network respects the intellectual property rights of creators and operates in compliance with the Information Technology Act, 2000 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
              </p>
              <p className="mb-3">
                If you believe that any content hosted or displayed on the Platform infringes your copyright or trademark, please submit a formal written notice containing:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-gray-600 mb-3">
                <li>Identification of the copyrighted work claimed to have been infringed.</li>
                <li>The specific URL or profile link on our Platform where the infringing material is located.</li>
                <li>Your full name, contact address, telephone number, and official email address.</li>
                <li>A statement that you have a good-faith belief that use of the material is not authorized by the copyright owner, its agent, or the law.</li>
                <li>A statement made under penalty of perjury that the information in the notification is accurate and that you are authorized to act on behalf of the owner.</li>
              </ol>
              <p>
                Notices should be sent to our designated Grievance Officer via the contact details provided in <Link href="/contact" className="text-purple-600 font-semibold underline hover:text-purple-800">Section 13 (Contact Us)</Link>. Upon receipt of a valid notice, we will act expeditiously to review and, where appropriate, disable access to the infringing material.
              </p>
            </section>

            {/* 9. Platform Moderation, Suspension & Termination */}
            <section id="moderation">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                9. Platform Moderation, Account Suspension &amp; Termination
              </h2>
              <p className="mb-3">
                We reserve the right, in our sole discretion and without prior notice, to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600 mb-3">
                <li>Reject, unpublish, modify, or remove any artist profile or portfolio item that violates these Terms or our <Link href="/community-guidelines" className="text-purple-600 font-semibold underline hover:text-purple-800">Community Guidelines</Link>.</li>
                <li>Suspend or terminate account access for users who repeatedly infringe intellectual property rights or engage in abusive conduct.</li>
                <li>Revoke verification badges where credentials, identity, or conduct fail to meet platform standards.</li>
              </ul>
              <p>
                All administrative moderation actions are permanently logged in our internal audit system to ensure platform integrity and accountability.
              </p>
            </section>

            {/* 10. Platform Availability & Disclaimers */}
            <section id="disclaimers">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                10. Platform Availability &amp; Disclaimer of Warranties
              </h2>
              <p className="mb-3">
                The Platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, currently operating in a testing and evaluation release. To the maximum extent permitted under applicable Indian law:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>We make no warranties or representations regarding uninterrupted service, error-free operation, security against cyber attacks, or continuous uptime.</li>
                <li>We do not warrant or guarantee that an artist will receive gig offers or enquiries, nor that any business or client will find a suitable artist.</li>
                <li>We do not guarantee the quality, safety, punctuality, background, morality, or artistic competence of any registered artist or business client.</li>
                <li>Any engagement, contract, or offline meeting arranged between users is undertaken entirely at their own risk.</li>
              </ul>
            </section>

            {/* 11. Limitation of Liability */}
            <section id="liability">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                11. Limitation of Liability
              </h2>
              <p className="mb-3">
                As an intermediary platform under Section 79 of the Information Technology Act, 2000, The Artist Network, its operators, founders, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, contracts, goodwill, or artistic reputation, arising out of or in connection with:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 mb-3">
                <li>Your access to, use of, or inability to access or use the Platform.</li>
                <li>The conduct or content of any third-party or artist on the Platform.</li>
                <li>Any offline performance, event cancellation, payment dispute, property damage, or personal injury occurring at any gig or venue.</li>
                <li>Unauthorized access, alteration, or transmission of your profile or portfolio content.</li>
              </ul>
              <p className="text-xs text-gray-500">
                Nothing in these Terms excludes or limits liability that cannot be excluded or limited under the laws of India.
              </p>
            </section>

            {/* 12. Governing Law & Dispute Resolution */}
            <section id="governing-law">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                12. Governing Law &amp; Jurisdiction
              </h2>
              <p className="mb-3">
                These Terms and any dispute or claim arising out of or in connection with them or their subject matter shall be governed by and construed in accordance with the laws of the Republic of India, without regard to its conflict of law principles.
              </p>
              <p>
                Any legal action, proceeding, or arbitration arising from these Terms shall be subject to the exclusive jurisdiction of the competent courts located in India (specific judicial city/state forum to be formally designated by the platform owner prior to commercial launch).
              </p>
            </section>

            {/* 13. Modifications & Contact */}
            <section id="modifications">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                13. Changes to Terms &amp; Contact Information
              </h2>
              <p className="mb-3">
                We reserve the right to revise and update these Terms from time to time as platform features evolve (including the introduction of Phase 5 direct enquiries and booking workflows). The date of the most recent revision will be posted at the top of this page.
              </p>
              <p>
                For questions, legal inquiries, or grievance redressal, please review our <Link href="/contact" className="text-purple-600 font-semibold underline hover:text-purple-800">Contact Page</Link> or contact our team via the designated channels.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer user={currentUser} />
    </>
  );
}

