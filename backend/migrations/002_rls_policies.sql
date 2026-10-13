-- WasteRoute Database Schema: Migration 002_rls_policies.sql
-- Description: Enable Row Level Security (RLS) on all tables and configure explicit least-privilege policies

-- 1. Helper Security Functions (SECURITY DEFINER with secure search_path)
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role_type AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recyclers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accepted_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES POLICIES
-- Anyone authenticated can view other profiles minimally, or own profile fully
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())); -- Prevent self-promoting role

-- Allow inserting own profile during signup
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 4. RECYCLERS POLICIES
-- Verified recyclers are visible to everyone authenticated (for directory & matching)
CREATE POLICY "Verified recyclers are publicly viewable"
    ON public.recyclers FOR SELECT
    USING (verification_status = 'verified' OR user_id = auth.uid() OR public.is_admin());

-- Recyclers can insert their own facility (status defaults to pending)
CREATE POLICY "Recycler owners can insert their facility"
    ON public.recyclers FOR INSERT
    WITH CHECK (user_id = auth.uid() AND verification_status = 'pending');

-- Recyclers can update their own facility details BUT NOT verification status
CREATE POLICY "Recycler owners can update own facility"
    ON public.recyclers FOR UPDATE
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (
        (user_id = auth.uid() AND verification_status = (SELECT verification_status FROM public.recyclers WHERE id = id))
        OR public.is_admin()
    );

-- 5. ACCEPTED_MATERIALS POLICIES
-- Visible to all authenticated users for matching
CREATE POLICY "Accepted materials are viewable by all"
    ON public.accepted_materials FOR SELECT
    USING (true);

-- Only facility owner can modify rules
CREATE POLICY "Facility owner can manage accepted materials"
    ON public.accepted_materials FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.recyclers
            WHERE id = accepted_materials.recycler_id AND user_id = auth.uid()
        ) OR public.is_admin()
    );

-- 6. WASTE_BATCHES POLICIES
-- Generator can view own batches; Verified collectors/recyclers can view available batches
CREATE POLICY "View waste batches"
    ON public.waste_batches FOR SELECT
    USING (
        generator_id = auth.uid()
        OR status IN ('available', 'collection_requested', 'assigned', 'picked_up', 'delivered', 'confirmed')
        OR public.is_admin()
    );

-- Generators can create batches
CREATE POLICY "Generators can create batches"
    ON public.waste_batches FOR INSERT
    WITH CHECK (
        generator_id = auth.uid()
        AND (public.get_current_role() = 'generator' OR public.is_admin())
    );

-- Generator can update batch only while in draft or available status
CREATE POLICY "Generators can update own active batches"
    ON public.waste_batches FOR UPDATE
    USING (
        (generator_id = auth.uid() AND status IN ('draft', 'available'))
        OR public.is_admin()
    );

-- Generator can delete batch only if in draft
CREATE POLICY "Generators can delete draft batches"
    ON public.waste_batches FOR DELETE
    USING (
        (generator_id = auth.uid() AND status = 'draft')
        OR public.is_admin()
    );

-- 7. COLLECTION_REQUESTS POLICIES
-- Visible to the generator, assigned collector, matched recycler, or admin
CREATE POLICY "View collection requests"
    ON public.collection_requests FOR SELECT
    USING (
        collector_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.waste_batches WHERE id = collection_requests.batch_id AND generator_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.recyclers WHERE id = collection_requests.recycler_id AND user_id = auth.uid())
        OR public.is_admin()
    );

-- Generator or Collector can create request
CREATE POLICY "Create collection requests"
    ON public.collection_requests FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.waste_batches WHERE id = batch_id AND generator_id = auth.uid())
        OR public.get_current_role() = 'collector'
        OR public.is_admin()
    );

-- Assigned collector, recycler, or admin can update collection status
CREATE POLICY "Update collection requests"
    ON public.collection_requests FOR UPDATE
    USING (
        collector_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.recyclers WHERE id = recycler_id AND user_id = auth.uid())
        OR public.is_admin()
    );

-- 8. HANDOVER_RECORDS POLICIES
-- Only the receiving recycler or admin can create final handover record
CREATE POLICY "Recyclers can record batch handover"
    ON public.handover_records FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.recyclers
            WHERE id = handover_records.recycler_id AND user_id = auth.uid() AND verification_status = 'verified'
        ) OR public.is_admin()
    );

CREATE POLICY "View handover records"
    ON public.handover_records FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.recyclers WHERE id = handover_records.recycler_id AND user_id = auth.uid())
        OR collector_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.waste_batches WHERE id = handover_records.batch_id AND generator_id = auth.uid())
        OR public.is_admin()
    );

-- 9. WASTE_STATUS_HISTORY POLICIES (Immutable Audit Log)
-- Viewable by anyone involved in the batch
CREATE POLICY "View status history"
    ON public.waste_status_history FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.waste_batches WHERE id = waste_status_history.batch_id AND generator_id = auth.uid())
        OR public.get_current_role() IN ('collector', 'recycler', 'admin')
    );

-- Status history can only be created by authenticated participants
CREATE POLICY "Insert status history"
    ON public.waste_status_history FOR INSERT
    WITH CHECK (changed_by = auth.uid());

-- NO UPDATE OR DELETE ALLOWED on waste_status_history for immutability

-- 10. NOTIFICATIONS POLICIES
CREATE POLICY "Users can view and update own notifications"
    ON public.notifications FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
