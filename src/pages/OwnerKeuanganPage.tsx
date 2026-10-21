import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  FileSpreadsheet,
  ArrowRight,
  Truck,
  Users,
  Zap,
  ShieldAlert,
  Wrench,
  Info,
  CalendarClock,
  UserCheck,
  Trash2
} from 'lucide-react';
import { Order, User } from '../types';
import { db, isRealCashierOrder } from '../services/supabase';
import { formatCurrency } from '../services/config';
import {
  getSavedTransactions,
  saveTransactions,
  generateAutoRecurringExpenses,
  TransactionRecord
} from '../services/financeService';
import { inventoryService } from '../services/inventoryService';

interface BudgetCategory {
  id: string;
  name: string;
  estimated: number;
  actual: number;
  icon: string;
  systemTag: string;
  isAuto: boolean;
}

export const OwnerKeuanganPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Periode Filter: Default ke Bulan Berjalan (Oktober 2026)
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState('10'); // '09', '10', etc.

  const selectedPeriod = `${selectedYear}-${selectedMonthIndex}`;

  // State transaksi manual & otomatis (arus kas)
  const [manualTransactions, setManualTransactions] = useState<TransactionRecord[]>(() => {
    return getSavedTransactions();
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [orderList, userList] = await Promise.all([
          db.getOrders(),
          db.getUsers(),
        ]);
        setOrders(orderList);
        setUsers(userList);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    const handleUpdate = () => {
      setManualTransactions(getSavedTransactions());
    };
    window.addEventListener('meo_cafe_tx_updated', handleUpdate);
    window.addEventListener('meo_cafe_stock_updated', handleUpdate);
    return () => {
      window.removeEventListener('meo_cafe_tx_updated', handleUpdate);
      window.removeEventListener('meo_cafe_stock_updated', handleUpdate);
    };
  }, []);

  // Hitung jumlah Staf KASIR aktif (hanya kasir saja, owner tidak dihitung di gaji karyawan)
  const activeKasirCount = useMemo(() => {
    const kasirUsers = users.filter((u) => u.role === 'kasir' && u.status !== 'nonaktif');
    return kasirUsers.length > 0 ? kasirUsers.length : 6;
  }, [users]);

  // Aturan Gaji Kasir:
  // - September: Belum digaji (awal beroperasi) -> 0 kasir (Rp 0)
  // - Oktober: Digaji 2 kasir lama Cindy & Lulu (Rp 8.000.000). Kasir baru di bulan pertama belum digaji.
  // - November dan seterusnya: Kasir baru mulai digaji penuh bersama kasir lama (full kasir aktif)
  const eligibleKasirCount = useMemo(() => {
    if (selectedPeriod <= '2026-09') return 0;
    if (selectedPeriod === '2026-10') return 2;
    return activeKasirCount;
  }, [selectedPeriod, activeKasirCount]);

  const kasirSalaryForPeriod = eligibleKasirCount * 4000000;

  // Estimasi Biaya Pembelian Bahan Baku dihitung otomatis dari estimasi kebutuhan stok komoditas
  const estimatedMaterialExpense = useMemo(() => {
    const stocks = inventoryService.calculateStockWithOrders(orders, selectedPeriod);
    const sum = stocks.reduce((total, mat) => total + (mat.monthlyEstimatedNeed * mat.costPerUnit), 0);
    return sum > 0 ? sum : 37291000;
  }, [orders, selectedPeriod]);

  // Pengeluaran aktual berdasarkan transaksi yang tercatat di periode terpilih
  // Jika periode adalah bulan ke depannya (> 2026-10) dan belum ada transaksi otomatis tersimpan,
  // sertakan 4 pengeluaran wajib otomatis tgl 2
  const expensesForSelectedPeriod = useMemo(() => {
    const periodTxs = manualTransactions.filter(
      (tx) => tx.type === 'Pengeluaran' && tx.date.startsWith(selectedPeriod)
    );

    // Pengeluaran operasional (tanpa setoran akhir karena setoran akhir memotong saldo yang diteruskan ke bulan berikutnya)
    const operationalTxs = periodTxs.filter((tx) => {
      const cat = (tx.category || '').toLowerCase();
      const desc = (tx.description || '').toLowerCase();
      if (cat.includes('modal') || desc.includes('modal')) return true;
      const isSetoran = cat.includes('setoran') || desc.includes('setoran') || desc.includes('potongan');
      return !isSetoran;
    });

    if (selectedPeriod > '2026-10') {
      const hasAutoSalary = operationalTxs.some(t => t.category === 'Gaji Karyawan' && t.isRecurringAuto);
      if (!hasAutoSalary) {
        const autoRecurring = generateAutoRecurringExpenses(selectedPeriod, activeKasirCount);
        return [...operationalTxs, ...autoRecurring];
      }
    }

    return operationalTxs;
  }, [manualTransactions, selectedPeriod, activeKasirCount]);

  // Total biaya belanja bahan baku aktual di bulan terpilih (manual oleh owner)
  const actualMaterialExpense = useMemo(() => {
    return expensesForSelectedPeriod
      .filter((tx) => tx.category === 'Bahan Baku')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [expensesForSelectedPeriod]);

  const actualSalaryExpense = useMemo(() => {
    return expensesForSelectedPeriod
      .filter((tx) => tx.category === 'Gaji Karyawan')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [expensesForSelectedPeriod]);

  const actualUtilityExpense = useMemo(() => {
    return expensesForSelectedPeriod
      .filter((tx) => tx.category === 'Utilitas')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [expensesForSelectedPeriod]);

  const actualTransportExpense = useMemo(() => {
    return expensesForSelectedPeriod
      .filter((tx) => tx.category === 'Transportasi')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [expensesForSelectedPeriod]);

  const actualServiceExpense = useMemo(() => {
    return expensesForSelectedPeriod
      .filter((tx) => tx.category === 'Perawatan Alat')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [expensesForSelectedPeriod]);

  const actualEmergencyExpense = useMemo(() => {
    return expensesForSelectedPeriod
      .filter((tx) => tx.category === 'Dana Darurat')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [expensesForSelectedPeriod]);

  const actualOtherExpense = useMemo(() => {
    return expensesForSelectedPeriod
      .filter((tx) => !['Bahan Baku', 'Gaji Karyawan', 'Utilitas', 'Transportasi', 'Perawatan Alat', 'Dana Darurat'].includes(tx.category))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [expensesForSelectedPeriod]);

  // Perencanaan Anggaran & Estimasi Biaya Bulanan
  // Sesuai sistem yang ditetapkan:
  // - Rutin Wajib Otomatis (Tgl 2): Gaji Karyawan, Utilitas, Perawatan Rutin Wajib Rp 200.000, Transportasi
  // - Manual oleh Owner: Pembelian Bahan Baku (Restock), Perawatan Non-Wajib di luar 200rb, Dana Darurat, Lainnya
  const budgets: BudgetCategory[] = useMemo(() => [
    { 
      id: 'bud-1', 
      name: 'Pembelian Bahan Baku (Logistik)', 
      estimated: estimatedMaterialExpense, 
      actual: actualMaterialExpense || (selectedPeriod === '2026-09' ? 37291000 : (selectedPeriod === '2026-10' ? 19514500 : 0)), 
      icon: 'Package',
      systemTag: 'Manual Sesuai Kebutuhan',
      isAuto: false,
    },
    { 
      id: 'bud-2', 
      name: selectedPeriod <= '2026-09' 
        ? 'Gaji Karyawan' 
        : `Gaji Karyawan (${eligibleKasirCount} Kasir, Terpotong Tgl 2)`, 
      estimated: kasirSalaryForPeriod, 
      actual: selectedPeriod <= '2026-09' 
        ? 0 
        : (actualSalaryExpense > 0 ? actualSalaryExpense : kasirSalaryForPeriod), 
      icon: 'Users',
      systemTag: 'Otomatis Tgl 2',
      isAuto: true,
    },
    { 
      id: 'bud-3', 
      name: 'Listrik, Air & WiFi (Utilitas)', 
      estimated: 1500000, 
      actual: actualUtilityExpense || (selectedPeriod === '2026-09' ? 1450000 : 1400000), 
      icon: 'Zap',
      systemTag: 'Otomatis Tgl 2',
      isAuto: true,
    },
    { 
      id: 'bud-4', 
      name: 'Transportasi & Logistik Pengadaan', 
      estimated: 1000000, 
      actual: actualTransportExpense || 1000000, 
      icon: 'Truck',
      systemTag: 'Otomatis Tgl 2',
      isAuto: true,
    },
    { 
      id: 'bud-5', 
      name: 'Perawatan Alat', 
      estimated: 10000000, 
      actual: actualServiceExpense || (selectedPeriod === '2026-09' ? 427100 : 200000), 
      icon: 'Wrench',
      systemTag: 'Perawatan Alat',
      isAuto: true,
    },
    { 
      id: 'bud-6', 
      name: 'Dana Darurat & Cadangan', 
      estimated: 100000000, 
      actual: actualEmergencyExpense || 0, 
      icon: 'ShieldAlert',
      systemTag: 'Manual oleh Owner',
      isAuto: false,
    },
    ...(actualOtherExpense > 0 ? [{
      id: 'bud-7',
      name: 'Pengeluaran Lainnya (Manual)',
      estimated: Math.max(actualOtherExpense, 5000000),
      actual: actualOtherExpense,
      icon: 'ShieldAlert',
      systemTag: 'Manual oleh Owner',
      isAuto: false,
    }] : []),
  ], [activeKasirCount, eligibleKasirCount, kasirSalaryForPeriod, estimatedMaterialExpense, actualMaterialExpense, actualSalaryExpense, actualUtilityExpense, actualTransportExpense, actualServiceExpense, actualEmergencyExpense, actualOtherExpense, selectedPeriod]);

  // Pemasukan dari Pesanan POS pada periode terpilih
  const periodPosIncome = useMemo(() => {
    if (selectedPeriod === '2026-09') return 180000000;
    if (selectedPeriod === '2026-10') return 150000000;
    const calculated = orders
      .filter((o) => o.status !== 'dibatalkan' && o.created_at && o.created_at.startsWith(selectedPeriod) && isRealCashierOrder(o))
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    return calculated;
  }, [orders, selectedPeriod]);

  // Modal / Pemasukan manual di bulan terpilih (misal modal awal September)
  const periodManualIncome = useMemo(() => {
    return manualTransactions
      .filter((tx) => tx.type === 'Pemasukan' && tx.date.startsWith(selectedPeriod))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [manualTransactions, selectedPeriod]);

  // Total Pengeluaran Aktual periode terpilih
  const totalExpenses = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.actual, 0);
  }, [budgets]);

  // Total Estimasi Budget
  const totalEstimatedBudget = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.estimated, 0);
  }, [budgets]);

  // Perhitungan akumulasi keuangan berjalan dari bulan ke bulan
  // September 2026: Saldo awal = 0, Pemasukan = Modal Awal (Rp 190.000.000) + Penjualan POS (Rp 180.000.000)
  // Oktober 2026: Pemasukan Akumulasi = Saldo bulan sebelumnya (setelah dipotong setoran akhir bulan lalu) + Pendapatan Penjualan POS (Rp 150.000.000)
  // Bulan-bulan berikutnya: Saldo bulan sebelumnya + Pemasukan bulan berjalan
  const monthlyRollData = useMemo(() => {
    const [selYearStr, selMonthStr] = selectedPeriod.split('-');
    const selYear = Number(selYearStr);
    const selMonth = Number(selMonthStr);

    let curYear = 2026;
    let curMonth = 9;
    let runningBalance = 0;
    let prevBalForCurrentPeriod = 0;
    let accumIncomeForCurrentPeriod = 0;
    let currentPeriodCashBalance = 0;

    while (curYear < selYear || (curYear === selYear && curMonth <= selMonth)) {
      const pStr = `${curYear}-${String(curMonth).padStart(2, '0')}`;
      
      let posInc = 0;
      if (pStr === '2026-09') {
        posInc = 180000000;
      } else if (pStr === '2026-10') {
        posInc = 150000000;
      } else {
        posInc = orders
          .filter((o) => o.status !== 'dibatalkan' && o.created_at && o.created_at.startsWith(pStr) && isRealCashierOrder(o))
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      }

      const manualInc = manualTransactions
        .filter((tx) => tx.type === 'Pemasukan' && tx.date.startsWith(pStr))
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

      // Potongan Setoran Akhir bulan ini (diinput owner sebagai setoran akhir / potongan setoran)
      const setoranAkhirBulanIni = manualTransactions
        .filter((tx) => {
          if (!tx.date.startsWith(pStr)) return false;
          const cat = (tx.category || '').toLowerCase();
          const desc = (tx.description || '').toLowerCase();
          if (cat.includes('modal') || desc.includes('modal')) return false;
          return cat.includes('setoran') || desc.includes('setoran') || desc.includes('potongan');
        })
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

      let periodTxs = manualTransactions.filter(
        (tx) => tx.type === 'Pengeluaran' && tx.date.startsWith(pStr)
      );

      // Pengeluaran operasional (tanpa setoran akhir karena memotong saldo yang diteruskan)
      const operationalTxs = periodTxs.filter((tx) => {
        const cat = (tx.category || '').toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        if (cat.includes('modal') || desc.includes('modal')) return true;
        const isSetoran = cat.includes('setoran') || desc.includes('setoran') || desc.includes('potongan');
        return !isSetoran;
      });

      if (pStr > '2026-10') {
        const hasAutoSalary = operationalTxs.some((t) => t.category === 'Gaji Karyawan' && t.isRecurringAuto);
        if (!hasAutoSalary) {
          const autoRecurring = generateAutoRecurringExpenses(pStr, activeKasirCount);
          operationalTxs.push(...autoRecurring);
        }
      }

      const exp = operationalTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

      if (pStr === '2026-09') {
        const sepIncome = manualInc > 0 ? (posInc + manualInc) : (posInc + 190000000);
        const endBal = sepIncome - exp;
        const balanceAfterSetoran = endBal - setoranAkhirBulanIni;
        runningBalance = balanceAfterSetoran;
        if (pStr === selectedPeriod) {
          prevBalForCurrentPeriod = 0;
          accumIncomeForCurrentPeriod = sepIncome;
          currentPeriodCashBalance = balanceAfterSetoran;
        }
      } else {
        const monthIncome = posInc + manualInc;
        // Pemasukan akumulasi = Saldo bulan sebelumnya (setelah dipotong setoran akhir bulan lalu) + Pendapatan penjualan bulan saat itu
        const accumInc = runningBalance + monthIncome;
        const endBal = accumInc - exp;
        const balanceAfterSetoran = endBal - setoranAkhirBulanIni;
        if (pStr === selectedPeriod) {
          prevBalForCurrentPeriod = runningBalance;
          accumIncomeForCurrentPeriod = accumInc;
          currentPeriodCashBalance = balanceAfterSetoran;
        }
        runningBalance = balanceAfterSetoran;
      }

      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }

    return {
      prevMonthBalance: prevBalForCurrentPeriod,
      totalIncomeDisplay: accumIncomeForCurrentPeriod,
      cashBalance: currentPeriodCashBalance,
    };
  }, [orders, manualTransactions, selectedPeriod]);

  const totalIncomeDisplay = monthlyRollData.totalIncomeDisplay;
  const cashBalance = monthlyRollData.cashBalance;

  // Kerugian Stok Kadaluwarsa pada Periode Terpilih (Pencatatan kerugian barang, tidak memotong kas lagi)
  const expiredStockLoss = useMemo(() => {
    const writeOffs = inventoryService.getExpiredWriteOffs();
    return writeOffs
      .filter((w) => w.period === selectedPeriod || (w.date && w.date.startsWith(selectedPeriod)))
      .reduce((sum, w) => sum + w.totalLoss, 0);
  }, [selectedPeriod]);

  // Daftar Pilihan Tahun: 2026 s/d 2035 (10 tahun ke depan)
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

  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonthIndex)?.label || 'Bulan';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Filter Periode */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Manajemen Operasional & Keuangan <span className="text-blue-600">F&B</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dropdown Filter Periode Bulan & Tahun (2026 - 2035) */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-600">Periode:</span>
            
            <select
              value={selectedMonthIndex}
              onChange={(e) => setSelectedMonthIndex(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent border-none focus:outline-none cursor-pointer border-l border-slate-200 pl-2"
            >
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <Link
            to="/owner/keuangan/riwayat"
            className="clay-btn clay-btn-primary !py-2.5 !px-4 text-xs font-semibold flex items-center gap-2 shadow-md shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Riwayat Arus Kas</span>
          </Link>
        </div>
      </div>

      {/* 1. Ringkasan Keuangan Bulanan (5 Bento Cards Berjejer 1 Baris) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* Card 1: Estimasi Kebutuhan Dana */}
        <div className="clay-card p-4 sm:p-4.5 bg-white flex flex-col justify-between border-l-4 border-l-amber-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Estimasi Budget Bulan Ini
            </span>
            <div className="w-8.5 h-8.5 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6 sm:mt-6.5">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight" title={formatCurrency(totalEstimatedBudget)}>
              {formatCurrency(totalEstimatedBudget)}
            </h3>
          </div>
        </div>

        {/* Card 2: Pengeluaran Aktual */}
        <div className="clay-card p-4 sm:p-4.5 bg-white flex flex-col justify-between border-l-4 border-l-rose-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pengeluaran Aktual
            </span>
            <div className="w-8.5 h-8.5 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6 sm:mt-6.5">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight" title={formatCurrency(totalExpenses)}>
              {formatCurrency(totalExpenses)}
            </h3>
          </div>
        </div>

        {/* Card 3: Pemasukan Aktual (Akumulasi) */}
        <div className="clay-card p-4 sm:p-4.5 bg-white flex flex-col justify-between border-l-4 border-l-emerald-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pemasukan (Akumulasi)
            </span>
            <div className="w-8.5 h-8.5 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6 sm:mt-6.5">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight" title={formatCurrency(totalIncomeDisplay)}>
              {formatCurrency(totalIncomeDisplay)}
            </h3>
          </div>
        </div>

        {/* Card 4: Total Kerugian (Samping Kiri Saldo Kas Berjalan) */}
        <div className="clay-card p-4 sm:p-4.5 bg-white flex flex-col justify-between border-l-4 border-l-rose-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Kerugian
            </span>
            <div className="w-8.5 h-8.5 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6 sm:mt-6.5">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight" title={formatCurrency(expiredStockLoss)}>
              {formatCurrency(expiredStockLoss)}
            </h3>
          </div>
        </div>

        {/* Card 5: Saldo Kas Berjalan */}
        <div className="clay-card p-4 sm:p-4.5 bg-white flex flex-col justify-between border-l-4 border-l-blue-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Saldo Kas Berjalan
            </span>
            <div className="w-8.5 h-8.5 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6 sm:mt-6.5">
            <h3 className={`text-lg sm:text-xl font-extrabold tracking-tight ${cashBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`} title={formatCurrency(cashBalance)}>
              {formatCurrency(cashBalance)}
            </h3>
          </div>
        </div>

      </div>

      {/* Navigation Card to Dedicated Stok & Kedaluwarsa Page */}
      <div className="clay-card p-5 bg-white border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-normal text-slate-800 text-xs sm:text-sm font-sans">
              Manajemen Stok Gudang & Tanggal Kedaluwarsa (FEFO)
            </h3>
          </div>
        </div>

        <Link
          to="/owner/stok"
          className="clay-btn clay-btn-primary !py-2 !px-4 text-xs font-semibold flex items-center justify-center gap-2 shrink-0 shadow-sm"
        >
          <span>Kelola Stok Gudang</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2. Perencanaan Biaya Bulanan (Budget vs Realisasi) */}
      <div className="clay-card p-6 bg-white space-y-5">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-sans flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              Perencanaan Anggaran & Estimasi Biaya Bulanan ({selectedMonthLabel} {selectedYear})
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((bud) => {
            const isOver = bud.actual > bud.estimated;
            const pct = bud.estimated > 0 ? Math.round((bud.actual / bud.estimated) * 100) : 0;
            const barWidth = Math.min(100, Math.max(0, pct));
            return (
              <div key={bud.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">{bud.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${isOver ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {pct}% Terpakai
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-200/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Realisasi:</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(bud.actual)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Estimasi Budget:</span>
                    <span className="font-semibold text-slate-600">{formatCurrency(bud.estimated)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-blue-600'}`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default OwnerKeuanganPage;
