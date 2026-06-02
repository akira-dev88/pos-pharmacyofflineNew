import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getAuditLogs } from "../../renderer/services/auditLogApi";
import { IonIcon } from "@ionic/react";
import { refreshOutline, searchOutline, checkmarkCircleOutline, warningOutline, informationCircleOutline } from "ionicons/icons";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ACTION_BADGES: Record<string, string> = {
  sale_created: "success",
  sale_updated: "info",
  schedule_h1_sale: "warning",
  schedule_x_sale: "danger",
  batch_quarantined: "danger",
};

const ACTION_LABELS: Record<string, string> = {
  sale_created: "Sale Created",
  sale_updated: "Sale Updated",
  schedule_h1_sale: "H1 Sale",
  schedule_x_sale: "Schedule X Sale",
  batch_quarantined: "Batch Quarantined",
};

export default function AuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((l) =>
    [l.action_type, l.entity_type, l.details, l.user_name]
      .some((f) => f?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getActionIcon = (action: string) => {
    if (action?.includes("quarantine")) return warningOutline;
    if (action?.includes("created")) return checkmarkCircleOutline;
    return informationCircleOutline;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
          <p className="text-slate-500 text-sm mt-0.5">User activity and system events</p>
        </div>
        <Button variant="outline" onClick={loadLogs} className="bg-white border-slate-200">
          <IonIcon icon={refreshOutline} className="text-slate-600 text-xl" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <IonIcon icon={searchOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search actions, entities, users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-slate-400 py-12">No audit logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log: any) => (
                    <TableRow key={log.audit_uuid || log.id}>
                      <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={(ACTION_BADGES[log.action_type] || "default") as any} className="gap-1">
                          <IonIcon icon={getActionIcon(log.action_type)} className="text-xs" />
                          {ACTION_LABELS[log.action_type] || log.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-700 text-sm">
                        {log.entity_type}
                        {log.entity_uuid && (
                          <span className="text-xs font-mono text-slate-400 ml-1">({log.entity_uuid.slice(0, 8)}...)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">{log.user_name || log.user_uuid?.slice(0, 8) || "-"}</TableCell>
                      <TableCell className="text-sm text-slate-600 max-w-[300px] truncate" title={log.details || ""}>
                        {log.details || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
