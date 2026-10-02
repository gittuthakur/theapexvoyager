import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { costingAccessDenied } from '@/lib/journeyCostingAccess';
import JourneyCostingClient from './JourneyCostingClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Journey Costing — Internal', robots: { index: false, follow: false } };
export default async function JourneyCostingPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  const incoming = await headers();
  const host = incoming.get('host') ?? '';
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) notFound();
  const request = new Request(`http://${host}/internal/journey-costing`, { headers: incoming });
  if (costingAccessDenied(request)) notFound();
  return <JourneyCostingClient />;
}
