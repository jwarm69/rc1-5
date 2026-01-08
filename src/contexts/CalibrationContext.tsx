/**
 * RealCoach.ai - Calibration Context
 *
 * Provides global calibration state management across the application.
 * Handles the user's journey from UNINITIALIZED to ACTIONS_ACTIVE.
 *
 * Key Responsibilities:
 * - Track calibration state
 * - Gate daily actions behind G&A confirmation
 * - Handle Fast Lane protocol
 * - Persist state to localStorage (and eventually Supabase)
 */

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import {
  CalibrationState,
  CalibrationTone,
  GoalsAndActions,
  UserState,
  INITIAL_CALIBRATION_STATE,
} from '@/types/coaching';
import {
  startCalibration,
  setCalibrationTone,
  recordAnswer,
  completeGACalibration,
  confirmGA,
  activateActions,
  enterFastLane,
  completeFastLaneCalibration,
  getCurrentQuestion,
  getCurrentFastLaneQuestion,
  isGACalibrationComplete,
  isFastLaneComplete,
  detectFastLane,
  canShowDailyActions,
  isInCalibrationMode,
  getCalibrationProgress,
  getCalibrationStatus,
  handleUnclearAnswer,
  resetCalibration,
} from '@/lib/calibration';

// ============================================================================
// TYPES
// ============================================================================

interface CalibrationContextValue {
  // State
  state: CalibrationState;
  isLoading: boolean;

  // Computed values
  canShowActions: boolean;
  isCalibrating: boolean;
  progress: number;
  statusText: string;
  currentQuestion: { id: string; question: string; creates: string } | null;

  // Actions
  start: () => void;
  setTone: (tone: CalibrationTone) => void;
  answerQuestion: (questionId: string, answer: string | string[]) => void;
  skipQuestion: (questionId: string) => void;
  confirmGoalsAndActions: () => void;
  activateDailyActions: () => void;
  triggerFastLane: () => void;
  reset: () => void;
  checkForFastLane: (userText: string) => boolean;
  updateGoalsAndActions: (updates: Partial<GoalsAndActions>) => void;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

type CalibrationAction =
  | { type: 'START_CALIBRATION' }
  | { type: 'SET_TONE'; payload: CalibrationTone }
  | { type: 'RECORD_ANSWER'; payload: { questionId: string; answer: string | string[] } }
  | { type: 'SKIP_QUESTION'; payload: { questionId: string } }
  | { type: 'COMPLETE_GA_CALIBRATION' }
  | { type: 'CONFIRM_GA' }
  | { type: 'ACTIVATE_ACTIONS' }
  | { type: 'ENTER_FAST_LANE' }
  | { type: 'COMPLETE_FAST_LANE' }
  | { type: 'RESET' }
  | { type: 'UPDATE_GA'; payload: Partial<GoalsAndActions> }
  | { type: 'LOAD_STATE'; payload: CalibrationState };

// ============================================================================
// REDUCER
// ============================================================================

function calibrationReducer(
  state: CalibrationState,
  action: CalibrationAction
): CalibrationState {
  switch (action.type) {
    case 'START_CALIBRATION':
      return startCalibration(state);

    case 'SET_TONE':
      return setCalibrationTone(state, action.payload);

    case 'RECORD_ANSWER':
      return recordAnswer(state, action.payload.questionId, action.payload.answer);

    case 'SKIP_QUESTION':
      return handleUnclearAnswer(state, action.payload.questionId);

    case 'COMPLETE_GA_CALIBRATION':
      return completeGACalibration(state);

    case 'CONFIRM_GA':
      return confirmGA(state);

    case 'ACTIVATE_ACTIONS':
      return activateActions(state);

    case 'ENTER_FAST_LANE':
      return enterFastLane(state);

    case 'COMPLETE_FAST_LANE':
      return completeFastLaneCalibration(state);

    case 'RESET':
      return resetCalibration();

    case 'UPDATE_GA':
      if (!state.goalsAndActions) return state;
      return {
        ...state,
        goalsAndActions: {
          ...state.goalsAndActions,
          ...action.payload,
        } as GoalsAndActions,
      };

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const CalibrationContext = createContext<CalibrationContextValue | null>(null);

// Local storage key
const STORAGE_KEY = 'realcoach_calibration_state';

// ============================================================================
// PROVIDER
// ============================================================================

export function CalibrationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(calibrationReducer, INITIAL_CALIBRATION_STATE);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        if (parsed.startedAt) parsed.startedAt = new Date(parsed.startedAt);
        if (parsed.completedAt) parsed.completedAt = new Date(parsed.completedAt);
        if (parsed.goalsAndActions?.createdAt) {
          parsed.goalsAndActions.createdAt = new Date(parsed.goalsAndActions.createdAt);
        }
        if (parsed.goalsAndActions?.confirmedAt) {
          parsed.goalsAndActions.confirmedAt = new Date(parsed.goalsAndActions.confirmedAt);
        }
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      }
    } catch (error) {
      console.error('Failed to load calibration state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save calibration state:', error);
      }
    }
  }, [state, isLoading]);

  // Computed values
  const canShowActions = canShowDailyActions(state);
  const isCalibrating = isInCalibrationMode(state);
  const progress = getCalibrationProgress(state);
  const statusText = getCalibrationStatus(state);

  // Get current question based on whether in Fast Lane or normal mode
  const currentQuestion = state.fastLaneTriggered
    ? getCurrentFastLaneQuestion(state)
    : getCurrentQuestion(state);

  // Actions
  const start = useCallback(() => {
    dispatch({ type: 'START_CALIBRATION' });
  }, []);

  const setTone = useCallback((tone: CalibrationTone) => {
    dispatch({ type: 'SET_TONE', payload: tone });
  }, []);

  const answerQuestion = useCallback((questionId: string, answer: string | string[]) => {
    dispatch({ type: 'RECORD_ANSWER', payload: { questionId, answer } });

    // Check if calibration is complete after this answer
    // We need to check based on the new state, so we'll handle this in an effect
  }, []);

  const skipQuestion = useCallback((questionId: string) => {
    dispatch({ type: 'SKIP_QUESTION', payload: { questionId } });
  }, []);

  const confirmGoalsAndActions = useCallback(() => {
    dispatch({ type: 'CONFIRM_GA' });
  }, []);

  const activateDailyActions = useCallback(() => {
    dispatch({ type: 'ACTIVATE_ACTIONS' });
  }, []);

  const triggerFastLane = useCallback(() => {
    dispatch({ type: 'ENTER_FAST_LANE' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const checkForFastLane = useCallback((userText: string): boolean => {
    return detectFastLane(userText);
  }, []);

  const updateGoalsAndActions = useCallback((updates: Partial<GoalsAndActions>) => {
    dispatch({ type: 'UPDATE_GA', payload: updates });
  }, []);

  // Auto-complete calibration when all questions are answered
  useEffect(() => {
    if (state.userState === 'CALIBRATING') {
      if (state.fastLaneTriggered && isFastLaneComplete(state)) {
        dispatch({ type: 'COMPLETE_FAST_LANE' });
      } else if (!state.fastLaneTriggered && isGACalibrationComplete(state)) {
        dispatch({ type: 'COMPLETE_GA_CALIBRATION' });
      }
    }
  }, [state]);

  // Auto-activate actions after G&A is confirmed
  useEffect(() => {
    if (state.userState === 'G&A_CONFIRMED') {
      // Small delay to allow UI to show confirmation state
      const timer = setTimeout(() => {
        dispatch({ type: 'ACTIVATE_ACTIONS' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.userState]);

  const value: CalibrationContextValue = {
    state,
    isLoading,
    canShowActions,
    isCalibrating,
    progress,
    statusText,
    currentQuestion,
    start,
    setTone,
    answerQuestion,
    skipQuestion,
    confirmGoalsAndActions,
    activateDailyActions,
    triggerFastLane,
    reset,
    checkForFastLane,
    updateGoalsAndActions,
  };

  return (
    <CalibrationContext.Provider value={value}>
      {children}
    </CalibrationContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useCalibration(): CalibrationContextValue {
  const context = useContext(CalibrationContext);
  if (!context) {
    throw new Error('useCalibration must be used within a CalibrationProvider');
  }
  return context;
}

// ============================================================================
// DEMO MODE HELPER
// ============================================================================

/**
 * Create a calibration state that's already completed (for demo mode)
 */
export function createDemoCalibrationState(): CalibrationState {
  return {
    userState: 'ACTIONS_ACTIVE',
    tone: 'COACH_CONCISE',
    currentQuestionIndex: 7, // All questions answered
    answers: {
      annual_professional_goal: 'Close 24 units this year',
      annual_personal_goal: 'Maintain work-life balance, no nights/weekends',
      current_reality: 'Pipeline is thin, need more listing appointments',
      monthly_milestone: 'Book 4 listing appointments',
      execution_style: 'Structured and planned',
      willingness_filter: ['SOI outreach', 'Open houses', 'Social media content'],
      friction_boundary: ['Cold calling', 'Door knocking'],
    },
    goalsAndActions: {
      annualProfessionalGoal: 'Close 24 units this year',
      annualPersonalGoal: 'Maintain work-life balance, no nights/weekends',
      currentReality: 'Pipeline is thin, need more listing appointments',
      monthlyMilestone: 'Book 4 listing appointments',
      executionStyle: 'STRUCTURED',
      willingnessFilter: ['SOI outreach', 'Open houses', 'Social media content'],
      frictionBoundaries: ['Cold calling', 'Door knocking'],
      status: 'CONFIRMED',
      createdAt: new Date(),
      confirmedAt: new Date(),
    },
    businessPlan: null,
    fastLaneTriggered: false,
    startedAt: new Date(Date.now() - 86400000), // Yesterday
    completedAt: new Date(),
  };
}
