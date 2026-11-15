import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#18181b"/><path d="M10 11V9a6 6 0 0 1 12 0v2m-14 3h16l-1.5 11h-13L8 14z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export async function GET() {
  try {
    const backendUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:5000/api/v1';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${backendUrl}/customer/store-info`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      const favicon = json?.data?.favicon;

      if (typeof favicon === 'string' && favicon.trim()) {
        const secureUrl = favicon.trim().replace(/^http:\/\//i, 'https://');

        try {
          const imgController = new AbortController();
          const imgTimer = setTimeout(() => imgController.abort(), 3000);
          const imgRes = await fetch(secureUrl, {
            cache: 'no-store',
            signal: imgController.signal,
          });
          clearTimeout(imgTimer);
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            const contentType =
              imgRes.headers.get('content-type') || 'image/png';
            return new Response(buffer, {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
              },
            });
          }
        } catch {
          // If streaming fails, fall back to 307 redirect
          return NextResponse.redirect(secureUrl, 307);
        }

        return NextResponse.redirect(secureUrl, 307);
      }
    }
  } catch {
    // Backend unreachable, serve fallback SVG
  }

  return new Response(DEFAULT_SVG_ICON, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}
