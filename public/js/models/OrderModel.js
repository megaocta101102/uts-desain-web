/**
 * ==============================================================================
 * MEO CAFE - ORDER MODEL (VARIANTS, TOPPINGS, & CALCULATIONS)
 * ==============================================================================
 */

window.OrderModel = {
  // Opsi Ukuran & Harga Tambahan
  SIZE_OPTIONS: [
    { id: 'Small', label: 'Small', priceDiff: 0 },
    { id: 'Medium', label: 'Medium (+Rp 5.000)', priceDiff: 5000 },
    { id: 'Large', label: 'Large (+Rp 8.000)', priceDiff: 8000 }
  ],

  // Dropdown Topping Tambahan (Khusus Minuman / Umum)
  TOPPING_OPTIONS: [
    { id: '', label: 'Tanpa Topping Tambahan', price: 0 },
    { id: 'Extra Espresso Shot', label: 'Extra Espresso Shot (+Rp 6.000)', price: 6000 },
    { id: 'Oat Milk Substitution', label: 'Oat Milk Substitution (+Rp 8.000)', price: 8000 },
    { id: 'Cheese Foam', label: 'Cloud Cheese Foam (+Rp 6.000)', price: 6000 },
    { id: 'Boba Brown Sugar', label: 'Boba Brown Sugar (+Rp 5.000)', price: 5000 },
    { id: 'Grass Jelly Cincau', label: 'Grass Jelly Cincau (+Rp 4.000)', price: 4000 },
    { id: 'Vanilla Syrup', label: 'Vanilla Syrup (+Rp 5.000)', price: 5000 },
    { id: 'Caramel Drizzle', label: 'Caramel Drizzle (+Rp 5.000)', price: 5000 }
  ],

  async getAllOrders() {
    return await window.AppDatabase.getOrders();
  },

  async getOrderById(id) {
    const orders = await this.getAllOrders();
    return orders.find(o => o.id === id || o.order_number === id) || null;
  },

  calculateTotals(items, discountPercent = 0, taxPercent = 10) {
    const subtotal = items.reduce((acc, item) => {
      const unitPrice = (Number(item.price) || 0) + (Number(item.sizePrice) || 0) + (Number(item.toppingPrice) || 0);
      return acc + (unitPrice * item.quantity);
    }, 0);

    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round((taxableAmount * taxPercent) / 100);
    const totalAmount = taxableAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount
    };
  },

  async createOrder({
    customerName = 'Tamu',
    cashierName = 'Kasir Cindy',
    tableNumber = 'Meja 01',
    orderType = 'dine_in',
    items = [],
    paymentMethod = 'cash',
    cashGiven = 0,
    discountPercent = 0,
    notes = ''
  }) {
    if (!items || items.length === 0) {
      throw new Error("Keranjang pesanan masih kosong.");
    }

    const { subtotal, discountAmount, taxAmount, totalAmount } = this.calculateTotals(items, discountPercent, 10);
    const orderNumber = 'MEO-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);

    const orderPayload = {
      order_number: orderNumber,
      customer_name: customerName.trim() || 'Tamu',
      cashier_name: cashierName,
      table_number: orderType === 'take_away' ? 'Takeaway' : (tableNumber || 'Meja 01'),
      order_type: orderType,
      items: items.map(item => {
        const itemFinalPrice = (Number(item.price) || 0) + (Number(item.sizePrice) || 0) + (Number(item.toppingPrice) || 0);
        return {
          menu_name: item.name,
          size: item.size || 'Small',
          topping: item.topping || '',
          price: itemFinalPrice,
          quantity: item.quantity,
          subtotal: itemFinalPrice * item.quantity,
          notes: item.notes || ''
        };
      }),
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      cash_given: Number(cashGiven) || totalAmount,
      change_amount: Math.max(0, (Number(cashGiven) || totalAmount) - totalAmount),
      payment_status: 'paid',
      notes: notes,
      created_at: new Date().toISOString()
    };

    return await window.AppDatabase.insertOrder(orderPayload);
  }
};
