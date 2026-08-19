import { NextResponse } from 'next/server';
import { isLocalDevelopment } from '@/lib/env';
import { images } from '@/config/images.config';

const PLACES_API_BASE = 'https://places.googleapis.com/v1';

// Local dev never calls Google's Photo Media endpoint — it's billed per request, same
// as Text Search. Picking deterministically off the photo `name` (rather than randomly)
// keeps the same mock place showing the same image across re-renders and reloads.
const LOCAL_PLACEHOLDER_IMAGES = [
  images.destinations.manali,
  images.destinations.kinnaur,
  images.destinations.spitiValley,
  images.destinations.dharamshala,
  images.destinations.shimla,
  images.destinations.kasol
];

function pickLocalPlaceholder(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return LOCAL_PLACEHOLDER_IMAGES[hash % LOCAL_PLACEHOLDER_IMAGES.length];
}

// Proxies the Google Places (New) Photo Media endpoint so the API key never has to
// appear in a URL sent to the browser — the client only ever sees /api/places/photo?name=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const maxWidthPx = Number(searchParams.get('w') ?? '800');

  if (!name || !/^places\/[^/]+\/photos\/[^/]+$/.test(name)) {
    return NextResponse.json({ error: 'Invalid or missing photo name' }, { status: 400 });
  }

  if (isLocalDevelopment()) {
    return NextResponse.redirect(new URL(pickLocalPlaceholder(name), request.url));
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Photo service unavailable' }, { status: 503 });
  }

  try {
    const googleUrl = `${PLACES_API_BASE}/${name}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`;
    // next.revalidate lets Next.js's own Data Cache dedupe/short-circuit this fetch
    // server-side; the Cache-Control header below is what makes repeat requests from
    // the *browser* (and any CDN in front of this route) skip the network entirely.
    const res = await fetch(googleUrl, { signal: AbortSignal.timeout(8000), next: { revalidate: 86400 } });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch photo' }, { status: res.status });
    }

    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // 30 days, not the more typical 24h — photo bytes for a given reference are
        // truly immutable (never re-encoded), so there's nothing to revalidate sooner.
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800, immutable'
      }
    });
  } catch (error) {
    console.error('Failed to proxy Google Places photo', error);
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 });
  }
}
