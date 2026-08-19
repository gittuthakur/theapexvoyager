import type { Metadata } from 'next';
import './globals.css';
import { Poppins } from 'next/font/google';
import { CustomCursor } from '@/components/ui';
import { Navbar, Footer, SmoothScroll } from '@/components/layout';
import { WhatsAppInquiryProvider } from '@/components/modules/WhatsAppInquiryModal';
import { BookingRequestProvider } from '@/components/modules/BookingRequestModal';
import { siteConfig } from '@/config/site.config';

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

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url
  }
};

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
        <WhatsAppInquiryProvider>
          <BookingRequestProvider>
            <SmoothScroll>
              <Navbar />
              {children}
              <Footer />
            </SmoothScroll>
            <CustomCursor />
          </BookingRequestProvider>
        </WhatsAppInquiryProvider>
      </body>
    </html>
  );
}
