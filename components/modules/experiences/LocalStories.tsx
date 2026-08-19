import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { getExperienceBySlug } from '@/lib/experiences';

interface StoryBlock {
  title: string;
  category: string;
  slug: string;
}

// Each story links to a real, bookable catalog entry (config/experiences.config.ts) —
// none of this is illustrative copy for an activity that doesn't actually exist.
const STORIES: StoryBlock[] = [
  { title: 'Stay with a Himalayan Family', category: 'Local Life', slug: 'spiti-valley-village-homestay' },
  { title: 'Cook a Traditional Himachali Meal', category: 'Food & Culture', slug: 'himachali-cooking-experience-manali' },
  { title: 'Spend a Night Under the Spiti Sky', category: 'Stargazing', slug: 'spiti-valley-stargazing-night' },
  { title: 'Walk Through a Himalayan Village', category: 'Local Experience', slug: 'jibhi-forest-village-walk' },
  { title: 'Raft a Himalayan River', category: 'Adventure', slug: 'parvati-valley-river-rafting-kasol' },
  { title: 'Discover Traditional Mountain Crafts', category: 'Culture', slug: 'himachali-craft-workshop-kullu' }
];

export default function LocalStories() {
  const blocks = STORIES.map((story) => ({ story, experience: getExperienceBySlug(story.slug) })).filter((entry) => entry.experience);
  if (blocks.length === 0) return null;

  return (
    <section className="py-12 lg:py-16">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-16">
        <div className="max-w-8xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Experience the Himalayas Like a Local</h2>
          <p className="mt-3 text-slate-600">Not just places to see. Moments to remember.</p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {blocks.map(({ story, experience }) => (
            <Link
              key={story.slug}
              href={`/experiences/${story.slug}`}
              className="group relative flex h-64 flex-col justify-end overflow-hidden rounded-3xl bg-slate-900 transition-all duration-300 ease-in-out hover:-translate-y-1"
            >
              <SafeImage
                src={experience!.image}
                alt={story.title}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                className="object-cover opacity-80 transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
              <div className="relative p-5">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-300">{story.category}</span>
                <h3 className="mt-1.5 text-lg font-bold text-white">{story.title}</h3>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-apex-500 transition-colors duration-300 ease-in-out">
                  Discover this experience <ArrowUpRight size={20} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
