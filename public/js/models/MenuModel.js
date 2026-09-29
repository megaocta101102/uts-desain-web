/**
 * ==============================================================================
 * L'AZUR ARTISAN CAFE - MENU MODEL (MVC: MODEL LAYER)
 * ==============================================================================
 * Menangani logika filter, search, pagination, dan operasi CRUD Menu
 */

window.MenuModel = {
  async getAllMenus() {
    return await window.AppDatabase.getMenus();
  },

  async getMenuById(id) {
    const menus = await this.getAllMenus();
    return menus.find(m => m.id === id) || null;
  },

  /**
   * Filter & Paginate Menus
   * @param {Object} options - { search, type, category, page, limit, availableOnly }
   */
  async getFilteredMenus({ search = '', type = 'all', category = 'all', page = 1, limit = 8, availableOnly = false }) {
    let list = await this.getAllMenus();

    // Filter Ketersediaan
    if (availableOnly) {
      list = list.filter(item => item.is_available !== false);
    }

    // Filter Search
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(item => 
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }

    // Filter Tipe (makanan, minuman, snack)
    if (type && type !== 'all') {
      list = list.filter(item => item.type && item.type.toLowerCase() === type.toLowerCase());
    }

    // Filter Kategori
    if (category && category !== 'all') {
      list = list.filter(item => item.category && item.category.toLowerCase() === category.toLowerCase());
    }

    const totalItems = list.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (currentPage - 1) * limit;
    const paginatedItems = list.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      totalItems,
      totalPages,
      currentPage,
      limit
    };
  },

  async createMenu(menuData) {
    if (!menuData.name || !menuData.price || !menuData.type) {
      throw new Error("Nama menu, harga, dan tipe wajib diisi.");
    }
    const payload = {
      name: menuData.name.trim(),
      price: Number(menuData.price) || 0,
      description: menuData.description || '',
      type: menuData.type,
      category: menuData.category || 'Specialty Coffee',
      image_url: menuData.image_url || 'assets/images/coffee_signature.jpg',
      is_available: menuData.is_available !== false
    };
    return await window.AppDatabase.insertMenu(payload);
  },

  async updateMenu(id, menuData) {
    const payload = {
      name: menuData.name.trim(),
      price: Number(menuData.price) || 0,
      description: menuData.description || '',
      type: menuData.type,
      category: menuData.category || 'Specialty Coffee',
      image_url: menuData.image_url || 'assets/images/coffee_signature.jpg',
      is_available: menuData.is_available !== false
    };
    return await window.AppDatabase.updateMenu(id, payload);
  },

  async deleteMenu(id) {
    return await window.AppDatabase.deleteMenu(id);
  },

  async toggleAvailability(id, currentStatus) {
    return await window.AppDatabase.updateMenu(id, {
      is_available: !currentStatus
    });
  },

  async getCategories() {
    return await window.AppDatabase.getCategories();
  }
};
