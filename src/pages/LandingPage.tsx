import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Search,
  MapPin,
  Clock,
  ChevronRight,
  ArrowRight,
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
      {/* Hero Bento Section */}
      <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Hero Card (7 Cols) */}
          <div className="lg:col-span-7 clay-card p-8 sm:p-12 flex flex-col justify-between bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20">
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18] font-display">
                Harmoni Rasa & Ketenangan di <span className="text-blue-600">Meo Cafe</span>
              </h1>
              
              <p className="text-slate-600 text-base sm:text-lg mt-4 leading-relaxed max-w-xl">
                Nikmati sentuhan biji kopi single origin pilihan, seduhan teh botanikal alami, dan pastry Prancis berlapis mentega murni.
              </p>

              <div className="mt-8 flex items-center">
                <a
                  href="#menuSection"
                  className="clay-btn clay-btn-primary"
                >
                  Lihat Daftar Menu
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-8 mt-10 border-t border-slate-200/60">
              <div>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">100%</h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Arabika Premium</p>
              </div>
              <div>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">15+</h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Varian Menu</p>
              </div>
              <div>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">4.9★</h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Rating Kepuasan</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Card (5 Cols) with Clean Cafe Name on Photo */}
          <div className="lg:col-span-5 clay-card overflow-hidden relative min-h-[340px] lg:min-h-full flex flex-col justify-end p-8 group">
            <img
              src="/assets/images/hero_cafe.jpg"
              alt="Meo Cafe"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent"></div>
            
            {/* Clean Cafe Name Overlay on Photo */}
            <div className="relative z-10 text-white">
              <span className="text-xs uppercase tracking-widest text-blue-300 font-bold block mb-1">
                Kota Malang
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
                Meo Cafe
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-1">
                Jl. Pelabuhan Tanjuk Priok No.10, Sukun
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Catalog Section */}
      <section id="menuSection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Daftar Menu
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-md">
              Pilihan minuman kopi spesial, teh segar, dan sajian kuliner lezat.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Cari kopi, pastry, snack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="clay-input pl-11 pr-4 py-2.5 text-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {[
            { id: 'all', label: 'Semua Menu' },
            { id: 'minuman', label: '☕ Minuman' },
            { id: 'makanan', label: '🥐 Makanan' },
            { id: 'snack', label: '🍟 Snack' },
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
                  {/* Image & Category Tag */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/coffee_signature.jpg';
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-white/90 backdrop-blur-md text-blue-700 shadow-sm">
                        {item.category}
                      </span>
                    </div>
                    {item.status === 'habis' && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs uppercase">
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
                      {item.description || 'Pilihan menu istimewa Meo Cafe.'}
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

      {/* Cafe Information Bento (Clean 2 Columns: Lokasi & Jam) */}
      <section id="infoSection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Lokasi */}
          <div className="clay-card p-6 sm:p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
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

          {/* Card 2: Jam Operasional */}
          <div className="clay-card p-6 sm:p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-display">Jam Operasional</h3>
            <div className="space-y-1.5 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Senin - Jumat:</span>
                <span className="font-semibold text-slate-900">09:00 - 23:00 WIB</span>
              </div>
              <div className="flex justify-between">
                <span>Sabtu - Minggu:</span>
                <span className="font-semibold text-slate-900">08:00 - 00:00 WIB</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-2">
              Buka setiap hari untuk dine-in dan takeaway.
            </p>
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
                  Pilihan Tambahan Topping
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

              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={() => setSelectedMenu(null)}
                  className="clay-btn clay-btn-secondary !py-2.5 !px-6 text-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
