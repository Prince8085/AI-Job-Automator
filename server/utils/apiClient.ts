/**
 * NVIDIA API Client Wrapper
 * Handles all NVIDIA API calls with retry logic, rate limiting, and error handling
 */

import { config } from '../config';
import { logger } from './logger';
import { AIServiceError } from './errors';

export interface NvidiaRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  streaming?: boolean;
  retries?: number;
  timeout?: number;
}

export interface NvidiaResponse {
  choices: Array<{
    text?: string;
    message?: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface NvidiaStreamChunk {
  choices: Array<{
    delta?: {
      content: string;
    };
    text?: string;
    finish_reason: string | null;
  }>;
}

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

class NvidiaApiClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  };

  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly RATE_LIMIT_MAX = 100; // requests per minute

  constructor() {
    this.apiKey = config.NVIDIA_API_KEY || '';
    const configuredUrl = config.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1';
    this.baseUrl = configuredUrl.replace(/\/chat\/completions\/?$/, '');
    this.defaultModel = config.NVIDIA_MODEL || 'qwen/qwen3.5-397b-a17b';

    if (!this.apiKey) {
      logger.error('NVIDIA_API_KEY is not configured', {
        action: 'NvidiaApiClient.constructor',
      });
      throw new AIServiceError('NVIDIA API key is not configured');
    }
  }

  /**
   * Generate text from prompt
   */
  async generateText(
    prompt: string,
    options: NvidiaRequestOptions = {}
  ): Promise<string> {
    const requestId = this.generateRequestId();

    try {
      this.checkRateLimit();

      logger.info('NVIDIA API request started', {
        action: 'generateText',
        requestId,
        model: options.model || this.defaultModel,
      });

      const response = await this.makeRequest(
        {
          model: options.model || this.defaultModel,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: options.maxTokens || 2048,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 1,
        },
        requestId,
        options.retries || this.retryConfig.maxRetries,
        options.timeout || 30000
      );

      const text =
        response.choices[0]?.message?.content ||
        response.choices[0]?.text ||
        '';

      logger.info('NVIDIA API request completed', {
        action: 'generateText',
        requestId,
        tokensUsed: response.usage?.total_tokens,
      });

      return text;
    } catch (error) {
      logger.error('NVIDIA API request failed', {
        action: 'generateText',
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate text with streaming
   */
  async generateTextStream(
    prompt: string,
    onChunk: (content: string) => void,
    options: NvidiaRequestOptions = {}
  ): Promise<string> {
    const requestId = this.generateRequestId();

    try {
      this.checkRateLimit();

      logger.info('NVIDIA streaming request started', {
        action: 'generateTextStream',
        requestId,
      });

      const response = await fetch(this.getCompletionsEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: options.maxTokens || 2048,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 1,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new AIServiceError(
          `NVIDIA API error: ${response.statusText} (${response.status})`
        );
      }

      let fullContent = '';
      const reader = response.body?.getReader();

      if (!reader) {
        throw new AIServiceError('Failed to read response stream');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);

            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content =
                parsed.choices?.[0]?.delta?.content ||
                parsed.choices?.[0]?.text ||
                '';

              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch (e) {
              logger.warn('Failed to parse stream chunk', {
                action: 'generateTextStream',
                requestId,
              });
            }
          }
        }
      }

      logger.info('NVIDIA streaming request completed', {
        action: 'generateTextStream',
        requestId,
        contentLength: fullContent.length,
      });

      return fullContent;
    } catch (error) {
      logger.error('NVIDIA streaming request failed', {
        action: 'generateTextStream',
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate structured output (JSON)
   */
  async generateStructured<T>(
    prompt: string,
    options: NvidiaRequestOptions = {}
  ): Promise<T> {
    const requestId = this.generateRequestId();

    try {
      const response = await this.generateText(
        `${prompt}\n\nReturn ONLY valid JSON, no markdown or extra text.`,
        options
      );

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new AIServiceError('Failed to parse JSON response from NVIDIA');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      logger.info('Structured generation completed', {
        action: 'generateStructured',
        requestId,
      });

      return parsed as T;
    } catch (error) {
      logger.error('Structured generation failed', {
        action: 'generateStructured',
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    body: any,
    requestId: string,
    retriesLeft: number,
    timeout: number
  ): Promise<NvidiaResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(this.getCompletionsEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        throw {
          status: 429,
          retryable: true,
          message: 'Rate limit exceeded',
        };
      }

      if (response.status === 500 || response.status === 503) {
        throw {
          status: response.status,
          retryable: true,
          message: 'Service temporarily unavailable',
        };
      }

      if (!response.ok) {
        throw new AIServiceError(
          `NVIDIA API error: ${response.statusText} (${response.status})`
        );
      }

      return await response.json();
    } catch (error: any) {
      // Retry logic
      if (error.retryable && retriesLeft > 0) {
        const delayMs = this.calculateBackoffDelay(retriesLeft);
        logger.warn('Retrying NVIDIA request', {
          action: 'makeRequest',
          requestId,
          retriesLeft: retriesLeft - 1,
          delayMs,
        });

        await this.delay(delayMs);
        return this.makeRequest(body, requestId, retriesLeft - 1, timeout);
      }

      throw error;
    }
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(): void {
    const now = Date.now();

    if (now - this.lastResetTime > this.RATE_LIMIT_WINDOW) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    this.requestCount++;

    if (this.requestCount > this.RATE_LIMIT_MAX) {
      throw new AIServiceError('API rate limit exceeded');
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(retriesLeft: number): number {
    const attemptNumber = this.retryConfig.maxRetries - retriesLeft;
    const delay =
      this.retryConfig.initialDelayMs *
      Math.pow(this.retryConfig.backoffMultiplier, attemptNumber);
    return Math.min(delay, this.retryConfig.maxDelayMs);
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `nvidia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCompletionsEndpoint(): string {
    return `${this.baseUrl}/chat/completions`;
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    const now = Date.now();
    const windowElapsed = now - this.lastResetTime;
    const windowRemaining = Math.max(0, this.RATE_LIMIT_WINDOW - windowElapsed);

    return {
      requestsUsed: this.requestCount,
      requestsRemaining: Math.max(0, this.RATE_LIMIT_MAX - this.requestCount),
      windowResetIn: windowRemaining,
      limitPerMinute: this.RATE_LIMIT_MAX,
    };
  }
}

// Export singleton instance
export const nvidiaClient = new NvidiaApiClient();

export default nvidiaClient;
