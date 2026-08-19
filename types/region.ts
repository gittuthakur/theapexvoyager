export type RegionId = 'himachal-pradesh' | 'jammu-kashmir' | 'uttarakhand';

export interface Region {
  id: RegionId;
  /** Matches `Destination.state` exactly — the field the /api/destinations route already filters on. */
  name: string;
  shortName: string;
  description: string;
  image: string;
}
