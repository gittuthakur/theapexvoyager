import { Skeleton, SkeletonGrid } from '@/components/ui/Skeleton';

export default function RegionHubLoading() {
  return (
    <main className="min-h-screen px-6 py-14 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-10">
        <Skeleton className="h-[360px] w-full rounded-[2rem]" />
        <Skeleton className="h-12 w-full rounded-full" />
        <SkeletonGrid count={6} className="sm:grid-cols-2 lg:grid-cols-3" />
        <SkeletonGrid count={3} className="sm:grid-cols-2 lg:grid-cols-3" />
      </div>
    </main>
  );
}
