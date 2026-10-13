-- WasteRoute Database Schema: Migration 001_initial_schema.sql
-- Description: Core tables, enums, constraints, and indexes for circular waste logistics

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('generator', 'collector', 'recycler', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recycler_verification_type AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE material_category_type AS ENUM (
        'plastic',
        'paper_cardboard',
        'metal',
        'glass',
        'e_waste',
        'organic',
        'textile',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE batch_status_type AS ENUM (
        'draft',
        'available',
        'collection_requested',
        'assigned',
        'picked_up',
        'delivered',
        'confirmed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE collection_status_type AS ENUM (
        'requested',
        'accepted',
        'in_transit',
        'delivered',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role_type NOT NULL DEFAULT 'generator',
    phone TEXT,
    address_line TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Recyclers / Processing Facilities Table
CREATE TABLE IF NOT EXISTS public.recyclers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    facility_name TEXT NOT NULL,
    business_reg_number TEXT NOT NULL,
    verification_status recycler_verification_type NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    facility_address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    max_distance_km DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    contact_phone TEXT,
    contact_email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_recycler_user UNIQUE (user_id)
);

-- 4. Accepted Materials and Structured Acceptance Rules
CREATE TABLE IF NOT EXISTS public.accepted_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recycler_id UUID NOT NULL REFERENCES public.recyclers(id) ON DELETE CASCADE,
    material_category material_category_type NOT NULL,
    specific_subtypes TEXT[] DEFAULT '{}',
    max_contamination_percent NUMERIC(5,2) NOT NULL DEFAULT 15.00 CHECK (max_contamination_percent >= 0 AND max_contamination_percent <= 100),
    min_quantity_kg NUMERIC(10,2) NOT NULL DEFAULT 1.00 CHECK (min_quantity_kg >= 0),
    max_quantity_kg NUMERIC(10,2) CHECK (max_quantity_kg IS NULL OR max_quantity_kg >= min_quantity_kg),
    accepts_pickup BOOLEAN NOT NULL DEFAULT true,
    accepts_dropoff BOOLEAN NOT NULL DEFAULT true,
    price_per_kg NUMERIC(10,2) DEFAULT 0.00,
    handling_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_recycler_material UNIQUE (recycler_id, material_category)
);

-- 5. Waste Batches Table
CREATE TABLE IF NOT EXISTS public.waste_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    material_category material_category_type NOT NULL,
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'tonnes', 'items', 'bags')),
    estimated_contamination_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (estimated_contamination_percent >= 0 AND estimated_contamination_percent <= 100),
    condition_description TEXT NOT NULL DEFAULT 'clean' CHECK (condition_description IN ('clean', 'lightly_soiled', 'heavily_soiled', 'mixed')),
    readiness TEXT NOT NULL DEFAULT 'immediate' CHECK (readiness IN ('immediate', 'scheduled')),
    pickup_window_start TIMESTAMPTZ,
    pickup_window_end TIMESTAMPTZ,
    pickup_address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status batch_status_type NOT NULL DEFAULT 'available',
    image_url TEXT,
    ai_classification_result JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Collection Requests Table
CREATE TABLE IF NOT EXISTS public.collection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.waste_batches(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recycler_id UUID NOT NULL REFERENCES public.recyclers(id) ON DELETE CASCADE,
    status collection_status_type NOT NULL DEFAULT 'requested',
    scheduled_pickup_at TIMESTAMPTZ,
    actual_pickup_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    collector_notes TEXT,
    evidence_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Handover Records Table (Final Recycler Sign-off)
CREATE TABLE IF NOT EXISTS public.handover_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_request_id UUID NOT NULL REFERENCES public.collection_requests(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.waste_batches(id) ON DELETE CASCADE,
    recycler_id UUID NOT NULL REFERENCES public.recyclers(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    received_quantity NUMERIC(10,2) NOT NULL CHECK (received_quantity >= 0),
    quantity_unit TEXT NOT NULL DEFAULT 'kg',
    assessed_contamination_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (assessed_contamination_percent >= 0 AND assessed_contamination_percent <= 100),
    quality_accepted BOOLEAN NOT NULL DEFAULT true,
    rejection_reason TEXT,
    evidence_image_url TEXT,
    digital_signature_or_code TEXT,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_handover_batch UNIQUE (batch_id)
);

-- 8. Immutable Waste Status History (Audit Trail)
CREATE TABLE IF NOT EXISTS public.waste_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.waste_batches(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_at_change TEXT NOT NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_recyclers_status ON public.recyclers(verification_status, is_active);
CREATE INDEX IF NOT EXISTS idx_recyclers_coords ON public.recyclers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_accepted_materials_category ON public.accepted_materials(material_category);
CREATE INDEX IF NOT EXISTS idx_waste_batches_status ON public.waste_batches(status);
CREATE INDEX IF NOT EXISTS idx_waste_batches_generator ON public.waste_batches(generator_id);
CREATE INDEX IF NOT EXISTS idx_waste_batches_category ON public.waste_batches(material_category);
CREATE INDEX IF NOT EXISTS idx_collection_requests_batch ON public.collection_requests(batch_id);
CREATE INDEX IF NOT EXISTS idx_collection_requests_collector ON public.collection_requests(collector_id);
CREATE INDEX IF NOT EXISTS idx_collection_requests_recycler ON public.collection_requests(recycler_id);
CREATE INDEX IF NOT EXISTS idx_waste_status_history_batch ON public.waste_status_history(batch_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
