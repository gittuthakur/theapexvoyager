import Link from 'next/link';
import {
  BadgeCheck,
  CalendarClock,
  FileCheck2,
  Gavel,
  Headset,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { regionCategories } from '@/config/search.config';
import { siteConfig } from '@/config/site.config';

export default function AccessibilityPolicyContent() {
  return (
    <main id="main-content" className="min-h-screen bg-white px-4 pb-20 pt-24 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-14">
        {/* Hero */}
        <section className="space-y-5 text-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-apex-200 bg-apex-50 px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wider text-apex-600">
            <Sparkles size={16} /> Inclusive Himalayan Travel
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Accessibility &amp; Assistance Animals{' '}
            <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">Policy</span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            We help travellers discuss accessibility requirements when planning a Himalayan journey. Terrain,
            buildings and vehicles vary across Himachal Pradesh, Kashmir and Uttarakhand. Share your needs before
            booking so we can check specific arrangements with the property or transport provider.
          </p>
        </section>

        {/* Section 1: Service Animals vs. Pets */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-apex-50 text-apex-600">
              <BadgeCheck size={24} />
            </div>
            <div className="min-w-0 space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">1. Service Animals vs. Pets</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                Guide dogs and trained assistance animals can be essential travel companions. Tell us about the
                assistance you need so we can check access arrangements with each property and transport provider.
                We cannot promise identical facilities or arrangements across every listed service.
              </p>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                If you travel with an emotional support animal or a pet, ask us to check the specific provider&apos;s
                arrangements before you book. We will explain any relevant requirements shared by that provider.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Legal Framework in India */}
        <section className="rounded-3xl border border-apex-200 bg-gradient-to-r from-apex-50 via-slate-50 to-slate-50 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-apex-600 shadow-sm">
              <Gavel size={24} />
            </div>
            <div className="min-w-0 space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">2. Legal Framework in India</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                We recognise the objectives of the{' '}
                <strong className="font-semibold text-slate-900">
                  Rights of Persons with Disabilities (RPWD) Act, 2016
                </strong>
                . We aim to support respectful, non-discriminatory travel planning and reasonable accommodation.
                This page describes our coordination process; it does not certify every supplier or route as accessible.
              </p>
              <ul className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-apex-500" />
                  <span>Discuss access needs for rooms, entrances, bathrooms and vehicles before booking.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-apex-500" />
                  <span>Ask us to check assistance-animal arrangements with each service provider.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-apex-500" />
                  <span>Request written confirmation of the arrangements important to your journey.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Guidelines for Travelers */}
        <section className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">3. Guidelines for Travelers</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-apex-400/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-apex-50 text-apex-600">
                <CalendarClock size={22} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Give prior notice</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Mountain homestays often have limited rooms and staff. Share your accessibility or assistance-animal
                requirements before booking so we have time to check suitable arrangements.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-apex-400/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-apex-50 text-apex-600">
                <FileCheck2 size={22} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Carry documentation</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Ask us what information a provider needs to confirm an arrangement. Please avoid sending medical
                records through a general enquiry form; discuss any necessary documentation directly with our team.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Support & Assistance Contact */}
        <section className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-apex-300">
              <Headset size={24} />
            </div>
            <div className="min-w-0 space-y-4">
              <h2 className="text-xl font-bold sm:text-2xl">4. Support &amp; Assistance</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Our travel team can contact the relevant property or operator to check your requirements.
                Please obtain written confirmation of essential arrangements before committing to a booking.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {regionCategories.map((region) => {
                  const RegionIcon = region.icon;
                  return (
                    <span
                      key={region.name}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200"
                    >
                      <RegionIcon size={14} className="text-apex-300" />
                      {region.name}
                    </span>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-4 pt-2 text-sm break-all">
                <a
                  href={siteConfig.contactPhoneHref}
                  className="cursor-hover inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  <Phone size={15} /> {siteConfig.contactPhone}
                </a>
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="cursor-hover inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:border-white/40"
                >
                  <Mail size={15} /> {siteConfig.contactEmail}
                </a>
              </div>
            </div>
          </div>
        </section>

        <p className="text-center text-xs text-slate-400">
          Have questions about a specific stay or route? <Link href="/contact" className="cursor-hover underline hover:text-slate-600">Contact our travel experts</Link>{' '}
          and we&apos;ll confirm accessibility arrangements before you book.
        </p>
      </div>
    </main>
  );
}
