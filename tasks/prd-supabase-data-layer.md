# PRD: Complete Supabase Data Layer

## Introduction/Overview

The RC1.5 frontend reads and writes to several database tables (`contacts`, `opportunities`, `chat_messages`, `action_items`) that do not exist in the current Supabase schema. This causes 404 errors when the app is deployed to Vercel with Supabase authentication enabled. The goal is to create all missing tables with proper schemas and Row Level Security (RLS) policies to match frontend expectations.

## Goals

1. Create all missing Supabase tables required by the frontend
2. Define proper column schemas matching what the UI code expects
3. Implement RLS policies for secure multi-tenant data access
4. Ensure backward compatibility with existing demo data patterns
5. Enable full CRUD operations for authenticated users

## User Stories

1. **As an authenticated user**, I want my contacts to persist across sessions so I don't lose my data when I refresh or log out.
2. **As an authenticated user**, I want to create, edit, and delete contacts so I can manage my database.
3. **As an authenticated user**, I want to move contacts through my pipeline stages so I can track deal progression.
4. **As an authenticated user**, I want my chat messages with the coach to be saved so I can review past conversations.
5. **As an authenticated user**, I want my daily actions to persist so I can track what I've completed.

## Functional Requirements

### 1. contacts Table

The frontend (`Database.tsx`) expects these columns:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | References auth.users, required |
| first_name | text | Required |
| last_name | text | Required |
| phone | text | Nullable |
| email | text | Nullable |
| lead_source | text | Nullable |
| address | text | Nullable |
| tags | text[] | Array of strings, default empty |
| deal_history | text | Nullable |
| pipeline_stage | integer | Default 0 |
| last_contacted | timestamptz | Nullable |
| notes | jsonb | Array of {date, content} objects |
| created_at | timestamptz | Auto-generated |
| updated_at | timestamptz | Auto-updated |

### 2. opportunities Table

The frontend (`AddToPipelineModal.tsx`, `Pipeline.tsx`) expects:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| contact_id | uuid | Optional, references contacts |
| contact_name | text | Denormalized for quick display |
| stage | integer | Pipeline stage (0-6) |
| deal_value | numeric | Optional |
| expected_close_date | date | Optional |
| notes | text | Optional |
| created_at | timestamptz | Auto-generated |
| updated_at | timestamptz | Auto-updated |

### 3. chat_messages Table

The frontend (`CoachPanel.tsx`) saves conversation history:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| role | text | 'user' or 'assistant' |
| content | text | Message content |
| coaching_mode | text | Optional, current mode when sent |
| created_at | timestamptz | Auto-generated |

### 4. action_items Table (Full Definition)

The schema currently only adds columns to a non-existent table. Create the base table:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| title | text | Required, action title |
| description | text | Optional |
| action_type | text | 'primary' or 'supporting', default 'primary' |
| category | text | 'contact', 'non_contact', 'admin', 'planning' |
| status | text | 'pending', 'completed', 'skipped' |
| minimum_viable | text | Minimum version of action |
| stretch_goal | text | Optional stretch version |
| milestone_connection | text | Why this matters |
| minutes_estimate | integer | Expected time |
| steps | text[] | Array of sub-steps |
| action_date | date | When action is assigned |
| priority | text | 'high', 'medium', 'low' |
| completed_at | timestamptz | When completed |
| created_at | timestamptz | Auto-generated |
| updated_at | timestamptz | Auto-updated |

### 5. Row Level Security

All tables must have RLS enabled with policies that restrict access to the authenticated user's own data:

```sql
-- Example policy pattern
CREATE POLICY "Users can CRUD own data" ON table_name
  FOR ALL USING (auth.uid() = user_id);
```

## Non-Goals (Out of Scope)

- Database migrations for existing data (no existing prod data)
- Admin dashboard access to all users' data
- Soft delete / archival functionality
- Data export functionality
- Audit logging beyond what Supabase provides

## Technical Considerations

1. **Migration file**: Create a new migration file or update `/supabase/schema.sql`
2. **Indexes**: Add indexes on `user_id` columns for query performance
3. **Triggers**: Add `updated_at` triggers similar to existing tables
4. **Type generation**: After schema update, regenerate Supabase types with `npx supabase gen types typescript`
5. **Rollback plan**: Tables can be dropped if needed (no existing data)

## Success Metrics

1. Zero 404 errors when authenticated users access Database, Pipeline, or Coach panels
2. All CRUD operations succeed for authenticated users
3. Unauthenticated users see demo data only (no Supabase errors)
4. Type-safe integration with existing TypeScript code

## Open Questions

1. Should `contact_name` in opportunities be denormalized or always joined from contacts?
2. Should chat history have a retention limit or store indefinitely?
3. Do we need contact deduplication logic (same name/email)?
