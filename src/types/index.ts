export type Role = 'owner' | 'kasir';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: Role;
  status?: string;
  created_at?: string;
}

export type MenuCategory = 'all' | 'minuman' | 'makanan' | 'snack';

export interface MenuItem {
  id: string;
  name: string;
  category: 'minuman' | 'makanan' | 'snack';
  price: number;
  description?: string;
  image_url: string;
  status: 'tersedia' | 'habis';
  created_at?: string;
}

export interface Topping {
  id: string;
  name: string;
  price: number;
  category: 'minuman' | 'makanan' | 'all';
  status: 'tersedia' | 'habis';
  created_at?: string;
}

export interface SelectedTopping {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  menu: MenuItem;
  quantity: number;
  selectedToppings: SelectedTopping[];
  notes?: string;
  itemTotal: number;
}

export type OrderType = 'dine_in' | 'take_away';
export type PaymentMethod = 'cash' | 'qris' | 'transfer';
export type OrderStatus = 'pending' | 'selesai' | 'dibatalkan';

export interface OrderItemRecord {
  id?: string;
  order_id?: string;
  menu_id?: string;
  menu_name: string;
  price: number;
  quantity: number;
  toppings?: SelectedTopping[];
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  order_type: OrderType;
  table_number?: string;
  items: OrderItemRecord[];
  subtotal: number;
  tax_amount: number;
  service_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  change_amount: number;
  cashier_name: string;
  status: OrderStatus;
  created_at: string;
}

export interface AppConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  CAFE_NAME: string;
  CAFE_TAGLINE: string;
  CAFE_ADDRESS: string;
  CAFE_MAPS_URL: string;
  OWNER_NAME: string;
  CAFE_CURRENCY: string;
  CAFE_TAX_PERCENT: number;
  CAFE_SERVICE_PERCENT: number;
  PAGE_SIZE: number;
}
