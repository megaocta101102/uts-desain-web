import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  ArrowLeft,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  Layers,
  Info,
  ArrowUp,
  CalendarClock,
  UserCheck,
  Sparkles,
  Wallet
} from 'lucide-react';
import { Order } from '../types';
import { db } from '../services/supabase';
import { formatCurrency } from '../services/config';
import { CustomDatePicker } from '../components/common/CustomDatePicker';
import { inventoryService } from '../services/inventoryService';
import {
  getSavedTransactions,
  saveTransactions,
  generateAutoRecurringExpenses,
  TransactionRecord
} from '../services/financeService';

export const OwnerRiwayatArusKasPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [manualTransactions, setManualTransactions] = useState<TransactionRecord[]>(() => {
    return getSavedTransactions();
  });

  // Filter States: Tahun (2026-2035) dan Bulan (Semua, 01..12)
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' atau '01'..'12'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Pemasukan' | 'Pengeluaran' | 'Kerugian'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSystem, setFilterSystem] = useState<'all' | 'auto' | 'manual'>('all');

  const [writeOffsList, setWriteOffsList] = useState<any[]>(() => {
    return inventoryService.getExpiredWriteOffs();
  });

  // Modal State for Manual Expense
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    category: 'Perawatan Alat',
    type: 'Pengeluaran' as 'Pemasukan' | 'Pengeluaran',
    amount: '',
  });

  useEffect(() => {
    async function loadOrders() {
      try {
        const orderList = await db.getOrders();
        setOrders(orderList);
      } catch (err) {
        console.error('Failed to load orders', err);
      }
    }
    loadOrders();
  }, []);

  useEffect(() => {
    saveTransactions(manualTransactions);
  }, [manualTransactions]);

  useEffect(() => {
    const handleUpdate = () => {
      setManualTransactions(getSavedTransactions());
      setWriteOffsList(inventoryService.getExpiredWriteOffs());
    };
    window.addEventListener('meo_cafe_tx_updated', handleUpdate);
    window.addEventListener('meo_cafe_stock_updated', handleUpdate);
    return () => {
      window.removeEventListener('meo_cafe_tx_updated', handleUpdate);
      window.removeEventListener('meo_cafe_stock_updated', handleUpdate);
    };
  }, []);

  // Combine Monthly Sales POS reports & Manual/Auto Transactions
  const allTransactions = useMemo(() => {
    const list: TransactionRecord[] = [];

    // Group completed orders by month (e.g. '2026-09', '2026-10')
    const monthlyMap: Record<string, { total: number; count: number; lastDate: string }> = {};

    orders.forEach((o) => {
      if (o.status !== 'dibatalkan' && o.created_at) {
        const ym = o.created_at.slice(0, 7);
        const dateOnly = o.created_at.slice(0, 10);
        if (!monthlyMap[ym]) {
          monthlyMap[ym] = { total: 0, count: 0, lastDate: dateOnly };
        }
        monthlyMap[ym].total += Number(o.total_amount) || 0;
        monthlyMap[ym].count += 1;
        if (dateOnly > monthlyMap[ym].lastDate) {
          monthlyMap[ym].lastDate = dateOnly;
        }
      }
    });

    const monthNames: Record<string, string> = {
      '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
      '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
      '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };

    // Generate 1 summary row per month for POS sales income
    Object.entries(monthlyMap).forEach(([ym, data]) => {
      const [yr, mo] = ym.split('-');
      const monthLabel = monthNames[mo] || mo;
      list.push({
        id: `pos-monthly-${ym}`,
        date: ym === '2026-09' ? '2026-09-30' : data.lastDate,
        description: `Laporan Pendapatan Penjualan POS (${monthLabel} ${yr}) - ${data.count} Pesanan`,
        category: 'Penjualan POS',
        type: 'Pemasukan',
        amount: data.total,
        isEditable: false,
        isRecurringAuto: true,
      });
    });

    // Masukkan transaksi yang tersimpan (manual & otomatis)
    manualTransactions.forEach((t) => {
      list.push(t);
    });

    // Masukkan data kerugian stok kadaluwarsa (otomatis tercatat ketika owner mengeluarkan stok dari gudang)
    writeOffsList.forEach((wo) => {
      list.push({
        id: `wo-${wo.id}`,
        date: wo.date,
        description: `Kerugian Stok Kadaluwarsa: ${wo.materialName} (${wo.qty} ${wo.unit})`,
        category: 'Kerugian Stok',
        type: 'Kerugian',
        amount: wo.totalLoss,
        isEditable: false,
        isRecurringAuto: false,
        isWriteOff: true,
        writeOffId: wo.id,
      });
    });

    // Jika filter bulan spesifik dipilih dan merupakan bulan masa depan (> 2026-10),
    // sertakan 4 pengeluaran wajib otomatis tgl 2 jika belum tercatat di manualTransactions
    if (selectedMonth !== 'all') {
      const activePeriod = `${selectedYear}-${selectedMonth}`;
      if (activePeriod > '2026-10') {
        const hasAutoSalary = manualTransactions.some(
          (t) => t.date.startsWith(activePeriod) && t.category === 'Gaji Karyawan' && t.isRecurringAuto
        );
        if (!hasAutoSalary) {
          const autoRecurring = generateAutoRecurringExpenses(activePeriod);
          autoRecurring.forEach((autoTx) => list.push(autoTx));
        }
      }
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, manualTransactions, writeOffsList, selectedYear, selectedMonth]);

  // Available Years: 2026 - 2035 (10 years)
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = 2026; y <= 2035; y++) {
      years.push(y.toString());
    }
    return years;
  }, []);

  const monthOptions = [
    { value: 'all', label: 'Semua Bulan' },
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

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    allTransactions.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [allTransactions]);

  // Filtered by Year, Month, Type, Category, System, and Search
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      // Filter Tahun
      if (selectedYear && !tx.date.startsWith(selectedYear)) {
        return false;
      }
      // Filter Bulan
      if (selectedMonth !== 'all') {
        const expectedPrefix = `${selectedYear}-${selectedMonth}`;
        if (!tx.date.startsWith(expectedPrefix)) {
          return false;
        }
      }

      const matchType = filterType === 'all' || tx.type === filterType;
      const matchCat = filterCategory === 'all' || tx.category === filterCategory;
      const matchSearch =
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.date.includes(searchQuery);

      const matchSystem =
        filterSystem === 'all' ||
        (filterSystem === 'auto' && tx.isRecurringAuto) ||
        (filterSystem === 'manual' && tx.type === 'Pengeluaran' && !tx.isRecurringAuto);

      return matchType && matchCat && matchSearch && matchSystem;
    });
  }, [allTransactions, selectedYear, selectedMonth, filterType, filterCategory, filterSystem, searchQuery]);

  // Totals for filtered view
  const { totalPemasukanFiltered, totalPengeluaranFiltered, totalKerugianFiltered } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let loss = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'Pemasukan') inc += t.amount;
      else if (t.type === 'Pengeluaran') exp += t.amount;
      else if (t.type === 'Kerugian') loss += t.amount;
    });
    return { totalPemasukanFiltered: inc, totalPengeluaranFiltered: exp, totalKerugianFiltered: loss };
  }, [filteredTransactions]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      description: '',
      category: 'Perawatan Alat',
      type: 'Pengeluaran',
      amount: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: TransactionRecord) => {
    if (!tx.isEditable && !tx.isStockExpense) {
      alert('Transaksi otomatis laporan bulanan POS tidak dapat diubah langsung dari sini.');
      return;
    }
    setEditingId(tx.id);
    setForm({
      date: tx.date,
      description: tx.description,
      category: tx.category === 'Operasional' ? 'Lainnya' : tx.category,
      type: tx.type,
      amount: tx.amount.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) {
      alert('Keterangan dan nominal wajib diisi!');
      return;
    }

    if (editingId) {
      const targetTx = manualTransactions.find((t) => t.id === editingId);
      const newAmount = Number(form.amount);

      setManualTransactions(
        manualTransactions.map((t) =>
          t.id === editingId
            ? {
                ...t,
                date: form.date,
                description: form.description,
                category: form.category,
                type: form.type,
                amount: newAmount,
              }
            : t
        )
      );

      // Jika yang diedit adalah transaksi restock stok bahan baku, sinkronkan ke inventaris gudang
      if (targetTx && (targetTx.isStockExpense || targetTx.id?.startsWith('restock-'))) {
        inventoryService.updateRestock(editingId, newAmount, undefined, form.date);
      }
    } else {
      const isStockExp = form.category === 'Bahan Baku';
      const newItem: TransactionRecord = {
        id: `man-${Date.now()}`,
        date: form.date,
        description: form.description,
        category: form.category,
        type: form.type,
        amount: Number(form.amount),
        isEditable: true,
        isStockExpense: isStockExp,
        isRecurringAuto: false, // Tambahan manual oleh owner
      };
      setManualTransactions([newItem, ...manualTransactions]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (tx: TransactionRecord) => {
    if (tx.isWriteOff || (tx as any).writeOffId) {
      if (
        confirm(
          `Apakah Anda yakin ingin membatalkan pengeluaran stok "${tx.description}"?\n(Stok fisik bahan yang kadaluwarsa akan dikembalikan ke gudang)`
        )
      ) {
        const woId = (tx as any).writeOffId || tx.id.replace('wo-', '');
        inventoryService.deleteExpiredWriteOff(woId);
        setWriteOffsList(inventoryService.getExpiredWriteOffs());
      }
      return;
    }

    if (!tx.isEditable && !tx.isStockExpense) {
      alert('Transaksi otomatis laporan bulanan POS tidak dapat dihapus.');
      return;
    }
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus catatan "${tx.description}"? ${
          tx.isStockExpense
            ? '\n(Stok yang sempat ditambahkan ke gudang juga akan otomatis disesuaikan/berkurang)'
            : ''
        }`
      )
    ) {
      setManualTransactions(manualTransactions.filter((t) => t.id !== tx.id));

      // Jika yang dihapus adalah transaksi restock, sinkronkan penurunan stok di gudang
      if (tx.isStockExpense || tx.id?.startsWith('restock-')) {
        inventoryService.removeRestock(tx.id, tx.materialId);
      }
    }
  };

  const exportCSV = () => {
    const headers = 'Tanggal,Keterangan,Kategori,Sistem,Jenis,Nominal\n';
    const rows = filteredTransactions
      .map((t) => {
        const sysLabel = t.isWriteOff ? 'Otomatis Gudang' : (t.isRecurringAuto ? 'Otomatis Tgl 2' : 'Manual Owner');
        return `"${t.date}","${t.description.replace(/"/g, '""')}","${t.category}","${sysLabel}","${t.type}",${t.amount}`;
      })
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const periodLabel = selectedMonth === 'all' ? selectedYear : `${selectedYear}_${selectedMonth}`;
    link.setAttribute('download', `riwayat_aruskas_meocafe_${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/owner/keuangan')}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
            title="Kembali ke Keuangan"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Riwayat Pemasukan & Pengeluaran <span className="text-blue-600">Aktual</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="clay-btn clay-btn-primary !py-2.5 !px-4 text-xs font-semibold flex items-center gap-2 shadow-md shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran</span>
          </button>

          <button
            onClick={exportCSV}
            className="clay-btn clay-btn-secondary !py-2.5 !px-4 text-xs font-semibold flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Area Filter & Toolbar: Jarak Dirapatkan, Seimbang, dan Terhubung Erat */}
      <div className="space-y-2">
        {/* Baris di Luar Background Putih: Kanan Ada Periode Sejajar di Atas Kolom Pemasukan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-7 xl:col-span-8 hidden lg:block" />
          <div className="lg:col-span-5 xl:col-span-4 flex justify-end">
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

                {/* Pilihan Tahun: 2026 s/d 2035 */}
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
        </div>

        {/* Filter Toolbar: Desain Presisi Seimbang */}
        <div className="clay-card p-3.5 sm:p-4 bg-white shadow-xs space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            
            {/* Kolom Kiri: Filter Controls */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between gap-2.5">
              
              {/* Baris 1: Pencarian */}
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Cari transaksi, menu, atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="clay-input !pl-4 !pr-10 py-2 text-xs w-full h-[40px] rounded-xl"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Baris 2: Filter Jenis & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="clay-input py-2 px-3 text-xs font-semibold text-slate-800 cursor-pointer h-[40px] rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="all">Semua Jenis Transaksi</option>
                  <option value="Pemasukan">Pemasukan Saja</option>
                  <option value="Pengeluaran">Pengeluaran Saja</option>
                  <option value="Kerugian">Kerugian Saja</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="clay-input py-2 px-3 text-xs font-semibold text-slate-800 cursor-pointer h-[40px] rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="all">Semua Kategori</option>
                  {categoriesList.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Kolom Kanan: 3 Kotak Pemasukan, Pengeluaran & Kerugian */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between gap-2">
              
              <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200/90 text-emerald-950 shadow-2xs h-[38px] hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wide text-emerald-700">Pemasukan</span>
                </div>
                <span className="text-sm font-black text-emerald-700 tracking-tight">
                  +{formatCurrency(totalPemasukanFiltered)}
                </span>
              </div>

              <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-rose-50/90 border border-rose-200/90 text-rose-950 shadow-2xs h-[38px] hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <TrendingDown className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wide text-rose-700">Pengeluaran</span>
                </div>
                <span className="text-sm font-black text-rose-700 tracking-tight">
                  -{formatCurrency(totalPengeluaranFiltered)}
                </span>
              </div>

              <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-amber-50/90 border border-amber-300/90 text-amber-950 shadow-2xs h-[38px] hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wide text-amber-800">Kerugian</span>
                </div>
                <span className="text-sm font-black text-amber-800 tracking-tight">
                  -{formatCurrency(totalKerugianFiltered)}
                </span>
              </div>

            </div>

          </div>

          {/* Sub-bar Informasi / Status Transaksi */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-slate-500 font-medium">
              <span className="font-bold text-slate-700">{filteredTransactions.length}</span> transaksi ditemukan
              {filterSystem !== 'all' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Filter: {filterSystem === 'auto' ? 'Otomatis (Tgl 2)' : 'Manual (Owner)'}
                </span>
              )}
              {(searchQuery || filterType !== 'all' || filterCategory !== 'all' || filterSystem !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterCategory('all');
                    setFilterSystem('all');
                  }}
                  className="text-primary hover:underline text-[11px] font-bold ml-1 cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Transactions Table */}
      <div className="clay-card p-4 sm:p-5 bg-white space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 bg-slate-50/70">
                <th className="py-3 px-4 rounded-l-xl">Tanggal</th>
                <th className="py-3 px-4">Keterangan Transaksi</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Sistem</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3 px-4 text-center rounded-r-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada catatan transaksi pada periode{' '}
                    {selectedMonth !== 'all' ? `${selectedMonth}/` : ''}
                    {selectedYear}.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-md">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{tx.description}</span>
                        {tx.isStockExpense && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 shrink-0"
                            title="Restock Bahan Gudang"
                          >
                            <Package className="w-3 h-3" />
                            Restock Stok
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {tx.category}
                      </span>
                    </td>
                    {/* Kolom Sistem Pengeluaran */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {tx.type === 'Kerugian' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300" title="Stok kadaluwarsa dikeluarkan otomatis dari gudang">
                          <Trash2 className="w-3 h-3 text-amber-600" />
                          Otomatis (Gudang)
                        </span>
                      ) : tx.type === 'Pengeluaran' ? (
                        tx.isRecurringAuto ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200" title="Terpotong otomatis setiap awal bulan tanggal 2">
                            <CalendarClock className="w-3 h-3" />
                            Otomatis (Tgl 2)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200" title="Ditambahkan manual oleh owner sesuai kebutuhan">
                            <UserCheck className="w-3 h-3" />
                            Manual (Owner)
                          </span>
                        )
                      ) : tx.id.startsWith('pos-') ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Sparkles className="w-3 h-3" />
                          Laporan POS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          <Wallet className="w-3 h-3" />
                          Modal Manual
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          tx.type === 'Pemasukan'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.type === 'Kerugian'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.type === 'Pemasukan' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-extrabold whitespace-nowrap ${
                        tx.type === 'Pemasukan' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'Pemasukan' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {tx.isWriteOff ? (
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleDelete(tx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Batalkan pengeluaran stok ini & kembalikan fisik ke gudang"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </button>
                        </div>
                      ) : tx.isEditable || tx.isStockExpense ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(tx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Transaksi"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">
                          Laporan POS
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info & Back to Top Anchor */}
        <div className="p-4 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500 bg-white">
          <span>
            Menampilkan <strong>{filteredTransactions.length}</strong> catatan arus kas
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

      {/* Modal Catat / Edit Transaksi Operasional Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="clay-card bg-white w-full max-w-md max-h-[90vh] my-auto flex flex-col overflow-hidden relative shadow-2xl rounded-3xl animate-in fade-in zoom-in duration-200">
            {/* Header Sticky */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0 z-20 sticky top-0">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingId ? 'Edit Catatan Pengeluaran' : 'Catat Pengeluaran Manual'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              <div>
                <CustomDatePicker
                  label="Tanggal Transaksi *"
                  required
                  value={form.date}
                  onChange={(d) => setForm({ ...form, date: d })}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Keterangan Pengeluaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Servis Mesin / Penggantian Lampu / Biaya Kebersihan"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="clay-input py-2 text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Kategori
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="clay-input py-2 text-xs w-full cursor-pointer"
                  >
                    {editingId && form.category === 'Bahan Baku' && (
                      <option value="Bahan Baku">Bahan Baku</option>
                    )}
                    <option value="Perawatan Alat">Perawatan Alat (Manual)</option>
                    <option value="Dana Darurat">Dana Darurat</option>
                    <option value="Setoran Akhir">Setoran Akhir</option>
                    <option value="Utilitas">Utilitas</option>
                    <option value="Transportasi">Transportasi</option>
                    <option value="Gaji Karyawan">Gaji Karyawan</option>
                    <option value="Lainnya">Lainnya (Manual)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Jenis
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="clay-input py-2 text-xs w-full cursor-pointer"
                  >
                    <option value="Pengeluaran">Pengeluaran</option>
                    <option value="Pemasukan">Pemasukan (Modal/Lainnya)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Nominal (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Contoh: 500000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="clay-input py-2 text-xs w-full"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary w-full !py-2.5 text-xs font-bold shadow-md cursor-pointer"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OwnerRiwayatArusKasPage;
