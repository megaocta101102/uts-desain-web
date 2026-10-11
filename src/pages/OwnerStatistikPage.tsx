import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  Banknote,
  QrCode,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { Order, MenuItem } from '../types';
import { db } from '../services/supabase';
import { formatCurrency } from '../services/config';

type TimeRangeFilter = 'today' | 'this_week' | 'this_month' | 'this_year' | 'by_year' | 'all';

export const OwnerStatistikPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter States
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    async function loadStats() {
      try {
        const [orderList, menuList] = await Promise.all([
          db.getOrders(),
          db.getMenus(),
        ]);
        setOrders(orderList);
        setMenus(menuList);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  // Available Years from data
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<string>([currentYear.toString(), (currentYear - 1).toString(), (currentYear - 2).toString()]);
    orders.forEach((o) => {
      if (o.created_at) {
        const y = new Date(o.created_at).getFullYear().toString();
        yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [orders]);

  // Helper date calculation
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // Filtered Orders by Time Range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const thisMonthStr = now.toISOString().slice(0, 7);
    const thisYearStr = now.getFullYear().toString();
    const startOfWeek = getStartOfWeek(now);

    return orders.filter((o) => {
      if (!o.created_at) return false;
      const orderDate = new Date(o.created_at);
      const orderDateIso = orderDate.toISOString();

      if (timeRange === 'today') {
        return orderDateIso.startsWith(todayStr);
      }
      if (timeRange === 'this_week') {
        return orderDate >= startOfWeek && orderDate <= now;
      }
      if (timeRange === 'this_month') {
        return orderDateIso.startsWith(thisMonthStr);
      }
      if (timeRange === 'this_year') {
        return orderDateIso.startsWith(thisYearStr);
      }
      if (timeRange === 'by_year') {
        return orderDate.getFullYear().toString() === selectedYear;
      }
      return true; // 'all'
    });
  }, [orders, timeRange, selectedYear]);

  // Key Metrics
  const totalRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status !== 'dibatalkan')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  }, [filteredOrders]);

  const totalOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => o.status !== 'dibatalkan').length;
  }, [filteredOrders]);

  const avgOrderValue = useMemo(() => {
    return totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  }, [totalRevenue, totalOrdersCount]);

  // Metric Today
  const todayRevenue = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return orders
      .filter((o) => o.status !== 'dibatalkan' && new Date(o.created_at).toISOString().startsWith(todayStr))
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  }, [orders]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let qris = 0;
    filteredOrders.forEach((o) => {
      if (o.status !== 'dibatalkan') {
        if (o.payment_method === 'cash') cash += o.total_amount;
        else qris += o.total_amount;
      }
    });
    return { cash, qris, total: cash + qris || 1 };
  }, [filteredOrders]);

  // Top Selling Items
  const topSelling = useMemo(() => {
    const itemMap: Record<string, { name: string; count: number; revenue: number }> = {};
    filteredOrders.forEach((o) => {
      if (o.status !== 'dibatalkan' && o.items) {
        o.items.forEach((it) => {
          const key = it.menu_name || 'Item';
          if (!itemMap[key]) {
            itemMap[key] = { name: key, count: 0, revenue: 0 };
          }
          itemMap[key].count += it.quantity || 1;
          itemMap[key].revenue += it.subtotal || 0;
        });
      }
    });
    return Object.values(itemMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredOrders]);

  const getFilterLabel = () => {
    if (timeRange === 'today') return 'Hari Ini';
    if (timeRange === 'this_week') return 'Minggu Ini';
    if (timeRange === 'this_month') return 'Bulan Ini';
    if (timeRange === 'this_year') return 'Tahun Ini';
    if (timeRange === 'by_year') return `Tahun ${selectedYear}`;
    return 'Semua Periode';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header & Time Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Statistik Penjualan <span className="text-blue-600">Meo Cafe</span>
          </h1>
        </div>

        {/* Filter Toolbar: Hari Ini, Minggu Ini, Bulan Ini, Tahun Ini, Pilih Tahun, Semua */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeRange === 'today'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Hari Ini
          </button>
          
          <button
            onClick={() => setTimeRange('this_week')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeRange === 'this_week'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Minggu Ini
          </button>

          <button
            onClick={() => setTimeRange('this_month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeRange === 'this_month'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Bulan Ini
          </button>

          <button
            onClick={() => setTimeRange('this_year')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeRange === 'this_year'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Tahun Ini
          </button>

          {/* By Specific Year Dropdown Filter */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
            <select
              value={timeRange === 'by_year' ? selectedYear : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedYear(e.target.value);
                  setTimeRange('by_year');
                }
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                timeRange === 'by_year'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <option value="" disabled>Pilih Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="text-slate-900 bg-white">
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setTimeRange('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeRange === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Bento KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Omzet Terfilter */}
        <div className="clay-card p-6 bg-white flex flex-col justify-between border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pendapatan
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {formatCurrency(totalRevenue)}
            </h3>
            <span className="text-xs text-slate-500 mt-1 block">
              Periode: {getFilterLabel()}
            </span>
          </div>
        </div>

        {/* Card 2: Omzet Hari Ini */}
        <div className="clay-card p-6 bg-white flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pendapatan Hari Ini
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
              {formatCurrency(todayRevenue)}
            </h3>
            <span className="text-xs text-slate-500 mt-1 block">
              Penjualan realtime kasir
            </span>
          </div>
        </div>

        {/* Card 3: Total Transaksi */}
        <div className="clay-card p-6 bg-white flex flex-col justify-between border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Transaksi
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalOrdersCount} <span className="text-sm font-normal text-slate-500">pesanan</span>
            </h3>
            <span className="text-xs text-slate-500 mt-1 block">
              Periode: {getFilterLabel()}
            </span>
          </div>
        </div>

        {/* Card 4: Rata-Rata Transaksi */}
        <div className="clay-card p-6 bg-white flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rata-rata Order
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {formatCurrency(avgOrderValue)}
            </h3>
            <span className="text-xs text-slate-500 mt-1 block">
              Nilai belanja per transaksi
            </span>
          </div>
        </div>
      </div>

      {/* Middle Analytics Section (Top Selling & Payment Channels) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Selling Menus */}
        <div className="lg:col-span-7 clay-card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base font-sans">
              🏆 Top 5 Menu Terlaris ({getFilterLabel()})
            </h3>
            <span className="text-xs text-slate-400">Berdasarkan porsi terjual</span>
          </div>

          {topSelling.length === 0 ? (
            <p className="text-center text-slate-400 py-10 text-xs">Belum ada pesanan pada periode ini</p>
          ) : (
            <div className="space-y-3">
              {topSelling.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">{it.name}</h4>
                      <span className="text-[11px] text-slate-500">Terjual {it.count} porsi</span>
                    </div>
                  </div>

                  <span className="font-extrabold text-blue-600 text-xs sm:text-sm">
                    {formatCurrency(it.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Method Ratio */}
        <div className="lg:col-span-5 clay-card p-6 bg-white space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base font-sans">
                💳 Saluran Pembayaran ({getFilterLabel()})
              </h3>
              <span className="text-xs text-slate-400">Tunai vs Non-Tunai</span>
            </div>

            <div className="space-y-4 mt-4">
              {/* Cash Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Tunai (Cash)
                  </span>
                  <span className="text-slate-900">{formatCurrency(paymentBreakdown.cash)}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((paymentBreakdown.cash / paymentBreakdown.total) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* QRIS Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    QRIS / Digital
                  </span>
                  <span className="text-slate-900">{formatCurrency(paymentBreakdown.qris)}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((paymentBreakdown.qris / paymentBreakdown.total) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900">
            Total penerimaan periode ini: <strong>{formatCurrency(totalRevenue)}</strong>
          </div>
        </div>
      </div>

      {/* Card Navigasi ke Halaman Lengkap Transaksi Kasir */}
      <div className="clay-card p-6 bg-white border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base font-sans">
              Daftar Riwayat Transaksi Kasir
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola dan periksa seluruh pembukuan order pelanggan secara detail, filter periode, pencarian waktu, hingga unduh laporan CSV.
            </p>
          </div>
        </div>

        <Link
          to="/owner/transaksi"
          className="clay-btn clay-btn-primary !py-2.5 !px-5 text-xs font-semibold flex items-center justify-center gap-2 shrink-0 shadow-md"
        >
          <span>Lihat Semua Transaksi Kasir</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default OwnerStatistikPage;
