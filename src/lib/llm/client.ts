/**
 * RealCoach.ai - LLM Client with Smart Routing
 *
 * Provider-agnostic LLM client that supports Claude and OpenAI.
 * Routes requests to appropriate models based on task type for cost optimization.
 *
 * Routing Strategy:
 * - COACHING, CALIBRATION, VISION → Claude Sonnet (quality)
 * - ACKNOWLEDGMENT, ACTION_GEN → GPT-4o-mini (cheap)
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
  TaskType,
} from './types';
import { ClaudeAdapter, generateWithVision } from './claude-adapter';
import { OpenAIAdapter } from './openai-adapter';
import { buildSystemPrompt, buildDailyActionPrompt } from './prompts';
import { CoachMode, CoachingMove } from '@/types/coaching';

// ============================================================================
// ROUTING CONFIGURATION
// ============================================================================

interface ModelRoute {
  provider: LLMProvider;
  model: string;
}

const ROUTE_CONFIG: Record<TaskType, ModelRoute> = {
  // Quality tasks → Claude Sonnet
  COACHING: { provider: 'claude', model: 'claude-sonnet-4-20250514' },
  CALIBRATION: { provider: 'claude', model: 'claude-sonnet-4-20250514' },
  VISION: { provider: 'claude', model: 'claude-sonnet-4-20250514' },
  // Cost-optimized tasks → GPT-4o-mini
  ACKNOWLEDGMENT: { provider: 'openai', model: 'gpt-4o-mini' },
  ACTION_GEN: { provider: 'openai', model: 'gpt-4o-mini' },
};

// ============================================================================
// SMART ROUTING LLM CLIENT
// ============================================================================

export class LLMClient {
  private claudeAdapter: LLMAdapter | null = null;
  private openaiAdapter: LLMAdapter | null = null;
  private fallbackProvider: LLMProvider | null = null;

  constructor() {
    // Initialize adapters based on available API keys
    const claudeKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (claudeKey && !claudeKey.includes('YOUR_')) {
      this.claudeAdapter = new ClaudeAdapter({
        provider: 'claude',
        apiKey: claudeKey,
      });
      this.fallbackProvider = 'claude';
    }

    if (openaiKey && !openaiKey.includes('YOUR_')) {
      this.openaiAdapter = new OpenAIAdapter({
        provider: 'openai',
        apiKey: openaiKey,
      });
      if (!this.fallbackProvider) {
        this.fallbackProvider = 'openai';
      }
    }

    // Log routing status
    console.log('[LLM Client] Initialized with:', {
      claude: !!this.claudeAdapter,
      openai: !!this.openaiAdapter,
      fallback: this.fallbackProvider,
    });
  }

  /**
   * Get the appropriate adapter for a task type
   */
  private getAdapterForTask(taskType: TaskType): { adapter: LLMAdapter; model: string } | null {
    const route = ROUTE_CONFIG[taskType];

    // Try preferred provider first
    if (route.provider === 'claude' && this.claudeAdapter) {
      return { adapter: this.claudeAdapter, model: route.model };
    }
    if (route.provider === 'openai' && this.openaiAdapter) {
      return { adapter: this.openaiAdapter, model: route.model };
    }

    // Fallback to available provider
    if (this.claudeAdapter) {
      console.log(`[LLM Router] Falling back to Claude for ${taskType}`);
      return { adapter: this.claudeAdapter, model: 'claude-sonnet-4-20250514' };
    }
    if (this.openaiAdapter) {
      // Use gpt-4o for quality tasks (coaching, calibration, vision), gpt-4o-mini for cost-optimized tasks
      const qualityTasks: TaskType[] = ['COACHING', 'CALIBRATION', 'VISION'];
      const fallbackModel = qualityTasks.includes(taskType) ? 'gpt-4o' : 'gpt-4o-mini';
      console.log(`[LLM Router] Falling back to OpenAI (${fallbackModel}) for ${taskType}`);
      return { adapter: this.openaiAdapter, model: fallbackModel };
    }

    return null;
  }

  /**
   * Check if any LLM provider is configured
   */
  isConfigured(): boolean {
    return !!(this.claudeAdapter || this.openaiAdapter);
  }

  /**
   * Get detailed configuration status for debugging/UI
   */
  getConfigStatus(): { claude: boolean; openai: boolean; primary: LLMProvider | null } {
    return {
      claude: !!this.claudeAdapter,
      openai: !!this.openaiAdapter,
      primary: this.claudeAdapter ? 'claude' : this.openaiAdapter ? 'openai' : null,
    };
  }

  /**
   * Generate a raw LLM response with task-based routing
   */
  async generate(request: LLMRequest, taskType: TaskType = 'COACHING'): Promise<LLMResponse> {
    const routeInfo = this.getAdapterForTask(taskType);

    if (!routeInfo) {
      throw new LLMError('No LLM provider configured', 'INVALID_CONFIG');
    }

    console.log(`[LLM Router] ${taskType} → ${routeInfo.adapter.provider} (${routeInfo.model})`);

    return routeInfo.adapter.generate(request);
  }

  /**
   * Generate a coaching response with context and rules enforcement
   */
  async generateCoachingResponse(
    userMessage: string,
    context: CoachingContext
  ): Promise<CoachingResponse> {
    // Determine task type based on context
    const taskType = this.inferTaskType(userMessage, context);
    const routeInfo = this.getAdapterForTask(taskType);

    if (!routeInfo) {
      // Return mock response if no provider configured
      return {
        message: getMockCoachingResponse(userMessage),
        questionsAsked: 1,
        policyViolations: [],
      };
    }

    console.log(`[LLM Router] Coaching (${taskType}) → ${routeInfo.adapter.provider}`);

    const systemPrompt = buildSystemPrompt(context);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...context.recentMessages,
      { role: 'user', content: userMessage },
    ];

    const response = await routeInfo.adapter.generate({ messages });

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
   * Generate a streaming coaching response with context and rules enforcement
   * Yields chunks as they arrive, then returns full response metadata at the end
   */
  async *generateCoachingResponseStream(
    userMessage: string,
    context: CoachingContext
  ): AsyncGenerator<{ chunk: string; done: boolean }, CoachingResponse, unknown> {
    // Determine task type based on context
    const taskType = this.inferTaskType(userMessage, context);
    const routeInfo = this.getAdapterForTask(taskType);

    if (!routeInfo || !routeInfo.adapter.generateStream) {
      // Return mock response as single chunk if no streaming support
      const mock = getMockCoachingResponse(userMessage);
      yield { chunk: mock, done: true };
      return {
        message: mock,
        questionsAsked: (mock.match(/\?/g) || []).length,
        policyViolations: [],
      };
    }

    console.log(`[LLM Router] Streaming Coaching (${taskType}) → ${routeInfo.adapter.provider}`);

    const systemPrompt = buildSystemPrompt(context);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...context.recentMessages,
      { role: 'user', content: userMessage },
    ];

    let fullContent = '';

    try {
      for await (const chunk of routeInfo.adapter.generateStream({ messages })) {
        fullContent += chunk;
        yield { chunk, done: false };
      }
    } catch (error) {
      // On error, yield error info and return partial response
      console.error('[LLM Stream] Error during streaming:', error);
      throw error;
    }

    // Signal completion
    yield { chunk: '', done: true };

    // Validate the full response
    const validation = this.validateResponse(fullContent, context.currentMode);

    return {
      message: fullContent,
      suggestedMode: this.inferNextMode(userMessage, fullContent, context),
      suggestedMove: this.detectCoachingMove(userMessage),
      detectedSignals: this.detectSignals(userMessage),
      questionsAsked: validation.questionCount,
      policyViolations: validation.violations,
    };
  }

  /**
   * Infer task type from message and context
   */
  private inferTaskType(userMessage: string, context: CoachingContext): TaskType {
    const lower = userMessage.toLowerCase();

    // Simple acknowledgments
    const ackPatterns = [
      /^(ok|okay|got it|thanks|thank you|yes|no|sure|sounds good)\.?$/i,
      /^(cool|great|perfect|alright|fine)\.?$/i,
    ];
    if (ackPatterns.some(p => p.test(lower.trim()))) {
      return 'ACKNOWLEDGMENT';
    }

    // Calibration mode
    if (context.currentMode === 'CLARIFY' && !context.goalsAndActions) {
      return 'CALIBRATION';
    }

    // Default to coaching
    return 'COACHING';
  }

  /**
   * Generate daily actions based on user's goals
   * Uses cheaper model (GPT-4o-mini) for structured output
   */
  async generateDailyActions(
    context: CoachingContext,
    checkInResponse?: string
  ): Promise<{
    primary: { title: string; description: string; minimumViable: string; milestoneConnection: string };
    supporting: Array<{ title: string; description: string; purpose: string }>;
  }> {
    const routeInfo = this.getAdapterForTask('ACTION_GEN');

    if (!routeInfo) {
      // Return mock actions if no provider configured
      return {
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
      };
    }

    console.log(`[LLM Router] Action generation → ${routeInfo.adapter.provider} (${routeInfo.model})`);

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

    const response = await routeInfo.adapter.generate({
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
   * Analyze a screenshot and extract context for coaching
   * Uses Claude Vision for high-quality image understanding
   */
  async analyzeScreenshot(
    imageBase64: string,
    contextPrompt?: string
  ): Promise<{ description: string; suggestedAction?: string; insights: string[] }> {
    const claudeKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (!claudeKey || claudeKey.includes('YOUR_')) {
      console.warn('[LLM Client] No Claude API key for vision analysis');
      return {
        description: 'Screenshot uploaded but analysis unavailable without Claude API key.',
        insights: [],
      };
    }

    const prompt = contextPrompt || `You are a coaching assistant for a real estate agent. Analyze this screenshot and provide:

1. A brief description of what you see (1-2 sentences)
2. If relevant, a suggested action the agent could take based on this content
3. 2-3 key insights or observations

Focus on information relevant to their real estate business - contacts, leads, property details, CRM data, email content, calendar items, etc.

Respond in this JSON format:
{
  "description": "Brief description of the screenshot content",
  "suggestedAction": "Optional suggested action if applicable",
  "insights": ["Insight 1", "Insight 2", "Insight 3"]
}`;

    try {
      console.log('[LLM Router] Screenshot analysis → Claude Vision');

      const response = await generateWithVision(claudeKey, prompt, imageBase64);

      // Parse JSON from response
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse vision response JSON:', e);
      }

      // Fallback: return raw response as description
      return {
        description: response,
        insights: [],
      };
    } catch (error) {
      console.error('[LLM Client] Vision analysis failed:', error);
      return {
        description: 'Failed to analyze screenshot. Please try again.',
        insights: [],
      };
    }
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
    clientInstance = new LLMClient();
  }
  return clientInstance;
}

/**
 * Reset the client instance (useful for testing or key updates)
 */
export function resetLLMClient(): void {
  clientInstance = null;
}

// ============================================================================
// MOCK RESPONSES (for development without API keys)
// ============================================================================

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
