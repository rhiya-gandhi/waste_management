import { describe, it, expect } from 'vitest';
import { evaluateRecyclerMatch, rankMatchingRecyclers } from '../services/matchingEngine';
import { calculateDistanceKm } from '../utils/haversine';
import { RecyclerFacility, WasteBatch } from '../types/database.types';

describe('calculateDistanceKm (Haversine formula)', () => {
  it('calculates distance between known Bengaluru points', () => {
    // Indiranagar (12.9784, 77.6408) to Peenya (13.0312, 77.5186) ~ 14.5 km
    const dist = calculateDistanceKm(12.9784, 77.6408, 13.0312, 77.5186);
    expect(dist).not.toBeNull();
    expect(dist).toBeGreaterThan(12);
    expect(dist).toBeLessThan(16);
  });

  it('returns null when coordinates are null or invalid', () => {
    expect(calculateDistanceKm(null, 77.6408, 13.0312, 77.5186)).toBeNull();
    expect(calculateDistanceKm(12.9784, undefined, 13.0312, 77.5186)).toBeNull();
    expect(calculateDistanceKm(12.9784, 77.6408, 195.0, 77.5186)).toBeNull(); // invalid latitude
  });
});

describe('evaluateRecyclerMatch (Deterministic Matching Engine)', () => {
  const sampleBatch: WasteBatch = {
    id: 'batch-1',
    generator_id: 'gen-1',
    title: 'Plastic Collection',
    material_category: 'plastic',
    quantity: 50,
    unit: 'kg',
    estimated_contamination_percent: 5,
    condition_description: 'clean',
    readiness: 'immediate',
    pickup_address: '123 Test St',
    latitude: 12.9784,
    longitude: 77.6408,
    status: 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sampleRecycler: RecyclerFacility = {
    id: 'rec-1',
    user_id: 'user-rec-1',
    facility_name: 'EcoPlast Hub',
    business_reg_number: 'REG-123',
    verification_status: 'verified',
    facility_address: 'Peenya Industrial Area',
    latitude: 13.0312,
    longitude: 77.5186,
    max_distance_km: 30,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    accepted_materials: [
      {
        id: 'rule-1',
        recycler_id: 'rec-1',
        material_category: 'plastic',
        specific_subtypes: ['PET', 'HDPE'],
        max_contamination_percent: 15,
        min_quantity_kg: 10,
        max_quantity_kg: 1000,
        accepts_pickup: true,
        accepts_dropoff: true,
        price_per_kg: 12,
        created_at: new Date().toISOString(),
      },
    ],
  };

  it('matches when all criteria (verification, material, contamination, quantity, distance) are met', () => {
    const result = evaluateRecyclerMatch(sampleBatch, sampleRecycler);
    expect(result.isMatch).toBe(true);
    expect(result.disqualificationReasons.length).toBe(0);
    expect(result.score).toBeGreaterThan(70);
  });

  it('excludes unverified recyclers', () => {
    const unverifiedRecycler = { ...sampleRecycler, verification_status: 'pending' as const };
    const result = evaluateRecyclerMatch(sampleBatch, unverifiedRecycler);
    expect(result.isMatch).toBe(false);
    expect(result.disqualificationReasons.some((r) => r.includes('not verified'))).toBe(true);
  });

  it('excludes recyclers that do not accept the material', () => {
    const paperRecycler: RecyclerFacility = {
      ...sampleRecycler,
      accepted_materials: [
        {
          id: 'rule-2',
          recycler_id: 'rec-1',
          material_category: 'paper_cardboard',
          specific_subtypes: ['boxes'],
          max_contamination_percent: 10,
          min_quantity_kg: 5,
          accepts_pickup: true,
          accepts_dropoff: true,
          price_per_kg: 5,
          created_at: new Date().toISOString(),
        },
      ],
    };
    const result = evaluateRecyclerMatch(sampleBatch, paperRecycler);
    expect(result.isMatch).toBe(false);
    expect(result.disqualificationReasons.some((r) => r.includes('Does not accept material'))).toBe(true);
  });

  it('excludes batch when contamination exceeds limit', () => {
    const dirtyBatch: WasteBatch = {
      ...sampleBatch,
      estimated_contamination_percent: 25, // limit is 15%
    };
    const result = evaluateRecyclerMatch(dirtyBatch, sampleRecycler);
    expect(result.isMatch).toBe(false);
    expect(result.disqualificationReasons.some((r) => r.includes('Contamination'))).toBe(true);
  });

  it('excludes batch when quantity is below minimum requirement', () => {
    const tinyBatch: WasteBatch = {
      ...sampleBatch,
      quantity: 2, // minimum is 10 kg
    };
    const result = evaluateRecyclerMatch(tinyBatch, sampleRecycler);
    expect(result.isMatch).toBe(false);
    expect(result.disqualificationReasons.some((r) => r.includes('below minimum'))).toBe(true);
  });

  it('ranks matching recyclers before non-matching recyclers', () => {
    const unverifiedRecycler = { ...sampleRecycler, id: 'rec-2', verification_status: 'pending' as const };
    const ranked = rankMatchingRecyclers(sampleBatch, [unverifiedRecycler, sampleRecycler]);
    expect(ranked[0].isMatch).toBe(true);
    expect(ranked[0].recycler.id).toBe('rec-1');
    expect(ranked[1].isMatch).toBe(false);
  });
});
