import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import {
  Backpack,
  Calendar,
  Check,
  Clock,
  Gauge,
  Info,
  MapPin,
  Users,
  X as XIcon
} from 'lucide-react';
import ExperienceBookingActions from '@/components/modules/experiences/ExperienceBookingActions';
import ExperienceHero from '@/components/modules/experiences/ExperienceHero';
import DetailPageContainer from '@/components/modules/detail/DetailPageContainer';
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
  // Previously only title/description were set, so canonical and every Open Graph tag
  // silently inherited the root layout's generic homepage defaults (title "The Apex
  // Voyager", the homepage description/URL, no image) — sharing any specific
  // experience's link produced a homepage-branded preview card instead of that
  // experience's own. `alternates.canonical` is relative and carries no query string,
  // so any future query-string variant of this same URL canonicalizes back to the bare
  // experience URL automatically (matching app/journeys/[slug]/page.tsx's `?book=1`
  // precedent).
  const title = `${experience.title} | The Apex Voyager`;
  const description = experience.shortDescription;
  const canonicalPath = `/experiences/${experience.slug}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: { type: 'website', title, description, url: canonicalPath, images: [{ url: experience.image, alt: experience.title }] }
  };
}

export default async function ExperienceDetailPage({ params }: ExperienceDetailPageProps) {
  const { slug } = await params;
  const experience = await getExperienceBySlug(slug);

  if (!experience) {
    notFound();
  }

  const gallery = experience.gallery.length > 0 ? experience.gallery : [experience.image];

  return (
    <DetailPageContainer>
      <BackButton fallbackHref="/experiences" label="Back to Experiences" />

      <ExperienceHero experience={experience} image={gallery[0]} />

      {gallery.length > 1 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {gallery.slice(1, 3).map((image, index) => (
            <div key={image + index} className="relative h-32 overflow-hidden rounded-[1.5rem] bg-slate-200 sm:h-40">
              <SafeImage src={image} alt={`${experience.title} — photo ${index + 2}`} fill sizes="30vw" className="object-cover" />
            </div>
          ))}
        </div>
      ) : null}

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
                <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
                  <Info size={15} /> Important Information
                </h2>
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

          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl xl:sticky xl:top-24 xl:mr-8 xl:self-start">
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
    </DetailPageContainer>
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
      <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
