import { NextResponse } from 'next/server';
import { requireInternalDevAccess } from '@/lib/internalRouteGuard';
import { generateHbxCandidatesForDestination } from '@/services/providers/hbx/hbxMappingCandidates.service';

export const dynamic = 'force-dynamic';

/**
 * Triggers offline CONTENT-only candidate generation for one destination + provider —
 * never availability/rates (see hbxMappingCandidates.service.ts's own doc comment).
 * This is the only internal route that spends HBX evaluation quota; call it deliberately
 * for one destination at a time, never in a loop over every destination.
 */
export async function POST(request: Request) {
  const denied = requireInternalDevAccess();
  if (denied) return denied;

  let payload: { destinationSlug?: string; provider?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { destinationSlug, provider = 'hbx' } = payload;
  if (!destinationSlug) {
    return NextResponse.json({ error: 'destinationSlug is required' }, { status: 400 });
  }

  // Only HBX candidate generation is wired up today — the registry/model underneath is
  // provider-agnostic, but no other provider has a real candidate-generation flow to
  // call yet. Extending this to a second provider is a new `if (provider === '...')`
  // branch here, not a schema or registry-service change.
  if (provider !== 'hbx') {
    return NextResponse.json({ error: `Candidate generation is not implemented for provider "${provider}" yet` }, { status: 400 });
  }

  const result = await generateHbxCandidatesForDestination(destinationSlug);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ summary: result.summary });
}
