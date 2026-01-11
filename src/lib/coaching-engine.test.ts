/**
 * Coaching Engine Tests
 */
import { describe, it, expect } from 'vitest';
import {
  canTransitionTo,
  transitionMode,
  inferNextMode,
  detectMoveSignals,
  chooseCoachingMove,
  setCoachingMove,
  detectMissedDay,
  INITIAL_POLICY_STATE,
} from './coaching-engine';
import { CoachPolicyState } from '@/types/coaching';

describe('Coaching Engine', () => {
  describe('Mode Transitions', () => {
    it('should allow CLARIFY to REFLECT', () => {
      expect(canTransitionTo('CLARIFY', 'REFLECT')).toBe(true);
    });

    it('should allow REFLECT to REFRAME', () => {
      expect(canTransitionTo('REFLECT', 'REFRAME')).toBe(true);
    });

    it('should allow REFLECT to COMMIT', () => {
      expect(canTransitionTo('REFLECT', 'COMMIT')).toBe(true);
    });

    it('should allow REFRAME to COMMIT', () => {
      expect(canTransitionTo('REFRAME', 'COMMIT')).toBe(true);
    });

    it('should allow COMMIT to DIRECT', () => {
      expect(canTransitionTo('COMMIT', 'DIRECT')).toBe(true);
    });

    it('should allow DIRECT to CLARIFY (restart flow)', () => {
      expect(canTransitionTo('DIRECT', 'CLARIFY')).toBe(true);
    });

    it('should NOT allow skipping from CLARIFY to DIRECT', () => {
      expect(canTransitionTo('CLARIFY', 'DIRECT')).toBe(false);
    });

    it('should NOT allow backwards from COMMIT to CLARIFY', () => {
      expect(canTransitionTo('COMMIT', 'CLARIFY')).toBe(false);
    });
  });

  describe('transitionMode', () => {
    it('should transition to valid new mode', () => {
      const state: CoachPolicyState = { ...INITIAL_POLICY_STATE };
      const newState = transitionMode(state, 'REFLECT');
      expect(newState.currentMode).toBe('REFLECT');
      expect(newState.questionsInLastTurn).toBe(0);
    });

    it('should return unchanged state for invalid transition', () => {
      const state: CoachPolicyState = { ...INITIAL_POLICY_STATE };
      const newState = transitionMode(state, 'DIRECT');
      expect(newState.currentMode).toBe('CLARIFY');
    });
  });

  describe('inferNextMode', () => {
    it('should suggest REFLECT from CLARIFY when message is substantive', () => {
      const state: CoachPolicyState = { ...INITIAL_POLICY_STATE, currentMode: 'CLARIFY' };
      const result = inferNextMode(state, 'I have been struggling with follow-ups all month');
      expect(result).toBe('REFLECT');
    });

    it('should stay in CLARIFY for short messages', () => {
      const state: CoachPolicyState = { ...INITIAL_POLICY_STATE, currentMode: 'CLARIFY' };
      const result = inferNextMode(state, 'Not sure');
      expect(result).toBe('CLARIFY');
    });

    it('should suggest COMMIT from REFLECT when confirmed', () => {
      const state: CoachPolicyState = { ...INITIAL_POLICY_STATE, currentMode: 'REFLECT' };
      const result = inferNextMode(state, "Yes, that's exactly right", true);
      expect(result).toBe('COMMIT');
    });

    it('should suggest REFRAME when self-story signals detected', () => {
      const state: CoachPolicyState = { ...INITIAL_POLICY_STATE, currentMode: 'REFLECT', reflectionConfirmed: true };
      // Message must match selfStory pattern: "i'm not|just who i am|always been|..."
      const result = inferNextMode(state, "I'm not a morning person, that's just who I am");
      expect(result).toBe('REFRAME');
    });

    it('should suggest COMMIT from REFRAME', () => {
      const state: CoachPolicyState = { ...INITIAL_POLICY_STATE, currentMode: 'REFRAME' };
      const result = inferNextMode(state, 'Ok I see your point');
      expect(result).toBe('COMMIT');
    });

    it('should stay in DIRECT unless user asks question', () => {
      const state: CoachPolicyState = { ...INITIAL_POLICY_STATE, currentMode: 'DIRECT' };
      const result = inferNextMode(state, 'Got it, thanks');
      expect(result).toBe('DIRECT');
    });

    it('should return to CLARIFY from DIRECT when user asks question', () => {
      const state: CoachPolicyState = { ...INITIAL_POLICY_STATE, currentMode: 'DIRECT' };
      const result = inferNextMode(state, 'What should I do about the Henderson listing?');
      expect(result).toBe('CLARIFY');
    });
  });

  describe('detectMoveSignals', () => {
    it('should detect overwhelm signals', () => {
      const signals = detectMoveSignals('I have too many things to do and I don\'t know where to start');
      expect(signals.overwhelm).toBe(true);
    });

    it('should detect externalized control signals', () => {
      const signals = detectMoveSignals("There's nothing I can do, they just won't respond");
      expect(signals.externalizedControl).toBe(true);
    });

    it('should detect self-story signals', () => {
      const signals = detectMoveSignals("I'm just not good at sales, that's just who I am");
      expect(signals.selfStory).toBe(true);
    });

    it('should detect resistance signals', () => {
      const signals = detectMoveSignals('I know what to do but I keep putting it off');
      expect(signals.resistance).toBe(true);
    });

    it('should return no signals for neutral message', () => {
      const signals = detectMoveSignals('Good morning, ready to start the day');
      expect(signals.overwhelm).toBe(false);
      expect(signals.externalizedControl).toBe(false);
      expect(signals.selfStory).toBe(false);
      expect(signals.resistance).toBe(false);
    });
  });

  describe('chooseCoachingMove', () => {
    it('should choose FOCUS for overwhelm', () => {
      const signals = { overwhelm: true, externalizedControl: false, selfStory: false, resistance: false };
      expect(chooseCoachingMove(signals)).toBe('FOCUS');
    });

    it('should choose AGENCY for externalized control', () => {
      const signals = { overwhelm: false, externalizedControl: true, selfStory: false, resistance: false };
      expect(chooseCoachingMove(signals)).toBe('AGENCY');
    });

    it('should choose IDENTITY for self-story', () => {
      const signals = { overwhelm: false, externalizedControl: false, selfStory: true, resistance: false };
      expect(chooseCoachingMove(signals)).toBe('IDENTITY');
    });

    it('should choose EASE for resistance', () => {
      const signals = { overwhelm: false, externalizedControl: false, selfStory: false, resistance: true };
      expect(chooseCoachingMove(signals)).toBe('EASE');
    });

    it('should choose NONE for no signals', () => {
      const signals = { overwhelm: false, externalizedControl: false, selfStory: false, resistance: false };
      expect(chooseCoachingMove(signals)).toBe('NONE');
    });

    it('should prioritize AGENCY over FOCUS when both present', () => {
      const signals = { overwhelm: true, externalizedControl: true, selfStory: false, resistance: false };
      expect(chooseCoachingMove(signals)).toBe('AGENCY');
    });

    it('should return NONE when clarity is low', () => {
      const signals = { overwhelm: true, externalizedControl: true, selfStory: true, resistance: true };
      expect(chooseCoachingMove(signals, 'low')).toBe('NONE');
    });
  });

  describe('setCoachingMove', () => {
    it('should update current move', () => {
      const state: CoachPolicyState = { ...INITIAL_POLICY_STATE };
      const newState = setCoachingMove(state, 'FOCUS');
      expect(newState.currentMove).toBe('FOCUS');
    });
  });

  describe('detectMissedDay', () => {
    it('should detect "nothing got done"', () => {
      expect(detectMissedDay('Yesterday nothing got done')).toBe(true);
    });

    it('should detect "didn\'t do anything"', () => {
      expect(detectMissedDay("I didn't do anything productive")).toBe(true);
    });

    it('should detect "fell off"', () => {
      expect(detectMissedDay('I completely fell off track')).toBe(true);
    });

    it('should detect "blew the day"', () => {
      expect(detectMissedDay('I totally blew the day')).toBe(true);
    });

    it('should not detect for normal messages', () => {
      expect(detectMissedDay('I finished my calls and sent the emails')).toBe(false);
    });

    it('should not detect for questions', () => {
      expect(detectMissedDay('What should I focus on today?')).toBe(false);
    });
  });
});
