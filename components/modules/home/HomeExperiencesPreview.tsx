import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ExperienceCard from '@/components/modules/experiences/ExperienceCard';
import type { Experience } from '@/types/experience';

export interface HomeExperiencesPreviewProps {
  experiences: Experience[];
}

// A small, curated preview of the Experiences vertical — not a duplicate of the full
// /experiences listing, just enough real, featured records (see lib/experiences.ts's
// getFeaturedExperiences()) to make this core vertical visible on Home at all. Returns
// null rather than a fake/empty-looking section if there's ever nothing featured.
export default function HomeExperiencesPreview({ experiences }: HomeExperiencesPreviewProps) {
  if (experiences.length === 0) return null;

  return (
    <section className="py-14 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">Beyond the itinerary</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              Things Worth <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">Doing Along the Way</span>
            </h2>
            <p className="mt-3 text-slate-600">
              From village walks and local food to nature, culture and seasonal adventures — add experiences that make each stop feel
              more personal.
            </p>
          </div>
          <Link
            href="/experiences"
            className="cursor-hover inline-flex shrink-0 items-center gap-1 text-sm font-medium text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-900"
          >
            Explore Experiences <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {experiences.slice(0, 4).map((experience) => (
            <ExperienceCard key={experience.slug} experience={experience} />
          ))}
        </div>
      </div>
    </section>
  );
}
