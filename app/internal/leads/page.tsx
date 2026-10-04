import { redirect } from 'next/navigation';
import { getAdminFromCookies } from '@/lib/adminGuard';
import LeadsClient from './LeadsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Leads — Internal', robots: { index: false, follow: false } };

/** Requires an authenticated OWNER session (server-side check before anything renders or loads); otherwise -> login. */
export default async function LeadsPage() {
  const admin = await getAdminFromCookies(['OWNER']);
  if (!admin) redirect('/internal/login');
  return <LeadsClient adminEmail={admin.email} />;
}
