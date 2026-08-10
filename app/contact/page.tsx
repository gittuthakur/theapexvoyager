import ContactForm from '@/components/modules/ContactForm';
import { GlassCard } from '@/components/ui/GlassCard';

export default function ContactPage() {
  return (
    <main className="min-h-screen px-6 pb-10 pt-28 sm:px-10 sm:pt-32 lg:px-16 lg:pt-36">
      <section className="mx-auto max-w-5xl space-y-8">
        <GlassCard className="p-10">
          <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Contact us</p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Ready for your next expedition?</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Share your travel plans and our expert team will craft a custom journey for you.
          </p>
        </GlassCard>
        <ContactForm />
      </section>
    </main>
  );
}
