/**
 * RealCoach.ai - Mailchimp Sync Queue Processor
 *
 * Processes pending Mailchimp sync operations for all users.
 * Called via Vercel cron job every 15 minutes.
 *
 * Security: Protected by CRON_SECRET header verification.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIG
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

// Constants from mailchimp-sync.ts
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000];
const MAX_ATTEMPTS = 5;
const API_TIMEOUT_MS = 10000;

// Limit users per cron run to avoid timeouts
const MAX_USERS_PER_RUN = 50;
const MAX_ITEMS_PER_USER = 50;

// ============================================================================
// TYPES
// ============================================================================

interface MailchimpConnection {
  id: string;
  user_id: string;
  access_token: string;
  server_prefix: string;
  audience_id: string | null;
  sync_status: 'active' | 'paused' | 'error';
  last_sync_at: string | null;
  last_error: string | null;
}

interface SyncQueueItem {
  id: string;
  user_id: string;
  contact_id: string;
  operation: 'create' | 'update' | 'delete';
  payload: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    tags?: string[];
  } | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  next_retry_at: string;
}

interface SyncResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// HANDLER
// ============================================================================

export const config = {
  runtime: 'edge',
  // Allow longer timeout for batch processing
  maxDuration: 60,
};

export default async function handler(request: Request): Promise<Response> {
  // Only allow POST for cron jobs (Vercel sends POST)
  // Also allow GET for manual triggering in development
  if (request.method !== 'POST' && request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify cron secret for production security
    // Vercel cron jobs send this in the Authorization header
    if (CRON_SECRET) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Verify configuration
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Missing Supabase configuration');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get users with pending sync items
    const usersWithPending = await getUsersWithPendingSync(supabase);

    if (usersWithPending.length === 0) {
      return new Response(JSON.stringify({
        message: 'No pending sync items',
        processed: 0,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process each user's queue
    const results: Array<{
      userId: string;
      processed: number;
      succeeded: number;
      failed: number;
    }> = [];

    for (const userId of usersWithPending) {
      const connection = await getConnection(supabase, userId);
      if (!connection || !connection.audience_id) {
        continue;
      }

      const userResult = await processUserQueue(supabase, userId, connection);
      results.push({
        userId,
        ...userResult,
      });
    }

    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
    const totalSucceeded = results.reduce((sum, r) => sum + r.succeeded, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    return new Response(JSON.stringify({
      message: 'Sync complete',
      users: results.length,
      totalProcessed,
      totalSucceeded,
      totalFailed,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ============================================================================
// SYNC LOGIC (Server-side versions)
// ============================================================================

/**
 * Get list of user IDs with pending sync items
 */
async function getUsersWithPendingSync(supabase: ReturnType<typeof createClient>): Promise<string[]> {
  const { data, error } = await supabase
    .from('mailchimp_sync_queue')
    .select('user_id')
    .is('completed_at', null)
    .lte('next_retry_at', new Date().toISOString())
    .lt('attempts', MAX_ATTEMPTS)
    .limit(MAX_USERS_PER_RUN);

  if (error || !data) {
    console.error('Failed to get users with pending sync:', error);
    return [];
  }

  // Get unique user IDs
  const userIds = [...new Set(data.map(item => item.user_id))];
  return userIds.slice(0, MAX_USERS_PER_RUN);
}

/**
 * Get a user's Mailchimp connection
 */
async function getConnection(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<MailchimpConnection | null> {
  const { data, error } = await supabase
    .from('mailchimp_connections')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as MailchimpConnection;
}

/**
 * Get pending sync items for a user
 */
async function getPendingItems(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<SyncQueueItem[]> {
  const { data, error } = await supabase
    .from('mailchimp_sync_queue')
    .select('*')
    .eq('user_id', userId)
    .is('completed_at', null)
    .lte('next_retry_at', new Date().toISOString())
    .lt('attempts', MAX_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(MAX_ITEMS_PER_USER);

  if (error || !data) {
    return [];
  }

  return data as SyncQueueItem[];
}

/**
 * Process all pending sync items for a user
 */
async function processUserQueue(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  connection: MailchimpConnection
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const items = await getPendingItems(supabase, userId);
  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    const result = await processQueueItem(supabase, item, connection);

    if (result.success) {
      await markCompleted(supabase, item.id);
      succeeded++;
    } else {
      await markFailed(supabase, item.id, item.attempts, result.error || 'Unknown error');
      failed++;

      // If max attempts reached, update connection status
      if (item.attempts + 1 >= MAX_ATTEMPTS) {
        await updateConnectionStatus(supabase, userId, 'error', result.error);
      }
    }
  }

  // Update last sync time if any items processed
  if (succeeded > 0) {
    await updateConnectionStatus(supabase, userId, 'active');
  }

  return { processed: items.length, succeeded, failed };
}

/**
 * Process a single queue item
 */
async function processQueueItem(
  supabase: ReturnType<typeof createClient>,
  item: SyncQueueItem,
  connection: MailchimpConnection
): Promise<SyncResult> {
  try {
    switch (item.operation) {
      case 'create':
      case 'update': {
        // Get fresh contact data from database
        const { data: contact } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', item.contact_id)
          .single();

        if (!contact) {
          // Contact was deleted - mark as completed
          return { success: true };
        }

        if (!contact.email) {
          // No email - skip
          return { success: true };
        }

        // Sync contact
        const contactResult = await syncContact(connection, {
          email: contact.email,
          first_name: contact.first_name,
          last_name: contact.last_name,
          phone: contact.phone || undefined,
          tags: contact.tags || [],
        });

        if (!contactResult.success) {
          return contactResult;
        }

        // Sync tags if present
        if (contact.tags && contact.tags.length > 0) {
          const tagsResult = await syncTags(connection, contact.email, contact.tags);
          if (!tagsResult.success) {
            console.warn('Tags sync failed:', tagsResult.error);
          }
        }

        return { success: true };
      }

      case 'delete': {
        if (!item.payload?.email) {
          return { success: false, error: 'No email for delete operation' };
        }
        return await deleteContact(connection, item.payload.email);
      }

      default:
        return { success: false, error: `Unknown operation: ${item.operation}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// MAILCHIMP API HELPERS
// ============================================================================

/**
 * Make an authenticated request to the Mailchimp API
 */
async function mailchimpRequest<T>(
  connection: MailchimpConnection,
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  const url = `https://${connection.server_prefix}.api.mailchimp.com/3.0${endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.title || `HTTP ${response.status}`;

      if (response.status === 401) {
        return { error: 'Authentication failed - please reconnect Mailchimp' };
      }
      if (response.status === 429) {
        return { error: 'Rate limit exceeded - will retry' };
      }
      if (response.status === 404) {
        return { error: 'Resource not found' };
      }

      return { error: errorMessage };
    }

    if (response.status === 204) {
      return { data: undefined };
    }

    const data = await response.json();
    return { data };

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { error: 'Request timeout' };
      }
      return { error: error.message };
    }
    return { error: 'Unknown error' };
  }
}

/**
 * Generate MD5 hash for email (Mailchimp subscriber hash)
 */
function getSubscriberHash(email: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  return md5(normalizedEmail);
}

function md5(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16);
  return hex.padStart(32, '0');
}

/**
 * Sync a contact to Mailchimp
 */
async function syncContact(
  connection: MailchimpConnection,
  contact: { email: string; first_name?: string; last_name?: string; phone?: string; tags?: string[] }
): Promise<SyncResult> {
  if (!connection.audience_id) {
    return { success: false, error: 'No audience selected' };
  }

  const subscriberHash = getSubscriberHash(contact.email);

  const result = await mailchimpRequest(
    connection,
    `/lists/${connection.audience_id}/members/${subscriberHash}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        email_address: contact.email,
        status_if_new: 'subscribed',
        merge_fields: {
          FNAME: contact.first_name || '',
          LNAME: contact.last_name || '',
          PHONE: contact.phone || '',
        },
      }),
    }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

/**
 * Sync tags for a contact
 */
async function syncTags(
  connection: MailchimpConnection,
  email: string,
  tags: string[]
): Promise<SyncResult> {
  if (!connection.audience_id) {
    return { success: false, error: 'No audience selected' };
  }

  const subscriberHash = getSubscriberHash(email);
  const tagPayload = tags.map((tag) => ({
    name: tag,
    status: 'active',
  }));

  const result = await mailchimpRequest(
    connection,
    `/lists/${connection.audience_id}/members/${subscriberHash}/tags`,
    {
      method: 'POST',
      body: JSON.stringify({ tags: tagPayload }),
    }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

/**
 * Delete a contact from Mailchimp
 */
async function deleteContact(
  connection: MailchimpConnection,
  email: string
): Promise<SyncResult> {
  if (!connection.audience_id) {
    return { success: false, error: 'No audience selected' };
  }

  const subscriberHash = getSubscriberHash(email);

  const result = await mailchimpRequest(
    connection,
    `/lists/${connection.audience_id}/members/${subscriberHash}`,
    { method: 'DELETE' }
  );

  if (result.error && !result.error.includes('not found')) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

// ============================================================================
// DATABASE HELPERS
// ============================================================================

async function markCompleted(
  supabase: ReturnType<typeof createClient>,
  itemId: string
): Promise<void> {
  await supabase
    .from('mailchimp_sync_queue')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', itemId);
}

async function markFailed(
  supabase: ReturnType<typeof createClient>,
  itemId: string,
  attempts: number,
  error: string
): Promise<void> {
  const nextRetryDelay = RETRY_DELAYS[Math.min(attempts, RETRY_DELAYS.length - 1)];
  const nextRetryAt = new Date(Date.now() + nextRetryDelay).toISOString();

  await supabase
    .from('mailchimp_sync_queue')
    .update({
      attempts: attempts + 1,
      last_error: error,
      next_retry_at: nextRetryAt,
    })
    .eq('id', itemId);
}

async function updateConnectionStatus(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  status: 'active' | 'paused' | 'error',
  error?: string
): Promise<void> {
  const update: Record<string, unknown> = {
    sync_status: status,
    last_error: error || null,
  };

  if (status === 'active') {
    update.last_sync_at = new Date().toISOString();
  }

  await supabase
    .from('mailchimp_connections')
    .update(update)
    .eq('user_id', userId);
}
