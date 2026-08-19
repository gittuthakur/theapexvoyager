import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { experienceRegions } from '@/config/experiences.config';
import { getAllExperiences } from '@/lib/experiences';

export default function RegionShowcase() {
  const experiences = getAllExperiences();

  return (
    <section className="bg-slate-100 py-12 lg:py-16">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Explore Experiences by Region</h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {experienceRegions.map((region) => {
            const count = experiences.filter((experience) => experience.region === region.name).length;
            return (
              <Link
                key={region.id}
                href={`/experiences?region=${encodeURIComponent(region.name)}#listing`}
                className="group relative flex h-96 flex-col justify-end overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
              >
                <SafeImage
                  src={region.image}
                  alt={region.name}
                  fill
                  sizes="(min-width: 1024px) 32vw, 100vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
                <div className="relative p-6">
                  <h3 className="text-2xl font-bold text-white">{region.name}</h3>
                  <p className="mt-2 text-sm text-white/80">{region.tagline}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-apex-500">
                    Explore {count} {region.name} Experience{count === 1 ? '' : 's'} <ArrowRight size={20} />
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
