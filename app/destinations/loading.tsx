import { SkeletonGrid } from '@/components/ui/Skeleton';

export default function DestinationsLoading() {
  return (
    <main className="min-h-screen">
      <div className="py-16 sm:px-10 lg:px-0">
        <div className="mx-auto max-w-[1440px] px-6 ">
          <div className="mx-auto h-4 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="mx-auto mt-4 h-10 w-72 animate-pulse rounded-full bg-slate-200" />
          <div className="mx-auto mt-4 h-4 w-96 max-w-full animate-pulse rounded-full bg-slate-200" />
          <div className="mx-auto mt-8 h-16 w-full max-w-3xl animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>

      <div className="px-6 py-8 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-[24px] bg-slate-200" />
          ))}
        </div>
      </div>

      <div className="py-8 lg:px-0">
        <SkeletonGrid count={8} className="mx-auto max-w-[1440px] px-6 sm:grid-cols-2 lg:grid-cols-4" />
      </div>
    </main>
  );
}
