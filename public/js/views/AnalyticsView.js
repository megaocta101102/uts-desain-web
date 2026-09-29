/**
 * ==============================================================================
 * L'AZUR ARTISAN CAFE - ANALYTICS VIEW (MVC: VIEW LAYER)
 * ==============================================================================
 * Render Bento grid widget analitik, grafik omset mingguan, dan tabel menu owner
 */

window.AnalyticsView = {
  formatCurrency(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  },

  /**
   * Render Bento Stats
   */
  renderBentoStats(metrics) {
    const elRevenue = document.getElementById('bentoTotalRevenue');
    const elOrders = document.getElementById('bentoTotalOrders');
    const elAov = document.getElementById('bentoAov');
    const elAvailable = document.getElementById('bentoAvailable');

    if (elRevenue) elRevenue.textContent = this.formatCurrency(metrics.totalRevenue);
    if (elOrders) elOrders.textContent = metrics.totalTransactions + ' Transaksi';
    if (elAov) elAov.textContent = this.formatCurrency(metrics.avgTicket);
    if (elAvailable) elAvailable.textContent = `${metrics.availableMenus} / ${metrics.totalMenus} Menu`;

    // Render Weekly Sales Bar Chart
    const barContainer = document.getElementById('weeklySalesChart');
    if (barContainer && metrics.weeklyData) {
      barContainer.innerHTML = metrics.weeklyData.map(item => {
        const heightPercent = Math.max(12, Math.round((item.amount / metrics.maxWeekly) * 100));
        return `
          <div class="chart-bar-column">
            <span class="bar-amount">${this.formatCurrency(item.amount)}</span>
            <div class="bar-pill" style="height: ${heightPercent}%;"></div>
            <span class="bar-label">${item.day}</span>
          </div>
        `;
      }).join('');
    }

    // Render Top Selling Items
    const topListContainer = document.getElementById('topSellingContainer');
    if (topListContainer && metrics.topSelling) {
      if (metrics.topSelling.length === 0) {
        topListContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Belum ada data penjualan.</p>';
      } else {
        topListContainer.innerHTML = metrics.topSelling.map((item, idx) => `
          <div class="top-item-row">
            <div class="top-item-info">
              <span class="top-item-name">${idx + 1}. ${item.name}</span>
              <span class="top-item-sold">${item.count} porsi terjual</span>
            </div>
            <span class="top-item-rev tabular-nums">${this.formatCurrency(item.revenue)}</span>
          </div>
        `).join('');
      }
    }
  },

  /**
   * Render Table Menu Management Owner
   */
  renderOwnerMenuTable(container, menus, { onEdit, onDelete, onToggleAvailability }) {
    if (!container) return;

    if (!menus || menus.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);">
            Tidak ada menu yang sesuai kriteria.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = menus.map(menu => `
      <tr data-id="${menu.id}">
        <td>
          <img src="${menu.image_url || 'assets/images/coffee_signature.jpg'}" alt="${menu.name}" class="table-menu-img" onerror="this.src='assets/images/coffee_signature.jpg'" />
        </td>
        <td>
          <strong style="color: var(--navy-accent);">${menu.name}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${menu.description || '-'}</div>
        </td>
        <td style="text-transform: capitalize;">${menu.type}</td>
        <td>${menu.category}</td>
        <td class="tabular-nums" style="font-weight: 700; color: var(--primary-blue);">${this.formatCurrency(menu.price)}</td>
        <td>
          <button class="status-toggle-badge ${menu.is_available ? 'status-available' : 'status-soldout'}" data-id="${menu.id}" data-status="${menu.is_available}">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
            ${menu.is_available ? 'Tersedia' : 'Habis'}
          </button>
        </td>
        <td>
          <div class="table-actions">
            <button class="action-icon-btn btn-edit-menu" data-id="${menu.id}" title="Edit Menu">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="action-icon-btn delete btn-delete-menu" data-id="${menu.id}" title="Hapus Menu">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach Event Listeners
    container.querySelectorAll('.btn-edit-menu').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const menu = menus.find(m => m.id === id);
        if (menu && onEdit) onEdit(menu);
      });
    });

    container.querySelectorAll('.btn-delete-menu').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (onDelete) onDelete(id);
      });
    });

    container.querySelectorAll('.status-toggle-badge').forEach(badge => {
      badge.addEventListener('click', () => {
        const id = badge.getAttribute('data-id');
        const status = badge.getAttribute('data-status') === 'true';
        if (onToggleAvailability) onToggleAvailability(id, status);
      });
    });
  }
};
