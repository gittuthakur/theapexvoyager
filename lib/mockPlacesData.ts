import type { RawGooglePlace } from './googlePlaces';

// Shaped exactly like a real Google Places (New) Text Search response's `places[]`
// array (see RawGooglePlace in lib/googlePlaces.ts), so in local development it can
// flow through the exact same mapPlaceToDestination / toStay mapping code a real
// response would — dev exercises the identical pipeline, just fed from here instead
// of a billed network call. Keyed by a lowercase location keyword; see getMockPlaces.
export const mockPlacesByLocation: Record<string, RawGooglePlace[]> = {
  manali: [
    {
      id: 'mock_manali_solang_valley',
      displayName: { text: 'Solang Valley' },
      formattedAddress: 'Solang, Manali, Himachal Pradesh 175131, India',
      rating: 4.5,
      userRatingCount: 18200,
      photos: [{ name: 'places/mock_manali_solang_valley01/photos/mock_1' }]
    },
    {
      id: 'mock_manali_old_manali',
      displayName: { text: 'Old Manali' },
      formattedAddress: 'Old Manali, Manali, Himachal Pradesh 175131, India',
      rating: 4.6,
      userRatingCount: 9500,
      photos: [{ name: 'places/mock_manali_old_manali/photos/mock_1' }]
    },
    {
      id: 'mock_manali_hidimba_temple',
      displayName: { text: 'Hidimba Devi Temple' },
      formattedAddress: 'Old Manali, Manali, Himachal Pradesh 175131, India',
      rating: 4.6,
      userRatingCount: 33400,
      photos: [{ name: 'places/mock_manali_hidimba_temple/photos/mock_1' }]
    }
  ],
  shimla: [
    {
      id: 'mock_shimla_mall_road',
      displayName: { text: 'Mall Road' },
      formattedAddress: 'The Mall, Shimla, Himachal Pradesh 171001, India',
      rating: 4.4,
      userRatingCount: 27600,
      photos: [{ name: 'places/mock_shimla_mall_road/photos/mock_1' }]
    },
    {
      id: 'mock_shimla_the_ridge',
      displayName: { text: 'The Ridge' },
      formattedAddress: 'The Ridge, Shimla, Himachal Pradesh 171001, India',
      rating: 4.5,
      userRatingCount: 15300,
      photos: [{ name: 'places/mock_shimla_the_ridge/photos/mock_1' }]
    },
    {
      id: 'mock_shimla_jakhoo_temple',
      displayName: { text: 'Jakhoo Temple' },
      formattedAddress: 'Jakhoo Hill, Shimla, Himachal Pradesh 171001, India',
      rating: 4.4,
      userRatingCount: 8900,
      photos: [{ name: 'places/mock_shimla_jakhoo_temple/photos/mock_1' }]
    }
  ],
  kasol: [
    {
      id: 'mock_kasol_parvati_river',
      displayName: { text: 'Parvati River Bank' },
      formattedAddress: 'Kasol, Himachal Pradesh 175105, India',
      rating: 4.5,
      userRatingCount: 4200,
      photos: [{ name: 'places/mock_kasol_parvati_river/photos/mock_1' }]
    },
    {
      id: 'mock_kasol_chalal_trek',
      displayName: { text: 'Chalal Trek' },
      formattedAddress: 'Chalal, Kasol, Himachal Pradesh 175105, India',
      rating: 4.6,
      userRatingCount: 3100,
      photos: [{ name: 'places/mock_kasol_chalal_trek/photos/mock_1' }]
    },
    {
      id: 'mock_kasol_manikaran_sahib',
      displayName: { text: 'Manikaran Sahib' },
      formattedAddress: 'Manikaran, Kasol, Himachal Pradesh 175105, India',
      rating: 4.6,
      userRatingCount: 12700,
      photos: [{ name: 'places/mock_kasol_manikaran_sahib/photos/mock_1' }]
    }
  ],
  spiti: [
    {
      id: 'mock_spiti_key_monastery',
      displayName: { text: 'Key Monastery' },
      formattedAddress: 'Key, Spiti Valley, Himachal Pradesh 172114, India',
      rating: 4.7,
      userRatingCount: 5400,
      photos: [{ name: 'places/mock_spiti_key_monastery/photos/mock_1' }]
    },
    {
      id: 'mock_spiti_chandratal_lake',
      displayName: { text: 'Chandratal Lake' },
      formattedAddress: 'Chandratal, Spiti Valley, Himachal Pradesh 172112, India',
      rating: 4.8,
      userRatingCount: 3800,
      photos: [{ name: 'places/mock_spiti_chandratal_lake/photos/mock_1' }]
    },
    {
      id: 'mock_spiti_kaza_market',
      displayName: { text: 'Kaza Market' },
      formattedAddress: 'Kaza, Spiti Valley, Himachal Pradesh 172114, India',
      rating: 4.3,
      userRatingCount: 1900,
      photos: [{ name: 'places/mock_spiti_kaza_market/photos/mock_1' }]
    }
  ],
  jibhi: [
    {
      id: 'mock_jibhi_waterfall',
      displayName: { text: 'Jibhi Waterfall' },
      formattedAddress: 'Jibhi, Himachal Pradesh 175123, India',
      rating: 4.5,
      userRatingCount: 2600,
      photos: [{ name: 'places/mock_jibhi_waterfall/photos/mock_1' }]
    },
    {
      id: 'mock_jibhi_jalori_pass',
      displayName: { text: 'Jalori Pass' },
      formattedAddress: 'Jalori Pass, Banjar, Himachal Pradesh 175123, India',
      rating: 4.7,
      userRatingCount: 3300,
      photos: [{ name: 'places/mock_jibhi_jalori_pass/photos/mock_1' }]
    },
    {
      id: 'mock_jibhi_raghupur_fort',
      displayName: { text: 'Raghupur Fort' },
      formattedAddress: 'Jibhi, Himachal Pradesh 175123, India',
      rating: 4.4,
      userRatingCount: 1100,
      photos: [{ name: 'places/mock_jibhi_raghupur_fort/photos/mock_1' }]
    }
  ],
  dharamshala: [
    {
      id: 'mock_dharamshala_mcleodganj',
      displayName: { text: 'McLeod Ganj' },
      formattedAddress: 'McLeod Ganj, Dharamshala, Himachal Pradesh 176219, India',
      rating: 4.6,
      userRatingCount: 22100,
      photos: [{ name: 'places/mock_dharamshala_mcleodganj/photos/mock_1' }]
    },
    {
      id: 'mock_dharamshala_bhagsu_falls',
      displayName: { text: 'Bhagsu Falls' },
      formattedAddress: 'Bhagsu, Dharamshala, Himachal Pradesh 176219, India',
      rating: 4.3,
      userRatingCount: 9700,
      photos: [{ name: 'places/mock_dharamshala_bhagsu_falls/photos/mock_1' }]
    },
    {
      id: 'mock_dharamshala_namgyal_monastery',
      displayName: { text: 'Namgyal Monastery' },
      formattedAddress: 'McLeod Ganj, Dharamshala, Himachal Pradesh 176219, India',
      rating: 4.7,
      userRatingCount: 6500,
      photos: [{ name: 'places/mock_dharamshala_namgyal_monastery/photos/mock_1' }]
    }
  ]
};

const DEFAULT_MOCK_PLACES = mockPlacesByLocation.manali;

// Best-effort match against the known mock locations above — any other location string
// (a typo, a location we haven't authored mock data for, a stay-type query) still gets
// *something* realistic back rather than an empty grid, since this only ever runs in
// local development.
export function getMockPlaces(location: string): RawGooglePlace[] {
  const normalized = location.toLowerCase();
  const key = Object.keys(mockPlacesByLocation).find((candidate) => normalized.includes(candidate));
  return key ? mockPlacesByLocation[key] : DEFAULT_MOCK_PLACES;
}
