import { SafeImage } from '@/components/ui/SafeImage';
import { images } from '@/config/images.config';
import { siteConfig } from '@/config/site.config';

/** Static brand-editorial section — no per-journey data, just the site's own tagline/description. */
export default function JourneyStorySection() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950">
      <div className="absolute inset-0">
        <SafeImage src={images.ctaBanner} alt="A Himalayan valley road at dusk" fill sizes="100vw" className="object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-apex-300">{siteConfig.tagline}</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">Every Journey Has a Story</h2>
          <p className="mt-6 text-lg leading-8 text-slate-200">
            We believe a Himalayan journey is more than a checklist of places. It is the road you take, the people you
            meet, the food you taste and the moments you remember.
          </p>
        </div>
      </div>
    </section>
  );
}
