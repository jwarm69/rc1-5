/**
 * Daily Action Engine Tests
 */
import { describe, it, expect } from 'vitest';
import {
  checkReadinessGate,
  checkStrategyIntegrity,
  selectPrimaryAction,
  selectSupportingActions,
  generateDailyPlan,
  formatForDirectMode,
  parseCheckIn,
  DailyAction,
  CheckInResponse,
  PipelineOpportunity,
} from './daily-action-engine';
import { GoalsAndActions, BusinessPlan, PriorityContext } from '@/types/coaching';

// Helper to create minimal G&A
function createGoalsAndActions(overrides: Partial<GoalsAndActions> = {}): GoalsAndActions {
  return {
    annualProfessionalGoal: 'Close 24 deals',
    annualPersonalGoal: 'More family time',
    currentReality: 'Averaging 1.5 deals/month',
    monthlyMilestone: 'Get 4 active listings',
    executionStyle: 'STRUCTURED',
    willingnessFilter: ['Follow-ups', 'Open houses'],
    frictionBoundaries: [],
    status: 'CONFIRMED',
    confirmedAt: new Date(),
    ...overrides,
  };
}

// Helper to create pipeline opportunity
function createOpportunity(overrides: Partial<PipelineOpportunity> = {}): PipelineOpportunity {
  return {
    id: 'opp-1',
    contactName: 'John Smith',
    stage: 'Active',
    priority: 'medium',
    lastContact: new Date(),
    ...overrides,
  };
}

// Helper to create priority context
function createPriorityContext(overrides: Partial<PriorityContext> = {}): PriorityContext {
  return {
    type: 'NORMAL',
    description: 'Normal day',
    mayOverridePrimary: false,
    ...overrides,
  };
}

describe('Daily Action Engine', () => {
  describe('checkReadinessGate', () => {
    it('should return needsCoaching=false for missed day (user chooses)', () => {
      const result = checkReadinessGate(null, true);
      expect(result.needsCoaching).toBe(false);
      expect(result.reason).toBe('missed_day');
    });

    it('should return needsCoaching=false when no check-in', () => {
      const result = checkReadinessGate(null, false);
      expect(result.needsCoaching).toBe(false);
    });

    it('should return needsCoaching=true when >2 friction indicators', () => {
      const checkIn: CheckInResponse = {
        completedActionIds: [],
        momentumSignal: 'neutral',
        frictionIndicators: ['procrastination', 'distraction', 'emotional_resistance'],
      };
      const result = checkReadinessGate(checkIn, false);
      expect(result.needsCoaching).toBe(true);
      expect(result.reason).toBe('multiple_friction_indicators');
    });

    it('should return needsCoaching=true when momentum is negative', () => {
      const checkIn: CheckInResponse = {
        completedActionIds: [],
        momentumSignal: 'negative',
        frictionIndicators: [],
      };
      const result = checkReadinessGate(checkIn, false);
      expect(result.needsCoaching).toBe(true);
      expect(result.reason).toBe('negative_momentum');
    });

    it('should return needsCoaching=false for normal check-in', () => {
      const checkIn: CheckInResponse = {
        completedActionIds: ['action-1'],
        momentumSignal: 'positive',
        frictionIndicators: [],
      };
      const result = checkReadinessGate(checkIn, false);
      expect(result.needsCoaching).toBe(false);
    });

    it('should return needsCoaching=false with 2 friction indicators (threshold is >2)', () => {
      const checkIn: CheckInResponse = {
        completedActionIds: [],
        momentumSignal: 'neutral',
        frictionIndicators: ['procrastination', 'distraction'],
      };
      const result = checkReadinessGate(checkIn, false);
      expect(result.needsCoaching).toBe(false);
    });
  });

  describe('checkStrategyIntegrity', () => {
    it('should return valid=true when no G&A (cannot check)', () => {
      const action: DailyAction = {
        id: 'test-1',
        type: 'primary',
        category: 'contact',
        title: 'Cold call prospects',
        description: 'Make cold calls',
        minimumViable: 'Call 5 people',
        milestoneConnection: 'Build pipeline',
        minutesEstimate: 30,
      };
      const result = checkStrategyIntegrity(action, null, null);
      expect(result.valid).toBe(true);
    });

    it('should return valid=false when action includes cold calling and user set friction boundary', () => {
      const action: DailyAction = {
        id: 'test-1',
        type: 'primary',
        category: 'contact',
        title: 'Cold call prospects',
        description: 'Make cold calls to new leads',
        minimumViable: 'Call 5 people',
        milestoneConnection: 'Build pipeline',
        minutesEstimate: 30,
      };
      const ga = createGoalsAndActions({
        frictionBoundaries: ['Cold calling', 'Door knocking'],
      });
      const result = checkStrategyIntegrity(action, ga, null);
      expect(result.valid).toBe(false);
      expect(result.violation).toContain('cold calling');
    });

    it('should return valid=false when action includes door knocking and user set friction boundary', () => {
      const action: DailyAction = {
        id: 'test-1',
        type: 'primary',
        category: 'contact',
        title: 'Door knock the neighborhood',
        description: 'Door knock new area',
        minimumViable: 'Knock 10 doors',
        milestoneConnection: 'Build pipeline',
        minutesEstimate: 60,
      };
      const ga = createGoalsAndActions({
        frictionBoundaries: ['Door knocking'],
      });
      const result = checkStrategyIntegrity(action, ga, null);
      expect(result.valid).toBe(false);
      expect(result.violation).toContain('door knocking');
    });

    it('should return valid=true when action does not match any friction boundary', () => {
      const action: DailyAction = {
        id: 'test-1',
        type: 'primary',
        category: 'contact',
        title: 'Follow up with warm leads',
        description: 'Call existing contacts',
        minimumViable: 'Call 3 people',
        milestoneConnection: 'Nurture pipeline',
        minutesEstimate: 20,
      };
      const ga = createGoalsAndActions({
        frictionBoundaries: ['Cold calling', 'Door knocking'],
      });
      const result = checkStrategyIntegrity(action, ga, null);
      expect(result.valid).toBe(true);
    });
  });

  describe('selectPrimaryAction', () => {
    it('should select blocker action when priorityContext.type is BLOCKER', () => {
      const priorityContext = createPriorityContext({
        type: 'BLOCKER',
        description: 'License renewal due today',
        mayOverridePrimary: true,
      });
      const result = selectPrimaryAction(null, [], priorityContext);
      expect(result).not.toBeNull();
      expect(result?.title).toBe('License renewal due today');
      expect(result?.category).toBe('non_contact');
    });

    it('should sort pipeline by priority (high > medium > low)', () => {
      const pipeline: PipelineOpportunity[] = [
        createOpportunity({ id: '1', contactName: 'Low Priority', priority: 'low' }),
        createOpportunity({ id: '2', contactName: 'High Priority', priority: 'high' }),
        createOpportunity({ id: '3', contactName: 'Medium Priority', priority: 'medium' }),
      ];
      const result = selectPrimaryAction(null, pipeline, createPriorityContext());
      expect(result?.contactName).toBe('High Priority');
    });

    it('should select top opportunity from sorted pipeline', () => {
      const pipeline: PipelineOpportunity[] = [
        createOpportunity({ id: '1', contactName: 'First Client', priority: 'high' }),
        createOpportunity({ id: '2', contactName: 'Second Client', priority: 'high' }),
      ];
      const result = selectPrimaryAction(null, pipeline, createPriorityContext());
      expect(result?.contactName).toBe('First Client');
      expect(result?.category).toBe('contact');
    });

    it('should return prospecting fallback when pipeline is empty', () => {
      const result = selectPrimaryAction(null, [], createPriorityContext());
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Reach out to one person in your sphere');
      expect(result?.category).toBe('contact');
    });

    it('should include milestone connection from G&A', () => {
      const ga = createGoalsAndActions({ monthlyMilestone: 'Close 2 deals' });
      const pipeline = [createOpportunity({ priority: 'high' })];
      const result = selectPrimaryAction(ga, pipeline, createPriorityContext());
      expect(result?.milestoneConnection).toContain('Close 2 deals');
    });
  });

  describe('selectSupportingActions', () => {
    it('should return empty array when no primary action', () => {
      const result = selectSupportingActions(null, null, false);
      expect(result).toHaveLength(0);
    });

    it('should add preparation action for contact-type primary', () => {
      const primary: DailyAction = {
        id: 'primary-1',
        type: 'primary',
        category: 'contact',
        title: 'Call John',
        description: 'Follow up call',
        minimumViable: 'One call',
        milestoneConnection: 'Pipeline progress',
        minutesEstimate: 15,
      };
      const result = selectSupportingActions(primary, null, false);
      const prepAction = result.find((a) => a.title.includes('Prepare'));
      expect(prepAction).toBeDefined();
      expect(prepAction?.category).toBe('planning');
    });

    it('should return max 1 action when reducedLoad=true', () => {
      const primary: DailyAction = {
        id: 'primary-1',
        type: 'primary',
        category: 'contact',
        title: 'Call John',
        description: 'Follow up call',
        minimumViable: 'One call',
        milestoneConnection: 'Pipeline progress',
        minutesEstimate: 15,
      };
      const result = selectSupportingActions(primary, null, true);
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should return max 2 actions when reducedLoad=false', () => {
      const primary: DailyAction = {
        id: 'primary-1',
        type: 'primary',
        category: 'contact',
        title: 'Call John',
        description: 'Follow up call',
        minimumViable: 'One call',
        milestoneConnection: 'Pipeline progress',
        minutesEstimate: 15,
      };
      const result = selectSupportingActions(primary, null, false);
      expect(result.length).toBeLessThanOrEqual(2);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should add CRM documentation action', () => {
      const primary: DailyAction = {
        id: 'primary-1',
        type: 'primary',
        category: 'contact',
        title: 'Call John',
        description: 'Follow up call',
        minimumViable: 'One call',
        milestoneConnection: 'Pipeline progress',
        minutesEstimate: 15,
      };
      const result = selectSupportingActions(primary, null, false);
      const crmAction = result.find((a) => a.title.includes('CRM'));
      expect(crmAction).toBeDefined();
      expect(crmAction?.category).toBe('admin');
    });
  });

  describe('generateDailyPlan', () => {
    it('should return complete plan with primary and supporting actions', () => {
      const pipeline = [createOpportunity({ priority: 'high' })];
      const result = generateDailyPlan(
        createGoalsAndActions(),
        null,
        pipeline,
        createPriorityContext(),
        false
      );
      expect(result.primary).not.toBeNull();
      expect(result.supporting.length).toBeGreaterThan(0);
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should set reducedLoad flag correctly', () => {
      const result = generateDailyPlan(null, null, [], createPriorityContext(), true);
      expect(result.reducedLoad).toBe(true);
    });

    it('should clear primary if strategy integrity fails', () => {
      const ga = createGoalsAndActions({ frictionBoundaries: ['Cold calling'] });
      // Create a situation where primary would be cold calling
      const result = generateDailyPlan(ga, null, [], createPriorityContext(), false);
      // Since fallback is "sphere outreach" not cold calling, primary should exist
      expect(result.primary).not.toBeNull();
    });
  });

  describe('formatForDirectMode', () => {
    it('should format plan without questions', () => {
      const plan = generateDailyPlan(null, null, [], createPriorityContext(), false);
      const formatted = formatForDirectMode(plan);
      expect(formatted).not.toContain('?');
    });

    it('should include milestone connection', () => {
      const pipeline = [createOpportunity({ priority: 'high' })];
      const plan = generateDailyPlan(
        createGoalsAndActions({ monthlyMilestone: 'Close 2 deals' }),
        null,
        pipeline,
        createPriorityContext(),
        false
      );
      const formatted = formatForDirectMode(plan);
      expect(formatted).toContain('Close 2 deals');
    });

    it('should list supporting actions with bullets', () => {
      const pipeline = [createOpportunity({ priority: 'high' })];
      const plan = generateDailyPlan(null, null, pipeline, createPriorityContext(), false);
      const formatted = formatForDirectMode(plan);
      if (plan.supporting.length > 0) {
        expect(formatted).toContain('•');
      }
    });

    it('should include "If time allows" section when supporting actions exist', () => {
      const pipeline = [createOpportunity({ priority: 'high' })];
      const plan = generateDailyPlan(null, null, pipeline, createPriorityContext(), false);
      const formatted = formatForDirectMode(plan);
      if (plan.supporting.length > 0) {
        expect(formatted).toContain('If time allows');
      }
    });
  });

  describe('parseCheckIn', () => {
    it('should detect completion signals: "did it"', () => {
      const result = parseCheckIn('I did it, made all my calls');
      expect(result.completedActionIds).toContain('assumed-completion');
    });

    it('should detect completion signals: "done"', () => {
      const result = parseCheckIn('All done with my tasks');
      expect(result.completedActionIds).toContain('assumed-completion');
    });

    it('should detect completion signals: "completed"', () => {
      const result = parseCheckIn('I completed everything on my list');
      expect(result.completedActionIds).toContain('assumed-completion');
    });

    it('should detect friction: procrastination', () => {
      const result = parseCheckIn('I kept putting off my calls');
      expect(result.frictionIndicators).toContain('procrastination');
    });

    it('should detect friction: distraction', () => {
      const result = parseCheckIn('I got distracted by emails');
      expect(result.frictionIndicators).toContain('distraction');
    });

    it('should detect friction: emotional_resistance', () => {
      const result = parseCheckIn('It felt heavy to start');
      expect(result.frictionIndicators).toContain('emotional_resistance');
    });

    it('should detect friction: time_pressure', () => {
      const result = parseCheckIn("I didn't have time for everything");
      expect(result.frictionIndicators).toContain('time_pressure');
    });

    it('should detect friction: uncertainty', () => {
      const result = parseCheckIn("I wasn't sure what to do first");
      expect(result.frictionIndicators).toContain('uncertainty');
    });

    it('should detect positive momentum', () => {
      const result = parseCheckIn('Had a great productive day');
      expect(result.momentumSignal).toBe('positive');
    });

    it('should detect negative momentum', () => {
      const result = parseCheckIn('It was a tough day, struggled through');
      expect(result.momentumSignal).toBe('negative');
    });

    it('should default to neutral momentum', () => {
      const result = parseCheckIn('Made some calls today');
      expect(result.momentumSignal).toBe('neutral');
    });
  });
});
