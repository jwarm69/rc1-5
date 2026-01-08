/**
 * RealCoach.ai - Coaching Engine
 *
 * Core coaching behavior state machine implementing:
 * - Mode transitions (CLARIFY → REFLECT → REFRAME → COMMIT → DIRECT)
 * - Coaching moves (FOCUS, AGENCY, IDENTITY, EASE)
 * - One-question-at-a-time enforcement
 * - Missed-day protocol
 */

import {
  CoachMode,
  CoachingMove,
  CoachPolicyState,
  PriorityContext,
  MoveSignals,
  ALLOWED_MODE_TRANSITIONS,
  MODE_RULES,
  MISSED_DAY_PATTERNS,
  PolicyViolation,
} from '@/types/coaching';

// ============================================================================
// INITIAL STATE
// ============================================================================

export const INITIAL_POLICY_STATE: CoachPolicyState = {
  currentMode: 'CLARIFY',
  currentMove: 'NONE',
  questionsInLastTurn: 0,
  reflectionConfirmed: false,
  missedDayDetected: false,
  missedDayChoice: null,
  commitment: null,
  priorityContext: { type: 'NONE', description: '', mayOverridePrimary: false },
};

// ============================================================================
// MODE TRANSITIONS
// ============================================================================

/**
 * Check if a mode transition is valid
 */
export function canTransitionTo(currentMode: CoachMode, targetMode: CoachMode): boolean {
  const allowedTransitions = ALLOWED_MODE_TRANSITIONS[currentMode];
  return allowedTransitions.includes(targetMode);
}

/**
 * Attempt to transition to a new mode
 * Returns the new state if valid, throws error if invalid
 */
export function transitionMode(
  state: CoachPolicyState,
  targetMode: CoachMode
): CoachPolicyState {
  if (!canTransitionTo(state.currentMode, targetMode)) {
    console.warn(
      `Invalid mode transition: ${state.currentMode} → ${targetMode}. ` +
      `Allowed: ${ALLOWED_MODE_TRANSITIONS[state.currentMode].join(', ')}`
    );
    return state; // Return unchanged state instead of throwing
  }

  return {
    ...state,
    currentMode: targetMode,
    questionsInLastTurn: 0, // Reset on mode change
  };
}

/**
 * Get the recommended next mode based on user input and current state
 */
export function inferNextMode(
  state: CoachPolicyState,
  userMessage: string,
  hasConfirmed: boolean = false
): CoachMode {
  const { currentMode, reflectionConfirmed } = state;

  switch (currentMode) {
    case 'CLARIFY':
      // Move to REFLECT once we have enough information
      if (userMessage.length > 30) {
        return 'REFLECT';
      }
      return 'CLARIFY';

    case 'REFLECT':
      // Move to COMMIT or REFRAME after confirmation
      if (hasConfirmed || reflectionConfirmed) {
        // Check if reframing is needed
        const signals = detectMoveSignals(userMessage);
        if (signals.selfStory || signals.externalizedControl) {
          return 'REFRAME';
        }
        return 'COMMIT';
      }
      return 'REFLECT';

    case 'REFRAME':
      // Always move to COMMIT after reframe
      return 'COMMIT';

    case 'COMMIT':
      // Move to DIRECT after commitment is made
      if (hasCommitmentAgreement(userMessage)) {
        return 'DIRECT';
      }
      return 'COMMIT';

    case 'DIRECT':
      // Stay in DIRECT unless user asks a question or reports issue
      if (userMessage.includes('?') || detectMissedDay(userMessage)) {
        return 'CLARIFY';
      }
      return 'DIRECT';

    default:
      return 'CLARIFY';
  }
}

// ============================================================================
// COACHING MOVES
// ============================================================================

/**
 * Detect signals in user message that indicate which coaching move to use
 */
export function detectMoveSignals(userMessage: string): MoveSignals {
  const lower = userMessage.toLowerCase();

  return {
    overwhelm: /too many|don't know where to start|everything feels|so much to do|can't focus|all over the place/i.test(lower),
    externalizedControl: /can't control|nothing i can do|out of my hands|they won't|people don't respond|market is/i.test(lower),
    selfStory: /i'm not|just who i am|always been|not disciplined|not good at|i'm bad at|that's just me/i.test(lower),
    resistance: /know what to do|can't get myself|keep putting off|feels heavy|just can't start|know i should/i.test(lower),
  };
}

/**
 * Choose the appropriate coaching move based on detected signals
 */
export function chooseCoachingMove(
  signals: MoveSignals,
  clarityLevel: 'high' | 'medium' | 'low' = 'high'
): CoachingMove {
  // If clarity is low, stay in CLARIFY mode without a specific move
  if (clarityLevel === 'low') {
    return 'NONE';
  }

  // Priority order for moves
  if (signals.externalizedControl) return 'AGENCY';
  if (signals.selfStory) return 'IDENTITY';
  if (signals.overwhelm) return 'FOCUS';
  if (signals.resistance) return 'EASE';

  return 'NONE';
}

/**
 * Update the coaching move in state
 */
export function setCoachingMove(
  state: CoachPolicyState,
  move: CoachingMove
): CoachPolicyState {
  return {
    ...state,
    currentMove: move,
  };
}

// ============================================================================
// MISSED-DAY PROTOCOL
// ============================================================================

/**
 * Detect if user is reporting a missed day
 */
export function detectMissedDay(userMessage: string): boolean {
  const lower = userMessage.toLowerCase();
  return MISSED_DAY_PATTERNS.some(pattern => lower.includes(pattern.toLowerCase()));
}

/**
 * Handle missed day detection
 */
export function handleMissedDayDetection(
  state: CoachPolicyState,
  userMessage: string
): CoachPolicyState {
  if (detectMissedDay(userMessage)) {
    return {
      ...state,
      missedDayDetected: true,
      missedDayChoice: null, // Wait for user choice
    };
  }
  return state;
}

/**
 * Record user's choice for missed day handling
 */
export function setMissedDayChoice(
  state: CoachPolicyState,
  choice: 'UNPACK' | 'SKIP'
): CoachPolicyState {
  return {
    ...state,
    missedDayChoice: choice,
    // If SKIP, go straight to DIRECT mode
    currentMode: choice === 'SKIP' ? 'DIRECT' : state.currentMode,
  };
}

/**
 * Get the missed day prompt to show user
 */
export function getMissedDayPrompt(): string {
  return "Yesterday didn't go as planned. Would you like to spend 2 minutes unpacking what got in the way, or skip and move forward?";
}

// ============================================================================
// COMMITMENT HANDLING
// ============================================================================

/**
 * Check if user message indicates agreement to a commitment
 */
export function hasCommitmentAgreement(userMessage: string): boolean {
  const lower = userMessage.toLowerCase();
  const agreementPatterns = [
    /^yes/i,
    /okay|ok/i,
    /sounds good/i,
    /i'll do/i,
    /i will/i,
    /let's do/i,
    /deal/i,
    /agreed/i,
    /done/i,
  ];
  return agreementPatterns.some(p => p.test(lower));
}

/**
 * Record a commitment
 */
export function setCommitment(
  state: CoachPolicyState,
  commitment: string
): CoachPolicyState {
  return {
    ...state,
    commitment,
  };
}

/**
 * Set priority context (from COMMIT mode)
 */
export function setPriorityContext(
  state: CoachPolicyState,
  context: PriorityContext
): CoachPolicyState {
  return {
    ...state,
    priorityContext: context,
  };
}

// ============================================================================
// POLICY ENFORCEMENT
// ============================================================================

/**
 * Record that a response was generated with N questions
 */
export function recordQuestionsAsked(
  state: CoachPolicyState,
  count: number
): CoachPolicyState {
  return {
    ...state,
    questionsInLastTurn: count,
  };
}

/**
 * Check for policy violations in a response
 */
export function checkPolicyViolations(
  response: string,
  state: CoachPolicyState
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];
  const questionCount = (response.match(/\?/g) || []).length;
  const rules = MODE_RULES[state.currentMode];

  // Check question count
  if (questionCount > 1) {
    violations.push('MULTI_QUESTION');
  }

  // Check mode-specific rules
  if (!rules.allowQuestions && questionCount > 0) {
    violations.push('QUESTION_IN_WRONG_MODE');
  }

  // Check for urgency language
  if (/urgent|asap|don't miss|limited time/i.test(response)) {
    violations.push('URGENCY_LANGUAGE');
  }

  // Check for banned words
  const bannedWords = ['crush', 'hustle', 'grind', 'empower', 'synergy'];
  for (const word of bannedWords) {
    if (response.toLowerCase().includes(word)) {
      violations.push('BANNED_WORD');
      break;
    }
  }

  return violations;
}

/**
 * Mark reflection as confirmed
 */
export function confirmReflection(state: CoachPolicyState): CoachPolicyState {
  return {
    ...state,
    reflectionConfirmed: true,
  };
}

// ============================================================================
// STATE MANAGEMENT HELPERS
// ============================================================================

/**
 * Reset policy state for a new conversation
 */
export function resetPolicyState(): CoachPolicyState {
  return { ...INITIAL_POLICY_STATE };
}

/**
 * Process user message and return updated state
 */
export function processUserMessage(
  state: CoachPolicyState,
  userMessage: string
): CoachPolicyState {
  let newState = { ...state };

  // Check for missed day
  if (detectMissedDay(userMessage)) {
    newState = handleMissedDayDetection(newState, userMessage);
    return newState;
  }

  // Detect coaching move signals
  const signals = detectMoveSignals(userMessage);
  const move = chooseCoachingMove(signals);
  if (move !== 'NONE') {
    newState = setCoachingMove(newState, move);
  }

  // Check for confirmation (for REFLECT mode)
  if (state.currentMode === 'REFLECT') {
    const confirmPatterns = /yes|that's right|correct|exactly|yeah/i;
    if (confirmPatterns.test(userMessage)) {
      newState = confirmReflection(newState);
    }
  }

  // Check for commitment agreement (for COMMIT mode)
  if (state.currentMode === 'COMMIT' && hasCommitmentAgreement(userMessage)) {
    newState = transitionMode(newState, 'DIRECT');
  }

  // Infer next mode
  const nextMode = inferNextMode(newState, userMessage, newState.reflectionConfirmed);
  if (nextMode !== newState.currentMode && canTransitionTo(newState.currentMode, nextMode)) {
    newState = transitionMode(newState, nextMode);
  }

  return newState;
}

// ============================================================================
// RESPONSE GENERATION HELPERS
// ============================================================================

/**
 * Get mode-appropriate response template
 */
export function getModeResponseGuidance(mode: CoachMode): string {
  const rules = MODE_RULES[mode];

  switch (mode) {
    case 'CLARIFY':
      return 'Ask ONE clarifying question. Do not give advice yet.';
    case 'REFLECT':
      return 'Mirror back what you heard (facts + emotion). Ask ONE confirmation question.';
    case 'REFRAME':
      return 'Offer a new perspective. NO questions. Reframe behavior, not identity.';
    case 'COMMIT':
      return 'Propose ONE specific commitment. Ask for explicit agreement.';
    case 'DIRECT':
      return 'State actions clearly. NO questions. NO coaching language.';
    default:
      return '';
  }
}

/**
 * Get move-appropriate response addition
 */
export function getMoveResponseGuidance(move: CoachingMove): string {
  switch (move) {
    case 'FOCUS':
      return 'Help collapse to ONE most important thing.';
    case 'AGENCY':
      return 'Restore sense of choice. Shift from "can\'t" to "choosing not to".';
    case 'IDENTITY':
      return 'Separate behavior from identity. Current actions are votes for future self.';
    case 'EASE':
      return 'Shrink to smallest viable step. Make starting easier than not starting.';
    default:
      return '';
  }
}
