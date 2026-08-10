import { MapPin, Leaf, HeartHandshake, ShieldCheck, Compass, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen px-6 pb-10 pt-28 sm:px-10 sm:pt-32 lg:px-16 lg:pt-36">
      <section className="mx-auto max-w-6xl space-y-10">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 shadow-glow backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.32em] text-sky-300">The Apex Difference</p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Why travelers choose us</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
            Crafting authentic, safe, and soulful journeys through the mountains and beyond.
            We don’t just book trips. We build experiences grounded in local knowledge, responsible travel, and genuine care for every guest, from first inquiry to farewell.
          </p>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 shadow-glow">
            <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Our Story & Vision</p>
            <h2 className="text-3xl font-semibold text-white">Born from passion for the Himalayas</h2>
            <p className="text-slate-300 leading-8">
              The Apex Voyager began as a collective of mountain guides, itinerary designers, and hospitality experts who wanted something different from the ordinary. We were inspired by the energy of local communities, the quiet beauty of hidden valleys, and the desire to create journeys that feel human, soulful, and unforgettable.
            </p>
            <p className="text-slate-300 leading-8">
              Instead of standard commercial tourism, we craft trips that honor the terrain, celebrate local culture, and make every traveler feel cared for from the moment they reach out to the moment they say goodbye.
            </p>
          </div>

          <div className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-glow">
            <div className="rounded-3xl bg-slate-900/80 p-6 text-slate-200">
              <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Our Promise</p>
              <h3 className="mt-4 text-2xl font-semibold text-white">A seamless journey, always</h3>
              <p className="mt-4 text-slate-300 leading-7">
                We promise transparent pricing, personalized itineraries, and a travel experience that feels effortless, immersive, and deeply memorable.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <ShieldCheck className="h-7 w-7 text-apex-300" />
                <div>
                  <h4 className="text-lg font-semibold text-white">Safety & Comfort First</h4>
                  <p className="text-slate-300 leading-6">
                    Reliable vehicles, experienced local drivers, and curated stays ensure peace of mind in every destination.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <HeartHandshake className="h-7 w-7 text-apex-300" />
                <div>
                  <h4 className="text-lg font-semibold text-white">End-to-End Personal Care</h4>
                  <p className="text-slate-300 leading-6">
                    Dedicated support from first inquiry through farewell, with thoughtful planning and attentive service at every step.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8 rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 shadow-glow">
          <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Core Pillars</p>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
              <div className="flex items-center gap-3 text-apex-300">
                <MapPin className="h-6 w-6" />
                <h3 className="text-xl font-semibold text-white">Unmatched Local Expertise</h3>
              </div>
              <p className="mt-4 text-slate-300 leading-7">
                Built on firsthand knowledge of hidden trails, mountain culture, and terrain across Narkanda, Manali, Spiti, and beyond.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
              <div className="flex items-center gap-3 text-apex-300">
                <Leaf className="h-6 w-6" />
                <h3 className="text-xl font-semibold text-white">Responsible & Sustainable Travel</h3>
              </div>
              <p className="mt-4 text-slate-300 leading-7">
                We preserve mountain ecosystems, respect local traditions, and support community economies through responsible travel practices.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
              <div className="flex items-center gap-3 text-apex-300">
                <Compass className="h-6 w-6" />
                <h3 className="text-xl font-semibold text-white">End-to-End Personal Care</h3>
              </div>
              <p className="mt-4 text-slate-300 leading-7">
                Every itinerary is tailored, every question is answered, and every guest travels with the support of our local experts.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
              <div className="flex items-center gap-3 text-apex-300">
                <ShieldCheck className="h-6 w-6" />
                <h3 className="text-xl font-semibold text-white">Safety & Comfort First</h3>
              </div>
              <p className="mt-4 text-slate-300 leading-7">
                Our meticulous planning includes trusted transportation, secure campsites, and stays selected for comfort and authenticity.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-8 rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 shadow-glow lg:grid-cols-[0.9fr_0.7fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Mission statement</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">Turn every vacation into a memorable story</h2>
            <p className="mt-5 text-slate-300 leading-8">
              Our mission is to make high-altitude travel feel effortless, inspiring, and deeply personal. With transparent pricing and custom itineraries, we help travelers connect with the mountains, the people, and the places that make every trip extraordinary.
            </p>
            <p className="mt-4 text-slate-300 leading-8">
              We believe adventure should be enriching, sustainable, and safe. That’s the promise behind every journey we design.
            </p>
          </div>
          <div className="space-y-6 rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-8">
            <div className="flex items-center gap-3 rounded-3xl bg-slate-950/60 p-5">
              <Mail className="h-6 w-6 text-apex-300" />
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Need help planning?</p>
                <p className="mt-2 text-white">Our travel experts are ready to help you build your next Himalayan adventure.</p>
              </div>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="text-sm uppercase tracking-[0.32em] text-slate-400">Transparent planning</p>
              <p className="leading-7">
                Every itinerary is custom-built with honest pricing, local insight, and thoughtful support before, during, and after your journey.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-10 shadow-glow">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Ready to explore?</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Let’s craft your next Himalayan journey.</h2>
              <p className="mt-4 max-w-2xl text-slate-300 leading-8">
                Whether you dream of a remote trek, a mountain retreat, or a soulful cultural expedition, our team will plan every detail with care.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
              <Link href="/tours" className="inline-flex items-center justify-center rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-apex-400">
                Explore curated tours
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-apex-300 hover:text-apex-300">
                Talk to an expert
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
