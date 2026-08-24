import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import {
  BadgeCheck,
  Backpack,
  Calendar,
  Check,
  Clock,
  Gauge,
  Info,
  MapPin,
  Star,
  Users,
  X as XIcon
} from 'lucide-react';
import ExperienceBookingActions from '@/components/modules/experiences/ExperienceBookingActions';
import BackButton from '@/components/ui/BackButton';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatINR } from '@/lib/pricing';
import { getExperienceBySlug } from '@/lib/experiences';
import type { Metadata } from 'next';

interface ExperienceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ExperienceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const experience = await getExperienceBySlug(slug);
  if (!experience) return { title: 'Experience Not Found | The Apex Voyager' };
  return {
    title: `${experience.title} | The Apex Voyager`,
    description: experience.shortDescription
  };
}

const badgeStyles: Record<string, string> = {
  'Best Seller': 'bg-apex-500 text-white',
  Popular: 'bg-slate-900 text-white',
  New: 'bg-emerald-600 text-white'
};

export default async function ExperienceDetailPage({ params }: ExperienceDetailPageProps) {
  const { slug } = await params;
  const experience = await getExperienceBySlug(slug);

  if (!experience) {
    notFound();
  }

  const gallery = experience.gallery.length > 0 ? experience.gallery : [experience.image];

  return (
    <main className="min-h-screen px-6 py-14 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-6xl space-y-6">
        <BackButton fallbackHref="/experiences" label="Back to Experiences" />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {experience.badge ? (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.04em] ${badgeStyles[experience.badge]}`}>
                {experience.badge}
              </span>
            ) : null}
            {experience.verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <BadgeCheck size={13} className="text-emerald-600" />
                Verified Experience
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">{experience.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-slate-600">
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} className="text-apex-600" /> {experience.location}
            </span>
            {experience.rating ? (
              <span className="inline-flex items-center gap-2">
                <Star size={15} className="fill-amber-400 text-amber-400" />
                {experience.rating.toFixed(1)}
                {experience.reviewCount ? <span className="text-slate-500"> ({experience.reviewCount} reviews)</span> : null}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative h-72 overflow-hidden rounded-[1.5rem] bg-slate-200 sm:col-span-2 sm:h-96">
            <SafeImage src={gallery[0]} alt={experience.title} fill priority sizes="(min-width: 640px) 65vw, 100vw" className="object-cover" />
          </div>
          {gallery.length > 1 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              {gallery.slice(1, 3).map((image, index) => (
                <div key={image + index} className="relative h-32 overflow-hidden rounded-[1.5rem] bg-slate-200 sm:h-[11.5rem]">
                  <SafeImage src={image} alt={`${experience.title} — photo ${index + 2}`} fill sizes="30vw" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile icon={Clock} label="Duration" value={experience.duration} />
              <StatTile icon={Users} label="Group Size" value={experience.groupSize} />
              {experience.difficulty ? <StatTile icon={Gauge} label="Difficulty" value={experience.difficulty} /> : null}
              <StatTile icon={Calendar} label="Best Season" value={experience.seasons.join(', ')} />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              <p className="text-lg leading-8 text-slate-600">{experience.description}</p>
            </div>

            {experience.highlights.length > 0 ? (
              <ContentBlock title="Highlights">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {experience.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-apex-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </ContentBlock>
            ) : null}

            {experience.whatYoullExperience.length > 0 ? (
              <ContentBlock title="What You'll Experience">
                <ol className="space-y-3">
                  {experience.whatYoullExperience.map((item, index) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-apex-50 text-xs font-bold text-apex-600">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{item}</span>
                    </li>
                  ))}
                </ol>
              </ContentBlock>
            ) : null}

            {experience.inclusions.length > 0 || experience.exclusions.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {experience.inclusions.length > 0 ? (
                  <ContentBlock title="What's Included">
                    <ul className="space-y-3">
                      {experience.inclusions.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {item}
                        </li>
                      ))}
                    </ul>
                  </ContentBlock>
                ) : null}
                {experience.exclusions.length > 0 ? (
                  <ContentBlock title="What's Not Included">
                    <ul className="space-y-3">
                      {experience.exclusions.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                          <XIcon size={16} className="mt-0.5 shrink-0 text-rose-500" /> {item}
                        </li>
                      ))}
                    </ul>
                  </ContentBlock>
                ) : null}
              </div>
            ) : null}

            <ContentBlock title="Meeting / Pickup Information">
              <p className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin size={16} className="mt-0.5 shrink-0 text-apex-600" />
                {experience.meetingPoint}
              </p>
            </ContentBlock>

            {experience.whatToBring.length > 0 ? (
              <ContentBlock title="What to Bring">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {experience.whatToBring.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <Backpack size={15} className="mt-0.5 shrink-0 text-apex-600" /> {item}
                    </li>
                  ))}
                </ul>
              </ContentBlock>
            ) : null}

            {experience.importantInfo?.length ? (
              <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8">
                <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
                  <Info size={15} /> Important Information
                </p>
                <ul className="mt-4 space-y-2">
                  {experience.importantInfo.map((item) => (
                    <li key={item} className="text-sm leading-6 text-amber-900">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl xl:sticky xl:top-24 xl:self-start">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Starting from</p>
              <p className="text-3xl font-bold text-slate-900">
                {formatINR(experience.price)}
                <span className="text-sm font-normal text-slate-500"> / person</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {experience.availability === 'Available'
                  ? 'Available for booking'
                  : experience.availability === 'Seasonal'
                    ? 'Seasonal availability — see Important Information'
                    : 'On request — subject to confirmation'}
              </p>
            </div>

            <ExperienceBookingActions experience={experience} />
          </aside>
        </div>
      </section>
    </main>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-4">
      <Icon size={16} className="text-apex-600" />
      <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ContentBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
