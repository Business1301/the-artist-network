import { getAdminAuditLogs } from "@/app/actions/admin";
import AuditLogViewer from "@/app/components/AuditLogViewer";

export const instant = false;

export default async function AuditLogsPage() {
  const initialData = await getAdminAuditLogs(1, 25);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Platform Moderation Audit Trail
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Cryptographically immutable audit records logged atomically with each moderation decision.
        </p>
      </div>

      {/* Audit Log Table Viewer */}
      <AuditLogViewer
        initialLogs={initialData.logs}
        initialTotal={initialData.totalCount}
        pageSize={initialData.pageSize}
      />
    </div>
  );
}

