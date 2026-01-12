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

/**
 * Image source for vision API requests
 */
export interface ImageSource {
  type: 'base64';
  media_type: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
  data: string; // base64-encoded image data (without data URL prefix)
}

/**
 * Content block types for multimodal messages
 */
export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: ImageSource };

/**
 * Message content can be a simple string or an array of content blocks
 * for multimodal (vision) requests
 */
export type MessageContent = string | ContentBlock[];

/**
 * LLM message with support for multimodal content
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

/**
 * Helper to check if content is multimodal
 */
export function isMultimodalContent(content: MessageContent): content is ContentBlock[] {
  return Array.isArray(content);
}

/**
 * Helper to extract text from message content
 */
export function getTextContent(content: MessageContent): string {
  if (typeof content === 'string') {
    return content;
  }
  return content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map(block => block.text)
    .join('\n');
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
  generateStream?(request: LLMRequest): AsyncGenerator<string, void, unknown>;
  validateConfig(): boolean;
}

// ============================================================================
// VISION TYPES
// ============================================================================

/**
 * Request for screenshot interpretation
 */
export interface VisionRequest {
  /** Base64-encoded images (without data URL prefix) */
  images: Array<{
    base64: string;
    mediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
  }>;
  /** User's stated intent for what they want done with the screenshot */
  userIntent?: string;
  /** Additional context about the user's business */
  context?: {
    userName?: string;
    industry?: string;
  };
}

/**
 * Raw response from vision API before parsing
 */
export interface VisionResponse {
  /** Raw analysis text from the LLM */
  rawAnalysis: string;
  /** Model used */
  model?: string;
  /** Token usage */
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}
