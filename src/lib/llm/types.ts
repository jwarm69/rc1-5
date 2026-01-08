/**
 * RealCoach.ai - LLM Integration Types
 *
 * Type definitions for the LLM client abstraction layer.
 * Supports both Claude and OpenAI providers.
 */

import { CoachMode, CoachingMove, CalibrationTone, GoalsAndActions, BusinessPlan } from '@/types/coaching';

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export type LLMProvider = 'claude' | 'openai';

/**
 * Task types for smart model routing
 * Routes to appropriate model based on cost/quality tradeoffs
 */
export type TaskType =
  | 'COACHING'        // Nuanced coaching responses → Claude Sonnet
  | 'ACKNOWLEDGMENT'  // Simple confirmations → GPT-4o-mini (cheap)
  | 'ACTION_GEN'      // Daily action generation → GPT-4o-mini (structured)
  | 'VISION'          // Screenshot analysis → Claude Sonnet (quality)
  | 'CALIBRATION';    // Calibration questions → Claude Sonnet (quality)

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CoachingContext {
  // User's calibration data
  goalsAndActions: GoalsAndActions | null;
  businessPlan: BusinessPlan | null;
  tone: CalibrationTone | null;

  // Current coaching state
  currentMode: CoachMode;
  currentMove: CoachingMove;

  // Conversation history (last N messages)
  recentMessages: LLMMessage[];

  // User info
  userName?: string;
  industry?: string; // e.g., "real_estate"
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface LLMRequest {
  messages: LLMMessage[];
  context?: CoachingContext;
  options?: {
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
  };
}

export interface LLMResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: 'stop' | 'length' | 'content_filter';
}

// ============================================================================
// COACHING RESPONSE TYPES
// ============================================================================

export interface CoachingResponse {
  message: string;
  suggestedMode?: CoachMode;
  suggestedMove?: CoachingMove;
  detectedSignals?: {
    overwhelm: boolean;
    externalizedControl: boolean;
    selfStory: boolean;
    resistance: boolean;
    missedDay: boolean;
  };
  questionsAsked: number;
  policyViolations?: string[];
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class LLMError extends Error {
  constructor(
    message: string,
    public code: 'API_ERROR' | 'RATE_LIMIT' | 'INVALID_CONFIG' | 'TIMEOUT' | 'UNKNOWN',
    public provider?: LLMProvider,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

// ============================================================================
// PROVIDER INTERFACE
// ============================================================================

export interface LLMAdapter {
  provider: LLMProvider;
  generate(request: LLMRequest): Promise<LLMResponse>;
  validateConfig(): boolean;
}
