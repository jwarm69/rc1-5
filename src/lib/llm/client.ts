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
  ContentBlock,
  VisionRequest,
  VisionResponse,
} from './types';
import { buildSystemPrompt, buildDailyActionPrompt, buildScreenshotInterpretationPrompt } from './prompts';
import { CoachMode, CoachingMove } from '@/types/coaching';
import { supabase } from '@/integrations/supabase/client';
import { ScreenshotInterpretation, ContentType } from '@/types/screenshot';

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
   * Interpret screenshot(s) using Claude Vision API
   * Returns a structured interpretation with detected content, people, dates, and patterns
   */
  async interpretScreenshot(
    request: VisionRequest
  ): Promise<ScreenshotInterpretation> {
    const { images, userIntent, context } = request;

    if (images.length === 0) {
      throw new LLMError('No images provided', 'INVALID_CONFIG');
    }

    // Build the system prompt for screenshot interpretation
    const systemPrompt = buildScreenshotInterpretationPrompt(userIntent, context);

    // Build content blocks with images and text
    const contentBlocks: ContentBlock[] = [];

    // Add all images
    for (const img of images) {
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mediaType,
          data: img.base64,
        },
      });
    }

    // Add the analysis request text
    contentBlocks.push({
      type: 'text',
      text: userIntent
        ? `The user says: "${userIntent}"\n\nAnalyze the screenshot(s) above and provide your interpretation.`
        : 'Analyze the screenshot(s) above and provide your interpretation.',
    });

    // Build messages for the API
    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: contentBlocks },
    ];

    try {
      // Call the proxy with VISION task type
      const response = await callProxy(messages, 'VISION', { maxTokens: 2048 });
      const data = await response.json();
      const rawAnalysis = data.content || '';

      // Parse the structured response from the LLM
      return this.parseInterpretationResponse(rawAnalysis, images.length);
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(
        error instanceof Error ? error.message : 'Vision analysis failed',
        'API_ERROR'
      );
    }
  }

  /**
   * Parse the LLM's raw analysis into a structured ScreenshotInterpretation
   */
  private parseInterpretationResponse(
    rawAnalysis: string,
    imageCount: number
  ): ScreenshotInterpretation {
    // Default values
    let contentType: ContentType = 'unknown';
    const summary: string[] = [];
    const peopleDetected: string[] = [];
    const datesDetected: string[] = [];
    const patterns: { type: string; description: string; severity: 'low' | 'medium' | 'high' }[] = [];
    let inferredIntent: string | undefined;
    let confidence = 0.7;

    try {
      // Try to parse as JSON first (if LLM returned structured response)
      const jsonMatch = rawAnalysis.match(/```json\n?([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          contentType: parsed.contentType || 'unknown',
          summary: parsed.summary || [],
          peopleDetected: parsed.peopleDetected || parsed.people || [],
          datesDetected: parsed.datesDetected || parsed.dates || [],
          patterns: parsed.patterns || [],
          inferredIntent: parsed.inferredIntent || parsed.intent,
          confidence: parsed.confidence || 0.7,
          rawAnalysis,
        };
      }

      // Parse unstructured response
      const lines = rawAnalysis.split('\n').filter(l => l.trim());

      // Extract content type
      const contentTypePatterns: { pattern: RegExp; type: ContentType }[] = [
        { pattern: /text (message|conversation)/i, type: 'text_conversation' },
        { pattern: /(whatsapp|instagram|facebook|dm|direct message)/i, type: 'social_dm' },
        { pattern: /email/i, type: 'email_thread' },
        { pattern: /calendar.*day/i, type: 'calendar_day' },
        { pattern: /calendar.*week/i, type: 'calendar_week' },
        { pattern: /notes?/i, type: 'notes' },
        { pattern: /(crm|contact.*list)/i, type: 'crm_list' },
        { pattern: /open house|sign.?in/i, type: 'open_house_signin' },
        { pattern: /spreadsheet|excel|sheet/i, type: 'spreadsheet' },
      ];

      for (const { pattern, type } of contentTypePatterns) {
        if (pattern.test(rawAnalysis)) {
          contentType = type;
          break;
        }
      }

      // Extract bullet points for summary
      const bulletRegex = /^[\s]*[-•*]\s*(.+)$/gm;
      let match;
      while ((match = bulletRegex.exec(rawAnalysis)) !== null && summary.length < 5) {
        summary.push(match[1].trim());
      }

      // If no bullets found, take first few sentences
      if (summary.length === 0) {
        const sentences = rawAnalysis.split(/[.!?]+/).filter(s => s.trim().length > 10);
        summary.push(...sentences.slice(0, 3).map(s => s.trim()));
      }

      // Extract names (capitalized words that look like names)
      const nameRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
      const excludedWords = new Set(['The', 'This', 'That', 'Here', 'There', 'What', 'When', 'Where', 'How', 'Why', 'I']);
      while ((match = nameRegex.exec(rawAnalysis)) !== null) {
        const name = match[1];
        if (!excludedWords.has(name) && !peopleDetected.includes(name)) {
          peopleDetected.push(name);
        }
      }

      // Extract dates
      const datePatterns = [
        /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g,
        /\b(\d{4}-\d{2}-\d{2})\b/g,
        /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?\b/gi,
        /\b(yesterday|today|tomorrow)\b/gi,
        /\b(\d{1,2}:\d{2}\s*(?:AM|PM)?)\b/gi,
      ];

      for (const pattern of datePatterns) {
        while ((match = pattern.exec(rawAnalysis)) !== null) {
          if (!datesDetected.includes(match[1])) {
            datesDetected.push(match[1]);
          }
        }
      }

      // Detect patterns
      if (/gap|haven't responded|no reply|waiting/i.test(rawAnalysis)) {
        patterns.push({
          type: 'response_gap',
          description: 'Gap in conversation detected',
          severity: 'medium',
        });
      }
      if (/overload|busy|packed|full/i.test(rawAnalysis)) {
        patterns.push({
          type: 'calendar_overload',
          description: 'Schedule appears overloaded',
          severity: 'medium',
        });
      }
      if (/urgent|asap|immediately/i.test(rawAnalysis)) {
        patterns.push({
          type: 'urgency_signal',
          description: 'Urgency detected',
          severity: 'high',
        });
      }

      // Extract inferred intent
      const intentMatch = rawAnalysis.match(/(?:intent|want|looking for|help with)[:\s]+([^.!?]+)/i);
      if (intentMatch) {
        inferredIntent = intentMatch[1].trim();
      }

    } catch (error) {
      console.error('Error parsing interpretation response:', error);
    }

    return {
      id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentType,
      summary: summary.length > 0 ? summary : ['Unable to extract summary from screenshot'],
      peopleDetected,
      datesDetected,
      patterns,
      inferredIntent,
      confidence,
      rawAnalysis,
    };
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use interpretScreenshot instead
   */
  async analyzeScreenshot(
    imageBase64: string,
    contextPrompt?: string
  ): Promise<{ description: string; suggestedAction?: string; insights: string[] }> {
    try {
      const interpretation = await this.interpretScreenshot({
        images: [{ base64: imageBase64, mediaType: 'image/png' }],
        userIntent: contextPrompt,
      });

      return {
        description: interpretation.summary.join(' '),
        suggestedAction: interpretation.inferredIntent,
        insights: interpretation.patterns.map(p => p.description),
      };
    } catch (error) {
      console.error('[LLM Client] Vision analysis failed:', error);
      return {
        description: 'Screenshot analysis failed.',
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
