# PRD: Mailchimp Sync v1

## Introduction/Overview

Users need to communicate with their contacts at scale (newsletters, updates, drip campaigns) but shouldn't have to maintain two separate systems. This integration mirrors the RealCoach contact database to Mailchimp so users can leverage email marketing tools without double data entry.

**Core principle**: RealCoach is the single source of truth. Mailchimp is a downstream mirror, nothing more. This is NOT a CRM integration—it's an address book sync.

**Behavior spec reference**: `docs/behavior/07_Mailchimp_Sync.md` (Pages 192-210)

## Goals

1. Eliminate double data entry between RealCoach and Mailchimp
2. Keep Mailchimp audience automatically in sync with RealCoach contacts
3. Preserve RealCoach as the authoritative system for all contact data
4. Make sync invisible and friction-free—infrastructure, not a feature users manage

## User Stories

1. **As a user**, I want to connect my Mailchimp account once and have my contacts automatically available there without managing two lists.

2. **As a user**, I want contacts I add in RealCoach to appear in Mailchimp without any extra steps.

3. **As a user**, I want tag changes in RealCoach to sync to Mailchimp so I don't have to rebuild segments manually.

4. **As a user**, I want to disconnect Mailchimp if I stop using it, without affecting my RealCoach data.

5. **As a user**, I don't want to think about sync status or manage sync failures—it should just work.

## Functional Requirements

### 1. Mailchimp Connection (OAuth Flow)

1.1. Add "Connect Mailchimp" button in Settings page

1.2. Clicking initiates standard Mailchimp OAuth popup flow

1.3. After successful OAuth, store access token securely (encrypted in user's profile)

1.4. Display connection status: "Connected to [audience name]" or "Not connected"

1.5. Provide "Disconnect" button to revoke connection

1.6. On disconnect, remove stored credentials—do NOT remove contacts from Mailchimp

### 2. Audience Selection

2.1. After OAuth, fetch user's Mailchimp audiences (lists)

2.2. If single audience exists, auto-select it

2.3. If multiple audiences exist, prompt user to select one

2.4. Store selected audience ID for sync operations

2.5. Allow changing audience selection in Settings

### 3. Data Model (What Syncs)

**Synced fields** (one-way: RealCoach → Mailchimp):

| RealCoach Field | Mailchimp Field |
|-----------------|-----------------|
| `first_name` | `FNAME` |
| `last_name` | `LNAME` |
| `email` | `email_address` (required) |
| `phone` | `PHONE` |
| `tags` | Tags |

3.1. Contacts WITHOUT email addresses are NOT synced (email is required for Mailchimp)

3.2. All RealCoach tags sync as Mailchimp tags

3.3. Sync preserves existing Mailchimp-only tags (additive, not destructive)

### 4. What Does NOT Sync

**Explicitly excluded** (per behavior spec):

- ❌ Notes
- ❌ Addresses
- ❌ Pipeline stage
- ❌ Deal data
- ❌ Production data
- ❌ Last contacted date
- ❌ Any behavioral or time-based signals
- ❌ Email engagement metrics (opens, clicks) flowing BACK to RealCoach

### 5. Sync Triggers

Sync fires automatically on:

5.1. **Contact created** → Add to Mailchimp audience

5.2. **Contact edited** → Update in Mailchimp (merge fields + tags)

5.3. **Tags added/removed** → Update Mailchimp tags

5.4. **CSV import** → Sync all imported contacts (same as individual creates)

5.5. **Contact deleted** → Remove from Mailchimp (after coaching confirmation)

### 6. Sync Direction & Conflict Resolution

6.1. Sync is ONE-WAY only: RealCoach → Mailchimp

6.2. No data flows from Mailchimp back to RealCoach, ever

6.3. If conflict exists, RealCoach data wins, always

6.4. No reconciliation logic, no merge, no bidirectional sync

### 7. Deletion Handling

7.1. Deletion is a high-intent event—route through Coaching Behavior Engine

7.2. Before deleting a contact, coach asks clarifying questions:
   - Do they want to forget the relationship?
   - Or just remove behavioral pressure?
   - Or archive instead?

7.3. If deletion confirmed:
   - Remove from RealCoach
   - Remove from Mailchimp (via API)
   - No partial deletes, no orphaning

### 8. Failure Handling

8.1. If Mailchimp API fails (rate limit, timeout, error):
   - Queue the sync event for retry
   - Retry with exponential backoff (1s, 2s, 4s, 8s... max 5 min)
   - Max 5 retry attempts per event

8.2. During failures:
   - NO UI alerts, banners, or warnings
   - Database continues to function normally
   - User is not interrupted

8.3. If failures persist beyond retry threshold:
   - Surface a single calm note in coach panel: "Heads up—email sync is paused right now."
   - Note is informational only, no required action
   - Note auto-dismisses when sync resumes

### 9. User Controls

**What users CAN do**:
- Connect a Mailchimp account
- Disconnect a Mailchimp account
- Select which audience to sync to

**What users CANNOT do**:
- Choose which fields sync
- Choose which tags sync
- Pause individual sync events
- Configure sync behavior
- Create segments inside RealCoach

9.1. This prevents configuration drift and CRM creep

### 10. Manual Sync Trigger

10.1. Add "Sync Now" button in Settings (for users who want immediate sync)

10.2. Triggers full audience reconciliation

10.3. Queues all contacts for sync, deduplicated against existing Mailchimp records

10.4. Rate limited to once per hour

## Non-Goals (Out of Scope)

**Critical**: These are explicitly forbidden per behavior spec:

- ❌ Campaign creation inside RealCoach
- ❌ Email/SMS sending from RealCoach
- ❌ Automation workflow configuration
- ❌ Open/click/engagement metrics
- ❌ Behavioral data flowing back into RealCoach
- ❌ "Smart" segmentation or lead scoring
- ❌ Action triggers based on email activity
- ❌ Two-way sync or reconciliation
- ❌ Re-engagement nudges based on email performance
- ❌ Any feature that makes Mailchimp feel like a judge, not a tool

## Design Considerations

### Settings Page Section

```
┌─────────────────────────────────────────────┐
│ Email Marketing                             │
├─────────────────────────────────────────────┤
│ Mailchimp                                   │
│                                             │
│ ● Connected to "My Real Estate Contacts"    │
│   Last synced: 2 minutes ago                │
│                                             │
│ [Sync Now]  [Disconnect]                    │
│                                             │
│ ─────────────────────────────────────────── │
│ ℹ️ Contacts sync automatically. You don't   │
│    need to do anything.                     │
└─────────────────────────────────────────────┘
```

### Coach Panel Sync Notice (failures only)

```
┌─────────────────────────────────────────────┐
│ ℹ️ Heads up—email sync is paused right now. │
│    Your contacts are still safe.       [×]  │
└─────────────────────────────────────────────┘
```

## Technical Considerations

### 1. OAuth Implementation

Use Mailchimp OAuth 2.0 flow:

```typescript
// Initiate OAuth
const authUrl = `https://login.mailchimp.com/oauth2/authorize?
  response_type=code&
  client_id=${MAILCHIMP_CLIENT_ID}&
  redirect_uri=${REDIRECT_URI}`;

// Exchange code for token
POST https://login.mailchimp.com/oauth2/token
{
  grant_type: 'authorization_code',
  client_id: MAILCHIMP_CLIENT_ID,
  client_secret: MAILCHIMP_CLIENT_SECRET,
  redirect_uri: REDIRECT_URI,
  code: authorization_code
}
```

### 2. New Files

| File | Purpose |
|------|---------|
| `src/lib/mailchimp-sync.ts` | Sync logic, API calls, retry handling |
| `src/pages/Settings.tsx` | Add Mailchimp connection UI (or create if doesn't exist) |
| `api/mailchimp/callback.ts` | OAuth callback handler |
| `api/mailchimp/sync.ts` | Background sync endpoint |

### 3. Database Schema Additions

```sql
-- Add to user profile or new table
CREATE TABLE mailchimp_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  access_token text NOT NULL,  -- encrypted
  server_prefix text NOT NULL, -- e.g., "us19"
  audience_id text NOT NULL,
  connected_at timestamptz DEFAULT now(),
  last_sync_at timestamptz,
  sync_status text DEFAULT 'active', -- active, paused, error
  UNIQUE(user_id)
);

-- Sync queue for retries
CREATE TABLE mailchimp_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  contact_id uuid REFERENCES contacts NOT NULL,
  operation text NOT NULL, -- create, update, delete
  attempts int DEFAULT 0,
  next_retry_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### 4. Sync Worker

Option A: **Supabase Edge Function** (recommended)
- Triggered by database webhook on contact changes
- Processes sync queue periodically

Option B: **Vercel Cron Job**
- Runs every 5 minutes
- Processes pending sync queue items

### 5. Mailchimp API Calls

```typescript
// Add/update subscriber
PUT /lists/{audience_id}/members/{subscriber_hash}
{
  email_address: contact.email,
  status_if_new: 'subscribed',
  merge_fields: {
    FNAME: contact.first_name,
    LNAME: contact.last_name,
    PHONE: contact.phone
  },
  tags: contact.tags
}

// Delete subscriber
DELETE /lists/{audience_id}/members/{subscriber_hash}

// subscriber_hash = MD5(lowercase(email))
```

### 6. Environment Variables

```env
# Server-side only (Vercel)
MAILCHIMP_CLIENT_ID=xxx
MAILCHIMP_CLIENT_SECRET=xxx
MAILCHIMP_REDIRECT_URI=https://app.realcoach.ai/api/mailchimp/callback
```

### 7. Rate Limits

Mailchimp API limits:
- 10 concurrent connections
- Batch operations: 500 per request
- Consider batching for CSV imports

## Success Metrics

1. **Connection Rate**: >50% of users with email in workflow connect Mailchimp
2. **Sync Reliability**: >99% of sync events succeed within 1 hour
3. **Invisibility**: <5% of users ever see sync failure notice
4. **No Data Drift**: 0 reports of RealCoach/Mailchimp data mismatch
5. **No Behavior Pollution**: 0 instances of Mailchimp data influencing coaching

## Open Questions

1. Should we support other email marketing platforms later (Constant Contact, ConvertKit)?
2. What happens to Mailchimp contacts if user disconnects? Leave them? Offer to remove?
3. Should CSV import have a "skip Mailchimp sync" option for bulk historical imports?
4. How do we handle contacts that exist in Mailchimp before connection (merge vs. skip)?
5. Should there be an admin view of sync status across all users (for debugging)?
