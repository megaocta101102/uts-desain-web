import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Search,
  ChevronRight,
  X,
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
        console.error('Gagal memuat data menu', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle escape key and prevent body scroll when modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMenu(null);
      }
    };
    if (selectedMenu) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedMenu]);

  const filteredMenus = menus.filter((menu) => {
    const matchesCategory =
      selectedCategory === 'all' || menu.category === selectedCategory;
    const matchesSearch =
      menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      menu.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Main Hero Card (7 Cols) */}
          <div className="lg:col-span-7 clay-card p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-6">
                <Coffee className="w-3.5 h-3.5" />
                <span>Specialty Coffee & Artisan Pastry</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] font-display">
                Pengalaman Ngopi <br />
                <span className="text-blue-600">Autentik & Modern.</span>
              </h1>
              
              <p className="text-slate-600 text-base sm:text-lg mt-4 leading-relaxed max-w-xl">
                Nikmati sentuhan biji kopi single origin pilihan, seduhan teh botanikal alami, dan pastry Prancis berlapis mentega murni.
              </p>
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

          {/* Hero Visual Card (5 Cols) */}
          <div className="lg:col-span-5 clay-card overflow-hidden relative min-h-[340px] lg:min-h-full group">
            <img
              src="/assets/images/hero_cafe.jpg"
              alt="Meo Cafe"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
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

          {/* Search Box with Glass Icon on Right Side */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Cari kopi, pastry, snack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="clay-input !pl-4 !pr-11 py-2.5 text-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'clay-btn-primary shadow-md'
                  : 'clay-btn-secondary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="clay-card h-80 animate-pulse bg-slate-100"></div>
            ))}
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="clay-card p-12 text-center text-slate-400">
            <Coffee className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-base font-semibold text-slate-600">Tidak ada menu yang sesuai</p>
            <p className="text-xs text-slate-400 mt-1">Coba kata kunci pencarian atau kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenus.map((menu) => (
              <div
                key={menu.id}
                onClick={() => setSelectedMenu(menu)}
                className="clay-card overflow-hidden group cursor-pointer flex flex-col justify-between hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={menu.image_url}
                      alt={menu.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 font-bold text-xs shadow-sm uppercase">
                        {menu.category}
                      </span>
                    </div>
                    {menu.status === 'habis' && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-4 py-1.5 rounded-full bg-red-600 text-white font-bold text-xs uppercase tracking-wider">
                          Habis
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors font-sans">
                        {menu.name}
                      </h3>
                      <span className="text-base font-extrabold text-blue-600 shrink-0 font-sans">
                        {formatCurrency(menu.price)}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {menu.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0">
                  <button className="w-full py-2.5 rounded-2xl bg-blue-50/80 group-hover:bg-blue-600 group-hover:text-white text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-blue-100 group-hover:border-transparent">
                    <span>Lihat Detail & Topping</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Item Detail & Topping Modal */}
      {/* Scrollable with fixed/sticky close button and footer so user can always return to beranda */}
      {selectedMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedMenu(null);
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-blue-100 flex flex-col max-h-[85vh] sm:max-h-[88vh] overflow-hidden relative">
            
            {/* Sticky/Fixed Close Button (✕) - ALWAYS visible, stays in place, never scrolls away */}
            <button
              onClick={() => setSelectedMenu(null)}
              className="absolute top-3 right-3 z-30 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-slate-800 hover:text-red-600 flex items-center justify-center shadow-lg border border-slate-200/80 transition-all active:scale-95 font-bold text-base cursor-pointer"
              title="Tutup dan kembali ke beranda (Esc)"
              aria-label="Tutup modal dan kembali ke beranda"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Inner Body (Dapat discroll bebas pada laptop kecil maupun HP) */}
            <div className="overflow-y-auto overscroll-contain flex-1">
              
              {/* Image Banner */}
              <div className="relative h-48 sm:h-56 bg-slate-100">
                <img
                  src={selectedMenu.image_url}
                  alt={selectedMenu.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-4">
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-xs uppercase shadow-sm">
                    {selectedMenu.category}
                  </span>
                </div>
              </div>

              {/* Menu Details & Compatible Toppings */}
              <div className="p-5 sm:p-6 space-y-5">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                    {selectedMenu.name}
                  </h3>
                  <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
                    {selectedMenu.description}
                  </p>
                  <div className="text-2xl font-extrabold text-blue-600 mt-3 font-sans">
                    {formatCurrency(selectedMenu.price)}
                  </div>
                </div>

                {/* Compatible Toppings Section */}
                <div className="space-y-2.5 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Pilihan Tambahan Topping
                    </h4>
                    <span className="text-[11px] text-slate-400">Pesan langsung saat order</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
