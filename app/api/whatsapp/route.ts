import { NextResponse } from 'next/server';
import { buildWhatsAppLink } from '@/lib/whatsapp';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = url.searchParams.get('destination') ?? undefined;
  const tripTitle = url.searchParams.get('tour') ?? undefined;
  const dates = url.searchParams.get('dates') ?? undefined;

  const waUrl = buildWhatsAppLink({ destination, tripTitle, dates });
  return NextResponse.json({ url: waUrl });
}
