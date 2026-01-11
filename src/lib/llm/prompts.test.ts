/**
 * Prompts Tests
 */
import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildDailyActionPrompt, VALIDATION_PROMPT } from './prompts';
import { CoachingContext } from './types';
import { GoalsAndActions, BusinessPlan } from '@/types/coaching';

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

// Helper to create G&A
function createGoalsAndActions(overrides: Partial<GoalsAndActions> = {}): GoalsAndActions {
  return {
    annualProfessionalGoal: 'Close 24 deals',
    annualPersonalGoal: 'More family time',
    currentReality: 'Averaging 1.5 deals/month',
    monthlyMilestone: 'Get 4 active listings',
    executionStyle: 'STRUCTURED',
    willingnessFilter: ['Follow-ups', 'Open houses'],
    frictionBoundaries: ['Cold calling'],
    status: 'CONFIRMED',
    confirmedAt: new Date(),
    ...overrides,
  };
}

// Helper to create business plan
function createBusinessPlan(overrides: Partial<BusinessPlan> = {}): BusinessPlan {
  return {
    revenueTarget: 200000,
    revenuePerUnit: 8000,
    buyerSellerSplit: '60/40',
    primaryLeadSource: 'Sphere of influence',
    riskTolerance: 'MODERATE',
    ...overrides,
  } as BusinessPlan;
}

describe('Prompts', () => {
  describe('buildSystemPrompt', () => {
    it('should include core identity rules', () => {
      const context = createContext();
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('ONE QUESTION AT A TIME');
      expect(prompt).toContain('NO URGENCY LANGUAGE');
      expect(prompt).toContain('BANNED WORDS');
    });

    describe('Mode-specific prompts', () => {
      it('should include CLARIFY mode rules', () => {
        const context = createContext({ currentMode: 'CLARIFY' });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('CURRENT MODE: CLARIFY');
        expect(prompt).toContain('Ask exactly ONE clarifying question');
        expect(prompt).toContain('Do NOT give advice yet');
      });

      it('should include REFLECT mode rules', () => {
        const context = createContext({ currentMode: 'REFLECT' });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('CURRENT MODE: REFLECT');
        expect(prompt).toContain('Mirror back the facts AND emotional undertone');
        expect(prompt).toContain('Ask ONE confirmation question');
      });

      it('should include REFRAME mode rules', () => {
        const context = createContext({ currentMode: 'REFRAME' });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('CURRENT MODE: REFRAME');
        expect(prompt).toContain('NO questions allowed in this mode');
        expect(prompt).toContain('Reframe the BEHAVIOR, not the identity');
      });

      it('should include COMMIT mode rules', () => {
        const context = createContext({ currentMode: 'COMMIT' });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('CURRENT MODE: COMMIT');
        expect(prompt).toContain('Propose ONE commitment only');
        expect(prompt).toContain('Ask for explicit agreement');
      });

      it('should include DIRECT mode rules', () => {
        const context = createContext({ currentMode: 'DIRECT' });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('CURRENT MODE: DIRECT');
        expect(prompt).toContain('NO questions allowed');
        expect(prompt).toContain('NO coaching or motivational language');
      });
    });

    describe('Move-specific additions', () => {
      it('should include FOCUS move guidance', () => {
        const context = createContext({ currentMove: 'FOCUS' });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('COACHING MOVE: FOCUS');
        expect(prompt).toContain('OVERWHELM');
        expect(prompt).toContain('Which one would make the others easier');
      });

      it('should include AGENCY move guidance', () => {
        const context = createContext({ currentMove: 'AGENCY' });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('COACHING MOVE: AGENCY');
        expect(prompt).toContain('EXTERNALIZED CONTROL');
        expect(prompt).toContain('Restore sense of choice');
      });

      it('should include IDENTITY move guidance', () => {
        const context = createContext({ currentMove: 'IDENTITY' });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('COACHING MOVE: IDENTITY');
        expect(prompt).toContain('NEGATIVE SELF-STORY');
        expect(prompt).toContain('Separate behavior from identity');
      });

      it('should include EASE move guidance', () => {
        const context = createContext({ currentMove: 'EASE' });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('COACHING MOVE: EASE');
        expect(prompt).toContain('RESISTANCE');
        expect(prompt).toContain('Shrink the behavior');
      });

      it('should not include move guidance for NONE', () => {
        const context = createContext({ currentMove: 'NONE' });
        const prompt = buildSystemPrompt(context);
        expect(prompt).not.toContain('COACHING MOVE:');
      });
    });

    describe('Tone modifiers', () => {
      it('should include DIRECT_EXECUTIVE tone', () => {
        const context = createContext({ tone: 'DIRECT_EXECUTIVE' });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('TONE: DIRECT & EXECUTIVE');
        expect(prompt).toContain('Straight to the point');
      });

      it('should include COACH_CONCISE tone', () => {
        const context = createContext({ tone: 'COACH_CONCISE' });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('TONE: COACH-LIKE');
        expect(prompt).toContain('Supportive but concise');
      });

      it('should include NEUTRAL_MINIMAL tone', () => {
        const context = createContext({ tone: 'NEUTRAL_MINIMAL' });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('TONE: NEUTRAL & MINIMAL');
        expect(prompt).toContain('Just the facts');
      });

      it('should not include tone section when null', () => {
        const context = createContext({ tone: null });
        const prompt = buildSystemPrompt(context);
        expect(prompt).not.toContain('TONE:');
      });
    });

    describe('Goals context', () => {
      it('should include goals and actions when provided', () => {
        const ga = createGoalsAndActions();
        const context = createContext({ goalsAndActions: ga });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain("USER'S GOALS & CONTEXT");
        expect(prompt).toContain('Close 24 deals');
        expect(prompt).toContain('More family time');
        expect(prompt).toContain('Get 4 active listings');
      });

      it('should format STRUCTURED execution style', () => {
        const ga = createGoalsAndActions({ executionStyle: 'STRUCTURED' });
        const context = createContext({ goalsAndActions: ga });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('Prefers structure and planning');
      });

      it('should format FLEXIBLE execution style', () => {
        const ga = createGoalsAndActions({ executionStyle: 'FLEXIBLE' });
        const context = createContext({ goalsAndActions: ga });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('Prefers flexibility and adaptation');
      });

      it('should format SHORT_BURSTS execution style', () => {
        const ga = createGoalsAndActions({ executionStyle: 'SHORT_BURSTS' });
        const context = createContext({ goalsAndActions: ga });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('Works best in short intense bursts');
      });

      it('should format SLOW_CONSISTENT execution style', () => {
        const ga = createGoalsAndActions({ executionStyle: 'SLOW_CONSISTENT' });
        const context = createContext({ goalsAndActions: ga });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('Prefers slow and steady progress');
      });

      it('should include willingness filter', () => {
        const ga = createGoalsAndActions({ willingnessFilter: ['Follow-ups', 'Open houses'] });
        const context = createContext({ goalsAndActions: ga });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('Follow-ups, Open houses');
      });

      it('should include friction boundaries', () => {
        const ga = createGoalsAndActions({ frictionBoundaries: ['Cold calling', 'Door knocking'] });
        const context = createContext({ goalsAndActions: ga });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain('Cold calling, Door knocking');
      });

      it('should not include goals section when null', () => {
        const context = createContext({ goalsAndActions: null });
        const prompt = buildSystemPrompt(context);
        expect(prompt).not.toContain("USER'S GOALS");
      });
    });

    describe('Business plan context', () => {
      it('should include business plan when provided', () => {
        const bp = createBusinessPlan();
        const context = createContext({ businessPlan: bp });
        const prompt = buildSystemPrompt(context);
        expect(prompt).toContain("USER'S BUSINESS PLAN");
        expect(prompt).toContain('Revenue Target');
      });

      it('should not include business plan section when null', () => {
        const context = createContext({ businessPlan: null });
        const prompt = buildSystemPrompt(context);
        expect(prompt).not.toContain("USER'S BUSINESS PLAN");
      });
    });
  });

  describe('buildDailyActionPrompt', () => {
    it('should include core identity', () => {
      const context = createContext();
      const prompt = buildDailyActionPrompt(context);
      expect(prompt).toContain('RealCoach');
      expect(prompt).toContain('CRITICAL RULES');
    });

    it('should include task description', () => {
      const context = createContext();
      const prompt = buildDailyActionPrompt(context);
      expect(prompt).toContain('TASK: Generate Today\'s Actions');
    });

    it('should include action rules', () => {
      const context = createContext();
      const prompt = buildDailyActionPrompt(context);
      expect(prompt).toContain('Maximum 1 Primary Action');
      expect(prompt).toContain('Maximum 2 Supporting Actions');
    });

    it('should include JSON output format', () => {
      const context = createContext();
      const prompt = buildDailyActionPrompt(context);
      expect(prompt).toContain('OUTPUT FORMAT');
      expect(prompt).toContain('"primary"');
      expect(prompt).toContain('"supporting"');
      expect(prompt).toContain('"title"');
      expect(prompt).toContain('"milestoneConnection"');
    });

    it('should include goals context when provided', () => {
      const ga = createGoalsAndActions();
      const context = createContext({ goalsAndActions: ga });
      const prompt = buildDailyActionPrompt(context);
      expect(prompt).toContain('Close 24 deals');
      expect(prompt).toContain('Get 4 active listings');
    });

    it('should include business plan context when provided', () => {
      const bp = createBusinessPlan();
      const context = createContext({ businessPlan: bp });
      const prompt = buildDailyActionPrompt(context);
      expect(prompt).toContain('Revenue Target');
    });
  });

  describe('VALIDATION_PROMPT', () => {
    it('should exist and include validation rules', () => {
      expect(VALIDATION_PROMPT).toBeDefined();
      expect(VALIDATION_PROMPT).toContain('validator');
      expect(VALIDATION_PROMPT).toContain('More than one question');
      expect(VALIDATION_PROMPT).toContain('Urgency language');
      expect(VALIDATION_PROMPT).toContain('Banned words');
    });

    it('should specify JSON output format', () => {
      expect(VALIDATION_PROMPT).toContain('"valid"');
      expect(VALIDATION_PROMPT).toContain('"violations"');
      expect(VALIDATION_PROMPT).toContain('"questionCount"');
    });
  });
});
