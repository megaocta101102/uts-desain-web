import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  X,
  Coffee,
  Sparkles,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { MenuItem, MenuCategory, Topping } from '../types';
import { db, normalizeMenuCategory } from '../services/supabase';
import { formatCurrency } from '../services/config';

export const OwnerMenuPage: React.FC = () => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [activeTab, setActiveTab] = useState<'menus' | 'toppings'>('menus');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MenuCategory>('all');
  
  // Menu Form Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'minuman' as 'minuman' | 'makanan' | 'snack',
    price: '',
    description: '',
    image_url: '/assets/images/coffee_signature.jpg',
    status: 'tersedia' as 'tersedia' | 'habis',
  });

  // Topping Form Modal State
  const [isToppingModalOpen, setIsToppingModalOpen] = useState(false);
  const [editingTopping, setEditingTopping] = useState<Topping | null>(null);
  const [toppingCategoryFilter, setToppingCategoryFilter] = useState<'all' | 'minuman' | 'makanan' | 'snack'>('all');
  const [toppingForm, setToppingForm] = useState({
    name: '',
    category: 'minuman' as 'minuman' | 'makanan' | 'snack' | 'all',
    price: '',
    status: 'tersedia' as 'tersedia' | 'habis',
  });

  const loadAll = async () => {
    const [menuList, toppingList] = await Promise.all([
      db.getMenus(),
      db.getToppings(),
    ]);
    setMenus(menuList);
    setToppings(toppingList);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Filter Menus - Menu terbaru diurutkan di bagian paling atas
  const filteredMenus = [...menus]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .filter((m) => {
      const itemCat = normalizeMenuCategory(m.category, m.type);
      const matchCat = categoryFilter === 'all' || itemCat === categoryFilter;
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });

  // Filter Toppings
  const filteredToppings = [...toppings].filter((top) => {
    const matchCat = toppingCategoryFilter === 'all' || top.category === toppingCategoryFilter;
    const matchSearch = top.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Open Menu Modal
  const handleOpenAddMenu = () => {
    setEditingMenu(null);
    setMenuForm({
      name: '',
      category: 'minuman',
      price: '',
      description: '',
      image_url: '/assets/images/coffee_signature.jpg',
      status: 'tersedia',
    });
    setIsMenuModalOpen(true);
  };

  const handleOpenEditMenu = (item: MenuItem) => {
    setEditingMenu(item);
    let img = item.image_url || '';
    if (item.category === 'makanan' && (img.includes('hero_cafe') || !img)) {
      img = '/assets/images/makanan_berat.jpg';
    }
    setMenuForm({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description || '',
      image_url: img || (item.category === 'makanan' ? '/assets/images/makanan_berat.jpg' : '/assets/images/coffee_signature.jpg'),
      status: item.status,
    });
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.name.trim() || !menuForm.price) {
      alert('Nama menu dan harga wajib diisi!');
      return;
    }

    const defaultImg =
      menuForm.category === 'makanan'
        ? '/assets/images/makanan_berat.jpg'
        : menuForm.category === 'snack'
        ? '/assets/images/dessert_pastry.jpg'
        : '/assets/images/coffee_signature.jpg';

    const payload: Partial<MenuItem> = {
      name: menuForm.name.trim(),
      category: menuForm.category,
      price: Number(menuForm.price),
      description: menuForm.description.trim(),
      image_url: menuForm.image_url.trim() || defaultImg,
      status: menuForm.status,
    };

    if (editingMenu) {
      await db.updateMenu(editingMenu.id, payload);
    } else {
      await db.saveMenu(payload);
    }

    setIsMenuModalOpen(false);
    await loadAll();
  };

  const handleDeleteMenu = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus menu "${name}"?`)) {
      await db.deleteMenu(id);
      await loadAll();
    }
  };

  // Open Topping Modal
  const handleOpenAddTopping = () => {
    setEditingTopping(null);
    setToppingForm({
      name: '',
      category: 'minuman',
      price: '',
      status: 'tersedia',
    });
    setIsToppingModalOpen(true);
  };

  const handleOpenEditTopping = (top: Topping) => {
    setEditingTopping(top);
    setToppingForm({
      name: top.name,
      category: top.category || 'minuman',
      price: top.price.toString(),
      status: top.status || 'tersedia',
    });
    setIsToppingModalOpen(true);
  };

  const handleSaveTopping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toppingForm.name.trim() || !toppingForm.price) {
      alert('Nama topping dan harga wajib diisi!');
      return;
    }

    const payload: Partial<Topping> = {
      name: toppingForm.name.trim(),
      category: toppingForm.category,
      price: Number(toppingForm.price),
      status: toppingForm.status,
    };

    if (editingTopping) {
      payload.id = editingTopping.id;
      payload.created_at = editingTopping.created_at;
    }

    await db.saveTopping(payload);
    setIsToppingModalOpen(false);
    await loadAll();
  };

  const handleDeleteTopping = async (id: string, name: string) => {
    if (confirm(`Hapus topping "${name}"?`)) {
      await db.deleteTopping(id);
      await loadAll();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Manajemen Katalog <span className="text-blue-600">Menu & Topping</span>
          </h1>
        </div>

        {/* Tab Switcher & Add Button */}
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-full border border-slate-200 shadow-sm flex">
            <button
              onClick={() => setActiveTab('menus')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'menus'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ☕ Menu ({menus.length})
            </button>
            <button
              onClick={() => setActiveTab('toppings')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'toppings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🍯 Topping ({toppings.length})
            </button>
          </div>

          {activeTab === 'menus' ? (
            <button
              onClick={handleOpenAddMenu}
              className="clay-btn clay-btn-primary !py-2.5 !px-4 text-xs font-semibold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              Tambah Menu Baru
            </button>
          ) : (
            <button
              onClick={handleOpenAddTopping}
              className="clay-btn clay-btn-primary !py-2.5 !px-4 text-xs font-semibold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              Tambah Topping
            </button>
          )}
        </div>
      </div>

      {activeTab === 'menus' ? (
        <div className="space-y-6">
          {/* Filters */}
          <div className="clay-card p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Cari"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="clay-input !pl-4 !pr-10 !py-2 text-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'Semua Kategori' },
                { id: 'minuman', label: 'Minuman' },
                { id: 'makanan', label: 'Makanan' },
                { id: 'snack', label: 'Snack' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id as MenuCategory)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    categoryFilter === c.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Menus Table / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenus.map((item) => (
              <div
                key={item.id}
                className="clay-card p-4 bg-white flex flex-col justify-between group hover:border-blue-300 transition-all"
              >
                <div>
                  <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-100 mb-3">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = item.category === 'makanan' ? '/assets/images/makanan_berat.jpg' : (item.category === 'snack' ? '/assets/images/dessert_pastry.jpg' : '/assets/images/coffee_signature.jpg');
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/90 backdrop-blur-md text-blue-700">
                        {item.category}
                      </span>
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          item.status === 'tersedia'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {item.description || 'Tidak ada deskripsi.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-extrabold text-blue-600 text-base">
                    {formatCurrency(item.price)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditMenu(item)}
                      className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Edit Menu"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(item.id, item.name)}
                      className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Hapus Menu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Toppings Section */
        <div className="space-y-6">
          {/* Filters */}
          <div className="clay-card p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Cari topping..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="clay-input !pl-4 !pr-10 !py-2 text-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'Semua Kategori' },
                { id: 'minuman', label: 'Khusus Minuman' },
                { id: 'makanan', label: 'Khusus Makanan' },
                { id: 'snack', label: 'Khusus Snack' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setToppingCategoryFilter(c.id as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    toppingCategoryFilter === c.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="clay-card p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base font-sans">
                Daftar Topping & Ekstra Menu
              </h3>
              <span className="text-xs text-slate-400">Total {filteredToppings.length} varian</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 px-2">Nama Topping</th>
                    <th className="pb-3 px-2">Kategori Relevan</th>
                    <th className="pb-3 px-2">Harga Ekstra</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredToppings.map((top) => (
                    <tr key={top.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-2 font-bold text-slate-900">{top.name}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            top.category === 'minuman'
                              ? 'bg-blue-100 text-blue-700'
                              : top.category === 'makanan'
                              ? 'bg-emerald-100 text-emerald-700'
                              : top.category === 'snack'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {top.category === 'all'
                            ? 'Semua Menu'
                            : top.category === 'minuman'
                            ? 'Khusus Minuman'
                            : top.category === 'makanan'
                            ? 'Khusus Makanan'
                            : top.category === 'snack'
                            ? 'Khusus Snack'
                            : top.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-extrabold text-blue-600">{formatCurrency(top.price)}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            top.status === 'tersedia'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {top.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditTopping(top)}
                            title="Edit Topping"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTopping(top.id, top.name)}
                            title="Hapus Topping"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredToppings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Tidak ada topping yang cocok dengan filter atau pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Menu Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col max-h-[88vh]">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base">
                {editingMenu ? 'Edit Data Menu' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="text-white/80 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Nama Menu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Meo Butterscotch Latte"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="clay-input !py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Kategori *
                  </label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => {
                      const newCat = e.target.value as 'minuman' | 'makanan' | 'snack';
                      const isDefaultImg =
                        !menuForm.image_url ||
                        menuForm.image_url.includes('coffee_signature') ||
                        menuForm.image_url.includes('makanan_berat') ||
                        menuForm.image_url.includes('dessert_pastry') ||
                        menuForm.image_url.includes('hero_cafe');
                      const autoImg =
                        newCat === 'makanan'
                          ? '/assets/images/makanan_berat.jpg'
                          : newCat === 'snack'
                          ? '/assets/images/dessert_pastry.jpg'
                          : '/assets/images/coffee_signature.jpg';
                      setMenuForm({
                        ...menuForm,
                        category: newCat,
                        image_url: isDefaultImg ? autoImg : menuForm.image_url,
                      });
                    }}
                    className="clay-input !py-2 text-xs"
                  >
                    <option value="minuman">Minuman (Coffee/Mocktail)</option>
                    <option value="makanan">Makanan Berat / Utama</option>
                    <option value="snack">Snack & Bites</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 28000"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                    className="clay-input !py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  URL Gambar Menu
                </label>
                <input
                  type="text"
                  placeholder="/assets/images/makanan_berat.jpg atau URL Web"
                  value={menuForm.image_url}
                  onChange={(e) => setMenuForm({ ...menuForm, image_url: e.target.value })}
                  className="clay-input !py-2 text-xs"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setMenuForm({ ...menuForm, image_url: '/assets/images/makanan_berat.jpg' })}
                    className="text-[10px] px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200"
                  >
                    🍛 Preset Makanan Berat
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuForm({ ...menuForm, image_url: '/assets/images/coffee_signature.jpg' })}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                  >
                    ☕ Preset Kopi
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuForm({ ...menuForm, image_url: '/assets/images/mocktail_ocean.jpg' })}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                  >
                    🍹 Preset Mocktail
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuForm({ ...menuForm, image_url: '/assets/images/dessert_pastry.jpg' })}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                  >
                    🥐 Preset Pastry/Snack
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Deskripsi Menu
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan rasa, komposisi atau keunggulan menu..."
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="clay-input !py-2 text-xs resize-none"
                ></textarea>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Status Ketersediaan
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="tersedia"
                      checked={menuForm.status === 'tersedia'}
                      onChange={() => setMenuForm({ ...menuForm, status: 'tersedia' })}
                    />
                    Tersedia (Ready)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="habis"
                      checked={menuForm.status === 'habis'}
                      onChange={() => setMenuForm({ ...menuForm, status: 'habis' })}
                    />
                    Habis (Sold Out)
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary !py-2 !px-5 text-xs shadow-md"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topping Modal */}
      {isToppingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col max-h-[88vh]">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base">
                {editingTopping ? 'Edit Topping' : 'Tambah Topping Baru'}
              </h3>
              <button
                onClick={() => setIsToppingModalOpen(false)}
                className="text-white/80 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTopping} className="p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Nama Topping *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Grass Jelly / Ice Cream Scoop"
                  value={toppingForm.name}
                  onChange={(e) => setToppingForm({ ...toppingForm, name: e.target.value })}
                  className="clay-input !py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Harga Tambahan (Rp) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 5000"
                  value={toppingForm.price}
                  onChange={(e) => setToppingForm({ ...toppingForm, price: e.target.value })}
                  className="clay-input !py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Kategori Menu untuk Topping *
                </label>
                <select
                  value={toppingForm.category}
                  onChange={(e) =>
                    setToppingForm({
                      ...toppingForm,
                      category: e.target.value as 'minuman' | 'makanan' | 'snack' | 'all',
                    })
                  }
                  className="clay-input !py-2 text-xs font-semibold cursor-pointer"
                >
                  <option value="minuman">Khusus Minuman</option>
                  <option value="makanan">Khusus Makanan</option>
                  <option value="snack">Khusus Snack</option>
                  <option value="all">Semua Menu</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pilih kategori menu agar topping ini hanya dapat dipilih pada menu yang sesuai.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Status Ketersediaan *
                </label>
                <select
                  value={toppingForm.status}
                  onChange={(e) =>
                    setToppingForm({
                      ...toppingForm,
                      status: e.target.value as 'tersedia' | 'habis',
                    })
                  }
                  className="clay-input !py-2 text-xs font-semibold cursor-pointer"
                >
                  <option value="tersedia">Tersedia</option>
                  <option value="habis">Habis (Kosong)</option>
                </select>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary !py-2 !px-5 text-xs shadow-md font-bold"
                >
                  {editingTopping ? 'Simpan Perubahan' : 'Tambah Topping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerMenuPage;
