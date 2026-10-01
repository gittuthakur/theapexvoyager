export interface ImageCredit {
  destination: string;
  imagePath: string;
  title: string;
  author: string;
  sourceUrl: string;
  originalMediaUrl: string;
  downloadedMediaUrl: string;
  originalResolution: string;
  localResolution: string;
  licenseName: string;
  licenseUrl: string;
  modified: boolean;
  modificationDescription?: string;
}

export const GULMARG_WINTER_IMAGE = '/images/gulmarg-winter-snow.jpg';

export const JOURNEY_IMAGE_CREDITS: readonly ImageCredit[] = [
  {
    destination: 'Gulmarg winter',
    imagePath: GULMARG_WINTER_IMAGE,
    title: 'Snowfall In Gulmarg',
    author: 'Koshur',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Snowfall_In_Gulmarg.jpg',
    originalMediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Snowfall_In_Gulmarg.jpg',
    downloadedMediaUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Snowfall_In_Gulmarg.jpg/1280px-Snowfall_In_Gulmarg.jpg',
    originalResolution: '4096x3072',
    localResolution: '1280x960',
    licenseName: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    modified: true,
    modificationDescription:
      'Resized by Wikimedia Commons from 4096x3072 to 1280x960; no crop or other edits. The image and resized version are licensed under CC BY-SA 4.0.'
  }
];

export function getJourneyImageCredit(imagePath: string): ImageCredit | undefined {
  return JOURNEY_IMAGE_CREDITS.find((credit) => credit.imagePath === imagePath);
}