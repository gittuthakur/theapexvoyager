import Link from 'next/link';
import { Database, FileText, Mail, Phone, ShieldCheck, Sparkles, Timer, Trash2 } from 'lucide-react';
import { siteConfig } from '@/config/site.config';

interface Section {
  icon: typeof Trash2;
  heading: string;
  body: React.ReactNode;
}

const body = 'text-sm leading-relaxed text-slate-600 sm:text-base';
const link = 'font-semibold text-apex-700 underline underline-offset-2 hover:text-apex-800';
const requestSubject = encodeURIComponent('Data deletion request');

const SECTIONS: Section[] = [
  {
    icon: Database,
    heading: '1. What this covers',
    body: (
      <>
        <p className={body}>
          You can ask The Apex Voyager India to delete the personal information we hold about you that we received
          through:
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            'Enquiries submitted on our website',
            'Facebook Lead Ads and Instant Forms',
            'Instagram Lead Ads and Instant Forms',
            'Our private internal CRM, where those enquiries are stored'
          ].map((item) => (
            <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </>
    )
  },
  {
    icon: Mail,
    heading: '2. How to request deletion',
    body: (
      <div className={`space-y-3 ${body}`}>
        <p>
          Email us at{' '}
          <a href={`mailto:${siteConfig.contactEmail}?subject=${requestSubject}`} className={`${link} break-all`}>
            {siteConfig.contactEmail}
          </a>{' '}
          with the subject &ldquo;Data deletion request&rdquo;. So that we can find the right record, please include:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>your name</li>
          <li>the phone number you used in the enquiry, and/or</li>
          <li>the email address you used in the enquiry</li>
        </ul>
        <p>
          Please do <strong>not</strong> send government ID, passport or Aadhaar details, payment card details or any
          other sensitive information &mdash; we do not need them to process your request.
        </p>
      </div>
    )
  },
  {
    icon: Timer,
    heading: '3. What happens next',
    body: (
      <div className={`space-y-3 ${body}`}>
        <p>
          We aim to acknowledge and process valid deletion requests within 30 days.
        </p>
        <p>
          If we cannot identify your record from the details you sent, or need to confirm the request comes from you, we
          may reply to ask for a little more information before deleting anything.
        </p>
      </div>
    )
  },
  {
    icon: Trash2,
    heading: '4. What we delete',
    body: (
      <p className={body}>
        Once a request is verified, we will delete or anonymise the personal information we hold about you in our
        enquiry records and our private internal CRM, including details received through a Facebook or Instagram lead
        form.
      </p>
    )
  },
  {
    icon: ShieldCheck,
    heading: '5. What we may need to keep',
    body: (
      <p className={body}>
        We cannot always delete everything. Some information may need to be retained where reasonably necessary for
        legal, accounting, fraud-prevention, dispute-resolution or other legitimate record-keeping purposes. Where that
        applies, we keep only what is needed for that purpose and let you know.
      </p>
    )
  },
  {
    icon: FileText,
    heading: '6. Information held by other services',
    body: (
      <p className={body}>
        Meta (Facebook and Instagram), Google and WhatsApp hold their own copies of information under their own privacy
        policies. Deleting information from our systems does not delete it from those services; to manage that
        information, please use their own tools and settings.
      </p>
    )
  }
];

export default function DataDeletionContent() {
  return (
    <main id="main-content" className="min-h-screen bg-white px-4 pb-20 pt-24 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <section className="space-y-5 text-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-apex-200 bg-apex-50 px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wider text-apex-600">
            <Sparkles size={16} /> Your Data
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            User Data{' '}
            <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">
              Deletion Instructions
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            How to ask The Apex Voyager India to delete personal information you shared through our website or through
            Facebook and Instagram lead forms. See also our{' '}
            <Link href="/privacy" className={link}>
              Privacy Policy
            </Link>
            .
          </p>
          <p className="text-xs text-slate-400">Last updated: 5 October 2026</p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-10">
            {SECTIONS.map((section) => {
              const SectionIcon = section.icon;
              return (
                <div key={section.heading} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-apex-50 text-apex-600">
                    <SectionIcon size={22} />
                  </div>
                  <div className="min-w-0 w-full space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{section.heading}</h2>
                    {section.body}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-apex-300">
              <Mail size={24} />
            </div>
            <div className="min-w-0 space-y-4">
              <h2 className="text-xl font-bold sm:text-2xl">Contact</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Send your request by email. You can also contact our travel team with any questions about it.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-sm break-all">
                <a
                  href={`mailto:${siteConfig.contactEmail}?subject=${requestSubject}`}
                  className="cursor-hover inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  <Mail size={15} /> {siteConfig.contactEmail}
                </a>
                <a
                  href={siteConfig.contactPhoneHref}
                  className="cursor-hover inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:border-white/40"
                >
                  <Phone size={15} /> {siteConfig.contactPhone}
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
