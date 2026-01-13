# Tasks: Mailchimp Sync v1

Generated from `prd-mailchimp-sync.md`

## Relevant Files

- `src/pages/Settings.tsx` - Add Mailchimp connection UI (create if doesn't exist)
- `src/lib/mailchimp-sync.ts` - New file for sync logic and API calls
- `api/mailchimp/callback.ts` - New file for OAuth callback handler
- `api/mailchimp/sync.ts` - New file for background sync endpoint
- `supabase/schema.sql` - Add mailchimp_connections and sync_queue tables
- `src/integrations/supabase/types.ts` - Regenerate with new tables
- `src/components/layout/CoachPanel.tsx` - Add sync failure notice
- `src/pages/Database.tsx` - Wire contact changes to sync triggers

### Notes

- This is a ONE-WAY sync: RealCoach → Mailchimp only
- Mailchimp data NEVER flows back to RealCoach
- Sync failures are silent—user is not interrupted
- RealCoach is ALWAYS the source of truth

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

### Phase 0: Setup

- [x] 0.0 Create feature branch
  - [x] 0.0.1 Create and checkout: `git checkout -b feature/mailchimp-sync`
  - [x] 0.0.2 Verify branch: `git branch --show-current`
  - [x] 0.0.3 **MERGED** - Feature branch merged to main (PR #6)

- [ ] 0.1 Register Mailchimp OAuth App
  - [ ] 0.1.1 Go to Mailchimp Developer Portal (https://admin.mailchimp.com/account/oauth2/)
  - [ ] 0.1.2 Create new OAuth 2 app
  - [ ] 0.1.3 Set redirect URI: `https://app.realcoach.ai/api/mailchimp/callback` (update for your domain)
  - [ ] 0.1.4 Note Client ID and Client Secret
  - [ ] 0.1.5 Add to Vercel environment variables:
    - `MAILCHIMP_CLIENT_ID`
    - `MAILCHIMP_CLIENT_SECRET`
    - `MAILCHIMP_REDIRECT_URI`

---

### Phase 1: Database Schema

- [x] 1.0 Create mailchimp_connections table
  - [x] 1.0.1 Read current `supabase/schema.sql`
  - [x] 1.0.2 Add `mailchimp_connections` table:
    ```sql
    CREATE TABLE mailchimp_connections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users NOT NULL,
      access_token text NOT NULL,
      server_prefix text NOT NULL,
      audience_id text,
      audience_name text,
      connected_at timestamptz DEFAULT now(),
      last_sync_at timestamptz,
      sync_status text DEFAULT 'active',
      UNIQUE(user_id)
    );
    ```
  - [x] 1.0.3 Add RLS policy: users can only access own connection
  - [x] 1.0.4 Add index on user_id
  - [ ] 1.0.5 Run migration in Supabase SQL Editor

- [x] 1.1 Create mailchimp_sync_queue table
  - [x] 1.1.1 Add `mailchimp_sync_queue` table:
    ```sql
    CREATE TABLE mailchimp_sync_queue (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users NOT NULL,
      contact_id uuid REFERENCES contacts NOT NULL,
      operation text NOT NULL,
      payload jsonb,
      attempts int DEFAULT 0,
      max_attempts int DEFAULT 5,
      last_error text,
      next_retry_at timestamptz DEFAULT now(),
      created_at timestamptz DEFAULT now(),
      completed_at timestamptz
    );
    ```
  - [x] 1.1.2 Add RLS policy
  - [x] 1.1.3 Add indexes on user_id, next_retry_at, completed_at
  - [ ] 1.1.4 Run migration in Supabase SQL Editor

- [ ] 1.2 Regenerate TypeScript types
  - [ ] 1.2.1 Run: `npx supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts`
  - [ ] 1.2.2 Or manually add types to match schema
  - [ ] 1.2.3 Verify: `npx tsc --noEmit`

---

### Phase 2: OAuth Flow

- [x] 2.0 Create OAuth initiation endpoint
  - [x] 2.0.1 Create `api/mailchimp/auth.ts`
  - [x] 2.0.2 Generate OAuth authorization URL:
    ```typescript
    const authUrl = new URL('https://login.mailchimp.com/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', process.env.MAILCHIMP_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', process.env.MAILCHIMP_REDIRECT_URI);
    ```
  - [x] 2.0.3 Include state parameter for CSRF protection
  - [x] 2.0.4 Store state in session/cookie for verification
  - [x] 2.0.5 Return redirect URL to client

- [x] 2.1 Create OAuth callback handler
  - [x] 2.1.1 Create `api/mailchimp/callback.ts`
  - [x] 2.1.2 Verify state parameter matches
  - [x] 2.1.3 Exchange code for access token:
    ```typescript
    POST https://login.mailchimp.com/oauth2/token
    {
      grant_type: 'authorization_code',
      client_id: MAILCHIMP_CLIENT_ID,
      client_secret: MAILCHIMP_CLIENT_SECRET,
      redirect_uri: MAILCHIMP_REDIRECT_URI,
      code: authorization_code
    }
    ```
  - [x] 2.1.4 Get server prefix from metadata endpoint
  - [x] 2.1.5 Store connection in `mailchimp_connections` table
  - [x] 2.1.6 Redirect user back to Settings page with success message

- [x] 2.2 Create disconnect endpoint
  - [x] 2.2.1 Create `api/mailchimp/disconnect.ts`
  - [x] 2.2.2 Delete row from `mailchimp_connections`
  - [x] 2.2.3 Clear any pending sync queue items for user
  - [x] 2.2.4 Do NOT delete contacts from Mailchimp (per spec)

---

### Phase 3: Mailchimp API Client

- [x] 3.0 Create Mailchimp sync library
  - [x] 3.0.1 Create `src/lib/mailchimp-sync.ts`
  - [x] 3.0.2 Implement `getMailchimpClient()`:
    - Fetch user's connection from database
    - Return configured API client with server prefix
  - [x] 3.0.3 Implement `getAudiences()`:
    ```typescript
    GET https://{server}.api.mailchimp.com/3.0/lists
    ```
  - [x] 3.0.4 Implement `syncContact()`:
    ```typescript
    PUT /lists/{audience_id}/members/{subscriber_hash}
    {
      email_address: contact.email,
      status_if_new: 'subscribed',
      merge_fields: {
        FNAME: contact.first_name,
        LNAME: contact.last_name,
        PHONE: contact.phone
      }
    }
    ```
  - [x] 3.0.5 Implement `syncTags()`:
    ```typescript
    POST /lists/{audience_id}/members/{subscriber_hash}/tags
    {
      tags: [{ name: 'tag1', status: 'active' }, ...]
    }
    ```
  - [x] 3.0.6 Implement `deleteContact()`:
    ```typescript
    DELETE /lists/{audience_id}/members/{subscriber_hash}
    ```
  - [x] 3.0.7 Implement `getSubscriberHash()`:
    ```typescript
    return md5(email.toLowerCase());
    ```

- [x] 3.1 Add error handling
  - [x] 3.1.1 Handle rate limit errors (429)
  - [x] 3.1.2 Handle authentication errors (401)
  - [x] 3.1.3 Handle not found errors (404)
  - [x] 3.1.4 Handle server errors (5xx)
  - [x] 3.1.5 Wrap all API calls in try/catch

---

### Phase 4: Sync Queue & Retry Logic

- [x] 4.0 Create queue management functions
  - [x] 4.0.1 Add to `src/lib/mailchimp-sync.ts`:
  - [x] 4.0.2 Implement `enqueueSync()`:
    ```typescript
    async function enqueueSync(
      userId: string,
      contactId: string,
      operation: 'create' | 'update' | 'delete',
      payload?: object
    )
    ```
  - [x] 4.0.3 Implement `processQueue()`:
    - Fetch pending items where `next_retry_at <= now()`
    - Process each item
    - On success: set `completed_at`
    - On failure: increment `attempts`, calculate `next_retry_at`
  - [x] 4.0.4 Implement exponential backoff:
    ```typescript
    const delays = [1000, 2000, 4000, 8000, 16000]; // ms
    const nextRetry = new Date(Date.now() + delays[attempts]);
    ```
  - [x] 4.0.5 Implement `markFailed()`:
    - After max attempts, mark as permanently failed
    - Update user's `sync_status` to 'error'

- [x] 4.1 Create background sync worker
  - [x] 4.1.1 Create `api/mailchimp/sync.ts` (Vercel cron or manual trigger)
  - [x] 4.1.2 Fetch all users with pending queue items
  - [x] 4.1.3 Process queue for each user
  - [x] 4.1.4 Add rate limiting (respect Mailchimp's 10 concurrent connections)
  - [x] 4.1.5 Log sync results for monitoring

---

### Phase 5: Sync Triggers

- [x] 5.0 Create database trigger function
  - [ ] 5.0.1 Option A: Supabase Database Webhook
    - Create webhook on `contacts` table for INSERT, UPDATE, DELETE
    - Point to sync endpoint
  - [x] 5.0.2 Option B: Application-level triggers
    - Hook into contact CRUD operations in app code

- [x] 5.1 Wire contact creation to sync
  - [x] 5.1.1 Read `src/components/database/CreateContactModal.tsx`
  - [x] 5.1.2 After successful contact creation, call `enqueueSync(userId, contactId, 'create')`
  - [x] 5.1.3 Only enqueue if user has Mailchimp connected
  - [x] 5.1.4 Only enqueue if contact has email address

- [x] 5.2 Wire contact update to sync
  - [x] 5.2.1 Read `src/pages/Database.tsx` or relevant update handler
  - [x] 5.2.2 After successful contact update, call `enqueueSync(userId, contactId, 'update')`
  - [ ] 5.2.3 Include changed fields in payload for optimization

- [x] 5.3 Wire tag changes to sync
  - [x] 5.3.1 Identify where tags are modified
  - [x] 5.3.2 After tag change, call `enqueueSync(userId, contactId, 'update')`
  - [x] 5.3.3 Include tags in payload

- [x] 5.4 Wire contact deletion to sync
  - [x] 5.4.1 After confirmed deletion, call `enqueueSync(userId, contactId, 'delete')`
  - [x] 5.4.2 Store email in payload (needed after contact deleted from DB)
  - [ ] 5.4.3 Ensure deletion flows through coaching confirmation first

---

### Phase 6: Settings UI

- [x] 6.0 Create or update Settings page
  - [x] 6.0.1 Check if `src/pages/Settings.tsx` exists, create if not
  - [x] 6.0.2 Add route in App.tsx if needed
  - [x] 6.0.3 Add Settings link to sidebar navigation

- [x] 6.1 Create Mailchimp connection section
  - [x] 6.1.1 Create `src/components/settings/MailchimpConnection.tsx`
  - [x] 6.1.2 Fetch user's Mailchimp connection status on mount
  - [x] 6.1.3 If not connected:
    - Show "Connect Mailchimp" button
    - On click, redirect to OAuth flow
  - [x] 6.1.4 If connected:
    - Show "Connected to [audience name]"
    - Show "Last synced: [time ago]"
    - Show "Sync Now" button
    - Show "Disconnect" button
  - [x] 6.1.5 Add info text: "Contacts sync automatically. You don't need to do anything."

- [x] 6.2 Implement audience selection
  - [x] 6.2.1 After OAuth, fetch user's audiences
  - [x] 6.2.2 If single audience, auto-select and save
  - [x] 6.2.3 If multiple audiences, show selection modal/dropdown
  - [x] 6.2.4 Save selected audience_id to connection record
  - [ ] 6.2.5 Allow changing audience in Settings

- [x] 6.3 Implement "Sync Now" button
  - [x] 6.3.1 On click, queue all user's contacts for sync
  - [x] 6.3.2 Show loading state
  - [x] 6.3.3 Rate limit: once per hour
  - [x] 6.3.4 Show success message when queued

- [x] 6.4 Implement "Disconnect" button
  - [ ] 6.4.1 Show confirmation dialog
  - [x] 6.4.2 On confirm, call disconnect endpoint
  - [x] 6.4.3 Clear UI state
  - [x] 6.4.4 Show success message

---

### Phase 7: Failure Notification

- [ ] 7.0 Create sync status hook
  - [ ] 7.0.1 Create `src/hooks/useMailchimpStatus.ts`
  - [ ] 7.0.2 Fetch user's connection status
  - [ ] 7.0.3 Return: `{ connected, syncStatus, lastSyncAt }`
  - [ ] 7.0.4 Poll or subscribe for status changes

- [x] 7.1 Add sync failure notice to CoachPanel
  - [x] 7.1.1 Read `src/components/layout/CoachPanel.tsx`
  - [x] 7.1.2 Import `useMailchimpStatus`
  - [x] 7.1.3 If `syncStatus === 'error'`, show notice:
    ```
    ℹ️ Heads up—email sync is paused right now.
       Your contacts are still safe. [×]
    ```
  - [ ] 7.1.4 Notice is dismissible
  - [x] 7.1.5 Notice auto-hides when sync resumes
  - [x] 7.1.6 Style as calm/informational, not alarming

---

### Phase 8: Initial Sync

- [x] 8.0 Implement initial sync on connection
  - [x] 8.0.1 After OAuth + audience selection complete
  - [x] 8.0.2 Fetch all user's contacts with email addresses
  - [x] 8.0.3 Queue each for sync (batch if many)
  - [ ] 8.0.4 Show progress indicator in Settings
  - [ ] 8.0.5 Handle large contact lists (pagination)

- [ ] 8.1 Implement batch sync for CSV imports
  - [ ] 8.1.1 Identify CSV import handler
  - [ ] 8.1.2 After import complete, queue all imported contacts
  - [ ] 8.1.3 Use batch operations where possible (500 per request)

---

### Phase 9: Testing

- [ ] 9.0 Unit tests
  - [ ] 9.0.1 Test `getSubscriberHash()` function
  - [ ] 9.0.2 Test exponential backoff calculation
  - [ ] 9.0.3 Test sync payload construction
  - [ ] 9.0.4 Test field mapping (RealCoach → Mailchimp)

- [ ] 9.1 Integration tests
  - [ ] 9.1.1 Test OAuth flow (mock Mailchimp responses)
  - [ ] 9.1.2 Test contact sync flow
  - [ ] 9.1.3 Test retry logic
  - [ ] 9.1.4 Test disconnect flow

- [ ] 9.2 Manual testing
  - [ ] 9.2.1 Connect Mailchimp account
  - [ ] 9.2.2 Create contact in RealCoach → verify appears in Mailchimp
  - [ ] 9.2.3 Update contact → verify Mailchimp updated
  - [ ] 9.2.4 Add/remove tags → verify tags sync
  - [ ] 9.2.5 Delete contact → verify removed from Mailchimp
  - [ ] 9.2.6 Disconnect → verify credentials removed
  - [ ] 9.2.7 Simulate failure → verify calm notice appears
  - [ ] 9.2.8 Verify NO data flows Mailchimp → RealCoach

---

### Phase 10: Final Verification

- [x] 10.0 Code quality
  - [x] 10.0.1 TypeScript check: `npx tsc --noEmit`
  - [ ] 10.0.2 Lint check: `npm run lint`
  - [ ] 10.0.3 All tests pass: `npm test`
  - [x] 10.0.4 Build succeeds: `npm run build`

- [ ] 10.1 Behavior verification
  - [ ] 10.1.1 Confirm: Sync is ONE-WAY only (RealCoach → Mailchimp)
  - [ ] 10.1.2 Confirm: NO engagement data flows back
  - [ ] 10.1.3 Confirm: Only name, email, phone, tags sync
  - [ ] 10.1.4 Confirm: Failures don't interrupt user
  - [ ] 10.1.5 Confirm: RealCoach data wins all conflicts

- [ ] 10.2 Security verification
  - [ ] 10.2.1 Confirm: OAuth tokens stored securely
  - [ ] 10.2.2 Confirm: API credentials only on server-side
  - [ ] 10.2.3 Confirm: RLS policies prevent cross-user access

- [ ] 10.3 Create PR
  - [ ] 10.3.1 Write PR description with test evidence
  - [ ] 10.3.2 Include screenshots of Settings UI
  - [ ] 10.3.3 Request review

---

## Verification Checklist

After completing all tasks, verify:

- [ ] "Connect Mailchimp" button appears in Settings
- [ ] OAuth flow completes successfully
- [ ] Audience selection works (single and multiple)
- [ ] New contacts sync to Mailchimp automatically
- [ ] Contact updates sync to Mailchimp
- [ ] Tag changes sync to Mailchimp
- [ ] Contact deletion removes from Mailchimp
- [ ] "Sync Now" triggers full sync
- [ ] "Disconnect" removes credentials (not Mailchimp contacts)
- [ ] Sync failures show calm notice in coach panel
- [ ] NO Mailchimp data influences coaching or actions
- [ ] All tests pass
- [ ] Build succeeds
