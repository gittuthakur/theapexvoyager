import type { Metadata } from 'next';
import Script from 'next/script';
import { GOOGLE_ADS_ID } from '@/lib/googleAds';
import { META_PIXEL_ID } from '@/lib/metaPixel';
import './globals.css';
import { Poppins } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import BackToTopButton from '@/components/ui/BackToTopButton';
import { Navbar, Footer } from '@/components/layout';
import NavigationTracker from '@/components/NavigationTracker';
import { WhatsAppInquiryProvider } from '@/components/modules/WhatsAppInquiryModal';
import { BookingRequestProvider } from '@/components/modules/BookingRequestModal';
import { siteConfig } from '@/config/site.config';
import { images } from '@/config/images.config';
import { socialLinks } from '@/config/footer.config';
import { buildTravelAgencySchema, buildWebSiteSchema } from '@/lib/schema';
import JsonLd from '@/components/seo/JsonLd';

// Poppins has no variable-weight axis on Google Fonts, so each of these 5 weights is a
// separate static .woff2 file, and next/font preloads all of them on every route (this
// call lives in the root layout). Not every route renders all 5 weights above the fold,
// so Chrome's "preloaded but not used within a few seconds" warning fires for whichever
// weight files that specific page doesn't render immediately. `display: 'swap'` (the
// default) already prevents invisible text while the real font loads, so turning off
// preload here just drops the noisy-but-harmless warning without a visible regression.
const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  preload: false
});

// `images.hero` is the same generic, non-destination-specific brand image already used
// as the OG/Twitter fallback on Home, Plan My Journey, Experiences and Experts — reused
// here as the root default so any route that doesn't set its own openGraph/twitter
// still gets a real, on-brand social preview instead of an image-less card. A page that
// already defines its own openGraph/twitter (every dynamic detail page, and the pages
// above) keeps its own object — Next replaces, not merges, an object-valued field a
// child sets, so this default never overrides a page-specific image.
export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [images.hero]
  }
};

// Site-wide structured data — rendered once here rather than per-page. No address is
// included (see lib/schema.ts's buildTravelAgencySchema comment): no verified business
// address exists in the codebase to publish.
const travelAgencySchema = buildTravelAgencySchema({
  name: siteConfig.name,
  url: siteConfig.url,
  telephone: siteConfig.contactPhone,
  email: siteConfig.contactEmail,
  sameAs: socialLinks.map((link) => link.href)
});
const webSiteSchema = buildWebSiteSchema({ name: siteConfig.name, url: siteConfig.url });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="font-sans">
        {/* Visually hidden until keyboard-focused; jumps a keyboard user straight to
            each page's <main id="main-content"> instead of tabbing through the full
            Header/nav on every route. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-apex-500 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Skip to content
        </a>
        <JsonLd data={travelAgencySchema} />
        <JsonLd data={webSiteSchema} />
        <Script id="google-ads-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`}
        </Script>
        <Script id="google-ads-base" src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
        </Script>
        <noscript>
          <img
            height={1}
            width={1}
            alt=""
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        <NavigationTracker />
        {/* `reducedMotion="user"` makes every framer-motion `motion.*` component sitewide
            automatically honor the OS-level `prefers-reduced-motion` setting (disabling
            transform/scale/opacity entrance animations) with no per-component changes —
            the codebase had no reduced-motion handling at all before this. */}
        <MotionConfig reducedMotion="user">
          <WhatsAppInquiryProvider>
            <BookingRequestProvider>
              <Navbar />
              {children}
              <Footer />
              <BackToTopButton />
            </BookingRequestProvider>
          </WhatsAppInquiryProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
