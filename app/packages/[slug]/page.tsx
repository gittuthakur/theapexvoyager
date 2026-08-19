import { redirect } from 'next/navigation';

// /packages/[slug] is kept as a permanent redirect to /journeys/[slug] — the real
// canonical route now — so any existing bookmarks/links keep working.
interface PackageRedirectProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PackageDetailRedirect({ params, searchParams }: PackageRedirectProps) {
  const { slug } = await params;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === 'string') query.set(key, value);
  }
  const qs = query.toString();
  redirect(qs ? `/journeys/${slug}?${qs}` : `/journeys/${slug}`);
}
