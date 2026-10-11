import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  Search,
  Clock,
  Calendar,
  Banknote,
  QrCode,
  RefreshCw,
  Coffee,
  UserCheck
} from 'lucide-react';
import { Order } from '../types';
import { db } from '../services/supabase';
import { formatCurrency } from '../services/config';
import { ReceiptModal } from '../components/kasir/ReceiptModal';

export const KasirRiwayatPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Receipt State for Reprinting
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Helper: check if order is from today (shift bertugas hari ini)
  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const allOrders = await db.getOrders();
      setOrders(allOrders);
    } catch (err) {
      console.error('Gagal memuat transaksi kasir:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Filter khusus transaksi hari ini (semua kasir yang bertugas shift hari ini)
  const todayOrders = useMemo(() => {
    return orders
      .filter((ord) => isToday(ord.created_at))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders]);

  // Filter pencarian
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return todayOrders;
    const q = searchQuery.toLowerCase().trim();

    return todayOrders.filter((ord) => {
      const timeStr = new Date(ord.created_at)
        .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        .replace(/\./g, ':');

      const matchesOrderNum = ord.order_number?.toLowerCase().includes(q);
      const matchesCustomer = ord.customer_name?.toLowerCase().includes(q);
      const matchesCashier = ord.cashier_name?.toLowerCase().includes(q);
      const matchesTable =
        ord.order_type === 'dine_in'
          ? `meja ${ord.table_number}`.toLowerCase().includes(q)
          : 'take away'.includes(q);
      const matchesItems = ord.items?.some((item) =>
        item.menu_name?.toLowerCase().includes(q)
      );
      const matchesTime = timeStr.includes(q);

      return (
        matchesOrderNum ||
        matchesCustomer ||
        matchesCashier ||
        matchesTable ||
        matchesItems ||
        matchesTime
      );
    });
  }, [todayOrders, searchQuery]);

  const handleOpenReceipt = (order: Order) => {
    setSelectedOrderForReceipt(order);
    setIsReceiptOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Riwayat Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <Calendar className="w-4 h-4 text-blue-600" />
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadOrders}
            disabled={isLoading}
            className="clay-btn clay-btn-secondary !py-2.5 !px-3.5 text-xs font-semibold flex items-center gap-2"
            title="Segarkan data transaksi"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
          <Link
            to="/kasir"
            className="clay-btn clay-btn-primary !py-2.5 !px-4 text-xs font-semibold flex items-center gap-2"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Buka Kasir POS</span>
          </Link>
        </div>
      </div>

      {/* Pure Search Bar Only (Dropdown Tipe & Pembayaran Telah Dihapus) */}
      <div className="clay-card p-4 bg-white space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-input !py-2.5 !pl-9 !pr-4 text-xs sm:text-sm w-full"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Counter Results & Reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Menampilkan <strong>{filteredOrders.length}</strong> transaksi
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:text-blue-800 font-semibold underline text-xs"
            >
              Hapus Pencarian
            </button>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="clay-card bg-white overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Receipt className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-slate-800">
              {searchQuery
                ? 'Tidak ada transaksi yang cocok'
                : 'Belum ada transaksi pada shift hari ini'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Coba gunakan kata kunci pencarian yang lain.'
                : 'Semua pesanan yang diselesaikan oleh kasir pada hari ini akan tercatat rapi di sini.'}
            </p>
            <div className="pt-2">
              <Link
                to="/kasir"
                className="clay-btn clay-btn-primary !py-2 !px-4 text-xs font-semibold inline-flex items-center gap-2"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Buka Kasir POS</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOrders.map((ord) => {
                  const timeFormatted = new Date(ord.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Jam */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{timeFormatted} WIB</span>
                        </div>
                      </td>

                      {/* No Order */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900 font-mono">
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

                      {/* Kasir yang bertugas memproses order */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                        <span className="inline-flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          <UserCheck className="w-3 h-3 text-blue-600" />
                          {ord.cashier_name || 'Kasir'}
                        </span>
                      </td>

                      {/* Rincian Menu */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-0.5 text-[11px] text-slate-600 line-clamp-2">
                          {ord.items?.map((item, idx) => (
                            <span key={idx} className="inline-block mr-2">
                              {item.quantity}x {item.menu_name}
                              {item.toppings && item.toppings.length > 0 && (
                                <span className="text-slate-400"> (+{item.toppings.length} top)</span>
                              )}
                              {idx < ord.items.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Metode Bayar */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="capitalize px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 inline-flex items-center gap-1">
                          {ord.payment_method === 'cash' ? (
                            <Banknote className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <QrCode className="w-3 h-3 text-blue-600" />
                          )}
                          {ord.payment_method}
                        </span>
                      </td>

                      {/* Total Tagihan */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-extrabold text-blue-600 text-sm">
                        {formatCurrency(ord.total_amount)}
                      </td>

                      {/* Aksi Cetak Struk */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleOpenReceipt(ord)}
                          className="clay-btn clay-btn-secondary !py-1.5 !px-3 text-xs font-semibold inline-flex items-center gap-1.5 hover:border-blue-300"
                          title="Cetak ulang struk transaksi"
                        >
                          <Receipt className="w-3.5 h-3.5 text-blue-600" />
                          <span>Cetak Struk</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Thermal Receipt Modal for Reprinting */}
      {selectedOrderForReceipt && (
        <ReceiptModal
          order={selectedOrderForReceipt}
          isOpen={isReceiptOpen}
          onClose={() => {
            setIsReceiptOpen(false);
            setSelectedOrderForReceipt(null);
          }}
        />
      )}
    </div>
  );
};

export default KasirRiwayatPage;
