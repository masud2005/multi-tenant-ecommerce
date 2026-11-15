import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "../fonts/inter-latin.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

const fraunces = localFont({
  src: "../fonts/fraunces-latin.woff2",
  variable: "--font-display",
  weight: "400 600",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.INTERNAL_API_URL ||
    'http://localhost:5000/api/v1';

  let storeName = '';
  let metaTitle = '';
  let metaDescription = '';
  let faviconUrl = '';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${backendUrl}/customer/store-info`, {
      next: { revalidate: 30 },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      const store = json?.data;
      storeName = typeof store?.name === 'string' ? store.name.trim() : '';
      const seo = store?.settings?.seo;
      metaTitle = typeof seo?.metaTitle === 'string' ? seo.metaTitle.trim() : '';
      metaDescription =
        (typeof seo?.metaDescription === 'string' && seo.metaDescription.trim()) ||
        (typeof store?.tagline === 'string' && store.tagline.trim()) ||
        '';
      const favicon = store?.favicon;
      if (typeof favicon === 'string' && favicon.trim()) {
        faviconUrl = favicon.trim().replace(/^http:\/\//i, 'https://');
      }
    }
  } catch {
    // Graceful fallback when backend is temporarily unreachable
  }

  const brand = metaTitle || storeName || 'Store';
  const homeTitle = metaTitle
    ? (metaTitle.includes('|') ? metaTitle : `Home | ${metaTitle}`)
    : (storeName ? `Home | ${storeName}` : 'Home');

  return {
    title: {
      default: homeTitle,
      template: `%s | ${brand}`,
    },
    description: metaDescription || undefined,
    icons: {
      icon: [
        {
          url: faviconUrl || '/api/favicon',
          type: (faviconUrl || '').endsWith('.svg') ? 'image/svg+xml' : 'image/png',
        },
      ],
      shortcut: faviconUrl || '/api/favicon',
      apple: faviconUrl || '/api/favicon',
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { Toaster } from "sonner";
import { TenantProvider } from "@/contexts/TenantContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { StoreThemeInjector } from "@/components/store/theme/StoreThemeInjector";
import { StoreMetadataInjector } from "@/components/store/theme/StoreMetadataInjector";

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
            <StoreMetadataInjector />
            {children}
            <Toaster position="bottom-center" />
          </ThemeProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
