import Link from 'next/link';
import {
  Database,
  Fingerprint,
  Lock,
  Mail,
  Megaphone,
  MessageCircle,
  Phone,
  Share2,
  Shield,
  Sparkles,
  Timer
} from 'lucide-react';
import { siteConfig } from '@/config/site.config';

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
        You may choose to communicate with The Apex Voyager India over WhatsApp using the number listed on our website.
        Information you share with us this way is used only to assist with your enquiry or booking, in the same
        way as information shared by phone or email. We do not access any information from your WhatsApp account
        beyond what you choose to send us directly.
      </p>
    )
  },
  {
    icon: Megaphone,
    heading: '4. Meta Lead Ads and Instant Forms',
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base">
        <p>
          If you respond to one of our advertisements on Facebook or Instagram by submitting a Meta lead form
          (an &ldquo;Instant Form&rdquo;), the details you choose to enter in that form are passed to The Apex Voyager
          India. This may include your name, phone / WhatsApp number, email address, destination or travel interest,
          travel dates, traveller details and your answers to any other questions in the form. We receive only what
          you submit in the form. Meta processes your information under its own privacy policy.
        </p>
        <p>
          We may store this information in our private internal customer-enquiry system (CRM), which only authorised
          members of our team can access, in order to respond to your enquiry, contact you as a prospective traveller,
          prepare quotations, record our communication and follow-up with you, manage travel enquiries and bookings,
          and provide customer service. We do not sell customer personal information.
        </p>
        <p>
          To ask us to delete information received through a Meta lead form, see our{' '}
          <Link href="/data-deletion" className="font-semibold text-apex-700 underline underline-offset-2 hover:text-apex-800">
            User Data Deletion Instructions
          </Link>
          .
        </p>
      </div>
    )
  },
  {
    icon: Timer,
    heading: '5. Cookies, Local Storage and Advertising Measurement',
    body: (
      <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
        This website loads the Google Ads tag to measure advertising activity, including clicks that open
        WhatsApp, and Meta Pixel to record page views. A WhatsApp click does not mean that a message was sent
        or a booking confirmed. These services may use cookies and receive browser, device, IP address,
        page URL and referrer information. We also use browser local storage for saved favourites.
        You can manage cookies and stored site data through your browser settings; blocking them may affect
        saved preferences and advertising measurement. Google and Meta provide additional privacy and ad controls
        in their own services.
      </p>
    )
  },
  {
    icon: Share2,
    heading: '6. Third-Party Services',
    body: (
      <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
        We use hosting, database and email providers to operate the website and handle enquiries. Travel details
        needed to arrange a requested service may be shared with the relevant accommodation or transport provider.
        Google and Meta receive information through the advertising technologies described above and process it
        under their own privacy policies. Opening WhatsApp takes you to a separate service governed by its own terms.
      </p>
    )
  },
  {
    icon: Lock,
    heading: '7. Data Security',
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
    heading: '8. Data Retention',
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base">
        <p>
          We keep enquiry, lead and customer information only for as long as reasonably necessary for purposes such as:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>handling your enquiry and following up with you</li>
          <li>arranging the travel services you request</li>
          <li>booking administration and customer service</li>
          <li>accounting and legal obligations, where applicable</li>
          <li>resolving disputes</li>
        </ul>
        <p>
          When information is no longer needed for these purposes, it may be securely deleted or anonymised, subject to
          any legitimate legal and record-keeping obligations.
        </p>
      </div>
    )
  },
  {
    icon: Shield,
    heading: '9. Your Rights',
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base">
        <p>
          You can contact us at any time to ask what information we hold about you, to request a correction, or to
          request that it be deleted — subject to any records we are required to keep for legal or business
          purposes.
        </p>
        <p>
          <Link href="/data-deletion" className="font-semibold text-apex-700 underline underline-offset-2 hover:text-apex-800">
            User Data Deletion Instructions
          </Link>{' '}
          explain how to ask us to delete information received through our website enquiry forms, Facebook or
          Instagram lead forms, or held in our internal CRM.
        </p>
      </div>
    )
  }
];

export default function PrivacyPolicyContent() {
  return (
    <main id="main-content" className="min-h-screen bg-white px-4 pb-20 pt-24 text-slate-900 sm:px-6 lg:px-8">
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
            The Apex Voyager India respects your privacy and is committed to protecting the information you share with us
            when you explore our website, enquire about a journey, or communicate with our travel team.
          </p>
          <p className="text-xs text-slate-400">
            Last updated: 5 October 2026
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
              <h2 className="text-xl font-bold sm:text-2xl">10. Contact</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                If you have any questions about this Privacy Policy or the information we hold about you, please
                get in touch.
              </p>
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
      </div>
    </main>
  );
}
