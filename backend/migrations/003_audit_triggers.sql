-- WasteRoute Database Schema: Migration 003_audit_triggers.sql
-- Description: Automated triggers for auth profile synchronization, immutability, and state-machine audit logging

-- 1. Sync Supabase Auth User to public.profiles on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        avatar_url
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role_type, 'generator'::user_role_type),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Audit Trail Trigger on waste_batches Status Transitions
CREATE OR REPLACE FUNCTION public.log_waste_batch_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.waste_status_history (
            batch_id,
            previous_status,
            new_status,
            changed_by,
            role_at_change,
            notes,
            metadata
        ) VALUES (
            NEW.id,
            OLD.status::text,
            NEW.status::text,
            COALESCE(auth.uid(), NEW.generator_id),
            COALESCE((SELECT role::text FROM public.profiles WHERE id = auth.uid()), 'system'),
            COALESCE(NEW.notes, 'Status updated'),
            jsonb_build_object(
                'quantity', NEW.quantity,
                'unit', NEW.unit,
                'updated_at', now()
            )
        );
    END IF;
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_waste_batch_status_change ON public.waste_batches;
CREATE TRIGGER trg_waste_batch_status_change
    BEFORE UPDATE ON public.waste_batches
    FOR EACH ROW EXECUTE FUNCTION public.log_waste_batch_status_change();

-- 3. Automatic Initial Status History on Batch Creation
CREATE OR REPLACE FUNCTION public.log_waste_batch_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.waste_status_history (
        batch_id,
        previous_status,
        new_status,
        changed_by,
        role_at_change,
        notes,
        metadata
    ) VALUES (
        NEW.id,
        NULL,
        NEW.status::text,
        NEW.generator_id,
        'generator',
        'Batch published/created',
        jsonb_build_object('initial_quantity', NEW.quantity, 'unit', NEW.unit)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_waste_batch_created ON public.waste_batches;
CREATE TRIGGER trg_waste_batch_created
    AFTER INSERT ON public.waste_batches
    FOR EACH ROW EXECUTE FUNCTION public.log_waste_batch_created();

-- 4. Handover Sign-Off Updates Batch Status to 'confirmed'
CREATE OR REPLACE FUNCTION public.handle_handover_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quality_accepted = true THEN
        UPDATE public.waste_batches
        SET status = 'confirmed', updated_at = now()
        WHERE id = NEW.batch_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_handover_confirmed ON public.handover_records;
CREATE TRIGGER trg_handover_confirmed
    AFTER INSERT ON public.handover_records
    FOR EACH ROW EXECUTE FUNCTION public.handle_handover_confirmation();
