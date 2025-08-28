import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Flipbook Reader",
  description: "Visor PDF con efecto de pasar página",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-neutral-100/60">{children}</body>
    </html>
  );
}
