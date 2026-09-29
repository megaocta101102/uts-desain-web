-- ==============================================================================
-- SKEMA DATABASE SUPABASE: MEO CAFE & KASIR
-- Alamat: Jl. Pelabuhan Tanjuk Priok No.10, Bakalan Krajan, Sukun, Malang
-- Owner: Mega Octa
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL USERS (Kasir & Owner)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('kasir', 'owner')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABEL CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABEL MENUS (Daftar Menu Meo Cafe)
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    description TEXT,
    type VARCHAR(30) NOT NULL CHECK (type IN ('makanan', 'minuman', 'snack')),
    category VARCHAR(50) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABEL TOPPINGS (Daftar Add-on / Topping Minuman)
CREATE TABLE IF NOT EXISTS public.toppings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABEL ORDERS (Transaksi Kasir Meo Cafe)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(30) UNIQUE NOT NULL,
    table_number VARCHAR(20) DEFAULT 'Takeaway',
    order_type VARCHAR(20) DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'take_away')),
    customer_name VARCHAR(100) DEFAULT 'Tamu',
    cashier_name VARCHAR(100) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'qris', 'debit', 'transfer')),
    payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABEL ORDER_ITEMS (Detail Menu + Varian Ukuran & Topping)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL,
    menu_name VARCHAR(120) NOT NULL,
    size VARCHAR(20) DEFAULT 'Small',
    topping VARCHAR(100) DEFAULT '',
    price DECIMAL(12, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & IDEMPOTENT PERMISSIONS
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if already defined to avoid conflict
DROP POLICY IF EXISTS "Allow All Operations on Users" ON public.users;
DROP POLICY IF EXISTS "Allow All Operations on Menus" ON public.menus;
DROP POLICY IF EXISTS "Allow All Operations on Toppings" ON public.toppings;
DROP POLICY IF EXISTS "Allow All Operations on Orders" ON public.orders;
DROP POLICY IF EXISTS "Allow All Operations on Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Allow All Operations on Categories" ON public.categories;

DROP POLICY IF EXISTS "Public Read Access for Users" ON public.users;
DROP POLICY IF EXISTS "Public Read Access for Menus" ON public.menus;
DROP POLICY IF EXISTS "Public Read Access for Toppings" ON public.toppings;
DROP POLICY IF EXISTS "Public Read Access for Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Read Access for Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Public Read Access for Categories" ON public.categories;

-- Allow full client operations for Meo Cafe applet
CREATE POLICY "Allow All Operations on Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Menus" ON public.menus FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Toppings" ON public.toppings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Order Items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- DATA AWAL (SEED DATA MEO CAFE)
-- ==============================================================================

-- 1. Default Users
INSERT INTO public.users (username, password, full_name, role)
VALUES 
    ('kasir', 'kasir123', 'Kasir Cindy', 'kasir'),
    ('owner', 'owner123', 'Mega Octa', 'owner')
ON CONFLICT (username) DO NOTHING;

-- 2. Default Toppings (Add-ons)
INSERT INTO public.toppings (name, price, is_available)
VALUES
    ('Extra Espresso Shot', 6000, true),
    ('Oat Milk Substitution', 8000, true),
    ('Cloud Cheese Foam', 6000, true),
    ('Boba Brown Sugar', 5000, true),
    ('Grass Jelly Cincau', 4000, true),
    ('Vanilla Syrup', 5000, true),
    ('Caramel Drizzle', 5000, true),
    ('Hazelnut Syrup', 5000, true);

-- 3. Default Menus
INSERT INTO public.menus (name, price, description, type, category, image_url, is_available)
VALUES
    ('Meo Velvet Blue Latte', 42000, 'Signature espresso blend dengan susu oat creamy, infused blue pea flower dan vanila madagascar aromatik.', 'minuman', 'Specialty Coffee', 'assets/images/coffee_signature.jpg', true),
    ('Espresso Single Origin Gayo', 28000, 'Ekstraksi murni 100% Arabica Aceh Gayo dengan tasting notes dark chocolate, plum, dan jasmine.', 'minuman', 'Specialty Coffee', 'assets/images/coffee_signature.jpg', true),
    ('Iced Spanish Sea Salt Latte', 45000, 'Double shot espresso, susu kental manis karamel, fresh milk, dan foam sea salt blue velvet yang gurih lembut.', 'minuman', 'Specialty Coffee', 'assets/images/coffee_signature.jpg', true),
    ('Ocean Breeze Sapphire Mocktail', 48000, 'Mocktail lapis estetik dengan sirup curacao biru alami, perasan jeruk yuzu jepang, soda dingin, dan rosemary.', 'minuman', 'Artisan Tea & Mocktail', 'assets/images/mocktail_ocean.jpg', true),
    ('Earl Grey French Lavender', 38000, 'Seduhan teh artisan daun hitam premium dengan aroma lavender organik provence dan potongan citrus kering.', 'minuman', 'Artisan Tea & Mocktail', 'assets/images/mocktail_ocean.jpg', true),
    ('Matcha Cloud Ceremonial', 46000, 'Matcha Uji Kyoto grade seremonial dipadu susu segar dingin dan toping cloud foam lembut.', 'minuman', 'Artisan Tea & Mocktail', 'assets/images/coffee_signature.jpg', true),
    ('Truffle Cream Fettuccine', 78000, 'Pasta fettuccine al dente dengan saus pasta krim jamur champignon, sentuhan minyak black truffle, dan keju Grana Padano.', 'makanan', 'Signature Main Course', 'assets/images/hero_cafe.jpg', true),
    ('Seared Salmon with Lemon Caper', 115000, 'Fillet salmon Norwegia pan-seared renyah dengan mashed potato mentega Prancis, asparagus, dan saus lemon caper segar.', 'makanan', 'Signature Main Course', 'assets/images/hero_cafe.jpg', true),
    ('Wagyu Beef Cubes Rice Bowl', 88000, 'Daging Wagyu tenderloin potong dadu dengan saus tare manis gurih, onsen egg, dan nasi Jepang pulen berbalut nori.', 'makanan', 'Signature Main Course', 'assets/images/hero_cafe.jpg', true),
    ('Artisan Almond Croissant', 36000, 'Pastry Prancis berlapis garing dengan isian krim frangipane almond manis dan taburan kacang almond panggang.', 'snack', 'French Pastry & Dessert', 'assets/images/dessert_pastry.jpg', true),
    ('Wild Blueberry Cream Tartlet', 42000, 'Tart shell renyah mentega dengan vanilla bean custard lembut dan buah blueberry segar pilihan.', 'snack', 'French Pastry & Dessert', 'assets/images/dessert_pastry.jpg', true),
    ('Truffle Parmesan Hand-cut Fries', 38000, 'Kentang goreng renyah dipanggang minyak white truffle, parutan keju parmesan berlimpah, dan saus garlic aioli.', 'snack', 'Light Bites & Fries', 'assets/images/dessert_pastry.jpg', true);
