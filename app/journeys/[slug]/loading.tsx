export default function JourneyDetailLoading() {
  return (
    <main className="min-h-screen px-6 pb-28 pt-6 sm:px-10 lg:px-16 lg:pb-14">
      <div className="mx-auto max-w-7xl">
        <div className="h-[420px] w-full animate-pulse rounded-[2rem] bg-slate-100 sm:h-[480px] lg:h-[560px]" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
          <div className="space-y-6">
            <div className="h-48 w-full animate-pulse rounded-[2rem] bg-slate-100" />
            <div className="h-64 w-full animate-pulse rounded-[2rem] bg-slate-100" />
          </div>
          <div className="hidden h-72 w-full animate-pulse rounded-[2rem] bg-slate-100 lg:block" />
        </div>
      </div>
    </main>
  );
}
