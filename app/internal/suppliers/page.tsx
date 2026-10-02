import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { costingAccessDenied } from '@/lib/journeyCostingAccess';
import SupplierLibraryClient from './SupplierLibraryClient';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Supplier rate library — Internal', robots: { index: false, follow: false } };
export default async function Page() {
  if (process.env.NODE_ENV !== 'development') notFound();
  const incoming = await headers(); const host = incoming.get('host') ?? '';
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) notFound();
  if (costingAccessDenied(new Request(`http://${host}/internal/suppliers`, { headers: incoming }))) notFound();
  return <SupplierLibraryClient />;
}
