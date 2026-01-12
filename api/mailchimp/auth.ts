/**
 * RealCoach.ai - Mailchimp OAuth Initiation
 *
 * Generates the OAuth authorization URL for Mailchimp.
 * Includes CSRF protection via state parameter.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIG
// ============================================================================

const MAILCHIMP_CLIENT_ID = process.env.MAILCHIMP_CLIENT_ID;
const MAILCHIMP_REDIRECT_URI = process.env.MAILCHIMP_REDIRECT_URI || 'http://localhost:8080/api/mailchimp/callback';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================================
// HANDLER
// ============================================================================

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify Mailchimp is configured
    if (!MAILCHIMP_CLIENT_ID) {
      return new Response(JSON.stringify({ error: 'Mailchimp not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract and verify JWT from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);

    // Verify the token with Supabase
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate state parameter for CSRF protection
    // Include user ID and timestamp for verification
    const stateData = {
      userId: user.id,
      timestamp: Date.now(),
      nonce: crypto.randomUUID(),
    };
    const state = btoa(JSON.stringify(stateData));

    // Build Mailchimp OAuth authorization URL
    const authUrl = new URL('https://login.mailchimp.com/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', MAILCHIMP_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', MAILCHIMP_REDIRECT_URI);
    authUrl.searchParams.set('state', state);

    return new Response(JSON.stringify({
      authUrl: authUrl.toString(),
      state,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Mailchimp auth error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
