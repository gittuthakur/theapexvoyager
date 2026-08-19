import { notFound } from 'next/navigation';
import PackageDetailContent from '@/components/modules/PackageDetailContent';
import { getPackageBySlug } from '@/lib/packages';

interface JourneyDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ book?: string }>;
}

export default async function JourneyDetailPage({ params, searchParams }: JourneyDetailPageProps) {
  const { slug } = await params;
  const { book } = await searchParams;
  const pkg = await getPackageBySlug(slug);

  if (!pkg) {
    notFound();
  }

  return <PackageDetailContent pkg={pkg} autoOpenBooking={book === '1'} />;
}
