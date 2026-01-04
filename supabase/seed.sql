-- ============================================
-- SEED DATA FOR RED STORE
-- ============================================

-- Note: This seed data assumes auth.users entries exist
-- In production, users will be created via Supabase Auth
-- For testing, you may need to manually create auth.users entries first

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO public.categories (id, name, slug, description, icon, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', 'PC & Laptop Zone', 'pc-laptop-zone', 'Computers, laptops, and accessories', 'laptop', 1),
('22222222-2222-2222-2222-222222222222', 'Mobile Zone', 'mobile-zone', 'Smartphones and mobile accessories', 'smartphone', 2),
('33333333-3333-3333-3333-333333333333', 'TV & Entertainment Zone', 'tv-entertainment-zone', 'Televisions, audio, and entertainment', 'tv', 3),
('44444444-4444-4444-4444-444444444444', 'Print & Office Zone', 'print-office-zone', 'Printers, office supplies, and equipment', 'printer', 4),
('55555555-5555-5555-5555-555555555555', 'Home Appliance Zone', 'home-appliance-zone', 'Home and kitchen appliances', 'home', 5),
('66666666-6666-6666-6666-666666666666', 'Health & Wellness Zone', 'health-wellness-zone', 'Health and wellness products', 'heart', 6),
('77777777-7777-7777-7777-777777777777', 'Accessories Zone', 'accessories-zone', 'Electronics accessories and peripherals', 'accessories', 7),
('88888888-8888-8888-8888-888888888888', 'Deals Zone', 'deals-zone', 'Special deals and offers', 'gift', 8),
('99999999-9999-9999-9999-999999999999', 'Service & Support Zone', 'service-support-zone', 'Services and support', 'wrench', 9)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SAMPLE PRODUCTS (Will be created after vendors)
-- ============================================
-- Products will be inserted via application or after vendor creation

