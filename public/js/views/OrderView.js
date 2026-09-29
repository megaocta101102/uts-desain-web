/**
 * ==============================================================================
 * MEO CAFE - ORDER VIEW (VARIANTS, TOPPINGS, & DETAILED THERMAL RECEIPT)
 * ==============================================================================
 */

window.OrderView = {
  formatCurrency(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  },

  renderCart(container, items, { onQtyChange, onNoteChange }) {
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
          <svg style="margin: 0 auto 10px; display: block; opacity: 0.5;" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          <p style="font-weight: 600; font-size: 0.9rem;">Belum ada menu dipilih</p>
          <p style="font-size: 0.775rem;">Pilih menu di sebelah kiri untuk kustomisasi varian</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map((item, index) => {
      const unitPrice = (Number(item.price) || 0) + (Number(item.sizePrice) || 0) + (Number(item.toppingPrice) || 0);
      const rowTotal = unitPrice * item.quantity;

      return `
        <div class="cart-item-row" data-index="${index}">
          <div class="cart-item-main">
            <div>
              <span class="cart-item-name">${item.name}</span>
              <div style="font-size: 0.75rem; color: var(--primary-blue); font-weight: 600; margin-top: 2px;">
                ${item.size ? `<span>[${item.size}]</span>` : ''}
                ${item.topping ? `<span> · +${item.topping}</span>` : ''}
              </div>
            </div>
            <span class="cart-item-price tabular-nums">${this.formatCurrency(rowTotal)}</span>
          </div>
          
          <input 
            type="text" 
            class="item-note-input" 
            placeholder="Catatan pesanan (opsional, mis: less sugar...)" 
            value="${item.notes || ''}"
            data-index="${index}"
          />

          <div class="cart-item-controls">
            <span style="font-size: 0.75rem; color: var(--text-muted);">${this.formatCurrency(unitPrice)} / porsi</span>
            
            <div class="qty-control-group">
              <button class="qty-btn btn-qty-minus" data-index="${index}">-</button>
              <span class="qty-val tabular-nums">${item.quantity}</span>
              <button class="qty-btn btn-qty-plus" data-index="${index}">+</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.btn-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-index'));
        onQtyChange(idx, -1);
      });
    });

    container.querySelectorAll('.btn-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-index'));
        onQtyChange(idx, 1);
      });
    });

    container.querySelectorAll('.item-note-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = Number(input.getAttribute('data-index'));
        onNoteChange(idx, e.target.value);
      });
    });
  },

  generateReceiptHTML(order) {
    const dateStr = new Date(order.created_at || Date.now()).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    return `
      <div class="receipt-paper" id="printableReceipt">
        <div class="receipt-header">
          <h3>MEO CAFE</h3>
          <p>Jl. Pelabuhan Tanjuk Priok No.10</p>
          <p>Bakalan Krajan, Sukun, Malang</p>
        </div>

        <div style="font-size: 0.8rem; margin-bottom: 8px;">
          <div><strong>No:</strong> ${order.order_number}</div>
          <div><strong>Waktu:</strong> ${dateStr}</div>
          <div><strong>Kasir:</strong> ${order.cashier_name || 'Kasir'}</div>
          <div><strong>Pelanggan:</strong> ${order.customer_name || 'Tamu'} (${order.table_number || 'Takeaway'})</div>
          <div><strong>Tipe:</strong> ${order.order_type === 'take_away' ? 'TAKE AWAY' : 'DINE IN'}</div>
        </div>

        <div class="receipt-divider"></div>

        <table class="receipt-items-table">
          <thead>
            <tr style="border-bottom: 1px dashed #000; font-weight: bold; font-size: 0.8rem;">
              <td>MENU & VARIAN</td>
              <td style="text-align: center;">QTY</td>
              <td style="text-align: right;">TOTAL</td>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>
                  <div>${item.menu_name} ${item.size ? `(${item.size})` : ''}</div>
                  ${item.topping ? `<div style="font-size: 0.725rem; color: #333;">+ Topping: ${item.topping}</div>` : ''}
                  ${item.notes ? `<div style="font-size: 0.7rem; color: #555;">* Catatan: ${item.notes}</div>` : ''}
                </td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${this.formatCurrency(item.subtotal || item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="receipt-divider"></div>

        <div style="display: flex; flex-direction: column; gap: 3px; font-size: 0.825rem;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal</span>
            <span>${this.formatCurrency(order.subtotal)}</span>
          </div>
          ${order.discount ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Diskon</span>
              <span>-${this.formatCurrency(order.discount)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between;">
            <span>PB1 / Pajak (10%)</span>
            <span>${this.formatCurrency(order.tax)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 0.95rem; border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px;">
            <span>GRAND TOTAL</span>
            <span>${this.formatCurrency(order.total_amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Bayar (${(order.payment_method || 'CASH').toUpperCase()})</span>
            <span>${this.formatCurrency(order.cash_given || order.total_amount)}</span>
          </div>
          ${order.change_amount ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Kembali</span>
              <span>${this.formatCurrency(order.change_amount)}</span>
            </div>
          ` : ''}
        </div>

        <div class="receipt-footer">
          <p>*** TERIMA KASIH ***</p>
          <p>Selamat Menikmati Hidangan Meo Cafe</p>
        </div>
      </div>
    `;
  }
};
