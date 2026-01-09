# PRD: Automated Testing Setup

## Introduction/Overview

The RC1.5 project has no automated tests. All validation is manual. This creates risk when making changes and slows down development. The goal is to establish a baseline testing infrastructure with smoke tests for critical flows and unit tests for business logic.

## Goals

1. Set up testing infrastructure (Vitest + React Testing Library)
2. Create smoke tests for critical user flows
3. Add unit tests for core business logic (calibration, coaching engine)
4. Achieve 50%+ coverage on `src/lib/` modules
5. Add pre-commit hook to run tests

## User Stories

1. **As a developer**, I want tests to catch regressions so I can refactor confidently.
2. **As a developer**, I want to know immediately if I broke something before pushing.
3. **As a reviewer**, I want test coverage to verify new features work correctly.

## Functional Requirements

### 1. Testing Infrastructure Setup

Install and configure:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }),
  },
}));

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
```

### 2. Unit Tests for Business Logic

#### Calibration Engine (`src/lib/calibration.test.ts`)

Test calibration state machine:

```typescript
import { describe, it, expect } from 'vitest';
import { transitionState, isStateValid } from './calibration';

describe('Calibration State Machine', () => {
  it('should transition from UNINITIALIZED to CALIBRATING', () => {
    const state = { currentState: 'UNINITIALIZED' };
    const result = transitionState(state, 'CALIBRATING');
    expect(result.currentState).toBe('CALIBRATING');
  });

  it('should not allow skipping states', () => {
    const state = { currentState: 'UNINITIALIZED' };
    expect(() => transitionState(state, 'ACTIONS_ACTIVE')).toThrow();
  });

  it('should validate state names', () => {
    expect(isStateValid('CALIBRATING')).toBe(true);
    expect(isStateValid('INVALID')).toBe(false);
  });
});
```

#### Coaching Engine (`src/lib/coaching-engine.test.ts`)

Test mode transitions and move detection:

```typescript
import { describe, it, expect } from 'vitest';
import { transitionMode, detectCoachingMove } from './coaching-engine';

describe('Coaching Mode Transitions', () => {
  it('should transition CLARIFY to REFLECT', () => {
    expect(transitionMode('CLARIFY', 'REFLECT')).toBe('REFLECT');
  });

  it('should not allow invalid transitions', () => {
    expect(() => transitionMode('DIRECT', 'CLARIFY')).not.toThrow();
  });
});

describe('Coaching Move Detection', () => {
  it('should detect FOCUS for overwhelm signals', () => {
    expect(detectCoachingMove('I have too many things to do')).toBe('FOCUS');
  });

  it('should detect AGENCY for external locus', () => {
    expect(detectCoachingMove("There's nothing I can do about it")).toBe('AGENCY');
  });

  it('should return NONE for neutral messages', () => {
    expect(detectCoachingMove('Good morning')).toBe('NONE');
  });
});
```

#### LLM Client (`src/lib/llm/client.test.ts`)

Test routing and response validation:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { LLMClient } from './client';

describe('LLM Client', () => {
  it('should detect task type from message', () => {
    const client = new LLMClient();
    expect(client['inferTaskType']('ok', {} as any)).toBe('ACKNOWLEDGMENT');
    expect(client['inferTaskType']('What should I focus on?', {} as any)).toBe('COACHING');
  });

  it('should validate response against rules', () => {
    const client = new LLMClient();
    const result = client['validateResponse']('One question? Two questions?', 'CLARIFY');
    expect(result.violations).toContain('Multiple questions (2) - only 1 allowed');
  });

  it('should detect banned words', () => {
    const client = new LLMClient();
    const result = client['validateResponse']('Let\'s crush this!', 'DIRECT');
    expect(result.violations.some(v => v.includes('crush'))).toBe(true);
  });
});
```

### 3. Smoke Tests (E2E-lite)

#### Calibration Flow (`src/test/smoke/calibration.test.tsx`)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CalibrationProvider } from '@/contexts/CalibrationContext';
import GoalsAndActions from '@/pages/GoalsAndActions';

describe('Calibration Flow Smoke Test', () => {
  it('should show calibration prompt for new users', () => {
    render(
      <CalibrationProvider>
        <GoalsAndActions />
      </CalibrationProvider>
    );

    expect(screen.getByText(/complete calibration/i)).toBeInTheDocument();
  });

  it('should show actions after calibration is complete', async () => {
    // Mock completed calibration state
    render(
      <CalibrationProvider initialState={{ currentState: 'ACTIONS_ACTIVE' }}>
        <GoalsAndActions />
      </CalibrationProvider>
    );

    expect(screen.getByText(/today's actions/i)).toBeInTheDocument();
  });
});
```

#### Coach Panel (`src/test/smoke/coach-panel.test.tsx`)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import CoachPanel from '@/components/layout/CoachPanel';

describe('Coach Panel Smoke Test', () => {
  it('should render chat input', () => {
    render(<CoachPanel />);
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
  });

  it('should display user message after sending', async () => {
    render(<CoachPanel />);
    const input = screen.getByPlaceholderText(/type a message/i);

    await userEvent.type(input, 'Hello coach');
    fireEvent.submit(input.closest('form')!);

    expect(screen.getByText('Hello coach')).toBeInTheDocument();
  });
});
```

### 4. npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### 5. Pre-commit Hook

Using Husky + lint-staged:

```bash
npm install -D husky lint-staged
npx husky init
```

`.husky/pre-commit`:
```bash
npx lint-staged
```

`package.json`:
```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "npm run lint",
      "vitest related --run"
    ]
  }
}
```

## Non-Goals (Out of Scope)

- Full E2E testing with Playwright/Cypress (future)
- Visual regression testing
- Performance testing
- API integration tests against live Supabase
- 100% code coverage

## Technical Considerations

1. **Test isolation**: Each test should be independent, mock external deps
2. **Fast feedback**: Unit tests should run in < 5 seconds
3. **CI integration**: Tests should run in GitHub Actions
4. **Coverage reports**: Generate HTML coverage in `coverage/` directory

## Success Metrics

1. All tests pass on main branch
2. 50%+ coverage on `src/lib/` modules
3. Test run completes in < 30 seconds
4. Pre-commit hook catches failing tests before push
5. Zero false positives (flaky tests)

## Open Questions

1. Should we add E2E tests with Playwright now or defer?
2. Should coverage be enforced in CI (fail if below threshold)?
3. Do we need to test components with complex UI state?
