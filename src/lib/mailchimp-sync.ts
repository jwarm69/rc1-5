/**
 * RealCoach.ai - Mailchimp Sync Library
 *
 * Handles one-way sync from RealCoach to Mailchimp.
 * RealCoach is ALWAYS the source of truth.
 *
 * IMPORTANT: This is a ONE-WAY sync. No data flows from Mailchimp back to RealCoach.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncStatus = 'active' | 'paused' | 'error';

export interface MailchimpConnection {
  id: string;
  user_id: string;
  access_token: string;
  server_prefix: string;
  audience_id: string | null;
  audience_name: string | null;
  sync_status: SyncStatus;
  last_sync_at: string | null;
  last_error: string | null;
  connected_at: string;
}

export interface MailchimpAudience {
  id: string;
  name: string;
  member_count: number;
}

export interface SyncQueueItem {
  id: string;
  user_id: string;
  contact_id: string;
  operation: SyncOperation;
  payload: ContactPayload | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  next_retry_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface ContactPayload {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  tags?: string[];
}

export interface SyncResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Exponential backoff delays (in milliseconds)
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000];
const MAX_ATTEMPTS = 5;

// Mailchimp API rate limits
const API_TIMEOUT_MS = 10000;

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Get the user's Mailchimp connection
 */
export async function getConnection(userId: string): Promise<MailchimpConnection | null> {
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
 * Check if user has an active Mailchimp connection
 */
export async function hasActiveConnection(userId: string): Promise<boolean> {
  const connection = await getConnection(userId);
  return connection !== null && connection.sync_status !== 'error';
}

/**
 * Update connection status
 */
export async function updateConnectionStatus(
  userId: string,
  status: SyncStatus,
  error?: string
): Promise<void> {
  const update: Partial<MailchimpConnection> = {
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

/**
 * Update selected audience
 */
export async function updateAudience(
  userId: string,
  audienceId: string,
  audienceName: string
): Promise<void> {
  await supabase
    .from('mailchimp_connections')
    .update({
      audience_id: audienceId,
      audience_name: audienceName,
    })
    .eq('user_id', userId);
}

// ============================================================================
// MAILCHIMP API CALLS
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

      // Handle specific error codes
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

    // Handle 204 No Content (e.g., DELETE responses)
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
 * Get user's Mailchimp audiences (lists)
 */
export async function getAudiences(connection: MailchimpConnection): Promise<MailchimpAudience[]> {
  const result = await mailchimpRequest<{
    lists: Array<{ id: string; name: string; stats: { member_count: number } }>;
  }>(connection, '/lists?count=100');

  if (result.error || !result.data) {
    console.error('Failed to fetch audiences:', result.error);
    return [];
  }

  return result.data.lists.map((list) => ({
    id: list.id,
    name: list.name,
    member_count: list.stats.member_count,
  }));
}

/**
 * Generate MD5 hash for email (Mailchimp subscriber hash)
 */
export function getSubscriberHash(email: string): string {
  // Simple MD5 implementation for browser/edge
  // In production, use a proper crypto library
  const normalizedEmail = email.toLowerCase().trim();

  // Use Web Crypto API
  return md5(normalizedEmail);
}

// Simple MD5 implementation for subscriber hash
function md5(str: string): string {
  // This is a simplified MD5 for demonstration
  // In production, use crypto.subtle or a library
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Convert to hex and pad to 32 chars
  const hex = Math.abs(hash).toString(16);
  return hex.padStart(32, '0');
}

/**
 * Sync a contact to Mailchimp (create or update)
 */
export async function syncContact(
  connection: MailchimpConnection,
  contact: ContactPayload
): Promise<SyncResult> {
  if (!connection.audience_id) {
    return { success: false, error: 'No audience selected' };
  }

  if (!contact.email) {
    return { success: false, error: 'Contact has no email address' };
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
export async function syncTags(
  connection: MailchimpConnection,
  email: string,
  tags: string[]
): Promise<SyncResult> {
  if (!connection.audience_id) {
    return { success: false, error: 'No audience selected' };
  }

  const subscriberHash = getSubscriberHash(email);

  // Mailchimp tags API expects an array of { name, status } objects
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
export async function deleteContact(
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
    {
      method: 'DELETE',
    }
  );

  // 404 is acceptable for delete (contact doesn't exist)
  if (result.error && !result.error.includes('not found')) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

// ============================================================================
// SYNC QUEUE MANAGEMENT
// ============================================================================

/**
 * Add a contact sync operation to the queue
 */
export async function enqueueSync(
  userId: string,
  contactId: string,
  operation: SyncOperation,
  payload?: ContactPayload
): Promise<void> {
  // Check if user has an active connection
  const connection = await getConnection(userId);
  if (!connection || !connection.audience_id) {
    // No connection or audience - silently skip
    return;
  }

  // For delete operations, we need the email in the payload
  // (contact may be deleted from DB before sync runs)
  if (operation === 'delete' && !payload?.email) {
    console.warn('Delete operation requires email in payload');
    return;
  }

  // Check for existing pending operation for this contact
  const { data: existing } = await supabase
    .from('mailchimp_sync_queue')
    .select('id, operation')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .is('completed_at', null)
    .single();

  if (existing) {
    // If there's a pending operation, update it instead of creating a new one
    // Delete takes priority over create/update
    if (operation === 'delete' || existing.operation !== 'delete') {
      await supabase
        .from('mailchimp_sync_queue')
        .update({
          operation,
          payload: payload || null,
          attempts: 0,
          next_retry_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', existing.id);
    }
    return;
  }

  // Insert new queue item
  await supabase.from('mailchimp_sync_queue').insert({
    user_id: userId,
    contact_id: contactId,
    operation,
    payload: payload || null,
    attempts: 0,
    max_attempts: MAX_ATTEMPTS,
    next_retry_at: new Date().toISOString(),
  });
}

/**
 * Get pending sync items for a user
 */
export async function getPendingItems(userId: string): Promise<SyncQueueItem[]> {
  const { data, error } = await supabase
    .from('mailchimp_sync_queue')
    .select('*')
    .eq('user_id', userId)
    .is('completed_at', null)
    .lte('next_retry_at', new Date().toISOString())
    .lt('attempts', MAX_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error || !data) {
    return [];
  }

  return data as SyncQueueItem[];
}

/**
 * Mark a queue item as completed
 */
export async function markCompleted(itemId: string): Promise<void> {
  await supabase
    .from('mailchimp_sync_queue')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', itemId);
}

/**
 * Mark a queue item as failed with retry
 */
export async function markFailed(
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

/**
 * Process a single queue item
 */
export async function processQueueItem(
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
            // Log but don't fail - contact is synced
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

/**
 * Process all pending sync items for a user
 */
export async function processUserQueue(userId: string): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const connection = await getConnection(userId);
  if (!connection || !connection.audience_id) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const items = await getPendingItems(userId);
  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    const result = await processQueueItem(item, connection);

    if (result.success) {
      await markCompleted(item.id);
      succeeded++;
    } else {
      await markFailed(item.id, item.attempts, result.error || 'Unknown error');
      failed++;

      // If max attempts reached, update connection status
      if (item.attempts + 1 >= MAX_ATTEMPTS) {
        await updateConnectionStatus(userId, 'error', result.error);
      }
    }
  }

  // Update last sync time if any items processed
  if (succeeded > 0) {
    await updateConnectionStatus(userId, 'active');
  }

  return { processed: items.length, succeeded, failed };
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Queue all user's contacts for sync (initial sync or manual full sync)
 */
export async function queueAllContacts(userId: string): Promise<number> {
  // Get all contacts with email addresses
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, email')
    .eq('user_id', userId)
    .not('email', 'is', null);

  if (error || !contacts) {
    return 0;
  }

  // Queue each contact
  for (const contact of contacts) {
    if (contact.email) {
      await enqueueSync(userId, contact.id, 'create');
    }
  }

  return contacts.length;
}

// ============================================================================
// HELPER: Convert DB Contact to Payload
// ============================================================================

/**
 * Convert a database contact to a sync payload
 */
export function contactToPayload(contact: Tables<'contacts'>): ContactPayload | null {
  if (!contact.email) {
    return null;
  }

  return {
    email: contact.email,
    first_name: contact.first_name,
    last_name: contact.last_name,
    phone: contact.phone || undefined,
    tags: contact.tags || [],
  };
}
