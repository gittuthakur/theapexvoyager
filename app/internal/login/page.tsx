import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getAdminFromCookies } from '@/lib/adminGuard';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sign in — Internal', robots: { index: false, follow: false } };

/** No signup, no reset, no hints: owner accounts are created only by the bootstrap script. */
export default async function LoginPage() {
  if (await getAdminFromCookies(['OWNER'])) redirect('/internal/leads');
  return <LoginForm />;
}
