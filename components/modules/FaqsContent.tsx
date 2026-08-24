import Link from 'next/link';
import { CalendarCheck, CreditCard, Home, Mail, Map, Phone, Sparkles, Truck } from 'lucide-react';
import { siteConfig } from '@/config/site.config';

interface FaqCategory {
  heading: string;
  icon: typeof Map;
  faqs: { question: string; answer: string }[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    heading: 'Booking & Payments',
    icon: CreditCard,
    faqs: [
      {
        question: 'How do I book a trip with The Apex Voyager?',
        answer:
          'Browse a journey, stay, or transport option and submit a request from the booking form. Our travel experts confirm availability and pricing with you directly on WhatsApp or by phone before any payment is taken.'
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'Payment is arranged directly with your travel expert — typically via UPI or bank transfer. A partial advance secures most bookings, with the balance due closer to your travel date; your travel expert will confirm the exact payment options and split for your trip.'
      },
      {
        question: 'Is my booking confirmed instantly?',
        answer:
          'Requests are confirmed on a first-come basis once availability is verified with our partner stays, vehicles, or guides — typically within a few hours.'
      }
    ]
  },
  {
    heading: 'Trips & Itineraries',
    icon: CalendarCheck,
    faqs: [
      {
        question: 'Can I customize a journey or itinerary?',
        answer:
          'Yes — every journey can be adjusted for pace, group size, and add-ons. Use Plan My Journey or speak with a travel expert to tailor an existing itinerary or build one from scratch.'
      },
      {
        question: 'What is included in a package price?',
        answer:
          'Inclusions vary by package and are listed on each journey or package page — typically stays, listed transport, and guided experiences. Anything excluded is called out clearly before you confirm.'
      },
      {
        question: 'Do you cover remote or high-altitude Himalayan routes?',
        answer:
          'Yes, subject to seasonal and road conditions — routes like Spiti, Kinnaur, and Lahaul run seasonally and our team will flag any weather-related risk before you travel.'
      }
    ]
  },
  {
    heading: 'Stays & Homestays',
    icon: Home,
    faqs: [
      {
        question: 'How are homestays and hotels selected?',
        answer:
          'Every partner stay is personally vetted for safety, cleanliness, and hospitality before it’s listed, and re-checked periodically as part of our quality standards.'
      },
      {
        question: 'Can I request a specific room type or view?',
        answer:
          'Where a property offers multiple room categories, you can request one during booking. We’ll confirm availability with the property directly.'
      }
    ]
  },
  {
    heading: 'Transport',
    icon: Truck,
    faqs: [
      {
        question: 'How is transport pricing calculated?',
        answer:
          'Pricing depends on route, vehicle category, distance, and season. Final pricing is confirmed by our travel experts before you book.'
      },
      {
        question: 'Can I change my vehicle after booking?',
        answer:
          'Yes — you can request a different vehicle any time before your trip by reaching out to our travel experts.'
      }
    ]
  }
];

export default function FaqsContent() {
  return (
    <main className="min-h-screen bg-white px-4 pb-20 pt-24 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-14">
        <section className="space-y-5 text-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-apex-200 bg-apex-50 px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wider text-apex-600">
            <Sparkles size={16} /> Here to Help
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Answers to the questions we hear most about booking, journeys, stays, and transport across the
            Himalayas. Can&apos;t find what you&apos;re looking for? Our travel experts are one message away.
          </p>
        </section>

        {FAQ_CATEGORIES.map((category) => {
          const CategoryIcon = category.icon;
          return (
            <section key={category.heading} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-apex-50 text-apex-600">
                  <CategoryIcon size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{category.heading}</h2>
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {category.faqs.map((faq) => (
                  <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="font-semibold text-slate-900">{faq.question}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <section className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-apex-300">
              <Sparkles size={24} />
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-bold sm:text-2xl">Still have questions?</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Our travel experts can walk you through pricing, availability, and itinerary options for your trip.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-sm">
                <a
                  href={`tel:${siteConfig.contactPhone}`}
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
          Want to talk to a person right away?{' '}
          <Link href="/contact" className="cursor-hover underline hover:text-slate-600">
            Contact our travel experts
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
