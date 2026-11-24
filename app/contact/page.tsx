import { connection } from "next/server";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { getCurrentUser } from "@/app/auth/actions";

export const instant = false;

export const metadata = {
  title: "Contact Us | The Artist Network",
  description:
    "Official contact information, support channels, and statutory grievance officer details for The Artist Network.",
};

export default async function ContactPage() {
  await connection();
  const currentUser = await getCurrentUser();

  return (
    <>
      <Navbar initialUser={currentUser} />

      <main className="min-h-screen bg-white text-gray-900 pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="border-b border-gray-200 pb-8 mb-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold mb-4">
              <span>📬</span> Official Communication
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
              Contact Us
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl">
              Have questions regarding artist onboarding, platform features, copyright notices, or data protection? Reach out through our official communication channels below.
            </p>
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <strong>Pre-Launch Notice:</strong> The Artist Network is currently in testing and evaluation. Contact details below contain official placeholder channels that will be finalized by the platform owner prior to full public launch.
            </div>
          </div>

          {/* Contact Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* General Inquiries */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold mb-4">
                ✉️
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">General Inquiries</h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                For questions about the platform, media inquiries, partnership discussions, or feedback on our testing preview.
              </p>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700">
                <span className="block font-semibold text-gray-900">Channel Status:</span>
                <span className="text-amber-800 font-medium">Pending platform owner configuration (Non-operational during testing preview)</span>
              </div>
            </div>

            {/* Artist & Venue Support */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold mb-4">
                🎨
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Artist &amp; Venue Support</h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                Assistance with artist onboarding, portfolio uploads, calendar settings, or dashboard navigation.
              </p>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700">
                <span className="block font-semibold text-gray-900">Support Desk:</span>
                <span className="text-amber-800 font-medium">Pending platform owner configuration (Non-operational during testing preview)</span>
              </div>
            </div>

            {/* Statutory Grievance Redressal */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold mb-4">
                ⚖️
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Grievance Redressal (Framework Alignment)</h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                In alignment with the Digital Personal Data Protection Act, 2023 and Information Technology Rules, a formal Grievance Officer will be designated prior to commercial launch.
              </p>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 space-y-1">
                <p><strong>Officer Status:</strong> <span className="text-amber-800 font-medium">To be officially designated and published by platform owner prior to public launch</span></p>
                <p><strong>Designation:</strong> Grievance Redressal Officer</p>
                <p><strong>Channel Status:</strong> <span className="text-amber-800 font-medium">Non-operational during testing preview</span></p>
                <p className="text-[11px] text-gray-500">Statutory acknowledgement and resolution timelines will take effect upon official designation.</p>
              </div>
            </div>

            {/* Copyright & Takedown Notices */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 font-bold mb-4">
                🛡️
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Copyright &amp; Takedown Notices</h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                Reporting copyright infringement or submitting an intermediary takedown notice under IT Intermediary Rules.
              </p>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700">
                <span className="block font-semibold text-gray-900">Legal Desk:</span>
                <span className="text-amber-800 font-medium">Pending platform owner configuration (Non-operational during testing preview)</span>
              </div>
            </div>
          </div>

          {/* Entity & Office Details Section */}
          <div className="p-6 sm:p-8 rounded-2xl border border-gray-200 bg-gray-50 mb-10">
            <h2 className="text-lg font-bold text-gray-950 mb-3">
              Entity &amp; Registered Office Information
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
              Pursuant to applicable Indian regulatory disclosure frameworks for online platforms:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-700">
              <div>
                <span className="block font-semibold text-gray-900">Operating Entity Name:</span>
                <span className="text-amber-800 font-medium">Pending platform owner provision prior to commercial launch</span>
              </div>
              <div>
                <span className="block font-semibold text-gray-900">Business Registration / CIN:</span>
                <span className="text-amber-800 font-medium">Pending platform owner provision prior to commercial launch</span>
              </div>
              <div>
                <span className="block font-semibold text-gray-900">Registered Office Address:</span>
                <span className="text-amber-800 font-medium">Pending physical address provision prior to commercial launch</span>
              </div>
              <div>
                <span className="block font-semibold text-gray-900">Support Hours:</span>
                <span>Monday – Friday, 10:00 AM – 6:00 PM IST (Excluding Public Holidays)</span>
              </div>
            </div>
          </div>

          {/* Submission Guidelines Note */}
          <div className="p-5 rounded-2xl border border-purple-100 bg-purple-50/50 text-xs text-gray-700 leading-relaxed">
            <h3 className="font-bold text-purple-900 text-sm mb-1">How to Ensure Fast Resolution:</h3>
            <p className="mb-2">
              To help our team assist you effectively, please include the following details in your email communication:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Your registered account email address (if applicable).</li>
              <li>A direct link to the relevant artist profile or portfolio item (e.g. <code>https://artist-net-v1.netlify.app/artists/your-slug</code>).</li>
              <li>A clear, detailed description of your query, issue, or request.</li>
              <li>For account deletion requests, an explicit confirmation that you wish to permanently delete your profile and personal data.</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

