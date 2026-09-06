import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import NavbarController from "@/components/navbar-controller";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "iNIcio",
  description: "Site de recrutamento para o NIAEFEUP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={cn("font-sans", inter.variable)}>
      <body className={`flex flex-col h-screen antialiased`}>
        <NavbarController />
        <main className="grow">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
