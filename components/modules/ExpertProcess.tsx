'use client';

import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';

const steps = [
  { number: '01', title: 'Tell Us Your Plan', description: 'Share your destination, dates and preferences.' },
  { number: '02', title: 'Meet Your Expert', description: 'We connect you with the right travel specialist.' },
  { number: '03', title: 'Shape Your Journey', description: 'Refine itinerary, stay, transport and experiences together.' },
  { number: '04', title: 'Travel With Confidence', description: 'Your journey is organised with ongoing support.' }
];

export default function ExpertProcess() {
  return (
    <section className="bg-slate-50 px-6 py-16 sm:px-10 lg:px-16">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="mx-auto max-w-7xl"
      >
        <motion.h2 variants={fadeInUp} className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          How Your Expert Helps
        </motion.h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <motion.div key={step.number} variants={fadeInUp} className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
              <p className="text-3xl font-bold text-apex-500">{step.number}</p>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
