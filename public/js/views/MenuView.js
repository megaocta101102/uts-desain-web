/**
 * ==============================================================================
 * L'AZUR ARTISAN CAFE - MENU VIEW (MVC: VIEW LAYER)
 * ==============================================================================
 * Render komponen DOM kartu menu, paginasi, tab filter, dan modal detail
 */

window.MenuView = {
  formatCurrency(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  },

  /**
   * Render kartu menu customer (Landing Page)
   */
  renderCustomerMenuGrid(container, items, onCardClick) {
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <h3 style="font-weight: 700; color: var(--navy-accent); margin-bottom: 6px;">Menu Tidak Ditemukan</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">Silakan coba gunakan kata kunci lain atau pilih kategori berbeda.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => `
      <article class="clay-card clay-card-interactive menu-card" data-id="${item.id}">
        <div class="menu-image-wrap">
          <img src="${item.image_url || 'assets/images/coffee_signature.jpg'}" alt="${item.name}" loading="lazy" onerror="this.src='assets/images/coffee_signature.jpg'" />
          <span class="menu-type-indicator">${item.type}</span>
          ${!item.is_available ? '<span class="menu-availability-badge">Habis</span>' : ''}
        </div>
        <div class="menu-body">
          <div>
            <div class="menu-meta-line">
              <span>${item.category || 'Specialty'}</span>
              <span aria-hidden="true">·</span>
              <span>L'Azur Signature</span>
            </div>
            <h3 class="menu-title">${item.name}</h3>
            <p class="menu-desc">${item.description || 'Kelezatan autentik dengan bahan kurasi pilihan terbaik.'}</p>
          </div>
          <div class="menu-footer">
            <span class="menu-price tabular-nums">${this.formatCurrency(item.price)}</span>
            <span class="menu-detail-cta">
              Lihat Detail
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </span>
          </div>
        </div>
      </article>
    `).join('');

    // Attach click events
    container.querySelectorAll('.menu-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const clickedItem = items.find(i => i.id === id);
        if (clickedItem && onCardClick) onCardClick(clickedItem);
      });
    });
  },

  /**
   * Render kartu menu untuk POS Kasir
   */
  renderKasirMenuGrid(container, items, onAddToCart) {
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p style="color: var(--text-muted); font-size: 0.9rem;">Tidak ada menu yang sesuai kriteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="clay-card pos-menu-card ${!item.is_available ? 'unavailable' : ''}" data-id="${item.id}">
        <div class="pos-card-img-wrap">
          <img src="${item.image_url || 'assets/images/coffee_signature.jpg'}" alt="${item.name}" loading="lazy" onerror="this.src='assets/images/coffee_signature.jpg'" />
          ${!item.is_available ? '<span class="menu-availability-badge">Habis</span>' : ''}
        </div>
        <div class="pos-card-info">
          <span class="pos-card-meta">${item.category}</span>
          <h4 class="pos-card-title">${item.name}</h4>
        </div>
        <div class="pos-card-footer">
          <span class="pos-card-price tabular-nums">${this.formatCurrency(item.price)}</span>
          ${item.is_available ? `
            <button class="pos-add-btn" title="Tambah ke Pesanan">+</button>
          ` : '<span style="font-size: 0.75rem; color: var(--danger); font-weight: 700;">Kosong</span>'}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.pos-menu-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = card.getAttribute('data-id');
        const item = items.find(i => i.id === id);
        if (item && item.is_available && onAddToCart) {
          onAddToCart(item);
        }
      });
    });
  },

  /**
   * Render Pagination Component
   */
  renderPagination(container, currentPage, totalPages, onPageChange) {
    if (!container) return;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let buttonsHtml = `
      <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      buttonsHtml += `
        <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>
      `;
    }

    buttonsHtml += `
      <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    `;

    container.innerHTML = buttonsHtml;

    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = Number(btn.getAttribute('data-page'));
        if (page && page !== currentPage && page >= 1 && page <= totalPages) {
          onPageChange(page);
        }
      });
    });
  }
};
