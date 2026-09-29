/**
 * ==============================================================================
 * MEO CAFE - DATABASE CONNECTOR (SUPABASE REST + LOCAL STORAGE FALLBACK)
 * ==============================================================================
 */

window.AppDatabase = (function() {
  const isSupabaseConfigured = () => {
    return Boolean(window.ENV && window.ENV.SUPABASE_URL && window.ENV.SUPABASE_ANON_KEY);
  };

  const INITIAL_SEED = {
    users: [
      { id: 'usr-1', username: 'kasir', password: 'kasir123', full_name: 'Kasir Cindy', role: 'kasir', created_at: new Date().toISOString() },
      { id: 'usr-2', username: 'owner', password: 'owner123', full_name: 'Mega Octa', role: 'owner', created_at: new Date().toISOString() }
    ],
    categories: [
      { id: 'cat-1', name: 'Specialty Coffee', slug: 'specialty-coffee', display_order: 1 },
      { id: 'cat-2', name: 'Artisan Tea & Mocktail', slug: 'artisan-tea-mocktail', display_order: 2 },
      { id: 'cat-3', name: 'Signature Main Course', slug: 'signature-main-course', display_order: 3 },
      { id: 'cat-4', name: 'Light Bites & Fries', slug: 'light-bites-fries', display_order: 4 },
      { id: 'cat-5', name: 'French Pastry & Dessert', slug: 'french-pastry-dessert', display_order: 5 }
    ],
    toppings: [
      { id: 'top-1', name: 'Extra Espresso Shot', price: 6000, is_available: true },
      { id: 'top-2', name: 'Oat Milk Substitution', price: 8000, is_available: true },
      { id: 'top-3', name: 'Cloud Cheese Foam', price: 6000, is_available: true },
      { id: 'top-4', name: 'Boba Brown Sugar', price: 5000, is_available: true },
      { id: 'top-5', name: 'Grass Jelly Cincau', price: 4000, is_available: true },
      { id: 'top-6', name: 'Vanilla Syrup', price: 5000, is_available: true },
      { id: 'top-7', name: 'Caramel Drizzle', price: 5000, is_available: true },
      { id: 'top-8', name: 'Hazelnut Syrup', price: 5000, is_available: true }
    ],
    menus: [
      {
        id: 'menu-1',
        name: "Meo Velvet Blue Latte",
        price: 42000,
        description: "Signature espresso blend dengan susu oat creamy, infused blue pea flower dan vanila madagascar aromatik.",
        type: "minuman",
        category: "Specialty Coffee",
        image_url: "assets/images/coffee_signature.jpg",
        is_available: true
      },
      {
        id: 'menu-2',
        name: "Espresso Single Origin Gayo",
        price: 28000,
        description: "Ekstraksi murni 100% Arabica Aceh Gayo dengan tasting notes dark chocolate, plum, dan jasmine.",
        type: "minuman",
        category: "Specialty Coffee",
        image_url: "assets/images/coffee_signature.jpg",
        is_available: true
      },
      {
        id: 'menu-3',
        name: "Iced Spanish Sea Salt Latte",
        price: 45000,
        description: "Double shot espresso, susu kental manis karamel, fresh milk, dan foam sea salt blue velvet yang gurih lembut.",
        type: "minuman",
        category: "Specialty Coffee",
        image_url: "assets/images/coffee_signature.jpg",
        is_available: true
      },
      {
        id: 'menu-4',
        name: "Ocean Breeze Sapphire Mocktail",
        price: 48000,
        description: "Mocktail lapis estetik dengan sirup curacao biru alami, perasan jeruk yuzu jepang, soda dingin, dan rosemary.",
        type: "minuman",
        category: "Artisan Tea & Mocktail",
        image_url: "assets/images/mocktail_ocean.jpg",
        is_available: true
      },
      {
        id: 'menu-5',
        name: "Earl Grey French Lavender",
        price: 38000,
        description: "Seduhan teh artisan daun hitam premium dengan aroma lavender organik provence dan potongan citrus kering.",
        type: "minuman",
        category: "Artisan Tea & Mocktail",
        image_url: "assets/images/mocktail_ocean.jpg",
        is_available: true
      },
      {
        id: 'menu-6',
        name: "Matcha Cloud Ceremonial",
        price: 46000,
        description: "Matcha Uji Kyoto grade seremonial dipadu susu segar dingin dan toping cloud foam lembut.",
        type: "minuman",
        category: "Artisan Tea & Mocktail",
        image_url: "assets/images/coffee_signature.jpg",
        is_available: true
      },
      {
        id: 'menu-7',
        name: "Truffle Cream Fettuccine",
        price: 78000,
        description: "Pasta fettuccine al dente dengan saus pasta krim jamur champignon, sentuhan minyak black truffle, dan keju Grana Padano.",
        type: "makanan",
        category: "Signature Main Course",
        image_url: "assets/images/hero_cafe.jpg",
        is_available: true
      },
      {
        id: 'menu-8',
        name: "Seared Salmon with Lemon Caper",
        price: 115000,
        description: "Fillet salmon Norwegia pan-seared renyah dengan mashed potato mentega Prancis, asparagus, dan saus lemon caper segar.",
        type: "makanan",
        category: "Signature Main Course",
        image_url: "assets/images/hero_cafe.jpg",
        is_available: true
      },
      {
        id: 'menu-9',
        name: "Wagyu Beef Cubes Rice Bowl",
        price: 88000,
        description: "Daging Wagyu tenderloin potong dadu dengan saus tare manis gurih, onsen egg, dan nasi Jepang pulen berbalut nori.",
        type: "makanan",
        category: "Signature Main Course",
        image_url: "assets/images/hero_cafe.jpg",
        is_available: true
      },
      {
        id: 'menu-10',
        name: "Artisan Almond Croissant",
        price: 36000,
        description: "Pastry Prancis berlapis garing dengan isian krim frangipane almond manis dan taburan kacang almond panggang.",
        type: "snack",
        category: "French Pastry & Dessert",
        image_url: "assets/images/dessert_pastry.jpg",
        is_available: true
      },
      {
        id: 'menu-11',
        name: "Wild Blueberry Cream Tartlet",
        price: 42000,
        description: "Tart shell renyah mentega dengan vanilla bean custard lembut dan buah blueberry segar pilihan.",
        type: "snack",
        category: "French Pastry & Dessert",
        image_url: "assets/images/dessert_pastry.jpg",
        is_available: true
      },
      {
        id: 'menu-12',
        name: "Truffle Parmesan Hand-cut Fries",
        price: 38000,
        description: "Kentang goreng renyah dipanggang minyak white truffle, parutan keju parmesan berlimpah, dan saus garlic aioli.",
        type: "snack",
        category: "Light Bites & Fries",
        image_url: "assets/images/dessert_pastry.jpg",
        is_available: true
      }
    ],
    orders: [
      {
        id: 'ord-101',
        order_number: 'ORD-20260929-001',
        table_number: 'Meja 04',
        order_type: 'dine_in',
        customer_name: 'Bpk. Hendra',
        cashier_name: 'Kasir Cindy',
        subtotal: 130000,
        tax: 13000,
        discount: 0,
        total_amount: 143000,
        payment_method: 'qris',
        payment_status: 'paid',
        notes: '',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        items: [
          { menu_name: "Meo Velvet Blue Latte", size: "Medium", topping: "Cheese Foam", price: 53000, quantity: 2, subtotal: 106000, notes: 'Less sugar' },
          { menu_name: "Artisan Almond Croissant", size: "Regular", topping: "", price: 36000, quantity: 1, subtotal: 36000, notes: '' }
        ]
      },
      {
        id: 'ord-102',
        order_number: 'ORD-20260929-002',
        table_number: 'Takeaway',
        order_type: 'take_away',
        customer_name: 'Ibu Nadia',
        cashier_name: 'Kasir Cindy',
        subtotal: 78000,
        tax: 7800,
        discount: 0,
        total_amount: 85800,
        payment_method: 'cash',
        payment_status: 'paid',
        notes: 'Bungkus rapi',
        created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        items: [
          { menu_name: "Truffle Cream Fettuccine", size: "Regular", topping: "", price: 78000, quantity: 1, subtotal: 78000, notes: 'Extra cheese' }
        ]
      }
    ]
  };

  const initLocalStorage = () => {
    if (!localStorage.getItem('MEO_USERS')) {
      localStorage.setItem('MEO_USERS', JSON.stringify(INITIAL_SEED.users));
    }
    if (!localStorage.getItem('MEO_MENUS')) {
      localStorage.setItem('MEO_MENUS', JSON.stringify(INITIAL_SEED.menus));
    }
    if (!localStorage.getItem('MEO_TOPPINGS')) {
      localStorage.setItem('MEO_TOPPINGS', JSON.stringify(INITIAL_SEED.toppings));
    }
    if (!localStorage.getItem('MEO_ORDERS')) {
      localStorage.setItem('MEO_ORDERS', JSON.stringify(INITIAL_SEED.orders));
    }
    if (!localStorage.getItem('MEO_CATEGORIES')) {
      localStorage.setItem('MEO_CATEGORIES', JSON.stringify(INITIAL_SEED.categories));
    }
  };

  initLocalStorage();

  async function querySupabase(table, method = 'GET', body = null, params = '') {
    if (window.ENV && typeof window.ENV.init === 'function') {
      await window.ENV.init();
    }
    
    if (!window.ENV.SUPABASE_URL || !window.ENV.SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not set in ENV");
    }

    const url = `${window.ENV.SUPABASE_URL}/rest/v1/${table}${params ? '?' + params : ''}`;
    const headers = {
      'apikey': window.ENV.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${window.ENV.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    if (!res.ok) {
      let errText = '';
      try {
        const errJson = await res.json();
        errText = errJson.message || errJson.error || JSON.stringify(errJson);
      } catch (e) {
        errText = await res.text();
      }
      throw new Error(`Supabase [${table}] ${res.status}: ${errText || res.statusText}`);
    }
    return await res.json();
  }

  return {
    isLiveSupabase: isSupabaseConfigured,

    // MENUS
    async getMenus() {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      if (isSupabaseConfigured()) {
        try {
          const remoteMenus = await querySupabase('menus', 'GET', null, 'order=created_at.desc');
          if (Array.isArray(remoteMenus) && remoteMenus.length > 0) {
            localStorage.setItem('MEO_MENUS', JSON.stringify(remoteMenus));
            return remoteMenus;
          }
        } catch (e) {
          console.warn('Supabase menus fallback:', e.message);
        }
      }
      return JSON.parse(localStorage.getItem('MEO_MENUS') || '[]');
    },

    async saveMenus(menus) {
      localStorage.setItem('MEO_MENUS', JSON.stringify(menus));
    },

    async insertMenu(menuItem) {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      const localItem = {
        ...menuItem,
        id: menuItem.id || 'menu-' + Date.now(),
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured()) {
        try {
          // Prepare for Supabase (do not send string ID if Supabase uses UUID)
          const payload = { ...menuItem };
          delete payload.id;
          const res = await querySupabase('menus', 'POST', payload);
          if (Array.isArray(res) && res[0]) {
            const inserted = res[0];
            const menus = JSON.parse(localStorage.getItem('MEO_MENUS') || '[]');
            menus.unshift(inserted);
            localStorage.setItem('MEO_MENUS', JSON.stringify(menus));
            return inserted;
          }
        } catch (e) {
          console.warn('Supabase menu insert failed, saving locally:', e.message);
        }
      }

      const menus = JSON.parse(localStorage.getItem('MEO_MENUS') || '[]');
      menus.unshift(localItem);
      localStorage.setItem('MEO_MENUS', JSON.stringify(menus));
      return localItem;
    },

    async updateMenu(id, updatedFields) {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      if (isSupabaseConfigured()) {
        try {
          await querySupabase('menus', 'PATCH', updatedFields, `id=eq.${id}`);
        } catch (e) {
          console.warn('Supabase menu update failed, saving locally:', e.message);
        }
      }
      const menus = JSON.parse(localStorage.getItem('MEO_MENUS') || '[]');
      const index = menus.findIndex(m => m.id === id);
      if (index !== -1) {
        menus[index] = { ...menus[index], ...updatedFields, updated_at: new Date().toISOString() };
        localStorage.setItem('MEO_MENUS', JSON.stringify(menus));
      }
      return true;
    },

    async deleteMenu(id) {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      if (isSupabaseConfigured()) {
        try {
          await querySupabase('menus', 'DELETE', null, `id=eq.${id}`);
        } catch (e) {
          console.warn('Supabase menu delete failed, deleting locally:', e.message);
        }
      }
      let menus = JSON.parse(localStorage.getItem('MEO_MENUS') || '[]');
      menus = menus.filter(m => m.id !== id);
      localStorage.setItem('MEO_MENUS', JSON.stringify(menus));
      return true;
    },

    // TOPPINGS (ADD-ONS)
    async getToppings() {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      if (isSupabaseConfigured()) {
        try {
          const remoteToppings = await querySupabase('toppings', 'GET', null, 'order=created_at.desc');
          if (Array.isArray(remoteToppings) && remoteToppings.length > 0) {
            localStorage.setItem('MEO_TOPPINGS', JSON.stringify(remoteToppings));
            return remoteToppings;
          }
        } catch (e) {
          console.warn('Supabase toppings fallback:', e.message);
        }
      }
      return JSON.parse(localStorage.getItem('MEO_TOPPINGS') || '[]');
    },

    async saveToppings(toppings) {
      localStorage.setItem('MEO_TOPPINGS', JSON.stringify(toppings));
    },

    async insertTopping(toppingItem) {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      const localItem = {
        ...toppingItem,
        id: toppingItem.id || 'top-' + Date.now(),
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured()) {
        try {
          const payload = { ...toppingItem };
          delete payload.id;
          const res = await querySupabase('toppings', 'POST', payload);
          if (Array.isArray(res) && res[0]) {
            const inserted = res[0];
            const toppings = JSON.parse(localStorage.getItem('MEO_TOPPINGS') || '[]');
            toppings.unshift(inserted);
            localStorage.setItem('MEO_TOPPINGS', JSON.stringify(toppings));
            return inserted;
          }
        } catch (e) {
          console.warn('Supabase topping insert failed, saving locally:', e.message);
        }
      }

      const toppings = JSON.parse(localStorage.getItem('MEO_TOPPINGS') || '[]');
      toppings.unshift(localItem);
      localStorage.setItem('MEO_TOPPINGS', JSON.stringify(toppings));
      return localItem;
    },

    async updateTopping(id, updatedFields) {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      if (isSupabaseConfigured()) {
        try {
          await querySupabase('toppings', 'PATCH', updatedFields, `id=eq.${id}`);
        } catch (e) {
          console.warn('Supabase topping update failed:', e.message);
        }
      }
      const toppings = JSON.parse(localStorage.getItem('MEO_TOPPINGS') || '[]');
      const index = toppings.findIndex(t => t.id === id);
      if (index !== -1) {
        toppings[index] = { ...toppings[index], ...updatedFields, updated_at: new Date().toISOString() };
        localStorage.setItem('MEO_TOPPINGS', JSON.stringify(toppings));
      }
      return true;
    },

    async deleteTopping(id) {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      if (isSupabaseConfigured()) {
        try {
          await querySupabase('toppings', 'DELETE', null, `id=eq.${id}`);
        } catch (e) {
          console.warn('Supabase topping delete failed:', e.message);
        }
      }
      let toppings = JSON.parse(localStorage.getItem('MEO_TOPPINGS') || '[]');
      toppings = toppings.filter(t => t.id !== id);
      localStorage.setItem('MEO_TOPPINGS', JSON.stringify(toppings));
      return true;
    },

    // ORDERS
    async getOrders() {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      if (isSupabaseConfigured()) {
        try {
          const remoteOrders = await querySupabase('orders', 'GET', null, 'order=created_at.desc');
          if (Array.isArray(remoteOrders) && remoteOrders.length > 0) {
            localStorage.setItem('MEO_ORDERS', JSON.stringify(remoteOrders));
            return remoteOrders;
          }
        } catch (e) {
          console.warn('Supabase get orders fallback:', e.message);
        }
      }
      return JSON.parse(localStorage.getItem('MEO_ORDERS') || '[]');
    },

    async insertOrder(orderData) {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      const localOrder = {
        ...orderData,
        id: orderData.id || 'ord-' + Date.now(),
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured()) {
        try {
          // 1. Separate order main from order items
          const { items, ...orderMain } = orderData;
          delete orderMain.id;
          
          const res = await querySupabase('orders', 'POST', orderMain);
          if (Array.isArray(res) && res[0]) {
            const insertedOrder = res[0];
            // 2. Insert items if table exists
            if (Array.isArray(items) && items.length > 0) {
              const itemsPayload = items.map(it => ({
                order_id: insertedOrder.id,
                menu_name: it.menu_name || it.name,
                size: it.size || 'Small',
                topping: it.topping || '',
                price: it.price || 0,
                quantity: it.quantity || 1,
                subtotal: it.subtotal || (it.price * it.quantity),
                notes: it.notes || ''
              }));
              try {
                await querySupabase('order_items', 'POST', itemsPayload);
              } catch (itemErr) {
                console.warn('Insert order items warning:', itemErr.message);
              }
            }
            const completeOrder = { ...insertedOrder, items: items || [] };
            const orders = JSON.parse(localStorage.getItem('MEO_ORDERS') || '[]');
            orders.unshift(completeOrder);
            localStorage.setItem('MEO_ORDERS', JSON.stringify(orders));
            return completeOrder;
          }
        } catch (e) {
          console.warn('Supabase order insert failed, saving locally:', e.message);
        }
      }

      const orders = JSON.parse(localStorage.getItem('MEO_ORDERS') || '[]');
      orders.unshift(localOrder);
      localStorage.setItem('MEO_ORDERS', JSON.stringify(orders));
      return localOrder;
    },

    // USERS (CASHIER & OWNER AUTH / CRUD)
    async getUsers() {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      if (isSupabaseConfigured()) {
        try {
          const remoteUsers = await querySupabase('users', 'GET', null, 'order=created_at.desc');
          if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
            localStorage.setItem('MEO_USERS', JSON.stringify(remoteUsers));
            return remoteUsers;
          }
        } catch (e) {
          console.warn('Supabase users fallback:', e.message);
        }
      }
      return JSON.parse(localStorage.getItem('MEO_USERS') || '[]');
    },

    async saveUsers(users) {
      localStorage.setItem('MEO_USERS', JSON.stringify(users));
    },

    async insertUser(userItem) {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      const localUser = {
        ...userItem,
        id: userItem.id || 'usr-' + Date.now(),
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured()) {
        try {
          const payload = {
            username: userItem.username.trim(),
            password: userItem.password.trim(),
            full_name: userItem.full_name.trim(),
            role: userItem.role || 'kasir'
          };
          const res = await querySupabase('users', 'POST', payload);
          if (Array.isArray(res) && res[0]) {
            const inserted = res[0];
            const users = JSON.parse(localStorage.getItem('MEO_USERS') || '[]');
            // Update or add locally
            const existingIdx = users.findIndex(u => u.username.toLowerCase() === inserted.username.toLowerCase());
            if (existingIdx !== -1) {
              users[existingIdx] = inserted;
            } else {
              users.unshift(inserted);
            }
            localStorage.setItem('MEO_USERS', JSON.stringify(users));
            return inserted;
          }
        } catch (e) {
          console.warn('Supabase user insert failed, saving locally:', e.message);
          // If error is unique violation, throw error so UI alerts user
          if (e.message && e.message.includes('unique')) {
            throw new Error("Username tersebut sudah terdaftar di database Supabase.");
          }
        }
      }

      // Local storage fallback
      const users = JSON.parse(localStorage.getItem('MEO_USERS') || '[]');
      users.unshift(localUser);
      localStorage.setItem('MEO_USERS', JSON.stringify(users));
      return localUser;
    },

    async updateUser(id, updatedFields) {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      if (isSupabaseConfigured()) {
        try {
          const payload = { ...updatedFields, updated_at: new Date().toISOString() };
          // Match by id or username
          if (id.startsWith('usr-')) {
            if (updatedFields.username) {
              await querySupabase('users', 'PATCH', payload, `username=eq.${updatedFields.username}`);
            }
          } else {
            await querySupabase('users', 'PATCH', payload, `id=eq.${id}`);
          }
        } catch (e) {
          console.warn('Supabase user update failed, saving locally:', e.message);
        }
      }

      const users = JSON.parse(localStorage.getItem('MEO_USERS') || '[]');
      const index = users.findIndex(u => u.id === id || (updatedFields.username && u.username === updatedFields.username));
      if (index !== -1) {
        users[index] = { ...users[index], ...updatedFields, updated_at: new Date().toISOString() };
        localStorage.setItem('MEO_USERS', JSON.stringify(users));
      }
      return true;
    },

    async deleteUser(id) {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      let users = JSON.parse(localStorage.getItem('MEO_USERS') || '[]');
      const targetUser = users.find(u => u.id === id);

      if (isSupabaseConfigured()) {
        try {
          if (id.startsWith('usr-') && targetUser) {
            await querySupabase('users', 'DELETE', null, `username=eq.${targetUser.username}`);
          } else {
            await querySupabase('users', 'DELETE', null, `id=eq.${id}`);
          }
        } catch (e) {
          console.warn('Supabase user delete failed, deleting locally:', e.message);
        }
      }

      users = users.filter(u => u.id !== id);
      localStorage.setItem('MEO_USERS', JSON.stringify(users));
      return true;
    },

    // CATEGORIES
    async getCategories() {
      if (window.ENV && typeof window.ENV.init === 'function') await window.ENV.init();
      if (isSupabaseConfigured()) {
        try {
          const remoteCats = await querySupabase('categories', 'GET', null, 'order=display_order.asc');
          if (Array.isArray(remoteCats) && remoteCats.length > 0) {
            localStorage.setItem('MEO_CATEGORIES', JSON.stringify(remoteCats));
            return remoteCats;
          }
        } catch (e) {
          console.warn('Supabase categories fallback:', e.message);
        }
      }
      return JSON.parse(localStorage.getItem('MEO_CATEGORIES') || '[]');
    }
  };
})();
