import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  return NextResponse.json({
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    CAFE_NAME: process.env.CAFE_NAME || 'Meo Cafe',
    CAFE_TAGLINE: process.env.CAFE_TAGLINE || 'Minimalist & Aesthetic Cafe',
    CAFE_ADDRESS: process.env.CAFE_ADDRESS || 'Jl. Pelabuhan Tanjuk Priok No.10, Bakalan Krajan, Sukun, Malang',
    CAFE_MAPS_URL: 'https://maps.app.goo.gl/834Rms4rBLfc3tZu7',
    OWNER_NAME: process.env.OWNER_NAME || 'Mega Octa',
    CAFE_CURRENCY: process.env.CAFE_CURRENCY || 'Rp',
    CAFE_TAX_PERCENT: Number(process.env.CAFE_TAX_PERCENT) || 10,
    CAFE_SERVICE_PERCENT: Number(process.env.CAFE_SERVICE_PERCENT) || 0,
    PAGE_SIZE: 8,
  });
}
