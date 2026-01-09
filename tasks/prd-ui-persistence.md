# PRD: Wire Database & Pipeline UI to Supabase

## Introduction/Overview

The Database and Pipeline pages currently use hardcoded demo data and local React state. Changes are lost on page refresh. Once the Supabase tables exist (per `prd-supabase-data-layer.md`), the UI needs to be wired up to perform real CRUD operations. The goal is to make all user data persist to Supabase while gracefully handling unauthenticated users.

## Goals

1. Connect Database page to `contacts` and `opportunities` tables
2. Connect Pipeline page to `opportunities` table
3. Connect CoachPanel to `chat_messages` table
4. Connect Goals & Actions page to `action_items` table
5. Show demo data for unauthenticated users (current behavior)
6. Show real data + demo data blend for authenticated users until they have their own

## User Stories

1. **As an authenticated user**, I want contacts I create to persist so I can see them when I come back.
2. **As an authenticated user**, I want pipeline status changes to save automatically so I don't lose progress.
3. **As an authenticated user**, I want my chat history with the coach to load when I return.
4. **As an unauthenticated user**, I want to see demo data so I can explore the app before signing up.

## Functional Requirements

### 1. Database Page (`src/pages/Database.tsx`)

**Current behavior**: Uses `demoContacts` array and `useState`.

**New behavior**:

```typescript
// On mount
useEffect(() => {
  if (user) {
    // Fetch user's contacts from Supabase
    const { data } = await supabase.from('contacts').select('*');
    setContacts([...data, ...demoContacts]); // Blend with demos
  } else {
    setContacts(demoContacts);
  }
}, [user]);
```

**CRUD Operations**:

| Action | Implementation |
|--------|---------------|
| Create contact | `supabase.from('contacts').insert({...})` |
| Update contact | `supabase.from('contacts').update({...}).eq('id', id)` |
| Delete contact | `supabase.from('contacts').delete().eq('id', id)` |
| Add note | Update contact's notes JSONB field |

### 2. Pipeline Page (`src/pages/Pipeline.tsx`)

**Current behavior**: Uses `initialPipelineData` array and `useState`.

**New behavior**:

```typescript
// On mount
useEffect(() => {
  if (user) {
    const { data } = await supabase.from('opportunities').select('*');
    setPipelineData([...formatOpportunities(data), ...demoPipeline]);
  } else {
    setPipelineData(demoPipeline);
  }
}, [user]);
```

**Status Changes**:

```typescript
const handleStatusChange = async (leadId: string, newStatus: string) => {
  // Optimistic update
  setPipelineData(prev => prev.map(lead =>
    lead.id === leadId ? { ...lead, status: newStatus } : lead
  ));

  // Persist to Supabase (if real data, not demo)
  if (!isDemoLead(leadId)) {
    await supabase.from('opportunities')
      .update({ stage: statusToStage(newStatus) })
      .eq('id', leadId);
  }
};
```

### 3. Coach Panel (`src/components/layout/CoachPanel.tsx`)

**Chat History Persistence**:

```typescript
// Save each message as it's sent/received
const saveMessage = async (role: 'user' | 'assistant', content: string) => {
  if (!user) return;
  await supabase.from('chat_messages').insert({
    user_id: user.id,
    role,
    content,
    coaching_mode: currentMode,
  });
};

// Load history on mount
useEffect(() => {
  if (user) {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100); // Last 100 messages
    setMessages(data);
  }
}, [user]);
```

### 4. Goals & Actions Page

**Action Items**:

```typescript
// Load user's actions for today
const { data } = await supabase
  .from('action_items')
  .select('*')
  .eq('action_date', today)
  .order('priority', { ascending: false });

// Mark action complete
await supabase
  .from('action_items')
  .update({ status: 'completed', completed_at: new Date() })
  .eq('id', actionId);
```

### 5. AddToPipelineModal Updates

Currently creates opportunities - verify it saves to Supabase:

```typescript
const handleSubmit = async () => {
  await supabase.from('opportunities').insert({
    user_id: user.id,
    contact_name: contactName,
    stage: 0,
    deal_value: dealValue,
    expected_close_date: closeDate,
  });
  onSuccess();
};
```

### 6. CreateContactModal Updates

Ensure it saves to Supabase:

```typescript
const handleSubmit = async () => {
  await supabase.from('contacts').insert({
    user_id: user.id,
    first_name: firstName,
    last_name: lastName,
    phone,
    email,
    lead_source: leadSource,
  });
  onContactCreated();
};
```

## Non-Goals (Out of Scope)

- Offline support / local caching
- Realtime sync (Supabase subscriptions)
- Conflict resolution for simultaneous edits
- Bulk import from CSV
- Data migration from localStorage

## Design Considerations

### Loading States

Show skeleton loaders while fetching:

```tsx
if (isLoading) {
  return <ContactsSkeleton />;
}
```

### Error Handling

```tsx
const [error, setError] = useState<string | null>(null);

try {
  await supabase.from('contacts').insert({...});
} catch (e) {
  setError('Failed to save contact. Please try again.');
  // Optionally: revert optimistic update
}
```

### Demo Data Identification

Tag demo items to prevent Supabase operations:

```typescript
const demoContacts = [
  { id: 'demo-1', isDemo: true, ... },
  { id: 'demo-2', isDemo: true, ... },
];

const isDemoItem = (id: string) => id.startsWith('demo-');
```

## Technical Considerations

1. **Auth Context**: Use `useAuth()` hook to get current user
2. **Custom Hooks**: Consider `useContacts()`, `useOpportunities()` hooks
3. **React Query / SWR**: Consider for caching and revalidation (future)
4. **Optimistic Updates**: Update UI immediately, sync to DB in background
5. **Error Boundaries**: Catch and display Supabase errors gracefully

## Success Metrics

1. All CRUD operations succeed for authenticated users
2. Data persists across page refreshes
3. No errors for unauthenticated users viewing demo data
4. Page load time < 500ms with Supabase queries
5. Status changes save within 200ms (optimistic update feels instant)

## Open Questions

1. Should we keep showing demo data alongside user data, or hide demos once user has real data?
2. Should Pipeline auto-refresh in background (realtime subscriptions)?
3. Max chat history to load - 100 messages? All? Paginated?
