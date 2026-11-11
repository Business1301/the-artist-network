"use client";

import { useState } from "react";
import { AdminAuditRecord, getAdminAuditLogs } from "@/app/actions/admin";

interface AuditLogViewerProps {
  initialLogs: AdminAuditRecord[];
  initialTotal: number;
  pageSize: number;
}

export default function AuditLogViewer({
  initialLogs,
  initialTotal,
  pageSize,
}: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AdminAuditRecord[]>(initialLogs);
  const [total, setTotal] = useState<number>(initialTotal);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize) || 1;

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setIsLoading(true);

    try {
      const res = await getAdminAuditLogs(newPage, pageSize);
      setLogs(res.logs);
      setTotal(res.totalCount);
      setPage(newPage);
    } catch (err) {
      console.error("Failed to fetch audit page:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">Target Artist</th>
                <th className="px-4 py-3.5">Administrator</th>
                <th className="px-4 py-3.5">Transition Summary</th>
                <th className="px-6 py-3.5 text-right">Raw Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No audit records found in the database.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actionBadge =
                    log.action === "suspend_profile"
                      ? { label: "Suspend", color: "bg-rose-50 text-rose-700 border-rose-200" }
                      : log.action === "reinstate_profile"
                      ? { label: "Reinstate", color: "bg-blue-50 text-blue-700 border-blue-200" }
                      : log.action === "approve_profile"
                      ? { label: "Approve", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
                      : log.action === "reject_profile"
                      ? { label: "Reject", color: "bg-rose-50 text-rose-700 border-rose-200" }
                      : log.action === "verify_artist"
                      ? { label: "Verify", color: "bg-purple-50 text-purple-700 border-purple-200" }
                      : { label: "Unverify", color: "bg-gray-100 text-gray-700 border-gray-200" };

                  const isExpanded = expandedLogId === log.id;

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${actionBadge.color}`}>
                          {actionBadge.label}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-medium">
                        <div className="font-bold text-gray-900 text-xs">{log.target_stage_name}</div>
                        <div className="text-[10px] font-mono text-gray-400 truncate max-w-[120px]">
                          {log.target_artist_id}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-xs">
                        <div className="font-semibold text-gray-800">{log.admin_name}</div>
                        <div className="text-[10px] text-gray-500">{log.admin_email}</div>
                      </td>

                      <td className="px-4 py-4 text-xs">
                        {log.details.previous_status && log.details.new_status && (
                          <div className="text-[11px]">
                            <span className="text-gray-500">{String(log.details.previous_status)}</span>
                            <span className="text-gray-400 mx-1.5">&rarr;</span>
                            <span className="font-bold text-gray-900">{String(log.details.new_status)}</span>
                          </div>
                        )}
                        {log.details.rejection_reason && (
                          <div className="text-[11px] text-rose-600 italic mt-0.5 truncate max-w-[200px]">
                            &quot;{String(log.details.rejection_reason)}&quot;
                          </div>
                        )}
                        {log.details.new_verified !== undefined && log.details.previous_verified !== undefined && (
                          <div className="text-[10px] text-purple-600 mt-0.5 font-medium">
                            Verified: {String(log.details.previous_verified)} &rarr; {String(log.details.new_verified)}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-mono transition-colors"
                        >
                          {isExpanded ? "Hide JSON" : "{ } View"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Expanded JSON Inspector Modal / Row */}
        {expandedLogId && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-gray-600 font-bold">
                Audit Record Details JSON (ID: {expandedLogId})
              </span>
              <button
                onClick={() => setExpandedLogId(null)}
                className="text-[10px] text-gray-400 hover:text-gray-700"
              >
                Close ✕
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-white border border-gray-200 text-[10px] font-mono text-gray-800 overflow-x-auto leading-relaxed">
              {JSON.stringify(
                logs.find((l) => l.id === expandedLogId)?.details || {},
                null,
                2
              )}
            </pre>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/80 text-xs text-gray-500">
          <div>
            Total <span className="font-bold text-gray-900">{total}</span> audit records &bull; Page{" "}
            <span className="font-bold text-gray-900">{page}</span> of{" "}
            <span className="font-bold text-gray-900">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-white text-gray-700 font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
            >
              &larr; Previous
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-white text-gray-700 font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

