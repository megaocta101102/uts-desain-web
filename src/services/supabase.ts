import { MenuItem, Topping, User, Order } from '../types';
import { fetchAppConfig, DEFAULT_CONFIG } from './config';

const STORAGE_KEYS = {
  USERS: 'meo_users_v2',
  MENUS: 'meo_menus_v2',
  TOPPINGS: 'meo_toppings_v2',
  ORDERS: 'meo_orders_v2',
};

// Default seed data
export const INITIAL_MENUS: MenuItem[] = [
  {
    id: 'm-1',
    name: 'Meo Signature Blue Latte',
    category: 'minuman',
    price: 28000,
    description: 'Espresso arabika spesial dengan butterfly pea flower infuse dan susu segar lembut.',
    image_url: '/assets/images/coffee_signature.jpg',
    status: 'tersedia',
  },
  {
    id: 'm-2',
    name: 'Ocean Breeze Blue Mocktail',
    category: 'minuman',
    price: 26000,
    description: 'Mocktail sparkling dingin menyegarkan dengan sentuhan sirup blue curacao & citrus.',
    image_url: '/assets/images/mocktail_ocean.jpg',
    status: 'tersedia',
  },
  {
    id: 'm-3',
    name: 'Artisan Almond Croissant',
    category: 'makanan',
    price: 32000,
    description: 'Pastry Prancis bermentega renyah dengan taburan almond panggang dan isian krim lembut.',
    image_url: '/assets/images/dessert_pastry.jpg',
    status: 'tersedia',
  },
  {
    id: 'm-4',
    name: 'Iced Americano Classic',
    category: 'minuman',
    price: 22000,
    description: 'Double shot espresso blend arabika dingin dengan notes floral dan cokelat pekat.',
    image_url: '/assets/images/coffee_signature.jpg',
    status: 'tersedia',
  },
  {
    id: 'm-5',
    name: 'Japanese Uji Matcha Latte',
    category: 'minuman',
    price: 28000,
    description: 'Matcha ceremonial grade asli Kyoto dengan susu steamed velvety dan foam creamy.',
    image_url: '/assets/images/mocktail_ocean.jpg',
    status: 'tersedia',
  },
  {
    id: 'm-6',
    name: 'Crispy Truffle Potato Wedges',
    category: 'snack',
    price: 25000,
    description: 'Kentang wedges goreng renyah bumbu minyak truffle aromatik & keju parmesan parut.',
    image_url: '/assets/images/dessert_pastry.jpg',
    status: 'tersedia',
  },
  {
    id: 'm-7',
    name: 'Smoked Beef Croissant Sandwich',
    category: 'makanan',
    price: 38000,
    description: 'Croissant renyah dengan isian daging sapi asap premium, keju cheddar meleleh, dan saus tartar.',
    image_url: '/assets/images/dessert_pastry.jpg',
    status: 'tersedia',
  },
  {
    id: 'm-8',
    name: 'Golden Cheese Churros',
    category: 'snack',
    price: 24000,
    description: 'Churros keju gurih renyah disajikan dengan dipping sauce salted caramel lezat.',
    image_url: '/assets/images/dessert_pastry.jpg',
    status: 'tersedia',
  },
];

export const INITIAL_TOPPINGS: Topping[] = [
  { id: 't-1', name: 'Extra Espresso Shot', price: 6000, category: 'minuman', status: 'tersedia' },
  { id: 't-2', name: 'Oat Milk Upgrade', price: 8000, category: 'minuman', status: 'tersedia' },
  { id: 't-3', name: 'Brown Sugar Boba', price: 5000, category: 'minuman', status: 'tersedia' },
  { id: 't-4', name: 'Salted Caramel Drizzle', price: 4000, category: 'all', status: 'tersedia' },
  { id: 't-5', name: 'Whipped Cream Velvety', price: 5000, category: 'minuman', status: 'tersedia' },
  { id: 't-6', name: 'Melted Cheddar Cheese', price: 7000, category: 'makanan', status: 'tersedia' },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-owner-1',
    username: 'owner',
    password: 'owner123',
    name: 'Mega Octa (Owner)',
    role: 'owner',
    status: 'aktif',
    created_at: new Date().toISOString(),
  },
  {
    id: 'usr-kasir-1',
    username: 'kasir',
    password: 'kasir123',
    name: 'Kasir Utama',
    role: 'kasir',
    status: 'aktif',
    created_at: new Date().toISOString(),
  },
];

class DatabaseService {
  private config = DEFAULT_CONFIG;
  private initialized = false;

  async init() {
    if (this.initialized) return;
    this.config = await fetchAppConfig();
    this.initLocalSeeds();
    this.initialized = true;
  }

  private initLocalSeeds() {
    if (!localStorage.getItem(STORAGE_KEYS.MENUS)) {
      localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(INITIAL_MENUS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TOPPINGS)) {
      localStorage.setItem(STORAGE_KEYS.TOPPINGS, JSON.stringify(INITIAL_TOPPINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
  }

  private getHeaders() {
    return {
      'apikey': this.config.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.config.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
  }

  // ================= USERS =================
  async getUsers(): Promise<User[]> {
    await this.init();
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/users?select=*&order=created_at.desc`, {
          headers: this.getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data));
            return data;
          }
        }
      } catch (err) {
        console.warn('Supabase fetch users failed, fallback to local', err);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.USERS);
    return local ? JSON.parse(local) : INITIAL_USERS;
  }

  async insertUser(user: Partial<User>): Promise<User> {
    await this.init();
    const newUser: User = {
      id: user.id || `usr-${Date.now()}`,
      username: user.username?.trim().toLowerCase() || '',
      password: user.password || '',
      name: user.name || user.username || 'Kasir',
      role: user.role || 'kasir',
      status: user.status || 'aktif',
      created_at: new Date().toISOString(),
    };

    // Try Supabase insert
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const payload: Record<string, any> = {
          username: newUser.username,
          password: newUser.password,
          name: newUser.name,
          role: newUser.role,
          status: newUser.status,
        };
        // only include id if uuid valid, else let db generate
        if (newUser.id.length === 36 && newUser.id.includes('-')) {
          payload.id = newUser.id;
        }

        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          if (created && created[0]) {
            newUser.id = created[0].id;
          }
        }
      } catch (err) {
        console.warn('Supabase insert user failed, saved locally', err);
      }
    }

    const current = await this.getUsers();
    const updated = [newUser, ...current.filter((u) => u.username !== newUser.username && u.id !== newUser.id)];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    return newUser;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | null> {
    await this.init();
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        await fetch(`${this.config.SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(user),
        });
      } catch (err) {
        console.warn('Supabase update user failed, updated locally', err);
      }
    }

    const current = await this.getUsers();
    let updatedUser: User | null = null;
    const updatedList = current.map((u) => {
      if (u.id === id || u.username === user.username) {
        updatedUser = { ...u, ...user };
        return updatedUser;
      }
      return u;
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedList));
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.init();
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        await fetch(`${this.config.SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        });
      } catch (err) {
        console.warn('Supabase delete user failed, deleted locally', err);
      }
    }

    const current = await this.getUsers();
    const updated = current.filter((u) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    return true;
  }

  // ================= MENUS =================
  async getMenus(): Promise<MenuItem[]> {
    await this.init();
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/menus?select=*&order=created_at.asc`, {
          headers: this.getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(data));
            return data;
          }
        }
      } catch (err) {
        console.warn('Supabase fetch menus failed', err);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.MENUS);
    return local ? JSON.parse(local) : INITIAL_MENUS;
  }

  async saveMenu(item: Partial<MenuItem>): Promise<MenuItem> {
    await this.init();
    const newItem: MenuItem = {
      id: item.id || `m-${Date.now()}`,
      name: item.name || '',
      category: item.category || 'minuman',
      price: Number(item.price) || 0,
      description: item.description || '',
      image_url: item.image_url || '/assets/images/coffee_signature.jpg',
      status: item.status || 'tersedia',
      created_at: new Date().toISOString(),
    };

    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/menus`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(newItem),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data[0]) newItem.id = data[0].id;
        }
      } catch (err) {
        console.warn('Supabase save menu failed', err);
      }
    }

    const current = await this.getMenus();
    const updated = [newItem, ...current.filter((m) => m.id !== newItem.id)];
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(updated));
    return newItem;
  }

  async updateMenu(id: string, item: Partial<MenuItem>): Promise<MenuItem | null> {
    await this.init();
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        await fetch(`${this.config.SUPABASE_URL}/rest/v1/menus?id=eq.${id}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(item),
        });
      } catch (err) {
        console.warn('Supabase update menu failed', err);
      }
    }

    const current = await this.getMenus();
    let updatedItem: MenuItem | null = null;
    const updated = current.map((m) => {
      if (m.id === id) {
        updatedItem = { ...m, ...item };
        return updatedItem;
      }
      return m;
    });
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(updated));
    return updatedItem;
  }

  async deleteMenu(id: string): Promise<boolean> {
    await this.init();
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        await fetch(`${this.config.SUPABASE_URL}/rest/v1/menus?id=eq.${id}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        });
      } catch (err) {
        console.warn('Supabase delete menu failed', err);
      }
    }

    const current = await this.getMenus();
    const updated = current.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(updated));
    return true;
  }

  // ================= TOPPINGS =================
  async getToppings(): Promise<Topping[]> {
    await this.init();
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/toppings?select=*&order=name.asc`, {
          headers: this.getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            localStorage.setItem(STORAGE_KEYS.TOPPINGS, JSON.stringify(data));
            return data;
          }
        }
      } catch (err) {
        console.warn('Supabase fetch toppings failed', err);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.TOPPINGS);
    return local ? JSON.parse(local) : INITIAL_TOPPINGS;
  }

  async saveTopping(topping: Partial<Topping>): Promise<Topping> {
    await this.init();
    const newTopping: Topping = {
      id: topping.id || `t-${Date.now()}`,
      name: topping.name || '',
      price: Number(topping.price) || 0,
      category: topping.category || 'minuman',
      status: topping.status || 'tersedia',
      created_at: new Date().toISOString(),
    };

    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/toppings`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(newTopping),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data[0]) newTopping.id = data[0].id;
        }
      } catch (err) {
        console.warn('Supabase save topping failed', err);
      }
    }

    const current = await this.getToppings();
    const updated = [newTopping, ...current.filter((t) => t.id !== newTopping.id)];
    localStorage.setItem(STORAGE_KEYS.TOPPINGS, JSON.stringify(updated));
    return newTopping;
  }

  async deleteTopping(id: string): Promise<boolean> {
    await this.init();
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        await fetch(`${this.config.SUPABASE_URL}/rest/v1/toppings?id=eq.${id}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        });
      } catch (err) {
        console.warn('Supabase delete topping failed', err);
      }
    }

    const current = await this.getToppings();
    const updated = current.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TOPPINGS, JSON.stringify(updated));
    return true;
  }

  // ================= ORDERS =================
  async getOrders(): Promise<Order[]> {
    await this.init();
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`, {
          headers: this.getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data));
            return data;
          }
        }
      } catch (err) {
        console.warn('Supabase fetch orders failed', err);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return local ? JSON.parse(local) : [];
  }

  async createOrder(order: Partial<Order>): Promise<Order> {
    await this.init();
    const newOrder: Order = {
      id: order.id || `ord-${Date.now()}`,
      order_number: order.order_number || `MEO-${Date.now().toString().slice(-6)}`,
      customer_name: order.customer_name || 'Pelanggan',
      order_type: order.order_type || 'dine_in',
      table_number: order.table_number || '-',
      items: order.items || [],
      subtotal: Number(order.subtotal) || 0,
      tax_amount: Number(order.tax_amount) || 0,
      service_amount: Number(order.service_amount) || 0,
      total_amount: Number(order.total_amount) || 0,
      payment_method: order.payment_method || 'cash',
      amount_paid: Number(order.amount_paid) || 0,
      change_amount: Number(order.change_amount) || 0,
      cashier_name: order.cashier_name || 'Kasir',
      status: order.status || 'selesai',
      created_at: new Date().toISOString(),
    };

    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/orders`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(newOrder),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data[0]) newOrder.id = data[0].id;
        }
      } catch (err) {
        console.warn('Supabase insert order failed, saved locally', err);
      }
    }

    const current = await this.getOrders();
    const updated = [newOrder, ...current];
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
    return newOrder;
  }

  async updateOrderStatus(id: string, status: 'selesai' | 'pending' | 'dibatalkan'): Promise<boolean> {
    await this.init();
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        await fetch(`${this.config.SUPABASE_URL}/rest/v1/orders?id=eq.${id}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ status }),
        });
      } catch (err) {
        console.warn('Supabase update order status failed', err);
      }
    }

    const current = await this.getOrders();
    const updated = current.map((o) => (o.id === id ? { ...o, status } : o));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
    return true;
  }
}

export const db = new DatabaseService();
