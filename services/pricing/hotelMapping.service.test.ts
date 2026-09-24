import { describe, expect, it } from 'vitest';
import { haversineDistanceMeters, matchGoogleStayToHbxHotels, nameSimilarity, normalizeHotelName } from './hotelMapping.service';
import type { HbxHotelSummary } from '../providers/hbx/hbx.mapper';

describe('normalizeHotelName', () => {
  it('strips generic hospitality words and punctuation', () => {
    expect(normalizeHotelName('Radisson Hotel Shimla')).toBe('radisson shimla');
    expect(normalizeHotelName('The Oberoi Cecil, Shimla')).toBe('oberoi cecil shimla');
  });
});

describe('nameSimilarity', () => {
  it('is 1 for an exact match after normalization', () => {
    expect(nameSimilarity('The Oberoi Cecil, Shimla', 'Oberoi Cecil Shimla')).toBe(1);
  });

  it('is high but not exact for near-duplicate names', () => {
    const score = nameSimilarity('Radisson Hotel Shimla', 'Radisson Blu Shimla');
    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThan(1);
  });

  it('is low for genuinely different hotels', () => {
    expect(nameSimilarity('Wildflower Hall', 'Springfields')).toBeLessThan(0.3);
  });

  it('never throws on an empty name', () => {
    expect(nameSimilarity('', 'Radisson Shimla')).toBe(0);
  });
});

describe('haversineDistanceMeters', () => {
  it('is ~0 for identical coordinates', () => {
    const point = { latitude: 31.1032, longitude: 77.1549 };
    expect(haversineDistanceMeters(point, point)).toBeLessThan(1);
  });

  it('matches the real diagnostic distance order of magnitude (Shimla to Manali, ~90km straight-line)', () => {
    const shimla = { latitude: 31.1032, longitude: 77.1549 };
    const manali = { latitude: 32.2434, longitude: 77.1892 };
    const distanceKm = haversineDistanceMeters(shimla, manali) / 1000;
    expect(distanceKm).toBeGreaterThan(100);
    expect(distanceKm).toBeLessThan(150);
  });
});

describe('matchGoogleStayToHbxHotels', () => {
  it('is high_confidence when both name and coordinates agree closely', () => {
    const googleStay = { placeId: 'g1', name: 'The Oberoi Cecil Shimla', latitude: 31.1032338479034, longitude: 77.1549332141876 };
    const hbxHotels: HbxHotelSummary[] = [
      { hbxCode: 142275, name: 'The Oberoi Cecil, Shimla', destinationCode: 'SLV', latitude: 31.1032338479034, longitude: 77.1549332141876 }
    ];

    const result = matchGoogleStayToHbxHotels(googleStay, hbxHotels);
    expect(result.status).toBe('high_confidence');
    expect(result.bestCandidate?.hbxHotel.hbxCode).toBe(142275);
  });

  it('requires BOTH signals — a strong name match at a wildly different location is not high_confidence', () => {
    // Real diagnostic anomaly: an HBX "Manali" hotel whose coordinates actually sit in
    // Leh (~380km away), unrelated to a genuine Manali Google listing of the same name.
    const googleStay = { placeId: 'g2', name: 'The Grand Dragon Hotel', latitude: 32.2 /* Manali */, longitude: 77.19 };
    const hbxHotels: HbxHotelSummary[] = [{ hbxCode: 698769, name: 'The Grand Dragon Hotel', destinationCode: 'IN6', latitude: 34.156549, longitude: 77.580444 /* Leh */ }];

    const result = matchGoogleStayToHbxHotels(googleStay, hbxHotels);
    expect(result.status).toBe('manual_review_required');
    expect(result.bestCandidate?.flags).toContain('coordinate_anomaly_suspected');
  });

  it('is manual_review_required for a plausible but not decisive match', () => {
    const googleStay = { placeId: 'g3', name: 'Snow Valley Resort Manali', latitude: 32.2513, longitude: 77.1928 };
    const hbxHotels: HbxHotelSummary[] = [{ hbxCode: 255126, name: 'Snow Valley Resorts', destinationCode: 'IN6', latitude: 32.35, longitude: 77.3 }];

    const result = matchGoogleStayToHbxHotels(googleStay, hbxHotels);
    expect(result.status).toBe('manual_review_required');
  });

  it('is no_match for an unrelated hotel', () => {
    const googleStay = { placeId: 'g4', name: 'Zzz Totally Different Guesthouse', latitude: 10, longitude: 10 };
    const hbxHotels: HbxHotelSummary[] = [{ hbxCode: 1, name: 'Wildflower Hall', destinationCode: 'SLV', latitude: 31.13, longitude: 77.23 }];

    expect(matchGoogleStayToHbxHotels(googleStay, hbxHotels).status).toBe('no_match');
  });

  it('is no_match (not an error) when no HBX hotels are available to compare against', () => {
    const googleStay = { placeId: 'g5', name: 'Any Hotel', latitude: 1, longitude: 1 };
    expect(matchGoogleStayToHbxHotels(googleStay, []).status).toBe('no_match');
  });

  it('flags missing coordinates on either side rather than guessing a distance', () => {
    const googleStay = { placeId: 'g6', name: 'Oberoi Cecil Shimla' };
    const hbxHotels: HbxHotelSummary[] = [{ hbxCode: 142275, name: 'The Oberoi Cecil, Shimla', destinationCode: 'SLV' }];

    const result = matchGoogleStayToHbxHotels(googleStay, hbxHotels);
    expect(result.bestCandidate?.flags).toContain('missing_coordinates');
    expect(result.status).not.toBe('high_confidence');
  });
});
