import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Download,
  Calendar,
  Banknote,
  QrCode,
  ArrowUp,
  ArrowLeft,
  Receipt,
  RefreshCw,
  ShoppingBag,
  UserCheck,
  X,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Order } from '../types';
import { db, isRealCashierOrder } from '../services/supabase';
import { formatCurrency } from '../services/config';
import { ReceiptModal } from '../components/kasir/ReceiptModal';

export const OwnerTransaksiPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Kalender Filter State: '' (tampilkan semua transaksi) atau 'YYYY-MM-DD'
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar Popover State & Navigation
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [yearInput, setYearInput] = useState(() => String(new Date().getFullYear()));

  // Sinkronisasi yearInput ketika viewYear berubah
  useEffect(() => {
    setYearInput(String(viewYear));
  }, [viewYear]);

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setYearInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
      setViewYear(parsed);
    }
  };

  const handleYearInputBlur = () => {
    const parsed = parseInt(yearInput, 10);
    if (!isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
      setViewYear(parsed);
      setYearInput(String(parsed));
    } else {
      setYearInput(String(viewYear));
    }
  };

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const handleOpenCalendar = () => {
    if (selectedDate) {
      const [y, m] = selectedDate.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    } else {
      const current = new Date();
      setViewYear(current.getFullYear());
      setViewMonth(current.getMonth());
    }
    setIsCalendarOpen((prev) => !prev);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    setSelectedDate(`${viewYear}-${mStr}-${dStr}`);
    setSearchQuery('');
    setIsCalendarOpen(false);
  };

  // Nama Bulan & Hari dalam Bahasa Indonesia
  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Receipt Modal State
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const orderList = await db.getOrders();
      setOrders(orderList);
    } catch (err) {
      console.error('Gagal memuat transaksi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Format Helper: date string YYYY-MM-DD from order created_at (local time)
  const getOrderLocalDateStr = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper date formatted Indonesian
  const formatIndonesianDate = (ymd: string) => {
    if (!ymd) return '';
    const [year, month, day] = ymd.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Filtered orders:
  // 1. Tampilan awal: semua transaksi terbaru dari atas
  // 2. Jika tanggal di kalender dipilih: hanya transaksi tanggal tersebut
  // 3. Search bar (hanya muncul saat tanggal diklik): mencari waktu (jam/menit), no order, pelanggan, kasir, meja, menu
  const displayOrders = useMemo(() => {
    // Urutkan semua transaksi dari yang paling baru di atas
    let result = orders
      .filter(isRealCashierOrder)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Filter tanggal dari kalender jika dipilih
    if (selectedDate) {
      result = result.filter((o) => getOrderLocalDateStr(o.created_at) === selectedDate);
    }

    // Filter search query jika ada (hanya aktif saat tanggal dipilih)
    if (selectedDate && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();

      result = result.filter((o) => {
        const orderDate = new Date(o.created_at);
        const timeFormatted = orderDate
          .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          .replace(/\./g, ':');
        const hourStr = String(orderDate.getHours()).padStart(2, '0');

        const matchesOrderNum = o.order_number?.toLowerCase().includes(q);
        const matchesCustomer = o.customer_name?.toLowerCase().includes(q);
        const matchesCashier = o.cashier_name?.toLowerCase().includes(q);
        const matchesMethod = o.payment_method?.toLowerCase().includes(q);
        const matchesStatus = o.status?.toLowerCase().includes(q);
        const matchesTable =
          o.order_type === 'dine_in'
            ? `meja ${o.table_number}`.toLowerCase().includes(q)
            : 'take away'.includes(q);
        const matchesItems = o.items?.some((i) =>
          i.menu_name?.toLowerCase().includes(q)
        );
        const matchesTime = timeFormatted.includes(q) || hourStr === q || `${hourStr}:00`.includes(q);

        return (
          matchesOrderNum ||
          matchesCustomer ||
          matchesCashier ||
          matchesMethod ||
          matchesStatus ||
          matchesTable ||
          matchesItems ||
          matchesTime
        );
      });
    }

    return result;
  }, [orders, selectedDate, searchQuery]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (displayOrders.length === 0) {
      alert('Tidak ada data transaksi untuk diexport.');
      return;
    }

    const headers = [
      'No Order',
      'Waktu',
      'Pelanggan',
      'Tipe',
      'Total (Rp)',
      'Metode Bayar',
      'Kasir',
      'Status',
      'Rincian Menu'
    ];

    const rows = displayOrders.map((o) => {
      const itemsDetail = o.items
        ? o.items.map((it) => `${it.menu_name} (x${it.quantity})`).join('; ')
        : '-';
      return [
        o.order_number,
        `"${new Date(o.created_at).toLocaleString('id-ID')}"`,
        `"${o.customer_name}"`,
        o.order_type === 'dine_in' ? `Meja ${o.table_number}` : 'Take Away',
        o.total_amount,
        o.payment_method,
        `"${o.cashier_name}"`,
        o.status,
        `"${itemsDetail}"`
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateSuffix = selectedDate || 'semua_transaksi';
    link.setAttribute('download', `transaksi_kasir_${dateSuffix}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearCalendarFilter = () => {
    setSelectedDate('');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100">
          <div className="flex items-center gap-4">
            <Link
              to="/owner/statistik"
              className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors shadow-sm shrink-0"
              title="Kembali ke Statistik"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                Riwayat Transaksi Kasir
              </h1>
              <p className="text-xs text-slate-500">
                {selectedDate ? (
                  <span>
                    Menampilkan transaksi tanggal:{' '}
                    <strong className="text-blue-600">{formatIndonesianDate(selectedDate)}</strong>
                  </span>
                ) : (
                  <span>Semua riwayat transaksi kasir diurutkan dari yang terbaru</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={loadOrders}
              disabled={isLoading}
              className="clay-btn clay-btn-secondary !py-2 !px-3.5 text-xs font-semibold flex items-center gap-1.5"
              title="Refresh Data Transaksi"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>

        {/* Filter Bar: Kalender & Export CSV */}
        <div className="clay-card p-4 sm:p-5 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Fitur Filter Berupa Kalender Popover (Header Warna Biru) */}
            <div className="relative" ref={calendarRef}>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleOpenCalendar}
                  className={`clay-btn !py-2 !px-3.5 text-xs font-semibold flex items-center gap-2 transition-all ${
                    isCalendarOpen || selectedDate
                      ? 'clay-btn-primary shadow-blue-200'
                      : 'clay-btn-secondary'
                  }`}
                  title="Buka kalender untuk filter transaksi"
                >
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Pilih Kalender</span>
                </button>

                {/* Badge Tanggal yang Terpilih */}
                {selectedDate && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 animate-fade-in shadow-xs">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{formatIndonesianDate(selectedDate)}</span>
                    <button
                      type="button"
                      onClick={clearCalendarFilter}
                      className="p-0.5 rounded-full hover:bg-blue-200/80 text-blue-700 transition-colors"
                      title="Hapus filter tanggal (tampilkan semua transaksi)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tampilan Kalender Popover (Header Warna Biru) */}
              {isCalendarOpen && (
                <div className="absolute left-0 mt-2 z-50 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden animate-fade-in">
                  {/* Header Kalender Bernuansa Biru Elegan */}
                  <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-3.5 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-200 shrink-0" />
                      <span className="font-bold text-sm tracking-wide">
                        {MONTH_NAMES[viewMonth]}
                      </span>
                      <input
                        type="number"
                        min="1900"
                        max="2100"
                        value={yearInput}
                        onChange={handleYearInputChange}
                        onBlur={handleYearInputBlur}
                        onKeyDown={handleYearKeyDown}
                        className="w-16 bg-white/20 hover:bg-white/30 focus:bg-white text-white focus:text-blue-900 font-bold text-sm text-center rounded-lg px-1 py-0.5 border border-white/30 focus:border-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all cursor-text"
                        title="Klik untuk mengedit tahun"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 rounded-xl hover:bg-white/20 transition-colors text-white active:scale-95"
                        title="Bulan sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 rounded-xl hover:bg-white/20 transition-colors text-white active:scale-95"
                        title="Bulan berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Kalender Grid: Nama Hari */}
                  <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-500 pt-3 pb-1.5 px-2.5 bg-white border-b border-slate-100">
                    {DAY_NAMES.map((name, idx) => (
                      <div
                        key={name}
                        className={idx === 0 ? 'text-red-500' : 'text-slate-600'}
                      >
                        {name}
                      </div>
                    ))}
                  </div>

                  {/* Kalender Grid: Angka Tanggal */}
                  <div className="grid grid-cols-7 gap-1 p-2.5 pt-0 text-center text-xs bg-white">
                    {Array.from({ length: new Date(viewYear, viewMonth, 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-8 w-8" />
                    ))}
                    {Array.from({ length: new Date(viewYear, viewMonth + 1, 0).getDate() }).map((_, i) => {
                      const dayNumber = i + 1;
                      const mStr = String(viewMonth + 1).padStart(2, '0');
                      const dStr = String(dayNumber).padStart(2, '0');
                      const dateStr = `${viewYear}-${mStr}-${dStr}`;
                      const isSelected = dateStr === selectedDate;
                      const today = new Date();
                      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                      const isToday = dateStr === todayStr;

                      return (
                        <button
                          key={dayNumber}
                          type="button"
                          onClick={() => handleSelectDay(dayNumber)}
                          className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center font-medium transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30 scale-105'
                              : isToday
                              ? 'border-2 border-blue-600 text-blue-700 font-bold bg-blue-50'
                              : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600 active:scale-95'
                          }`}
                        >
                          {dayNumber}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer Kalender Popover */}
                  <div className="p-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500 px-3.5">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                      Biru = Dipilih
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Export CSV (Diletakkan di atas sebelum tabel transaksi) */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleExportCSV}
                className="clay-btn clay-btn-primary !py-2 !px-4 text-xs font-semibold flex items-center gap-2 shadow-sm"
                title="Unduh laporan transaksi dalam format CSV"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV ({displayOrders.length})</span>
              </button>
            </div>
          </div>

          {/* Search Bar HANYA MUNCUL saat sudah klik/pilih tanggal di kalender! */}
          {selectedDate && (
            <div className="pt-3 border-t border-slate-100 animate-fade-in space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="clay-input !pl-3.5 !pr-9 !py-2.5 text-xs w-full bg-slate-50/60 focus:bg-white"
                  autoFocus
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Mencari pada transaksi tanggal <strong>{formatIndonesianDate(selectedDate)}</strong>
                </span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-blue-600 hover:text-blue-800 underline font-semibold"
                  >
                    Reset Cari
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabel Pure Riwayat Transaksi */}
        <div className="clay-card p-4 sm:p-5 bg-white space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4">No. Order</th>
                  <th className="py-3.5 px-4">Tipe / Meja</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Kasir</th>
                  <th className="py-3.5 px-4">Rincian Menu</th>
                  <th className="py-3.5 px-4">Metode</th>
                  <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                        <span>Memuat daftar transaksi...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-slate-700">
                          {selectedDate
                            ? 'Tidak ada transaksi pada tanggal ini'
                            : 'Belum ada transaksi tersimpan'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {selectedDate
                            ? 'Coba pilih tanggal lain di kalender atau klik tombol Semua Transaksi.'
                            : 'Semua transaksi kasir akan tercatat rapi di halaman ini.'}
                        </span>
                        {selectedDate && (
                          <button
                            type="button"
                            onClick={clearCalendarFilter}
                            className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                          >
                            Tampilkan Semua Transaksi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayOrders.map((ord) => {
                    const timeFormatted = new Date(ord.created_at).toLocaleString('id-ID', {
                      dateStyle: selectedDate ? undefined : 'short',
                      timeStyle: 'short'
                    });

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Waktu */}
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{timeFormatted}</span>
                          </div>
                        </td>

                        {/* No Order */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono whitespace-nowrap">
                          {ord.order_number}
                        </td>

                        {/* Tipe / Meja */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              ord.order_type === 'dine_in'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {ord.order_type === 'dine_in' ? `Meja ${ord.table_number || '-'}` : 'Take Away'}
                          </span>
                        </td>

                        {/* Pelanggan */}
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {ord.customer_name || 'Pelanggan'}
                        </td>

                        {/* Kasir */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-medium">
                            <UserCheck className="w-3 h-3 text-blue-600" />
                            {ord.cashier_name || 'Kasir'}
                          </span>
                        </td>

                        {/* Rincian Menu */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="space-y-0.5 text-[11px] text-slate-600 line-clamp-2">
                            {ord.items && ord.items.length > 0 ? (
                              ord.items.map((item, idx) => (
                                <span key={idx} className="inline-block mr-2">
                                  {item.quantity}x {item.menu_name}
                                  {item.toppings && item.toppings.length > 0 && (
                                    <span className="text-slate-400"> (+{item.toppings.length} top)</span>
                                  )}
                                  {idx < ord.items.length - 1 ? ',' : ''}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </div>
                        </td>

                        {/* Metode */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="capitalize px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 inline-flex items-center gap-1">
                            {ord.payment_method === 'cash' ? (
                              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <QrCode className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            {ord.payment_method}
                          </span>
                        </td>

                        {/* Total Tagihan */}
                        <td className="py-3.5 px-4 font-extrabold text-blue-600 whitespace-nowrap text-right text-sm">
                          {formatCurrency(ord.total_amount)}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedOrderForReceipt(ord);
                              setIsReceiptOpen(true);
                            }}
                            className="clay-btn clay-btn-secondary !py-1.5 !px-3 text-xs font-semibold inline-flex items-center gap-1.5 hover:border-blue-300"
                            title="Lihat Struk Transaksi"
                          >
                            <Receipt className="w-3.5 h-3.5 text-blue-600" />
                            <span>Struk</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Info & Back to Top Anchor */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
            <span>
              Menampilkan <strong>{displayOrders.length}</strong> transaksi
              {selectedDate ? ` (${formatIndonesianDate(selectedDate)})` : ' (Semua)'}
            </span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline underline-offset-4 font-semibold transition-colors py-1"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Kembali ke atas</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modal Cetak / Lihat Struk */}
      {selectedOrderForReceipt && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => {
            setIsReceiptOpen(false);
            setSelectedOrderForReceipt(null);
          }}
          order={selectedOrderForReceipt}
        />
      )}
    </div>
  );
};

export default OwnerTransaksiPage;
