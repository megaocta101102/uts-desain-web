/**
 * ==============================================================================
 * MEO CAFE - KASIR POS CONTROLLER (DYNAMIC TOPPING ADD-ONS FROM DATABASE)
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  const session = window.UserModel.requireAuth('kasir');
  if (!session) return;

  const state = {
    search: '',
    type: 'all',
    category: 'all',
    page: 1,
    limit: 12,
    cart: [],
    discountPercent: 0,
    orderType: 'dine_in',
    selectedPaymentMethod: 'cash',
    lastCreatedOrder: null,

    // Kustomisasi menu aktif
    activeCustomizingMenu: null,
    selectedSize: 'Small',
    selectedSizePrice: 0,
    selectedTopping: '',
    selectedToppingPrice: 0,
    customizingQty: 1
  };

  // DOM Elements
  const cashierNameDisplay = document.getElementById('cashierNameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');
  const posMenuGrid = document.getElementById('posMenuGrid');
  const posPagination = document.getElementById('posPagination');
  const posSearchInput = document.getElementById('posSearchInput');
  const posTypeTabs = document.querySelectorAll('.pos-type-tab');
  const cartContainer = document.getElementById('cartItemsList');
  const orderTypeSelect = document.getElementById('orderTypeSelect');
  const tableNumberInput = document.getElementById('tableNumberInput');
  const customerNameInput = document.getElementById('customerNameInput');
  
  // Calculation DOM
  const subtotalDisplay = document.getElementById('calcSubtotal');
  const taxDisplay = document.getElementById('calcTax');
  const discountDisplay = document.getElementById('calcDiscount');
  const grandTotalDisplay = document.getElementById('calcGrandTotal');
  const discountInput = document.getElementById('discountInput');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');

  // Customize Modal DOM
  const customizeModal = document.getElementById('customizeModal');
  const closeCustModal = document.getElementById('closeCustModal');
  const custMenuTitle = document.getElementById('custMenuTitle');
  const custMenuImg = document.getElementById('custMenuImg');
  const custMenuBaseName = document.getElementById('custMenuBaseName');
  const custMenuBasePrice = document.getElementById('custMenuBasePrice');
  const custSizeButtons = document.querySelectorAll('.cust-size-btn');
  const custToppingSelect = document.getElementById('custToppingSelect');
  const custNoteInput = document.getElementById('custNoteInput');
  const custQtyMinus = document.getElementById('custQtyMinus');
  const custQtyPlus = document.getElementById('custQtyPlus');
  const custQtyVal = document.getElementById('custQtyVal');
  const custLiveTotal = document.getElementById('custLiveTotal');
  const custAddToCartBtn = document.getElementById('custAddToCartBtn');

  // Payment Modal DOM
  const paymentModal = document.getElementById('paymentModal');
  const closePaymentModalBtn = document.getElementById('closePaymentModal');
  const payModalTotal = document.getElementById('payModalTotal');
  const payMethodCards = document.querySelectorAll('.pay-method-card');
  const cashAmountInput = document.getElementById('cashAmountInput');
  const cashChangeDisplay = document.getElementById('cashChangeDisplay');
  const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
  const cashSection = document.getElementById('cashSection');
  const qrisSection = document.getElementById('qrisSection');
  const debitSection = document.getElementById('debitSection');
  const quickCashChips = document.querySelectorAll('.cash-chip');

  // Receipt Modal DOM
  const receiptModal = document.getElementById('receiptModal');
  const closeReceiptModalBtn = document.getElementById('closeReceiptModal');
  const receiptPreviewContainer = document.getElementById('receiptPreviewContainer');
  const printReceiptBtn = document.getElementById('printReceiptBtn');
  const newOrderBtn = document.getElementById('newOrderBtn');

  if (cashierNameDisplay) cashierNameDisplay.textContent = session.fullName;
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    window.UserModel.logout();
    window.location.href = 'login.html';
  });

  // Load Topping Options Dinamis dari Database
  async function populateDynamicToppings() {
    if (!custToppingSelect) return;
    try {
      const toppings = await window.ToppingModel.getAllToppings(true);
      let optionsHtml = '<option value="" data-price="0">Tanpa Topping Tambahan (+Rp 0)</option>';
      toppings.forEach(t => {
        optionsHtml += `<option value="${t.name}" data-price="${t.price}">${t.name} (+${window.MenuView.formatCurrency(t.price)})</option>`;
      });
      custToppingSelect.innerHTML = optionsHtml;
    } catch (e) {
      console.warn('Failed to load toppings:', e);
    }
  }

  // Fetch & Render POS Menus
  async function loadPosMenus() {
    try {
      const result = await window.MenuModel.getFilteredMenus({
        search: state.search,
        type: state.type,
        category: state.category,
        page: state.page,
        limit: state.limit,
        availableOnly: false
      });

      window.MenuView.renderKasirMenuGrid(posMenuGrid, result.items, (menu) => {
        openCustomizationModal(menu);
      });

      window.MenuView.renderPagination(posPagination, result.currentPage, result.totalPages, (newPage) => {
        state.page = newPage;
        loadPosMenus();
      });
    } catch (e) {
      console.error(e);
    }
  }

  // Customization Modal Logic
  async function openCustomizationModal(menu) {
    state.activeCustomizingMenu = menu;
    state.selectedSize = 'Small';
    state.selectedSizePrice = 0;
    state.selectedTopping = '';
    state.selectedToppingPrice = 0;
    state.customizingQty = 1;

    custMenuTitle.textContent = `Pilih Varian: ${menu.name}`;
    custMenuBaseName.textContent = menu.name;
    custMenuBasePrice.textContent = window.OrderView.formatCurrency(menu.price);
    custMenuImg.src = menu.image_url || 'assets/images/coffee_signature.jpg';
    custNoteInput.value = '';
    custQtyVal.textContent = '1';

    // Reset size buttons
    custSizeButtons.forEach(btn => {
      if (btn.getAttribute('data-size') === 'Small') {
        btn.classList.add('active');
        btn.classList.add('clay-btn-primary');
        btn.classList.remove('clay-btn-secondary');
      } else {
        btn.classList.remove('active');
        btn.classList.remove('clay-btn-primary');
        btn.classList.add('clay-btn-secondary');
      }
    });

    await populateDynamicToppings();
    if (custToppingSelect) custToppingSelect.value = '';

    updateCustomizeLivePrice();
    customizeModal.classList.add('active');
  }

  function closeCustomizationModal() {
    customizeModal.classList.remove('active');
  }

  function updateCustomizeLivePrice() {
    if (!state.activeCustomizingMenu) return;
    const base = Number(state.activeCustomizingMenu.price) || 0;
    const unitTotal = base + state.selectedSizePrice + state.selectedToppingPrice;
    const grand = unitTotal * state.customizingQty;
    custLiveTotal.textContent = window.OrderView.formatCurrency(grand);
  }

  custSizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      custSizeButtons.forEach(b => {
        b.classList.remove('active', 'clay-btn-primary');
        b.classList.add('clay-btn-secondary');
      });
      btn.classList.add('active', 'clay-btn-primary');
      btn.classList.remove('clay-btn-secondary');

      state.selectedSize = btn.getAttribute('data-size');
      state.selectedSizePrice = Number(btn.getAttribute('data-price')) || 0;
      updateCustomizeLivePrice();
    });
  });

  if (custToppingSelect) {
    custToppingSelect.addEventListener('change', (e) => {
      const opt = e.target.selectedOptions[0];
      state.selectedTopping = e.target.value;
      state.selectedToppingPrice = Number(opt?.getAttribute('data-price')) || 0;
      updateCustomizeLivePrice();
    });
  }

  if (custQtyMinus) {
    custQtyMinus.addEventListener('click', () => {
      if (state.customizingQty > 1) {
        state.customizingQty -= 1;
        custQtyVal.textContent = state.customizingQty;
        updateCustomizeLivePrice();
      }
    });
  }

  if (custQtyPlus) {
    custQtyPlus.addEventListener('click', () => {
      state.customizingQty += 1;
      custQtyVal.textContent = state.customizingQty;
      updateCustomizeLivePrice();
    });
  }

  if (custAddToCartBtn) {
    custAddToCartBtn.addEventListener('click', () => {
      if (!state.activeCustomizingMenu) return;
      const menu = state.activeCustomizingMenu;
      const notes = custNoteInput.value.trim();

      const existing = state.cart.find(i => 
        i.id === menu.id && 
        i.size === state.selectedSize && 
        i.topping === state.selectedTopping && 
        i.notes === notes
      );

      if (existing) {
        existing.quantity += state.customizingQty;
      } else {
        state.cart.push({
          id: menu.id,
          name: menu.name,
          price: menu.price,
          size: state.selectedSize,
          sizePrice: state.selectedSizePrice,
          topping: state.selectedTopping,
          toppingPrice: state.selectedToppingPrice,
          quantity: state.customizingQty,
          notes: notes
        });
      }

      closeCustomizationModal();
      updateCartUI();
    });
  }

  // Cart Management
  function handleQtyChange(index, delta) {
    if (!state.cart[index]) return;
    state.cart[index].quantity += delta;
    if (state.cart[index].quantity <= 0) {
      state.cart.splice(index, 1);
    }
    updateCartUI();
  }

  function handleNoteChange(index, note) {
    if (state.cart[index]) {
      state.cart[index].notes = note;
    }
  }

  function updateCartUI() {
    window.OrderView.renderCart(cartContainer, state.cart, {
      onQtyChange: handleQtyChange,
      onNoteChange: handleNoteChange
    });

    const totals = window.OrderModel.calculateTotals(state.cart, state.discountPercent, 10);
    subtotalDisplay.textContent = window.OrderView.formatCurrency(totals.subtotal);
    taxDisplay.textContent = window.OrderView.formatCurrency(totals.taxAmount);
    discountDisplay.textContent = '-' + window.OrderView.formatCurrency(totals.discountAmount);
    grandTotalDisplay.textContent = window.OrderView.formatCurrency(totals.totalAmount);

    checkoutBtn.disabled = state.cart.length === 0;
  }

  function clearCart() {
    state.cart = [];
    state.discountPercent = 0;
    if (discountInput) discountInput.value = '';
    updateCartUI();
  }

  // Payment Processing
  function openPaymentModal() {
    if (state.cart.length === 0) return;
    const totals = window.OrderModel.calculateTotals(state.cart, state.discountPercent, 10);
    payModalTotal.textContent = window.OrderView.formatCurrency(totals.totalAmount);
    cashAmountInput.value = totals.totalAmount;
    updateCashChange();
    setPaymentMethod('cash');
    paymentModal.classList.add('active');
  }

  function closePaymentModal() {
    paymentModal.classList.remove('active');
  }

  function setPaymentMethod(method) {
    state.selectedPaymentMethod = method;
    payMethodCards.forEach(c => {
      if (c.getAttribute('data-method') === method) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    if (cashSection) cashSection.style.display = method === 'cash' ? 'block' : 'none';
    if (qrisSection) qrisSection.style.display = method === 'qris' ? 'block' : 'none';
    if (debitSection) debitSection.style.display = method === 'debit' ? 'block' : 'none';
  }

  function updateCashChange() {
    const totals = window.OrderModel.calculateTotals(state.cart, state.discountPercent, 10);
    const given = Number(cashAmountInput.value) || 0;
    const change = Math.max(0, given - totals.totalAmount);
    cashChangeDisplay.textContent = window.OrderView.formatCurrency(change);
  }

  async function processOrder() {
    const totals = window.OrderModel.calculateTotals(state.cart, state.discountPercent, 10);
    const given = Number(cashAmountInput.value) || totals.totalAmount;

    if (state.selectedPaymentMethod === 'cash' && given < totals.totalAmount) {
      alert("Nominal uang tunai kurang dari total tagihan.");
      return;
    }

    try {
      confirmPaymentBtn.disabled = true;
      confirmPaymentBtn.textContent = 'Memproses...';

      const newOrder = await window.OrderModel.createOrder({
        customerName: customerNameInput.value || 'Tamu',
        cashierName: session.fullName,
        tableNumber: state.orderType === 'take_away' ? 'Takeaway' : (tableNumberInput.value || 'Meja 01'),
        orderType: state.orderType,
        items: state.cart,
        paymentMethod: state.selectedPaymentMethod,
        cashGiven: given,
        discountPercent: state.discountPercent,
        notes: ''
      });

      state.lastCreatedOrder = newOrder;
      closePaymentModal();
      clearCart();
      openReceiptModal(newOrder);
    } catch (err) {
      alert(err.message || 'Gagal membuat pesanan');
    } finally {
      confirmPaymentBtn.disabled = false;
      confirmPaymentBtn.textContent = 'Selesaikan Pembayaran & Cetak Struk';
    }
  }

  function openReceiptModal(order) {
    if (!receiptModal) return;
    receiptPreviewContainer.innerHTML = window.OrderView.generateReceiptHTML(order);
    receiptModal.classList.add('active');
  }

  function closeReceiptModal() {
    receiptModal.classList.remove('active');
  }

  // Event Listeners
  if (posSearchInput) {
    let debounce;
    posSearchInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        state.search = e.target.value;
        state.page = 1;
        loadPosMenus();
      }, 250);
    });
  }

  posTypeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      posTypeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.type = tab.getAttribute('data-type') || 'all';
      state.page = 1;
      loadPosMenus();
    });
  });

  if (orderTypeSelect) {
    orderTypeSelect.addEventListener('change', (e) => {
      state.orderType = e.target.value;
      if (state.orderType === 'take_away') {
        tableNumberInput.disabled = true;
        tableNumberInput.value = 'Takeaway';
      } else {
        tableNumberInput.disabled = false;
        tableNumberInput.value = 'Meja 01';
      }
    });
  }

  if (discountInput) {
    discountInput.addEventListener('input', (e) => {
      state.discountPercent = Math.min(100, Math.max(0, Number(e.target.value) || 0));
      updateCartUI();
    });
  }

  if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
  if (checkoutBtn) checkoutBtn.addEventListener('click', openPaymentModal);
  if (closeCustModal) closeCustModal.addEventListener('click', closeCustomizationModal);
  if (closePaymentModalBtn) closePaymentModalBtn.addEventListener('click', closePaymentModal);
  if (closeReceiptModalBtn) closeReceiptModalBtn.addEventListener('click', closeReceiptModal);
  if (newOrderBtn) newOrderBtn.addEventListener('click', closeReceiptModal);

  payMethodCards.forEach(c => {
    c.addEventListener('click', () => setPaymentMethod(c.getAttribute('data-method')));
  });

  if (cashAmountInput) cashAmountInput.addEventListener('input', updateCashChange);

  quickCashChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const nominal = chip.getAttribute('data-nominal');
      if (nominal === 'exact') {
        const totals = window.OrderModel.calculateTotals(state.cart, state.discountPercent, 10);
        cashAmountInput.value = totals.totalAmount;
      } else {
        cashAmountInput.value = Number(nominal);
      }
      updateCashChange();
    });
  });

  if (confirmPaymentBtn) confirmPaymentBtn.addEventListener('click', processOrder);

  if (printReceiptBtn) {
    printReceiptBtn.addEventListener('click', () => {
      window.print();
    });
  }

  await loadPosMenus();
  updateCartUI();
});
