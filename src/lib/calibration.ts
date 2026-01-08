/**
 * RealCoach.ai - Calibration State Machine
 *
 * Manages the user calibration flow from UNINITIALIZED to ACTIONS_ACTIVE.
 *
 * Key Rules:
 * - No daily actions before G&A confirmation (hard gate)
 * - One question at a time
 * - Defaults over friction
 * - Draft first, confirm second
 * - Behavior > theory over time
 */

import {
  UserState,
  CalibrationState,
  CalibrationTone,
  GoalsAndActions,
  BusinessPlan,
  GA_CALIBRATION_QUESTIONS,
  BUSINESS_PLAN_QUESTIONS,
  INITIAL_CALIBRATION_STATE,
} from '@/types/coaching';

// ============================================================================
// STATE TRANSITIONS
// ============================================================================

/**
 * Valid state transitions for the calibration flow
 */
export const VALID_STATE_TRANSITIONS: Record<UserState, UserState[]> = {
  UNINITIALIZED: ['CALIBRATING'],
  CALIBRATING: ['G&A_DRAFTED'],
  'G&A_DRAFTED': ['G&A_CONFIRMED', 'CALIBRATING'], // Can go back to edit
  'G&A_CONFIRMED': ['ACTIONS_ACTIVE'],
  ACTIONS_ACTIVE: ['RECALIBRATION_REQUIRED'],
  RECALIBRATION_REQUIRED: ['CALIBRATING', 'ACTIONS_ACTIVE'],
};

/**
 * Check if a state transition is valid
 */
export function isValidTransition(from: UserState, to: UserState): boolean {
  return VALID_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Transition to a new state with validation
 */
export function transitionState(
  currentState: CalibrationState,
  newUserState: UserState
): CalibrationState {
  if (!isValidTransition(currentState.userState, newUserState)) {
    console.warn(
      `Invalid state transition: ${currentState.userState} -> ${newUserState}`
    );
    return currentState;
  }

  return {
    ...currentState,
    userState: newUserState,
  };
}

// ============================================================================
// CALIBRATION FLOW
// ============================================================================

/**
 * Start calibration for a new user
 */
export function startCalibration(state: CalibrationState): CalibrationState {
  if (state.userState !== 'UNINITIALIZED') {
    return state;
  }

  return {
    ...state,
    userState: 'CALIBRATING',
    currentQuestionIndex: 0,
    startedAt: new Date(),
  };
}

/**
 * Set the user's preferred tone for coaching
 */
export function setCalibrationTone(
  state: CalibrationState,
  tone: CalibrationTone
): CalibrationState {
  return {
    ...state,
    tone,
  };
}

/**
 * Get the current calibration question
 */
export function getCurrentQuestion(state: CalibrationState): {
  id: string;
  question: string;
  creates: string;
} | null {
  if (state.userState !== 'CALIBRATING') {
    return null;
  }

  const questions = GA_CALIBRATION_QUESTIONS;
  if (state.currentQuestionIndex >= questions.length) {
    return null; // All questions answered
  }

  return questions[state.currentQuestionIndex];
}

/**
 * Record an answer to a calibration question
 */
export function recordAnswer(
  state: CalibrationState,
  questionId: string,
  answer: string | string[]
): CalibrationState {
  return {
    ...state,
    answers: {
      ...state.answers,
      [questionId]: answer,
    },
    currentQuestionIndex: state.currentQuestionIndex + 1,
  };
}

/**
 * Check if all G&A questions have been answered
 */
export function isGACalibrationComplete(state: CalibrationState): boolean {
  return state.currentQuestionIndex >= GA_CALIBRATION_QUESTIONS.length;
}

/**
 * Generate a draft G&A document from calibration answers
 */
export function generateGADraft(state: CalibrationState): GoalsAndActions {
  const answers = state.answers;

  return {
    annualProfessionalGoal: (answers.annual_professional_goal as string) || '',
    annualPersonalGoal: (answers.annual_personal_goal as string) || null,
    currentReality: (answers.current_reality as string) || '',
    monthlyMilestone: (answers.monthly_milestone as string) || '',
    executionStyle: mapExecutionStyle(answers.execution_style as string),
    willingnessFilter: parseListAnswer(answers.willingness_filter),
    frictionBoundaries: parseListAnswer(answers.friction_boundary),
    status: 'DRAFT',
    createdAt: new Date(),
    confirmedAt: null,
  };
}

/**
 * Map execution style answer to enum
 */
function mapExecutionStyle(
  answer: string | undefined
): GoalsAndActions['executionStyle'] {
  if (!answer) return 'FLEXIBLE';

  const lower = answer.toLowerCase();
  if (lower.includes('structured') || lower.includes('planned')) {
    return 'STRUCTURED';
  }
  if (lower.includes('burst') || lower.includes('short')) {
    return 'SHORT_BURSTS';
  }
  if (lower.includes('slow') || lower.includes('consistent')) {
    return 'SLOW_CONSISTENT';
  }
  return 'FLEXIBLE';
}

/**
 * Parse a potentially multi-value answer into a list
 */
function parseListAnswer(answer: string | string[] | null | undefined): string[] {
  if (!answer) return [];
  if (Array.isArray(answer)) return answer;

  // Split by common delimiters
  return answer
    .split(/[,;\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Complete G&A calibration and create draft
 */
export function completeGACalibration(state: CalibrationState): CalibrationState {
  if (!isGACalibrationComplete(state)) {
    return state;
  }

  const gaDraft = generateGADraft(state);

  return {
    ...state,
    userState: 'G&A_DRAFTED',
    goalsAndActions: gaDraft,
  };
}

/**
 * Confirm the G&A document
 */
export function confirmGA(state: CalibrationState): CalibrationState {
  if (state.userState !== 'G&A_DRAFTED' || !state.goalsAndActions) {
    return state;
  }

  return {
    ...state,
    userState: 'G&A_CONFIRMED',
    goalsAndActions: {
      ...state.goalsAndActions,
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    } as GoalsAndActions,
  };
}

/**
 * Activate daily actions (transition to ACTIONS_ACTIVE)
 */
export function activateActions(state: CalibrationState): CalibrationState {
  if (state.userState !== 'G&A_CONFIRMED') {
    return state;
  }

  return {
    ...state,
    userState: 'ACTIONS_ACTIVE',
    completedAt: new Date(),
  };
}

// ============================================================================
// FAST LANE PROTOCOL
// ============================================================================

/**
 * Fast Lane patterns - triggers for impatient users
 */
export const FAST_LANE_TRIGGERS = [
  'just tell me what to do',
  "don't have time for this",
  "i don't have time",
  'skip this',
  'i hate onboarding',
  'skip everything',
  'fast track',
  'hurry up',
];

/**
 * Detect if user wants Fast Lane
 */
export function detectFastLane(userText: string): boolean {
  const lower = userText.toLowerCase();
  return FAST_LANE_TRIGGERS.some(trigger => lower.includes(trigger));
}

/**
 * The 2 Fast Lane questions (minimal calibration)
 */
export const FAST_LANE_QUESTIONS = [
  {
    id: 'fast_primary_goal',
    question:
      "What's your #1 business goal right now? (Annual focus is ideal, but a rough answer is fine.)",
    creates: 'annualProfessionalGoal',
  },
  {
    id: 'fast_willingness',
    question: 'What lead gen are you actually willing to do consistently?',
    creates: 'willingnessFilter',
  },
] as const;

/**
 * Enter Fast Lane mode
 */
export function enterFastLane(state: CalibrationState): CalibrationState {
  return {
    ...state,
    fastLaneTriggered: true,
    currentQuestionIndex: 0,
  };
}

/**
 * Get current Fast Lane question
 */
export function getCurrentFastLaneQuestion(state: CalibrationState): {
  id: string;
  question: string;
  creates: string;
} | null {
  if (!state.fastLaneTriggered) return null;
  if (state.currentQuestionIndex >= FAST_LANE_QUESTIONS.length) return null;

  return FAST_LANE_QUESTIONS[state.currentQuestionIndex];
}

/**
 * Check if Fast Lane is complete
 */
export function isFastLaneComplete(state: CalibrationState): boolean {
  return (
    state.fastLaneTriggered &&
    state.currentQuestionIndex >= FAST_LANE_QUESTIONS.length
  );
}

/**
 * Generate G&A draft from Fast Lane answers (with conservative defaults)
 */
export function generateFastLaneGADraft(state: CalibrationState): GoalsAndActions {
  const answers = state.answers;

  return {
    annualProfessionalGoal: (answers.fast_primary_goal as string) || '',
    annualPersonalGoal: null, // Default: not specified
    currentReality: '', // Will be discovered through behavior
    monthlyMilestone: '', // Will be derived from annual goal
    executionStyle: 'FLEXIBLE', // Default: flexible
    willingnessFilter: parseListAnswer(answers.fast_willingness),
    frictionBoundaries: [], // Will be discovered through behavior
    status: 'DRAFT',
    createdAt: new Date(),
    confirmedAt: null,
  };
}

/**
 * Complete Fast Lane calibration
 */
export function completeFastLaneCalibration(
  state: CalibrationState
): CalibrationState {
  if (!isFastLaneComplete(state)) {
    return state;
  }

  const gaDraft = generateFastLaneGADraft(state);

  return {
    ...state,
    userState: 'G&A_DRAFTED',
    goalsAndActions: gaDraft,
  };
}

// ============================================================================
// BUSINESS PLAN CALIBRATION
// ============================================================================

/**
 * Start Business Plan calibration (after G&A is confirmed)
 */
export function startBusinessPlanCalibration(
  state: CalibrationState
): CalibrationState {
  if (state.userState !== 'G&A_CONFIRMED' && state.userState !== 'ACTIONS_ACTIVE') {
    return state;
  }

  return {
    ...state,
    businessPlan: {
      status: 'DRAFT',
    },
  };
}

/**
 * Generate Business Plan draft from answers
 */
export function generateBusinessPlanDraft(
  state: CalibrationState,
  answers: Record<string, string | number | string[]>
): BusinessPlan {
  return {
    revenueTarget: (answers.revenue_confirmation as number) || 0,
    revenuePerUnit: (answers.revenue_per_unit as number) || 0,
    buyerSellerSplit: parseBuyerSellerSplit(answers.buyer_seller_split as string),
    leadSources: parseListAnswer(answers.lead_sources as string | string[]),
    leadGenStyle: mapLeadGenStyle(answers.lead_gen_style as string),
    detailPreference: (answers.detail_preference as string)?.toLowerCase().includes('detailed')
      ? 'DETAILED'
      : 'ROUGH',
    riskTolerance: (answers.risk_tolerance as string)?.toLowerCase().includes('aggressive')
      ? 'AGGRESSIVE_GROWTH'
      : 'STEADY_PREDICTABLE',
    economicRedLines: parseListAnswer(answers.economic_red_lines as string | string[]),
    status: 'DRAFT',
  };
}

/**
 * Parse buyer/seller split answer
 */
function parseBuyerSellerSplit(
  answer: string | undefined
): BusinessPlan['buyerSellerSplit'] {
  if (!answer) return { buyer: 40, seller: 60 }; // Default

  const lower = answer.toLowerCase();
  if (lower.includes('seller') && !lower.includes('buyer')) {
    return { buyer: 20, seller: 80 };
  }
  if (lower.includes('buyer') && !lower.includes('seller')) {
    return { buyer: 80, seller: 20 };
  }
  return { buyer: 40, seller: 60 }; // Mix
}

/**
 * Map lead gen style answer to enum
 */
function mapLeadGenStyle(answer: string | undefined): BusinessPlan['leadGenStyle'] {
  if (!answer) return 'HYBRID';

  const lower = answer.toLowerCase();
  if (lower.includes('relationship')) return 'RELATIONSHIP_BASED';
  if (lower.includes('prospect')) return 'PROSPECTING_DRIVEN';
  if (lower.includes('marketing')) return 'MARKETING_DRIVEN';
  return 'HYBRID';
}

// ============================================================================
// EDGE CASE HANDLING
// ============================================================================

/**
 * Handle unclear/empty answers with conservative defaults
 */
export function handleUnclearAnswer(
  state: CalibrationState,
  questionId: string
): CalibrationState {
  // Apply conservative default and flag as assumed
  return {
    ...state,
    answers: {
      ...state.answers,
      [questionId]: null, // Will use default
      [`${questionId}_assumed`]: true,
    },
    currentQuestionIndex: state.currentQuestionIndex + 1,
  };
}

/**
 * Check if an answer was assumed (not provided by user)
 */
export function isAnswerAssumed(state: CalibrationState, questionId: string): boolean {
  return state.answers[`${questionId}_assumed`] === true;
}

/**
 * Handle user abandonment - preserve state for resume
 */
export function handleAbandonedCalibration(state: CalibrationState): CalibrationState {
  // State is already persisted, just return as-is
  // The userState remains CALIBRATING
  return state;
}

/**
 * Resume abandoned calibration
 */
export function resumeCalibration(state: CalibrationState): {
  state: CalibrationState;
  resumeOptions: string[];
} {
  if (state.userState !== 'CALIBRATING') {
    return { state, resumeOptions: [] };
  }

  return {
    state,
    resumeOptions: [
      'Continue where you left off',
      'Take the fast lane',
      'Reset calibration',
    ],
  };
}

/**
 * Reset calibration (requires explicit user confirmation)
 */
export function resetCalibration(): CalibrationState {
  return {
    ...INITIAL_CALIBRATION_STATE,
    userState: 'UNINITIALIZED',
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if user can see daily actions
 */
export function canShowDailyActions(state: CalibrationState): boolean {
  return (
    state.userState === 'G&A_CONFIRMED' || state.userState === 'ACTIONS_ACTIVE'
  );
}

/**
 * Check if user is in calibration mode
 */
export function isInCalibrationMode(state: CalibrationState): boolean {
  return (
    state.userState === 'UNINITIALIZED' ||
    state.userState === 'CALIBRATING' ||
    state.userState === 'G&A_DRAFTED'
  );
}

/**
 * Get calibration progress percentage
 */
export function getCalibrationProgress(state: CalibrationState): number {
  if (state.userState === 'UNINITIALIZED') return 0;
  if (state.userState === 'G&A_CONFIRMED' || state.userState === 'ACTIONS_ACTIVE') {
    return 100;
  }

  const totalQuestions = state.fastLaneTriggered
    ? FAST_LANE_QUESTIONS.length
    : GA_CALIBRATION_QUESTIONS.length;

  // Add 1 for tone selection at the start, 1 for confirmation at the end
  const totalSteps = totalQuestions + 2;
  const currentStep = state.currentQuestionIndex + (state.tone ? 1 : 0);

  return Math.round((currentStep / totalSteps) * 100);
}

/**
 * Get a human-readable calibration status
 */
export function getCalibrationStatus(state: CalibrationState): string {
  switch (state.userState) {
    case 'UNINITIALIZED':
      return 'Ready to start';
    case 'CALIBRATING':
      if (state.fastLaneTriggered) {
        return `Fast Lane: Question ${state.currentQuestionIndex + 1} of ${FAST_LANE_QUESTIONS.length}`;
      }
      return `Question ${state.currentQuestionIndex + 1} of ${GA_CALIBRATION_QUESTIONS.length}`;
    case 'G&A_DRAFTED':
      return 'Review your Goals & Actions';
    case 'G&A_CONFIRMED':
      return 'Calibration complete';
    case 'ACTIONS_ACTIVE':
      return 'Daily actions enabled';
    case 'RECALIBRATION_REQUIRED':
      return 'Recalibration recommended';
    default:
      return 'Unknown';
  }
}
