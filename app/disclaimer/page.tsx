import { connection } from "next/server";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { getCurrentUser } from "@/app/auth/actions";

export const instant = false;

export const metadata = {
  title: "Disclaimer | The Artist Network",
  description:
    "Official disclaimers regarding platform scope, artist verification, indicative pricing, external links, and pre-launch testing status on The Artist Network.",
};

export default async function DisclaimerPage() {
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
              <span>⚖️</span> Legal Disclosures
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
              Platform Disclaimer
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last Updated: November 2026 • Effective for Pre-Launch Testing &amp; Preview
            </p>
          </div>

          {/* Disclaimer Content */}
          <div className="space-y-10 text-sm sm:text-base text-gray-700 leading-relaxed">
            {/* 1. Discovery & Direct Enquiry Nature */}
            <section id="platform-nature">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                1. Talent Discovery &amp; Direct Enquiry Nature
              </h2>
              <p className="mb-3">
                The Artist Network functions as an online talent discovery, portfolio showcase, and direct booking enquiry platform for artists and venue organizers across India.
              </p>
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs sm:text-sm font-medium space-y-2">
                <p>
                  <strong>Non-Binding Enquiry Framework:</strong> Booking enquiries submitted through the Platform represent non-binding expressions of interest to initiate direct communication regarding dates, requirements, and indicative budgets.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-purple-900">
                  <li>Submitting a booking enquiry does <strong>NOT</strong> confirm or guarantee an artist booking.</li>
                  <li>An artist&apos;s expression of interest or response does <strong>NOT</strong> constitute a legally binding contractual acceptance.</li>
                  <li>The Platform does <strong>NOT</strong> operate an online checkout, payment escrow, digital payment processing gateway, contract guarantor, or cancellation dispute-resolution mechanism.</li>
                </ul>
              </div>
            </section>

            {/* 2. Verification Disclaimer */}
            <section id="verification-disclaimer">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                2. Artist Verification &amp; Badge Disclosures
              </h2>
              <p className="mb-3">
                Where an artist profile displays a &quot;✓ Verified Artist&quot; badge, this signifies that our administration has conducted baseline cross-checks of the artist&apos;s identity and provided portfolio references.
              </p>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm space-y-2">
                <p>
                  <strong>No Guarantee of Performance or Character:</strong> Verification does <strong>NOT</strong> constitute an endorsement, recommendation, guarantee, or warranty of:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>The artistic quality, volume, or audience reception of any live performance.</li>
                  <li>The punctuality, physical attendance, or reliability of an artist for a booked date.</li>
                  <li>The suitability of an artist for any specific venue, cultural context, or audience demographic.</li>
                  <li>The legal standing, commercial background, or character of any individual.</li>
                </ul>
                <p className="text-xs">
                  Clients, event hosts, and venue managers are strongly advised to perform their own due diligence, review video samples, and execute appropriate formal contracts before booking performers.
                </p>
              </div>
            </section>

            {/* 3. Indicative Pricing & Fee Estimates */}
            <section id="pricing-disclaimer">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                3. Indicative Starting Rates &amp; Commercial Terms
              </h2>
              <p className="mb-3">
                All pricing figures, starting rates, and fee units (e.g. &quot;₹15,000 per event&quot;) displayed on artist cards and profiles are indicative benchmarks provided directly by the artists.
              </p>
              <p>
                Actual performance fees frequently vary depending on event duration, venue size, technical rider requirements, city/travel logistics, public holidays, and date demand. The Artist Network does not set, enforce, or collect artist fees. All pricing, deposits, and payment terms must be finalized directly between the contracting parties off-platform.
              </p>
            </section>

            {/* 4. External Links & Third-Party Platforms */}
            <section id="external-links-disclaimer">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                4. Third-Party Websites &amp; Social Media Links
              </h2>
              <p className="mb-3">
                Artist profiles may feature outbound links to third-party services, including Instagram profiles, YouTube channels, and personal websites, as well as embedded media players.
              </p>
              <p>
                These external platforms are operated independently. We do not control, verify, or assume responsibility for any content, advertising, data collection, or privacy practices on third-party sites. Clicking any external link is done at your own discretion.
              </p>
            </section>

            {/* 5. Future Transactional Capabilities & Scope */}
            <section id="roadmap-disclaimer">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                5. Status of Transactional &amp; Contracting Features
              </h2>
              <p className="mb-3">
                Phase 5.1 provides direct, non-binding booking enquiries and single-cycle clarifications between verified businesses and published artists.
              </p>
              <p className="mb-3">
                Advanced transactional features — including formal binding electronic contracts, integrated UPI/card payment gateways, advance deposit escrows, and automated settlement workflows — are not currently active and remain planned for future platform phases (Phase 5.2 and beyond).
              </p>
              <p className="text-xs text-gray-600">
                Any financial transactions, binding contracts, cancellation policies, or performance riders agreed upon between artists and clients must be conducted directly off-platform at the parties&apos; sole discretion, responsibility, and risk.
              </p>
            </section>

            {/* 6. Statutory Rights Preservation */}
            <section id="statutory-rights">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mb-3">
                6. Preservation of Statutory Rights
              </h2>
              <p>
                Nothing in this disclaimer is intended to, or shall be construed to, exclude, limit, or restrict any non-waivable statutory rights or remedies available to consumers or data principals under the laws of India, including the Consumer Protection Act, 2019 and the Digital Personal Data Protection Act, 2023.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer user={currentUser} />
    </>
  );
}

