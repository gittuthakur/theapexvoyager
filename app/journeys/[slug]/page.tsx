import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PackageDetailContent from '@/components/modules/PackageDetailContent';
import { getAllPackages, getPackageBySlug } from '@/lib/packages';

interface JourneyDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ book?: string }>;
}

const RELATED_JOURNEYS_LIMIT = 3;

export async function generateMetadata({ params }: JourneyDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) return {};
  return {
    title: `${pkg.name} | The Apex Voyager`,
    description: pkg.shortDescription
  };
}

export default async function JourneyDetailPage({ params, searchParams }: JourneyDetailPageProps) {
  const { slug } = await params;
  const { book } = await searchParams;
  const pkg = await getPackageBySlug(slug);

  if (!pkg) {
    notFound();
  }

  // Real catalog data only — same category first, then any other journey, excluding
  // this one. With only a handful of journeys in the catalog this is effectively "the
  // rest of the catalog," which is fine: it's real, not invented.
  const allPackages = await getAllPackages();
  const others = allPackages.filter((candidate) => candidate.slug !== pkg.slug);
  const sameCategory = others.filter((candidate) => candidate.category === pkg.category);
  const relatedJourneys = [...sameCategory, ...others.filter((candidate) => !sameCategory.includes(candidate))].slice(
    0,
    RELATED_JOURNEYS_LIMIT
  );

  return <PackageDetailContent pkg={pkg} autoOpenBooking={book === '1'} relatedJourneys={relatedJourneys} />;
}
