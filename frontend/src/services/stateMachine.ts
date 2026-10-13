import { BatchStatus, UserRole } from '../types/database.types';

export interface TransitionRule {
  from: BatchStatus;
  to: BatchStatus;
  allowedRoles: UserRole[];
  description: string;
}

export const VALID_TRANSITIONS: TransitionRule[] = [
  {
    from: 'draft',
    to: 'available',
    allowedRoles: ['generator', 'admin'],
    description: 'Publish draft batch to market',
  },
  {
    from: 'available',
    to: 'collection_requested',
    allowedRoles: ['generator', 'collector', 'admin'],
    description: 'Initiate collection dispatch request',
  },
  {
    from: 'available',
    to: 'cancelled',
    allowedRoles: ['generator', 'admin'],
    description: 'Cancel batch listing prior to pickup',
  },
  {
    from: 'collection_requested',
    to: 'assigned',
    allowedRoles: ['collector', 'admin'],
    description: 'Collector accepts pickup assignment',
  },
  {
    from: 'collection_requested',
    to: 'available',
    allowedRoles: ['generator', 'collector', 'admin'],
    description: 'Revert request back to available pool',
  },
  {
    from: 'assigned',
    to: 'picked_up',
    allowedRoles: ['collector', 'admin'],
    description: 'Collector records physical pickup with verification photo',
  },
  {
    from: 'assigned',
    to: 'available',
    allowedRoles: ['collector', 'admin'],
    description: 'Collector unassigns; return batch to pool',
  },
  {
    from: 'picked_up',
    to: 'delivered',
    allowedRoles: ['collector', 'admin'],
    description: 'Collector delivers batch to recycler gate',
  },
  {
    from: 'delivered',
    to: 'confirmed',
    allowedRoles: ['recycler', 'admin'],
    description: 'Recycler inspects, weighs, and signs off handover receipt',
  },
  {
    from: 'delivered',
    to: 'available',
    allowedRoles: ['recycler', 'admin'],
    description: 'Recycler rejects batch due to severe contamination/spec mismatch',
  },
];

export interface ValidationTransitionResult {
  allowed: boolean;
  reason?: string;
}

export function validateStatusTransition(
  currentStatus: BatchStatus,
  targetStatus: BatchStatus,
  actorRole: UserRole
): ValidationTransitionResult {
  // Idempotency: transitioning to same status is a no-op
  if (currentStatus === targetStatus) {
    return {
      allowed: false,
      reason: `Batch is already in status '${currentStatus}'. No duplicate transition applied.`,
    };
  }

  // Admins can manage any non-duplicate transition
  if (actorRole === 'admin') {
    const validTarget = VALID_TRANSITIONS.some((rule) => rule.to === targetStatus);
    if (validTarget) {
      return { allowed: true };
    }
  }

  const matchingRule = VALID_TRANSITIONS.find(
    (rule) => rule.from === currentStatus && rule.to === targetStatus
  );

  if (!matchingRule) {
    return {
      allowed: false,
      reason: `Illegal state transition from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  if (!matchingRule.allowedRoles.includes(actorRole)) {
    return {
      allowed: false,
      reason: `Role '${actorRole}' is not authorized to transition from '${currentStatus}' to '${targetStatus}'. Requires: ${matchingRule.allowedRoles.join(' or ')}.`,
    };
  }

  return { allowed: true };
}
