import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Compass, Users, Headphones, ArrowRight, Flame, Globe, Building2, Smile, Award, HeartHandshake, Sparkles } from 'lucide-react';
import { destinations } from '@/config/destinations.config';
import { getAllPackages } from '@/lib/packages';
import { getHotels } from '@/lib/hotels';

export default async function AboutPage() {
  // Quick Stats Strip below uses real catalog counts — never invented business
  // metrics — computed the same way the homepage's StatsBar figures are.
  const [packages, hotels] = await Promise.all([getAllPackages(), getHotels()]);

  return (
    <main className="min-h-screen bg-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 text-slate-900 flex flex-col justify-center">
      <div className="max-w-[1440px] mx-auto w-full space-y-7">

        {/* 1. Compact Hero & Story Section (Side-by-Side to reduce height) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

          {/* Left: Mission Statement */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full border border-apex-200 bg-apex-50 text-apex-600 text-md font-semibold uppercase tracking-wider">
              <Sparkles size={18} /> Who We Are
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              Connecting You to <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">Unforgettable Journeys & Beyond</span>
            </h1>
            {/* 1. Hero Section with Detailed & Expanded Mission */}
            <section className="max-w-4xl mx-auto space-y-6 pt-4">
              <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed font-normal text-left px-0">
                <p>
                  Founded with a core passion to bridge the exact gap between modern urban explorers and unscripted, breathtaking mountain trails, <strong className="text-slate-900 font-semibold">The Apex Voyager</strong> seamlessly combines cutting-edge travel technology with deep-rooted local hospitality. We strongly believe that every single journey should be entirely effortless, deeply immersive, and forever unforgettable.
                </p>
                <p>
                  What started as a vision to redefine mountain expeditions has evolved into a trusted platform. We empower travelers by eliminating hassles through smart configuration tools, real-time pricing transparency, and handpicked local experiences that standard travel portals often miss. From the winding roads of Himachal to cozy heritage stays, we take care of the details so you can live the experience.
                </p>
              </div>
            </section>
          </div>

          {/* Right: Quick Stats Strip */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="px-5 py-7 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-apex-600">{destinations.length}+</p>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Handpicked Destinations</p>
            </div>
            <div className="px-5 py-7 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-apex-600">{packages.length}+</p>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Curated Journeys</p>
            </div>
            <div className="px-5 py-7 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-apex-600">{hotels.length}+</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Handpicked Stays</p>
            </div>
            <div className="px-5 py-7 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-500">24/7</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">On-Trip Assistance</p>
            </div>
          </div>

        </div>

        {/* 3. Detailed Philosophy Grid (Expanded Content) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 transition hover:border-apex-400/40 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-apex-50 text-apex-600 flex items-center justify-center">
              <Globe size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Unlocking Hidden Culture</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              We don’t just offer generic bookings; we connect you with authentic local traditions, undiscovered mountain paths, and handpicked heritage stays that carry the true soul of the destination.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 transition hover:border-apex-400/40 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-apex-50 text-apex-600 flex items-center justify-center">
              <HeartHandshake size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Customer-Centric Trust</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              From transparent pricing structures to flexible live itinerary customization, everything we engineer puts your comfort, safety, and ultimate satisfaction first.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 transition hover:border-apex-400/40 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-apex-50 text-apex-600 flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Technology Meets Safety</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Leveraging smart digital workflows combined with physical on-ground verification ensures your adventure is backed by top-tier safety standards and live support.
            </p>
          </div>

        </section>

        {/* 4. Concluding Vision Section */}
        <section className="rounded-3xl border border-apex-200 bg-gradient-to-r from-apex-50 via-slate-50 to-slate-50 px-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl font-bold text-slate-900">Ready to experience the extraordinary?</h2>
            <p className="text-sm text-slate-600">
              Join the modern travelers who trust The Apex Voyager for their unforgettable mountain getaways.
            </p>
          </div>

          <Link
            href="/journeys"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-8 py-3.5 font-semibold text-white transition-all hover:bg-apex-400 shadow-lg shadow-apex-500/25 shrink-0"
          >
            Explore Our Journeys <ArrowRight size={24} />
          </Link>
        </section>

      </div>
    </main>
  );
}