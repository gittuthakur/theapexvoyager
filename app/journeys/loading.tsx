import { Skeleton, SkeletonGrid } from '@/components/ui/Skeleton';

export default function JourneysLoading() {
  return (
    <main className="min-h-screen bg-[#FAFAFC]">
      <div className="relative min-h-[520px] w-full overflow-hidden bg-slate-200">
        <div className="absolute inset-x-6 bottom-10 sm:inset-x-10 lg:inset-x-16">
          <Skeleton className="h-14 w-full max-w-3xl rounded-3xl bg-white/60" />
        </div>
      </div>

      <section className="mx-auto max-w-[1440px] space-y-10 px-6 py-14 sm:px-10 lg:px-16">
        <div>
          <Skeleton className="h-4 w-56" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>

        <Skeleton className="h-14 w-full rounded-2xl" />

        <SkeletonGrid count={6} className="sm:grid-cols-2 xl:grid-cols-3" />
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-16 sm:px-10 lg:px-16">
        <Skeleton className="h-4 w-48" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-[26rem] rounded-[1.75rem]" />
          <div className="flex flex-col gap-6">
            <Skeleton className="h-[12rem] rounded-[1.5rem]" />
            <Skeleton className="h-[12rem] rounded-[1.5rem]" />
          </div>
        </div>
      </section>
    </main>
  );
}
