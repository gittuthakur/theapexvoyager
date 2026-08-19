import ExperienceCard from '@/components/modules/experiences/ExperienceCard';
import { getFeaturedExperiences } from '@/lib/experiences';

export default function FeaturedExperiences() {
  const featured = getFeaturedExperiences();
  if (featured.length === 0) return null;

  return (
    <section className="bg-slate-100 py-12 lg:py-16">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Handpicked for you</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Experiences Worth Travelling For</h2>
          <p className="mt-3 text-slate-600">Handpicked experiences that turn a Himalayan trip into a story worth remembering.</p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((experience, index) => (
            <ExperienceCard key={experience.slug} experience={experience} variant="featured" priority={index === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
