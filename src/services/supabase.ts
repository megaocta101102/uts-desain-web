import { MenuItem, Topping, User, Order } from '../types';
import { fetchAppConfig, DEFAULT_CONFIG } from './config';

const STORAGE_KEYS = {
  USERS: 'meo_users_v2',
  MENUS: 'meo_menus_v2',
  TOPPINGS: 'meo_toppings_v2',
  ORDERS: 'meo_orders_v2',
};

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
    image_url: '/assets/images/makanan_berat.jpg',
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
  { id: 't-7', name: 'Vanilla Ice Cream Scoop', price: 6000, category: 'all', status: 'tersedia' },
  { id: 't-8', name: 'Roasted Almond Flakes', price: 5000, category: 'all', status: 'tersedia' },
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
    id: 'usr-kasir-cindy',
    username: 'cindy',
    password: 'cindy123',
    name: 'Cindy',
    role: 'kasir',
    status: 'aktif',
    created_at: new Date().toISOString(),
  },
  {
    id: 'usr-kasir-lulu',
    username: 'lulu',
    password: 'lulu123',
    name: 'Lulu',
    role: 'kasir',
    status: 'aktif',
    created_at: new Date().toISOString(),
  },
  {
    id: 'usr-kasir-byeon',
    username: 'byeon',
    password: 'byeon123',
    name: 'Byeon Woo Seok',
    role: 'kasir',
    status: 'aktif',
    created_at: new Date().toISOString(),
  },
  {
    id: 'usr-kasir-sera',
    username: 'sera',
    password: 'sera123',
    name: 'Sera',
    role: 'kasir',
    status: 'aktif',
    created_at: new Date().toISOString(),
  },
];

export function normalizeMenuCategory(rawCategory?: string, rawType?: string): 'minuman' | 'makanan' | 'snack' {
  const type = (rawType || '').trim().toLowerCase();
  const cat = (rawCategory || '').trim().toLowerCase();

  // 1. Strict equality check
  if (type === 'minuman' || cat === 'minuman') return 'minuman';
  if (type === 'makanan' || cat === 'makanan') return 'makanan';
  if (type === 'snack' || cat === 'snack') return 'snack';

  // 2. Keyword checks for drinks/minuman
  if (
    type === 'drink' ||
    type === 'beverage' ||
    cat.includes('coffee') ||
    cat.includes('kopi') ||
    cat.includes('tea') ||
    cat.includes('teh') ||
    cat.includes('mocktail') ||
    cat.includes('latte') ||
    cat.includes('espresso') ||
    cat.includes('minum') ||
    cat.includes('drink') ||
    cat.includes('beverage') ||
    cat.includes('juice') ||
    cat.includes('jus')
  ) {
    return 'minuman';
  }

  // 3. Keyword checks for snack
  if (
    type === 'snack' ||
    cat.includes('snack') ||
    cat.includes('pastry') ||
    cat.includes('dessert') ||
    cat.includes('fries') ||
    cat.includes('bites') ||
    cat.includes('tartlet') ||
    cat.includes('croissant') ||
    cat.includes('camilan') ||
    cat.includes('cemilan') ||
    cat.includes('churros')
  ) {
    return 'snack';
  }

  // 4. Keyword checks for makanan / main course
  if (
    type === 'food' ||
    cat.includes('makan') ||
    cat.includes('food') ||
    cat.includes('course') ||
    cat.includes('dish') ||
    cat.includes('rice') ||
    cat.includes('nasi') ||
    cat.includes('mie') ||
    cat.includes('noodle') ||
    cat.includes('fettuccine') ||
    cat.includes('pasta') ||
    cat.includes('salmon') ||
    cat.includes('steak') ||
    cat.includes('beef')
  ) {
    return 'makanan';
  }

  return 'minuman';
}

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
  // ================= USERS =================
  async getUsers(): Promise<User[]> {
    await this.init();

    // Map status dari localStorage agar status yang diubah (misal 'nonaktif') tidak ter-reset
    const local = localStorage.getItem(STORAGE_KEYS.USERS);
    const localStatusMap: Record<string, 'aktif' | 'nonaktif'> = {};
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          parsed.forEach((u: any) => {
            if (u.id && u.status) localStatusMap[u.id] = u.status;
            if (u.username && u.status) localStatusMap[u.username.toLowerCase()] = u.status;
          });
        }
      } catch {}
    }

    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/users?select=*&order=created_at.desc`, {
          headers: this.getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const sanitized: User[] = data.map((u: any) => {
              const uname = (u.username || 'kasir').toLowerCase();
              const localStatus = localStatusMap[u.id] || localStatusMap[uname];
              const resolvedStatus = localStatus || u.status || 'aktif';

              return {
                id: u.id || `usr-${Date.now()}`,
                name: u.full_name || u.name || u.username || 'Kasir',
                username: u.username || 'kasir',
                password: u.password || '',
                role: (u.role || 'kasir') as 'owner' | 'kasir',
                status: resolvedStatus as 'aktif' | 'nonaktif',
                created_at: u.created_at || new Date().toISOString(),
              };
            });
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(sanitized));
            return sanitized;
          }
        }
      } catch (err) {
        console.warn('Supabase fetch users failed, fallback to local', err);
      }
    }

    let parsed: any[] = local ? JSON.parse(local) : INITIAL_USERS;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      parsed = [...INITIAL_USERS];
    } else {
      INITIAL_USERS.forEach((initU) => {
        if (!parsed.some((p) => p.username === initU.username || p.id === initU.id)) {
          parsed.push(initU);
        }
      });
    }
    const mapped = parsed.map((u: any) => ({
      id: u.id || `usr-${Date.now()}`,
      name: u.full_name || u.name || u.username || 'Kasir',
      username: u.username || 'kasir',
      password: u.password || '',
      role: (u.role || 'kasir') as 'owner' | 'kasir',
      status: (u.status || 'aktif') as 'aktif' | 'nonaktif',
      created_at: u.created_at || new Date().toISOString(),
    }));
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mapped));
    } catch {}
    return mapped;
  }

  async insertUser(user: Partial<User>): Promise<User> {
    await this.init();
    const newUser: User = {
      id: user.id || `usr-${Date.now()}`,
      username: user.username?.trim().toLowerCase() || '',
      password: user.password?.trim() || '',
      name: (user.name || (user as any).full_name || user.username || 'Kasir').trim(),
      role: user.role || 'kasir',
      status: user.status || 'aktif',
      created_at: new Date().toISOString(),
    };

    // Try Supabase insert matching Postgres schema (full_name column)
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const payload = {
          username: newUser.username,
          password: newUser.password,
          full_name: newUser.name,
          role: newUser.role,
        };

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
        } else {
          const errText = await res.text();
          console.warn('Supabase insert user responded with error:', res.status, errText);
        }
      } catch (err) {
        console.warn('Supabase insert user network failed, saved locally', err);
      }
    }

    const local = localStorage.getItem(STORAGE_KEYS.USERS);
    let current: User[] = [];
    if (local) {
      try {
        const p = JSON.parse(local);
        if (Array.isArray(p)) current = p;
      } catch {}
    }
    if (current.length === 0) {
      current = await this.getUsers();
    }
    const updated = [newUser, ...current.filter((u) => u.username !== newUser.username && u.id !== newUser.id)];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    window.dispatchEvent(new Event('meo_cafe_users_updated'));
    return newUser;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | null> {
    await this.init();

    // 1. Ambil data lokal saat ini
    const local = localStorage.getItem(STORAGE_KEYS.USERS);
    let current: User[] = [];
    if (local) {
      try {
        const p = JSON.parse(local);
        if (Array.isArray(p)) current = p;
      } catch {}
    }
    if (current.length === 0) {
      current = await this.getUsers();
    }

    const cleanUsername = user.username?.trim().toLowerCase();
    let updatedUser: User | null = null;

    const updatedList = current.map((u) => {
      const matchId = u.id === id;
      const matchUsername = cleanUsername ? u.username.toLowerCase() === cleanUsername : false;

      if (matchId || matchUsername) {
        updatedUser = {
          ...u,
          ...user,
          name: user.name || (user as any).full_name || u.name,
          username: user.username?.trim().toLowerCase() || u.username,
          status: user.status !== undefined ? user.status : (u.status || 'aktif'),
        };
        return updatedUser;
      }
      return u;
    });

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedList));
    window.dispatchEvent(new Event('meo_cafe_users_updated'));

    // 2. Sync ke Supabase bila terhubung
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const payload: Record<string, any> = {};
        if (user.username) payload.username = user.username.trim().toLowerCase();
        if (user.password) payload.password = user.password.trim();
        if (user.name || (user as any).full_name) {
          payload.full_name = (user.name || (user as any).full_name).trim();
        }
        if (user.role) payload.role = user.role;
        if (user.status) payload.status = user.status;

        const target = current.find((u) => u.id === id || (cleanUsername && u.username.toLowerCase() === cleanUsername));
        const query = (id && id.length === 36 && id.includes('-'))
          ? `id=eq.${id}`
          : target?.id && target.id.length === 36 && target.id.includes('-')
          ? `id=eq.${target.id}`
          : `username=eq.${cleanUsername || target?.username || id}`;

        await fetch(`${this.config.SUPABASE_URL}/rest/v1/users?${query}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('Supabase update user failed, updated locally', err);
      }
    }

    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.init();
    const local = localStorage.getItem(STORAGE_KEYS.USERS);
    let current: User[] = [];
    if (local) {
      try {
        const p = JSON.parse(local);
        if (Array.isArray(p)) current = p;
      } catch {}
    }
    if (current.length === 0) {
      current = await this.getUsers();
    }

    const target = current.find((u) => u.id === id || u.username === id);
    const updated = current.filter((u) => u.id !== id && u.username !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    window.dispatchEvent(new Event('meo_cafe_users_updated'));

    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const query = (id && id.length === 36 && id.includes('-'))
          ? `id=eq.${id}`
          : target?.id && target.id.length === 36 && target.id.includes('-')
          ? `id=eq.${target.id}`
          : `username=eq.${target?.username || id}`;

        await fetch(`${this.config.SUPABASE_URL}/rest/v1/users?${query}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        });
      } catch (err) {
        console.warn('Supabase delete user failed, deleted locally', err);
      }
    }
    return true;
  }

  // ================= MENUS =================
  async getMenus(): Promise<MenuItem[]> {
    await this.init();
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/menus?select=*&order=created_at.desc`, {
          headers: this.getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const sanitized: MenuItem[] = data.map((m: any) => {
              const primaryCat = normalizeMenuCategory(m.category, m.type);
              const subCat = m.category && m.category.toLowerCase() !== primaryCat ? m.category : '';
              let rawImg = m.image_url || '';
              // Jika menu kategori makanan dan memakai gambar profil cafe atau kosong, ganti ke makanan berat
              if (primaryCat === 'makanan' && (rawImg.includes('hero_cafe') || !rawImg)) {
                rawImg = '/assets/images/makanan_berat.jpg';
              }
              const formattedImg = rawImg
                ? (rawImg.startsWith('http') || rawImg.startsWith('/') ? rawImg : `/${rawImg}`)
                : (primaryCat === 'makanan' ? '/assets/images/makanan_berat.jpg' : '/assets/images/coffee_signature.jpg');

              return {
                id: m.id || `m-${Date.now()}`,
                name: m.name || '',
                category: primaryCat,
                subCategory: subCat,
                type: primaryCat,
                price: Number(m.price) || 0,
                description: m.description || '',
                image_url: formattedImg,
                status: m.is_available === false ? 'habis' : 'tersedia',
                created_at: m.created_at || new Date().toISOString(),
              };
            });
            localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(sanitized));
            return sanitized;
          }
        }
      } catch (err) {
        console.warn('Supabase fetch menus failed', err);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.MENUS);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: any) => {
            const primaryCat = normalizeMenuCategory(m.category, m.type);
            let img = m.image_url || '';
            if (primaryCat === 'makanan' && (img.includes('hero_cafe') || !img)) {
              img = '/assets/images/makanan_berat.jpg';
            }
            return {
              ...m,
              category: primaryCat,
              image_url: img || (primaryCat === 'makanan' ? '/assets/images/makanan_berat.jpg' : '/assets/images/coffee_signature.jpg'),
              subCategory: m.subCategory || (m.category && m.category !== primaryCat ? m.category : ''),
            };
          });
        }
      } catch {}
    }
    return INITIAL_MENUS;
  }

  async saveMenu(item: Partial<MenuItem>): Promise<MenuItem> {
    await this.init();
    const cat = item.category || 'minuman';
    const defaultImg = cat === 'makanan' ? '/assets/images/makanan_berat.jpg' : (cat === 'snack' ? '/assets/images/dessert_pastry.jpg' : '/assets/images/coffee_signature.jpg');
    const newItem: MenuItem = {
      id: item.id || `m-${Date.now()}`,
      name: item.name || '',
      category: cat,
      price: Number(item.price) || 0,
      description: item.description || '',
      image_url: item.image_url || defaultImg,
      status: item.status || 'tersedia',
      created_at: new Date().toISOString(),
    };

    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const payload = {
          name: newItem.name,
          price: newItem.price,
          description: newItem.description,
          type: newItem.category,
          category: newItem.category,
          image_url: newItem.image_url,
          is_available: newItem.status === 'tersedia',
        };

        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/menus`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
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
        const payload: Record<string, any> = {};
        if (item.name) payload.name = item.name;
        if (item.price !== undefined) payload.price = Number(item.price);
        if (item.description !== undefined) payload.description = item.description;
        if (item.category) {
          payload.category = item.category;
          payload.type = item.category;
        }
        if (item.image_url) payload.image_url = item.image_url;
        if (item.status) payload.is_available = item.status === 'tersedia';

        const query = id.length === 36 && id.includes('-') ? `id=eq.${id}` : `name=eq.${item.name}`;
        await fetch(`${this.config.SUPABASE_URL}/rest/v1/menus?${query}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('Supabase update menu failed', err);
      }
    }

    const current = await this.getMenus();
    let updatedItem: MenuItem | null = null;
    const updated = current.map((m) => {
      if (m.id === id || (item.name && m.name === item.name)) {
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
        const query = id.length === 36 && id.includes('-') ? `id=eq.${id}` : `name=eq.${id}`;
        await fetch(`${this.config.SUPABASE_URL}/rest/v1/menus?${query}`, {
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
            const sanitized: Topping[] = data.map((t: any) => ({
              id: t.id || `t-${Date.now()}`,
              name: t.name || '',
              price: Number(t.price) || 0,
              category: t.category || 'all',
              status: t.is_available === false ? 'habis' : 'tersedia',
              created_at: t.created_at || new Date().toISOString(),
            }));
            localStorage.setItem(STORAGE_KEYS.TOPPINGS, JSON.stringify(sanitized));
            return sanitized;
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
        const payload = {
          name: newTopping.name,
          price: newTopping.price,
          is_available: newTopping.status === 'tersedia',
        };

        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/toppings`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
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
        const query = id.length === 36 && id.includes('-') ? `id=eq.${id}` : `name=eq.${id}`;
        await fetch(`${this.config.SUPABASE_URL}/rest/v1/toppings?${query}`, {
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
        let allData: any[] = [];
        let offset = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const res = await fetch(
            `${this.config.SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc&offset=${offset}&limit=${pageSize}`,
            { headers: this.getHeaders() }
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              allData = allData.concat(data);
              if (data.length < pageSize) {
                hasMore = false;
              } else {
                offset += pageSize;
              }
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }

        if (allData.length > 0) {
          const sanitized: Order[] = allData.map((o: any) => {
            let extraMeta: any = {};
            if (o.notes) {
              try {
                extraMeta = typeof o.notes === 'string' && o.notes.startsWith('{') ? JSON.parse(o.notes) : {};
              } catch {
                extraMeta = {};
              }
            }

            const totalAmount = Number(o.total_amount) || 0;
            const paymentMethod = o.payment_method || 'cash';
            const rawPaid = o.amount_paid ?? extraMeta.amount_paid;
            const amountPaid = rawPaid !== undefined && rawPaid !== null ? Number(rawPaid) : totalAmount;
            
            let changeAmount = Number(o.change_amount ?? extraMeta.change_amount ?? 0);
            if (changeAmount <= 0 && paymentMethod === 'cash' && amountPaid > totalAmount) {
              changeAmount = Math.max(0, amountPaid - totalAmount);
            }

            let itemsList = Array.isArray(o.items) && o.items.length > 0 ? o.items : (Array.isArray(extraMeta.items) && extraMeta.items.length > 0 ? extraMeta.items : []);
            if (itemsList.length === 0 && totalAmount > 0) {
              itemsList = [
                {
                  menu_id: 'default-item',
                  menu_name: 'Signature Latte & Bites',
                  price: Math.round(totalAmount / 1.1),
                  quantity: 1,
                  toppings: [],
                  subtotal: Math.round(totalAmount / 1.1),
                }
              ];
            }

            return {
              id: o.id || `ord-${Date.now()}`,
              order_number: o.order_number || `MEO-${Date.now().toString().slice(-6)}`,
              customer_name: o.customer_name || 'Pelanggan',
              order_type: o.order_type || 'dine_in',
              table_number: o.table_number || '-',
              items: itemsList,
              subtotal: Number(o.subtotal) || 0,
              tax_amount: Number(o.tax || o.tax_amount) || 0,
              service_amount: Number(o.service_amount) || 0,
              total_amount: totalAmount,
              payment_method: paymentMethod,
              amount_paid: amountPaid,
              change_amount: changeAmount,
              cashier_name: o.cashier_name || 'Kasir',
              status: o.payment_status === 'cancelled' ? 'dibatalkan' : (o.status || 'selesai'),
              created_at: o.created_at || new Date().toISOString(),
            };
          });

          // User request #4: Sesuaikan pemasukan September 2026 agar +- Rp 100.000.000
          // dan Oktober 2026 dibiarkan utuh
          const octOrders = sanitized.filter(o => o.created_at && !o.created_at.startsWith('2026-09'));
          const sepOrders = sanitized.filter(o => o.created_at && o.created_at.startsWith('2026-09'))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          
          let sepSum = 0;
          const targetSepOrders: Order[] = [];
          for (const ord of sepOrders) {
            if (sepSum + ord.total_amount <= 100200000) {
              sepSum += ord.total_amount;
              targetSepOrders.push(ord);
            }
          }

          const combinedOrders = [...octOrders, ...targetSepOrders];

          const localStored = localStorage.getItem(STORAGE_KEYS.ORDERS);
          let localList: Order[] = [];
          if (localStored) {
            try {
              const parsed = JSON.parse(localStored);
              if (Array.isArray(parsed)) localList = parsed;
            } catch {}
          }
          const existingIds = new Set(
            combinedOrders.map(o => o.id).filter(Boolean).concat(combinedOrders.map(o => o.order_number).filter(Boolean))
          );
          const extraLocal = localList.filter(o => o && !existingIds.has(o.id) && !existingIds.has(o.order_number));

          const allMergedOrders = [...extraLocal, ...combinedOrders].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(allMergedOrders));
          return allMergedOrders;
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
      amount_paid: Number(order.amount_paid) || Number(order.total_amount) || 0,
      change_amount: Number(order.change_amount) || Math.max(0, (Number(order.amount_paid) || 0) - (Number(order.total_amount) || 0)),
      cashier_name: order.cashier_name || 'Kasir',
      status: order.status || 'selesai',
      created_at: new Date().toISOString(),
    };

    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const payload = {
          order_number: newOrder.order_number,
          customer_name: newOrder.customer_name,
          table_number: newOrder.table_number || '-',
          order_type: newOrder.order_type || 'dine_in',
          cashier_name: newOrder.cashier_name || 'Kasir',
          subtotal: newOrder.subtotal,
          tax: newOrder.tax_amount,
          discount: 0,
          total_amount: newOrder.total_amount,
          payment_method: newOrder.payment_method,
          payment_status: 'paid',
          notes: JSON.stringify({
            amount_paid: newOrder.amount_paid,
            change_amount: newOrder.change_amount,
            items: newOrder.items,
          }),
        };

        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/orders`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
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
    const filtered = current.filter((o) => o.order_number !== newOrder.order_number && o.id !== newOrder.id);
    const updated = [newOrder, ...filtered];
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('meo_cafe_stock_updated'));
      window.dispatchEvent(new Event('meo_cafe_tx_updated'));
    }
    return newOrder;
  }

  async updateOrderStatus(id: string, status: 'selesai' | 'pending' | 'dibatalkan'): Promise<boolean> {
    await this.init();
    if (this.config.SUPABASE_URL && this.config.SUPABASE_ANON_KEY) {
      try {
        const query = id.length === 36 && id.includes('-') ? `id=eq.${id}` : `order_number=eq.${id}`;
        await fetch(`${this.config.SUPABASE_URL}/rest/v1/orders?${query}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({
            payment_status: status === 'dibatalkan' ? 'cancelled' : 'paid',
          }),
        });
      } catch (err) {
        console.warn('Supabase update order status failed', err);
      }
    }

    const current = await this.getOrders();
    const updated = current.map((o) => (o.id === id ? { ...o, status } : o));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('meo_cafe_stock_updated'));
      window.dispatchEvent(new Event('meo_cafe_tx_updated'));
    }
    return true;
  }
}

export const db = new DatabaseService();
