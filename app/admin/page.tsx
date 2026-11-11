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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Management Overview
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-time marketplace metrics, pending moderation queue, and security audit log.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-md shadow-purple-950/40"
          >
            <span>Review Applications</span>
            {metrics.pendingApplications > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-black text-[10px]">
                {metrics.pendingApplications}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Applications */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Pending Review</span>
            <span className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center text-sm font-bold">
              ⏳
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">
              {metrics.pendingApplications}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Applications awaiting owner moderation
            </p>
          </div>
          {metrics.pendingApplications > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-800">
              <Link
                href="/admin/applications"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
              >
                Review queue &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Metric 2: Published Artists */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Published Artists</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center text-sm font-bold">
              🎤
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">
              {metrics.publishedArtists}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Live and discoverable on marketplace
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800">
            <Link
              href="/artists"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
            >
              Browse live directory &rarr;
            </Link>
          </div>
        </div>

        {/* Metric 3: Verified Artists */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Verified Badges</span>
            <span className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-400 flex items-center justify-center text-sm font-bold">
              ✓
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">
              {metrics.verifiedArtists}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Vetted talent with verification badge
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">
              {metrics.publishedArtists > 0
                ? `${Math.round((metrics.verifiedArtists / metrics.publishedArtists) * 100)}% of published artists`
                : "No published artists yet"}
            </span>
          </div>
        </div>

        {/* Metric 4: Registered Businesses */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Registered Businesses</span>
            <span className="w-8 h-8 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-400 flex items-center justify-center text-sm font-bold">
              🏢
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">
              {metrics.totalBusinesses}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Venues, event organizers & clients
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">
              Queried securely via role = &apos;business&apos;
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Pending Review Queue & Recent Audit Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Pending Review Queue */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Pending Review Queue</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  {pendingApplications.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Artists waiting for your moderation decision
              </p>
            </div>

            <Link
              href="/admin/applications"
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              View All &rarr;
            </Link>
          </div>

          <div className="mt-4 divide-y divide-zinc-800/60">
            {pendingApplications.length === 0 ? (
              <div className="py-12 text-center">
                <span className="text-3xl block mb-2">🎉</span>
                <p className="text-sm font-bold text-zinc-300">Queue is completely clear!</p>
                <p className="text-xs text-zinc-500 mt-1">
                  All submitted artist applications have been moderated.
                </p>
              </div>
            ) : (
              pendingApplications.slice(0, 5).map((app) => (
                <div key={app.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">
                        {app.stage_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] text-zinc-300 font-semibold uppercase tracking-wider">
                        {app.category}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-3">
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
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Audit Log Activity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Recent Moderation Events</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Atomic database audit log entries
              </p>
            </div>

            <Link
              href="/admin/audit-logs"
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              Full Log &rarr;
            </Link>
          </div>

          <div className="mt-4 divide-y divide-zinc-800/60">
            {recentAudit.logs.length === 0 ? (
              <div className="py-12 text-center">
                <span className="text-3xl block mb-2">📜</span>
                <p className="text-sm font-bold text-zinc-300">No moderation events recorded yet</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Actions taken on applications will appear here automatically.
                </p>
              </div>
            ) : (
              recentAudit.logs.map((log) => {
                const actionBadge =
                  log.action === "approve_profile"
                    ? { label: "Approved", color: "bg-emerald-950/80 text-emerald-400 border-emerald-800" }
                    : log.action === "reject_profile"
                    ? { label: "Rejected", color: "bg-red-950/80 text-red-400 border-red-800" }
                    : log.action === "verify_artist"
                    ? { label: "Verified", color: "bg-purple-950/80 text-purple-400 border-purple-800" }
                    : { label: "Unverified", color: "bg-zinc-800 text-zinc-400 border-zinc-700" };

                return (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${actionBadge.color}`}>
                          {actionBadge.label}
                        </span>
                        <span className="font-semibold text-zinc-200 truncate">
                          {log.target_stage_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">
                        By <span className="text-zinc-300 font-medium">{log.admin_name}</span> &bull;{" "}
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

