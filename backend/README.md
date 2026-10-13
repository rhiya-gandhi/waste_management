# WasteRoute Backend & Supabase Database Configuration

This folder contains versioned PostgreSQL migrations, Row Level Security (RLS) policies, and triggers designed for Supabase.

---

## 1. Migration Sequence

Execute the migrations in numerical order using the **Supabase SQL Editor**:

1. `001_initial_schema.sql`:
   - Creates ENUMs: `user_role_type`, `recycler_verification_type`, `material_category_type`, `batch_status_type`, `collection_status_type`.
   - Creates core tables: `profiles`, `recyclers`, `accepted_materials`, `waste_batches`, `collection_requests`, `handover_records`, `waste_status_history`, `notifications`.
   - Creates performance and geospatial indexes.

2. `002_rls_policies.sql`:
   - Enables RLS on all 8 tables.
   - Creates `get_current_role()` and `is_admin()` security definer helper functions.
   - Enforces least-privilege security policies for each role (`generator`, `collector`, `recycler`, `admin`).
   - Prevents role escalation by client code.

3. `003_audit_triggers.sql`:
   - Configures automatic user profile synchronization from `auth.users` on signup.
   - Configures automatic status logging trigger on `waste_batches` status changes.
   - Updates batch status to `confirmed` upon verified recycler handover sign-off.

4. `004_seed_demo_data.sql`:
   - Fictional demo seed data for local testing, demo personas, facilities, and batches.

---

## 2. Supabase Storage Buckets Setup

In your Supabase Dashboard:
1. Navigate to **Storage** &rarr; **New Bucket**.
2. Create bucket: `waste-images` (Public: Off, or On for public demo previews).
3. Create bucket: `handover-evidence` (Public: Off, authenticated read only).
4. Apply storage policy allowing authenticated users to upload files up to 10MB (JPEG, PNG, WEBP).

---

## 3. How to Securely Configure the First Admin Account

To preserve zero-trust security, the admin role is **never** selectable in public signup forms.

To grant admin access to the first operator:
1. Sign up normally via the WasteRoute registration page or Supabase Auth Dashboard with the operator email (e.g. `admin@yourdomain.com`).
2. Open the **Supabase SQL Editor**.
3. Run the following targeted SQL statement:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@yourdomain.com';
```

4. The user now has full administrative privileges, verified through database Row Level Security.

---

## 4. Migration Failure Recovery

If a migration fails due to network interruption or syntax issues:
- All DDL statements are wrapped with `IF NOT EXISTS` and exception blocks for idempotency.
- If an enum already exists, the `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;` block safely skips duplicate errors.
- To reset local development tables cleanly:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```
Then re-apply migrations 001 through 004 in order.
