/**
 * RealCoach.ai - Daily Action Engine
 *
 * Generates and manages daily actions based on:
 * - User's Goals & Actions
 * - Business Plan constraints
 * - Pipeline data
 * - Coaching engine priority context
 *
 * Rules:
 * - Maximum 1 Primary Action (revenue-progressing)
 * - Maximum 2 Supporting Actions (reduce friction)
 * - No backlogs or carryover
 * - Delivered in DIRECT mode (no questions)
 */

import { GoalsAndActions, BusinessPlan, PriorityContext } from '@/types/coaching';

// ============================================================================
// TYPES
// ============================================================================

export interface DailyAction {
  id: string;
  type: 'primary' | 'supporting';
  category: 'contact' | 'non_contact' | 'admin' | 'planning';
  title: string;
  description: string;
  minimumViable: string;
  stretchGoal?: string;
  milestoneConnection: string;
  minutesEstimate: number;
  steps?: string[];
  contactId?: string;
  contactName?: string;
}

export interface DailyActionPlan {
  date: string;
  primary: DailyAction | null;
  supporting: DailyAction[];
  reducedLoad: boolean; // True if missed-day or blocker situation
}

export interface CheckInResponse {
  completedActionIds: string[];
  partialProgress?: string;
  momentumSignal?: 'positive' | 'neutral' | 'negative';
  frictionIndicators: string[];
}

export interface PipelineOpportunity {
  id: string;
  contactName: string;
  stage: string;
  priority: 'high' | 'medium' | 'low';
  lastContact?: Date;
  nextAction?: string;
  estimatedValue?: number;
}

// ============================================================================
// READINESS GATE
// ============================================================================

/**
 * Determine if user needs coaching before receiving actions
 */
export function checkReadinessGate(
  checkIn: CheckInResponse | null,
  missedDayDetected: boolean
): {
  needsCoaching: boolean;
  reason?: string;
} {
  // If missed day was detected, coaching is optional (user chooses)
  if (missedDayDetected) {
    return {
      needsCoaching: false, // Let user choose via missed-day protocol
      reason: 'missed_day',
    };
  }

  // If no check-in, proceed to actions
  if (!checkIn) {
    return { needsCoaching: false };
  }

  // Check for friction indicators
  if (checkIn.frictionIndicators.length > 2) {
    return {
      needsCoaching: true,
      reason: 'multiple_friction_indicators',
    };
  }

  // Check for negative momentum
  if (checkIn.momentumSignal === 'negative') {
    return {
      needsCoaching: true,
      reason: 'negative_momentum',
    };
  }

  return { needsCoaching: false };
}

// ============================================================================
// STRATEGY INTEGRITY CHECK
// ============================================================================

/**
 * Validate that proposed actions align with business plan and G&A
 */
export function checkStrategyIntegrity(
  action: DailyAction,
  goalsAndActions: GoalsAndActions | null,
  businessPlan: BusinessPlan | null
): {
  valid: boolean;
  violation?: string;
} {
  if (!goalsAndActions) {
    return { valid: true }; // Can't check without G&A
  }

  // Check against friction boundaries
  const frictionBoundaries = goalsAndActions.frictionBoundaries || [];
  for (const boundary of frictionBoundaries) {
    const boundaryLower = boundary.toLowerCase();
    const titleLower = action.title.toLowerCase();
    const descLower = action.description.toLowerCase();

    // Common friction boundary mappings
    if (boundaryLower.includes('cold call') &&
        (titleLower.includes('cold call') || descLower.includes('cold call'))) {
      return {
        valid: false,
        violation: `Action involves cold calling, which user marked as friction boundary`,
      };
    }
    if (boundaryLower.includes('door knock') &&
        (titleLower.includes('door') || descLower.includes('door knock'))) {
      return {
        valid: false,
        violation: `Action involves door knocking, which user marked as friction boundary`,
      };
    }
  }

  return { valid: true };
}

// ============================================================================
// ACTION SELECTION
// ============================================================================

/**
 * Select primary action based on goals and pipeline
 */
export function selectPrimaryAction(
  goalsAndActions: GoalsAndActions | null,
  pipeline: PipelineOpportunity[],
  priorityContext: PriorityContext
): DailyAction | null {
  // If there's a blocker priority context, use that
  if (priorityContext.type === 'BLOCKER' && priorityContext.mayOverridePrimary) {
    return {
      id: `blocker-${Date.now()}`,
      type: 'primary',
      category: 'non_contact',
      title: priorityContext.description,
      description: 'Resolve this blocker to restore execution capacity',
      minimumViable: 'Take the first step toward resolution',
      milestoneConnection: 'Removing blockers keeps you on track for your monthly milestone',
      minutesEstimate: 30,
    };
  }

  // Sort pipeline by priority and last contact
  const sortedPipeline = [...pipeline].sort((a, b) => {
    // Priority first
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by last contact (oldest first)
    if (a.lastContact && b.lastContact) {
      return a.lastContact.getTime() - b.lastContact.getTime();
    }
    return 0;
  });

  // Get the top opportunity
  const topOpportunity = sortedPipeline[0];

  if (topOpportunity) {
    return {
      id: `primary-${topOpportunity.id}`,
      type: 'primary',
      category: 'contact',
      title: `Follow up with ${topOpportunity.contactName}`,
      description: topOpportunity.nextAction || `Move ${topOpportunity.contactName} forward in your pipeline`,
      minimumViable: `Send one message or make one call to ${topOpportunity.contactName}`,
      milestoneConnection: goalsAndActions?.monthlyMilestone
        ? `Moves you toward: ${goalsAndActions.monthlyMilestone}`
        : 'Advances your highest-priority opportunity',
      minutesEstimate: 15,
      contactId: topOpportunity.id,
      contactName: topOpportunity.contactName,
    };
  }

  // Fallback: Generate a prospecting action
  return {
    id: `primary-prospect-${Date.now()}`,
    type: 'primary',
    category: 'contact',
    title: 'Reach out to one person in your sphere',
    description: 'A brief check-in with someone in your network',
    minimumViable: 'Send one genuine check-in message',
    milestoneConnection: goalsAndActions?.monthlyMilestone
      ? `Plants seeds toward: ${goalsAndActions.monthlyMilestone}`
      : 'Keeps your network warm',
    minutesEstimate: 10,
  };
}

/**
 * Select supporting actions that reduce friction for primary
 */
export function selectSupportingActions(
  primaryAction: DailyAction | null,
  goalsAndActions: GoalsAndActions | null,
  reducedLoad: boolean
): DailyAction[] {
  if (!primaryAction) return [];

  // Reduced load = max 1 supporting action
  const maxSupporting = reducedLoad ? 1 : 2;
  const supporting: DailyAction[] = [];

  // Add preparation action if primary is a contact action
  if (primaryAction.category === 'contact' && supporting.length < maxSupporting) {
    supporting.push({
      id: `supporting-prep-${Date.now()}`,
      type: 'supporting',
      category: 'planning',
      title: 'Prepare for your main call/meeting',
      description: 'Review notes and prepare talking points',
      minimumViable: 'Spend 5 minutes reviewing relevant info',
      milestoneConnection: 'Better preparation leads to better conversations',
      minutesEstimate: 5,
    });
  }

  // Add documentation action if we have room
  if (supporting.length < maxSupporting) {
    supporting.push({
      id: `supporting-doc-${Date.now()}`,
      type: 'supporting',
      category: 'admin',
      title: 'Update your CRM after calls',
      description: 'Document outcomes from today\'s conversations',
      minimumViable: 'Add one note about your primary contact',
      milestoneConnection: 'Good records improve future follow-ups',
      minutesEstimate: 5,
    });
  }

  return supporting;
}

// ============================================================================
// DAILY PLAN GENERATION
// ============================================================================

/**
 * Generate the complete daily action plan
 */
export function generateDailyPlan(
  goalsAndActions: GoalsAndActions | null,
  businessPlan: BusinessPlan | null,
  pipeline: PipelineOpportunity[],
  priorityContext: PriorityContext,
  reducedLoad: boolean = false
): DailyActionPlan {
  const today = new Date().toISOString().split('T')[0];

  // Select primary action
  let primary = selectPrimaryAction(goalsAndActions, pipeline, priorityContext);

  // Validate against strategy
  if (primary) {
    const integrity = checkStrategyIntegrity(primary, goalsAndActions, businessPlan);
    if (!integrity.valid) {
      console.warn('Strategy violation:', integrity.violation);
      // In a real implementation, this would trigger coaching
      primary = null;
    }
  }

  // Select supporting actions
  const supporting = selectSupportingActions(primary, goalsAndActions, reducedLoad);

  return {
    date: today,
    primary,
    supporting,
    reducedLoad,
  };
}

// ============================================================================
// DIRECT MODE FORMATTING
// ============================================================================

/**
 * Format the daily plan for DIRECT mode delivery
 * No questions, no coaching language, clear actions only
 */
export function formatForDirectMode(plan: DailyActionPlan): string {
  const lines: string[] = [];

  if (plan.primary) {
    lines.push(`Today: ${plan.primary.title}`);
    if (plan.primary.description) {
      lines.push(plan.primary.description);
    }
    lines.push('');
    lines.push(plan.primary.milestoneConnection);
  }

  if (plan.supporting.length > 0) {
    lines.push('');
    lines.push('If time allows:');
    for (const action of plan.supporting) {
      lines.push(`• ${action.title}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format actions as structured data for UI rendering
 */
export function formatForUI(plan: DailyActionPlan): {
  primary: DailyAction | null;
  supporting: DailyAction[];
  milestoneContext: string;
} {
  return {
    primary: plan.primary,
    supporting: plan.supporting,
    milestoneContext: plan.primary?.milestoneConnection || '',
  };
}

// ============================================================================
// CHECK-IN PROCESSING
// ============================================================================

/**
 * Parse user's check-in response
 */
export function parseCheckIn(userMessage: string): CheckInResponse {
  const lower = userMessage.toLowerCase();

  // Detect completion signals
  const completedPatterns = [
    /did it|done|completed|finished|made the call|sent/i,
  ];
  const hasCompleted = completedPatterns.some(p => p.test(lower));

  // Detect friction signals
  const frictionPatterns = [
    { pattern: /kept putting off/i, indicator: 'procrastination' },
    { pattern: /got distracted/i, indicator: 'distraction' },
    { pattern: /felt heavy|felt hard/i, indicator: 'emotional_resistance' },
    { pattern: /didn't have time/i, indicator: 'time_pressure' },
    { pattern: /wasn't sure/i, indicator: 'uncertainty' },
  ];

  const frictionIndicators = frictionPatterns
    .filter(({ pattern }) => pattern.test(lower))
    .map(({ indicator }) => indicator);

  // Detect momentum
  let momentumSignal: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (/great|good|productive|momentum|on a roll/i.test(lower)) {
    momentumSignal = 'positive';
  } else if (/struggled|hard|tough|off day|nothing/i.test(lower)) {
    momentumSignal = 'negative';
  }

  return {
    completedActionIds: hasCompleted ? ['assumed-completion'] : [],
    momentumSignal,
    frictionIndicators,
  };
}
