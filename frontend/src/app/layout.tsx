import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tanti Admin · Multi-Tenant Fashion Platform",
  description: "Merchant administration for Tanti",
};

import { Toaster } from "sonner";
import { TenantProvider } from "@/contexts/TenantContext";
import { StoreThemeInjector } from "@/components/store/theme/StoreThemeInjector";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink font-sans text-base antialiased">
        <TenantProvider>
          <StoreThemeInjector />
          {children}
          <Toaster position="bottom-center" />
        </TenantProvider>
      </body>
    </html>
  );
}
