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
import { ThemeProvider } from "@/contexts/ThemeContext";
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
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var css = localStorage.getItem('tanti_theme_css');
                if (css) {
                  var snap = JSON.parse(css);
                  var root = document.documentElement;
                  if (snap.dark) root.classList.add('dark');
                  else root.classList.remove('dark');
                  if (snap.style) root.setAttribute('data-theme-style', snap.style);
                  if (snap.card) root.setAttribute('data-card-style', snap.card);
                  if (snap.vars) {
                    Object.keys(snap.vars).forEach(function (key) {
                      root.style.setProperty(key, snap.vars[key]);
                    });
                  }
                } else {
                  var s = localStorage.getItem('tanti_theme_settings');
                  if (s) {
                    var p = JSON.parse(s);
                    if (p.colorMode === 'dark') document.documentElement.classList.add('dark');
                    else document.documentElement.classList.remove('dark');
                    if (p.themeStyle) document.documentElement.setAttribute('data-theme-style', p.themeStyle);
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-ink font-sans text-base antialiased">
        <TenantProvider>
          <ThemeProvider>
            <StoreThemeInjector />
            {children}
            <Toaster position="bottom-center" />
          </ThemeProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
