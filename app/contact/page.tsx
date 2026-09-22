import type { Metadata } from 'next';
import ContactForm from '@/components/modules/ContactForm';
import { GlassCard } from '@/components/ui/GlassCard';
import { images } from '@/config/images.config';

const title = 'Contact Us | The Apex Voyager India';
const description = 'Get in touch with The Apex Voyager India to plan a custom Himalayan journey, stay, or transport booking.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/contact' },
  openGraph: { title, description, url: '/contact', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.hero] }
};

export default function ContactPage() {
  return (
    <main id="main-content" className="min-h-screen px-6 py-14 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-5xl space-y-8">
        <GlassCard className="p-10">
          <p className="text-sm uppercase tracking-[0.32em] text-apex-600">Contact us</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">Ready for your next expedition?</h1>
          <p className="mt-4 max-w-3xl text-slate-600">
            Share your travel plans and our expert team will craft a custom journey for you.
          </p>
        </GlassCard>
        <ContactForm />
      </section>
    </main>
  );
}
