import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Coffee,
  Search,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  ChevronRight,
  Heart,
  Plus,
  ArrowRight,
  Check,
  Flame,
  Award
} from 'lucide-react';
import { MenuItem, MenuCategory, Topping } from '../types';
import { db } from '../services/supabase';
import { formatCurrency, DEFAULT_CONFIG } from '../services/config';

export const LandingPage: React.FC = () => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [menuData, toppingData] = await Promise.all([
          db.getMenus(),
          db.getToppings(),
        ]);
        setMenus(menuData);
        setToppings(toppingData);
      } catch (err) {
        console.error('Failed to load menu data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredMenus = menus.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Bento Grid Section */}
      <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Hero Card (8 Cols) */}
          <div className="lg:col-span-8 clay-card p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-bold mb-6 border border-blue-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Malang Coffee & Pastry Destination</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] font-display">
                Harmoni Rasa & Ketenangan di <span className="text-blue-600">Meo Cafe</span>
              </h1>
              
              <p className="text-slate-600 text-base sm:text-lg mt-4 leading-relaxed">
                Nikmati sentuhan biji kopi single origin pilihan, seduhan teh botanikal alami, dan pastry Prancis berlapis mentega murni dalam suasana yang tenang dan estetik.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#menuSection"
                  className="clay-btn clay-btn-primary"
                >
                  Jelajahi Menu Spesial
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  to="/login"
                  className="clay-btn clay-btn-secondary"
                >
                  Portal Kasir / Owner
                </Link>
              </div>
            </div>

            {/* Quick Feature Stats */}
            <div className="grid grid-cols-3 gap-4 pt-10 mt-10 border-t border-blue-100/80 relative z-10">
              <div>
                <span className="block text-2xl sm:text-3xl font-extrabold text-blue-600 font-display">100%</span>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">Arabika Premium</span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-extrabold text-indigo-600 font-display">15+</span>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">Varian Menu & Topping</span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-extrabold text-blue-600 font-display">4.9★</span>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">Kepuasan Pelanggan</span>
              </div>
            </div>

            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-200/40 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          {/* Hero Visual Card (4 Cols) */}
          <div className="lg:col-span-4 clay-card overflow-hidden relative min-h-[320px] lg:min-h-full flex flex-col justify-end p-6 group">
            <img
              src="/assets/images/hero_cafe.jpg"
              alt="Meo Cafe Interior"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent"></div>
            
            <div className="relative z-10 text-white space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-blue-300" />
                <span>Sukun, Kota Malang</span>
              </div>
              <p className="text-xs text-slate-200">
                Tempat ideal untuk bekerja produktif, bercengkerama, atau menikmati sore tenang.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Catalog Section */}
      <section id="menuSection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">
              <Coffee className="w-4 h-4" />
              <span>Daftar Menu & Kuliner</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Kurasi Menu Meo Cafe
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-md">
              Pilihan minuman racikan barista berpengalaman dan santapan lezat dengan bahan bermutu tinggi.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Cari kopi, mocktail, pastry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="clay-input pl-11 pr-4 py-3"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {[
            { id: 'all', label: 'Semua Menu' },
            { id: 'minuman', label: '☕ Minuman & Kopi' },
            { id: 'makanan', label: '🥐 Makanan & Pastry' },
            { id: 'snack', label: '🍟 Snack & Bites' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as MenuCategory)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'clay-btn-primary shadow-md'
                  : 'clay-btn-secondary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Menu Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="clay-card p-4 space-y-4 animate-pulse">
                <div className="w-full h-48 bg-slate-200 rounded-2xl"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="clay-card p-12 text-center max-w-md mx-auto">
            <Coffee className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-lg">Menu Tidak Ditemukan</h3>
            <p className="text-slate-500 text-sm mt-1">
              Coba gunakan kata kunci pencarian lain atau pilih kategori berbeda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMenus.map((item) => (
              <div
                key={item.id}
                className="clay-card overflow-hidden flex flex-col justify-between group hover:-translate-y-1.5 transition-all duration-300 bg-white"
              >
                <div>
                  {/* Image & Badge */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/coffee_signature.jpg';
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-blue-700 shadow-sm border border-white">
                        {item.category}
                      </span>
                    </div>
                    {item.status === 'habis' && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs uppercase tracking-wider">
                          Habis
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {item.description || 'Kelezatan autentik racikan resep rahasia barista Meo Cafe.'}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                  <span className="font-extrabold text-blue-600 text-lg">
                    {formatCurrency(item.price)}
                  </span>
                  <button
                    onClick={() => setSelectedMenu(item)}
                    className="clay-btn clay-btn-secondary !py-2 !px-3.5 text-xs font-semibold flex items-center gap-1.5 hover:!bg-blue-600 hover:!text-white"
                  >
                    Detail & Topping
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cafe Information & Location Bento */}
      <section id="infoSection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="clay-card p-6 sm:p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-display">Lokasi Kami</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {DEFAULT_CONFIG.CAFE_ADDRESS}
            </p>
            <a
              href={DEFAULT_CONFIG.CAFE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:underline pt-2"
            >
              Buka di Google Maps
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="clay-card p-6 sm:p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-display">Jam Operasional</h3>
            <div className="space-y-1 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Senin - Jumat:</span>
                <span className="font-semibold text-slate-900">09:00 - 23:00 WIB</span>
              </div>
              <div className="flex justify-between">
                <span>Sabtu - Minggu:</span>
                <span className="font-semibold text-slate-900">08:00 - 00:00 WIB</span>
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 pt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Buka Setiap Hari Termasuk Libur Nasional
            </p>
          </div>

          <div className="clay-card p-6 sm:p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-display">Standar Higienis</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Semua bahan diproses segar setiap hari dengan standar kebersihan ketat dan barista tersertifikasi.
            </p>
            <div className="pt-2 text-xs font-semibold text-slate-500">
              Owner: {DEFAULT_CONFIG.OWNER_NAME}
            </div>
          </div>
        </div>
      </section>

      {/* Item Detail Modal */}
      {selectedMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
            <div className="relative h-56 bg-slate-100">
              <img
                src={selectedMenu.image_url}
                alt={selectedMenu.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedMenu(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md text-slate-800 flex items-center justify-center hover:bg-white shadow-md font-bold text-sm"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-xs uppercase">
                  {selectedMenu.category}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 font-display">{selectedMenu.name}</h3>
                <p className="text-slate-600 text-sm mt-2">{selectedMenu.description}</p>
                <div className="text-2xl font-extrabold text-blue-600 mt-3">
                  {formatCurrency(selectedMenu.price)}
                </div>
              </div>

              {/* Compatible Toppings */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rekomendasi Tambahan Topping
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {toppings
                    .filter(
                      (t) =>
                        t.category === 'all' ||
                        t.category === selectedMenu.category
                    )
                    .map((top) => (
                      <div
                        key={top.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-700">{top.name}</span>
                        <span className="text-blue-600 font-bold">+{formatCurrency(top.price)}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedMenu(null)}
                  className="clay-btn clay-btn-secondary !py-2.5 !px-5 text-sm"
                >
                  Tutup
                </button>
                <Link
                  to="/kasir"
                  className="clay-btn clay-btn-primary !py-2.5 !px-5 text-sm flex items-center gap-2"
                >
                  Pesan di Kasir
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
