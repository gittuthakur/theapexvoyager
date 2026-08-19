'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { travelStyles } from '@/config/travelStyles.config';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';

// Distinct from components/modules/TravelStyleGrid.tsx, which points at
// /tours?category=... — this grid points at /destinations?style=... instead,
// using the canonical 6-style vocabulary from config/travelStyles.config.ts.
export default function DestinationStyleGrid() {
  return (
    <section className="py-12 lg:py-16">
      <div className="mx-auto max-w-[1440px] px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeInUp} className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Find Your Kind of Himalayas</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Travel <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">Your Way</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6"
        >
          {travelStyles.map(({ id, label, description, icon: Icon }) => (
            <motion.div key={id} variants={fadeInUp}>
              <Link
                href={`/destinations?style=${encodeURIComponent(label)}`}
                className="cursor-hover group flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-glow transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-apex-400/50"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-apex-50 text-apex-600 transition group-hover:bg-apex-100">
                  <Icon size={24} strokeWidth={1.5} />
                </span>
                <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
                <p className="text-sm leading-6 text-slate-500">{description}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
