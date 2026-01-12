# Phase 4: UI Persistence - Implementation Prompt

## Overview

Wire the remaining UI pages to Supabase for full data persistence. Currently, Database.tsx, Pipeline.tsx, and GoalsAndActions.tsx use demo data with partial Supabase integration. The goal is complete CRUD operations with proper loading states, error handling, and demo data fallback for unauthenticated users.

---

## Current State Analysis

### What's Already Done ✅
- **CoachPanel.tsx** → `chat_messages` table (fully integrated via `useChatMessages` hook)
- Supabase tables exist with RLS policies
- TypeScript types generated for all tables
- Demo data patterns established

### What Needs Completion

| Page | Table | Current State | Gap |
|------|-------|---------------|-----|
| `Database.tsx` | `contacts` | Partial - has update/delete, missing fetch on load | Fetch + blend with demo |
| `Pipeline.tsx` | `opportunities` | Partial - has fetch, missing reliable CRUD | Complete CRUD + stage updates |
| `GoalsAndActions.tsx` | `action_items` | Minimal - has fetch skeleton | Full persistence + completion tracking |

---

## Sub-Features (Each Becomes a PRD)

### PRD 4.1: Database Page - Contacts CRUD

**File**: `src/pages/Database.tsx`
**Table**: `contacts`

**Current Issues**:
- Line 73: `useState<Contact[]>(demoContacts)` - starts with demo, but no Supabase fetch
- Line 84-127: Has `handleUpdateContact` but only for non-demo contacts
- No `useEffect` to fetch contacts on mount
- No create contact → Supabase flow

**Requirements**:
1. On mount, if user logged in: fetch from `contacts` table, blend with demo
2. `CreateContactModal` should insert to Supabase
3. Update/delete should only work for real contacts (demo = read-only)
4. Add loading skeleton while fetching
5. Show error toast on Supabase errors
6. Real-time updates optional (nice-to-have)

**Schema Reference** (from types.ts lines 203-264):
```typescript
contacts: {
  id: string
  user_id: string
  first_name: string
  last_name: string
  phone: string | null
  email: string | null
  address: string | null
  lead_source: string | null
  tags: string[]
  deal_history: string | null
  pipeline_stage: number
  last_contacted: string | null
  notes: Json  // Array of {date, content}
}
```

**UI ↔ Schema Mapping**:
| UI Field | Schema Field |
|----------|--------------|
| `firstName` | `first_name` |
| `lastName` | `last_name` |
| `phone` | `phone` |
| `email` | `email` |
| `lastContacted` | `last_contacted` |
| `leadSource` | `lead_source` |
| `address` | `address` |
| `tags` | `tags` |
| `notes` | `notes` (JSONB) |
| `dealHistory` | `deal_history` |
| `pipelineStage` | `pipeline_stage` |
| `isInPipeline` | Derived: `pipeline_stage > 0` |

---

### PRD 4.2: Pipeline Page - Opportunities CRUD

**File**: `src/pages/Pipeline.tsx`
**Table**: `opportunities`

**Current Issues**:
- Lines 88-136: Has `fetchOpportunities` but converts to demo format
- No stage update persistence (drag-drop or status change)
- No create opportunity from pipeline page
- No delete opportunity

**Requirements**:
1. Fetch opportunities on mount, map to `PipelineLead` format
2. Status changes persist immediately (optimistic update)
3. Create new opportunities from pipeline
4. Delete opportunities (with confirmation)
5. Notes update persistence
6. Loading state during fetch

**Schema Reference** (from types.ts lines 309-367):
```typescript
opportunities: {
  id: string
  user_id: string
  contact_id: string | null
  contact_name: string
  stage: number  // 0-6 matching PIPELINE_STATUSES
  deal_value: number | null
  expected_close_date: string | null
  deal_type: string | null  // "Buy" | "Sell"
  source: string | null
  notes: string | null
}
```

**UI ↔ Schema Mapping**:
| UI Field | Schema Field |
|----------|--------------|
| `name` | `contact_name` |
| `dealAmount` | `deal_value` |
| `gci` | Calculated: `deal_value * 0.03` |
| `estClose` | `expected_close_date` |
| `status` | Derived from `stage` via `PIPELINE_STATUSES[stage]` |
| `dealType` | `deal_type` |
| `source` | `source` |
| `pipelineStage` | `stage` |

**Stage ↔ Status Mapping**:
```typescript
const PIPELINE_STATUSES = [
  "Initial Contact",  // stage 0
  "Follow Up",        // stage 1
  "Showing",          // stage 2
  "Offer Submitted",  // stage 3
  "Under Contract",   // stage 4
  "Closed",           // stage 5
];
```

---

### PRD 4.3: Goals & Actions Page - Action Items CRUD

**File**: `src/pages/GoalsAndActions.tsx`
**Table**: `action_items`

**Current Issues**:
- Line 66-67: Uses demo `actions` and `completed` state
- Line 82-90: Has `fetchActions()` call but function not shown
- Action completion not persisted
- Generated actions from LLM not saved

**Requirements**:
1. Fetch today's actions on mount (filter by `action_date`)
2. Save LLM-generated actions to database
3. Action completion updates `status` and `completed_at`
4. Split into pending vs completed based on `status`
5. Show empty state when no actions for today
6. Loading state during fetch/generation

**Schema Reference** (from types.ts lines 12-79):
```typescript
action_items: {
  id: string
  user_id: string
  title: string
  description: string | null
  action_type: string  // "primary" | "supporting"
  category: string | null  // "contact" | "non_contact" | "admin" | "planning"
  status: string  // "pending" | "completed" | "skipped"
  minimum_viable: string | null
  stretch_goal: string | null
  milestone_connection: string | null
  minutes_estimate: number | null
  steps: string[]
  action_date: string  // ISO date
  priority: string  // "high" | "medium" | "low"
  completed_at: string | null
}
```

**UI ↔ Schema Mapping**:
| UI Field | Schema Field |
|----------|--------------|
| `title` | `title` |
| `description` | `description` |
| `priority` | `priority` |
| `completed` | Derived: `status === 'completed'` |

**Completion Logic**:
```typescript
// Mark complete
await supabase
  .from('action_items')
  .update({
    status: 'completed',
    completed_at: new Date().toISOString()
  })
  .eq('id', actionId);

// Mark incomplete (undo)
await supabase
  .from('action_items')
  .update({
    status: 'pending',
    completed_at: null
  })
  .eq('id', actionId);
```

---

## Shared Patterns

### 1. Custom Hook Pattern

Each page should extract data logic into a hook:

```typescript
// src/hooks/useContacts.ts
export function useContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch on mount
  useEffect(() => {
    if (!user) {
      setContacts(demoContacts);
      setIsLoading(false);
      return;
    }
    fetchContacts();
  }, [user]);

  const fetchContacts = async () => { ... };
  const createContact = async (data: ContactInput) => { ... };
  const updateContact = async (id: string, data: Partial<Contact>) => { ... };
  const deleteContact = async (id: string) => { ... };

  return { contacts, isLoading, error, createContact, updateContact, deleteContact };
}
```

### 2. Demo Data Handling

```typescript
// Identify demo items
const isDemoItem = (id: string) => id.startsWith('demo-');

// Blend demo with real data
const allContacts = [...realContacts, ...demoContacts.filter(d => d.isDemo)];

// Prevent CRUD on demo items
if (isDemoItem(id)) {
  toast.error("Demo data is read-only. Create a real contact to edit.");
  return;
}
```

### 3. Optimistic Updates

```typescript
const handleStatusChange = async (id: string, newStatus: string) => {
  // 1. Optimistic update
  setData(prev => prev.map(item =>
    item.id === id ? { ...item, status: newStatus } : item
  ));

  // 2. Persist to DB
  const { error } = await supabase
    .from('opportunities')
    .update({ stage: statusToStage(newStatus) })
    .eq('id', id);

  // 3. Rollback on error
  if (error) {
    setData(prev => prev.map(item =>
      item.id === id ? { ...item, status: oldStatus } : item
    ));
    toast.error("Failed to save. Please try again.");
  }
};
```

### 4. Loading States

```typescript
if (isLoading) {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
```

### 5. Error Handling

```typescript
try {
  const { data, error } = await supabase.from('contacts').select('*');
  if (error) throw error;
  setContacts(mapToUIFormat(data));
} catch (err) {
  console.error('Fetch error:', err);
  toast.error("Couldn't load contacts. Using demo data.");
  setContacts(demoContacts);
}
```

---

## Implementation Order

1. **PRD 4.1: Database Contacts** - Most complex, establishes patterns
2. **PRD 4.2: Pipeline Opportunities** - Similar pattern, adds stage logic
3. **PRD 4.3: Goals & Actions** - Ties into calibration flow

---

## Success Criteria

| Criterion | Test |
|-----------|------|
| Data persists | Refresh page → data still there |
| Demo fallback | Log out → see demo data |
| Demo read-only | Try to edit demo → shows error |
| Optimistic UI | Update feels instant |
| Error recovery | Disconnect network → shows error, retries |
| Loading states | Slow network → shows skeleton |

---

## Files to Create/Modify

### New Hooks
- `src/hooks/useContacts.ts`
- `src/hooks/useOpportunities.ts`
- `src/hooks/useActionItems.ts`

### Modified Pages
- `src/pages/Database.tsx`
- `src/pages/Pipeline.tsx`
- `src/pages/GoalsAndActions.tsx`

### Modified Modals
- `src/components/database/CreateContactModal.tsx`
- `src/components/database/AddToPipelineModal.tsx`

---

## Dependencies

```
PRD 4.1 (Contacts)
    ↓
PRD 4.2 (Pipeline) - can link to contacts
    ↓
PRD 4.3 (Actions) - uses calibration state
```

---

## Non-Goals

- Offline support / local caching
- Real-time subscriptions (future enhancement)
- Bulk import/export
- Data migration from localStorage
- Conflict resolution for simultaneous edits

---

## How to Use This Prompt

For each PRD, provide this document as context along with:

1. The specific PRD section (4.1, 4.2, or 4.3)
2. The current file contents
3. The Supabase types for that table

Example:
```
Create PRD 4.1 (Database Contacts CRUD) using the patterns in PHASE4_UI_PERSISTENCE_PROMPT.md.
Current file: [paste Database.tsx]
Table schema: [paste contacts from types.ts]
```
