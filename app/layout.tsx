import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { copy } from "@/data/copy";
import { NuncaPedimos } from "@/components/NuncaPedimos";
import { HablarConPersona } from "@/components/HablarConPersona";
import "./globals.css";

export const metadata: Metadata = {
  title: copy.app.titulo,
  description: copy.app.descripcion,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17212b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-MX">
      <body className="min-h-dvh antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 bg-papel px-4 pt-4 pb-6">
          <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-extrabold tracking-tight">
                {copy.app.nombre} <span className="text-acento">{copy.app.numero}</span>
              </p>
              <span className="rounded border border-gris-claro px-2 py-0.5 text-[11px] tracking-widest text-gris uppercase">
                {copy.app.demo}
              </span>
            </div>
            <NuncaPedimos />
          </header>
          <main className="flex flex-1 flex-col gap-4">{children}</main>
          <footer className="flex flex-col gap-4 text-center text-xs leading-relaxed text-gris">
            <HablarConPersona />
            <div>
              <p>{copy.pie.linea1}</p>
              <p>{copy.pie.linea2}</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
