import type { MetadataRoute } from 'next';
import { connectDB } from '@/lib/mongodb';
import { Destination } from '@/models/Destination';
import { Region } from '@/models/Region';
import { Journey } from '@/models/Journey';
import { Experience } from '@/models/Experience';
import { siteConfig } from '@/config/site.config';

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
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  const [destinations, regions, journeys, experiences] = await Promise.all([
    Destination.find().select('slug updatedAt').lean<SlugRecord[]>(),
    Region.find({ status: 'published' }).select('slug updatedAt').lean<SlugRecord[]>(),
    Journey.find().select('slug updatedAt').lean<SlugRecord[]>(),
    Experience.find().select('slug updatedAt').lean<SlugRecord[]>()
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteConfig.url}/destinations`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/journeys`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/experiences`, changeFrequency: 'weekly', priority: 0.9 }
  ];

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

  return [...staticEntries, ...regionEntries, ...destinationEntries, ...journeyEntries, ...experienceEntries];
}
