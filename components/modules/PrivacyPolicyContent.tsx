import {
  Database,
  Fingerprint,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Share2,
  Shield,
  Sparkles,
  Timer
} from 'lucide-react';
import { siteConfig } from '@/config/site.config';

const pendingClass =
  'inline-block rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-700';

interface Section {
  icon: typeof Shield;
  heading: string;
  body: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    icon: Database,
    heading: '1. Information We Collect',
    body: (
      <>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          We may collect information you choose to share with us when you use this website or contact our travel
          team, including:
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            'Name',
            'Phone / WhatsApp number',
            'Email address',
            'Travel dates',
            'Destination preferences',
            'Number of travellers',
            'Trip requirements',
            'Anything else voluntarily submitted through our enquiry or booking forms'
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
    icon: Fingerprint,
    heading: '2. How We Use Your Information',
    body: (
      <ul className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
        {[
          'Respond to travel enquiries',
          'Prepare personalised itineraries',
          'Provide travel quotations',
          'Communicate regarding your bookings',
          'Provide customer support',
          'Improve your experience on our website',
          'Respond to your requests'
        ].map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Shield size={16} className="mt-0.5 shrink-0 text-apex-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )
  },
  {
    icon: MessageCircle,
    heading: '3. WhatsApp Communication',
    body: (
      <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
        You may choose to communicate with The Apex Voyager over WhatsApp using the number listed on our website.
        Information you share with us this way is used only to assist with your enquiry or booking, in the same
        way as information shared by phone or email. We do not access any information from your WhatsApp account
        beyond what you choose to send us directly.
      </p>
    )
  },
  {
    icon: Timer,
    heading: '4. Cookies and Analytics',
    body: (
      <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
        This website does not currently use cookies, analytics, or tracking technologies for advertising or
        profiling purposes. If this changes in the future, this policy will be updated to reflect the technologies
        in use at that time.
      </p>
    )
  },
  {
    icon: Share2,
    heading: '5. Third-Party Services',
    body: (
      <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
        We use trusted service providers to help operate this website and respond to your enquiries — for example,
        email delivery for enquiry and booking communication. We do not sell your personal information, and we do
        not share it with third parties for their own marketing purposes.
      </p>
    )
  },
  {
    icon: Lock,
    heading: '6. Data Security',
    body: (
      <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
        We take reasonable technical and organisational measures to help protect the information you share with us
        from unauthorised access, loss, or misuse. No method of transmission or storage over the internet can be
        guaranteed to be completely secure.
      </p>
    )
  },
  {
    icon: Timer,
    heading: '7. Data Retention',
    body: (
      <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
        We retain the information you provide for as long as reasonably necessary to respond to your enquiry,
        process your booking, provide customer support, or meet our legal and business obligations.
      </p>
    )
  },
  {
    icon: Shield,
    heading: '8. Your Rights',
    body: (
      <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
        You can contact us at any time to ask what information we hold about you, to request a correction, or to
        request that it be deleted — subject to any records we are required to keep for legal or business
        purposes.
      </p>
    )
  }
];

export default function PrivacyPolicyContent() {
  return (
    <main className="min-h-screen bg-white px-4 pb-20 pt-24 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <section className="space-y-5 text-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-apex-200 bg-apex-50 px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wider text-apex-600">
            <Sparkles size={16} /> Your Privacy
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Privacy{' '}
            <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            The Apex Voyager respects your privacy and is committed to protecting the information you share with us
            when you explore our website, enquire about a journey, or communicate with our travel team.
          </p>
          <p className="text-xs text-slate-400">
            Last updated: <span className={pendingClass}>[DATE TO BE CONFIRMED]</span>
          </p>
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
                  <div className="w-full space-y-3">
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
            <div className="space-y-4">
              <h2 className="text-xl font-bold sm:text-2xl">9. Contact</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                If you have any questions about this Privacy Policy or the information we hold about you, please
                get in touch.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-sm">
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
      </div>
    </main>
  );
}
