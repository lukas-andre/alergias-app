import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  // Double-check admin access (middleware should already block, but defense in depth)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: hasOwnerRole } = await supabase.rpc("has_role", {
    p_role_key: "owner",
  });

  if (!hasOwnerRole) {
    redirect("/scan");
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Panel de Administración</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Gestionar diccionarios y configuraciones
          </p>
          <AdminNav />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
