import type { MetadataRoute } from 'next';
import { connectDB } from '@/lib/mongodb';
import { Destination } from '@/models/Destination';
import { Region } from '@/models/Region';
import { Journey } from '@/models/Journey';
import { Experience } from '@/models/Experience';
import { Expert } from '@/models/Expert';
import { siteConfig } from '@/config/site.config';
import { stayTypes } from '@/config/stayTypes.config';

interface SlugRecord {
  slug: string;
  updatedAt?: Date;
}

// Scoped to Destination QA Phase 6 — the Destination/Region surface only, not a
// site-wide sitemap. Projected to just `slug`/`updatedAt` (never the full curated
// record) since that's all a sitemap entry needs, and reuses the same `Destination`/
// `Region` models every other Destination page already reads from rather than adding
// a new data path.
//
// Journey coverage added later (Phase 4 remediation) — same `slug`/`updatedAt`
// projection, same `Journey` model every other Journey page already reads from
// (see lib/packages.ts). The Journey schema has no status/published/active field
// (see models/Journey.ts), so — same as `Destination` above, and same as every
// other Journey consumer in the app — every document in the collection is the
// live catalogue; there is no separate "active" subset to filter to.
//
// Experience coverage added later still (Experiences Phase 4 remediation) — same
// `slug`/`updatedAt` projection and the same reasoning as Journey immediately above:
// models/Experience.ts has no status/published/active field either, and every other
// Experience consumer (lib/experiences.ts's getAllExperiences()/getExperienceBySlug())
// already queries it unfiltered, so every document here is the live public catalogue.
//
// Expert coverage added later still (Travel Experts Phase 1 remediation) — different
// from every catalogue above: `active` alone is NOT the public-visibility gate here.
// See models/Expert.ts's `publiclyListed` field comment — the six current Expert
// documents are illustrative placeholder personas, not real staff, and must not be
// publicly discoverable (including via this sitemap) until a genuine profile
// explicitly opts in. Mirrors the exact `{active:true, publiclyListed:true}` filter
// lib/experts.ts's getAllExperts()/getExpertBySlug() already enforce.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  const [destinations, regions, journeys, experiences, experts] = await Promise.all([
    Destination.find().select('slug updatedAt').lean<SlugRecord[]>(),
    Region.find({ status: 'published' }).select('slug updatedAt').lean<SlugRecord[]>(),
    Journey.find().select('slug updatedAt').lean<SlugRecord[]>(),
    Experience.find().select('slug updatedAt').lean<SlugRecord[]>(),
    Expert.find({ active: true, publiclyListed: true }).select('slug updatedAt').lean<SlugRecord[]>()
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteConfig.url}/destinations`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/journeys`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/stays`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/experiences`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/transport`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/experts`, changeFrequency: 'weekly', priority: 0.9 },
    // Real, static, indexable pages with no DB-driven counterpart — previously absent
    // from this sitemap entirely despite each having its own metadata/canonical.
    { url: `${siteConfig.url}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteConfig.url}/why-the-apex-voyager`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteConfig.url}/faqs`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteConfig.url}/careers`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteConfig.url}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteConfig.url}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteConfig.url}/cancellation-policy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteConfig.url}/accessibility-policy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteConfig.url}/photo-credits`, changeFrequency: 'monthly', priority: 0.2 },
    { url: `${siteConfig.url}/plan-my-journey`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteConfig.url}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteConfig.url}/transport/partner`, changeFrequency: 'monthly', priority: 0.3 }
  ];

  // Real, stable, curated /stays/[typeSlug] pages only (see
  // app/stays/[...segments]/page.tsx's resolveSegments) — a finite, known set of
  // category pages with genuinely distinct content (a real per-category description
  // from config/stayTypes.config.ts and a different underlying stay listing each).
  //
  // /stays/[destinationSlug] pages were previously added here too, but a pre-commit
  // audit (Phase 1) found that after normalizing out the destination name, two of
  // them were byte-for-byte identical — H1 "Stays in {X}" plus an otherwise fully
  // templated body, backed only by unstable Google-Places-cache results. That's thin/
  // duplicate content by Google's own definition, so they were removed from here and
  // given `robots: { index: false, follow: true }` instead (see
  // app/stays/[...segments]/page.tsx's generateMetadata) — still linkable/crawlable
  // for discovery, just not submitted for indexing. The 2-segment [destination]/[type]
  // matrix and the Google-Places-backed /stays/property/[placeId] pages remain
  // excluded from the sitemap for the same reasons as before.
  const stayTypeEntries: MetadataRoute.Sitemap = stayTypes.map((type) => ({
    url: `${siteConfig.url}/stays/${type.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6
  }));

  const destinationEntries: MetadataRoute.Sitemap = destinations.map((destination) => ({
    url: `${siteConfig.url}/destinations/${destination.slug}`,
    lastModified: destination.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  const regionEntries: MetadataRoute.Sitemap = regions.map((region) => ({
    url: `${siteConfig.url}/regions/${region.slug}`,
    lastModified: region.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7
  }));

  const journeyEntries: MetadataRoute.Sitemap = journeys.map((journey) => ({
    url: `${siteConfig.url}/journeys/${journey.slug}`,
    lastModified: journey.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  const experienceEntries: MetadataRoute.Sitemap = experiences.map((experience) => ({
    url: `${siteConfig.url}/experiences/${experience.slug}`,
    lastModified: experience.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  const expertEntries: MetadataRoute.Sitemap = experts.map((expert) => ({
    url: `${siteConfig.url}/experts/${expert.slug}`,
    lastModified: expert.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  return [
    ...staticEntries,
    ...regionEntries,
    ...destinationEntries,
    ...journeyEntries,
    ...experienceEntries,
    ...expertEntries,
    ...stayTypeEntries
  ];
}
