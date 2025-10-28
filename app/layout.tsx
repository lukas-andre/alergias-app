import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Nutrición para Alergias",
    default: "Nutrición para Alergias",
  },
  description:
    "Escáner web para extraer ingredientes de etiquetas chilenas usando Tesseract.js en tu navegador.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
