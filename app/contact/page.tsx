import ContactForm from '@/components/modules/ContactForm';
import { GlassCard } from '@/components/ui/GlassCard';

export default function ContactPage() {
  return (
    <main className="min-h-screen px-6 py-14 sm:px-10 lg:px-16">
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
