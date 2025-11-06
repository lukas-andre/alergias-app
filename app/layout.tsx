import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Sora } from "next/font/google";

import SupabaseProvider from "@/components/SupabaseProvider";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Google Fonts Configuration
 * - Inter: UI and body text (clean, readable)
 * - Sora: Headlines and brand text (friendly, rounded)
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

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
    <html lang="es" className={`${inter.variable} ${sora.variable}`}>
      <body className="font-sans">
        <SupabaseProvider initialSession={session}>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
