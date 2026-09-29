/**
 * ==============================================================================
 * MEO CAFE - OWNER STATISTIK CONTROLLER (WEEKLY & MONTHLY FILTERS)
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  const session = window.UserModel.requireAuth('owner');
  if (!session) return;

  let currentPeriod = 'weekly';

  const ownerNameDisplay = document.getElementById('ownerNameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const periodTabButtons = document.querySelectorAll('.period-tab-btn');
  const chartTitle = document.getElementById('chartTitle');
  const chartSubtitle = document.getElementById('chartSubtitle');

  if (ownerNameDisplay) ownerNameDisplay.textContent = session.fullName;
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    window.UserModel.logout();
    window.location.href = 'login.html';
  });

  async function loadStatistik() {
    try {
      const metrics = await window.ReportModel.getBentoAnalytics(currentPeriod);

      // Bento Stat Cards
      const elRevenue = document.getElementById('bentoTotalRevenue');
      const elOrders = document.getElementById('bentoTotalOrders');
      const elAov = document.getElementById('bentoAov');
      const elProfit = document.getElementById('bentoProfit');

      if (elRevenue) elRevenue.textContent = window.MenuView.formatCurrency(metrics.totalRevenue);
      if (elOrders) elOrders.textContent = metrics.totalTransactions + ' Pesanan';
      if (elAov) elAov.textContent = window.MenuView.formatCurrency(metrics.avgTicket);
      if (elProfit) elProfit.textContent = window.MenuView.formatCurrency(metrics.estimatedProfit);

      // Chart Titles
      if (chartTitle) chartTitle.textContent = currentPeriod === 'monthly' ? 'Tren Penjualan Bulanan (4 Minggu)' : 'Tren Penjualan Mingguan (7 Hari)';
      if (chartSubtitle) chartSubtitle.textContent = currentPeriod === 'monthly' ? 'Aktivitas perputaran omset bulanan di Meo Cafe' : 'Aktivitas perputaran transaksi harian di Meo Cafe';

      // Bar Chart
      const chartContainer = document.getElementById('weeklySalesChart');
      if (chartContainer && metrics.chartData) {
        chartContainer.innerHTML = metrics.chartData.map(item => {
          const heightPercent = Math.max(15, Math.round((item.amount / metrics.maxChartAmount) * 100));
          return `
            <div class="chart-bar-column">
              <span class="bar-amount">${window.MenuView.formatCurrency(item.amount)}</span>
              <div class="bar-pill" style="height: ${heightPercent}%;"></div>
              <span class="bar-label">${item.label}</span>
            </div>
          `;
        }).join('');
      }

      // Category Distribution
      const catMinumanBar = document.getElementById('catMinumanBar');
      const catMinumanPercent = document.getElementById('catMinumanPercent');
      const catMakananBar = document.getElementById('catMakananBar');
      const catMakananPercent = document.getElementById('catMakananPercent');
      const catSnackBar = document.getElementById('catSnackBar');
      const catSnackPercent = document.getElementById('catSnackPercent');

      if (catMinumanBar && metrics.categoryPercentages) {
        catMinumanBar.style.width = metrics.categoryPercentages.Minuman + '%';
        catMinumanPercent.textContent = metrics.categoryPercentages.Minuman + '%';
        catMakananBar.style.width = metrics.categoryPercentages.Makanan + '%';
        catMakananPercent.textContent = metrics.categoryPercentages.Makanan + '%';
        catSnackBar.style.width = metrics.categoryPercentages.Snack + '%';
        catSnackPercent.textContent = metrics.categoryPercentages.Snack + '%';
      }

      // Top Selling 5
      const topContainer = document.getElementById('topSellingContainer');
      if (topContainer && metrics.topSelling) {
        if (metrics.topSelling.length === 0) {
          topContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Belum ada pesanan.</p>';
        } else {
          topContainer.innerHTML = metrics.topSelling.map((item, idx) => `
            <div class="top-item-row">
              <div class="top-item-left">
                <span class="top-rank-badge">${idx + 1}</span>
                <div>
                  <div class="top-item-name">${item.name}</div>
                  <div class="top-item-sold">${item.count} porsi terjual</div>
                </div>
              </div>
              <span class="top-item-rev tabular-nums">${window.MenuView.formatCurrency(item.revenue)}</span>
            </div>
          `).join('');
        }
      }

      // Recent Orders Table
      const ordersContainer = document.getElementById('recentOrdersTableBody');
      if (ordersContainer && metrics.recentOrders) {
        if (metrics.recentOrders.length === 0) {
          ordersContainer.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 16px;">Belum ada transaksi.</td></tr>';
        } else {
          ordersContainer.innerHTML = metrics.recentOrders.map(order => `
            <tr>
              <td><strong>${order.order_number}</strong></td>
              <td>${order.customer_name || 'Tamu'} (${order.table_number || 'Takeaway'})</td>
              <td style="text-transform: uppercase; font-size: 0.75rem; font-weight: 700; color: var(--primary-blue);">${order.payment_method}</td>
              <td class="tabular-nums" style="font-weight: 700;">${window.MenuView.formatCurrency(order.total_amount)}</td>
              <td style="font-size: 0.75rem; color: var(--text-muted);">${new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
          `).join('');
        }
      }

    } catch (e) {
      console.error('Failed to load statistik:', e);
    }
  }

  // Period Tab Click
  periodTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      periodTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.getAttribute('data-period') || 'weekly';
      loadStatistik();
    });
  });

  // Ekspor CSV
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', async () => {
      try {
        const orders = await window.AppDatabase.getOrders();
        if (orders.length === 0) {
          alert("Belum ada data transaksi untuk diekspor.");
          return;
        }

        let csv = "data:text/csv;charset=utf-8,";
        csv += "No Order,Waktu,Pelanggan,Meja,Tipe,Metode Bayar,Total (Rp),Kasir\n";

        orders.forEach(o => {
          const d = new Date(o.created_at).toLocaleString('id-ID');
          csv += `"${o.order_number}","${d}","${o.customer_name}","${o.table_number}","${o.order_type}","${o.payment_method}","${o.total_amount}","${o.cashier_name}"\n`;
        });

        const uri = encodeURI(csv);
        const a = document.createElement("a");
        a.setAttribute("href", uri);
        a.setAttribute("download", `Laporan_Penjualan_MeoCafe_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        alert("Gagal ekspor: " + e.message);
      }
    });
  }

  await loadStatistik();
});
