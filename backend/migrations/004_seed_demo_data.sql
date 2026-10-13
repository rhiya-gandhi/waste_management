-- WasteRoute Database Seed: Migration 004_seed_demo_data.sql
-- Description: Clearly labeled fictional demo seed data for local testing & hackathon demonstration
-- NOTE: All facilities, registration numbers, and phone numbers below are strictly fictional demo data.

-- 1. Demo User Profiles (Mock UUIDs corresponding to test actors)
INSERT INTO public.profiles (id, email, full_name, role, phone, address_line, latitude, longitude)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'demo.admin@wasteroute.local', 'System Admin (Demo)', 'admin', '+91 98765 00001', 'Green Tech Park, Sector 4', 12.9716, 77.5946),
    ('a0000000-0000-0000-0000-000000000002', 'generator.society@wasteroute.local', 'Palm Grove Housing Society (Demo Generator)', 'generator', '+91 98765 00002', 'Tower C, Palm Grove Residency, Indiranagar', 12.9784, 77.6408),
    ('a0000000-0000-0000-0000-000000000003', 'collector.ravi@wasteroute.local', 'Ravi Logistics (Demo Collector)', 'collector', '+91 98765 00003', 'Depot 12, Old Airport Road', 12.9601, 77.6483),
    ('a0000000-0000-0000-0000-000000000004', 'recycler.ecoplast@wasteroute.local', 'EcoPlast Circular Facility (Demo Recycler)', 'recycler', '+91 98765 00004', 'Plot 45, Peenya Industrial Area', 13.0312, 77.5186),
    ('a0000000-0000-0000-0000-000000000005', 'recycler.metals@wasteroute.local', 'Urban Metal & E-Recovery (Demo Recycler)', 'recycler', '+91 98765 00005', 'Phase 2, Electronic City', 12.8452, 77.6602),
    ('a0000000-0000-0000-0000-000000000006', 'recycler.paper@wasteroute.local', 'CleanFiber Paper Pulping (Demo Recycler)', 'recycler', '+91 98765 00006', 'Whitefield Industrial Zone', 12.9866, 77.7335),
    ('a0000000-0000-0000-0000-000000000007', 'recycler.unverified@wasteroute.local', 'Apex Unverified Polymers (Demo Pending)', 'recycler', '+91 98765 00007', 'Bommasandra Industrial Area', 12.8170, 77.6850)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- 2. Demo Recycler Facilities
INSERT INTO public.recyclers (id, user_id, facility_name, business_reg_number, verification_status, verified_by, verified_at, verification_notes, facility_address, latitude, longitude, max_distance_km, contact_phone, contact_email, is_active)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'EcoPlast Circular Hub (Demo)', 'DEMO-REG-PLAST-01', 'verified', 'a0000000-0000-0000-0000-000000000001', now(), 'Verified site inspection and ISO 14001 certification verified.', 'Plot 45, Peenya Industrial Area, Bengaluru', 13.0312, 77.5186, 35.0, '+91 98765 00004', 'contact@ecoplast-demo.org', true),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'Urban Metal & E-Recovery (Demo)', 'DEMO-REG-METL-02', 'verified', 'a0000000-0000-0000-0000-000000000001', now(), 'Authorized state pollution control board e-waste dismantler.', 'Phase 2, Electronic City, Bengaluru', 12.8452, 77.6602, 40.0, '+91 98765 00005', 'ops@urbanmetal-demo.org', true),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000006', 'CleanFiber Paper Pulping (Demo)', 'DEMO-REG-PAPR-03', 'verified', 'a0000000-0000-0000-0000-000000000001', now(), 'Authorized paper and packaging recycling unit.', 'Whitefield Industrial Zone, Bengaluru', 12.9866, 77.7335, 30.0, '+91 98765 00006', 'info@cleanfiber-demo.org', true),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000007', 'Apex Polymers (Demo - Pending)', 'DEMO-REG-APEX-04', 'pending', NULL, NULL, 'Awaiting physical plant verification audit.', 'Bommasandra Industrial Area, Bengaluru', 12.8170, 77.6850, 25.0, '+91 98765 00007', 'admin@apexpolymer-demo.org', true)
ON CONFLICT (id) DO UPDATE SET
    verification_status = EXCLUDED.verification_status;

-- 3. Accepted Materials Rules
INSERT INTO public.accepted_materials (recycler_id, material_category, specific_subtypes, max_contamination_percent, min_quantity_kg, max_quantity_kg, accepts_pickup, accepts_dropoff, price_per_kg, handling_notes)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'plastic', ARRAY['PET', 'HDPE', 'PP'], 15.00, 5.00, 3000.00, true, true, 12.50, 'Bottles should be rinsed and drained. Crushed preferred.'),
    ('b0000000-0000-0000-0000-000000000002', 'metal', ARRAY['aluminum_cans', 'steel_cans', 'copper_wire'], 10.00, 2.00, 5000.00, true, true, 45.00, 'Free from heavy chemical contaminants.'),
    ('b0000000-0000-0000-0000-000000000002', 'e_waste', ARRAY['circuit_boards', 'laptops', 'cables'], 5.00, 1.00, 1000.00, true, false, 30.00, 'Batteries separated where possible.'),
    ('b0000000-0000-0000-0000-000000000003', 'paper_cardboard', ARRAY['corrugated_cardboard', 'office_paper', 'newspaper'], 12.00, 10.00, 4000.00, true, true, 8.00, 'Dry materials only. Oil-stained cardboard not accepted.')
ON CONFLICT (recycler_id, material_category) DO UPDATE SET
    max_contamination_percent = EXCLUDED.max_contamination_percent;

-- 4. Demo Waste Batches
INSERT INTO public.waste_batches (id, generator_id, title, material_category, quantity, unit, estimated_contamination_percent, condition_description, readiness, pickup_address, latitude, longitude, status, notes)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Sorted PET Plastic Bottles (Demo Batch)', 'plastic', 45.00, 'kg', 5.00, 'clean', 'immediate', 'Tower C, Palm Grove Residency, Indiranagar, Bengaluru', 12.9784, 77.6408, 'available', 'Segregated household plastic bottles from society collection drive.'),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Corrugated Cardboard Packaging Boxes (Demo)', 'paper_cardboard', 120.00, 'kg', 8.00, 'clean', 'immediate', 'Tower C, Palm Grove Residency, Indiranagar, Bengaluru', 12.9784, 77.6408, 'assigned', 'Flat-packed shipping cartons from delivery boxes.')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status;
