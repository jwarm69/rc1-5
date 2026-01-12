/**
 * RealCoach.ai - Mailchimp Disconnect
 *
 * Removes the user's Mailchimp connection.
 * Does NOT remove contacts from Mailchimp (per spec).
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIG
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================================
// HANDLER
// ============================================================================

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Extract and verify JWT from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);

    // Verify configuration
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete the Mailchimp connection
    const { error: deleteError } = await supabase
      .from('mailchimp_connections')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete connection error:', deleteError);
      return new Response(JSON.stringify({ error: 'Failed to disconnect' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Clear any pending sync queue items for this user
    const { error: queueError } = await supabase
      .from('mailchimp_sync_queue')
      .delete()
      .eq('user_id', user.id)
      .is('completed_at', null);

    if (queueError) {
      // Log but don't fail - connection is already removed
      console.error('Clear queue error:', queueError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Mailchimp disconnected successfully',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Mailchimp disconnect error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
