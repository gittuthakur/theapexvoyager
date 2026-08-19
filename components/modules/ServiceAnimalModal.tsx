'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';

export interface ServiceAnimalModalProps {
  open: boolean;
  onClose: () => void;
}

function ServiceAnimalIllustration() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-hidden="true" className="h-full w-full">
      <rect width="320" height="180" fill="url(#service-animal-sky)" />
      <path d="M0 132 L70 68 L118 116 L150 84 L200 132 Z" fill="#bfdbfe" opacity="0.6" />
      <path d="M90 140 L160 60 L216 116 L260 82 L320 140 Z" fill="#93c5fd" opacity="0.55" />
      <rect x="0" y="132" width="320" height="48" fill="#eff6ff" />

      {/* Traveler */}
      <g transform="translate(112, 46)">
        <circle cx="18" cy="16" r="13" fill="#1e3a8a" />
        <path d="M6 40 Q6 24 18 24 Q30 24 30 40 L30 78 Q30 86 22 86 L14 86 Q6 86 6 78 Z" fill="#2563eb" />
        <path d="M6 46 L-10 66" stroke="#1e3a8a" strokeWidth="6" strokeLinecap="round" />
        <path d="M30 46 L44 60" stroke="#1e3a8a" strokeWidth="6" strokeLinecap="round" />
        <path d="M13 86 L11 118" stroke="#1e40af" strokeWidth="7" strokeLinecap="round" />
        <path d="M23 86 L25 118" stroke="#1e40af" strokeWidth="7" strokeLinecap="round" />
      </g>

      {/* Leash */}
      <path d="M156 92 Q182 104 206 108" stroke="#1e3a8a" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Guide dog */}
      <g transform="translate(200, 96)">
        <path d="M4 34 Q-6 34 -6 24 Q-6 14 6 12 L44 8 Q60 8 60 24 Q60 38 44 38 L18 38 Q4 38 4 34 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="10" y="14" width="34" height="12" rx="4" fill="#f59e0b" />
        <path d="M46 16 Q62 10 66 20 Q68 28 56 28 Q46 26 46 16 Z" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
        <path d="M62 12 L70 4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="63" cy="18" r="1.6" fill="#1e293b" />
        <path d="M0 30 L0 44" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <path d="M14 36 L13 48" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <path d="M32 36 L33 48" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <path d="M46 34 L48 46" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <path d="M-4 22 Q-14 16 -10 8" stroke="#cbd5e1" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>

      <defs>
        <linearGradient id="service-animal-sky" x1="0" y1="0" x2="0" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#eff6ff" />
          <stop offset="1" stopColor="#dbeafe" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ServiceAnimalModal({ open, onClose }: ServiceAnimalModalProps) {
  return (
    <FloatingOverlay
      open={open}
      onClose={onClose}
      label="Service animals"
      overlayClassName="z-[200]"
      panelClassName="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-glow max-w-md"
    >
      <div className="relative h-48 w-full bg-apex-50">
        <ServiceAnimalIllustration />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="cursor-hover absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition-colors duration-300 ease-in-out hover:text-slate-900"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4 p-8">
        <h3 className="text-2xl font-bold text-slate-900">Service animals</h3>
        <p className="text-sm leading-relaxed text-slate-600">
          Service animals aren&apos;t pets, so there&apos;s no need to add them here.
        </p>
        <p className="text-sm leading-relaxed text-slate-500">
          Travelling with an emotional support animal?{' '}
          <Link
            href="/accessibility-policy"
            onClick={onClose}
            className="cursor-hover font-semibold text-apex-600 underline transition-colors duration-300 ease-in-out hover:text-apex-700"
          >
            Check out our accessibility policy
          </Link>
          .
        </p>
      </div>
    </FloatingOverlay>
  );
}
