import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import NavbarController from "@/components/navbar-controller";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

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
    <html
      lang="pt"
      className={cn("font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NavbarController />
          <main className="grow flex flex-col">{children}</main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
