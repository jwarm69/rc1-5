/**
 * RealCoach.ai - Mailchimp OAuth Callback
 *
 * Handles the OAuth callback from Mailchimp.
 * Exchanges the authorization code for an access token and stores the connection.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIG
// ============================================================================

const MAILCHIMP_CLIENT_ID = process.env.MAILCHIMP_CLIENT_ID;
const MAILCHIMP_CLIENT_SECRET = process.env.MAILCHIMP_CLIENT_SECRET;
const MAILCHIMP_REDIRECT_URI = process.env.MAILCHIMP_REDIRECT_URI || 'http://localhost:8080/api/mailchimp/callback';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.VITE_APP_URL || 'http://localhost:8080';

// State expiry: 10 minutes
const STATE_EXPIRY_MS = 10 * 60 * 1000;

// ============================================================================
// TYPES
// ============================================================================

interface StateData {
  userId: string;
  timestamp: number;
  nonce: string;
}

interface MailchimpTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface MailchimpMetadataResponse {
  dc: string;
  role: string;
  accountname: string;
  user_id: number;
  login: {
    email: string;
    avatar: string;
    login_id: number;
    login_name: string;
    login_email: string;
  };
  login_url: string;
  api_endpoint: string;
}

// ============================================================================
// HANDLER
// ============================================================================

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  // Only allow GET requests (OAuth callback)
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Mailchimp OAuth error:', error);
      return redirectWithError('Authorization was denied or cancelled');
    }

    // Validate required parameters
    if (!code || !state) {
      return redirectWithError('Missing authorization parameters');
    }

    // Verify configuration
    if (!MAILCHIMP_CLIENT_ID || !MAILCHIMP_CLIENT_SECRET) {
      console.error('Missing Mailchimp configuration');
      return redirectWithError('Server configuration error');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Missing Supabase configuration');
      return redirectWithError('Server configuration error');
    }

    // Decode and verify state parameter
    let stateData: StateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return redirectWithError('Invalid state parameter');
    }

    // Verify state hasn't expired
    if (Date.now() - stateData.timestamp > STATE_EXPIRY_MS) {
      return redirectWithError('Authorization session expired. Please try again.');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://login.mailchimp.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: MAILCHIMP_CLIENT_ID,
        client_secret: MAILCHIMP_CLIENT_SECRET,
        redirect_uri: MAILCHIMP_REDIRECT_URI,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return redirectWithError('Failed to connect to Mailchimp');
    }

    const tokenData: MailchimpTokenResponse = await tokenResponse.json();

    // Get Mailchimp metadata (includes server prefix)
    const metadataResponse = await fetch('https://login.mailchimp.com/oauth2/metadata', {
      headers: {
        Authorization: `OAuth ${tokenData.access_token}`,
      },
    });

    if (!metadataResponse.ok) {
      console.error('Metadata fetch failed');
      return redirectWithError('Failed to get Mailchimp account info');
    }

    const metadata: MailchimpMetadataResponse = await metadataResponse.json();

    // Extract server prefix from api_endpoint (e.g., "https://us19.api.mailchimp.com" -> "us19")
    const serverPrefix = new URL(metadata.api_endpoint).hostname.split('.')[0];

    // Store connection in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Upsert the connection (replace if exists)
    const { error: upsertError } = await supabase
      .from('mailchimp_connections')
      .upsert({
        user_id: stateData.userId,
        access_token: tokenData.access_token,
        server_prefix: serverPrefix,
        sync_status: 'active',
        connected_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('Database error:', upsertError);
      return redirectWithError('Failed to save connection');
    }

    // Redirect to settings page with success
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${APP_URL}/settings?mailchimp=connected`,
      },
    });

  } catch (error) {
    console.error('Mailchimp callback error:', error);
    return redirectWithError('An unexpected error occurred');
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function redirectWithError(message: string): Response {
  const encodedMessage = encodeURIComponent(message);
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${APP_URL}/settings?mailchimp=error&message=${encodedMessage}`,
    },
  });
}
