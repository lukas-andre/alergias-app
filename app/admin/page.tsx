import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash, BookOpen, FileText, Settings, ScrollText } from "lucide-react";

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
      title: "E-numbers",
      value: eNumberCount || 0,
      description: "Registered additives",
      icon: Hash,
      href: "/admin/e-numbers",
      priority: 1,
    },
    {
      title: "Allergen Types",
      value: allergenCount || 0,
      description: "Allergen dictionary entries",
      icon: BookOpen,
      href: "/admin/dictionaries",
      priority: 2,
    },
    {
      title: "Diet Types",
      value: dietCount || 0,
      description: "Available diet categories",
      icon: BookOpen,
      href: "/admin/dictionaries",
      priority: 2,
    },
    {
      title: "Intolerance Types",
      value: intoleranceCount || 0,
      description: "Intolerance dictionary entries",
      icon: BookOpen,
      href: "/admin/dictionaries",
      priority: 2,
    },
    {
      title: "Synonyms",
      value: synonymCount || 0,
      description: "Allergen synonyms for matching",
      icon: FileText,
      href: "/admin/synonyms",
      priority: 3,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of dictionary and system data
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
                        Priority
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
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
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
                <div className="font-medium">Manage E-numbers</div>
                <div className="text-sm text-muted-foreground">
                  Add, edit, or remove food additives
                </div>
              </div>
            </a>
            <a
              href="/admin/dictionaries"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">Edit Dictionaries</div>
                <div className="text-sm text-muted-foreground">
                  Manage allergens, diets, and intolerances
                </div>
              </div>
            </a>
            <a
              href="/admin/synonyms"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <FileText className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">Manage Synonyms</div>
                <div className="text-sm text-muted-foreground">
                  Add alternative names for better matching
                </div>
              </div>
            </a>
            <a
              href="/admin/settings"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <Settings className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">System Settings</div>
                <div className="text-sm text-muted-foreground">
                  Configure feature flags and app behavior
                </div>
              </div>
            </a>
            <a
              href="/admin/audit"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <ScrollText className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">View Audit Log</div>
                <div className="text-sm text-muted-foreground">
                  Review all dictionary changes
                </div>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
