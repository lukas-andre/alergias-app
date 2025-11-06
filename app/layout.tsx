import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import SupabaseProvider from "@/components/SupabaseProvider";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: {
    template: "%s | Nutrición para Alergias",
    default: "Nutrición para Alergias",
  },
  description:
    "Escáner web que usa OpenAI Vision para extraer ingredientes de etiquetas chilenas y evaluar riesgos.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="es">
      <body>
        <SupabaseProvider initialSession={session}>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
