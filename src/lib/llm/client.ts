/**
 * RealCoach.ai - LLM Client with Smart Routing
 *
 * Provider-agnostic LLM client that supports Claude and OpenAI.
 * Routes requests through a secure server-side proxy to protect API keys.
 *
 * Routing Strategy (handled by proxy):
 * - COACHING, CALIBRATION, VISION → Claude Sonnet (quality)
 * - ACKNOWLEDGMENT, ACTION_GEN → GPT-4o-mini (cheap)
 */

import {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMMessage,
  CoachingContext,
  CoachingResponse,
  LLMError,
  TaskType,
} from './types';
import { buildSystemPrompt, buildDailyActionPrompt } from './prompts';
import { CoachMode, CoachingMove } from '@/types/coaching';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// PROXY CONFIGURATION
// ============================================================================

const LLM_PROXY_URL = '/api/llm';

// ============================================================================
// PROXY CLIENT
// ============================================================================

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function callProxy(
  messages: LLMMessage[],
  taskType: TaskType,
  options?: { temperature?: number; maxTokens?: number },
  stream?: boolean
): Promise<Response> {
  const token = await getAuthToken();

  if (!token) {
    throw new LLMError('Not authenticated', 'INVALID_CONFIG');
  }

  const response = await fetch(LLM_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      messages,
      taskType,
      stream,
      options,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    if (response.status === 401) {
      throw new LLMError('Unauthorized', 'INVALID_CONFIG', undefined, 401);
    }
    if (response.status === 429) {
      throw new LLMError('Rate limit exceeded', 'RATE_LIMIT', undefined, 429);
    }

    throw new LLMError(
      error.error || `API error: ${response.status}`,
      'API_ERROR',
      undefined,
      response.status
    );
  }

  return response;
}

// ============================================================================
// SMART ROUTING LLM CLIENT
// ============================================================================

export class LLMClient {
  private isAuthenticated: boolean = false;

  constructor() {
    // Check if we have a valid session
    this.checkAuth();
  }

  private async checkAuth(): Promise<void> {
    const token = await getAuthToken();
    this.isAuthenticated = !!token;
  }

  /**
   * Check if LLM is configured (user is authenticated)
   */
  isConfigured(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { claude: boolean; openai: boolean; primary: LLMProvider | null } {
    // Configuration is handled server-side now
    return {
      claude: true,
      openai: true,
      primary: 'claude',
    };
  }

  /**
   * Generate a raw LLM response with task-based routing
   */
  async generate(request: LLMRequest, taskType: TaskType = 'COACHING'): Promise<LLMResponse> {
    const response = await callProxy(request.messages, taskType, request.options);
    const data = await response.json();

    return {
      content: data.content || '',
      model: data.model,
    };
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

    try {
      const systemPrompt = buildSystemPrompt(context);

      const messages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        ...context.recentMessages,
        { role: 'user', content: userMessage },
      ];

      const response = await callProxy(messages, taskType);
      const data = await response.json();
      const content = data.content || '';

      // Validate the response
      const validation = this.validateResponse(content, context.currentMode);

      return {
        message: content,
        suggestedMode: this.inferNextMode(userMessage, content, context),
        suggestedMove: this.detectCoachingMove(userMessage),
        detectedSignals: this.detectSignals(userMessage),
        questionsAsked: validation.questionCount,
        policyViolations: validation.violations,
      };
    } catch (error) {
      // Return mock response if proxy fails
      if (error instanceof LLMError && error.code === 'INVALID_CONFIG') {
        return {
          message: getMockCoachingResponse(userMessage),
          questionsAsked: 1,
          policyViolations: [],
        };
      }
      throw error;
    }
  }

  /**
   * Generate a streaming coaching response with context and rules enforcement
   */
  async *generateCoachingResponseStream(
    userMessage: string,
    context: CoachingContext
  ): AsyncGenerator<{ chunk: string; done: boolean }, CoachingResponse, unknown> {
    const taskType = this.inferTaskType(userMessage, context);

    let fullContent = '';

    try {
      const systemPrompt = buildSystemPrompt(context);

      const messages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        ...context.recentMessages,
        { role: 'user', content: userMessage },
      ];

      const response = await callProxy(messages, taskType, undefined, true);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new LLMError('No response body', 'API_ERROR');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr && jsonStr !== '[DONE]') {
              try {
                const data = JSON.parse(jsonStr);
                if (data.text) {
                  fullContent += data.text;
                  yield { chunk: data.text, done: false };
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
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
    } catch (error) {
      // Return mock response as single chunk if proxy fails
      if (error instanceof LLMError && error.code === 'INVALID_CONFIG') {
        const mock = getMockCoachingResponse(userMessage);
        yield { chunk: mock, done: true };
        return {
          message: mock,
          questionsAsked: (mock.match(/\?/g) || []).length,
          policyViolations: [],
        };
      }
      throw error;
    }
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
   */
  async generateDailyActions(
    context: CoachingContext,
    checkInResponse?: string
  ): Promise<{
    primary: { title: string; description: string; minimumViable: string; milestoneConnection: string };
    supporting: Array<{ title: string; description: string; purpose: string }>;
  }> {
    try {
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

      const response = await callProxy(messages, 'ACTION_GEN', { temperature: 0.3 });
      const data = await response.json();
      const content = data.content || '';

      // Parse JSON from response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse daily actions JSON:', e);
      }
    } catch (error) {
      console.error('Failed to generate daily actions:', error);
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
   * Analyze a screenshot - currently requires direct API access
   * TODO: Add vision support to proxy
   */
  async analyzeScreenshot(
    imageBase64: string,
    contextPrompt?: string
  ): Promise<{ description: string; suggestedAction?: string; insights: string[] }> {
    console.warn('[LLM Client] Vision analysis not yet supported through proxy');
    return {
      description: 'Screenshot analysis is temporarily unavailable.',
      insights: [],
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

    switch (currentMode) {
      case 'CLARIFY':
        if (userMessage.length > 50) {
          return 'REFLECT';
        }
        break;
      case 'REFLECT':
        if (/yes|that's right|correct|exactly/i.test(userMessage)) {
          return 'COMMIT';
        }
        break;
      case 'COMMIT':
        if (/yes|okay|sounds good|i'll do/i.test(userMessage)) {
          return 'DIRECT';
        }
        break;
      case 'DIRECT':
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

    const overwhelmPatterns = [/too many/i, /don't know where to start/i, /everything/i, /so much/i, /overwhelm/i];
    if (overwhelmPatterns.some(p => p.test(lower))) {
      return 'FOCUS';
    }

    const agencyPatterns = [/can't control/i, /nothing i can do/i, /out of my hands/i, /they won't/i, /people don't/i];
    if (agencyPatterns.some(p => p.test(lower))) {
      return 'AGENCY';
    }

    const identityPatterns = [/i'm not the type/i, /just who i am/i, /always been this way/i, /not disciplined/i, /i'm bad at/i];
    if (identityPatterns.some(p => p.test(lower))) {
      return 'IDENTITY';
    }

    const easePatterns = [/know what to do/i, /can't get myself/i, /keep putting off/i, /feels heavy/i, /just can't start/i];
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

export function getLLMClient(): LLMClient {
  if (!clientInstance) {
    clientInstance = new LLMClient();
  }
  return clientInstance;
}

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
