/**
 * Calibration State Machine Tests
 */
import { describe, it, expect } from 'vitest';
import {
  isValidTransition,
  transitionState,
  startCalibration,
  setCalibrationTone,
  recordAnswer,
  isGACalibrationComplete,
  generateGADraft,
  VALID_STATE_TRANSITIONS,
} from './calibration';
import { CalibrationState, INITIAL_CALIBRATION_STATE } from '@/types/coaching';

describe('Calibration State Machine', () => {
  describe('State Transitions', () => {
    it('should allow UNINITIALIZED to CALIBRATING', () => {
      expect(isValidTransition('UNINITIALIZED', 'CALIBRATING')).toBe(true);
    });

    it('should allow CALIBRATING to G&A_DRAFTED', () => {
      expect(isValidTransition('CALIBRATING', 'G&A_DRAFTED')).toBe(true);
    });

    it('should allow G&A_DRAFTED to G&A_CONFIRMED', () => {
      expect(isValidTransition('G&A_DRAFTED', 'G&A_CONFIRMED')).toBe(true);
    });

    it('should allow G&A_DRAFTED to CALIBRATING (edit flow)', () => {
      expect(isValidTransition('G&A_DRAFTED', 'CALIBRATING')).toBe(true);
    });

    it('should allow G&A_CONFIRMED to ACTIONS_ACTIVE', () => {
      expect(isValidTransition('G&A_CONFIRMED', 'ACTIONS_ACTIVE')).toBe(true);
    });

    it('should NOT allow skipping CALIBRATING to ACTIONS_ACTIVE', () => {
      expect(isValidTransition('UNINITIALIZED', 'ACTIONS_ACTIVE')).toBe(false);
    });

    it('should NOT allow skipping G&A_DRAFTED to ACTIONS_ACTIVE', () => {
      expect(isValidTransition('CALIBRATING', 'ACTIONS_ACTIVE')).toBe(false);
    });

    it('should NOT allow going backwards from ACTIONS_ACTIVE to UNINITIALIZED', () => {
      expect(isValidTransition('ACTIONS_ACTIVE', 'UNINITIALIZED')).toBe(false);
    });
  });

  describe('transitionState', () => {
    it('should transition to valid new state', () => {
      const state: CalibrationState = { ...INITIAL_CALIBRATION_STATE };
      const newState = transitionState(state, 'CALIBRATING');
      expect(newState.userState).toBe('CALIBRATING');
    });

    it('should return unchanged state for invalid transition', () => {
      const state: CalibrationState = { ...INITIAL_CALIBRATION_STATE };
      const newState = transitionState(state, 'ACTIONS_ACTIVE');
      expect(newState.userState).toBe('UNINITIALIZED');
    });
  });

  describe('startCalibration', () => {
    it('should transition from UNINITIALIZED to CALIBRATING', () => {
      const state: CalibrationState = { ...INITIAL_CALIBRATION_STATE };
      const newState = startCalibration(state);
      expect(newState.userState).toBe('CALIBRATING');
      expect(newState.currentQuestionIndex).toBe(0);
      expect(newState.startedAt).toBeInstanceOf(Date);
    });

    it('should not transition if already calibrating', () => {
      const state: CalibrationState = {
        ...INITIAL_CALIBRATION_STATE,
        userState: 'CALIBRATING',
      };
      const newState = startCalibration(state);
      expect(newState).toBe(state);
    });
  });

  describe('setCalibrationTone', () => {
    it('should set DIRECT_EXECUTIVE tone', () => {
      const state: CalibrationState = { ...INITIAL_CALIBRATION_STATE };
      const newState = setCalibrationTone(state, 'DIRECT_EXECUTIVE');
      expect(newState.tone).toBe('DIRECT_EXECUTIVE');
    });

    it('should set COACH_CONCISE tone', () => {
      const state: CalibrationState = { ...INITIAL_CALIBRATION_STATE };
      const newState = setCalibrationTone(state, 'COACH_CONCISE');
      expect(newState.tone).toBe('COACH_CONCISE');
    });

    it('should set NEUTRAL_MINIMAL tone', () => {
      const state: CalibrationState = { ...INITIAL_CALIBRATION_STATE };
      const newState = setCalibrationTone(state, 'NEUTRAL_MINIMAL');
      expect(newState.tone).toBe('NEUTRAL_MINIMAL');
    });
  });

  describe('recordAnswer', () => {
    it('should record answer and increment question index', () => {
      const state: CalibrationState = {
        ...INITIAL_CALIBRATION_STATE,
        userState: 'CALIBRATING',
        currentQuestionIndex: 0,
      };
      const newState = recordAnswer(state, 'annual_professional_goal', 'Close 24 deals');
      expect(newState.answers['annual_professional_goal']).toBe('Close 24 deals');
      expect(newState.currentQuestionIndex).toBe(1);
    });

    it('should handle multiple answers', () => {
      let state: CalibrationState = {
        ...INITIAL_CALIBRATION_STATE,
        userState: 'CALIBRATING',
        currentQuestionIndex: 0,
      };
      state = recordAnswer(state, 'annual_professional_goal', 'Close 24 deals');
      state = recordAnswer(state, 'annual_personal_goal', 'More family time');
      expect(state.answers['annual_professional_goal']).toBe('Close 24 deals');
      expect(state.answers['annual_personal_goal']).toBe('More family time');
      expect(state.currentQuestionIndex).toBe(2);
    });
  });

  describe('isGACalibrationComplete', () => {
    it('should return false when questions remain', () => {
      const state: CalibrationState = {
        ...INITIAL_CALIBRATION_STATE,
        currentQuestionIndex: 3,
      };
      expect(isGACalibrationComplete(state)).toBe(false);
    });

    it('should return true when all questions answered', () => {
      const state: CalibrationState = {
        ...INITIAL_CALIBRATION_STATE,
        currentQuestionIndex: 7, // 7 questions in GA calibration
      };
      expect(isGACalibrationComplete(state)).toBe(true);
    });
  });

  describe('generateGADraft', () => {
    it('should generate G&A draft from answers', () => {
      const state: CalibrationState = {
        ...INITIAL_CALIBRATION_STATE,
        answers: {
          annual_professional_goal: 'Close 24 deals',
          annual_personal_goal: 'More family time',
          current_reality: 'Averaging 1.5 deals/month',
          monthly_milestone: 'Get 4 active listings',
          execution_style: 'I prefer short bursts of work',
          willingness_filter: 'Cold calling, door knocking',
          friction_boundary: 'Open houses on weekends',
        },
      };

      const draft = generateGADraft(state);

      expect(draft.annualProfessionalGoal).toBe('Close 24 deals');
      expect(draft.annualPersonalGoal).toBe('More family time');
      expect(draft.currentReality).toBe('Averaging 1.5 deals/month');
      expect(draft.monthlyMilestone).toBe('Get 4 active listings');
      expect(draft.executionStyle).toBe('SHORT_BURSTS');
      expect(draft.status).toBe('DRAFT');
    });

    it('should map execution style to STRUCTURED', () => {
      const state: CalibrationState = {
        ...INITIAL_CALIBRATION_STATE,
        answers: { execution_style: 'I like structured and planned approaches' },
      };
      const draft = generateGADraft(state);
      expect(draft.executionStyle).toBe('STRUCTURED');
    });

    it('should map execution style to SLOW_CONSISTENT', () => {
      const state: CalibrationState = {
        ...INITIAL_CALIBRATION_STATE,
        answers: { execution_style: 'Slow and consistent progress' },
      };
      const draft = generateGADraft(state);
      expect(draft.executionStyle).toBe('SLOW_CONSISTENT');
    });

    it('should default to FLEXIBLE for unknown style', () => {
      const state: CalibrationState = {
        ...INITIAL_CALIBRATION_STATE,
        answers: { execution_style: 'Whatever works' },
      };
      const draft = generateGADraft(state);
      expect(draft.executionStyle).toBe('FLEXIBLE');
    });

    it('should parse comma-separated willingness filter', () => {
      const state: CalibrationState = {
        ...INITIAL_CALIBRATION_STATE,
        answers: { willingness_filter: 'Cold calls, Follow-ups, Door knocking' },
      };
      const draft = generateGADraft(state);
      expect(draft.willingnessFilter).toEqual(['Cold calls', 'Follow-ups', 'Door knocking']);
    });
  });
});
