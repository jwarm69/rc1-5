# Manual Testing Guide - RC1.5 MVP

This document provides manual test scripts for validating MVP functionality before deployment.

## Prerequisites

1. Development environment running (`npm run dev`)
2. Supabase project configured with schema applied
3. At least one test user account
4. (Optional) Mailchimp account for integration testing

---

## Test Suite 1: Authentication & Onboarding

### T1.1: New User Sign Up
**Steps:**
1. Navigate to `/auth`
2. Click "Sign up with Email"
3. Enter valid email and password
4. Verify confirmation email received (if email confirmation enabled)
5. Confirm email and sign in

**Expected Result:**
- User redirected to `/demo/goals`
- Coach panel shows first calibration question
- State is `UNINITIALIZED` or `CALIBRATING`

### T1.2: Google OAuth Sign In
**Steps:**
1. Navigate to `/auth`
2. Click "Sign in with Google"
3. Complete Google OAuth flow

**Expected Result:**
- User redirected to `/demo/goals`
- New user sees calibration flow
- Returning user sees their saved state

### T1.3: Sign Out
**Steps:**
1. While logged in, click user menu
2. Click "Sign Out"

**Expected Result:**
- User redirected to `/auth`
- All session data cleared

---

## Test Suite 2: Calibration Flow

### T2.1: Full Calibration (7 Questions)
**Steps:**
1. Start fresh (clear localStorage: `localStorage.clear()` in console)
2. Sign in as new user
3. Open coach panel (sidebar icon)
4. Answer all 7 calibration questions one by one
5. Review G&A draft when presented
6. Confirm G&A

**Expected Result:**
- [ ] Only ONE question shown at a time
- [ ] No advice given during CLARIFY mode
- [ ] G&A draft shows Annual Goal, Monthly Milestones, Friction Boundaries
- [ ] After confirmation, daily actions appear
- [ ] State transitions: UNINITIALIZED → CALIBRATING → G&A_DRAFTED → G&A_CONFIRMED → ACTIONS_ACTIVE

### T2.2: Fast Lane Protocol
**Steps:**
1. Start calibration
2. Give very short answers (1-2 words) to first 2 questions
3. Observe if Fast Lane is offered

**Expected Result:**
- After 2 short answers, coach may offer to skip to essentials
- If accepted, calibration completes faster
- G&A still generated with available data

### T2.3: Calibration Persistence
**Steps:**
1. Complete 3 calibration questions
2. Close browser/tab
3. Reopen and sign in

**Expected Result:**
- Calibration resumes from where it left off
- Previous answers preserved
- No duplicate questions

---

## Test Suite 3: Coaching Conversation

### T3.1: Mode Enforcement
**Steps:**
1. In CLARIFY mode, try asking for advice
2. In REFLECT mode, verify coach mirrors back
3. In REFRAME mode, verify no questions asked
4. In COMMIT mode, verify explicit commitment requested
5. In DIRECT mode, verify clear action instructions only

**Expected Result:**
- Each mode follows its behavioral constraints
- Mode transitions happen naturally based on conversation

### T3.2: One Question Rule
**Steps:**
1. Have a conversation with the coach
2. Count questions in each response

**Expected Result:**
- Never more than 1 question per coach response
- Questions end with single `?`

### T3.3: Banned Words Check
**Steps:**
1. Search coach responses for: crush, hustle, grind, empower, synergy, game-changer
2. Try to get coach to use these words

**Expected Result:**
- Coach NEVER uses banned words
- Alternative, calm language used instead

---

## Test Suite 4: Daily Actions

### T4.1: Action Generation
**Steps:**
1. Complete calibration and confirm G&A
2. Navigate to `/demo/goals`
3. View daily actions section

**Expected Result:**
- Maximum 1 primary action shown
- Maximum 2 supporting actions shown
- No overdue/missed indicators
- No streaks or timers

### T4.2: Actions Gated by G&A
**Steps:**
1. As new user before calibration complete
2. Try to access daily actions

**Expected Result:**
- Actions section shows "Complete your Goals & Actions first" or similar
- Cannot see or interact with daily actions until G&A confirmed

### T4.3: Action Completion
**Steps:**
1. View daily actions
2. Mark primary action as complete
3. Mark supporting action as complete

**Expected Result:**
- Actions marked complete visually
- No guilt-inducing language for uncompleted actions
- State persists across page refresh

---

## Test Suite 5: Screenshot Interpretation

### T5.1: Single Screenshot Upload
**Steps:**
1. Open coach panel
2. Drag and drop a screenshot (text conversation, calendar, etc.)
3. Wait for interpretation

**Expected Result:**
- [ ] Preview shown before processing
- [ ] "Here's What I See" interpretation displayed
- [ ] Interpretation shows detected content type
- [ ] User asked to CONFIRM before signals generated

### T5.2: Screenshot Confirmation Flow
**Steps:**
1. Upload a screenshot
2. Review interpretation
3. Click "Yes, that's right" or similar confirmation

**Expected Result:**
- Signals only generated AFTER confirmation
- Coach may suggest follow-up actions based on content
- Priority context passed to Daily Action Engine

### T5.3: Screenshot Rejection
**Steps:**
1. Upload a screenshot
2. Review interpretation
3. Click "No, that's not right" or cancel

**Expected Result:**
- No signals generated
- No action changes
- User can re-upload or provide clarification

### T5.4: Daily Limit (10 uploads)
**Steps:**
1. Upload 10 screenshots in one day
2. Try to upload an 11th

**Expected Result:**
- User informed of daily limit reached
- Upload blocked until next day

### T5.5: File Validation
**Steps:**
1. Try to upload non-image file (PDF, text)
2. Try to upload image > 10MB

**Expected Result:**
- Invalid file type rejected with clear message
- Oversized file rejected with clear message

---

## Test Suite 6: Mailchimp Integration

### T6.1: OAuth Connection
**Steps:**
1. Navigate to Settings
2. Find Mailchimp integration section
3. Click "Connect Mailchimp"
4. Complete OAuth flow

**Expected Result:**
- Redirected to Mailchimp authorization
- After approval, redirected back to app
- Connection status shows "Connected"

### T6.2: Audience Selection
**Steps:**
1. After connecting Mailchimp
2. Select an audience from dropdown

**Expected Result:**
- Available audiences listed
- Selected audience saved
- Status shows ready for sync

### T6.3: Contact Sync
**Steps:**
1. With Mailchimp connected and audience selected
2. Create a new contact with email
3. Wait for sync (or trigger manual sync)
4. Check Mailchimp audience

**Expected Result:**
- Contact appears in Mailchimp audience
- Name, email, phone synced
- Tags synced if present

### T6.4: Contact Update Sync
**Steps:**
1. Update an existing contact's name
2. Wait for sync
3. Check Mailchimp

**Expected Result:**
- Updated info reflected in Mailchimp
- No duplicate contacts created

### T6.5: Contact Delete Sync
**Steps:**
1. Delete a contact from RealCoach
2. Wait for sync
3. Check Mailchimp

**Expected Result:**
- Contact removed from Mailchimp audience

### T6.6: Sync Error Handling
**Steps:**
1. Disconnect from Mailchimp (revoke OAuth in Mailchimp)
2. Make contact changes
3. Reconnect

**Expected Result:**
- Sync failures don't block UI
- Error status shown in settings
- Queued items retry after reconnection

### T6.7: Disconnect
**Steps:**
1. Navigate to Settings
2. Click "Disconnect Mailchimp"

**Expected Result:**
- OAuth tokens removed
- Status shows "Not connected"
- No error messages

---

## Test Suite 7: Pipeline Management

### T7.1: Create Contact
**Steps:**
1. Navigate to Pipeline
2. Click "Add Contact"
3. Fill in contact details
4. Save

**Expected Result:**
- Contact appears in list
- All fields saved correctly
- If Mailchimp connected, sync queued

### T7.2: Create Opportunity
**Steps:**
1. Select a contact
2. Click "Add Opportunity"
3. Fill in deal details
4. Save

**Expected Result:**
- Opportunity linked to contact
- Stage and value saved
- Appears in pipeline view

### T7.3: Move Opportunity Through Stages
**Steps:**
1. View an opportunity
2. Change stage (Lead → Qualified → Proposal → etc.)

**Expected Result:**
- Stage updates immediately
- History preserved (if implemented)
- Coach may acknowledge progress

---

## Test Suite 8: No-Urgency Design

### T8.1: UI Audit
**Steps:**
1. Navigate through all pages
2. Look for urgency indicators

**Expected Result:**
- [ ] No countdown timers anywhere
- [ ] No streak counts
- [ ] No "X days overdue" labels
- [ ] No red/urgent color coding for time
- [ ] No "Don't break the chain" messaging

### T8.2: Missed Day Handling
**Steps:**
1. Complete setup
2. Don't use app for 2+ days
3. Return to app

**Expected Result:**
- No guilt-inducing messages
- No "You missed X days"
- Fresh start, not punishment

---

## Test Suite 9: Edge Cases

### T9.1: Offline Handling
**Steps:**
1. Disable network
2. Try to use app
3. Re-enable network

**Expected Result:**
- Graceful error messages
- No data loss
- Resumes normally when online

### T9.2: Session Expiry
**Steps:**
1. Let session expire (or clear auth token)
2. Try to perform action

**Expected Result:**
- Redirected to login
- No confusing error messages
- After login, can continue

### T9.3: Concurrent Sessions
**Steps:**
1. Log in on two devices/browsers
2. Make changes on device A
3. Check device B

**Expected Result:**
- Changes sync via Supabase realtime
- No conflicts or data loss

---

## Quick Smoke Test (5 minutes)

For rapid validation before deployment:

1. [ ] Sign in works
2. [ ] Coach panel opens and responds
3. [ ] Can complete one calibration question
4. [ ] Can upload a screenshot
5. [ ] Daily actions page loads
6. [ ] Settings page loads
7. [ ] No console errors (check browser DevTools)

---

## Regression Checklist

Before each deployment, verify:

- [ ] All smoke tests pass
- [ ] Build completes without errors (`npm run build`)
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
- [ ] Unit tests pass (`npm test`)

---

*Last updated: January 12, 2026*
