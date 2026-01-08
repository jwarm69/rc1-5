/**
 * RealCoach.ai - OpenAI Adapter
 *
 * Implements the LLM adapter interface for OpenAI API.
 */

import { LLMAdapter, LLMRequest, LLMResponse, LLMError, LLMConfig } from './types';

export class OpenAIAdapter implements LLMAdapter {
  provider = 'openai' as const;
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o-mini'; // Default to cheaper model
  }

  validateConfig(): boolean {
    // Accept both legacy (sk-) and new project-based (sk-proj-) API keys
    return !!this.apiKey && (this.apiKey.startsWith('sk-') || this.apiKey.startsWith('sk-proj-'));
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.validateConfig()) {
      throw new LLMError(
        'Invalid OpenAI API key configuration',
        'INVALID_CONFIG',
        'openai'
      );
    }

    const messages = request.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const body = {
      model: this.model,
      messages,
      max_tokens: request.options?.maxTokens || 1024,
      temperature: request.options?.temperature ?? 0.7,
      stop: request.options?.stopSequences,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        if (response.status === 429) {
          throw new LLMError(
            'Rate limit exceeded',
            'RATE_LIMIT',
            'openai',
            429
          );
        }

        throw new LLMError(
          error.error?.message || `API error: ${response.status}`,
          'API_ERROR',
          'openai',
          response.status
        );
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      return {
        content: choice?.message?.content || '',
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        model: data.model,
        finishReason: mapFinishReason(choice?.finish_reason),
      };
    } catch (error) {
      if (error instanceof LLMError) throw error;

      throw new LLMError(
        error instanceof Error ? error.message : 'Unknown error',
        'UNKNOWN',
        'openai'
      );
    }
  }
}

function mapFinishReason(reason: string | undefined): 'stop' | 'length' | 'content_filter' {
  switch (reason) {
    case 'stop':
      return 'stop';
    case 'length':
      return 'length';
    case 'content_filter':
      return 'content_filter';
    default:
      return 'stop';
  }
}
