import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { footerColumns, socialLinks } from '@/config/footer.config';
import { siteConfig } from '@/config/site.config';
import type { FooterColumn, SocialLink } from '@/types';

export interface FooterProps {
  columns?: FooterColumn[];
  social?: SocialLink[];
  address?: string;
}

export default function Footer({
  columns = footerColumns,
  social = socialLinks,
  address = 'Mall Road, Manali, Himachal Pradesh 175131, India'
}: FooterProps) {
  return (
    <footer className="border-t border-white/5 bg-[#060C18]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.1fr] lg:gap-8 lg:px-16">
        <div>
          <p className="text-lg font-bold uppercase tracking-wide text-white">{siteConfig.name}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">{siteConfig.tagline}</p>
          <p className="mt-4 max-w-xs text-sm text-slate-400">
            Expedition travel at its highest standard since 2012 — delivering journeys that go beyond the ordinary.
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{column.heading}</p>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="cursor-hover text-sm text-slate-400 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Get In Touch</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <Phone size={15} className="text-apex-300" />
              <a href={`tel:${siteConfig.contactPhone}`} className="cursor-hover transition hover:text-white">
                {siteConfig.contactPhone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="text-apex-300" />
              <a href={`mailto:${siteConfig.contactEmail}`} className="cursor-hover transition hover:text-white">
                {siteConfig.contactEmail}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-apex-300" />
              <span>{address}</span>
            </li>
          </ul>
          <div className="mt-5 flex items-center gap-3">
            {social.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="cursor-hover flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-apex-400/60 hover:text-white"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 px-6 py-6 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/terms" className="cursor-hover transition hover:text-white">
              Terms &amp; Conditions
            </Link>
            <Link href="/privacy" className="cursor-hover transition hover:text-white">
              Privacy
            </Link>
            <Link href="/faqs" className="cursor-hover transition hover:text-white">
              FAQs
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
