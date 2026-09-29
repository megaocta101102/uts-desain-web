/**
 * ==============================================================================
 * MEO CAFE - OWNER MANAJEMEN MENU & TOPPING CONTROLLER
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  const session = window.UserModel.requireAuth('owner');
  if (!session) return;

  const state = {
    currentTab: 'menus',
    search: '',
    type: 'all',
    category: 'all',
    page: 1,
    limit: 6,
    editingMenuId: null,
    editingToppingId: null
  };

  const ownerNameDisplay = document.getElementById('ownerNameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');
  const mainViewTabs = document.querySelectorAll('.main-view-tab');
  const menuSectionView = document.getElementById('menuSectionView');
  const toppingSectionView = document.getElementById('toppingSectionView');

  // Buttons on Top
  const addMenuBtn = document.getElementById('addMenuBtn');
  const addToppingBtn = document.getElementById('addToppingBtn');

  // Menu Elements
  const ownerMenuTableBody = document.getElementById('ownerMenuTableBody');
  const ownerPagination = document.getElementById('ownerPagination');
  const ownerSearchInput = document.getElementById('ownerSearchInput');
  const ownerTypeFilter = document.getElementById('ownerTypeFilter');

  // Menu Modal Elements
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

  // Topping Elements
  const toppingTableBody = document.getElementById('toppingTableBody');
  const toppingModal = document.getElementById('toppingModal');
  const toppingModalTitle = document.getElementById('toppingModalTitle');
  const closeToppingModalBtn = document.getElementById('closeToppingModal');
  const toppingForm = document.getElementById('toppingForm');
  const toppingNameInput = document.getElementById('toppingNameInput');
  const toppingPriceInput = document.getElementById('toppingPriceInput');
  const toppingAvailableInput = document.getElementById('toppingAvailableInput');

  if (ownerNameDisplay) ownerNameDisplay.textContent = session.fullName;
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    window.UserModel.logout();
    window.location.href = 'login.html';
  });

  // Tab Switcher
  mainViewTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      mainViewTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentTab = tab.getAttribute('data-tab');

      if (state.currentTab === 'menus') {
        menuSectionView.style.display = 'flex';
        toppingSectionView.style.display = 'none';
        addMenuBtn.style.display = 'inline-flex';
        addToppingBtn.style.display = 'none';
      } else {
        menuSectionView.style.display = 'none';
        toppingSectionView.style.display = 'flex';
        addMenuBtn.style.display = 'none';
        addToppingBtn.style.display = 'inline-flex';
        loadOwnerToppings();
      }
    });
  });

  // ==========================================
  // 1. MENU CRUD LOGIC
  // ==========================================
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
        onEdit: (menu) => openEditMenuModal(menu),
        onDelete: (id) => handleDeleteMenu(id),
        onToggleAvailability: (id, currentStatus) => handleToggleMenuAvailability(id, currentStatus)
      });

      window.MenuView.renderPagination(ownerPagination, result.currentPage, result.totalPages, (newPage) => {
        state.page = newPage;
        loadOwnerMenus();
      });
    } catch (e) {
      console.error(e);
    }
  }

  function openAddMenuModal() {
    state.editingMenuId = null;
    menuModalTitle.textContent = "Tambah Menu Meo Cafe";
    menuForm.reset();
    menuImageUrlInput.value = 'assets/images/coffee_signature.jpg';
    if (previewImg) previewImg.src = 'assets/images/coffee_signature.jpg';
    menuAvailableInput.checked = true;
    menuModal.classList.add('active');
  }

  function openEditMenuModal(menu) {
    state.editingMenuId = menu.id;
    menuModalTitle.textContent = "Edit Menu Meo Cafe";
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

  function closeMenuModalHandler() {
    menuModal.classList.remove('active');
  }

  async function handleToggleMenuAvailability(id, currentStatus) {
    try {
      await window.MenuModel.toggleAvailability(id, currentStatus);
      await loadOwnerMenus();
    } catch (e) {
      alert("Gagal memperbarui status ketersediaan");
    }
  }

  async function handleDeleteMenu(id) {
    if (!confirm("Hapus menu ini dari daftar Meo Cafe?")) return;
    try {
      await window.MenuModel.deleteMenu(id);
      await loadOwnerMenus();
    } catch (e) {
      alert("Gagal menghapus: " + e.message);
    }
  }

  if (addMenuBtn) addMenuBtn.addEventListener('click', openAddMenuModal);
  if (closeMenuModalBtn) closeMenuModalBtn.addEventListener('click', closeMenuModalHandler);

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
        closeMenuModalHandler();
        await loadOwnerMenus();
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

  // ==========================================
  // 2. TOPPING CRUD LOGIC
  // ==========================================
  async function loadOwnerToppings() {
    try {
      const toppings = await window.ToppingModel.getAllToppings(false);
      if (!toppingTableBody) return;

      if (toppings.length === 0) {
        toppingTableBody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">
              Belum ada topping / add-on terdaftar.
            </td>
          </tr>
        `;
        return;
      }

      toppingTableBody.innerHTML = toppings.map(t => `
        <tr data-id="${t.id}">
          <td>
            <strong style="color: var(--navy-accent); font-size: 0.95rem;">${t.name}</strong>
          </td>
          <td class="tabular-nums" style="font-weight: 700; color: var(--primary-blue);">
            +${window.MenuView.formatCurrency(t.price)}
          </td>
          <td>
            <button class="status-toggle-badge ${t.is_available !== false ? 'status-available' : 'status-soldout'} btn-toggle-topping" data-id="${t.id}" data-status="${t.is_available !== false}">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
              ${t.is_available !== false ? 'Tersedia' : 'Habis'}
            </button>
          </td>
          <td>
            <div class="table-actions">
              <button class="action-icon-btn btn-edit-topping" data-id="${t.id}" title="Edit Topping">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="action-icon-btn delete btn-delete-topping" data-id="${t.id}" title="Hapus Topping">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      // Event Listeners for Topping Table
      toppingTableBody.querySelectorAll('.btn-toggle-topping').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const current = btn.getAttribute('data-status') === 'true';
          try {
            await window.ToppingModel.toggleAvailability(id, current);
            await loadOwnerToppings();
          } catch (e) {
            alert("Gagal mengubah status topping");
          }
        });
      });

      toppingTableBody.querySelectorAll('.btn-edit-topping').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const topping = toppings.find(t => t.id === id);
          if (topping) openEditToppingModal(topping);
        });
      });

      toppingTableBody.querySelectorAll('.btn-delete-topping').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (confirm("Hapus topping ini dari daftar Meo Cafe?")) {
            try {
              await window.ToppingModel.deleteTopping(id);
              await loadOwnerToppings();
            } catch (e) {
              alert("Gagal menghapus topping: " + e.message);
            }
          }
        });
      });

    } catch (e) {
      console.error(e);
    }
  }

  function openAddToppingModal() {
    state.editingToppingId = null;
    toppingModalTitle.textContent = "Tambah Topping Baru";
    toppingForm.reset();
    toppingAvailableInput.checked = true;
    toppingModal.classList.add('active');
  }

  function openEditToppingModal(topping) {
    state.editingToppingId = topping.id;
    toppingModalTitle.textContent = "Edit Topping / Add-on";
    toppingNameInput.value = topping.name;
    toppingPriceInput.value = topping.price;
    toppingAvailableInput.checked = topping.is_available !== false;
    toppingModal.classList.add('active');
  }

  function closeToppingModalHandler() {
    toppingModal.classList.remove('active');
  }

  if (addToppingBtn) addToppingBtn.addEventListener('click', openAddToppingModal);
  if (closeToppingModalBtn) closeToppingModalBtn.addEventListener('click', closeToppingModalHandler);

  if (toppingForm) {
    toppingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: toppingNameInput.value.trim(),
        price: Number(toppingPriceInput.value) || 0,
        is_available: toppingAvailableInput.checked
      };

      try {
        if (state.editingToppingId) {
          await window.ToppingModel.updateTopping(state.editingToppingId, payload);
        } else {
          await window.ToppingModel.createTopping(payload);
        }
        closeToppingModalHandler();
        await loadOwnerToppings();
      } catch (err) {
        alert(err.message || "Gagal menyimpan topping.");
      }
    });
  }

  await loadOwnerMenus();
});
