import type { Metadata } from 'next';
import './globals.css';
import { Poppins } from 'next/font/google';
import { CustomCursor } from '@/components/ui';
import { Navbar, Footer, SmoothScroll } from '@/components/layout';
import { siteConfig } from '@/config/site.config';

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800']
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
      <body className="font-sans">
        <SmoothScroll>
          <Navbar />
          {children}
          <Footer />
        </SmoothScroll>
        <CustomCursor />
      </body>
    </html>
  );
}
