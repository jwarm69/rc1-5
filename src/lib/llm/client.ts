/**
 * RealCoach.ai - LLM Client
 *
 * Provider-agnostic LLM client that supports Claude and OpenAI.
 * Handles coaching response generation with behavior rules enforcement.
 */

import {
  LLMProvider,
  LLMConfig,
  LLMAdapter,
  LLMRequest,
  LLMResponse,
  LLMMessage,
  CoachingContext,
  CoachingResponse,
  LLMError,
} from './types';
import { ClaudeAdapter } from './claude-adapter';
import { OpenAIAdapter } from './openai-adapter';
import { buildSystemPrompt, buildDailyActionPrompt } from './prompts';
import { CoachMode, CoachingMove } from '@/types/coaching';

// ============================================================================
// LLM CLIENT
// ============================================================================

export class LLMClient {
  private adapter: LLMAdapter;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.adapter = this.createAdapter(config);
  }

  private createAdapter(config: LLMConfig): LLMAdapter {
    switch (config.provider) {
      case 'claude':
        return new ClaudeAdapter(config);
      case 'openai':
        return new OpenAIAdapter(config);
      default:
        throw new LLMError(
          `Unknown provider: ${config.provider}`,
          'INVALID_CONFIG'
        );
    }
  }

  /**
   * Switch to a different LLM provider
   */
  setProvider(provider: LLMProvider, apiKey?: string): void {
    this.config = {
      ...this.config,
      provider,
      apiKey: apiKey || this.config.apiKey,
    };
    this.adapter = this.createAdapter(this.config);
  }

  /**
   * Generate a raw LLM response
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    return this.adapter.generate(request);
  }

  /**
   * Generate a coaching response with context and rules enforcement
   */
  async generateCoachingResponse(
    userMessage: string,
    context: CoachingContext
  ): Promise<CoachingResponse> {
    const systemPrompt = buildSystemPrompt(context);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...context.recentMessages,
      { role: 'user', content: userMessage },
    ];

    const response = await this.adapter.generate({ messages });

    // Validate the response
    const validation = this.validateResponse(response.content, context.currentMode);

    return {
      message: response.content,
      suggestedMode: this.inferNextMode(userMessage, response.content, context),
      suggestedMove: this.detectCoachingMove(userMessage),
      detectedSignals: this.detectSignals(userMessage),
      questionsAsked: validation.questionCount,
      policyViolations: validation.violations,
    };
  }

  /**
   * Generate daily actions based on user's goals
   */
  async generateDailyActions(
    context: CoachingContext,
    checkInResponse?: string
  ): Promise<{
    primary: { title: string; description: string; minimumViable: string; milestoneConnection: string };
    supporting: Array<{ title: string; description: string; purpose: string }>;
  }> {
    const systemPrompt = buildDailyActionPrompt(context);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (checkInResponse) {
      messages.push({
        role: 'user',
        content: `Yesterday's update: ${checkInResponse}\n\nGenerate today's actions.`,
      });
    } else {
      messages.push({
        role: 'user',
        content: 'Generate today\'s actions.',
      });
    }

    const response = await this.adapter.generate({
      messages,
      options: { temperature: 0.3 }, // Lower temperature for structured output
    });

    // Parse JSON from response
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse daily actions JSON:', e);
    }

    // Fallback structure
    return {
      primary: {
        title: 'Review and prioritize your pipeline',
        description: 'Spend 15 minutes reviewing your active opportunities',
        minimumViable: 'Open pipeline and identify top 3 priorities',
        milestoneConnection: 'Keeps you focused on highest-value activities',
      },
      supporting: [],
    };
  }

  /**
   * Validate response against coaching rules
   */
  private validateResponse(
    content: string,
    mode: CoachMode
  ): { valid: boolean; violations: string[]; questionCount: number } {
    const violations: string[] = [];

    // Count questions
    const questionCount = (content.match(/\?/g) || []).length;

    // Rule 1: Max one question
    if (questionCount > 1) {
      violations.push(`Multiple questions (${questionCount}) - only 1 allowed`);
    }

    // Rule 2: No questions in DIRECT or REFRAME mode
    if ((mode === 'DIRECT' || mode === 'REFRAME') && questionCount > 0) {
      violations.push(`Questions not allowed in ${mode} mode`);
    }

    // Rule 3: Check for banned words
    const bannedWords = ['crush', 'hustle', 'grind', 'empower', 'synergy', 'game-changer', 'disrupt'];
    const lowerContent = content.toLowerCase();
    for (const word of bannedWords) {
      if (lowerContent.includes(word)) {
        violations.push(`Banned word used: "${word}"`);
      }
    }

    // Rule 4: Check for urgency language
    const urgencyPatterns = [
      /don't miss/i,
      /limited time/i,
      /act now/i,
      /before it's too late/i,
      /urgent/i,
      /asap/i,
    ];
    for (const pattern of urgencyPatterns) {
      if (pattern.test(content)) {
        violations.push('Urgency language detected');
        break;
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      questionCount,
    };
  }

  /**
   * Infer the next coaching mode based on conversation
   */
  private inferNextMode(
    userMessage: string,
    response: string,
    context: CoachingContext
  ): CoachMode {
    const currentMode = context.currentMode;

    // Simple heuristics for mode transitions
    switch (currentMode) {
      case 'CLARIFY':
        // If user provided clear information, move to REFLECT
        if (userMessage.length > 50) {
          return 'REFLECT';
        }
        break;
      case 'REFLECT':
        // If response contained confirmation question and user confirmed
        if (/yes|that's right|correct|exactly/i.test(userMessage)) {
          return 'COMMIT';
        }
        break;
      case 'COMMIT':
        // If user agreed to commitment
        if (/yes|okay|sounds good|i'll do/i.test(userMessage)) {
          return 'DIRECT';
        }
        break;
      case 'DIRECT':
        // If user asks a new question, go to CLARIFY
        if (userMessage.includes('?')) {
          return 'CLARIFY';
        }
        break;
    }

    return currentMode;
  }

  /**
   * Detect which coaching move might be appropriate
   */
  private detectCoachingMove(userMessage: string): CoachingMove {
    const lower = userMessage.toLowerCase();

    // Check for overwhelm signals
    const overwhelmPatterns = [
      /too many/i,
      /don't know where to start/i,
      /everything/i,
      /so much/i,
      /overwhelm/i,
    ];
    if (overwhelmPatterns.some(p => p.test(lower))) {
      return 'FOCUS';
    }

    // Check for externalized control
    const agencyPatterns = [
      /can't control/i,
      /nothing i can do/i,
      /out of my hands/i,
      /they won't/i,
      /people don't/i,
    ];
    if (agencyPatterns.some(p => p.test(lower))) {
      return 'AGENCY';
    }

    // Check for self-story
    const identityPatterns = [
      /i'm not the type/i,
      /just who i am/i,
      /always been this way/i,
      /not disciplined/i,
      /i'm bad at/i,
    ];
    if (identityPatterns.some(p => p.test(lower))) {
      return 'IDENTITY';
    }

    // Check for resistance
    const easePatterns = [
      /know what to do/i,
      /can't get myself/i,
      /keep putting off/i,
      /feels heavy/i,
      /just can't start/i,
    ];
    if (easePatterns.some(p => p.test(lower))) {
      return 'EASE';
    }

    return 'NONE';
  }

  /**
   * Detect various signals in user message
   */
  private detectSignals(userMessage: string): CoachingResponse['detectedSignals'] {
    const lower = userMessage.toLowerCase();

    // Missed day patterns
    const missedDayPatterns = [
      'nothing got done',
      "didn't do anything",
      'blew the day',
      'fell off',
      'got nothing done',
      'completely forgot',
      'didn\'t happen',
    ];

    return {
      overwhelm: /too many|don't know where to start|everything|so much/i.test(lower),
      externalizedControl: /can't control|nothing i can do|out of my hands/i.test(lower),
      selfStory: /i'm not|just who i am|always been/i.test(lower),
      resistance: /know what to do|can't get myself|keep putting off/i.test(lower),
      missedDay: missedDayPatterns.some(p => lower.includes(p)),
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let clientInstance: LLMClient | null = null;

/**
 * Get or create the LLM client instance
 */
export function getLLMClient(): LLMClient {
  if (!clientInstance) {
    const provider = (import.meta.env.VITE_LLM_PROVIDER as LLMProvider) || 'claude';
    const apiKey = provider === 'claude'
      ? import.meta.env.VITE_ANTHROPIC_API_KEY
      : import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      console.warn('No LLM API key configured. Using mock responses.');
      // Return a mock client for development
      return createMockClient();
    }

    clientInstance = new LLMClient({
      provider,
      apiKey,
    });
  }

  return clientInstance;
}

/**
 * Create a mock client for development without API keys
 */
function createMockClient(): LLMClient {
  return {
    generate: async () => ({
      content: 'This is a mock response. Configure VITE_ANTHROPIC_API_KEY or VITE_OPENAI_API_KEY for real responses.',
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    }),
    generateCoachingResponse: async (userMessage: string) => ({
      message: getMockCoachingResponse(userMessage),
      questionsAsked: 1,
      policyViolations: [],
    }),
    generateDailyActions: async () => ({
      primary: {
        title: 'Focus on your top pipeline opportunity',
        description: 'Review and take one action on your most promising lead',
        minimumViable: 'Send one follow-up message',
        milestoneConnection: 'Keeps pipeline moving toward your monthly goal',
      },
      supporting: [
        {
          title: 'Update your CRM notes',
          description: 'Document recent conversations',
          purpose: 'Ensures nothing falls through the cracks',
        },
      ],
    }),
    setProvider: () => {},
  } as unknown as LLMClient;
}

function getMockCoachingResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('help') || lower.includes('?')) {
    return "What's the most important thing you'd like to focus on today?";
  }

  if (lower.includes('overwhelm') || lower.includes('too much')) {
    return "Sounds like there's a lot on your plate. Which one thing, if handled, would make the others easier?";
  }

  if (lower.includes('nothing') || lower.includes("didn't")) {
    return "Yesterday didn't go as planned. Would you like to spend 2 minutes unpacking what got in the way, or skip and move forward?";
  }

  return "Got it. What would help you move forward today?";
}
