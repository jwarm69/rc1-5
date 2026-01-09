# PRD: LLM API Proxy for Secure Key Management

## Introduction/Overview

The current implementation exposes LLM API keys (`VITE_ANTHROPIC_API_KEY`, `VITE_OPENAI_API_KEY`) in the browser bundle since they use the `VITE_` prefix. Any user can open DevTools and extract these keys, leading to potential abuse and unexpected charges. The goal is to move LLM calls behind a server-side proxy that keeps API keys secure.

## Goals

1. Remove LLM API keys from the client-side bundle
2. Create a serverless API proxy (Vercel Edge Functions or Supabase Edge Functions)
3. Maintain existing LLM routing logic (Claude for coaching, GPT-4o-mini for simple tasks)
4. Add rate limiting to prevent abuse
5. Preserve streaming support for real-time coach responses

## User Stories

1. **As a user**, I want the app to work the same as before but without my actions exposing secret keys.
2. **As a developer**, I want API keys stored securely on the server so they can't be stolen.
3. **As a business owner**, I want protection against API key abuse and unexpected costs.

## Functional Requirements

### 1. API Proxy Endpoint

Create a serverless function at `/api/llm` (or Supabase Edge Function) that:

1. Accepts POST requests with JSON body containing:
   - `messages`: Array of conversation messages
   - `taskType`: 'COACHING' | 'CALIBRATION' | 'VISION' | 'ACKNOWLEDGMENT' | 'ACTION_GEN'
   - `stream`: boolean for streaming responses

2. Routes to appropriate provider based on taskType (existing logic):
   - COACHING, CALIBRATION, VISION → Claude Sonnet
   - ACKNOWLEDGMENT, ACTION_GEN → GPT-4o-mini

3. Returns responses in same format as current adapters

### 2. Authentication

The proxy must:

1. Verify Supabase JWT token from request header
2. Reject unauthenticated requests
3. Extract user_id for rate limiting and logging

### 3. Rate Limiting

Implement per-user rate limits:

| Tier | Requests/minute | Tokens/day |
|------|-----------------|------------|
| Default | 20 | 100,000 |

### 4. Client Updates

Update `src/lib/llm/client.ts` to:

1. Remove direct API key usage from browser
2. Call the proxy endpoint instead
3. Pass Supabase auth token in headers
4. Handle streaming responses via Server-Sent Events or chunked response

### 5. Environment Variables

Move from client to server:

```bash
# Client (.env - REMOVE these)
# VITE_ANTHROPIC_API_KEY  <- DELETE
# VITE_OPENAI_API_KEY     <- DELETE

# Server (Vercel environment or Supabase secrets)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

## Non-Goals (Out of Scope)

- Usage tracking dashboard (can add later)
- Multiple API key support (one per provider is fine)
- Custom rate limit tiers per user
- Caching responses (each coaching response is unique)

## Design Considerations

### Option A: Vercel Edge Functions (Recommended)

```
/api/llm/route.ts  - Main proxy endpoint
```

Pros:
- Already on Vercel
- Edge runtime = low latency
- Easy streaming support

### Option B: Supabase Edge Functions

```
supabase/functions/llm/index.ts
```

Pros:
- All backend in one place
- Built-in auth verification

Cons:
- Additional deployment step
- May have cold start issues

## Technical Considerations

1. **Streaming**: Use `TransformStream` and proper headers for streaming responses
2. **Error handling**: Don't leak API error details to client
3. **Timeout**: Set appropriate timeouts for LLM calls (60s for long responses)
4. **CORS**: Configure for your domain only in production
5. **Fallback**: Keep mock responses for development without keys

### Implementation Pattern

```typescript
// /api/llm/route.ts (Vercel)
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export async function POST(request: Request) {
  // 1. Verify auth token
  const token = request.headers.get('Authorization');
  const user = await verifySupabaseToken(token);
  if (!user) return new Response('Unauthorized', { status: 401 });

  // 2. Check rate limit
  if (await isRateLimited(user.id)) {
    return new Response('Rate limited', { status: 429 });
  }

  // 3. Parse request and route to provider
  const { messages, taskType, stream } = await request.json();
  const provider = getProviderForTask(taskType);

  // 4. Call LLM and return response
  if (stream) {
    return streamResponse(provider, messages);
  }
  return jsonResponse(provider, messages);
}
```

## Success Metrics

1. No API keys visible in browser DevTools or network requests
2. LLM responses work identically to current implementation
3. Streaming chat responses still feel instant
4. Rate limiting prevents > 20 requests/minute per user
5. Unauthenticated requests return 401

## Open Questions

1. Vercel Edge Functions vs Supabase Edge Functions - which is preferred?
2. Should rate limits be configurable or fixed?
3. Do we need usage logging/analytics initially?
