"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hash,
  BookOpen,
  FileText,
  Settings,
  ScrollText,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: "Panel de Control",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Números E",
    href: "/admin/e-numbers",
    icon: Hash,
    badge: "Prioridad 1",
  },
  {
    label: "Feedback",
    href: "/admin/feedback",
    icon: MessageSquare,
  },
  {
    label: "Diccionarios",
    href: "/admin/dictionaries",
    icon: BookOpen,
  },
  {
    label: "Sinónimos",
    href: "/admin/synonyms",
    icon: FileText,
  },
  {
    label: "Configuración",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    label: "Registro de Auditoría",
    href: "/admin/audit",
    icon: ScrollText,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isActive && "bg-secondary"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Button>
          </Link>
        );
      })}

      {/* Divider */}
      <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Link href="/scan">
          <Button variant="ghost" className="w-full justify-start">
            ← Volver a la App
          </Button>
        </Link>
      </div>
    </nav>
  );
}
