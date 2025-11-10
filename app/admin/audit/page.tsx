"use client";

import * as React from "react";
import { ScrollText, Filter } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/admin/DataTable";
import { AuditDetailDialog } from "@/components/admin/AuditDetailDialog";
import type { DataTableColumn, DataTableAction } from "@/components/admin/DataTable";
import { fetchAuditLog, type AuditEntry } from "@/lib/admin/api-client";

export default function AuditPage() {
  const [entries, setEntries] = React.useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedEntry, setSelectedEntry] = React.useState<AuditEntry | null>(null);
  const [tableFilter, setTableFilter] = React.useState<string>("all");
  const [actionFilter, setActionFilter] = React.useState<string>("all");

  React.useEffect(() => {
    loadAuditLog();
  }, [tableFilter, actionFilter]);

  async function loadAuditLog() {
    try {
      setIsLoading(true);
      const filters = {
        table_name: tableFilter === "all" ? undefined : tableFilter,
        action: actionFilter === "all" ? undefined : actionFilter,
        limit: 100,
      };
      const data = await fetchAuditLog(filters);
      setEntries(data);
    } catch (error: any) {
      console.error("Error loading audit log:", error);
      toast.error("Failed to load audit log");
    } finally {
      setIsLoading(false);
    }
  }

  function handleViewDetails(entry: AuditEntry) {
    setSelectedEntry(entry);
  }

  const actionColors: Record<string, string> = {
    INSERT: "bg-green-500/10 text-green-600 border-green-500/20",
    UPDATE: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  const columns: DataTableColumn<AuditEntry>[] = [
    {
      key: "table_name",
      label: "Table",
      render: (row) => (
        <span className="font-mono text-sm font-medium">{row.table_name}</span>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <Badge variant="outline" className={actionColors[row.action] || ""}>
          {row.action}
        </Badge>
      ),
    },
    {
      key: "row_id",
      label: "Row ID",
      render: (row) => {
        if (!row.row_id) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }
        const truncated = row.row_id.length > 8 ? row.row_id.slice(0, 8) + "..." : row.row_id;
        return <span className="font-mono text-xs">{truncated}</span>;
      },
    },
    {
      key: "changed_by",
      label: "Changed By",
      render: (row) => {
        const truncated =
          row.changed_by.length > 12
            ? row.changed_by.slice(0, 12) + "..."
            : row.changed_by;
        return <span className="font-mono text-xs">{truncated}</span>;
      },
    },
    {
      key: "changed_at",
      label: "Changed At",
      render: (row) => {
        const date = new Date(row.changed_at);
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs">{date.toLocaleDateString()}</span>
            <span className="text-xs text-muted-foreground">
              {date.toLocaleTimeString()}
            </span>
          </div>
        );
      },
    },
  ];

  const actions: DataTableAction<AuditEntry>[] = [
    {
      label: "View Details",
      variant: "ghost",
      onClick: handleViewDetails,
    },
  ];

  const uniqueTables = Array.from(new Set(entries.map((e) => e.table_name))).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground mt-2">
            Track all changes made to dictionary data with before/after diffs
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Table:</span>
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tables</SelectItem>
              {uniqueTables.map((table) => (
                <SelectItem key={table} value={table}>
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Action:</span>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="INSERT">
                <Badge
                  variant="outline"
                  className={actionColors["INSERT"]}
                >
                  INSERT
                </Badge>
              </SelectItem>
              <SelectItem value="UPDATE">
                <Badge
                  variant="outline"
                  className={actionColors["UPDATE"]}
                >
                  UPDATE
                </Badge>
              </SelectItem>
              <SelectItem value="DELETE">
                <Badge
                  variant="outline"
                  className={actionColors["DELETE"]}
                >
                  DELETE
                </Badge>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTableFilter("all");
            setActionFilter("all");
          }}
        >
          Clear Filters
        </Button>

        <div className="ml-auto">
          <Badge variant="secondary">{entries.length} entries</Badge>
        </div>
      </div>

      <DataTable
        data={entries}
        columns={columns}
        actions={actions}
        searchPlaceholder="Search by table, row ID, or user..."
        searchFn={(entry, query) => {
          const q = query.toLowerCase();
          return (
            entry.table_name.toLowerCase().includes(q) ||
            (entry.row_id || "").toLowerCase().includes(q) ||
            entry.changed_by.toLowerCase().includes(q)
          );
        }}
        isLoading={isLoading}
        emptyMessage={
          tableFilter === "all" && actionFilter === "all"
            ? "No audit entries found."
            : "No audit entries match the selected filters."
        }
        getRowKey={(row) => row.id}
      />

      {selectedEntry && (
        <AuditDetailDialog
          open={!!selectedEntry}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
          entry={selectedEntry}
        />
      )}
    </div>
  );
}
