# PRD: Environment Variable Standardization

## Introduction/Overview

There is a mismatch between documented environment variables and actual code usage. The README documents `VITE_SUPABASE_ANON_KEY` while the code uses `VITE_SUPABASE_PUBLISHABLE_KEY`. This causes confusion during deployment and can lead to broken authentication on Vercel. The goal is to standardize all environment variables across documentation, code, and deployment.

## Goals

1. Align all environment variable names between code and documentation
2. Create a single source of truth for required env vars
3. Add runtime validation for required environment variables
4. Provide clear deployment instructions for Vercel

## User Stories

1. **As a developer**, I want clear, consistent env var names so I don't waste time debugging missing configuration.
2. **As a deployer**, I want to know exactly which env vars to set in Vercel so the app works on first deploy.

## Functional Requirements

### 1. Standardized Environment Variables

| Variable | Purpose | Used In | Required |
|----------|---------|---------|----------|
| VITE_SUPABASE_URL | Supabase project URL | client.ts | Yes |
| VITE_SUPABASE_ANON_KEY | Supabase public (anon) key | client.ts | Yes |
| VITE_LLM_PROVIDER | Preferred LLM provider | llm/client.ts | No (auto-detect) |

**Server-side only (after proxy implementation):**

| Variable | Purpose | Used In | Required |
|----------|---------|---------|----------|
| ANTHROPIC_API_KEY | Claude API key | api/llm | Yes (for LLM) |
| OPENAI_API_KEY | OpenAI API key | api/llm | Yes (for LLM) |

### 2. Code Updates

Update `src/integrations/supabase/client.ts`:

```typescript
// Before
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// After
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### 3. Runtime Validation

Add validation at app startup to catch missing env vars early:

```typescript
// src/lib/env.ts
export function validateEnv() {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    // Show user-friendly error in UI
  }
}
```

### 4. Documentation Updates

Update the following files:

1. **README.md** - Already uses `VITE_SUPABASE_ANON_KEY` (correct)
2. **CLAUDE.md** - Uses `VITE_SUPABASE_ANON_KEY` (correct)
3. **.env.example** - Currently uses `VITE_SUPABASE_PUBLISHABLE_KEY` (needs update)

### 5. .env.example Update

```bash
# Supabase Configuration (required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Note: LLM keys should be set as server-side env vars, not here
# See /api/llm for serverless function configuration
```

## Non-Goals (Out of Scope)

- Secret management system (use Vercel/Supabase built-in)
- Env var encryption
- Multiple environment support (dev/staging/prod)

## Technical Considerations

1. **No breaking change**: Use the same key Supabase calls "anon key" in their dashboard
2. **Vite behavior**: All `VITE_` prefixed vars are exposed to client - this is expected for Supabase anon key
3. **Vercel**: Set env vars in Project Settings > Environment Variables

## Success Metrics

1. Zero env-related errors when following README setup instructions
2. .env.example matches actual code requirements
3. Clear error message shown if required env vars are missing

## Open Questions

1. Should we add a "configuration" page in the app to help debug env issues?
2. Should we support `.env.local` for local overrides?
