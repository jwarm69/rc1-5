/**
 * RealCoach.ai - LLM API Proxy
 *
 * Serverless function that proxies LLM requests to keep API keys secure.
 * Verifies Supabase JWT tokens and implements rate limiting.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

type TaskType = 'COACHING' | 'ACKNOWLEDGMENT' | 'ACTION_GEN' | 'VISION' | 'CALIBRATION';
type LLMProvider = 'claude' | 'openai';

// Content block types for multimodal messages
interface ImageSource {
  type: 'base64';
  media_type: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
  data: string;
}

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: ImageSource };

type MessageContent = string | ContentBlock[];

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

interface LLMRequest {
  messages: LLMMessage[];
  taskType: TaskType;
  stream?: boolean;
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

// Helper to check if content is multimodal
function isMultimodalContent(content: MessageContent): content is ContentBlock[] {
  return Array.isArray(content);
}

// Helper to extract text from content
function getTextContent(content: MessageContent): string {
  if (typeof content === 'string') {
    return content;
  }
  return content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map(block => block.text)
    .join('\n');
}

// Helper to check if request contains images
function hasImages(messages: LLMMessage[]): boolean {
  return messages.some(m => {
    if (!isMultimodalContent(m.content)) return false;
    return m.content.some(block => block.type === 'image');
  });
}

interface ModelRoute {
  provider: LLMProvider;
  model: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const ROUTE_CONFIG: Record<TaskType, ModelRoute> = {
  COACHING: { provider: 'claude', model: 'claude-sonnet-4-20250514' },
  CALIBRATION: { provider: 'claude', model: 'claude-sonnet-4-20250514' },
  VISION: { provider: 'claude', model: 'claude-sonnet-4-20250514' },
  ACKNOWLEDGMENT: { provider: 'openai', model: 'gpt-4o-mini' },
  ACTION_GEN: { provider: 'openai', model: 'gpt-4o-mini' },
};

// Quality tasks that should use better models when falling back
const QUALITY_TASKS: TaskType[] = ['COACHING', 'CALIBRATION', 'VISION'];

// Rate limiting: requests per minute per user
const RATE_LIMIT_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// In-memory rate limit store (for serverless, consider using Redis/KV in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// ============================================================================
// HELPERS
// ============================================================================

function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

async function verifyToken(authHeader: string | null): Promise<{ userId: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return { userId: user.id };
  } catch {
    return null;
  }
}

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    return true;
  }

  userLimit.count++;
  return false;
}

function getProviderConfig(taskType: TaskType): { provider: LLMProvider; model: string } {
  const route = ROUTE_CONFIG[taskType];
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Try preferred provider first
  if (route.provider === 'claude' && claudeKey) {
    return route;
  }
  if (route.provider === 'openai' && openaiKey) {
    return route;
  }

  // Fallback to available provider
  if (claudeKey) {
    return { provider: 'claude', model: 'claude-sonnet-4-20250514' };
  }
  if (openaiKey) {
    const model = QUALITY_TASKS.includes(taskType) ? 'gpt-4o' : 'gpt-4o-mini';
    return { provider: 'openai', model };
  }

  throw new Error('No LLM provider configured');
}

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

async function callClaude(
  messages: LLMMessage[],
  model: string,
  options?: { temperature?: number; maxTokens?: number },
  stream?: boolean
): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Extract system message (always string)
  const systemMsg = messages.find(m => m.role === 'system');
  const systemMessage = systemMsg ? getTextContent(systemMsg.content) : '';

  // Format conversation messages - handle both string and multimodal content
  const conversationMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => {
      // If content is already a string, keep it simple
      if (typeof m.content === 'string') {
        return { role: m.role as 'user' | 'assistant', content: m.content };
      }
      // If content is an array (multimodal), pass it through for Claude
      return { role: m.role as 'user' | 'assistant', content: m.content };
    });

  // Use higher max_tokens for vision requests (they tend to be more complex)
  const isVisionRequest = hasImages(messages);
  const maxTokens = options?.maxTokens || (isVisionRequest ? 2048 : 1024);

  const body = {
    model,
    max_tokens: maxTokens,
    system: systemMessage,
    messages: conversationMessages,
    temperature: options?.temperature ?? 0.7,
    stream: !!stream,
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Claude API error: ${response.status}`);
  }

  return response;
}

async function callOpenAI(
  messages: LLMMessage[],
  model: string,
  options?: { temperature?: number; maxTokens?: number },
  stream?: boolean
): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // OpenAI doesn't support our image format - reject image requests
  if (hasImages(messages)) {
    throw new Error('Vision requests require Claude provider');
  }

  // Convert messages to OpenAI format (always string content)
  const openaiMessages = messages.map(m => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : getTextContent(m.content),
  }));

  const body = {
    model,
    messages: openaiMessages,
    max_tokens: options?.maxTokens || 1024,
    temperature: options?.temperature ?? 0.7,
    stream: !!stream,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  return response;
}

// ============================================================================
// STREAMING HELPERS
// ============================================================================

function createStreamingResponse(providerResponse: Response, provider: LLMProvider): Response {
  const reader = providerResponse.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';

      try {
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
                  let text = '';

                  if (provider === 'claude') {
                    if (data.type === 'content_block_delta' && data.delta?.text) {
                      text = data.delta.text;
                    }
                  } else {
                    text = data.choices?.[0]?.delta?.content || '';
                  }

                  if (text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: Request): Promise<Response> {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('Authorization');
    const user = await verifyToken(authHeader);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // 2. Check rate limit
    if (isRateLimited(user.userId)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // 3. Parse request
    const body: LLMRequest = await request.json();
    const { messages, taskType, stream, options } = body;

    if (!messages || !Array.isArray(messages) || !taskType) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // 4. Get provider configuration
    const { provider, model } = getProviderConfig(taskType);

    console.log(`[LLM Proxy] ${taskType} → ${provider} (${model}) for user ${user.userId.slice(0, 8)}...`);

    // 5. Call the appropriate provider
    let providerResponse: Response;

    if (provider === 'claude') {
      providerResponse = await callClaude(messages, model, options, stream);
    } else {
      providerResponse = await callOpenAI(messages, model, options, stream);
    }

    // 6. Return response
    if (stream) {
      return createStreamingResponse(providerResponse, provider);
    }

    // Non-streaming: parse and return JSON
    const data = await providerResponse.json();

    let content = '';
    if (provider === 'claude') {
      content = data.content?.[0]?.text || '';
    } else {
      content = data.choices?.[0]?.message?.content || '';
    }

    return new Response(JSON.stringify({ content, provider, model }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[LLM Proxy] Error:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// For Vercel Edge Runtime
export const config = {
  runtime: 'edge',
};
