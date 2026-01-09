/**
 * Environment variable validation
 * Call validateEnv() at app startup to catch configuration issues early
 */

interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  llmProvider?: 'claude' | 'openai';
  anthropicApiKey?: string;
  openaiApiKey?: string;
}

const REQUIRED_VARS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

/**
 * Validates that all required environment variables are set.
 * Returns an object with validation results.
 */
export function validateEnv(): { valid: boolean; missing: string[]; config: EnvConfig | null } {
  const missing = REQUIRED_VARS.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error(
      `[RealCoach.ai] Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file or deployment configuration.`
    );
    return { valid: false, missing, config: null };
  }

  const config: EnvConfig = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    llmProvider: import.meta.env.VITE_LLM_PROVIDER as 'claude' | 'openai' | undefined,
    anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY,
  };

  // Warn if no LLM keys are configured (app will work but coaching won't)
  if (!config.anthropicApiKey && !config.openaiApiKey) {
    console.warn(
      '[RealCoach.ai] No LLM API keys configured. Coaching responses will use mock data.'
    );
  }

  return { valid: true, missing: [], config };
}

/**
 * Get typed environment config. Throws if required vars are missing.
 */
export function getEnvConfig(): EnvConfig {
  const { valid, missing, config } = validateEnv();

  if (!valid || !config) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return config;
}
