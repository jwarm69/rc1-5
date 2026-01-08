/**
 * RealCoach.ai - Coaching Engine Context
 *
 * Provides global coaching state management for the coaching behavior engine.
 * Handles mode transitions, coaching moves, and policy enforcement.
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import {
  CoachMode,
  CoachingMove,
  CoachPolicyState,
  PriorityContext,
  PolicyViolation,
} from '@/types/coaching';
import {
  INITIAL_POLICY_STATE,
  canTransitionTo,
  transitionMode,
  inferNextMode,
  detectMoveSignals,
  chooseCoachingMove,
  setCoachingMove,
  detectMissedDay,
  handleMissedDayDetection,
  setMissedDayChoice,
  getMissedDayPrompt,
  hasCommitmentAgreement,
  setCommitment,
  setPriorityContext,
  recordQuestionsAsked,
  checkPolicyViolations,
  confirmReflection,
  resetPolicyState,
  processUserMessage,
  getModeResponseGuidance,
  getMoveResponseGuidance,
} from '@/lib/coaching-engine';

// ============================================================================
// TYPES
// ============================================================================

interface CoachingEngineContextValue {
  // State
  state: CoachPolicyState;

  // Computed values
  canAskQuestions: boolean;
  isInDirectMode: boolean;
  hasMissedDay: boolean;
  needsMissedDayChoice: boolean;

  // Mode operations
  getCurrentMode: () => CoachMode;
  transitionTo: (mode: CoachMode) => boolean;
  canTransitionTo: (mode: CoachMode) => boolean;

  // Move operations
  getCurrentMove: () => CoachingMove;
  detectAndSetMove: (userMessage: string) => CoachingMove;

  // Message processing
  processMessage: (userMessage: string) => CoachPolicyState;
  recordResponse: (response: string) => PolicyViolation[];

  // Missed-day handling
  handleMissedDayChoice: (choice: 'UNPACK' | 'SKIP') => void;
  getMissedDayPrompt: () => string;

  // Commitment handling
  recordCommitment: (commitment: string) => void;
  recordPriorityContext: (context: PriorityContext) => void;

  // Utilities
  getResponseGuidance: () => { mode: string; move: string };
  reset: () => void;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

type CoachingEngineAction =
  | { type: 'TRANSITION_MODE'; payload: CoachMode }
  | { type: 'SET_MOVE'; payload: CoachingMove }
  | { type: 'PROCESS_MESSAGE'; payload: string }
  | { type: 'RECORD_QUESTIONS'; payload: number }
  | { type: 'SET_MISSED_DAY_CHOICE'; payload: 'UNPACK' | 'SKIP' }
  | { type: 'SET_COMMITMENT'; payload: string }
  | { type: 'SET_PRIORITY_CONTEXT'; payload: PriorityContext }
  | { type: 'CONFIRM_REFLECTION' }
  | { type: 'RESET' };

// ============================================================================
// REDUCER
// ============================================================================

function coachingEngineReducer(
  state: CoachPolicyState,
  action: CoachingEngineAction
): CoachPolicyState {
  switch (action.type) {
    case 'TRANSITION_MODE':
      return transitionMode(state, action.payload);

    case 'SET_MOVE':
      return setCoachingMove(state, action.payload);

    case 'PROCESS_MESSAGE':
      return processUserMessage(state, action.payload);

    case 'RECORD_QUESTIONS':
      return recordQuestionsAsked(state, action.payload);

    case 'SET_MISSED_DAY_CHOICE':
      return setMissedDayChoice(state, action.payload);

    case 'SET_COMMITMENT':
      return setCommitment(state, action.payload);

    case 'SET_PRIORITY_CONTEXT':
      return setPriorityContext(state, action.payload);

    case 'CONFIRM_REFLECTION':
      return confirmReflection(state);

    case 'RESET':
      return resetPolicyState();

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const CoachingEngineContext = createContext<CoachingEngineContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function CoachingEngineProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(coachingEngineReducer, INITIAL_POLICY_STATE);

  // Computed values
  const canAskQuestions = state.currentMode !== 'DIRECT' && state.currentMode !== 'REFRAME';
  const isInDirectMode = state.currentMode === 'DIRECT';
  const hasMissedDay = state.missedDayDetected;
  const needsMissedDayChoice = state.missedDayDetected && state.missedDayChoice === null;

  // Mode operations
  const getCurrentMode = useCallback(() => state.currentMode, [state.currentMode]);

  const transitionTo = useCallback((mode: CoachMode): boolean => {
    if (canTransitionTo(state.currentMode, mode)) {
      dispatch({ type: 'TRANSITION_MODE', payload: mode });
      return true;
    }
    return false;
  }, [state.currentMode]);

  const canTransitionToMode = useCallback((mode: CoachMode): boolean => {
    return canTransitionTo(state.currentMode, mode);
  }, [state.currentMode]);

  // Move operations
  const getCurrentMove = useCallback(() => state.currentMove, [state.currentMove]);

  const detectAndSetMove = useCallback((userMessage: string): CoachingMove => {
    const signals = detectMoveSignals(userMessage);
    const move = chooseCoachingMove(signals);
    if (move !== 'NONE') {
      dispatch({ type: 'SET_MOVE', payload: move });
    }
    return move;
  }, []);

  // Message processing
  const processMessage = useCallback((userMessage: string): CoachPolicyState => {
    dispatch({ type: 'PROCESS_MESSAGE', payload: userMessage });
    return processUserMessage(state, userMessage);
  }, [state]);

  const recordResponse = useCallback((response: string): PolicyViolation[] => {
    const violations = checkPolicyViolations(response, state);
    const questionCount = (response.match(/\?/g) || []).length;
    dispatch({ type: 'RECORD_QUESTIONS', payload: questionCount });
    return violations;
  }, [state]);

  // Missed-day handling
  const handleMissedDayChoice = useCallback((choice: 'UNPACK' | 'SKIP') => {
    dispatch({ type: 'SET_MISSED_DAY_CHOICE', payload: choice });
  }, []);

  // Commitment handling
  const recordCommitment = useCallback((commitment: string) => {
    dispatch({ type: 'SET_COMMITMENT', payload: commitment });
  }, []);

  const recordPriorityContext = useCallback((context: PriorityContext) => {
    dispatch({ type: 'SET_PRIORITY_CONTEXT', payload: context });
  }, []);

  // Utilities
  const getResponseGuidance = useCallback(() => ({
    mode: getModeResponseGuidance(state.currentMode),
    move: getMoveResponseGuidance(state.currentMove),
  }), [state.currentMode, state.currentMove]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value: CoachingEngineContextValue = {
    state,
    canAskQuestions,
    isInDirectMode,
    hasMissedDay,
    needsMissedDayChoice,
    getCurrentMode,
    transitionTo,
    canTransitionTo: canTransitionToMode,
    getCurrentMove,
    detectAndSetMove,
    processMessage,
    recordResponse,
    handleMissedDayChoice,
    getMissedDayPrompt,
    recordCommitment,
    recordPriorityContext,
    getResponseGuidance,
    reset,
  };

  return (
    <CoachingEngineContext.Provider value={value}>
      {children}
    </CoachingEngineContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useCoachingEngine(): CoachingEngineContextValue {
  const context = useContext(CoachingEngineContext);
  if (!context) {
    throw new Error('useCoachingEngine must be used within a CoachingEngineProvider');
  }
  return context;
}
