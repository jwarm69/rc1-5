/**
 * RealCoach.ai - Signal Handler
 *
 * Bridges screenshot signals to the Daily Action Engine.
 * Converts confirmed interpretation signals into actionable data
 * without directly modifying the database.
 *
 * CRITICAL: Signals are DRAFTS - they inform action generation
 * but do NOT persist data directly.
 */

import { ScreenshotSignal, SignalType } from '@/types/screenshot';
import { DailyAction, PipelineOpportunity } from '@/lib/daily-action-engine';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Processed signal ready for the Daily Action Engine
 */
export interface ProcessedSignal {
  /** Original signal ID */
  id: string;
  /** Type of signal */
  type: SignalType;
  /** Whether this signal should influence today's primary action */
  influencesPrimary: boolean;
  /** Whether this signal suggests a new supporting action */
  suggestsSupporting: boolean;
  /** If suggesting a new action, the action details */
  suggestedAction?: Partial<DailyAction>;
  /** If related to pipeline, the opportunity details */
  pipelineContext?: Partial<PipelineOpportunity>;
  /** If a contact note, the note content */
  noteContent?: string;
  /** Coaching insight (for coaching engine) */
  coachingInsight?: string;
}

/**
 * Result of processing all signals from a screenshot interpretation
 */
export interface SignalProcessingResult {
  /** Processed signals */
  signals: ProcessedSignal[];
  /** Should today's actions be regenerated? */
  requiresActionRegeneration: boolean;
  /** Contact IDs that should be prioritized */
  prioritizedContacts: string[];
  /** Notes to add to contacts (contactId -> note) */
  contactNotes: Map<string, string>;
  /** Scheduling insights */
  schedulingInsights: string[];
  /** Coaching opportunities to surface */
  coachingOpportunities: string[];
}

// ============================================================================
// SIGNAL PROCESSING
// ============================================================================

/**
 * Process a single screenshot signal into an actionable format
 */
export function processSignal(signal: ScreenshotSignal): ProcessedSignal {
  const base: ProcessedSignal = {
    id: signal.id,
    type: signal.type,
    influencesPrimary: false,
    suggestsSupporting: false,
  };

  switch (signal.type) {
    case 'follow_up':
      return processFollowUpSignal(signal, base);
    case 'contact_note':
      return processContactNoteSignal(signal, base);
    case 'scheduling':
      return processSchedulingSignal(signal, base);
    case 'pipeline':
      return processPipelineSignal(signal, base);
    case 'coaching':
      return processCoachingSignal(signal, base);
    default:
      return base;
  }
}

/**
 * Process a follow_up signal - these often influence primary actions
 */
function processFollowUpSignal(
  signal: ScreenshotSignal,
  base: ProcessedSignal
): ProcessedSignal {
  const contactName = signal.metadata.participants?.[0];

  return {
    ...base,
    influencesPrimary: true,
    suggestsSupporting: false,
    suggestedAction: {
      type: 'primary',
      category: 'contact',
      title: contactName
        ? `Follow up with ${contactName}`
        : 'Follow up on screenshot conversation',
      description: signal.content,
      minimumViable: contactName
        ? `Send a message to ${contactName}`
        : 'Send one follow-up message',
      milestoneConnection: 'Following up keeps opportunities moving forward',
      minutesEstimate: 10,
      contactId: signal.relatedContactId,
      contactName,
    },
    pipelineContext: signal.relatedContactId
      ? {
          id: signal.relatedContactId,
          contactName: contactName || 'Unknown',
          priority: signal.confidence > 0.8 ? 'high' : 'medium',
          nextAction: signal.content,
        }
      : undefined,
  };
}

/**
 * Process a contact_note signal - adds context to a contact
 */
function processContactNoteSignal(
  signal: ScreenshotSignal,
  base: ProcessedSignal
): ProcessedSignal {
  return {
    ...base,
    influencesPrimary: false,
    suggestsSupporting: true,
    noteContent: signal.content,
    suggestedAction: {
      type: 'supporting',
      category: 'admin',
      title: 'Update contact notes',
      description: `Add note: "${signal.content.slice(0, 100)}${signal.content.length > 100 ? '...' : ''}"`,
      minimumViable: 'Add the note to your CRM',
      milestoneConnection: 'Good records improve future interactions',
      minutesEstimate: 2,
      contactId: signal.relatedContactId,
      contactName: signal.metadata.participants?.[0],
    },
  };
}

/**
 * Process a scheduling signal - impacts time/calendar awareness
 */
function processSchedulingSignal(
  signal: ScreenshotSignal,
  base: ProcessedSignal
): ProcessedSignal {
  const dates = signal.metadata.dates || [];

  return {
    ...base,
    influencesPrimary: dates.length > 0 && signal.confidence > 0.7,
    suggestsSupporting: true,
    suggestedAction: {
      type: 'supporting',
      category: 'planning',
      title: 'Review schedule',
      description: signal.content,
      minimumViable: 'Check your calendar for conflicts',
      milestoneConnection: 'Clear scheduling reduces friction',
      minutesEstimate: 5,
    },
  };
}

/**
 * Process a pipeline signal - updates pipeline awareness
 */
function processPipelineSignal(
  signal: ScreenshotSignal,
  base: ProcessedSignal
): ProcessedSignal {
  const participants = signal.metadata.participants || [];

  return {
    ...base,
    influencesPrimary: participants.length > 0,
    suggestsSupporting: false,
    pipelineContext: {
      contactName: participants[0] || 'Multiple contacts',
      priority: signal.confidence > 0.8 ? 'high' : 'medium',
      stage: 'active',
    },
  };
}

/**
 * Process a coaching signal - surfaces coaching opportunities
 */
function processCoachingSignal(
  signal: ScreenshotSignal,
  base: ProcessedSignal
): ProcessedSignal {
  return {
    ...base,
    influencesPrimary: false,
    suggestsSupporting: false,
    coachingInsight: signal.content,
  };
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Process all signals from a confirmed screenshot interpretation
 */
export function processSignals(signals: ScreenshotSignal[]): SignalProcessingResult {
  const processedSignals = signals.map(processSignal);

  // Determine if we need to regenerate actions
  const requiresActionRegeneration = processedSignals.some(s => s.influencesPrimary);

  // Collect prioritized contacts
  const prioritizedContacts = processedSignals
    .filter(s => s.pipelineContext?.id)
    .map(s => s.pipelineContext!.id!)
    .filter((id, index, self) => self.indexOf(id) === index);

  // Collect contact notes
  const contactNotes = new Map<string, string>();
  for (const signal of processedSignals) {
    if (signal.noteContent && signal.suggestedAction?.contactId) {
      const existing = contactNotes.get(signal.suggestedAction.contactId) || '';
      contactNotes.set(
        signal.suggestedAction.contactId,
        existing ? `${existing}\n${signal.noteContent}` : signal.noteContent
      );
    }
  }

  // Collect scheduling insights
  const schedulingInsights = processedSignals
    .filter(s => s.type === 'scheduling')
    .map(s => s.suggestedAction?.description || '')
    .filter(Boolean);

  // Collect coaching opportunities
  const coachingOpportunities = processedSignals
    .filter(s => s.coachingInsight)
    .map(s => s.coachingInsight!)
    .filter(Boolean);

  return {
    signals: processedSignals,
    requiresActionRegeneration,
    prioritizedContacts,
    contactNotes,
    schedulingInsights,
    coachingOpportunities,
  };
}

// ============================================================================
// ACTION INTEGRATION
// ============================================================================

/**
 * Merge signal-suggested actions into daily action selection.
 * This influences action generation without overriding the engine's logic.
 */
export function getSignalInfluencedPrimaryAction(
  result: SignalProcessingResult
): Partial<DailyAction> | null {
  // Find the highest-confidence follow-up signal with an action suggestion
  const followUpSignals = result.signals
    .filter(s => s.type === 'follow_up' && s.suggestedAction && s.influencesPrimary)
    .sort((a, b) => {
      // Sort by whether they have a contact ID (more specific = better)
      if (a.suggestedAction?.contactId && !b.suggestedAction?.contactId) return -1;
      if (!a.suggestedAction?.contactId && b.suggestedAction?.contactId) return 1;
      return 0;
    });

  return followUpSignals[0]?.suggestedAction || null;
}

/**
 * Get supporting actions suggested by signals
 */
export function getSignalSuggestedSupportingActions(
  result: SignalProcessingResult,
  maxActions: number = 2
): Partial<DailyAction>[] {
  const supportingSignals = result.signals
    .filter(s => s.suggestsSupporting && s.suggestedAction)
    .map(s => s.suggestedAction!)
    .slice(0, maxActions);

  return supportingSignals;
}

// ============================================================================
// HOOK FOR DAILY ACTION ENGINE
// ============================================================================

/**
 * Create a priority context boost from screenshot signals.
 * This can be used to influence the Daily Action Engine's decisions.
 */
export function createPriorityBoost(
  result: SignalProcessingResult
): {
  boostContacts: string[];
  suggestedPrimary: Partial<DailyAction> | null;
  additionalContext: string;
} {
  const suggestedPrimary = getSignalInfluencedPrimaryAction(result);

  const additionalContext = [
    ...result.schedulingInsights,
    ...result.coachingOpportunities,
  ].join(' ');

  return {
    boostContacts: result.prioritizedContacts,
    suggestedPrimary,
    additionalContext,
  };
}

// ============================================================================
// EXPORT FOR USE IN COACHING ENGINE
// ============================================================================

/**
 * Format signal processing result for coaching context
 */
export function formatForCoachingEngine(
  result: SignalProcessingResult
): {
  hasActionableSignals: boolean;
  primaryInfluence: string | null;
  coachingNotes: string[];
} {
  const primarySignal = result.signals.find(s => s.influencesPrimary);

  return {
    hasActionableSignals: result.signals.length > 0,
    primaryInfluence: primarySignal?.suggestedAction?.title || null,
    coachingNotes: result.coachingOpportunities,
  };
}
