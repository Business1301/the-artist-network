import { connection } from "next/server";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { getCurrentUser } from "@/app/auth/actions";

export const instant = false;

export const metadata = {
  title: "Privacy Policy | The Artist Network",
  description:
    "Detailed Privacy Policy explaining how The Artist Network collects, processes, and protects personal and professional data in compliance with Indian law.",
};

export default async function PrivacyPage() {
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
              <span>🔒</span> Privacy &amp; Data Protection
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last Updated: November 2026 • Governing Framework: Digital Personal Data Protection Act, 2023 &amp; Information Technology Act, 2000 (India)
            </p>
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <strong>Architecture Transparency Notice:</strong> This privacy policy strictly reflects the actual code, database architecture, and data processing workflows implemented in The Artist Network. We do not make false claims regarding automated controls or security features that have not yet been built.
            </div>
          </div>

          {/* Privacy Policy Body */}
          <div className="space-y-10 text-sm sm:text-base text-gray-700 leading-relaxed">
            {/* 1. Introduction & Overview */}
            <section id="introduction">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                1. Introduction &amp; Who We Are
              </h2>
              <p className="mb-3">
                The Artist Network (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides an online discovery platform connecting Indian creative talent (musicians, singers, DJs, bands, dancers, visual artists, and entertainers) with hospitality venues, businesses, and event organizers.
              </p>
              <p>
                This Privacy Policy explains what personal and professional information we collect, how it is stored, who can see it, and your rights as a data principal under Indian data protection legislation, including the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act, 2023)</strong> and the <strong>Information Technology Act, 2000</strong> with associated Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
              </p>
            </section>

            {/* 2. Clear Separation: Public vs. Strictly Private Data */}
            <section id="data-classification">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                2. Classification: Public vs. Strictly Private Data
              </h2>
              <p className="mb-4">
                Our database architecture enforces a strict boundary between public showcase information and private account data:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                {/* Public Data */}
                <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Publicly Visible Information
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Visible to all visitors, search engines, and logged-in users once an artist profile is approved and published:
                  </p>
                  <ul className="text-xs text-gray-700 space-y-1.5 list-disc pl-4">
                    <li><strong>Stage Name</strong> (Artistic moniker chosen by you)</li>
                    <li><strong>Category, Genres &amp; Specialities</strong></li>
                    <li><strong>City and State</strong> (General location in India)</li>
                    <li><strong>Public Bio &amp; Experience Years</strong></li>
                    <li><strong>Performance Types &amp; Languages</strong></li>
                    <li><strong>Indicative Starting Rate &amp; Unit</strong> (e.g. per event)</li>
                    <li><strong>Profile &amp; Cover Images</strong></li>
                    <li><strong>Public Portfolio Items</strong> (photos, audio links, YouTube video embeds)</li>
                    <li><strong>Public Social Media URLs</strong> (Instagram, YouTube)</li>
                    <li><strong>Technical Rider Terms</strong> (stage &amp; sound specifications)</li>
                  </ul>
                </div>

                {/* Strictly Private Data */}
                <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/40">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Strictly Confidential &amp; Private Data
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Shielded at the database level using Row Level Security (RLS). Never exposed in public directory feeds or public profile endpoints:
                  </p>
                  <ul className="text-xs text-gray-700 space-y-1.5 list-disc pl-4">
                    <li><strong>Legal Full Name</strong> (Stored in <code>public.profiles</code>, accessible only to you and platform admins)</li>
                    <li><strong>Account Email Address</strong></li>
                    <li><strong>Password Hashes</strong> (Managed exclusively by Supabase Auth)</li>
                    <li><strong>Artist Calendar Events:</strong>
                      <ul className="list-circle pl-3 mt-0.5 space-y-0.5 text-rose-950 font-medium">
                        <li>Client Name, Phone &amp; Email</li>
                        <li>Agreed Performance Fees &amp; Deposits Paid</li>
                        <li>Private Booking Notes &amp; Unavailability Blocks</li>
                        <li>Event Venue Street Address</li>
                      </ul>
                    </li>
                    <li><strong>Moderation Rejection Notes &amp; Internal Audit Logs</strong></li>
                    <li><strong>Business Contact Information</strong></li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. Detailed Breakdown of Data We Collect */}
            <section id="data-collected">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                3. What Information We Collect
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">A. Registration &amp; Authentication Details</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    When you sign up via <code>/signup</code>, we collect your email address, chosen account role (<code>artist</code> or <code>business</code>), and your legal full name. Authentication credentials (passwords) are hashed and securely stored by our authentication provider (Supabase Auth). We never see or store plaintext passwords.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">B. Artist Profile &amp; Portfolio Submissions</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    When you set up or edit an artist profile, you submit details such as your stage name, biographical description, performance categories, musical genres, starting fees, profile and cover photography, and third-party media links (e.g. YouTube video links and Instagram handles).
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">C. Private Calendar &amp; Schedule Information</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Artists may utilize our private scheduling calendar to log upcoming gigs, external bookings, and unavailable dates. You may choose to record optional private metadata (client names, phone numbers, email addresses, agreed fees, and personal notes). This information is strictly restricted to your authenticated user ID through database Row Level Security and atomic server RPCs.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">D. Business Account Information</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    When registering as a business or venue, we record your business name and designated contact name.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Cookies, Session State & Tracking */}
            <section id="cookies-tracking">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                4. Cookies, Local Storage &amp; Tracking Technologies
              </h2>
              <p className="mb-3">
                We maintain an honest, minimal data tracking posture. Below is a comprehensive audit of all cookies and storage mechanisms used by the Platform:
              </p>

              <div className="overflow-x-auto my-4 border border-gray-200 rounded-xl">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50 text-gray-700 font-bold">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Mechanism</th>
                      <th className="px-4 py-2.5 text-left">Provider</th>
                      <th className="px-4 py-2.5 text-left">Purpose</th>
                      <th className="px-4 py-2.5 text-left">Essential / Optional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-600">
                    <tr>
                      <td className="px-4 py-2.5 font-mono text-[11px]">sb-*-auth-token</td>
                      <td className="px-4 py-2.5">Supabase Auth (@supabase/ssr)</td>
                      <td className="px-4 py-2.5">Maintains your authenticated session across server navigation and API requests.</td>
                      <td className="px-4 py-2.5 text-purple-700 font-semibold">Strictly Essential</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-mono text-[11px]">localStorage (tan_auth_user)</td>
                      <td className="px-4 py-2.5">First-party (Browser)</td>
                      <td className="px-4 py-2.5">Caches non-sensitive UI role state to prevent screen flicker during page transitions.</td>
                      <td className="px-4 py-2.5 text-purple-700 font-semibold">Strictly Essential</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-mono text-[11px]">YouTube Embeds (iframe)</td>
                      <td className="px-4 py-2.5">Google LLC / YouTube</td>
                      <td className="px-4 py-2.5">Rendered on artist profiles when an artist provides a YouTube performance URL. Google may place cookies or gather telemetry per YouTube&apos;s privacy policy.</td>
                      <td className="px-4 py-2.5 text-amber-700 font-semibold">Third-Party Content</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
                <p><strong>No Advertising Trackers:</strong> We do not deploy advertising cookies, Meta Pixels, Google Ads remarketing tags, or third-party behavioral trackers.</p>
                <p><strong>No Web Analytics Scripts:</strong> No third-party behavioral analytics or session recording scripts (e.g. Hotjar, Clarity) are currently installed.</p>
              </div>
            </section>

            {/* 5. Purpose of Processing */}
            <section id="purpose-processing">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                5. Lawful Grounds &amp; Purposes of Processing
              </h2>
              <p className="mb-3">
                Under the DPDP Act, 2023, we process personal data based on your consent and legitimate uses to provide our services, specifically:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>Creating and managing your user account, authentication, and role authorization.</li>
                <li>Displaying published artist profiles to potential clients and businesses across India.</li>
                <li>Providing artists with a private, secure calendar to manage bookings and schedule blocks.</li>
                <li>Conducting administrative moderation to prevent spam, impersonation, and fraudulent listings.</li>
                <li>Maintaining immutable audit logs of moderation decisions to ensure administrative accountability.</li>
                <li>Complying with statutory obligations and lawful requests under Indian law.</li>
              </ul>
            </section>

            {/* 6. Third-Party Service Providers & Infrastructure */}
            <section id="service-providers">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                6. Service Providers &amp; Infrastructure
              </h2>
              <p className="mb-3">
                We share data only with trusted infrastructure providers necessary to operate the Platform:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <strong>Supabase Inc. (Database &amp; Authentication):</strong> Our PostgreSQL database, authentication service, and file storage are hosted on Supabase cloud infrastructure. Data is transmitted via HTTPS and protected by PostgreSQL Row Level Security.
                </li>
                <li>
                  <strong>Netlify (Web Hosting &amp; Edge Delivery):</strong> Our Next.js application is deployed on Netlify, which handles serverless functions, proxy sessions, and edge caching.
                </li>
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                We never sell, rent, or trade your personal data to data brokers, advertisers, or third-party marketing companies.
              </p>
            </section>

            {/* 7. Data Storage, Security & Cross-Border Processing */}
            <section id="security-storage">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                7. Data Storage, Security Safeguards &amp; Cross-Border Transfers
              </h2>
              <p className="mb-3">
                We implement technical safeguards to prevent unauthorized access, alteration, or disclosure of personal data:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600 mb-3">
                <li>Encrypted data transmission in transit using modern TLS / HTTPS.</li>
                <li>PostgreSQL Row Level Security (RLS) enforcing strict tenant separation at the database engine level.</li>
                <li>Database triggers preventing unauthorized client-side role modifications or self-promotion.</li>
                <li>Security-definer RPC functions locking the PostgreSQL search path against SQL injection.</li>
              </ul>
              <p className="text-xs text-gray-500">
                <strong>Cross-Border Transfer Notice:</strong> Cloud infrastructure providers (Supabase, Netlify) operate global networks. Consequently, encrypted data may be processed on servers located outside India in jurisdictions permitted under Central Government notifications pursuant to Section 16 of the DPDP Act, 2023.
              </p>
            </section>

            {/* 8. Data Retention, Account Deletion & Unimplemented Features */}
            <section id="retention-deletion">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                8. Data Retention, Account Deletion &amp; Unimplemented Controls
              </h2>
              <p className="mb-3">
                We retain personal data for as long as your account remains active or as required to fulfill the purposes set out in this Policy.
              </p>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed mb-3">
                <h3 className="font-bold text-amber-950 mb-1">Notice of Technical &amp; Operational Status:</h3>
                <ul className="list-disc pl-4 space-y-1 text-xs text-amber-900">
                  <li><strong>Automated Self-Service Account Deletion:</strong> An automated one-click account deletion button has not yet been implemented in the user settings UI. If you wish to delete your account and personal data, you must submit a written deletion request via our <Link href="/contact" className="underline font-bold">Contact Page</Link>, which will be manually processed by our database administrator within 30 days.</li>
                  <li><strong>Automated Data Portability Export:</strong> Automated self-serve data export tools are currently in development. Data access requests are handled manually via written request.</li>
                  <li><strong>Consent Management Banner:</strong> Because only strictly essential authentication cookies and no advertising trackers are used, an interactive cookie consent popup is not currently deployed.</li>
                </ul>
              </div>
            </section>

            {/* 9. Your Rights as a Data Principal under Indian Law */}
            <section id="principal-rights">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                9. Your Rights as a Data Principal
              </h2>
              <p className="mb-3">
                Subject to applicable provisions of the DPDP Act, 2023, you have the following rights:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li><strong>Right to Access Information:</strong> Request a summary of the personal data processed about you and the processing activities undertaken.</li>
                <li><strong>Right to Correction &amp; Erasure:</strong> Correct inaccurate data (which artists can do directly via <code>/dashboard/artist/edit</code>) or request the erasure of personal data that is no longer necessary.</li>
                <li><strong>Right of Grievance Redressal:</strong> Submit a grievance to our designated Grievance Officer regarding any violation of data privacy provisions.</li>
                <li><strong>Right to Nominate:</strong> Nominate an individual to exercise your privacy rights in the event of death or incapacity.</li>
              </ul>
            </section>

            {/* 10. Children's Privacy (Under 18) */}
            <section id="children-privacy">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                10. Children&apos;s Privacy (Individuals Under 18)
              </h2>
              <p className="mb-3">
                The Artist Network is strictly intended for individuals who are at least 18 years of age. We do not knowingly collect personal data from children or minors under 18. In accordance with Section 9 of the DPDP Act, 2023, the Platform does not engage in behavioral monitoring, tracking, or targeted advertising directed at minors.
              </p>
              <p className="text-xs text-gray-500">
                If we discover that a user under 18 has registered an account without verifiable legal authorization, we will terminate the account and delete associated personal data.
              </p>
            </section>

            {/* 11. Grievance Officer & Contact Details */}
            <section id="grievance-officer">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                11. Grievance Officer &amp; Privacy Contact (Framework Alignment)
              </h2>
              <p className="mb-3">
                In alignment with the statutory principles of the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, an official Grievance Redressal Officer will be appointed and published prior to commercial public launch. During this testing preview, the designated responsibilities are structured as follows:
              </p>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm space-y-1.5 text-gray-700">
                <p><strong>Designation:</strong> Grievance Redressal Officer</p>
                <p><strong>Officer Status:</strong> <span className="text-amber-800 font-medium">To be officially designated and published by platform owner prior to public launch</span></p>
                <p><strong>Channel Status:</strong> <span className="text-amber-800 font-medium">Pending platform owner configuration (Non-operational during testing preview)</span></p>
                <p><strong>Response Protocol:</strong> Statutory 48-hour acknowledgement and 30-day resolution timelines will become operational upon official appointment and launch.</p>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                For further details regarding testing status, please visit our <Link href="/contact" className="text-purple-600 font-semibold underline hover:text-purple-800">Contact Us Page</Link>.
              </p>
            </section>

            {/* 12. Updates to this Policy */}
            <section id="policy-updates">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                12. Changes to this Privacy Policy
              </h2>
              <p>
                We may revise this Privacy Policy periodically as new platform features are deployed (such as Phase 5 booking enquiries or automated deletion workflows) or as the Central Government of India notifies new rules under the DPDP Act. Any updates will be published on this page with an updated &quot;Last Updated&quot; date.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer user={currentUser} />
    </>
  );
}

