import { Skeleton, SkeletonGrid } from '@/components/ui/Skeleton';

export default function TransportLoading() {
  return (
    <main className="min-h-screen bg-[#FAFAFC]">
      <div className="relative h-[380px] w-full overflow-hidden bg-slate-200 sm:h-[440px]">
        <div className="absolute inset-x-6 bottom-10 sm:inset-x-10 lg:inset-x-16">
          <Skeleton className="h-16 w-full max-w-4xl rounded-3xl bg-white/60" />
        </div>
      </div>

      <section className="mx-auto max-w-7xl space-y-10 px-6 py-14 sm:px-10 lg:px-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-[1.5rem]" />
          ))}
        </div>

        <SkeletonGrid count={6} className="sm:grid-cols-2 xl:grid-cols-3" />
      </section>
    </main>
  );
}
