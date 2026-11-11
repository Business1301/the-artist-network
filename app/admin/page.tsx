import Link from "next/link";
import {
  getAdminMetrics,
  getArtistApplications,
  getAdminAuditLogs,
} from "@/app/actions/admin";

export const instant = false;

export default async function AdminOverviewPage() {
  const metrics = await getAdminMetrics();
  const pendingApplications = await getArtistApplications("pending_review");
  const recentAudit = await getAdminAuditLogs(1, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Platform Management Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time marketplace metrics, pending moderation queue, and security audit log.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <span>Review Applications</span>
            {metrics.pendingApplications > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-gray-900 font-black text-[10px]">
                {metrics.pendingApplications}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Applications */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Pending Review</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-sm font-bold">
              ⏳
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-gray-900">
              {metrics.pendingApplications}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Applications awaiting owner moderation
            </p>
          </div>
          {metrics.pendingApplications > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <Link
                href="/admin/applications"
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
              >
                Review queue &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Metric 2: Published Artists */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Published Artists</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-sm font-bold">
              🎤
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-gray-900">
              {metrics.publishedArtists}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Live and discoverable on marketplace
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link
              href="/artists"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              Browse live directory &rarr;
            </Link>
          </div>
        </div>

        {/* Metric 3: Verified Artists */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Verified Badges</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center text-sm font-bold">
              ✓
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-gray-900">
              {metrics.verifiedArtists}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Vetted talent with verification badge
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {metrics.publishedArtists > 0
                ? `${Math.round((metrics.verifiedArtists / metrics.publishedArtists) * 100)}% of published artists`
                : "No published artists yet"}
            </span>
          </div>
        </div>

        {/* Metric 4: Registered Businesses */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Registered Businesses</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center text-sm font-bold">
              🏢
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-gray-900">
              {metrics.totalBusinesses}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Venues, event organizers & clients
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Queried securely via role = &apos;business&apos;
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Pending Review Queue & Recent Audit Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Pending Review Queue */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Pending Review Queue</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                  {pendingApplications.length}
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Artists waiting for your moderation decision
              </p>
            </div>

            <Link
              href="/admin/applications"
              className="text-xs text-purple-600 hover:text-purple-800 font-semibold"
            >
              View All &rarr;
            </Link>
          </div>

          <div className="mt-4 divide-y divide-gray-100">
            {pendingApplications.length === 0 ? (
              <div className="py-12 text-center">
                <span className="text-3xl block mb-2">🎉</span>
                <p className="text-sm font-bold text-gray-900">Queue is completely clear!</p>
                <p className="text-xs text-gray-500 mt-1">
                  All submitted artist applications have been moderated.
                </p>
              </div>
            ) : (
              pendingApplications.slice(0, 5).map((app) => (
                <div key={app.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 truncate">
                        {app.stage_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] text-gray-700 font-semibold uppercase tracking-wider">
                        {app.category}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                      <span>📍 {app.city}</span>
                      <span>•</span>
                      <span>{app.experience_years} yrs exp</span>
                      <span>•</span>
                      <span>
                        Submitted {new Date(app.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/admin/applications?review=${app.id}`}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-colors shadow-2xs"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Audit Log Activity */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Recent Moderation Events</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Atomic database audit log entries
              </p>
            </div>

            <Link
              href="/admin/audit-logs"
              className="text-xs text-purple-600 hover:text-purple-800 font-semibold"
            >
              Full Log &rarr;
            </Link>
          </div>

          <div className="mt-4 divide-y divide-gray-100">
            {recentAudit.logs.length === 0 ? (
              <div className="py-12 text-center">
                <span className="text-3xl block mb-2">📜</span>
                <p className="text-sm font-bold text-gray-900">No moderation events recorded yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Actions taken on applications will appear here automatically.
                </p>
              </div>
            ) : (
              recentAudit.logs.map((log) => {
                const actionBadge =
                  log.action === "approve_profile"
                    ? { label: "Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
                    : log.action === "reject_profile"
                    ? { label: "Rejected", color: "bg-rose-50 text-rose-700 border-rose-200" }
                    : log.action === "verify_artist"
                    ? { label: "Verified", color: "bg-purple-50 text-purple-700 border-purple-200" }
                    : { label: "Unverified", color: "bg-gray-100 text-gray-700 border-gray-200" };

                return (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${actionBadge.color}`}>
                          {actionBadge.label}
                        </span>
                        <span className="font-semibold text-gray-900 truncate">
                          {log.target_stage_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">
                        By <span className="text-gray-700 font-medium">{log.admin_name}</span> &bull;{" "}
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

