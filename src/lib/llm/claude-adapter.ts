/**
 * RealCoach.ai - Claude/Anthropic Adapter
 *
 * Implements the LLM adapter interface for Claude API.
 */

import { LLMAdapter, LLMRequest, LLMResponse, LLMError, LLMConfig } from './types';

export class ClaudeAdapter implements LLMAdapter {
  provider = 'claude' as const;
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-sonnet-4-20250514';
  }

  validateConfig(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-ant-');
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.validateConfig()) {
      throw new LLMError(
        'Invalid Claude API key configuration',
        'INVALID_CONFIG',
        'claude'
      );
    }

    const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const body = {
      model: this.model,
      max_tokens: request.options?.maxTokens || 1024,
      system: systemMessage,
      messages: conversationMessages,
      temperature: request.options?.temperature ?? 0.7,
      stop_sequences: request.options?.stopSequences,
    };

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        if (response.status === 429) {
          throw new LLMError(
            'Rate limit exceeded',
            'RATE_LIMIT',
            'claude',
            429
          );
        }

        throw new LLMError(
          error.error?.message || `API error: ${response.status}`,
          'API_ERROR',
          'claude',
          response.status
        );
      }

      const data = await response.json();

      return {
        content: data.content[0]?.text || '',
        usage: {
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
        model: data.model,
        finishReason: mapStopReason(data.stop_reason),
      };
    } catch (error) {
      if (error instanceof LLMError) throw error;

      throw new LLMError(
        error instanceof Error ? error.message : 'Unknown error',
        'UNKNOWN',
        'claude'
      );
    }
  }
}

/**
 * Generate a response with an image (Claude Vision)
 */
export async function generateWithVision(
  apiKey: string,
  prompt: string,
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/png'
): Promise<string> {
  const baseUrl = 'https://api.anthropic.com/v1';
  const model = 'claude-sonnet-4-20250514';

  const body = {
    model,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  };

  const response = await fetch(`${baseUrl}/messages`, {
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
    throw new Error(error.error?.message || `Vision API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}

function mapStopReason(reason: string | undefined): 'stop' | 'length' | 'content_filter' {
  switch (reason) {
    case 'end_turn':
    case 'stop_sequence':
      return 'stop';
    case 'max_tokens':
      return 'length';
    default:
      return 'stop';
  }
}
