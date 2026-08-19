import { redirect } from 'next/navigation';

// /packages is kept as a permanent redirect to /journeys — the real canonical
// route now — so any existing bookmarks/links to /packages keep working.
interface PackagesRedirectProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PackagesRedirect({ searchParams }: PackagesRedirectProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') query.set(key, value);
  }
  const qs = query.toString();
  redirect(qs ? `/journeys?${qs}` : '/journeys');
}
