/**
 * Single source of truth for every local image path used across the site.
 * Files must physically exist under `public/images/` — see public/images/README.md.
 * Plain string paths (not static `import`) on purpose: static imports fail the build
 * the instant a file is missing, whereas a string path + <SafeImage> degrades
 * gracefully to a themed placeholder if the file 404s.
 */
export const images = {
  hero: '/images/img-hero-hero.jpg',
  ctaBanner: '/images/cta-real-himachal.jpg',
  toursHero: '/images/feature-tour-hero.jpg',
  destinationsHero: '/images/destination-hero-img.jpg',
  destinations: {
    manali: '/images/destination-manali.jpg',
    kinnaur: '/images/destination-kinnaur.jpg',
    spitiValley: '/images/destination-spiti.jpg',
    dharamshala: '/images/destination-dharamshala.jpg',
    shimla: '/images/destination-shimla.jpg',
    kasol: '/images/destination-kasol.jpg',
    gulmarg: '/images/destination-gulmarg.jpg',
    munsiyari: '/images/destination-munsiyari.jpg',
    rishikesh: '/images/destination-rishikesh.jpg',
    haridwar: '/images/destination-haridwar.jpg',
    birBilling: '/images/destination-bir-billing.jpg',
    sanglaValley: '/images/destination-sangla-valley.jpg',
    chitkul: '/images/destination-chitkul.jpg',
    chamba: '/images/destination-chamba.jpg',
    dalhousie: '/images/destination-dalhousie.jpg',
    khajjiar: '/images/destination-khajjiar.jpg'
  },
  tours: {
    spitiCircuit: '/images/spiti-circuit.jpg',
    manaliLehHighway: '/images/manali-leh-highway.jpg',
    dharamshalaRetreat: '/images/dharamshala-retreat.jpg',
    shimlaHeritageWalk: '/images/shimla-heritage-walk.jpg',
    kasolBackpacking: '/images/destination-kasol.jpg'
  },
  packages: {
    manaliPremiumEscape: '/images/destination-manali.jpg',
    kashmirSignatureJourney: '/images/hero-hero.jpg',
    spitiValleyAdventure: '/images/destination-spiti.jpg',
    himachalHimalayanExplorer: '/images/feature-tour-hero.jpg',
    dharamshalaDalhousieEscape: '/images/destination-dharamshala.jpg',
    // This package's actual content (itinerary, destinationSlugs) is Rishikesh/Haridwar/
    // Mussoorie in Uttarakhand — the old key name and its Himachal-branded CTA-banner
    // image ('/images/cta-real-himachal.jpg') were leftover from an earlier, unrelated
    // "Sikkim" draft. Same honest generic fallback used for Uttarakhand elsewhere
    // (config/images.config.ts's experiences.himalayanVista).
    uttarakhandExplorer: '/images/img-hero-hero.jpg'
  },
  // Destination-specific J&K/Uttarakhand photography now exists (see `destinations`
  // above: gulmarg, munsiyari, rishikesh, haridwar). The generic entries below
  // (himalayanVista, mountainDusk, valleyGeneric) remain wired into packages/tours/
  // hero elsewhere in this file and are left as-is — swap those for dedicated
  // photography as it becomes available for those specific uses.
  experiences: {
    spitiHomestay: '/images/spiti-valley-boutique-hotel.jpg',
    kinnaurTrek: '/images/kinnaur-rampur-trek.jpg',
    riversideCamp: '/images/manali-riverside-resort.jpg',
    heritageLane: '/images/shimla-heritage-hotel.jpg',
    hillCottage: '/images/Villas-and-Cottages.jpg',
    himalayanVista: '/images/img-hero-hero.jpg',
    mountainDusk: '/images/hero-hero.jpg',
    valleyGeneric: '/images/feature-tour-hero.jpg'
  }
} as const;
