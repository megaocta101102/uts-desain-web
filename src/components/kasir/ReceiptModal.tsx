import React from 'react';
import { Printer, CheckCircle, X, Download } from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency, DEFAULT_CONFIG } from '../../services/config';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('id-ID');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-300" />
            <span className="font-bold text-base">Pembayaran Berhasil!</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content (Thermal Paper Layout) */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <div
            id="printable-receipt"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm font-mono text-xs text-slate-800 space-y-3"
          >
            {/* Cafe Info */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h2 className="text-base font-bold tracking-wider uppercase font-sans text-slate-900">
                {DEFAULT_CONFIG.CAFE_NAME}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{DEFAULT_CONFIG.CAFE_ADDRESS}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Owner: {DEFAULT_CONFIG.OWNER_NAME}</p>
            </div>

            {/* Order Meta */}
            <div className="space-y-1 text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-bold text-slate-900">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-semibold text-slate-900">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipe / Meja:</span>
                <span className="capitalize">
                  {order.order_type === 'dine_in' ? `Dine In (Meja ${order.table_number})` : 'Take Away'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{order.cashier_name}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-slate-900 font-semibold">
                    <span>{item?.quantity || 1}x {item?.menu_name || 'Item'}</span>
                    <span>{formatCurrency(item?.subtotal || 0)}</span>
                  </div>
                  {item?.toppings && item.toppings.length > 0 && (
                    <div className="text-[10px] text-slate-500 pl-3">
                      + {item.toppings.map((t) => t?.name || '').filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pajak Resto (10%):</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                <span>TOTAL AKHIR:</span>
                <span className="text-blue-600">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

            {/* Payment & Change */}
            <div className="space-y-1 text-[11px] text-slate-700">
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span className="font-bold uppercase text-slate-900">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span>Jumlah Bayar:</span>
                <span>{formatCurrency(order.amount_paid)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Kembalian:</span>
                <span>{formatCurrency(order.change_amount)}</span>
              </div>
            </div>

            {/* Footer Message */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
              <p>Terima kasih atas kunjungan Anda!</p>
              <p className="mt-0.5">Nikmati momen santai Anda di Meo Cafe.</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 font-semibold text-sm transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="clay-btn clay-btn-primary !py-2.5 !px-5 text-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
