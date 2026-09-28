import { NextResponse } from 'next/server';
import { requireInternalDevAccess } from '@/lib/internalRouteGuard';
import { deactivateExclusion } from '@/services/properties/propertyExclusion.service';

export const dynamic = 'force-dynamic';

/** Makes a previously-excluded property eligible to appear again — never deletes the
 *  row, so the request/decision history survives (models/ExcludedPlace.ts). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireInternalDevAccess();
  if (denied) return denied;

  const { id } = await params;
  const result = await deactivateExclusion(id);

  if (!result.deactivated) {
    return NextResponse.json({ error: result.reason }, { status: 404 });
  }

  return NextResponse.json({ exclusion: result.exclusion });
}
