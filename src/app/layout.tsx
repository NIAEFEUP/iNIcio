import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

import NavbarController from "@/components/navbar-controller";
import { Toaster } from "sonner";
import Head from "next/head";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

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
    <html lang="pt" className={montserrat.variable}>
      <Head>
        <link rel="icon" href="favicon.ico" />
      </Head>
      <body className={`flex flex-col h-screen antialiased`}>
        <NavbarController />
        <main className="grow">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
