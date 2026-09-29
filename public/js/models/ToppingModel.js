/**
 * ==============================================================================
 * MEO CAFE - TOPPING MODEL (MVC: MODEL LAYER)
 * ==============================================================================
 */

window.ToppingModel = {
  async getAllToppings(availableOnly = false) {
    const list = await window.AppDatabase.getToppings();
    if (availableOnly) {
      return list.filter(t => t.is_available !== false);
    }
    return list;
  },

  async createTopping({ name, price, is_available = true }) {
    if (!name || isNaN(price)) {
      throw new Error("Nama topping dan harga wajib diisi.");
    }
    const payload = {
      name: name.trim(),
      price: Number(price) || 0,
      is_available: is_available !== false
    };
    return await window.AppDatabase.insertTopping(payload);
  },

  async updateTopping(id, { name, price, is_available }) {
    const payload = {
      name: name.trim(),
      price: Number(price) || 0,
      is_available: is_available !== false
    };
    return await window.AppDatabase.updateTopping(id, payload);
  },

  async deleteTopping(id) {
    return await window.AppDatabase.deleteTopping(id);
  },

  async toggleAvailability(id, currentStatus) {
    return await window.AppDatabase.updateTopping(id, {
      is_available: !currentStatus
    });
  }
};
