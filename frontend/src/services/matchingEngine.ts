import { RecyclerFacility, WasteBatch, AcceptedMaterial } from '../types/database.types';
import { calculateDistanceKm } from '../utils/haversine';

export interface MatchResult {
  recycler: RecyclerFacility;
  isMatch: boolean;
  score: number; // 0 to 100
  distanceKm: number | null;
  matchingRule?: AcceptedMaterial;
  reasons: string[];
  disqualificationReasons: string[];
}

export function evaluateRecyclerMatch(
  batch: WasteBatch,
  recycler: RecyclerFacility
): MatchResult {
  const reasons: string[] = [];
  const disqualificationReasons: string[] = [];

  // 1. Verification Gate
  if (recycler.verification_status !== 'verified') {
    disqualificationReasons.push(`Facility is not verified by platform admins (Status: ${recycler.verification_status}).`);
    return {
      recycler,
      isMatch: false,
      score: 0,
      distanceKm: null,
      reasons,
      disqualificationReasons,
    };
  }

  // 2. Active status
  if (!recycler.is_active) {
    disqualificationReasons.push('Facility is temporarily inactive or at capacity.');
  }

  // 3. Material Acceptance Rule lookup
  const acceptedRules = recycler.accepted_materials || [];
  const matchingRule = acceptedRules.find(
    (rule) => rule.material_category === batch.material_category
  );

  if (!matchingRule) {
    disqualificationReasons.push(
      `Does not accept material category: ${batch.material_category.replace('_', ' ')}.`
    );
  } else {
    reasons.push(
      `Accepts ${batch.material_category.replace('_', ' ')} (Subtypes: ${matchingRule.specific_subtypes?.join(', ') || 'all standard'})`
    );

    // 4. Contamination Criteria
    if (batch.estimated_contamination_percent > matchingRule.max_contamination_percent) {
      disqualificationReasons.push(
        `Contamination (${batch.estimated_contamination_percent}%) exceeds facility maximum tolerance (${matchingRule.max_contamination_percent}%).`
      );
    } else {
      reasons.push(
        `Contamination (${batch.estimated_contamination_percent}%) is within limit (<= ${matchingRule.max_contamination_percent}%).`
      );
    }

    // 5. Quantity Constraints
    // Normalize batch quantity to kg if tonnes
    let batchQuantityKg = batch.quantity;
    if (batch.unit === 'tonnes') {
      batchQuantityKg = batch.quantity * 1000;
    }

    if (batchQuantityKg < matchingRule.min_quantity_kg) {
      disqualificationReasons.push(
        `Quantity (${batchQuantityKg} kg) is below minimum accepted threshold (${matchingRule.min_quantity_kg} kg).`
      );
    } else if (matchingRule.max_quantity_kg && batchQuantityKg > matchingRule.max_quantity_kg) {
      disqualificationReasons.push(
        `Quantity (${batchQuantityKg} kg) exceeds maximum facility capacity (${matchingRule.max_quantity_kg} kg).`
      );
    } else {
      reasons.push(
        `Batch volume (${batchQuantityKg} kg) satisfies capacity bounds [${matchingRule.min_quantity_kg}kg - ${matchingRule.max_quantity_kg ? matchingRule.max_quantity_kg + 'kg' : 'unlimited'}].`
      );
    }
  }

  // 6. Distance calculation
  const distanceKm = calculateDistanceKm(
    batch.latitude,
    batch.longitude,
    recycler.latitude,
    recycler.longitude
  );

  if (distanceKm !== null) {
    if (distanceKm > recycler.max_distance_km) {
      disqualificationReasons.push(
        `Distance (${distanceKm} km) exceeds facility service radius (${recycler.max_distance_km} km).`
      );
    } else {
      reasons.push(`Within service radius (${distanceKm} km <= ${recycler.max_distance_km} km).`);
    }
  } else {
    reasons.push('Distance could not be calculated (coordinates not available).');
  }

  const isMatch = disqualificationReasons.length === 0;

  // Calculate compatibility score (0 - 100)
  let score = 0;
  if (isMatch) {
    score = 70; // baseline for rule satisfaction
    if (distanceKm !== null) {
      const distanceBonus = Math.max(0, 30 - distanceKm * 0.5);
      score += Math.round(distanceBonus);
    }
    score = Math.min(100, Math.max(0, score));
  }

  return {
    recycler,
    isMatch,
    score,
    distanceKm,
    matchingRule,
    reasons,
    disqualificationReasons,
  };
}

export function rankMatchingRecyclers(
  batch: WasteBatch,
  recyclers: RecyclerFacility[]
): MatchResult[] {
  const evaluated = recyclers.map((r) => evaluateRecyclerMatch(batch, r));

  // Sort matching ones first by score descending, then distance ascending
  return evaluated.sort((a, b) => {
    if (a.isMatch && !b.isMatch) return -1;
    if (!a.isMatch && b.isMatch) return 1;
    if (a.isMatch && b.isMatch) {
      if (a.score !== b.score) return b.score - a.score;
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
    }
    return 0;
  });
}
