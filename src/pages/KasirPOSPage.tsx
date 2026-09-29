import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  User,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Clock,
  History,
  AlertCircle
} from 'lucide-react';
import { MenuItem, MenuCategory, Topping, CartItem, SelectedTopping, OrderType, PaymentMethod, Order } from '../types';
import { db } from '../services/supabase';
import { formatCurrency, DEFAULT_CONFIG } from '../services/config';
import { useAuth } from '../context/AuthContext';
import { ReceiptModal } from '../components/kasir/ReceiptModal';

export const KasirPOSPage: React.FC = () => {
  const { user } = useAuth();

  // State
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Order meta
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState('1');
  const [customerName, setCustomerName] = useState('');

  // Modals
  const [toppingModalItem, setToppingModalItem] = useState<MenuItem | null>(null);
  const [modalSelectedToppings, setModalSelectedToppings] = useState<SelectedTopping[]>([]);
  const [modalNotes, setModalNotes] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  
  // Receipt State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load Initial Data
  useEffect(() => {
    async function loadData() {
      const [menuList, toppingList, orderList] = await Promise.all([
        db.getMenus(),
        db.getToppings(),
        db.getOrders(),
      ]);
      setMenus(menuList);
      setToppings(toppingList);
      setRecentOrders(orderList);
    }
    loadData();
  }, []);

  // Filtered Menus
  const filteredMenus = useMemo(() => {
    return menus.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [menus, selectedCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.itemTotal, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return Math.round((subtotal * DEFAULT_CONFIG.CAFE_TAX_PERCENT) / 100);
  }, [subtotal]);

  const totalAmount = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const changeAmount = useMemo(() => {
    const paid = Number(amountPaidInput) || 0;
    return Math.max(0, paid - totalAmount);
  }, [amountPaidInput, totalAmount]);

  // Handle Topping Selection in Modal
  const openToppingModal = (item: MenuItem) => {
    if (item.status === 'habis') return;
    setToppingModalItem(item);
    setModalSelectedToppings([]);
    setModalNotes('');
  };

  const toggleTopping = (top: Topping) => {
    setModalSelectedToppings((prev) => {
      const exists = prev.find((t) => t.id === top.id);
      if (exists) {
        return prev.filter((t) => t.id !== top.id);
      }
      return [...prev, { id: top.id, name: top.name, price: top.price }];
    });
  };

  const addCustomizedItemToCart = () => {
    if (!toppingModalItem) return;

    const toppingsTotal = modalSelectedToppings.reduce((sum, t) => sum + t.price, 0);
    const unitPrice = toppingModalItem.price + toppingsTotal;

    const newCartItem: CartItem = {
      cartItemId: `${toppingModalItem.id}-${Date.now()}`,
      menu: toppingModalItem,
      quantity: 1,
      selectedToppings: modalSelectedToppings,
      notes: modalNotes,
      itemTotal: unitPrice,
    };

    setCart((prev) => [...prev, newCartItem]);
    setToppingModalItem(null);
  };

  const quickAddToCart = (item: MenuItem) => {
    if (item.status === 'habis') return;
    
    // If has available toppings, better open modal, else quick add
    openToppingModal(item);
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const toppingTotal = item.selectedToppings.reduce((s, t) => s + t.price, 0);
            const unitPrice = item.menu.price + toppingTotal;
            return {
              ...item,
              quantity: newQty,
              itemTotal: unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Checkout & Pay
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setAmountPaidInput(totalAmount.toString());
    setIsPaymentOpen(true);
  };

  const submitOrder = async () => {
    const paid = paymentMethod === 'cash' ? Number(amountPaidInput) || totalAmount : totalAmount;
    if (paymentMethod === 'cash' && paid < totalAmount) {
      alert('Jumlah bayar tunai kurang dari total pesanan!');
      return;
    }

    const orderPayload: Partial<Order> = {
      customer_name: customerName.trim() || 'Tamu Meo Cafe',
      order_type: orderType,
      table_number: orderType === 'dine_in' ? tableNumber : '-',
      items: cart.map((c) => ({
        menu_id: c.menu.id,
        menu_name: c.menu.name,
        price: c.menu.price,
        quantity: c.quantity,
        toppings: c.selectedToppings,
        subtotal: c.itemTotal,
      })),
      subtotal,
      tax_amount: taxAmount,
      service_amount: 0,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      amount_paid: paid,
      change_amount: Math.max(0, paid - totalAmount),
      cashier_name: user?.name || 'Kasir',
      status: 'selesai',
    };

    try {
      const created = await db.createOrder(orderPayload);
      setCompletedOrder(created);
      setIsPaymentOpen(false);
      setIsReceiptOpen(true);
      setRecentOrders((prev) => [created, ...prev]);
      
      // Reset POS Form
      setCart([]);
      setCustomerName('');
    } catch (err) {
      console.error('Failed to create order', err);
      alert('Gagal memproses pesanan.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top POS Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Point of Sale (POS) <span className="text-blue-600">Meo Cafe</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola pesanan pelanggan meja atau bungkus dengan cepat dan presisi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="clay-btn clay-btn-secondary !py-2.5 !px-4 text-xs font-semibold flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            <span>Riwayat Transaksi ({recentOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid (Menu Catalog 7 Cols | Order Cart 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Menu Selector (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Controls: Search & Category */}
          <div className="clay-card p-4 space-y-4 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama kopi, mocktail, makanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="clay-input pl-11 py-2.5 text-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'minuman', label: '☕ Minuman' },
                { id: 'makanan', label: '🥐 Makanan' },
                { id: 'snack', label: '🍟 Snack' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id as MenuCategory)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === c.id
                      ? 'clay-btn-primary shadow-sm'
                      : 'clay-btn-secondary'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredMenus.map((item) => (
              <div
                key={item.id}
                onClick={() => quickAddToCart(item)}
                className={`clay-card p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 group hover:-translate-y-1 ${
                  item.status === 'habis' ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:border-blue-300'
                }`}
              >
                <div>
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/coffee_signature.jpg';
                      }}
                    />
                    {item.status === 'habis' && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">
                        Habis
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-blue-600">
                    {item.name}
                  </h4>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="font-extrabold text-blue-600 text-xs sm:text-sm">
                    {formatCurrency(item.price)}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Order Cart & Bill (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="clay-card p-5 bg-white border border-blue-100 flex flex-col sticky top-24">
            
            {/* Header / Table / Order Type */}
            <div className="border-b border-slate-100 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-slate-900 text-base font-sans">
                    Rincian Pesanan
                  </h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}
              </div>

              {/* Order Type Buttons */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setOrderType('dine_in')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    orderType === 'dine_in'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🍽️ Dine In (Makan Sini)
                </button>
                <button
                  onClick={() => setOrderType('take_away')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    orderType === 'take_away'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🛍️ Take Away (Bungkus)
                </button>
              </div>

              {/* Customer Name & Table Number */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Nama Pelanggan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Mega / Octa"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="clay-input !py-1.5 !px-3 text-xs mt-1"
                  />
                </div>
                {orderType === 'dine_in' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Nomor Meja</label>
                    <select
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="clay-input !py-1.5 !px-3 text-xs mt-1"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                        <option key={num} value={num.toString()}>
                          Meja {num}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="py-4 space-y-3 max-h-[360px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <ShoppingCart className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-xs font-medium">Keranjang masih kosong</p>
                  <p className="text-[11px]">Klik item menu di sebelah kiri untuk menambahkan pesanan.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                          {item.menu.name}
                        </h4>
                        <span className="text-xs text-blue-600 font-semibold">
                          {formatCurrency(item.menu.price)}
                        </span>
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        {formatCurrency(item.itemTotal)}
                      </span>
                    </div>

                    {/* Toppings Badge */}
                    {item.selectedToppings.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.selectedToppings.map((t) => (
                          <span
                            key={t.id}
                            className="px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800 text-[10px] font-semibold"
                          >
                            +{t.name} ({formatCurrency(t.price)})
                          </span>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 italic">
                        Catatan: {item.notes}
                      </p>
                    )}

                    {/* Quantity & Delete Controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                      <button
                        onClick={() => removeCartItem(item.cartItemId)}
                        className="text-[11px] text-red-500 hover:text-red-700 font-medium"
                      >
                        Hapus
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.cartItemId, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.cartItemId, 1)}
                          className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Checkout Button */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} item):</span>
                <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Pajak Resto ({DEFAULT_CONFIG.CAFE_TAX_PERCENT}%):</span>
                <span className="font-semibold text-slate-800">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-dashed border-slate-200">
                <span>Total Bayar:</span>
                <span className="text-blue-600 text-lg">{formatCurrency(totalAmount)}</span>
              </div>

              <button
                onClick={handleOpenPayment}
                disabled={cart.length === 0}
                className="clay-btn clay-btn-primary w-full !py-3 text-sm mt-3 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Banknote className="w-4 h-4" />
                <span>Bayar & Cetak Struk ({formatCurrency(totalAmount)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Topping Modifier Modal */}
      {toppingModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{toppingModalItem.name}</h3>
                <span className="text-xs text-blue-100">{formatCurrency(toppingModalItem.price)}</span>
              </div>
              <button
                onClick={() => setToppingModalItem(null)}
                className="text-white/80 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                  Pilih Tambahan Topping / Modifier
                </h4>
                <div className="space-y-2">
                  {toppings
                    .filter(
                      (t) =>
                        t.category === 'all' ||
                        t.category === toppingModalItem.category
                    )
                    .map((top) => {
                      const isSelected = modalSelectedToppings.some((t) => t.id === top.id);
                      return (
                        <div
                          key={top.id}
                          onClick={() => toggleTopping(top)}
                          className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500 shadow-sm text-blue-900'
                              : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-xs font-semibold">{top.name}</span>
                          </div>
                          <span className="text-xs font-bold text-blue-600">
                            +{formatCurrency(top.price)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Catatan Khusus (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Less sugar / Extra ice / Pisah saus"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="clay-input !py-2 text-xs"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Item:</span>
                <span className="font-extrabold text-blue-600 text-base">
                  {formatCurrency(
                    toppingModalItem.price +
                      modalSelectedToppings.reduce((s, t) => s + t.price, 0)
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setToppingModalItem(null)}
                  className="px-4 py-2 rounded-full text-slate-600 text-xs font-semibold hover:bg-slate-200/60"
                >
                  Batal
                </button>
                <button
                  onClick={addCustomizedItemToCart}
                  className="clay-btn clay-btn-primary !py-2 !px-4 text-xs"
                >
                  Tambah ke Keranjang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Proses Pembayaran</h3>
                <span className="text-xs text-blue-100">Total: {formatCurrency(totalAmount)}</span>
              </div>
              <button
                onClick={() => setIsPaymentOpen(false)}
                className="text-white/80 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Method Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Pilih Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="text-xs font-bold">Tunai (Cash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'qris'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-xs font-bold">QRIS Statis/Dinamis</span>
                  </button>
                </div>
              </div>

              {/* Cash Denomination Options */}
              {paymentMethod === 'cash' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                      Jumlah Uang Diterima (Rp)
                    </label>
                    <input
                      type="number"
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      placeholder="Masukkan nominal uang tunai"
                      className="clay-input text-lg font-bold text-slate-900"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAmountPaidInput(totalAmount.toString())}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-xs font-semibold text-slate-700"
                    >
                      Uang Pas ({formatCurrency(totalAmount)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmountPaidInput('50000')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-xs font-semibold text-slate-700"
                    >
                      Rp 50.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmountPaidInput('100000')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-xs font-semibold text-slate-700"
                    >
                      Rp 100.000
                    </button>
                  </div>

                  {/* Change Preview */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900">
                    <span className="text-xs font-semibold">Uang Kembalian:</span>
                    <span className="text-base font-extrabold">{formatCurrency(changeAmount)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl shadow-inner border border-slate-300 flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-slate-800" />
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">
                    Silakan arahkan pelanggan untuk scan QRIS Meo Cafe
                  </p>
                  <span className="text-xs text-blue-600 font-bold block">
                    NMID: ID102030405060 | MEO CAFE
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={submitOrder}
                className="clay-btn clay-btn-primary w-full !py-3.5 text-sm shadow-xl flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesaikan Transaksi & Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Drawer Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" />
                <h3 className="font-bold text-base">Riwayat Transaksi Kasir</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-white/80 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-center text-slate-400 py-10 text-xs">
                  Belum ada transaksi tercatat.
                </p>
              ) : (
                recentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{ord.order_number}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 capitalize">
                          {ord.order_type === 'dine_in' ? `Meja ${ord.table_number}` : 'Take Away'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {ord.customer_name} • {ord.items?.length || 0} item • Kasir: {ord.cashier_name}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        {new Date(ord.created_at).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-blue-600 text-sm">
                        {formatCurrency(ord.total_amount)}
                      </span>
                      <button
                        onClick={() => {
                          setCompletedOrder(ord);
                          setIsReceiptOpen(true);
                        }}
                        className="clay-btn clay-btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Struk
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHistory(false)}
                className="clay-btn clay-btn-secondary !py-2 !px-4 text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Modal */}
      <ReceiptModal
        order={completedOrder}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};

export default KasirPOSPage;
