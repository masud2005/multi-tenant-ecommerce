import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.INTERNAL_API_URL ||
      'http://localhost:5000/api/v1';

    const res = await fetch(`${backendUrl}/customer/store-info`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      const favicon = json?.data?.favicon;
      if (typeof favicon === 'string' && favicon.trim()) {
        const secureUrl = favicon.trim().replace(/^http:\/\//i, 'https://');
        
        // Fetch the actual image data from Cloudinary / storage and serve directly
        try {
          const imgRes = await fetch(secureUrl, { cache: 'no-store' });
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            const contentType =
              imgRes.headers.get('content-type') || 'image/png';
            return new Response(buffer, {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                Pragma: 'no-cache',
                Expires: '0',
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
    // If backend is unreachable, return empty 204
  }

  return new Response(null, { status: 204 });
}
