import ExperienceCard from '@/components/modules/experiences/ExperienceCard';
import type { Experience } from '@/types/experience';

export interface RegionExperiencesProps {
  experiences: Experience[];
  regionName: string;
}

export default function RegionExperiences({ experiences, regionName }: RegionExperiencesProps) {
  return (
    <section id="experiences" className="py-8">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-500">Make it yours</p>
      <h2 className="mt-3 text-3xl font-bold text-slate-900">Signature Experiences in {regionName}</h2>

      {experiences.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((experience, index) => (
            <ExperienceCard key={experience.slug} experience={experience} priority={index === 0} />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No {regionName} experiences published yet.
        </p>
      )}
    </section>
  );
}
