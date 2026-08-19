export default function JourneyDetailLoading() {
  return (
    <main className="min-h-screen px-6 py-14 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-100" />
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
          <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-4 h-10 w-64 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-8 h-[360px] w-full animate-pulse rounded-[1.5rem] bg-slate-100" />
        </div>
      </section>
    </main>
  );
}
