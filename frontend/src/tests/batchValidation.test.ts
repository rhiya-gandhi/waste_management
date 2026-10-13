import { describe, it, expect } from 'vitest';
import { MaterialCategory, QuantityUnit, WasteCondition } from '../types/database.types';

interface BatchInput {
  title: string;
  material_category: MaterialCategory;
  quantity: number;
  unit: QuantityUnit;
  estimated_contamination_percent: number;
  condition_description: WasteCondition;
  pickup_address: string;
}

function validateBatchInput(input: BatchInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length === 0) {
    errors.push('Batch title is required.');
  }

  if (input.quantity <= 0) {
    errors.push('Quantity must be greater than zero.');
  }

  if (input.estimated_contamination_percent < 0 || input.estimated_contamination_percent > 100) {
    errors.push('Contamination percentage must be between 0 and 100.');
  }

  if (!input.pickup_address || input.pickup_address.trim().length === 0) {
    errors.push('Pickup address is required for logistics dispatch.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

describe('validateBatchInput', () => {
  it('passes on valid batch specifications', () => {
    const res = validateBatchInput({
      title: 'Segregated HDPE Bottles',
      material_category: 'plastic',
      quantity: 50,
      unit: 'kg',
      estimated_contamination_percent: 5,
      condition_description: 'clean',
      pickup_address: '123 Green Way, Bengaluru',
    });
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('rejects zero or negative quantities', () => {
    const res = validateBatchInput({
      title: 'Bad Quantity Batch',
      material_category: 'metal',
      quantity: 0,
      unit: 'kg',
      estimated_contamination_percent: 10,
      condition_description: 'clean',
      pickup_address: '123 Green Way',
    });
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Quantity must be greater than zero.');
  });

  it('rejects out of bounds contamination percentages', () => {
    const res = validateBatchInput({
      title: 'Out of bounds',
      material_category: 'organic',
      quantity: 20,
      unit: 'kg',
      estimated_contamination_percent: 120, // Invalid > 100%
      condition_description: 'mixed',
      pickup_address: '123 Green Way',
    });
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Contamination percentage must be between 0 and 100.');
  });

  it('rejects missing pickup addresses', () => {
    const res = validateBatchInput({
      title: 'Missing Address',
      material_category: 'paper_cardboard',
      quantity: 30,
      unit: 'kg',
      estimated_contamination_percent: 5,
      condition_description: 'clean',
      pickup_address: '',
    });
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Pickup address is required for logistics dispatch.');
  });
});
