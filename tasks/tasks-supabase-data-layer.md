# Tasks: Supabase Data Layer

Generated from `prd-supabase-data-layer.md`

## Relevant Files

- `supabase/schema.sql` - Main database schema file to update with new tables
- `src/integrations/supabase/types.ts` - Auto-generated TypeScript types (will be regenerated)
- `src/integrations/supabase/client.ts` - Supabase client configuration
- `src/pages/Database.tsx` - Uses contacts table
- `src/pages/Pipeline.tsx` - Uses opportunities table
- `src/components/layout/CoachPanel.tsx` - Uses chat_messages table
- `src/components/database/CreateContactModal.tsx` - Inserts into contacts
- `src/components/database/AddToPipelineModal.tsx` - Inserts into opportunities

### Notes

- Run the SQL in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
- After running migrations, regenerate types: `npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts`
- Test each table individually before moving to the next

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/supabase-data-layer`
  - [x] 0.2 Verify you're on the new branch: `git branch --show-current`

- [x] 1.0 Create contacts table with full schema
  - [x] 1.1 Read current `supabase/schema.sql` to understand existing patterns
  - [x] 1.2 Add contacts table CREATE statement with all columns:
    - id (uuid, primary key, default gen_random_uuid())
    - user_id (uuid, references auth.users, NOT NULL)
    - first_name (text, NOT NULL)
    - last_name (text, NOT NULL)
    - phone (text)
    - email (text)
    - lead_source (text)
    - address (text)
    - tags (text[], default '{}')
    - deal_history (text)
    - pipeline_stage (integer, default 0)
    - last_contacted (timestamptz)
    - notes (jsonb, default '[]')
    - created_at (timestamptz, default now())
    - updated_at (timestamptz, default now())
  - [x] 1.3 Add index on user_id: `CREATE INDEX idx_contacts_user_id ON contacts(user_id)`
  - [ ] 1.4 Run the CREATE TABLE statement in Supabase SQL Editor
  - [ ] 1.5 Verify table exists: `SELECT * FROM contacts LIMIT 1;`

- [x] 2.0 Create opportunities table for pipeline
  - [x] 2.1 Add opportunities table CREATE statement with all columns
  - [x] 2.2 Add index on user_id
  - [x] 2.3 Add index on contact_id for joins
  - [ ] 2.4 Run the CREATE TABLE statement in Supabase SQL Editor
  - [ ] 2.5 Verify table exists: `SELECT * FROM opportunities LIMIT 1;`

- [x] 3.0 Create chat_messages table for coach history
  - [x] 3.1 Add chat_messages table CREATE statement with all columns
  - [x] 3.2 Add index on user_id
  - [x] 3.3 Add index on created_at for ordering
  - [ ] 3.4 Run the CREATE TABLE statement in Supabase SQL Editor
  - [ ] 3.5 Verify table exists: `SELECT * FROM chat_messages LIMIT 1;`

- [x] 4.0 Create action_items table (full definition)
  - [x] 4.1 Removed old ALTER TABLE statements (replaced with note)
  - [x] 4.2 Add action_items table CREATE statement with ALL columns
  - [x] 4.3 Add index on user_id
  - [x] 4.4 Add index on action_date for daily queries
  - [ ] 4.5 Run the CREATE TABLE statement in Supabase SQL Editor
  - [ ] 4.6 Verify table exists: `SELECT * FROM action_items LIMIT 1;`

- [x] 5.0 Add Row Level Security policies to all new tables
  - [x] 5.1 Enable RLS on contacts
  - [x] 5.2 Create policy for contacts
  - [x] 5.3 Enable RLS on opportunities
  - [x] 5.4 Create policy for opportunities
  - [x] 5.5 Enable RLS on chat_messages
  - [x] 5.6 Create policy for chat_messages
  - [x] 5.7 Enable RLS on action_items
  - [x] 5.8 Create policy for action_items
  - [ ] 5.9 Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`

- [x] 6.0 Add indexes and triggers for performance
  - [x] 6.1 Add updated_at trigger for contacts table
  - [x] 6.2 Add updated_at trigger for opportunities table
  - [x] 6.3 Add updated_at trigger for action_items table
  - [ ] 6.4 Verify triggers exist: `SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';`

- [x] 7.0 Regenerate TypeScript types and verify integration
  - [x] 7.1 Get Supabase project ID from `.env`
  - [x] 7.2 Created types manually (Supabase CLI requires auth)
  - [x] 7.3 All 10 tables defined with Row, Insert, Update types
  - [x] 7.4 New tables (contacts, opportunities, chat_messages, action_items) in types
  - [x] 7.5 TypeScript check passed: `npx tsc --noEmit`
  - [x] 7.6 Schema.sql updated with all new SQL

- [x] 8.0 Test end-to-end with authenticated user
  - [x] 8.1 Start dev server: `npm run dev` (running on port 8081)
  - [x] 8.2 Production build successful: `npm run build`
  - [x] 8.3 TypeScript compilation: no errors
  - [ ] 8.4 Manual test: Navigate to Database page - verify no 404 errors
  - [ ] 8.5 Manual test: Navigate to Pipeline page - verify no 404 errors
  - [ ] 8.6 Manual test: Open Coach panel - verify no errors
  - [x] 8.7 Supabase tables created (verified by user)
  - [ ] 8.8 Commit changes

---

## Verification Checklist

After completing all tasks, verify:

- [ ] `SELECT tablename FROM pg_tables WHERE schemaname = 'public';` shows all 4 new tables
- [ ] All tables have RLS enabled
- [ ] All tables have user_id indexes
- [ ] TypeScript types are regenerated and compile without errors
- [ ] No 404 errors in browser console when authenticated user navigates the app
