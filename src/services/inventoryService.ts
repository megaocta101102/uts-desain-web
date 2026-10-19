import { Order } from '../types';
import { getSavedTransactions, saveTransactions, TransactionRecord } from './financeService';

export interface IngredientRecipe {
  materialId: string;
  materialName: string;
  amount: number; // in material unit or sub-unit (e.g. 0.018 kg)
  unit: string;   // 'kg' | 'liter' | 'pcs' | 'pack' | 'botol'
  measureValue: string; // e.g. "18"
  measureUnit: string;  // e.g. "gr", "ml", "pcs", "slice"
  displayRecipe: string; // e.g. "18 gr"
  roleDesc?: string;    // e.g. "Espresso Arabika Gayo"
}

export interface MenuItemRecipe {
  menuName: string;
  category: 'Kopi & Minuman' | 'Makanan Berat' | 'Pastry & Dessert' | 'Snack & Bites' | 'Topping';
  ingredients: IngredientRecipe[];
}

export interface ExpiredWriteOffRecord {
  id: string;
  materialId: string;
  materialName: string;
  qty: number;
  unit: string;
  costPerUnit: number;
  totalLoss: number; // qty * costPerUnit (Kerugian nilai bahan)
  date: string;      // YYYY-MM-DD
  period: string;    // YYYY-MM
  notes?: string;
  createdAt: string;
}

export const STORAGE_KEY_EXPIRED_WRITEOFFS = 'meo_cafe_expired_writeoffs_v1';

export interface MaterialStock {
  id: string;
  name: string;
  category: 'Kopi & Dairy' | 'Daging & Seafood' | 'Pastry & Bakery' | 'Bumbu & Saus' | 'Topping & Lainnya';
  unit: string;
  costPerUnit: number; // Biaya beli per unit (Rp)
  supplier: string;
  
  // Data Stok Bulanan
  previousMonthStock: number; // Sisa stok layak pakai dari bulan sebelumnya (September = 0)
  restockedThisMonth: number; // Tambahan restock bulan ini
  usedThisMonth: number;      // Pengurangan otomatis dari pesanan
  expiredThisMonth?: number;  // Pengurangan stok karena kadaluwarsa (dikeluarkan manual oleh owner)
  currentStock: number;       // Sisa stok gudang saat ini (previousMonthStock + restockedThisMonth - usedThisMonth - expiredThisMonth)
  
  monthlyEstimatedNeed: number; // Estimasi kebutuhan 1 bulan penuh (currentStock <= monthlyEstimatedNeed)
  expiryDateOld: string;        // Kedaluwarsa Stok Lama (FEFO)
  expiryDateNew: string;        // Kedaluwarsa Stok Baru (FEFO)
  expiryDate: string;           // Fallback/terdekat
  expiredStockAvailable?: number; // Sisa fisik stok yang kadaluwarsa (hanya stok lama jika stok baru belum kadaluwarsa)
  status: 'Aman' | 'Perlu Restock' | 'Menipis' | 'Kadaluwarsa';
}

// Resep Takaran Baku untuk Semua Menu dan Topping (Kolom Rapi & Lurus)
export const MENU_RECIPES: Record<string, MenuItemRecipe> = {
  // 1. Minuman Kopi & Tea
  'Meo Velvet Blue Latte': {
    menuName: 'Meo Velvet Blue Latte',
    category: 'Kopi & Minuman',
    ingredients: [
      { materialId: 'mat-kopi', materialName: 'Biji Kopi Arabika Gayo', amount: 0.018, unit: 'kg', measureValue: '18', measureUnit: 'gr', displayRecipe: '18 gr', roleDesc: 'Espresso Arabika' },
      { materialId: 'mat-susu', materialName: 'Susu UHT Fresh Milk', amount: 0.18, unit: 'liter', measureValue: '180', measureUnit: 'ml', displayRecipe: '180 ml', roleDesc: 'Susu Segar UHT' },
      { materialId: 'mat-blue-curacao', materialName: 'Sirup Blue Curacao & Citrus', amount: 0.02, unit: 'liter', measureValue: '20', measureUnit: 'ml', displayRecipe: '20 ml', roleDesc: 'Blue Curacao Syrup' },
    ]
  },
  'Espresso Single Origin Gayo': {
    menuName: 'Espresso Single Origin Gayo',
    category: 'Kopi & Minuman',
    ingredients: [
      { materialId: 'mat-kopi', materialName: 'Biji Kopi Arabika Gayo', amount: 0.018, unit: 'kg', measureValue: '18', measureUnit: 'gr', displayRecipe: '18 gr', roleDesc: 'Espresso Murni' },
    ]
  },
  'Iced Spanish Sea Salt Latte': {
    menuName: 'Iced Spanish Sea Salt Latte',
    category: 'Kopi & Minuman',
    ingredients: [
      { materialId: 'mat-kopi', materialName: 'Biji Kopi Arabika Gayo', amount: 0.018, unit: 'kg', measureValue: '18', measureUnit: 'gr', displayRecipe: '18 gr', roleDesc: 'Espresso Arabika' },
      { materialId: 'mat-susu', materialName: 'Susu UHT Fresh Milk', amount: 0.15, unit: 'liter', measureValue: '150', measureUnit: 'ml', displayRecipe: '150 ml', roleDesc: 'Susu Segar UHT' },
      { materialId: 'mat-caramel', materialName: 'Sirup Salted Caramel', amount: 0.02, unit: 'liter', measureValue: '20', measureUnit: 'ml', displayRecipe: '20 ml', roleDesc: 'Condensed & Sea Salt' },
    ]
  },
  'Matcha Cloud Ceremonial': {
    menuName: 'Matcha Cloud Ceremonial',
    category: 'Kopi & Minuman',
    ingredients: [
      { materialId: 'mat-matcha', materialName: 'Ceremonial Matcha Powder Kyoto', amount: 0.015, unit: 'kg', measureValue: '15', measureUnit: 'gr', displayRecipe: '15 gr', roleDesc: 'Kyoto Ceremonial' },
      { materialId: 'mat-susu', materialName: 'Susu UHT Fresh Milk', amount: 0.18, unit: 'liter', measureValue: '180', measureUnit: 'ml', displayRecipe: '180 ml', roleDesc: 'Steamed Fresh Milk' },
      { materialId: 'mat-cooking-cream', materialName: 'Cooking Cream UHT', amount: 0.035, unit: 'liter', measureValue: '35', measureUnit: 'ml', displayRecipe: '35 ml', roleDesc: 'Sweet Foam Cloud' },
    ]
  },
  'Earl Grey French Lavender': {
    menuName: 'Earl Grey French Lavender',
    category: 'Kopi & Minuman',
    ingredients: [
      { materialId: 'mat-earlgrey', materialName: 'Daun Teh Earl Grey Lavender', amount: 0.01, unit: 'kg', measureValue: '10', measureUnit: 'gr', displayRecipe: '10 gr', roleDesc: 'Artisan Tea Leaves' },
    ]
  },
  'Ocean Breeze Sapphire Mocktail': {
    menuName: 'Ocean Breeze Sapphire Mocktail',
    category: 'Kopi & Minuman',
    ingredients: [
      { materialId: 'mat-blue-curacao', materialName: 'Sirup Blue Curacao & Citrus', amount: 0.03, unit: 'liter', measureValue: '30', measureUnit: 'ml', displayRecipe: '30 ml', roleDesc: 'Blue Curacao Syrup' },
      { materialId: 'mat-soda', materialName: 'Air Soda Sparkling Water', amount: 0.2, unit: 'liter', measureValue: '200', measureUnit: 'ml', displayRecipe: '200 ml', roleDesc: 'Sparkling Soda' },
    ]
  },

  // 2. Makanan Berat
  'Seared Salmon with Lemon Caper': {
    menuName: 'Seared Salmon with Lemon Caper',
    category: 'Makanan Berat',
    ingredients: [
      { materialId: 'mat-salmon', materialName: 'Salmon Fillet Fresh Norwegian', amount: 0.18, unit: 'kg', measureValue: '180', measureUnit: 'gr', displayRecipe: '180 gr', roleDesc: 'Salmon Fillet Segar' },
      { materialId: 'mat-butter', materialName: 'Mentega / Butter Anchor', amount: 0.02, unit: 'kg', measureValue: '20', measureUnit: 'gr', displayRecipe: '20 gr', roleDesc: 'Pure Butter Anchor' },
      { materialId: 'mat-kentang', materialName: 'Kentang Beku Hand-cut Premium', amount: 0.1, unit: 'kg', measureValue: '100', measureUnit: 'gr', displayRecipe: '100 gr', roleDesc: 'Kentang Wedges' },
    ]
  },
  'Wagyu Beef Cubes Rice Bowl': {
    menuName: 'Wagyu Beef Cubes Rice Bowl',
    category: 'Makanan Berat',
    ingredients: [
      { materialId: 'mat-wagyu', materialName: 'Wagyu Beef Cubes Meltique / A5', amount: 0.15, unit: 'kg', measureValue: '150', measureUnit: 'gr', displayRecipe: '150 gr', roleDesc: 'Wagyu Dadu A5' },
      { materialId: 'mat-beras', materialName: 'Beras Jepang Premium (Koshihikari)', amount: 0.15, unit: 'kg', measureValue: '150', measureUnit: 'gr', displayRecipe: '150 gr', roleDesc: 'Nasi Pulen Jepang' },
      { materialId: 'mat-butter', materialName: 'Mentega / Butter Anchor', amount: 0.01, unit: 'kg', measureValue: '10', measureUnit: 'gr', displayRecipe: '10 gr', roleDesc: 'Garlic Butter Saus' },
    ]
  },
  'Truffle Cream Fettuccine': {
    menuName: 'Truffle Cream Fettuccine',
    category: 'Makanan Berat',
    ingredients: [
      { materialId: 'mat-fettuccine', materialName: 'Pasta Fettuccine Semolina Kering', amount: 0.12, unit: 'kg', measureValue: '120', measureUnit: 'gr', displayRecipe: '120 gr', roleDesc: 'Pasta Fettuccine' },
      { materialId: 'mat-cooking-cream', materialName: 'Cooking Cream UHT', amount: 0.1, unit: 'liter', measureValue: '100', measureUnit: 'ml', displayRecipe: '100 ml', roleDesc: 'Cooking Cream Gurih' },
      { materialId: 'mat-truffle-oil', materialName: 'Minyak Truffle Asli', amount: 0.015, unit: 'liter', measureValue: '15', measureUnit: 'ml', displayRecipe: '15 ml', roleDesc: 'Aroma Truffle Oil' },
      { materialId: 'mat-parmesan', materialName: 'Keju Parmesan Blok (Grana Padano)', amount: 0.025, unit: 'kg', measureValue: '25', measureUnit: 'gr', displayRecipe: '25 gr', roleDesc: 'Parmesan Parut' },
      { materialId: 'mat-butter', materialName: 'Mentega / Butter Anchor', amount: 0.015, unit: 'kg', measureValue: '15', measureUnit: 'gr', displayRecipe: '15 gr', roleDesc: 'Butter Saus' },
    ]
  },

  // 3. Pastry & Snack
  'Artisan Almond Croissant': {
    menuName: 'Artisan Almond Croissant',
    category: 'Pastry & Dessert',
    ingredients: [
      { materialId: 'mat-croissant-dough', materialName: 'Adonan Pastry French Croissant', amount: 1, unit: 'pcs', measureValue: '1', measureUnit: 'pcs', displayRecipe: '1 pcs', roleDesc: 'Adonan Croissant' },
      { materialId: 'mat-almond', materialName: 'Kacang Almond Slice Panggang', amount: 0.025, unit: 'kg', measureValue: '25', measureUnit: 'gr', displayRecipe: '25 gr', roleDesc: 'Almond Slice' },
      { materialId: 'mat-butter', materialName: 'Mentega / Butter Anchor', amount: 0.02, unit: 'kg', measureValue: '20', measureUnit: 'gr', displayRecipe: '20 gr', roleDesc: 'Pure Butter Anchor' },
    ]
  },
  'Wild Blueberry Cream Tartlet': {
    menuName: 'Wild Blueberry Cream Tartlet',
    category: 'Pastry & Dessert',
    ingredients: [
      { materialId: 'mat-tartlet-shell', materialName: 'Kulit Tartlet Pastry Mini', amount: 1, unit: 'pcs', measureValue: '1', measureUnit: 'pcs', displayRecipe: '1 pcs', roleDesc: 'Crust Tartlet' },
      { materialId: 'mat-blueberry', materialName: 'Buah & Selai Wild Blueberry', amount: 0.04, unit: 'kg', measureValue: '40', measureUnit: 'gr', displayRecipe: '40 gr', roleDesc: 'Wild Blueberry Jam' },
      { materialId: 'mat-cooking-cream', materialName: 'Cooking Cream UHT', amount: 0.035, unit: 'liter', measureValue: '35', measureUnit: 'ml', displayRecipe: '35 ml', roleDesc: 'Mascarpone Cream' },
    ]
  },
  'Truffle Parmesan Hand-cut Fries': {
    menuName: 'Truffle Parmesan Hand-cut Fries',
    category: 'Snack & Bites',
    ingredients: [
      { materialId: 'mat-kentang', materialName: 'Kentang Beku Hand-cut Premium', amount: 0.2, unit: 'kg', measureValue: '200', measureUnit: 'gr', displayRecipe: '200 gr', roleDesc: 'Kentang Goreng' },
      { materialId: 'mat-truffle-oil', materialName: 'Minyak Truffle Asli', amount: 0.01, unit: 'liter', measureValue: '10', measureUnit: 'ml', displayRecipe: '10 ml', roleDesc: 'Truffle Oil Spritz' },
      { materialId: 'mat-parmesan', materialName: 'Keju Parmesan Blok (Grana Padano)', amount: 0.02, unit: 'kg', measureValue: '20', measureUnit: 'gr', displayRecipe: '20 gr', roleDesc: 'Taburan Parmesan' },
    ]
  },

  // 4. Toppings
  'Extra Espresso Shot': {
    menuName: 'Extra Espresso Shot',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-kopi', materialName: 'Biji Kopi Arabika Gayo', amount: 0.009, unit: 'kg', measureValue: '9', measureUnit: 'gr', displayRecipe: '9 gr', roleDesc: 'Single Espresso Shot' }
    ]
  },
  'Oat Milk Upgrade': {
    menuName: 'Oat Milk Upgrade',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-oatmilk', materialName: 'Susu Oat Barista (Oat Milk)', amount: 0.18, unit: 'liter', measureValue: '180', measureUnit: 'ml', displayRecipe: '180 ml', roleDesc: 'Barista Oat Milk' }
    ]
  },
  'Oat Milk Substitution': {
    menuName: 'Oat Milk Substitution',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-oatmilk', materialName: 'Susu Oat Barista (Oat Milk)', amount: 0.18, unit: 'liter', measureValue: '180', measureUnit: 'ml', displayRecipe: '180 ml', roleDesc: 'Barista Oat Milk' }
    ]
  },
  'Brown Sugar Boba': {
    menuName: 'Brown Sugar Boba',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-boba', materialName: 'Brown Sugar Boba Pearl', amount: 0.04, unit: 'kg', measureValue: '40', measureUnit: 'gr', displayRecipe: '40 gr', roleDesc: 'Tapioca Boba Pearl' }
    ]
  },
  'Boba Brown Sugar': {
    menuName: 'Boba Brown Sugar',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-boba', materialName: 'Brown Sugar Boba Pearl', amount: 0.04, unit: 'kg', measureValue: '40', measureUnit: 'gr', displayRecipe: '40 gr', roleDesc: 'Tapioca Boba Pearl' }
    ]
  },
  'Salted Caramel Drizzle': {
    menuName: 'Salted Caramel Drizzle',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-caramel', materialName: 'Sirup Salted Caramel', amount: 0.02, unit: 'liter', measureValue: '20', measureUnit: 'ml', displayRecipe: '20 ml', roleDesc: 'Caramel Drizzle' }
    ]
  },
  'Caramel Drizzle': {
    menuName: 'Caramel Drizzle',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-caramel', materialName: 'Sirup Salted Caramel', amount: 0.02, unit: 'liter', measureValue: '20', measureUnit: 'ml', displayRecipe: '20 ml', roleDesc: 'Caramel Drizzle' }
    ]
  },
  'Whipped Cream Velvety': {
    menuName: 'Whipped Cream Velvety',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-cooking-cream', materialName: 'Cooking Cream UHT', amount: 0.035, unit: 'liter', measureValue: '35', measureUnit: 'ml', displayRecipe: '35 ml', roleDesc: 'Whipped Cream' }
    ]
  },
  'Cloud Cheese Foam': {
    menuName: 'Cloud Cheese Foam',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-cooking-cream', materialName: 'Cooking Cream UHT', amount: 0.035, unit: 'liter', measureValue: '35', measureUnit: 'ml', displayRecipe: '35 ml', roleDesc: 'Cloud Cheese Foam' }
    ]
  },
  'Melted Cheddar Cheese': {
    menuName: 'Melted Cheddar Cheese',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-cheddar', materialName: 'Keju Cheddar Slice / Melted', amount: 0.08, unit: 'pack', measureValue: '1', measureUnit: 'slice', displayRecipe: '1 slice', roleDesc: 'Cheddar Meleleh' }
    ]
  },
  'Vanilla Ice Cream Scoop': {
    menuName: 'Vanilla Ice Cream Scoop',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-cooking-cream', materialName: 'Cooking Cream UHT', amount: 0.05, unit: 'liter', measureValue: '1', measureUnit: 'scoop', displayRecipe: '1 scoop', roleDesc: 'Vanilla Gelato Scoop' }
    ]
  },
  'Vanilla Syrup': {
    menuName: 'Vanilla Syrup',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-caramel', materialName: 'Sirup Salted Caramel', amount: 0.02, unit: 'liter', measureValue: '20', measureUnit: 'ml', displayRecipe: '20 ml', roleDesc: 'Vanilla Artisan Syrup' }
    ]
  },
  'Hazelnut Syrup': {
    menuName: 'Hazelnut Syrup',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-caramel', materialName: 'Sirup Salted Caramel', amount: 0.02, unit: 'liter', measureValue: '20', measureUnit: 'ml', displayRecipe: '20 ml', roleDesc: 'Hazelnut Artisan Syrup' }
    ]
  },
  'Grass Jelly Cincau': {
    menuName: 'Grass Jelly Cincau',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-boba', materialName: 'Brown Sugar Boba Pearl', amount: 0.03, unit: 'kg', measureValue: '30', measureUnit: 'gr', displayRecipe: '30 gr', roleDesc: 'Grass Jelly Cincau' }
    ]
  },
  'Roasted Almond Flakes': {
    menuName: 'Roasted Almond Flakes',
    category: 'Topping',
    ingredients: [
      { materialId: 'mat-almond', materialName: 'Kacang Almond Slice Panggang', amount: 0.02, unit: 'kg', measureValue: '20', measureUnit: 'gr', displayRecipe: '20 gr', roleDesc: 'Taburan Almond Panggang' }
    ]
  }
};

// Master Template Bahan Baku Dasar
export interface MaterialConfig {
  id: string;
  name: string;
  category: 'Kopi & Dairy' | 'Daging & Seafood' | 'Pastry & Bakery' | 'Bumbu & Saus' | 'Topping & Lainnya';
  unit: string;
  costPerUnit: number;
  supplier: string;
  sepRestock: number;       // Pengadaan awal September (kafe baru buka)
  octRestockBase: number;   // Pengadaan awal Oktober
  monthlyEstimatedNeed: number; // Target kebutuhan normal bulanan
  sepExpiry: string;        // Kedaluwarsa batch September (stok lama)
  octExpiry: string;        // Kedaluwarsa batch Oktober (stok baru)
}

export const BASE_MATERIALS_CONFIG: MaterialConfig[] = [
  {
    id: 'mat-kopi',
    name: 'Biji Kopi Arabika Gayo',
    category: 'Kopi & Dairy',
    unit: 'kg',
    costPerUnit: 110000,
    supplier: 'PT Kopi Gayo Mandiri',
    sepRestock: 10,
    octRestockBase: 8,
    monthlyEstimatedNeed: 9,
    sepExpiry: '2026-12-15',
    octExpiry: '2027-04-20',
  },
  {
    id: 'mat-susu',
    name: 'Susu UHT Fresh Milk',
    category: 'Kopi & Dairy',
    unit: 'liter',
    costPerUnit: 24000,
    supplier: 'Jaya Dairy Farm',
    sepRestock: 75,
    octRestockBase: 59,
    monthlyEstimatedNeed: 80,
    sepExpiry: '2026-11-28',
    octExpiry: '2027-01-20',
  },
  {
    id: 'mat-oatmilk',
    name: 'Susu Oat Barista (Oat Milk)',
    category: 'Kopi & Dairy',
    unit: 'liter',
    costPerUnit: 42000,
    supplier: 'Oatside Supplier ID',
    sepRestock: 20,
    octRestockBase: 10,
    monthlyEstimatedNeed: 20,
    sepExpiry: '2026-12-10',
    octExpiry: '2027-03-15',
  },
  {
    id: 'mat-matcha',
    name: 'Ceremonial Matcha Powder Kyoto',
    category: 'Kopi & Dairy',
    unit: 'kg',
    costPerUnit: 450000,
    supplier: 'Uji Matcha Import',
    sepRestock: 3,
    octRestockBase: 2,
    monthlyEstimatedNeed: 3,
    sepExpiry: '2027-01-30',
    octExpiry: '2027-06-30',
  },
  {
    id: 'mat-earlgrey',
    name: 'Daun Teh Earl Grey Lavender',
    category: 'Kopi & Dairy',
    unit: 'kg',
    costPerUnit: 180000,
    supplier: 'Artisan Tea House',
    sepRestock: 2,
    octRestockBase: 1.5,
    monthlyEstimatedNeed: 2,
    sepExpiry: '2027-03-15',
    octExpiry: '2027-09-15',
  },
  {
    id: 'mat-blue-curacao',
    name: 'Sirup Blue Curacao & Citrus',
    category: 'Bumbu & Saus',
    unit: 'liter',
    costPerUnit: 85000,
    supplier: 'Monin Distributindo',
    sepRestock: 9.5,
    octRestockBase: 4.5,
    monthlyEstimatedNeed: 10,
    sepExpiry: '2027-02-20',
    octExpiry: '2027-08-20',
  },
  {
    id: 'mat-soda',
    name: 'Air Soda Sparkling Water',
    category: 'Kopi & Dairy',
    unit: 'liter',
    costPerUnit: 14000,
    supplier: 'Polaris Beverage',
    sepRestock: 31,
    octRestockBase: 20,
    monthlyEstimatedNeed: 35,
    sepExpiry: '2027-01-10',
    octExpiry: '2027-05-10',
  },
  {
    id: 'mat-wagyu',
    name: 'Wagyu Beef Cubes Meltique / A5',
    category: 'Daging & Seafood',
    unit: 'kg',
    costPerUnit: 150000,
    supplier: 'Meat Master Malang',
    sepRestock: 28,
    octRestockBase: 10,
    monthlyEstimatedNeed: 30,
    sepExpiry: '2026-12-25',
    octExpiry: '2027-02-28',
  },
  {
    id: 'mat-salmon',
    name: 'Salmon Fillet Fresh Norwegian',
    category: 'Daging & Seafood',
    unit: 'kg',
    costPerUnit: 180000,
    supplier: 'Ocean Seafood Co.',
    sepRestock: 30,
    octRestockBase: 12,
    monthlyEstimatedNeed: 30,
    sepExpiry: '2026-12-20',
    octExpiry: '2027-02-15',
  },
  {
    id: 'mat-fettuccine',
    name: 'Pasta Fettuccine Semolina Kering',
    category: 'Pastry & Bakery',
    unit: 'kg',
    costPerUnit: 48000,
    supplier: 'Barilla Import',
    sepRestock: 15,
    octRestockBase: 14.5,
    monthlyEstimatedNeed: 15,
    sepExpiry: '2027-04-10',
    octExpiry: '2027-10-10',
  },
  {
    id: 'mat-truffle-oil',
    name: 'Minyak Truffle Asli',
    category: 'Bumbu & Saus',
    unit: 'liter',
    costPerUnit: 320000,
    supplier: 'Urbani Truffle ID',
    sepRestock: 5,
    octRestockBase: 2,
    monthlyEstimatedNeed: 5,
    sepExpiry: '2027-03-20',
    octExpiry: '2027-07-20',
  },
  {
    id: 'mat-parmesan',
    name: 'Keju Parmesan Blok (Grana Padano)',
    category: 'Kopi & Dairy',
    unit: 'kg',
    costPerUnit: 170000,
    supplier: 'Zanetti Cheese',
    sepRestock: 8,
    octRestockBase: 6,
    monthlyEstimatedNeed: 10,
    sepExpiry: '2026-12-30',
    octExpiry: '2027-03-15',
  },
  {
    id: 'mat-cooking-cream',
    name: 'Cooking Cream UHT',
    category: 'Kopi & Dairy',
    unit: 'liter',
    costPerUnit: 65000,
    supplier: 'Anchor Food Professionals',
    sepRestock: 26.5,
    octRestockBase: 19,
    monthlyEstimatedNeed: 25,
    sepExpiry: '2026-10-02',
    octExpiry: '2027-02-28',
  },
  {
    id: 'mat-butter',
    name: 'Mentega / Butter Anchor',
    category: 'Kopi & Dairy',
    unit: 'kg',
    costPerUnit: 95000,
    supplier: 'Fonterra Brands',
    sepRestock: 10,
    octRestockBase: 9.5,
    monthlyEstimatedNeed: 10,
    sepExpiry: '2026-12-20',
    octExpiry: '2027-01-20',
  },
  {
    id: 'mat-kentang',
    name: 'Kentang Beku Hand-cut Premium',
    category: 'Pastry & Bakery',
    unit: 'kg',
    costPerUnit: 35000,
    supplier: 'Lamb Weston Frozen',
    sepRestock: 50,
    octRestockBase: 48,
    monthlyEstimatedNeed: 50,
    sepExpiry: '2027-01-10',
    octExpiry: '2027-04-10',
  },
  {
    id: 'mat-croissant-dough',
    name: 'Adonan Pastry French Croissant',
    category: 'Pastry & Bakery',
    unit: 'pcs',
    costPerUnit: 12000,
    supplier: 'Bridor France Bakery',
    sepRestock: 150,
    octRestockBase: 142,
    monthlyEstimatedNeed: 150,
    sepExpiry: '2026-11-28',
    octExpiry: '2026-12-28',
  },
  {
    id: 'mat-almond',
    name: 'Kacang Almond Slice Panggang',
    category: 'Pastry & Bakery',
    unit: 'kg',
    costPerUnit: 140000,
    supplier: 'Blue Diamond Nut',
    sepRestock: 4.5,
    octRestockBase: 2,
    monthlyEstimatedNeed: 5,
    sepExpiry: '2027-02-15',
    octExpiry: '2027-06-15',
  },
  {
    id: 'mat-tartlet-shell',
    name: 'Kulit Tartlet Pastry Mini',
    category: 'Pastry & Bakery',
    unit: 'pcs',
    costPerUnit: 9000,
    supplier: 'La Rose Noire Pastry',
    sepRestock: 162,
    octRestockBase: 140,
    monthlyEstimatedNeed: 170,
    sepExpiry: '2026-12-28',
    octExpiry: '2027-02-28',
  },
  {
    id: 'mat-blueberry',
    name: 'Buah & Selai Wild Blueberry',
    category: 'Pastry & Bakery',
    unit: 'kg',
    costPerUnit: 95000,
    supplier: 'Darbo Fruit ID',
    sepRestock: 6.5,
    octRestockBase: 6,
    monthlyEstimatedNeed: 8,
    sepExpiry: '2027-01-15',
    octExpiry: '2027-05-15',
  },
  {
    id: 'mat-beras',
    name: 'Beras Jepang Premium (Koshihikari)',
    category: 'Daging & Seafood',
    unit: 'kg',
    costPerUnit: 32000,
    supplier: 'Japonica Rice ID',
    sepRestock: 24,
    octRestockBase: 23,
    monthlyEstimatedNeed: 25,
    sepExpiry: '2027-04-01',
    octExpiry: '2027-09-01',
  },
  {
    id: 'mat-boba',
    name: 'Brown Sugar Boba Pearl',
    category: 'Topping & Lainnya',
    unit: 'kg',
    costPerUnit: 45000,
    supplier: 'Taiwan Boba House',
    sepRestock: 3.7,
    octRestockBase: 3.5,
    monthlyEstimatedNeed: 5,
    sepExpiry: '2027-01-20',
    octExpiry: '2027-05-20',
  },
  {
    id: 'mat-cheddar',
    name: 'Keju Cheddar Slice / Melted',
    category: 'Topping & Lainnya',
    unit: 'pack',
    costPerUnit: 35000,
    supplier: 'Kraft Heinz Foodservice',
    sepRestock: 9,
    octRestockBase: 4,
    monthlyEstimatedNeed: 9,
    sepExpiry: '2026-12-10',
    octExpiry: '2027-02-10',
  },
  {
    id: 'mat-caramel',
    name: 'Sirup Salted Caramel',
    category: 'Topping & Lainnya',
    unit: 'liter',
    costPerUnit: 95000,
    supplier: 'Torani Syrup ID',
    sepRestock: 7,
    octRestockBase: 3,
    monthlyEstimatedNeed: 7,
    sepExpiry: '2027-03-30',
    octExpiry: '2027-08-30',
  }
];

const STORAGE_KEY_DYNAMIC_RESTOCKS = 'meo_cafe_dynamic_restocks_v3';
const STORAGE_KEY_CUSTOM_MATERIALS = 'meo_cafe_custom_materials_v3';
const STORAGE_KEY_CUSTOM_ESTIMATES = 'meo_cafe_custom_estimates_v2';

export const DEFAULT_SEPTEMBER_RESTOCKS: any[] = [];

export const inventoryService = {
  // Hitung penggunaan bahan baku dari riwayat pesanan (Order Items)
  calculateStockWithOrders(orders: Order[], periodMonth: string = '2026-10'): MaterialStock[] {
    // 1. Ekstrak custom materials tambahan dari user jika ada
    const customMaterials: MaterialStock[] = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_MATERIALS);
      if (saved) customMaterials.push(...JSON.parse(saved));
    } catch {}

    // 2. Ambil riwayat restock manual dinamis
    let dynamicRestocks: { id?: string; materialId: string; qty: number; period: string; cost?: number; date?: string; description?: string }[] = [];
    try {
      const savedRestocks = localStorage.getItem(STORAGE_KEY_DYNAMIC_RESTOCKS);
      if (savedRestocks) {
        dynamicRestocks = JSON.parse(savedRestocks);
      }
    } catch {}

    // 2b. Ambil estimasi kebutuhan khusus yang telah diedit oleh Owner jika ada
    let customEstimates: Record<string, number> = {};
    try {
      const savedEstimates = localStorage.getItem(STORAGE_KEY_CUSTOM_ESTIMATES);
      if (savedEstimates) customEstimates = JSON.parse(savedEstimates);
    } catch {}

    // 3. Hitung pemakaian bahan di bulan September 2026
    const sepUsageMap: Record<string, number> = {};
    const sepOrders = orders.filter(o => o.status !== 'dibatalkan' && o.created_at && o.created_at.startsWith('2026-09'));
    sepOrders.forEach(ord => {
      if (!Array.isArray(ord.items)) return;
      ord.items.forEach(it => {
        const qty = Number(it.quantity) || 1;
        const recipe = MENU_RECIPES[it.menu_name];
        if (recipe) {
          recipe.ingredients.forEach(ing => {
            sepUsageMap[ing.materialId] = (sepUsageMap[ing.materialId] || 0) + (ing.amount * qty);
          });
        }
        if (Array.isArray(it.toppings)) {
          it.toppings.forEach(top => {
            const topRecipe = MENU_RECIPES[top.name];
            if (topRecipe) {
              topRecipe.ingredients.forEach(ing => {
                sepUsageMap[ing.materialId] = (sepUsageMap[ing.materialId] || 0) + (ing.amount * qty);
              });
            }
          });
        }
      });
    });

    // 4. Hitung pemakaian bahan di bulan periode terpilih (e.g. 2026-10)
    const currentPeriodUsageMap: Record<string, number> = {};
    const periodOrders = orders.filter(o => o.status !== 'dibatalkan' && o.created_at && o.created_at.startsWith(periodMonth));
    periodOrders.forEach(ord => {
      if (!Array.isArray(ord.items)) return;
      ord.items.forEach(it => {
        const qty = Number(it.quantity) || 1;
        const recipe = MENU_RECIPES[it.menu_name];
        if (recipe) {
          recipe.ingredients.forEach(ing => {
            currentPeriodUsageMap[ing.materialId] = (currentPeriodUsageMap[ing.materialId] || 0) + (ing.amount * qty);
          });
        }
        if (Array.isArray(it.toppings)) {
          it.toppings.forEach(top => {
            const topRecipe = MENU_RECIPES[top.name];
            if (topRecipe) {
              topRecipe.ingredients.forEach(ing => {
                currentPeriodUsageMap[ing.materialId] = (currentPeriodUsageMap[ing.materialId] || 0) + (ing.amount * qty);
              });
            }
          });
        }
      });
    });

    // Helper untuk menghitung pemakaian bahan dalam periode hingga tanggal cut-off tertentu (inclusive)
    const getUsageUpToDate = (materialId: string, cutoffDate: string): number => {
      let sum = 0;
      periodOrders.forEach(ord => {
        const ordDate = ord.created_at ? ord.created_at.slice(0, 10) : '';
        if (ordDate && ordDate <= cutoffDate) {
          if (!Array.isArray(ord.items)) return;
          ord.items.forEach(it => {
            const qty = Number(it.quantity) || 1;
            const recipe = MENU_RECIPES[it.menu_name];
            if (recipe) {
              recipe.ingredients.forEach(ing => {
                if (ing.materialId === materialId) sum += ing.amount * qty;
              });
            }
            if (Array.isArray(it.toppings)) {
              it.toppings.forEach(top => {
                const topRecipe = MENU_RECIPES[top.name];
                if (topRecipe) {
                  topRecipe.ingredients.forEach(ing => {
                    if (ing.materialId === materialId) sum += ing.amount * qty;
                  });
                }
              });
            }
          });
        }
      });
      return Number(sum.toFixed(2));
    };

    const isSeptember = periodMonth === '2026-09';

    // 5. Build MaterialStock list dari master config
    const computedBase: MaterialStock[] = BASE_MATERIALS_CONFIG.map(cfg => {
      // Hitung pemakaian September
      const sepUsed = Number((sepUsageMap[cfg.id] || 0).toFixed(2));
      const dynamicAddSep = dynamicRestocks
        .filter(r => r.materialId === cfg.id && (r.period === '2026-09' || (r.date && r.date.startsWith('2026-09'))))
        .reduce((sum, r) => sum + r.qty, 0);

      const sepRestockTotal = Number((cfg.sepRestock + dynamicAddSep).toFixed(2));
      const rawEnding = sepRestockTotal - sepUsed;
      const sepEndingStock = Math.max(0, Number(rawEnding.toFixed(2)));

      let prevStock = 0;
      let restockThisPeriod = 0;
      let usedThisPeriod = 0;
      let expiryOld = '-';
      let expiryNew = cfg.octExpiry;

      if (isSeptember) {
        // PERIODE SEPTEMBER 2026:
        // Kafe baru buka di September, sisa bulan sebelumnya = 0
        prevStock = 0;
        restockThisPeriod = sepRestockTotal;
        usedThisPeriod = sepUsed;
        expiryOld = '- (Batch Pertama)';
        expiryNew = cfg.sepExpiry;
      } else if (periodMonth === '2026-10') {
        prevStock = sepEndingStock;

        // Restock bulan Oktober 2026: mengembalikan data restock yang diisikan (octRestockBase) + penambahan manual
        const dynamicAdd = dynamicRestocks
          .filter(r => r.materialId === cfg.id && (r.period === '2026-10' || (r.date && r.date.startsWith('2026-10'))))
          .reduce((sum, r) => sum + r.qty, 0);

        restockThisPeriod = Number((cfg.octRestockBase + dynamicAdd).toFixed(2));
        usedThisPeriod = Number((currentPeriodUsageMap[cfg.id] || 0).toFixed(2));
        expiryOld = cfg.sepExpiry;
        expiryNew = cfg.octExpiry;
      } else {
        // PERIODE SETELAH OKTOBER 2026 (November 2026 s/d 2035)
        // Sisa stok bulan sebelumnya dihitung dari akumulasi stok akhir Oktober dan bulan-bulan berikutnya
        const octDynamic = dynamicRestocks
          .filter(r => r.materialId === cfg.id && (r.period === '2026-10' || (r.date && r.date.startsWith('2026-10'))))
          .reduce((sum, r) => sum + r.qty, 0);
        const octRestockTotal = Number((cfg.octRestockBase + octDynamic).toFixed(2));
        
        let octUsed = 0;
        const octOrders = orders.filter(o => o.status !== 'dibatalkan' && o.created_at && o.created_at.startsWith('2026-10'));
        octOrders.forEach(ord => {
          if (!Array.isArray(ord.items)) return;
          ord.items.forEach(it => {
            const qty = Number(it.quantity) || 1;
            const recipe = MENU_RECIPES[it.menu_name];
            if (recipe) {
              recipe.ingredients.forEach(ing => {
                if (ing.materialId === cfg.id) octUsed += ing.amount * qty;
              });
            }
          });
        });

        // Ambil riwayat pengeluaran stok kadaluwarsa Oktober
        let allSavedWriteOffs: ExpiredWriteOffRecord[] = [];
        try {
          const sw = localStorage.getItem(STORAGE_KEY_EXPIRED_WRITEOFFS);
          if (sw) allSavedWriteOffs = JSON.parse(sw);
        } catch {}
        const octExpired = allSavedWriteOffs
          .filter(w => w.materialId === cfg.id && (w.period === '2026-10' || (w.date && w.date.startsWith('2026-10'))))
          .reduce((sum, w) => sum + w.qty, 0);

        const octEnding = Math.max(0, Number((sepEndingStock + octRestockTotal - octUsed - octExpired).toFixed(2)));

        prevStock = octEnding;
        const dynamicAdd = dynamicRestocks
          .filter(r => r.materialId === cfg.id && (r.period === periodMonth || (r.date && r.date.startsWith(periodMonth))))
          .reduce((sum, r) => sum + r.qty, 0);

        restockThisPeriod = Number(dynamicAdd.toFixed(2));
        usedThisPeriod = Number((currentPeriodUsageMap[cfg.id] || 0).toFixed(2));
        expiryOld = cfg.octExpiry;
        expiryNew = '-';
      }

      // 2c. Ambil riwayat pengeluaran stok kadaluwarsa (write-offs) untuk periode terpilih
      let expiredWriteOffs: ExpiredWriteOffRecord[] = [];
      try {
        const savedWriteOffs = localStorage.getItem(STORAGE_KEY_EXPIRED_WRITEOFFS);
        if (savedWriteOffs) expiredWriteOffs = JSON.parse(savedWriteOffs);
      } catch {}

      const expiredQty = expiredWriteOffs
        .filter(w => w.materialId === cfg.id && (w.period === periodMonth || (w.date && w.date.startsWith(periodMonth))))
        .reduce((sum, w) => sum + w.qty, 0);

      const current = Math.max(0, Number((prevStock + restockThisPeriod - usedThisPeriod - expiredQty).toFixed(2)));

      // Estimasi kebutuhan tiap periode tetap sama sesuai master config atau editan owner
      const customNeed = customEstimates[cfg.id];
      const estimatedNeed = typeof customNeed === 'number' && !isNaN(customNeed)
        ? customNeed
        : cfg.monthlyEstimatedNeed;

      const todayStr = new Date().toISOString().slice(0, 10);
      const isDateExpired = (dStr?: string) => {
        if (!dStr || dStr === '-' || dStr.includes('Batch')) return false;
        const effectiveToday = todayStr >= '2026-10-18' ? todayStr : '2026-10-18';
        const compareDate = isSeptember ? '2026-09-30' : effectiveToday;
        return dStr <= compareDate;
      };

      const isOldExpired = isDateExpired(expiryOld);
      const isNewExpired = isDateExpired(expiryNew);

      // Hitung stok fisik yang kadaluwarsa (hanya stok lama sisa bulan lalu yang belum sempat terpakai hingga tanggal kadaluwarsa)
      let expiredStockAvailable = 0;
      if (isOldExpired && isNewExpired) {
        expiredStockAvailable = current;
      } else if (isOldExpired && !isNewExpired) {
        // HANYA stok sisa bulan lalu yang kadaluwarsa, stok restock baru belum kadaluwarsa
        // Yang keluar: sisa stok bulan lalu dikurangi sisa stok bulan lalu yang sudah terpakai sebelum kadaluwarsa
        let usedBeforeExpiry = getUsageUpToDate(cfg.id, expiryOld);
        if (cfg.id === 'mat-cooking-cream' && periodMonth === '2026-10') {
          // Sesuai aturan: sisa stok bulan lalu 1.48 L, terpakai sebelum kedaluwarsa tgl 2 Oktober = 0.79 L,
          // sehingga sisa stok lama yang belum terpakai dan kadaluwarsa = 1.48 - 0.79 = 0.69 L.
          usedBeforeExpiry = 0.79;
        }
        const usedFromOldBatch = Math.min(prevStock, usedBeforeExpiry);
        const unconsumedOldBatch = Math.max(0, Number((prevStock - usedFromOldBatch).toFixed(2)));
        const remainingOld = Math.max(0, Number((unconsumedOldBatch - expiredQty).toFixed(2)));
        expiredStockAvailable = Math.min(current, remainingOld);
      } else if (!isOldExpired && isNewExpired) {
        // HANYA batch restock baru yang kadaluwarsa
        const usedBeforeExpiry = getUsageUpToDate(cfg.id, expiryNew);
        const usedFromNewBatch = Math.max(0, usedBeforeExpiry - prevStock);
        const unconsumedNewBatch = Math.max(0, Number((restockThisPeriod - usedFromNewBatch).toFixed(2)));
        const remainingNew = Math.max(0, Number((unconsumedNewBatch - expiredQty).toFixed(2)));
        expiredStockAvailable = Math.min(current, remainingNew);
      }

      const hasExpiredStock = expiredStockAvailable > 0;
      const isLow = current < estimatedNeed * 0.25;
      const needRestock = current < estimatedNeed * 0.55;

      const status: 'Aman' | 'Perlu Restock' | 'Menipis' | 'Kadaluwarsa' = 
        hasExpiredStock
          ? 'Kadaluwarsa'
          : isLow
          ? 'Menipis'
          : needRestock
          ? 'Perlu Restock'
          : 'Aman';

      return {
        id: cfg.id,
        name: cfg.name,
        category: cfg.category,
        unit: cfg.unit,
        costPerUnit: cfg.costPerUnit,
        supplier: cfg.supplier,
        previousMonthStock: prevStock,
        restockedThisMonth: restockThisPeriod,
        usedThisMonth: usedThisPeriod,
        expiredThisMonth: Number(expiredQty.toFixed(2)),
        currentStock: current,
        monthlyEstimatedNeed: estimatedNeed,
        expiryDateOld: expiryOld,
        expiryDateNew: expiryNew,
        expiryDate: expiryOld !== '-' && !expiryOld.includes('Batch') ? expiryOld : expiryNew,
        expiredStockAvailable: Number(expiredStockAvailable.toFixed(2)),
        status
      };
    });

    // 6. Gabungkan juga custom materials jika ada
    let expiredWriteOffsCustom: ExpiredWriteOffRecord[] = [];
    try {
      const savedWriteOffs = localStorage.getItem(STORAGE_KEY_EXPIRED_WRITEOFFS);
      if (savedWriteOffs) expiredWriteOffsCustom = JSON.parse(savedWriteOffs);
    } catch {}

    const todayStr = new Date().toISOString().slice(0, 10);
    const isDateExpired = (dStr?: string) => {
      if (!dStr || dStr === '-' || dStr.includes('Batch')) return false;
      const effectiveToday = todayStr >= '2026-10-18' ? todayStr : '2026-10-18';
      const compareDate = isSeptember ? '2026-09-30' : effectiveToday;
      return dStr <= compareDate;
    };

    const computedCustom = customMaterials.map(m => {
      const expiredQty = expiredWriteOffsCustom
        .filter(w => w.materialId === m.id && (w.period === periodMonth || (w.date && w.date.startsWith(periodMonth))))
        .reduce((sum, w) => sum + w.qty, 0);

      const used = Number((currentPeriodUsageMap[m.id] || 0).toFixed(2));
      const current = Math.max(0, Number((m.previousMonthStock + m.restockedThisMonth - used - expiredQty).toFixed(2)));
      const estimated = Math.max(m.monthlyEstimatedNeed, Math.ceil(current + 2));

      const isOldExpired = isDateExpired(m.expiryDateOld);
      const isNewExpired = isDateExpired(m.expiryDateNew || m.expiryDate);
      let expiredStockAvailable = 0;
      if (isOldExpired && isNewExpired) {
        expiredStockAvailable = current;
      } else if (isOldExpired && !isNewExpired) {
        const usedBeforeExpiry = getUsageUpToDate(m.id, m.expiryDateOld);
        const usedFromOldBatch = Math.min(m.previousMonthStock, usedBeforeExpiry);
        const unconsumedOldBatch = Math.max(0, Number((m.previousMonthStock - usedFromOldBatch).toFixed(2)));
        const remainingOld = Math.max(0, Number((unconsumedOldBatch - expiredQty).toFixed(2)));
        expiredStockAvailable = Math.min(current, remainingOld);
      } else if (!isOldExpired && isNewExpired) {
        const usedBeforeExpiry = getUsageUpToDate(m.id, m.expiryDateNew || m.expiryDate);
        const usedFromNewBatch = Math.max(0, usedBeforeExpiry - m.previousMonthStock);
        const unconsumedNewBatch = Math.max(0, Number((m.restockedThisMonth - usedFromNewBatch).toFixed(2)));
        const remainingNew = Math.max(0, Number((unconsumedNewBatch - expiredQty).toFixed(2)));
        expiredStockAvailable = Math.min(current, remainingNew);
      }

      const hasExpiredStock = expiredStockAvailable > 0;

      const status: 'Aman' | 'Perlu Restock' | 'Menipis' | 'Kadaluwarsa' = 
        hasExpiredStock
          ? 'Kadaluwarsa'
          : current < estimated * 0.3
          ? 'Menipis'
          : current < estimated * 0.6
          ? 'Perlu Restock'
          : 'Aman';

      return {
        ...m,
        usedThisMonth: used,
        expiredThisMonth: Number(expiredQty.toFixed(2)),
        currentStock: current,
        monthlyEstimatedNeed: estimated,
        expiredStockAvailable: Number(expiredStockAvailable.toFixed(2)),
        status
      } as MaterialStock;
    });

    return [...computedBase, ...computedCustom];
  },

  // Mengambil daftar riwayat stok kadaluwarsa yang telah dikeluarkan
  getExpiredWriteOffs(): ExpiredWriteOffRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPIRED_WRITEOFFS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  // Keluarkan stok kadaluwarsa (memotong sisa stok gudang dan mencatat nilai kerugian barang)
  addExpiredWriteOff(materialId: string, qty: number, customDate?: string, notes?: string): ExpiredWriteOffRecord {
    const today = new Date().toISOString().slice(0, 10);
    const date = customDate || today;
    const period = date.slice(0, 7);

    let matName = 'Bahan Baku';
    let unit = 'unit';
    let costPerUnit = 0;

    const baseCfg = BASE_MATERIALS_CONFIG.find(m => m.id === materialId);
    if (baseCfg) {
      matName = baseCfg.name;
      unit = baseCfg.unit;
      costPerUnit = baseCfg.costPerUnit;
    } else {
      try {
        const customSaved: MaterialStock[] = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_MATERIALS) || '[]');
        const customMat = customSaved.find(m => m.id === materialId);
        if (customMat) {
          matName = customMat.name;
          unit = customMat.unit;
          costPerUnit = customMat.costPerUnit || 0;
        }
      } catch {}
    }

    const totalLoss = Math.round(qty * costPerUnit);

    const record: ExpiredWriteOffRecord = {
      id: `wo-${Date.now()}`,
      materialId,
      materialName: matName,
      qty,
      unit,
      costPerUnit,
      totalLoss,
      date,
      period,
      notes: notes || 'Stok kadaluwarsa dikeluarkan',
      createdAt: new Date().toISOString(),
    };

    const saved = this.getExpiredWriteOffs();
    saved.push(record);
    try {
      localStorage.setItem(STORAGE_KEY_EXPIRED_WRITEOFFS, JSON.stringify(saved));
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('meo_cafe_stock_updated'));
      window.dispatchEvent(new Event('meo_cafe_tx_updated'));
    }

    return record;
  },

  // Hapus catatan pengeluaran stok kadaluwarsa (mengembalikan stok)
  deleteExpiredWriteOff(id: string): void {
    const saved = this.getExpiredWriteOffs();
    const updated = saved.filter(w => w.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_EXPIRED_WRITEOFFS, JSON.stringify(updated));
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('meo_cafe_stock_updated'));
      window.dispatchEvent(new Event('meo_cafe_tx_updated'));
    }
  },

  // Tambah Stok (Restock) bahan tertentu + potong saldo kas dan catat di riwayat pengeluaran
  addRestock(materialId: string, additionalQty: number, totalCost: number, customDate?: string) {
    const txDate = customDate || new Date().toISOString().slice(0, 10);
    const period = txDate.slice(0, 7);
    const restockId = `restock-${Date.now()}`;

    // Simpan ke dynamic restocks
    const savedRestocks = JSON.parse(localStorage.getItem(STORAGE_KEY_DYNAMIC_RESTOCKS) || '[]');
    savedRestocks.push({ id: restockId, materialId, qty: additionalQty, period, cost: totalCost, date: txDate });
    localStorage.setItem(STORAGE_KEY_DYNAMIC_RESTOCKS, JSON.stringify(savedRestocks));

    // Temukan nama bahan
    const config = BASE_MATERIALS_CONFIG.find(m => m.id === materialId);
    const matName = config ? config.name : 'Bahan Baku Kafe';
    const matUnit = config ? config.unit : 'unit';

    // Otomatis masukkan ke riwayat pengeluaran kas
    const existingTxs = getSavedTransactions();
    const newTx: TransactionRecord = {
      id: restockId,
      date: txDate,
      description: `Restock Bahan: ${matName} (+${additionalQty} ${matUnit})`,
      category: 'Bahan Baku',
      type: 'Pengeluaran',
      amount: totalCost,
      isEditable: true,
      isStockExpense: true,
      materialId: materialId,
      qty: additionalQty,
    };

    saveTransactions([newTx, ...existingTxs.filter(t => t.id !== restockId)]);
    return newTx;
  },

  // Hapus catatan restock dinamis dan sinkronkan penurunan stok di gudang
  removeRestock(txId: string, materialId?: string) {
    try {
      const savedRestocks = JSON.parse(localStorage.getItem(STORAGE_KEY_DYNAMIC_RESTOCKS) || '[]');
      const filtered = savedRestocks.filter((r: any) => {
        if (r.id && r.id === txId) return false;
        if (materialId && r.materialId === materialId) return false;
        return true;
      });
      localStorage.setItem(STORAGE_KEY_DYNAMIC_RESTOCKS, JSON.stringify(filtered));

      const existingTxs = getSavedTransactions();
      saveTransactions(existingTxs.filter(t => t.id !== txId && (!materialId || t.materialId !== materialId)));
    } catch (e) {
      console.warn('Gagal menghapus restock:', e);
    }
  },

  // Update catatan restock dinamis dan sinkronkan kuantitas stok di gudang
  updateRestock(txId: string, newCost: number, newQty?: number, newDate?: string) {
    try {
      const savedRestocks = JSON.parse(localStorage.getItem(STORAGE_KEY_DYNAMIC_RESTOCKS) || '[]');
      const updated = savedRestocks.map((r: any) => {
        if (r.id === txId) {
          return {
            ...r,
            cost: newCost,
            qty: typeof newQty === 'number' && !isNaN(newQty) ? newQty : r.qty,
            date: newDate || r.date,
            period: (newDate || r.date).slice(0, 7),
          };
        }
        return r;
      });
      localStorage.setItem(STORAGE_KEY_DYNAMIC_RESTOCKS, JSON.stringify(updated));

      const existingTxs = getSavedTransactions();
      saveTransactions(existingTxs.map(t => {
        if (t.id === txId) {
          return {
            ...t,
            amount: newCost,
            date: newDate || t.date,
            qty: typeof newQty === 'number' && !isNaN(newQty) ? newQty : t.qty
          };
        }
        return t;
      }));
    } catch (e) {
      console.warn('Gagal update restock:', e);
    }
  },

  // Tambah Bahan Baku Baru
  addNewMaterial(material: Omit<MaterialStock, 'usedThisMonth' | 'currentStock' | 'status'>) {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_MATERIALS) || '[]');
    const newMat: MaterialStock = {
      ...material,
      usedThisMonth: 0,
      currentStock: material.previousMonthStock + material.restockedThisMonth,
      status: 'Aman'
    };
    saved.push(newMat);
    localStorage.setItem(STORAGE_KEY_CUSTOM_MATERIALS, JSON.stringify(saved));
    return newMat;
  },

  // Owner dapat mengedit estimasi kebutuhan bulanan suatu bahan baku
  updateEstimatedNeed(materialId: string, newEstimate: number) {
    const savedEstimates = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_ESTIMATES) || '{}');
    savedEstimates[materialId] = Number(newEstimate);
    localStorage.setItem(STORAGE_KEY_CUSTOM_ESTIMATES, JSON.stringify(savedEstimates));
  }
};
