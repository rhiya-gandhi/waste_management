import { describe, it, expect } from 'vitest';
import { validateStatusTransition } from '../services/stateMachine';

describe('validateStatusTransition (State Machine)', () => {
  it('allows generator to publish draft to available', () => {
    const res = validateStatusTransition('draft', 'available', 'generator');
    expect(res.allowed).toBe(true);
  });

  it('allows collector to transition assigned to picked_up', () => {
    const res = validateStatusTransition('assigned', 'picked_up', 'collector');
    expect(res.allowed).toBe(true);
  });

  it('forbids generator from transitioning directly to picked_up', () => {
    const res = validateStatusTransition('available', 'picked_up', 'generator');
    expect(res.allowed).toBe(false);
  });

  it('forbids collector from forging recycler confirmed receipt', () => {
    const res = validateStatusTransition('delivered', 'confirmed', 'collector');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('not authorized');
  });

  it('allows verified recycler to sign off delivered to confirmed', () => {
    const res = validateStatusTransition('delivered', 'confirmed', 'recycler');
    expect(res.allowed).toBe(true);
  });

  it('blocks duplicate transition (idempotency check)', () => {
    const res = validateStatusTransition('assigned', 'assigned', 'collector');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('already in status');
  });

  it('blocks jumping directly from available to confirmed', () => {
    const res = validateStatusTransition('available', 'confirmed', 'recycler');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Illegal state transition');
  });
});
