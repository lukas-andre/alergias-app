"use client";

import * as React from "react";
import { Settings as SettingsIcon, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/admin/DataTable";
import { SettingDialog } from "@/components/admin/SettingDialog";
import type { DataTableColumn, DataTableAction } from "@/components/admin/DataTable";
import { fetchSettings, type AppSetting } from "@/lib/admin/api-client";
import { t } from "@/lib/admin/translations";

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<AppSetting[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [editingSetting, setEditingSetting] = React.useState<AppSetting | null>(null);

  React.useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setIsLoading(true);
      const data = await fetchSettings();
      setSettings(data);
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast.error(t("settings.failedToLoad"));
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(setting: AppSetting) {
    setEditingSetting(setting);
  }

  function formatValue(value: any): React.ReactNode {
    const valueType = typeof value;

    if (valueType === "boolean") {
      return value ? (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-600">{t("settings.enabled")}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">{t("settings.disabled")}</span>
        </div>
      );
    }

    if (valueType === "number") {
      return <span className="font-mono">{value}</span>;
    }

    if (valueType === "string") {
      const truncated = value.length > 50 ? value.slice(0, 50) + "..." : value;
      return <span className="text-sm">{truncated}</span>;
    }

    if (Array.isArray(value)) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{t("settings.typeArray")}</Badge>
          <span className="text-xs text-muted-foreground">
            {t("settings.itemsCount", { count: value.length })}
          </span>
        </div>
      );
    }

    if (value === null) {
      return <span className="text-muted-foreground italic">{t("settings.typeNull")}</span>;
    }

    if (valueType === "object") {
      const jsonStr = JSON.stringify(value);
      const truncated = jsonStr.length > 50 ? jsonStr.slice(0, 50) + "..." : jsonStr;
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{t("settings.typeObject")}</Badge>
          <span className="text-xs font-mono">{truncated}</span>
        </div>
      );
    }

    return <span className="text-muted-foreground">{t("settings.unknownType")}</span>;
  }

  function getValueTypeBadge(value: any): React.ReactNode {
    const valueType = typeof value;

    if (valueType === "boolean") {
      return <Badge variant="outline">{t("settings.typeBoolean")}</Badge>;
    }
    if (valueType === "number") {
      return <Badge variant="outline">{t("settings.typeNumber")}</Badge>;
    }
    if (valueType === "string") {
      return <Badge variant="outline">{t("settings.typeString")}</Badge>;
    }
    if (Array.isArray(value)) {
      return <Badge variant="outline">{t("settings.typeArray")}</Badge>;
    }
    if (value === null) {
      return <Badge variant="outline">{t("settings.typeNull")}</Badge>;
    }
    if (valueType === "object") {
      return <Badge variant="outline">{t("settings.typeObject")}</Badge>;
    }

    return <Badge variant="outline">{t("settings.typeUnknown")}</Badge>;
  }

  const columns: DataTableColumn<AppSetting>[] = [
    {
      key: "key",
      label: t("settings.colKey"),
      render: (row) => (
        <span className="font-mono font-semibold text-sm">{row.key}</span>
      ),
    },
    {
      key: "type",
      label: t("settings.colType"),
      render: (row) => getValueTypeBadge(row.value),
    },
    {
      key: "value",
      label: t("settings.colValue"),
      render: (row) => formatValue(row.value),
    },
    {
      key: "description",
      label: t("settings.colDescription"),
      render: (row) => {
        if (!row.description) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        const truncated =
          row.description.length > 60
            ? row.description.slice(0, 60) + "..."
            : row.description;
        return <span className="text-sm">{truncated}</span>;
      },
    },
    {
      key: "updated_at",
      label: t("settings.colUpdatedAt"),
      render: (row) => {
        const date = new Date(row.updated_at);
        return (
          <span className="text-xs text-muted-foreground">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </span>
        );
      },
    },
  ];

  const actions: DataTableAction<AppSetting>[] = [
    {
      label: t("common.edit"),
      variant: "ghost",
      onClick: handleEdit,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("settings.description")}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{t("settings.settingsCount", { count: settings.length })}</Badge>
          <span>·</span>
          <span>
            {t("settings.lastUpdated")}:{" "}
            {settings.length > 0
              ? new Date(
                  Math.max(
                    ...settings.map((s) => new Date(s.updated_at).getTime())
                  )
                ).toLocaleString()
              : t("settings.never")}
          </span>
        </div>
      </div>

      <DataTable
        data={settings}
        columns={columns}
        actions={actions}
        searchPlaceholder={t("settings.searchPlaceholder")}
        searchFn={(setting, query) => {
          const q = query.toLowerCase();
          return (
            setting.key.toLowerCase().includes(q) ||
            (setting.description || "").toLowerCase().includes(q)
          );
        }}
        isLoading={isLoading}
        emptyMessage={t("settings.emptyMessage")}
        getRowKey={(row) => row.key}
      />

      {editingSetting && (
        <SettingDialog
          open={!!editingSetting}
          onOpenChange={(open) => !open && setEditingSetting(null)}
          setting={editingSetting}
          onSuccess={loadSettings}
        />
      )}
    </div>
  );
}
