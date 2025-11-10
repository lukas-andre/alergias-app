"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { AuditEntry } from "@/lib/admin/api-client";

interface AuditDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: AuditEntry;
}

export function AuditDetailDialog({
  open,
  onOpenChange,
  entry,
}: AuditDetailDialogProps) {
  const actionColors: Record<string, string> = {
    INSERT: "bg-green-500/10 text-green-600 border-green-500/20",
    UPDATE: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  function renderValue(value: any): React.ReactNode {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }

    if (typeof value === "boolean") {
      return <span className="font-mono">{value.toString()}</span>;
    }

    if (typeof value === "number") {
      return <span className="font-mono">{value}</span>;
    }

    if (typeof value === "string") {
      return <span>{value}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground italic">[]</span>;
      }
      return (
        <div className="space-y-1">
          {value.map((item, idx) => (
            <div key={idx} className="text-sm">
              <Badge variant="outline" className="mr-2">
                {idx}
              </Badge>
              {typeof item === "object" ? JSON.stringify(item) : String(item)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === "object") {
      return (
        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return <span>{String(value)}</span>;
  }

  function renderDiff() {
    if (entry.action === "INSERT") {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">New Data:</h4>
            {entry.new_data ? (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded p-4 space-y-3">
                {Object.entries(entry.new_data as Record<string, any>).map(
                  ([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-4">
                      <div className="font-mono text-sm font-semibold col-span-1">
                        {key}
                      </div>
                      <div className="col-span-2">{renderValue(value)}</div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No data</p>
            )}
          </div>
        </div>
      );
    }

    if (entry.action === "DELETE") {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Deleted Data:</h4>
            {entry.old_data ? (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded p-4 space-y-3">
                {Object.entries(entry.old_data as Record<string, any>).map(
                  ([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-4">
                      <div className="font-mono text-sm font-semibold col-span-1">
                        {key}
                      </div>
                      <div className="col-span-2">{renderValue(value)}</div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No data</p>
            )}
          </div>
        </div>
      );
    }

    if (entry.action === "UPDATE") {
      const oldData = (entry.old_data as Record<string, any>) || {};
      const newData = (entry.new_data as Record<string, any>) || {};

      const allKeys = new Set([
        ...Object.keys(oldData),
        ...Object.keys(newData),
      ]);

      const changes = Array.from(allKeys).filter((key) => {
        const oldValue = oldData[key];
        const newValue = newData[key];
        return JSON.stringify(oldValue) !== JSON.stringify(newValue);
      });

      return (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">
              Changes ({changes.length} fields modified):
            </h4>
            {changes.length > 0 ? (
              <div className="space-y-4">
                {changes.map((key) => (
                  <div
                    key={key}
                    className="border rounded p-4 bg-card space-y-2"
                  >
                    <div className="font-mono text-sm font-semibold flex items-center gap-2">
                      {key}
                      <Badge variant="outline" className="text-xs">
                        Modified
                      </Badge>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded p-3">
                        <div className="text-xs font-semibold text-red-600 mb-1">
                          Old Value:
                        </div>
                        {renderValue(oldData[key])}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded p-3">
                        <div className="text-xs font-semibold text-green-600 mb-1">
                          New Value:
                        </div>
                        {renderValue(newData[key])}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                No field changes detected
              </p>
            )}
          </div>
        </div>
      );
    }

    return <p className="text-muted-foreground italic">Unknown action type</p>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Audit Entry Details
            <Badge
              variant="outline"
              className={actionColors[entry.action] || ""}
            >
              {entry.action}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Changes made to {entry.table_name} on{" "}
            {new Date(entry.changed_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Table:</span>{" "}
              <span className="font-mono">{entry.table_name}</span>
            </div>
            <div>
              <span className="font-semibold">Row ID:</span>{" "}
              <span className="font-mono text-xs">
                {entry.row_id || "N/A"}
              </span>
            </div>
            <div>
              <span className="font-semibold">Changed By:</span>{" "}
              <span className="font-mono text-xs">{entry.changed_by}</span>
            </div>
            <div>
              <span className="font-semibold">Changed At:</span>{" "}
              {new Date(entry.changed_at).toLocaleString()}
            </div>
          </div>

          <div className="border-t pt-4">{renderDiff()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
