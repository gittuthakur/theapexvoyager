import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { experienceMoods } from '@/config/experiences.config';
import { getAllExperiences } from '@/lib/experiences';

export default function ExperienceMoodDiscovery() {
  const experiences = getAllExperiences();

  return (
    <section className="py-12 lg:py-16">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">What Are You in the Mood For?</h2>
          <p className="mt-3 text-slate-600">Choose an experience that matches the way you want to travel.</p>
        </div>

        <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
          {experienceMoods.map((mood) => {
            const count = experiences.filter((experience) => mood.categories.includes(experience.category)).length;
            const params = new URLSearchParams({ category: mood.categories.join(',') });

            return (
              <Link
                key={mood.id}
                href={`/experiences?${params.toString()}#listing`}
                className="group relative block h-72 w-64 shrink-0 snap-start overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 sm:h-80 sm:w-auto"
              >
                <SafeImage
                  src={mood.image}
                  alt={mood.title}
                  fill
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 80vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                    {count} experience{count === 1 ? '' : 's'}
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-white">{mood.title}</h3>
                  <p className="mt-1 text-sm text-white/80">{mood.tagline}</p>
                  <span className="mt-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-300 ease-in-out group-hover:bg-apex-500">
                    <ArrowUpRight size={15} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
