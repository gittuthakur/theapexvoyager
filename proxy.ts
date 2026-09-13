import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Destination } from '@/models/Destination';
import { Region } from '@/models/Region';

// Guards /destinations/[slug] and /regions/[slug] against soft 404s. Both routes'
// page.tsx already call notFound() for an unknown slug, but that segment also has a
// loading.tsx — and that Suspense boundary, it turns out, isn't scoped to just this
// segment's own page.tsx: a *parent* segment's loading.tsx (app/destinations/loading.tsx,
// for the /destinations listing route) was found to also flush its fallback — with a
// committed 200 status — before this nested [slug] route's own notFound() check ever
// resolved. An earlier attempt moved the existence check into a [slug]/layout.tsx (which
// Next.js documents as sitting outside that segment's own loading.tsx boundary), and that
// alone was enough to fix /regions/[slug] (no parent-level loading.tsx there to interfere)
// but not /destinations/[slug] (which does have one) — confirming the cross-segment
// inheritance rather than a same-segment one. Rather than chase or fragilize that loading
// hierarchy further, this runs the same existence check in Proxy instead: Proxy resolves
// entirely before any route rendering begins, so no Suspense boundary at any level — this
// segment's own or a parent's — can commit a response before the check completes. This
// matches the Next.js docs' own guidance (see notFound()'s "Calling notFound() after
// streaming has started" and loading.js's "Status Codes" sections): once a route is
// streaming a static shell first, the fix is to validate in Proxy, not deeper in the tree.
//
// Deliberately minimal and self-contained (queries the same Destination/Region collections
// directly rather than reusing the cache()-wrapped lib helpers, since those are designed
// for React's per-render request memoization, not a call site outside any render) — no
// second source of truth, same runtime DB authority every other lookup of these slugs uses.
export const config = {
  matcher: ['/destinations/:slug', '/regions/:slug']
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const destinationMatch = pathname.match(/^\/destinations\/([^/]+)$/);
  if (destinationMatch) {
    const slug = decodeURIComponent(destinationMatch[1]);
    await connectDB();
    const exists = await Destination.exists({ slug });
    if (!exists) {
      // A genuinely unmatched top-level path (no catch-all route exists under app/) so
      // Next's own global not-found handling renders — the same real 404 a truly unknown
      // URL already gets. Rewriting to another /destinations/* path would just re-enter
      // this same dynamic segment with an equally-invalid slug.
      return NextResponse.rewrite(new URL('/__not-found__', request.url));
    }
    return NextResponse.next();
  }

  const regionMatch = pathname.match(/^\/regions\/([^/]+)$/);
  if (regionMatch) {
    const slug = decodeURIComponent(regionMatch[1]);
    await connectDB();
    const exists = await Region.exists({ slug, status: 'published' });
    if (!exists) {
      return NextResponse.rewrite(new URL('/__not-found__', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}
