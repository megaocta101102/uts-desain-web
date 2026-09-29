/**
 * ==============================================================================
 * L'AZUR ARTISAN CAFE - LANDING CONTROLLER (MVC: CONTROLLER LAYER)
 * ==============================================================================
 * Mengatur interaksi halaman customer: search, filter kategori, pagination, & modal detail
 */

document.addEventListener('DOMContentLoaded', async () => {
  const state = {
    search: '',
    type: 'all',
    category: 'all',
    page: 1,
    limit: 8
  };

  const menuContainer = document.getElementById('menuGrid');
  const paginationContainer = document.getElementById('paginationContainer');
  const searchInput = document.getElementById('searchInput');
  const typeTabs = document.querySelectorAll('.tab-type-btn');
  const categorySelect = document.getElementById('categoryFilter');
  const modalOverlay = document.getElementById('menuDetailModal');
  const modalCloseBtn = document.getElementById('closeModalBtn');
  const toastContainer = document.getElementById('toastContainer');

  // Load Kategori ke Dropdown Filter
  async function loadCategories() {
    if (!categorySelect) return;
    try {
      const categories = await window.MenuModel.getCategories();
      categorySelect.innerHTML = `
        <option value="all">Semua Kategori</option>
        ${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
      `;
    } catch (e) {
      console.error(e);
    }
  }

  // Render Menu List
  async function fetchAndRenderMenus() {
    try {
      const result = await window.MenuModel.getFilteredMenus({
        search: state.search,
        type: state.type,
        category: state.category,
        page: state.page,
        limit: state.limit
      });

      window.MenuView.renderCustomerMenuGrid(menuContainer, result.items, (item) => {
        openMenuDetail(item);
      });

      window.MenuView.renderPagination(paginationContainer, result.currentPage, result.totalPages, (newPage) => {
        state.page = newPage;
        fetchAndRenderMenus();
        // Scroll halus ke header menu
        document.getElementById('menuSection')?.scrollIntoView({ behavior: 'smooth' });
      });
    } catch (e) {
      console.error(e);
    }
  }

  // Modal Detail Handlers
  function openMenuDetail(item) {
    if (!modalOverlay) return;
    document.getElementById('modalMenuImg').src = item.image_url || 'assets/images/coffee_signature.jpg';
    document.getElementById('modalMenuName').textContent = item.name;
    document.getElementById('modalMenuPrice').textContent = window.MenuView.formatCurrency(item.price);
    document.getElementById('modalMenuDesc').textContent = item.description || 'Hidangan racikan khusus artisan kami.';
    document.getElementById('modalMenuType').textContent = item.type;
    document.getElementById('modalMenuCategory').textContent = item.category || 'Specialty';
    document.getElementById('modalMenuStatus').textContent = item.is_available ? 'Tersedia' : 'Habis';
    document.getElementById('modalMenuStatus').style.color = item.is_available ? 'var(--success)' : 'var(--danger)';

    modalOverlay.classList.add('active');
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove('active');
  }

  // Event Listeners
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.search = e.target.value;
        state.page = 1;
        fetchAndRenderMenus();
      }, 250);
    });
  }

  typeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      typeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.type = tab.getAttribute('data-type') || 'all';
      state.page = 1;
      fetchAndRenderMenus();
    });
  });

  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      state.category = e.target.value;
      state.page = 1;
      fetchAndRenderMenus();
    });
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Initialize
  await loadCategories();
  await fetchAndRenderMenus();
});
