/**
 * LLM Client Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMClient, getLLMClient, resetLLMClient } from './client';
import { CoachingContext, LLMError } from './types';
import { CoachMode } from '@/types/coaching';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      }),
    },
  },
}));

// Helper to create a test client with access to private methods
function createTestClient(): LLMClient & {
  validateResponse: (content: string, mode: CoachMode) => { valid: boolean; violations: string[]; questionCount: number };
  inferTaskType: (userMessage: string, context: CoachingContext) => string;
  inferNextMode: (userMessage: string, response: string, context: CoachingContext) => CoachMode;
  detectCoachingMove: (userMessage: string) => string;
  detectSignals: (userMessage: string) => Record<string, boolean>;
} {
  return new LLMClient() as any;
}

// Helper to create minimal coaching context
function createContext(overrides: Partial<CoachingContext> = {}): CoachingContext {
  return {
    goalsAndActions: null,
    businessPlan: null,
    tone: null,
    currentMode: 'CLARIFY',
    currentMove: 'NONE',
    recentMessages: [],
    ...overrides,
  };
}

describe('LLM Client', () => {
  beforeEach(() => {
    resetLLMClient();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance with getLLMClient', () => {
      const client1 = getLLMClient();
      const client2 = getLLMClient();
      expect(client1).toBe(client2);
    });

    it('should return new instance after resetLLMClient', () => {
      const client1 = getLLMClient();
      resetLLMClient();
      const client2 = getLLMClient();
      expect(client1).not.toBe(client2);
    });
  });

  describe('validateResponse', () => {
    it('should return valid=true for clean response', () => {
      const client = createTestClient();
      const result = client['validateResponse']('This is a helpful response.', 'CLARIFY');
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect multiple questions', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        'What do you think? How does that make you feel?',
        'CLARIFY'
      );
      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Multiple questions (2) - only 1 allowed');
      expect(result.questionCount).toBe(2);
    });

    it('should flag questions in DIRECT mode', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        'Here is your action. Does this work for you?',
        'DIRECT'
      );
      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Questions not allowed in DIRECT mode');
    });

    it('should flag questions in REFRAME mode', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        'Consider this perspective. What do you think?',
        'REFRAME'
      );
      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Questions not allowed in REFRAME mode');
    });

    it('should detect banned word: crush', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        "You're going to crush it today!",
        'CLARIFY'
      );
      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Banned word used: "crush"');
    });

    it('should detect banned word: hustle', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        'Keep up the hustle and grind!',
        'CLARIFY'
      );
      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Banned word used: "hustle"');
      expect(result.violations).toContain('Banned word used: "grind"');
    });

    it('should detect banned word: empower', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        'This will empower you to succeed.',
        'CLARIFY'
      );
      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Banned word used: "empower"');
    });

    it('should detect banned word: synergy', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        "Let's create synergy with this approach.",
        'CLARIFY'
      );
      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Banned word used: "synergy"');
    });

    it('should detect banned word: game-changer', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        'This is going to be a game-changer!',
        'CLARIFY'
      );
      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Banned word used: "game-changer"');
    });

    it('should detect urgency pattern: don\'t miss', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        "Don't miss this opportunity!",
        'CLARIFY'
      );
      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Urgency language detected');
    });

    it('should detect urgency pattern: limited time', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        'This is a limited time opportunity.',
        'CLARIFY'
      );
      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Urgency language detected');
    });

    it('should detect urgency pattern: act now', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        'Act now before it is too late!',
        'CLARIFY'
      );
      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Urgency language detected');
    });

    it('should detect urgency pattern: urgent', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        'This is urgent and needs attention.',
        'CLARIFY'
      );
      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Urgency language detected');
    });

    it('should return correct questionCount', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        'How are you? What happened? Why is that?',
        'CLARIFY'
      );
      expect(result.questionCount).toBe(3);
    });

    it('should allow single question in CLARIFY mode', () => {
      const client = createTestClient();
      const result = client['validateResponse'](
        'What would you like to focus on today?',
        'CLARIFY'
      );
      expect(result.valid).toBe(true);
      expect(result.questionCount).toBe(1);
    });
  });

  describe('inferTaskType', () => {
    it('should return ACKNOWLEDGMENT for "ok"', () => {
      const client = createTestClient();
      const context = createContext();
      const result = client['inferTaskType']('ok', context);
      expect(result).toBe('ACKNOWLEDGMENT');
    });

    it('should return ACKNOWLEDGMENT for "thanks"', () => {
      const client = createTestClient();
      const context = createContext();
      const result = client['inferTaskType']('thanks', context);
      expect(result).toBe('ACKNOWLEDGMENT');
    });

    it('should return ACKNOWLEDGMENT for "got it"', () => {
      const client = createTestClient();
      const context = createContext();
      const result = client['inferTaskType']('got it', context);
      expect(result).toBe('ACKNOWLEDGMENT');
    });

    it('should return ACKNOWLEDGMENT for "sounds good"', () => {
      const client = createTestClient();
      const context = createContext();
      const result = client['inferTaskType']('sounds good', context);
      expect(result).toBe('ACKNOWLEDGMENT');
    });

    it('should return CALIBRATION in CLARIFY mode without G&A', () => {
      const client = createTestClient();
      const context = createContext({ currentMode: 'CLARIFY', goalsAndActions: null });
      const result = client['inferTaskType']('I want to close more deals', context);
      expect(result).toBe('CALIBRATION');
    });

    it('should return COACHING as default', () => {
      const client = createTestClient();
      const context = createContext({
        currentMode: 'REFLECT',
        goalsAndActions: { status: 'CONFIRMED' } as any,
      });
      const result = client['inferTaskType']('I am struggling with follow-ups', context);
      expect(result).toBe('COACHING');
    });
  });

  describe('inferNextMode', () => {
    it('should suggest REFLECT from CLARIFY when message is substantive', () => {
      const client = createTestClient();
      const context = createContext({ currentMode: 'CLARIFY' });
      const longMessage = 'I have been struggling with follow-ups for months now and need help.';
      const result = client['inferNextMode'](longMessage, '', context);
      expect(result).toBe('REFLECT');
    });

    it('should stay in CLARIFY for short messages', () => {
      const client = createTestClient();
      const context = createContext({ currentMode: 'CLARIFY' });
      const result = client['inferNextMode']('Not sure', '', context);
      expect(result).toBe('CLARIFY');
    });

    it('should suggest COMMIT from REFLECT when user confirms', () => {
      const client = createTestClient();
      const context = createContext({ currentMode: 'REFLECT' });
      const result = client['inferNextMode']("Yes, that's exactly right", '', context);
      expect(result).toBe('COMMIT');
    });

    it('should suggest DIRECT from COMMIT when user agrees', () => {
      const client = createTestClient();
      const context = createContext({ currentMode: 'COMMIT' });
      const result = client['inferNextMode']("Yes, I'll do that", '', context);
      expect(result).toBe('DIRECT');
    });

    it('should return to CLARIFY from DIRECT when user asks question', () => {
      const client = createTestClient();
      const context = createContext({ currentMode: 'DIRECT' });
      const result = client['inferNextMode']('What should I do about the Henderson listing?', '', context);
      expect(result).toBe('CLARIFY');
    });

    it('should stay in DIRECT for non-question messages', () => {
      const client = createTestClient();
      const context = createContext({ currentMode: 'DIRECT' });
      const result = client['inferNextMode']('Got it, thanks', '', context);
      expect(result).toBe('DIRECT');
    });
  });

  describe('detectCoachingMove', () => {
    it('should return FOCUS for "too many"', () => {
      const client = createTestClient();
      const result = client['detectCoachingMove']('I have too many things to do');
      expect(result).toBe('FOCUS');
    });

    it('should return FOCUS for "don\'t know where to start"', () => {
      const client = createTestClient();
      const result = client['detectCoachingMove']("I don't know where to start with all this");
      expect(result).toBe('FOCUS');
    });

    it('should return AGENCY for "can\'t control"', () => {
      const client = createTestClient();
      const result = client['detectCoachingMove']("I can't control what they do");
      expect(result).toBe('AGENCY');
    });

    it('should return AGENCY for "nothing i can do"', () => {
      const client = createTestClient();
      const result = client['detectCoachingMove']("There's nothing I can do about it");
      expect(result).toBe('AGENCY');
    });

    it('should return IDENTITY for "just who i am"', () => {
      const client = createTestClient();
      const result = client['detectCoachingMove']("That's just who I am");
      expect(result).toBe('IDENTITY');
    });

    it('should return IDENTITY for "always been this way"', () => {
      const client = createTestClient();
      const result = client['detectCoachingMove']("I've always been this way");
      expect(result).toBe('IDENTITY');
    });

    it('should return EASE for "keep putting off"', () => {
      const client = createTestClient();
      const result = client['detectCoachingMove']('I keep putting off my calls');
      expect(result).toBe('EASE');
    });

    it('should return EASE for "can\'t get myself"', () => {
      const client = createTestClient();
      const result = client['detectCoachingMove']("I can't get myself to start");
      expect(result).toBe('EASE');
    });

    it('should return NONE for neutral messages', () => {
      const client = createTestClient();
      const result = client['detectCoachingMove']('Good morning, ready to start the day');
      expect(result).toBe('NONE');
    });
  });

  describe('detectSignals', () => {
    it('should detect overwhelm signal', () => {
      const client = createTestClient();
      const result = client['detectSignals']('I have too many things to do');
      expect(result.overwhelm).toBe(true);
    });

    it('should detect externalizedControl signal', () => {
      const client = createTestClient();
      const result = client['detectSignals']("There's nothing I can do about it");
      expect(result.externalizedControl).toBe(true);
    });

    it('should detect selfStory signal', () => {
      const client = createTestClient();
      const result = client['detectSignals']("I'm not good at this, it's just who I am");
      expect(result.selfStory).toBe(true);
    });

    it('should detect resistance signal', () => {
      const client = createTestClient();
      const result = client['detectSignals']('I know what to do but keep putting it off');
      expect(result.resistance).toBe(true);
    });

    it('should detect missedDay signal: nothing got done', () => {
      const client = createTestClient();
      const result = client['detectSignals']('Yesterday nothing got done');
      expect(result.missedDay).toBe(true);
    });

    it('should detect missedDay signal: blew the day', () => {
      const client = createTestClient();
      const result = client['detectSignals']('I totally blew the day');
      expect(result.missedDay).toBe(true);
    });

    it('should detect missedDay signal: fell off', () => {
      const client = createTestClient();
      const result = client['detectSignals']('I completely fell off track');
      expect(result.missedDay).toBe(true);
    });

    it('should return no signals for neutral message', () => {
      const client = createTestClient();
      const result = client['detectSignals']('I finished my calls and sent the emails');
      expect(result.overwhelm).toBe(false);
      expect(result.externalizedControl).toBe(false);
      expect(result.selfStory).toBe(false);
      expect(result.resistance).toBe(false);
      expect(result.missedDay).toBe(false);
    });
  });

  describe('getConfigStatus', () => {
    it('should return server-side config status', () => {
      const client = createTestClient();
      const status = client.getConfigStatus();
      expect(status.claude).toBe(true);
      expect(status.openai).toBe(true);
      expect(status.primary).toBe('claude');
    });
  });
});
