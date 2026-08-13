/**
 * Single source of truth for every local image path used across the site.
 * Files must physically exist under `public/images/` — see public/images/README.md.
 * Plain string paths (not static `import`) on purpose: static imports fail the build
 * the instant a file is missing, whereas a string path + <SafeImage> degrades
 * gracefully to a themed placeholder if the file 404s.
 */
export const images = {
  hero: '/images/hero-hero.jpg',
  ctaBanner: '/images/cta-real-himachal.jpg',
  toursHero: '/images/feature-tour-hero.jpg',
  destinations: {
    manali: '/images/destination-manali.jpg',
    kinnaur: '/images/destination-kinnaur.jpg',
    spitiValley: '/images/destination-spiti.jpg',
    dharamshala: '/images/destination-dharamshala.jpg',
    shimla: '/images/destination-shimla.jpg',
    kasol: '/images/destination-kasol.jpg'
  },
  tours: {
    spitiCircuit: '/images/tour-spiti-circuit.jpg',
    manaliLehHighway: '/images/tour-manali-leh.jpg',
    dharamshalaRetreat: '/images/tour-dharamshala-retreat.jpg',
    shimlaHeritageWalk: '/images/tour-shimla-heritage.jpg',
    kasolBackpacking: '/images/tour-kasol-backpacking.jpg'
  }
} as const;
