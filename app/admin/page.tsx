import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash, BookOpen, FileText, Settings, ScrollText, Utensils, AlertCircle } from "lucide-react";
import { t } from "@/lib/admin/translations";

export const metadata = {
  title: "Admin Dashboard - AlergiasCL",
  description: "Admin panel for managing dictionaries and settings",
};

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

  // Get some basic stats
  const [
    { count: allergenCount },
    { count: dietCount },
    { count: intoleranceCount },
    { count: eNumberCount },
    { count: synonymCount },
  ] = await Promise.all([
    supabase.from("allergen_types").select("*", { count: "exact", head: true }),
    supabase.from("diet_types").select("*", { count: "exact", head: true }),
    supabase.from("intolerance_types").select("*", { count: "exact", head: true }),
    supabase.from("e_numbers").select("*", { count: "exact", head: true }),
    supabase.from("allergen_synonyms").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      title: t("dashboard.eNumbersCard"),
      value: eNumberCount || 0,
      description: t("dashboard.eNumbersDesc"),
      icon: Hash,
      href: "/admin/e-numbers",
      priority: 1,
    },
    {
      title: t("dashboard.allergensCard"),
      value: allergenCount || 0,
      description: t("dashboard.allergensDesc"),
      icon: AlertCircle,
      href: "/admin/dictionaries",
      priority: 2,
    },
    {
      title: t("dashboard.dietsCard"),
      value: dietCount || 0,
      description: t("dashboard.dietsDesc"),
      icon: Utensils,
      href: "/admin/dictionaries",
      priority: 2,
    },
    {
      title: t("dashboard.intolerancesCard"),
      value: intoleranceCount || 0,
      description: t("dashboard.intolerancesDesc"),
      icon: BookOpen,
      href: "/admin/dictionaries",
      priority: 2,
    },
    {
      title: t("dashboard.synonymsCard"),
      value: synonymCount || 0,
      description: t("dashboard.synonymsDesc"),
      icon: FileText,
      href: "/admin/synonyms",
      priority: 3,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("dashboard.description")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <a key={stat.title} href={stat.href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {stat.priority === 1 && (
                      <Badge variant="default" className="text-xs">
                        {t("nav.priority1")}
                      </Badge>
                    )}
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.quickActions")}</CardTitle>
          <CardDescription>
            {t("dashboard.quickActionsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-2">
            <a
              href="/admin/e-numbers"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <Hash className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{t("dashboard.manageENumbers")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.manageENumbersDesc")}
                </div>
              </div>
            </a>
            <a
              href="/admin/dictionaries"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{t("dashboard.editDictionaries")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.editDictionariesDesc")}
                </div>
              </div>
            </a>
            <a
              href="/admin/synonyms"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <FileText className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{t("dashboard.manageSynonyms")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.manageSynonymsDesc")}
                </div>
              </div>
            </a>
            <a
              href="/admin/settings"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <Settings className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{t("dashboard.systemSettings")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.systemSettingsDesc")}
                </div>
              </div>
            </a>
            <a
              href="/admin/audit"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <ScrollText className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{t("dashboard.viewAuditLog")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.viewAuditLogDesc")}
                </div>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
