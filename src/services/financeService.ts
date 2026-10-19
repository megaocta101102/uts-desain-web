// Layanan Manajemen Keuangan & Sistem Pengeluaran Kafe Meo
// Sesuai Instruksi Owner:
// 1. Pengeluaran Rutin Wajib Tiap Bulan (Otomatis Terpotong Setiap Awal Bulan Tanggal 2):
//    - Gaji Karyawan Kasir (Cindy & Lulu - Rp 4.000.000/orang = Rp 8.000.000)
//    - Utilitas (Listrik, Air & WiFi): Rp 1.400.000 (September: Rp 1.450.000)
//    - Perawatan Alat: Rp 200.000
//    - Transportasi & Logistik Pengadaan: Rp 1.000.000
// 2. Pengeluaran Tidak Otomatis (Manual oleh Owner Sesuai Kebutuhan):
//    - Tambah Stok Bahan Baku (Restock)
//    - Perawatan Non-Wajib di luar Rp 200.000 (Servis besar / penggantian sparepart)
//    - Dana Darurat (Insidental / kerusakan tak terduga)
// 3. Tanpa mengubah nominal atau stok yang sudah ada sebelumnya

export interface TransactionRecord {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'Pemasukan' | 'Pengeluaran' | 'Kerugian';
  amount: number;
  isEditable?: boolean;
  isStockExpense?: boolean;
  isRecurringAuto?: boolean; // Penanda pengeluaran otomatis awal bulan tgl 2
  isWriteOff?: boolean;      // Penanda kerugian stok kadaluwarsa dari gudang
  writeOffId?: string;
  materialId?: string;
  qty?: number;
}

export const STORAGE_KEY_MANUAL_TXS = 'meo_cafe_manual_txs';

// Baseline data transaksi September & Oktober yang sudah tervalidasi
export const BASE_TRANSACTIONS: TransactionRecord[] = [
  // --- SEPTEMBER 2026 (Bulan Pertama Buka) ---
  {
    id: 'm-sep-0',
    date: '2026-09-01',
    description: 'Setoran Modal Usaha Kafe (Modal Awal Operasi)',
    category: 'Modal Awal',
    type: 'Pemasukan',
    amount: 190101300,
    isEditable: true,
  },
  {
    id: 'm-sep-1',
    date: '2026-09-02',
    description: 'Gaji Karyawan Kasir (Cindy & Lulu - Rp 4.000.000/orang)',
    category: 'Gaji Karyawan',
    type: 'Pengeluaran',
    amount: 8000000,
    isEditable: true,
    isRecurringAuto: true,
  },
  {
    id: 'm-sep-2',
    date: '2026-09-02',
    description: 'Pengadaan Awal Bahan Baku & Biji Kopi Gayo',
    category: 'Bahan Baku',
    type: 'Pengeluaran',
    amount: 29319500,
    isEditable: true,
    isStockExpense: true,
    isRecurringAuto: false,
  },
  {
    id: 'm-sep-3',
    date: '2026-09-02',
    description: 'Pembayaran Listrik, Air & WiFi September',
    category: 'Utilitas',
    type: 'Pengeluaran',
    amount: 1450000,
    isEditable: true,
    isRecurringAuto: true,
  },
  {
    id: 'm-sep-4',
    date: '2026-09-02',
    description: 'Transportasi Logistik & Pengadaan',
    category: 'Transportasi',
    type: 'Pengeluaran',
    amount: 1000000,
    isEditable: true,
    isRecurringAuto: true,
  },
  {
    id: 'm-sep-5',
    date: '2026-09-08',
    description: 'Servis Kalibrasi Rutin Mesin Kopi Espresso',
    category: 'Perawatan Alat',
    type: 'Pengeluaran',
    amount: 427100,
    isEditable: true,
    isRecurringAuto: false,
  },
  {
    id: 'm-sep-restock-cheddar',
    date: '2026-09-22',
    description: 'Restock Tambahan: Keju Cheddar Slice (1 pack - Darurat Sebelum Habis)',
    category: 'Bahan Baku',
    type: 'Pengeluaran',
    amount: 35000,
    isEditable: true,
    isStockExpense: true,
    isRecurringAuto: false,
  },
  {
    id: 'm-sep-restock-cream',
    date: '2026-09-23',
    description: 'Restock Tambahan: Cooking Cream UHT (0.5 liter - Darurat Sebelum Habis)',
    category: 'Bahan Baku',
    type: 'Pengeluaran',
    amount: 32500,
    isEditable: true,
    isStockExpense: true,
    isRecurringAuto: false,
  },

  // --- OKTOBER 2026 (Bulan Berjalan) ---
  {
    id: 'm-oct-restock-base',
    date: '2026-10-02',
    description: 'Pengadaan Restock Bahan Baku Gudang Oktober (23 Komoditas)',
    category: 'Bahan Baku',
    type: 'Pengeluaran',
    amount: 19514500,
    isEditable: true,
    isStockExpense: true,
    isRecurringAuto: false,
  },
  {
    id: 'm-oct-1',
    date: '2026-10-02',
    description: 'Gaji Karyawan Kasir Bulan Oktober (Cindy & Lulu - Rp 4.000.000/orang)',
    category: 'Gaji Karyawan',
    type: 'Pengeluaran',
    amount: 8000000,
    isEditable: true,
    isRecurringAuto: true,
  },
  {
    id: 'm-oct-4',
    date: '2026-10-02',
    description: 'Pembayaran Listrik, Air & WiFi Oktober',
    category: 'Utilitas',
    type: 'Pengeluaran',
    amount: 1400000,
    isEditable: true,
    isRecurringAuto: true,
  },
  {
    id: 'm-oct-5',
    date: '2026-10-02',
    description: 'Transportasi Logistik Pengadaan',
    category: 'Transportasi',
    type: 'Pengeluaran',
    amount: 1000000,
    isEditable: true,
    isRecurringAuto: true,
  },
  {
    id: 'm-oct-6',
    date: '2026-10-02',
    description: 'Perawatan Alat',
    category: 'Perawatan Alat',
    type: 'Pengeluaran',
    amount: 200000,
    isEditable: true,
    isRecurringAuto: true,
  },
];

/**
 * Mendapatkan daftar 4 pengeluaran wajib bulanan otomatis (terpotong tgl 2)
 * untuk bulan tertentu (format YYYY-MM)
 */
export function generateAutoRecurringExpenses(period: string): TransactionRecord[] {
  const [year, month] = period.split('-');
  const date = `${year}-${month}-02`;
  
  const monthNames: Record<string, string> = {
    '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
    '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
    '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
  };
  const monthLabel = monthNames[month] || month;

  return [
    {
      id: `auto-salary-${period}`,
      date,
      description: `Gaji Karyawan Kasir Bulan ${monthLabel} (Cindy & Lulu - Rp 4.000.000/orang)`,
      category: 'Gaji Karyawan',
      type: 'Pengeluaran',
      amount: 8000000,
      isEditable: true,
      isRecurringAuto: true,
    },
    {
      id: `auto-utility-${period}`,
      date,
      description: `Pembayaran Listrik, Air & WiFi Bulan ${monthLabel}`,
      category: 'Utilitas',
      type: 'Pengeluaran',
      amount: 1400000,
      isEditable: true,
      isRecurringAuto: true,
    },
    {
      id: `auto-service-${period}`,
      date,
      description: `Perawatan Alat Bulan ${monthLabel}`,
      category: 'Perawatan Alat',
      type: 'Pengeluaran',
      amount: 200000,
      isEditable: true,
      isRecurringAuto: true,
    },
    {
      id: `auto-transport-${period}`,
      date,
      description: `Transportasi Logistik Pengadaan Bulan ${monthLabel}`,
      category: 'Transportasi',
      type: 'Pengeluaran',
      amount: 1000000,
      isEditable: true,
      isRecurringAuto: true,
    },
  ];
}

/**
 * Mengambil semua transaksi tersimpan dengan memastikan transaksi dasar September,
 * Oktober (pengeluaran rutin tgl 2 saja tanpa bahan baku awal), dan pengeluaran rutin otomatis tgl 2.
 */
export function getSavedTransactions(): TransactionRecord[] {
  let list: TransactionRecord[] = [...BASE_TRANSACTIONS];

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MANUAL_TXS);
      if (saved) {
        const parsed: TransactionRecord[] = JSON.parse(saved);

        parsed.forEach(item => {
          const idx = list.findIndex(l => l.id === item.id);
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...item };
          } else {
            list.push(item);
          }
        });

        // Pastikan m-oct-restock-base selalu tercatat dan sinkron dengan BASE_TRANSACTIONS
        const baseOct = BASE_TRANSACTIONS.find(t => t.id === 'm-oct-restock-base');
        const octIdx = list.findIndex(t => t.id === 'm-oct-restock-base');
        if (baseOct) {
          if (octIdx >= 0) {
            list[octIdx] = { ...list[octIdx], amount: baseOct.amount, description: baseOct.description };
          } else {
            list.push(baseOct);
          }
        }

        localStorage.setItem(STORAGE_KEY_MANUAL_TXS, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Gagal membaca manual transactions dari localStorage:', e);
    }
  }

  return list;
}

/**
 * Menyimpan daftar transaksi ke localStorage
 */
export function saveTransactions(txs: TransactionRecord[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_MANUAL_TXS, JSON.stringify(txs));
      window.dispatchEvent(new Event('meo_cafe_tx_updated'));
    } catch (e) {
      console.error('Gagal menyimpan transactions ke localStorage:', e);
    }
  }
}
