import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  Plus,
  Layers,
  Calendar,
  X,
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Clock,
  Sparkles,
  Pencil,
  Check,
  ArrowUp,
  Trash2
} from 'lucide-react';
import { db } from '../services/supabase';
import { formatCurrency } from '../services/config';
import { Order } from '../types';
import {
  inventoryService,
  MaterialStock,
  MENU_RECIPES
} from '../services/inventoryService';
import { CustomDatePicker } from '../components/common/CustomDatePicker';

export const OwnerStokPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<MaterialStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Periode Filter: Tahun (2026 - 2035) & Bulan
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('10'); // Default Oktober 2026
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Inline Edit Estimasi Kebutuhan (Dapat Diedit Langsung oleh Owner)
  const [editingEstimateId, setEditingEstimateId] = useState<string | null>(null);
  const [editingEstimateValue, setEditingEstimateValue] = useState<string>('');

  // Modals
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false);
  const [isWriteOffModalOpen, setIsWriteOffModalOpen] = useState(false);
  const [isWriteOffHistoryOpen, setIsWriteOffHistoryOpen] = useState(false);
  const [isRecipeGuideOpen, setIsRecipeGuideOpen] = useState(false);
  const [recipeGuideCategory, setRecipeGuideCategory] = useState<string>('all');
  const [recipeGuideSearch, setRecipeGuideSearch] = useState<string>('');

  // Restock Form State
  const [restockForm, setRestockForm] = useState({
    materialId: '',
    additionalQty: '',
    totalCost: '',
    date: new Date().toISOString().slice(0, 10),
  });

  // Keluarkan Stok Kadaluwarsa Form State
  const [writeOffForm, setWriteOffForm] = useState({
    materialId: '',
    qty: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  // New Material Form State
  const [newMaterialForm, setNewMaterialForm] = useState({
    name: '',
    category: 'Kopi & Dairy' as any,
    unit: 'kg',
    costPerUnit: '',
    supplier: '',
    initialStock: '',
    monthlyEstimatedNeed: '',
    expiryDateOld: '',
    expiryDateNew: '',
  });

  const selectedPeriod = `${selectedYear}-${selectedMonth}`;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const orderList = await db.getOrders();
      setOrders(orderList);
      const computedMaterials = inventoryService.calculateStockWithOrders(orderList, selectedPeriod);
      setMaterials(computedMaterials);
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('meo_cafe_tx_updated', handleUpdate);
    window.addEventListener('meo_cafe_stock_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('meo_cafe_tx_updated', handleUpdate);
      window.removeEventListener('meo_cafe_stock_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [selectedPeriod]);

  // Handler untuk menyimpan perubahan estimasi kebutuhan dari Owner
  const handleSaveEstimate = (matId: string) => {
    const val = parseFloat(editingEstimateValue);
    if (!isNaN(val) && val >= 0) {
      inventoryService.updateEstimatedNeed(matId, val);
      const updated = inventoryService.calculateStockWithOrders(orders, selectedPeriod);
      setMaterials(updated);
    }
    setEditingEstimateId(null);
  };

  const handleOpenRestock = (targetMatId?: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const defaultDate = today.startsWith(selectedPeriod) ? today : `${selectedPeriod}-10`;
    setRestockForm({
      materialId: targetMatId || '',
      additionalQty: '',
      totalCost: '',
      date: defaultDate,
    });
    setIsRestockModalOpen(true);
  };

  // Handle Restock Submission
  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockForm.materialId || !restockForm.additionalQty || !restockForm.totalCost) {
      return;
    }

    const qty = Number(restockForm.additionalQty);
    const cost = Number(restockForm.totalCost);

    inventoryService.addRestock(restockForm.materialId, qty, cost, restockForm.date);
    
    // Refresh computed materials
    const updated = inventoryService.calculateStockWithOrders(orders, selectedPeriod);
    setMaterials(updated);

    setIsRestockModalOpen(false);
    setRestockForm({ materialId: '', additionalQty: '', totalCost: '', date: new Date().toISOString().slice(0, 10) });
  };

  // Open Keluarkan Stok Kadaluwarsa Modal
  const handleOpenWriteOff = (targetMatId?: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const target = materials.find(m => m.id === targetMatId) || materials.find(m => m.status === 'Kadaluwarsa') || materials[0];
    // Stok kadaluwarsa yang keluar: pengurangan dari jumlah semua sisa stok bulan lalu dikurangi sisa stok bulan lalu yang sudah terpakai sebelum kadaluwarsa
    const defaultQty = target?.expiredStockAvailable !== undefined && target.expiredStockAvailable > 0
      ? target.expiredStockAvailable
      : 0;

    setWriteOffForm({
      materialId: target?.id || '',
      qty: defaultQty > 0 ? String(defaultQty) : '',
      date: today,
      notes: '',
    });
    setIsWriteOffModalOpen(true);
  };

  // Handle Write-Off Submission (Opsi A: Manual Discard oleh Owner)
  const handleSaveWriteOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeOffForm.materialId || !writeOffForm.qty || Number(writeOffForm.qty) <= 0) {
      alert('Mohon pilih bahan dan masukkan jumlah stok yang dikeluarkan!');
      return;
    }
    const target = materials.find(m => m.id === writeOffForm.materialId);
    const qty = Number(writeOffForm.qty);
    if (!target) return;

    if (qty > target.currentStock) {
      alert(`Jumlah yang dikeluarkan (${qty} ${target.unit}) melebihi sisa stok gudang (${target.currentStock} ${target.unit})!`);
      return;
    }

    const maxExpired = target.expiredStockAvailable !== undefined && target.expiredStockAvailable > 0
      ? target.expiredStockAvailable
      : target.currentStock;

    if (qty > maxExpired) {
      alert(`Jumlah yang dikeluarkan (${qty} ${target.unit}) melebihi stok yang kadaluwarsa (${maxExpired} ${target.unit}). Stok restock baru yang belum kadaluwarsa tidak boleh ikut dikeluarkan!`);
      return;
    }

    inventoryService.addExpiredWriteOff(writeOffForm.materialId, qty, writeOffForm.date, writeOffForm.notes);
    const updated = inventoryService.calculateStockWithOrders(orders, selectedPeriod);
    setMaterials(updated);
    setIsWriteOffModalOpen(false);
  };

  const handleDeleteWriteOff = (id: string) => {
    if (confirm('Batalkan pengeluaran stok ini dan kembalikan stok fisik ke gudang?')) {
      inventoryService.deleteExpiredWriteOff(id);
      const updated = inventoryService.calculateStockWithOrders(orders, selectedPeriod);
      setMaterials(updated);
    }
  };

  // Handle New Material Submission
  const handleSaveNewMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialForm.name || !newMaterialForm.initialStock || !newMaterialForm.expiryDateNew) {
      alert('Mohon lengkapi nama bahan, stok awal, dan tanggal kedaluwarsa!');
      return;
    }

    const initStock = Number(newMaterialForm.initialStock);
    const estNeed = Number(newMaterialForm.monthlyEstimatedNeed) || initStock;
    const cost = Number(newMaterialForm.costPerUnit) || 0;

    inventoryService.addNewMaterial({
      id: `mat-${Date.now()}`,
      name: newMaterialForm.name,
      category: newMaterialForm.category,
      unit: newMaterialForm.unit,
      costPerUnit: cost,
      supplier: newMaterialForm.supplier || 'Supplier Umum',
      previousMonthStock: initStock,
      restockedThisMonth: 0,
      monthlyEstimatedNeed: estNeed,
      expiryDateOld: newMaterialForm.expiryDateOld || '-',
      expiryDateNew: newMaterialForm.expiryDateNew,
      expiryDate: newMaterialForm.expiryDateNew,
    });

    const updated = inventoryService.calculateStockWithOrders(orders, selectedPeriod);
    setMaterials(updated);

    setIsNewMaterialModalOpen(false);
    setNewMaterialForm({
      name: '',
      category: 'Kopi & Dairy',
      unit: 'kg',
      costPerUnit: '',
      supplier: '',
      initialStock: '',
      monthlyEstimatedNeed: '',
      expiryDateOld: '',
      expiryDateNew: '',
    });
  };

  // Filter materials
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchCat = filterCategory === 'all' || m.category === filterCategory;
      const matchStatus = filterStatus === 'all' || m.status === filterStatus;
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.supplier.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });
  }, [materials, filterCategory, filterStatus, searchQuery]);

  // Total Nilai Kerugian Stok Kadaluwarsa pada Periode Terpilih
  const totalExpiredLoss = useMemo(() => {
    const writeOffs = inventoryService.getExpiredWriteOffs();
    return writeOffs
      .filter(w => w.period === selectedPeriod || (w.date && w.date.startsWith(selectedPeriod)))
      .reduce((sum, w) => sum + w.totalLoss, 0);
  }, [materials, selectedPeriod]);

  // Daftar Riwayat Stok Kadaluwarsa yang Dikeluarkan pada Periode Terpilih
  const writeOffsList = useMemo(() => {
    const writeOffs = inventoryService.getExpiredWriteOffs();
    return writeOffs
      .filter(w => w.period === selectedPeriod || (w.date && w.date.startsWith(selectedPeriod)))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [materials, selectedPeriod]);

  // Year options: 2026 - 2035
  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = 2026; y <= 2035; y++) {
      list.push(y.toString());
    }
    return list;
  }, []);

  const monthOptions = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || 'Bulan';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5">
      
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/owner/keuangan')}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
            title="Kembali ke Manajemen Keuangan"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Manajemen Stok Gudang & Kedaluwarsa
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Tambah Stok (Restock) */}
          <button
            onClick={() => handleOpenRestock()}
            className="clay-btn clay-btn-primary !py-2.5 !px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-md shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Stok (Restock)</span>
          </button>

          {/* Tombol Bahan Baku Baru */}
          <button
            onClick={() => setIsNewMaterialModalOpen(true)}
            className="clay-btn clay-btn-secondary !py-2.5 !px-3.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-slate-700 border-slate-200 shadow-sm shrink-0"
            title="Daftarkan Bahan Baku Baru"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Bahan Baru</span>
          </button>
        </div>
      </div>

      {/* Area Filter & Toolbar: Periode di Atas Kanan di Luar Background Putih */}
      <div className="space-y-2">
        {/* Baris di Luar Background Putih: Kanan Ada Periode Sejajar Kanan Rapi */}
        <div className="flex justify-end">
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-600 shrink-0">Periode:</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Pilihan Bulan */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              {/* Pilihan Tahun */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-transparent border-none focus:outline-none cursor-pointer border-l border-slate-200 pl-2"
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    Tahun {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filter Toolbar Card (Background Putih) */}
        <div className="clay-card p-3.5 sm:p-4 bg-white shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Pencarian Bahan */}
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="text"
                  placeholder="Cari nama bahan, kategori, supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="clay-input !pl-4 !pr-10 py-2 text-xs w-full"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Filter Kategori Bahan */}
              <div className="shrink-0 min-w-[160px]">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="clay-input py-2 text-xs cursor-pointer w-full"
                >
                  <option value="all">Semua Kategori Bahan</option>
                  <option value="Kopi & Dairy">Kopi & Dairy</option>
                  <option value="Daging & Seafood">Daging & Seafood</option>
                  <option value="Pastry & Bakery">Pastry & Bakery</option>
                  <option value="Bumbu & Saus">Bumbu & Saus</option>
                  <option value="Topping & Lainnya">Topping & Lainnya</option>
                </select>
              </div>

              {/* Filter Status Bahan */}
              <div className="shrink-0 min-w-[140px]">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="clay-input py-2 text-xs cursor-pointer w-full"
                >
                  <option value="all">Semua Status</option>
                  <option value="Aman">Aman</option>
                  <option value="Perlu Restock">Perlu Restock</option>
                  <option value="Menipis">Menipis</option>
                  <option value="Kadaluwarsa">Kadaluwarsa</option>
                </select>
              </div>
            </div>

            {/* Panduan Takaran Resep: Sejajar di Kanan */}
            <div className="shrink-0 flex items-center justify-end">
              <button
                onClick={() => setIsRecipeGuideOpen(true)}
                className="clay-btn !py-2 !px-3.5 text-xs font-semibold flex items-center gap-2 text-indigo-700 bg-indigo-50/80 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-2xs shrink-0"
                title="Buka panduan takaran resep menu & topping"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Panduan Takaran</span>
              </button>
            </div>
          </div>

          {/* Baris Status Rapi di Bawah Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200/70 shadow-2xs">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                Total {filteredMaterials.length} Komoditas Bahan Baku
              </span>

              {filterCategory !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                  <span>Kategori: <strong>{filterCategory}</strong></span>
                  <button
                    onClick={() => setFilterCategory('all')}
                    className="text-slate-400 hover:text-slate-700 font-bold"
                    title="Reset filter kategori"
                  >
                    ✕
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold text-[11px] border border-amber-200">
                  <span>Pencarian: <strong>"{searchQuery}"</strong></span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-amber-500 hover:text-amber-700 font-bold"
                    title="Hapus kata kunci pencarian"
                  >
                    ✕
                  </button>
                </span>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Tabel Komprehensif Stok Gudang & Pemisahan Kedaluwarsa Lama/Baru */}
      <div className="clay-card p-4 sm:p-5 bg-white space-y-3.5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 bg-slate-50/70">
                <th className="py-3 px-3.5 rounded-l-xl">Bahan Baku & Kategori</th>
                <th className="py-3 px-3 text-center">Sisa Stok Bulan Lalu</th>
                <th className="py-3 px-3 text-center">Restock Bulan Ini</th>
                <th className="py-3 px-3 text-center">Terpakai (POS)</th>
                <th className="py-3 px-3.5 text-center">Stok Gudang Saat Ini</th>
                <th className="py-3 px-3 text-center">Estimasi Kebutuhan</th>
                <th className="py-3 px-3.5 text-center">Kedaluwarsa Stok Lama</th>
                <th className="py-3 px-3.5 text-center">Kedaluwarsa Stok Baru</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3.5 text-center rounded-r-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMaterials.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3.5">
                    <div className="font-bold text-slate-900">{mat.name}</div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {mat.category} • {mat.supplier}
                    </div>
                  </td>

                  {/* Sisa Stok Bulan Sebelumnya */}
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-600 bg-slate-50/40">
                    {mat.previousMonthStock} {mat.unit}
                  </td>

                  {/* Restock Bulan Ini */}
                  <td className="py-3.5 px-3 text-center font-bold text-blue-600">
                    +{mat.restockedThisMonth} {mat.unit}
                  </td>

                  {/* Terpakai Otomatis dari Pesanan POS */}
                  <td className="py-3.5 px-3 text-center font-bold text-rose-600">
                    -{mat.usedThisMonth} {mat.unit}
                  </td>

                  {/* Stok Gudang Saat Ini */}
                  <td className="py-3.5 px-3.5 text-center">
                    <span className="font-extrabold text-sm text-slate-900 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-100 inline-block">
                      {mat.currentStock} {mat.unit}
                    </span>
                  </td>

                  {/* Estimasi Kebutuhan / Bulan (Dapat Diedit Langsung oleh Owner Sesuai Perkembangan Kafe) */}
                  <td className="py-3.5 px-3 text-center font-medium text-slate-600">
                    {editingEstimateId === mat.id ? (
                      <div className="inline-flex items-center justify-center gap-1 bg-white p-1 rounded-xl shadow-xs border border-blue-300">
                        <input
                          type="number"
                          step="any"
                          value={editingEstimateValue}
                          onChange={(e) => setEditingEstimateValue(e.target.value)}
                          className="w-16 px-1.5 py-0.5 text-xs font-bold text-center border border-blue-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-blue-50/40"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEstimate(mat.id);
                            if (e.key === 'Escape') setEditingEstimateId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEstimate(mat.id)}
                          className="p-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                          title="Simpan"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEstimateId(null)}
                          className="p-1 rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                          title="Batal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEstimateId(mat.id);
                          setEditingEstimateValue(String(mat.monthlyEstimatedNeed));
                        }}
                        className="group inline-flex items-center justify-center gap-1.5 font-medium text-slate-700 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50/80 transition-colors cursor-pointer"
                        title="Klik untuk ubah estimasi kebutuhan bulan ini"
                      >
                        <span className="font-semibold">{mat.monthlyEstimatedNeed} {mat.unit}</span>
                        <Pencil className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:text-blue-600 transition-opacity" />
                      </button>
                    )}
                  </td>

                  {/* Tanggal Kedaluwarsa Stok Lama */}
                  <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                    {mat.expiryDateOld === '-' || mat.expiryDateOld.includes('Batch') ? (
                      <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-lg bg-slate-100">
                        {mat.expiryDateOld}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/60 text-[11px]">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {mat.expiryDateOld}
                      </span>
                    )}
                  </td>

                  {/* Tanggal Kedaluwarsa Stok Baru */}
                  <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-emerald-800 font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60 text-[11px]">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      {mat.expiryDateNew}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      mat.status === 'Aman'
                        ? 'bg-emerald-100 text-emerald-800'
                        : mat.status === 'Perlu Restock'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {mat.status}
                    </span>
                  </td>

                  {/* Aksi: Keluarkan Stok Kadaluwarsa (Opsi A) */}
                  <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                    {mat.status === 'Kadaluwarsa' ||
                     (mat.expiredStockAvailable !== undefined && mat.expiredStockAvailable > 0) ? (
                      <button
                        type="button"
                        onClick={() => handleOpenWriteOff(mat.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        title="Keluarkan stok kadaluwarsa ini dari gudang"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Keluarkan Stok</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenWriteOff(mat.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Keluarkan stok"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Info & Back to Top Anchor */}
        <div className="p-4 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500 bg-white">
          <span>
            Menampilkan <strong>{filteredMaterials.length}</strong> bahan baku
          </span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline underline-offset-4 font-semibold transition-colors py-1 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Kembali ke atas</span>
          </button>
        </div>
      </div>

      {/* Modal: Tambah Stok (Restock) -> Header Sticky & Tombol Silang Tetap Di Tempat */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="clay-card bg-white w-full max-w-lg max-h-[90vh] my-auto flex flex-col overflow-hidden relative shadow-2xl rounded-3xl animate-in fade-in zoom-in duration-200">
            {/* Header Sticky dengan Tombol Silang Tetap Di Tempat */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0 z-20 sticky top-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Tambah Stok Bahan (Restock)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveRestock} className="p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Pilih Bahan Baku *
                </label>
                <select
                  required
                  value={restockForm.materialId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const mat = materials.find(m => m.id === id);
                    setRestockForm({
                      ...restockForm,
                      materialId: id,
                      totalCost: mat && restockForm.additionalQty ? String(Math.round(mat.costPerUnit * Number(restockForm.additionalQty))) : restockForm.totalCost
                    });
                  }}
                  className="clay-input py-2 text-xs w-full cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Bahan Baku --</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Sisa saat ini: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Jumlah Tambahan *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Contoh: 10"
                    value={restockForm.additionalQty}
                    onChange={(e) => {
                      const qty = e.target.value;
                      const mat = materials.find(m => m.id === restockForm.materialId);
                      setRestockForm({
                        ...restockForm,
                        additionalQty: qty,
                        totalCost: mat && qty ? String(Math.round(mat.costPerUnit * Number(qty))) : restockForm.totalCost
                      });
                    }}
                    className="clay-input py-2 text-xs w-full"
                  />
                </div>

                <div>
                  <CustomDatePicker
                    label="Tanggal Restock"
                    required
                    value={restockForm.date}
                    onChange={(d) => setRestockForm({ ...restockForm, date: d })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Total Biaya Pembelian (Rp) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Total nominal pengeluaran restock"
                  value={restockForm.totalCost}
                  onChange={(e) => setRestockForm({ ...restockForm, totalCost: e.target.value })}
                  className="clay-input py-2 text-xs w-full"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary w-full !py-3 text-xs font-bold shadow-md cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Keluarkan Stok Kadaluwarsa (Opsi A) */}
      {isWriteOffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="clay-card bg-white w-full max-w-lg max-h-[90vh] my-auto flex flex-col overflow-hidden relative shadow-2xl rounded-3xl animate-in fade-in zoom-in duration-200">
            {/* Header Sticky */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0 z-20 sticky top-0">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-900 text-base">Keluarkan Stok Kadaluwarsa</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWriteOffModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveWriteOff} className="p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Pilih Bahan Baku *
                </label>
                <select
                  required
                  value={writeOffForm.materialId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const mat = materials.find((m) => m.id === id);
                    const defaultDiscardQty = mat?.expiredStockAvailable !== undefined
                      ? mat.expiredStockAvailable
                      : (mat?.status === 'Kadaluwarsa' ? Math.max(0, mat.previousMonthStock - (mat.usedThisMonth || 0)) : 0);
                    setWriteOffForm({
                      ...writeOffForm,
                      materialId: id,
                      qty: defaultDiscardQty > 0 ? String(defaultDiscardQty) : '',
                    });
                  }}
                  className="clay-input py-2 text-xs w-full cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Bahan Baku --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Sisa stok: {m.currentStock} {m.unit} {m.status === 'Kadaluwarsa' ? '• KADALUWARSA' : ''})
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const targetMat = materials.find((m) => m.id === writeOffForm.materialId);
                const maxExpired = targetMat?.expiredStockAvailable !== undefined && targetMat.expiredStockAvailable > 0
                  ? targetMat.expiredStockAvailable
                  : (targetMat?.currentStock || 0);
                const qtyNum = Number(writeOffForm.qty) || 0;
                const totalLossCalc = Math.round(qtyNum * (targetMat?.costPerUnit || 0));
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                          Jumlah Fisik Kadaluwarsa Dikeluarkan * {targetMat ? `(${targetMat.unit})` : ''}
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          min="0.01"
                          max={maxExpired > 0 ? maxExpired : undefined}
                          placeholder={targetMat ? `Maks: ${maxExpired}` : '0'}
                          value={writeOffForm.qty}
                          onChange={(e) => setWriteOffForm({ ...writeOffForm, qty: e.target.value })}
                          className="clay-input py-2 text-xs w-full"
                        />
                        {targetMat && (
                          <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                            <span className="block font-semibold text-rose-700">
                              Stok lama sisa bulan lalu (kadaluwarsa): {maxExpired} {targetMat.unit}
                            </span>
                            <span className="block text-slate-500">
                              Stok restock baru (belum kadaluwarsa): {targetMat.restockedThisMonth} {targetMat.unit}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <CustomDatePicker
                          label="Tanggal Pengeluaran"
                          required
                          value={writeOffForm.date}
                          onChange={(d) => setWriteOffForm({ ...writeOffForm, date: d })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                        Keterangan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Stok kadaluwarsa batch lama dibuang"
                        value={writeOffForm.notes}
                        onChange={(e) => setWriteOffForm({ ...writeOffForm, notes: e.target.value })}
                        className="clay-input py-2 text-xs w-full"
                      />
                    </div>

                    {targetMat && qtyNum > 0 && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-rose-800">Total Nilai Kerugian:</span>
                        <span className="font-extrabold text-rose-700 text-sm">
                          {formatCurrency(totalLossCalc)}
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="pt-2">
                <button
                  type="submit"
                  className="clay-btn !bg-rose-600 hover:!bg-rose-700 text-white w-full !py-2.5 text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Keluarkan Stok</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Riwayat Pengeluaran Stok Kadaluwarsa */}
      {isWriteOffHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="clay-card bg-white w-full max-w-2xl max-h-[90vh] my-auto flex flex-col overflow-hidden relative shadow-2xl rounded-3xl animate-in fade-in zoom-in duration-200">
            {/* Header Sticky */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0 z-20 sticky top-0">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Riwayat Stok Kadaluwarsa Dikeluarkan</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWriteOffHistoryOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {writeOffsList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada catatan stok kadaluwarsa yang dikeluarkan pada periode ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {writeOffsList.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{item.materialName}</span>
                          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            -{item.qty} {item.unit}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.date} • {item.notes || 'Kadaluwarsa'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-extrabold text-xs text-rose-600">
                            {formatCurrency(item.totalLoss)}
                          </div>
                          <div className="text-[10px] text-slate-400">Kerugian</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteWriteOff(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Kembalikan stok ke gudang"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Total Kerugian ({writeOffsList.length} pencatatan):
              </span>
              <span className="font-extrabold text-rose-700 text-sm">
                {formatCurrency(totalExpiredLoss)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Bahan Baku Baru -> Header Sticky, Dapat Digulir & Tombol Silang Tetap Di Tempat */}
      {isNewMaterialModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="clay-card bg-white w-full max-w-lg max-h-[90vh] my-auto flex flex-col overflow-hidden relative shadow-2xl rounded-3xl animate-in fade-in zoom-in duration-200">
            {/* Header Sticky */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0 z-20 sticky top-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Daftarkan Bahan Baku Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMaterialModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveNewMaterial} className="p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Nama Bahan Baku *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Biji Kopi Robusta Temanggung / Keju Mozzarella"
                  value={newMaterialForm.name}
                  onChange={(e) => setNewMaterialForm({ ...newMaterialForm, name: e.target.value })}
                  className="clay-input py-2 text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Kategori
                  </label>
                  <select
                    value={newMaterialForm.category}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, category: e.target.value as any })}
                    className="clay-input py-2 text-xs w-full cursor-pointer"
                  >
                    <option value="Kopi & Dairy">Kopi & Dairy</option>
                    <option value="Daging & Seafood">Daging & Seafood</option>
                    <option value="Pastry & Bakery">Pastry & Bakery</option>
                    <option value="Bumbu & Saus">Bumbu & Saus</option>
                    <option value="Topping & Lainnya">Topping & Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Satuan Unit
                  </label>
                  <select
                    value={newMaterialForm.unit}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, unit: e.target.value })}
                    className="clay-input py-2 text-xs w-full cursor-pointer"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="liter">liter (Liter)</option>
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="pack">pack (Pack)</option>
                    <option value="botol">botol (Botol)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Stok Awal Masuk *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Contoh: 15"
                    value={newMaterialForm.initialStock}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, initialStock: e.target.value })}
                    className="clay-input py-2 text-xs w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Target Kebutuhan Bulanan
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Contoh: 25"
                    value={newMaterialForm.monthlyEstimatedNeed}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, monthlyEstimatedNeed: e.target.value })}
                    className="clay-input py-2 text-xs w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Biaya Beli per Unit (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 95000"
                    value={newMaterialForm.costPerUnit}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, costPerUnit: e.target.value })}
                    className="clay-input py-2 text-xs w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Nama Supplier
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Mitra Tani / Importir"
                    value={newMaterialForm.supplier}
                    onChange={(e) => setNewMaterialForm({ ...newMaterialForm, supplier: e.target.value })}
                    className="clay-input py-2 text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <CustomDatePicker
                  label="Kadaluwarsa"
                  required
                  value={newMaterialForm.expiryDateNew}
                  onChange={(d) => setNewMaterialForm({ ...newMaterialForm, expiryDateNew: d })}
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary w-full !py-3 text-xs font-bold shadow-md"
                >
                  Daftarkan Bahan Baku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Dialog: Panduan Takaran Resep Per Menu (BOM) -> Kolom Gram Rapi, Lurus & Bersih */}
      {isRecipeGuideOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="clay-card bg-white w-full max-w-4xl max-h-[90vh] my-auto flex flex-col overflow-hidden relative shadow-2xl rounded-3xl animate-in fade-in zoom-in duration-200">
            {/* Header Sticky */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0 z-20 sticky top-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Formula & Takaran Resep Baku per 1 Porsi Menu (BOM)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecipeGuideOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Search Bar Sticky */}
            <div className="px-6 py-3 bg-slate-50/90 border-b border-slate-100 shrink-0 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'Semua Menu' },
                    { id: 'Kopi & Minuman', label: 'Kopi & Minuman' },
                    { id: 'Makanan Berat', label: 'Makanan Berat' },
                    { id: 'Pastry & Dessert', label: 'Pastry & Dessert' },
                    { id: 'Snack & Bites', label: 'Snack & Bites' },
                    { id: 'Topping', label: 'Topping (8 Varian)' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRecipeGuideCategory(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        recipeGuideCategory === tab.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search in Recipes */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari menu, topping, bahan..."
                    value={recipeGuideSearch}
                    onChange={(e) => setRecipeGuideSearch(e.target.value)}
                    className="clay-input !py-1.5 !pl-8 !pr-3 text-xs w-full bg-white"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(MENU_RECIPES)
                  .filter(([_, recipe]) => {
                    const matchCat = recipeGuideCategory === 'all' || recipe.category === recipeGuideCategory;
                    const q = recipeGuideSearch.toLowerCase().trim();
                    const matchSearch =
                      !q ||
                      recipe.menuName.toLowerCase().includes(q) ||
                      recipe.ingredients.some((ing) => ing.materialName.toLowerCase().includes(q));
                    return matchCat && matchSearch;
                  })
                  .map(([menuKey, recipe]) => (
                    <div key={menuKey} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <span className="font-extrabold text-sm text-slate-900">{recipe.menuName}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          recipe.category === 'Topping'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {recipe.category}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                          <span>Bahan Baku Komoditas</span>
                          <span>Takaran Baku</span>
                        </div>

                        <div className="space-y-1.5">
                          {recipe.ingredients.map((ing, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between py-2 px-3 bg-white rounded-xl border border-slate-100 text-xs shadow-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                                <span className="font-semibold text-slate-800 truncate">{ing.materialName}</span>
                                {ing.roleDesc && (
                                  <span className="text-[11px] text-slate-400 hidden sm:inline">({ing.roleDesc})</span>
                                )}
                              </div>
                              
                              {/* Kolom Takaran yang Lurus dan Rapi Sempurna */}
                              <div className="w-28 shrink-0 px-2.5 py-1 bg-slate-100/90 rounded-lg border border-slate-200/80 font-mono font-bold text-xs text-slate-900 flex items-center justify-between">
                                <span className="w-14 text-right pr-1">{ing.measureValue}</span>
                                <span className="w-10 text-left text-[11px] font-semibold text-slate-500 font-sans">{ing.measureUnit}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OwnerStokPage;
