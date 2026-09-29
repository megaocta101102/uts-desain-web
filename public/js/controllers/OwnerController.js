/**
 * ==============================================================================
 * L'AZUR ARTISAN CAFE - OWNER DASHBOARD CONTROLLER (MVC: CONTROLLER LAYER)
 * ==============================================================================
 * Mengatur Dashboard Bento Analytics, CRUD Manajemen Menu, & Ekspor Laporan
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Autentikasi Owner
  const session = window.UserModel.requireAuth('owner');
  if (!session) return;

  const state = {
    search: '',
    type: 'all',
    category: 'all',
    page: 1,
    limit: 6,
    editingMenuId: null
  };

  // DOM Elements
  const ownerNameDisplay = document.getElementById('ownerNameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');
  const ownerMenuTableBody = document.getElementById('ownerMenuTableBody');
  const ownerPagination = document.getElementById('ownerPagination');
  const ownerSearchInput = document.getElementById('ownerSearchInput');
  const ownerTypeFilter = document.getElementById('ownerTypeFilter');
  const addMenuBtn = document.getElementById('addMenuBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  // Menu Modal DOM
  const menuModal = document.getElementById('menuModal');
  const menuModalTitle = document.getElementById('menuModalTitle');
  const closeMenuModalBtn = document.getElementById('closeMenuModal');
  const menuForm = document.getElementById('menuForm');
  const menuNameInput = document.getElementById('menuNameInput');
  const menuPriceInput = document.getElementById('menuPriceInput');
  const menuTypeSelect = document.getElementById('menuTypeSelect');
  const menuCategoryInput = document.getElementById('menuCategoryInput');
  const menuDescInput = document.getElementById('menuDescInput');
  const menuImageUrlInput = document.getElementById('menuImageUrlInput');
  const menuAvailableInput = document.getElementById('menuAvailableInput');
  const previewImg = document.getElementById('formImagePreview');
  const imagePresetButtons = document.querySelectorAll('.img-preset-btn');

  if (ownerNameDisplay) ownerNameDisplay.textContent = session.fullName;
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    window.UserModel.logout();
    window.location.href = 'login.html';
  });

  // Load Bento Analytics
  async function loadAnalytics() {
    try {
      const analytics = await window.ReportModel.getBentoAnalytics();
      window.AnalyticsView.renderBentoStats(analytics);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    }
  }

  // Load Menu List Table
  async function loadOwnerMenus() {
    try {
      const result = await window.MenuModel.getFilteredMenus({
        search: state.search,
        type: state.type,
        category: state.category,
        page: state.page,
        limit: state.limit
      });

      window.AnalyticsView.renderOwnerMenuTable(ownerMenuTableBody, result.items, {
        onEdit: (menu) => openEditModal(menu),
        onDelete: (id) => handleDeleteMenu(id),
        onToggleAvailability: (id, currentStatus) => handleToggleAvailability(id, currentStatus)
      });

      window.MenuView.renderPagination(ownerPagination, result.currentPage, result.totalPages, (newPage) => {
        state.page = newPage;
        loadOwnerMenus();
      });
    } catch (e) {
      console.error(e);
    }
  }

  // Modal Handlers
  function openAddModal() {
    state.editingMenuId = null;
    menuModalTitle.textContent = "Tambah Menu Baru";
    menuForm.reset();
    menuImageUrlInput.value = 'assets/images/coffee_signature.jpg';
    if (previewImg) previewImg.src = 'assets/images/coffee_signature.jpg';
    menuAvailableInput.checked = true;
    menuModal.classList.add('active');
  }

  function openEditModal(menu) {
    state.editingMenuId = menu.id;
    menuModalTitle.textContent = "Edit Menu Cafe";
    menuNameInput.value = menu.name;
    menuPriceInput.value = menu.price;
    menuTypeSelect.value = menu.type;
    menuCategoryInput.value = menu.category || 'Specialty Coffee';
    menuDescInput.value = menu.description || '';
    menuImageUrlInput.value = menu.image_url || 'assets/images/coffee_signature.jpg';
    if (previewImg) previewImg.src = menu.image_url || 'assets/images/coffee_signature.jpg';
    menuAvailableInput.checked = menu.is_available !== false;
    menuModal.classList.add('active');
  }

  function closeMenuModal() {
    menuModal.classList.remove('active');
  }

  async function handleToggleAvailability(id, currentStatus) {
    try {
      await window.MenuModel.toggleAvailability(id, currentStatus);
      await loadOwnerMenus();
      await loadAnalytics();
    } catch (e) {
      alert("Gagal memperbarui status ketersediaan");
    }
  }

  async function handleDeleteMenu(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus menu ini dari daftar?")) return;
    try {
      await window.MenuModel.deleteMenu(id);
      await loadOwnerMenus();
      await loadAnalytics();
    } catch (e) {
      alert("Gagal menghapus menu: " + e.message);
    }
  }

  // Export CSV
  async function exportSalesReport() {
    try {
      const orders = await window.AppDatabase.getOrders();
      if (orders.length === 0) {
        alert("Belum ada data transaksi untuk diekspor.");
        return;
      }

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "No Transaksi,Tanggal,Pelanggan,Meja,Tipe,Metode Pembayaran,Total (Rp),Kasir\n";

      orders.forEach(o => {
        const date = new Date(o.created_at).toLocaleString('id-ID');
        csvContent += `"${o.order_number}","${date}","${o.customer_name}","${o.table_number}","${o.order_type}","${o.payment_method}","${o.total_amount}","${o.cashier_name}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Laporan_Penjualan_Lazur_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Gagal mengekspor laporan: " + e.message);
    }
  }

  // Event Listeners
  if (addMenuBtn) addMenuBtn.addEventListener('click', openAddModal);
  if (closeMenuModalBtn) closeMenuModalBtn.addEventListener('click', closeMenuModal);
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportSalesReport);

  if (menuImageUrlInput) {
    menuImageUrlInput.addEventListener('input', (e) => {
      if (previewImg) previewImg.src = e.target.value || 'assets/images/coffee_signature.jpg';
    });
  }

  imagePresetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (menuImageUrlInput) menuImageUrlInput.value = url;
      if (previewImg) previewImg.src = url;
    });
  });

  if (menuForm) {
    menuForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: menuNameInput.value,
        price: Number(menuPriceInput.value),
        type: menuTypeSelect.value,
        category: menuCategoryInput.value,
        description: menuDescInput.value,
        image_url: menuImageUrlInput.value || 'assets/images/coffee_signature.jpg',
        is_available: menuAvailableInput.checked
      };

      try {
        if (state.editingMenuId) {
          await window.MenuModel.updateMenu(state.editingMenuId, payload);
        } else {
          await window.MenuModel.createMenu(payload);
        }
        closeMenuModal();
        await loadOwnerMenus();
        await loadAnalytics();
      } catch (err) {
        alert(err.message || "Gagal menyimpan menu.");
      }
    });
  }

  if (ownerSearchInput) {
    let debounce;
    ownerSearchInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        state.search = e.target.value;
        state.page = 1;
        loadOwnerMenus();
      }, 250);
    });
  }

  if (ownerTypeFilter) {
    ownerTypeFilter.addEventListener('change', (e) => {
      state.type = e.target.value;
      state.page = 1;
      loadOwnerMenus();
    });
  }

  // Initial
  await loadAnalytics();
  await loadOwnerMenus();
});
