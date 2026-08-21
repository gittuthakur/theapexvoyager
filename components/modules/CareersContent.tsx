import { Compass, HeartHandshake, Mail, Mountain, Sparkles, Users } from 'lucide-react';
import { siteConfig } from '@/config/site.config';

const VALUES = [
  {
    icon: Mountain,
    title: 'Built by travelers, for travelers',
    description: 'Every team member has walked the routes and stayed in the homestays we sell — the work stays honest.'
  },
  {
    icon: HeartHandshake,
    title: 'Partner-first, not platform-first',
    description: 'We build long-term relationships with the homestays, guides, and drivers we work with across the Himalayas.'
  },
  {
    icon: Compass,
    title: 'Small team, real ownership',
    description: 'A lean team means your work reaches travelers fast, without layers of process in between.'
  }
];

const TEAMS = [
  'Travel Experts & Trip Curation',
  'Operations & Partner Relations',
  'Marketing & Content',
  'Engineering & Product'
];

export default function CareersContent() {
  return (
    <main className="min-h-screen bg-white px-4 pb-20 pt-24 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-14">
        <section className="space-y-5 text-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-apex-200 bg-apex-50 px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wider text-apex-600">
            <Sparkles size={16} /> Join The Apex Voyager
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Careers at{' '}
            <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">
              The Apex Voyager
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            We&apos;re a small team building expedition travel experiences across the Himalayas. If you care about
            travel done well, we&apos;d like to hear from you.
          </p>
        </section>

        <section className="grid gap-5 sm:grid-cols-3">
          {VALUES.map((value) => {
            const ValueIcon = value.icon;
            return (
              <div key={value.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-apex-400/40">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-apex-50 text-apex-600">
                  <ValueIcon size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{value.description}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-apex-50 text-apex-600">
              <Users size={24} />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Where we hire</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                We don&apos;t always have open roles listed, but we&apos;re regularly looking for people across these
                areas:
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {TEAMS.map((team) => (
                  <li
                    key={team}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    {team}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-apex-300">
              <Mail size={24} />
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-bold sm:text-2xl">Don&apos;t see your role listed?</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Send us your resume and a short note on what you&apos;d want to work on — we review every message
                personally.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-sm">
                <a
                  href={`mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent('Careers at ' + siteConfig.name)}`}
                  className="cursor-hover inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  <Mail size={15} /> {siteConfig.contactEmail}
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
