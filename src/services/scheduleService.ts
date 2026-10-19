// Layanan Pengelolaan Jadwal Kerja Shift Kasir Meo Cafe
// Berisi jadwal bulanan per kasir, inisial shift (P = Pagi, S = Siang, L = Libur, C = Cuti, I = Izin),
// piket pembuat jadwal (setiap 3 bulan sekali), dan sistem pengajuan perubahan jadwal (Cuti, Izin, Tukar).

export type ShiftCode = 'P' | 'S' | 'L' | 'C' | 'I' | '';

export interface CashierScheduleRow {
  cashierId: string;
  cashierName: string;
  days: Record<number, ShiftCode>;
}

export interface MonthlySchedule {
  id: string;
  month: number; // 1 - 12
  year: number; // e.g. 2026
  monthName: string; // e.g. 'Oktober'
  daysInMonth: number; // 28, 29, 30, 31
  piketName: string; // e.g. 'Cindy'
  rows: CashierScheduleRow[];
  createdAt: string;
}

export interface ScheduleChange {
  id: string;
  category: 'Cuti' | 'Izin' | 'Tukar Jadwal';
  cashierName: string;
  targetCashierName?: string;
  dateRangeText: string;
  targetYear: number;
  targetMonth: number;
  startDay: number;
  endDay: number;
  reason: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

const STORAGE_KEY_SCHEDULES = 'meo_cafe_schedules_v1';
const STORAGE_KEY_CHANGES = 'meo_cafe_schedule_changes_v1';

export const MONTH_NAMES: Record<number, string> = {
  1: 'Januari',
  2: 'Februari',
  3: 'Maret',
  4: 'April',
  5: 'Mei',
  6: 'Juni',
  7: 'Juli',
  8: 'Agustus',
  9: 'September',
  10: 'Oktober',
  11: 'November',
  12: 'Desember',
};

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Helper untuk membaca kasir aktif secara sinkron dari localStorage (meo_users_v2)
export function getActiveCashiersSync(): Array<{ id: string; name: string }> {
  if (typeof window === 'undefined') {
    return [
      { id: 'usr-kasir-cindy', name: 'Cindy' },
      { id: 'usr-kasir-lulu', name: 'Lulu' },
      { id: 'usr-kasir-byeon', name: 'Byeon Woo Seok' },
      { id: 'usr-kasir-sera', name: 'Sera' },
    ];
  }
  try {
    const raw = localStorage.getItem('meo_users_v2');
    if (raw) {
      const users = JSON.parse(raw);
      if (Array.isArray(users)) {
        const active = users.filter((u: any) => u.role === 'kasir' && u.status === 'aktif');
        if (active.length > 0) {
          return active.map((u: any) => ({
            id: u.id || `usr-${u.username}`,
            name: u.name || u.username,
          }));
        }
      }
    }
  } catch {}
  return [
    { id: 'usr-kasir-cindy', name: 'Cindy' },
    { id: 'usr-kasir-lulu', name: 'Lulu' },
    { id: 'usr-kasir-byeon', name: 'Byeon Woo Seok' },
    { id: 'usr-kasir-sera', name: 'Sera' },
  ];
}

// Helper untuk membaca daftar nama/id kasir nonaktif
export function getNonActiveCashierNamesSync(): Set<string> {
  const set = new Set<string>();
  if (typeof window === 'undefined') return set;
  try {
    const raw = localStorage.getItem('meo_users_v2');
    if (raw) {
      const users = JSON.parse(raw);
      if (Array.isArray(users)) {
        users.forEach((u: any) => {
          if (u.role === 'kasir' && u.status === 'nonaktif') {
            if (u.name) set.add(u.name.trim().toLowerCase());
            if (u.username) set.add(u.username.trim().toLowerCase());
            if (u.id) set.add(u.id.trim().toLowerCase());
          }
        });
      }
    }
  } catch {}
  return set;
}

// Generate default pattern for September (30 days) - Khusus riwayat bulan lalu: hanya Lulu & Cindy
export function generateSeptemberSchedule(): MonthlySchedule {
  const daysInMonth = 30;
  const cindy = { id: 'usr-kasir-cindy', name: 'Cindy' };
  const lulu = { id: 'usr-kasir-lulu', name: 'Lulu' };

  const cindyDays: Record<number, ShiftCode> = {};
  const luluDays: Record<number, ShiftCode> = {};

  for (let d = 1; d <= daysInMonth; d++) {
    if (d % 7 === 2) {
      cindyDays[d] = 'L';
      luluDays[d] = 'P';
    } else if (d % 7 === 3) {
      cindyDays[d] = 'S';
      luluDays[d] = 'L';
    } else if (d % 2 === 1) {
      cindyDays[d] = 'P';
      luluDays[d] = 'S';
    } else {
      cindyDays[d] = 'S';
      luluDays[d] = 'P';
    }
  }

  const rows: CashierScheduleRow[] = [
    { cashierId: cindy.id, cashierName: cindy.name, days: cindyDays },
    { cashierId: lulu.id, cashierName: lulu.name, days: luluDays },
  ];

  return {
    id: 'sched-2026-09',
    month: 9,
    year: 2026,
    monthName: 'September',
    daysInMonth,
    piketName: cindy.name,
    rows,
    createdAt: '2026-08-31T09:00:00Z',
  };
}

// Helper untuk menerapkan pengajuan yang diterima (accepted) ke jadwal
export function applyAcceptedChanges(sched: MonthlySchedule, changesList: ScheduleChange[]): MonthlySchedule {
  const normalize = (str?: string) => (str || '').trim().toLowerCase();
  let updatedRows = [...sched.rows];

  const relevant = changesList.filter(
    (c) =>
      Number(c.targetYear) === Number(sched.year) &&
      Number(c.targetMonth) === Number(sched.month) &&
      c.status === 'accepted'
  );

  for (const chg of relevant) {
    const start = Math.min(Number(chg.startDay), Number(chg.endDay));
    const end = Math.max(Number(chg.startDay), Number(chg.endDay));

    if (chg.category === 'Tukar Jadwal') {
      const mainName = normalize(chg.cashierName);
      const partnerName = normalize(chg.targetCashierName);

      const mainIdx = updatedRows.findIndex(
        (r) => normalize(r.cashierName) === mainName || normalize(r.cashierId) === mainName
      );
      const partnerIdx = updatedRows.findIndex(
        (r) => normalize(r.cashierName) === partnerName || normalize(r.cashierId) === partnerName
      );

      if (mainIdx !== -1 && partnerIdx !== -1 && mainIdx !== partnerIdx) {
        const mainRow = updatedRows[mainIdx];
        const partnerRow = updatedRows[partnerIdx];
        const newMainDays = { ...mainRow.days };
        const newPartnerDays = { ...partnerRow.days };

        for (let d = start; d <= end; d++) {
          if (d >= 1 && d <= sched.daysInMonth) {
            const origMain = mainRow.days[d] !== undefined ? mainRow.days[d] : 'P';
            const origPartner = partnerRow.days[d] !== undefined ? partnerRow.days[d] : 'S';
            newMainDays[d] = origPartner;
            newPartnerDays[d] = origMain;
          }
        }

        updatedRows[mainIdx] = { ...mainRow, days: newMainDays };
        updatedRows[partnerIdx] = { ...partnerRow, days: newPartnerDays };
      }
    } else if (chg.category === 'Cuti' || chg.category === 'Izin') {
      const code: ShiftCode = chg.category === 'Cuti' ? 'C' : 'I';
      const targetName = normalize(chg.cashierName);

      updatedRows = updatedRows.map((row) => {
        if (
          normalize(row.cashierName) === targetName ||
          normalize(row.cashierId) === targetName
        ) {
          const newDays = { ...row.days };
          for (let d = start; d <= end; d++) {
            if (d >= 1 && d <= sched.daysInMonth) {
              newDays[d] = code;
            }
          }
          return { ...row, days: newDays };
        }
        return row;
      });
    }
  }

  return {
    ...sched,
    rows: updatedRows,
  };
}

// Helper untuk mendeteksi kasir cowok
export function isMaleCashier(name: string, id?: string): boolean {
  const n = (name || '').toLowerCase();
  const i = (id || '').toLowerCase();
  const maleKeywords = [
    'byeon', 'seok', 'deni', 'budi', 'agus', 'joko', 'ahmad', 'rizky',
    'fajar', 'bayu', 'dimas', 'aditya', 'ilham', 'wahyu', 'reza',
    'kevin', 'david', 'michael', 'alex', 'putra', 'pria', 'cowok'
  ];
  return maleKeywords.some((kw) => n.includes(kw) || i.includes(kw));
}

// Generate jadwal bulan Oktober secara dinamis HANYA untuk kasir aktif dan sesuaikan pengajuan
export function generateOctoberSchedule(
  customActiveCashiers?: Array<{ id: string; name: string }>,
  customChanges?: ScheduleChange[]
): MonthlySchedule {
  const daysInMonth = 31;
  const rawActive = customActiveCashiers || getActiveCashiersSync();
  const nonActiveSet = getNonActiveCashierNamesSync();
  // Filter ketat: kasir nonaktif otomatis tidak tercantum
  const activeCashiers = rawActive.filter(
    (c) =>
      !nonActiveSet.has((c.name || '').trim().toLowerCase()) &&
      !nonActiveSet.has((c.id || '').trim().toLowerCase())
  );

  const effectiveCashiers =
    activeCashiers.length > 0
      ? activeCashiers
      : [{ id: 'usr-kasir-cindy', name: 'Cindy' }];

  // Inisialisasi grid jadwal:
  // 1. Tiap kasir punya jatah libur seimbang: seminggu 2 kali libur (sama rata)
  // 2. Maksimal 2 orang tiap shift (Pagi maks 2, Siang maks 2)
  // 3. Shift Siang diutamakan minimal 1 cowok (karena shift siang berjalan sampai malam)
  const n = effectiveCashiers.length;
  const cashierDaysMap: Record<string, Record<number, ShiftCode>> = {};
  effectiveCashiers.forEach((c) => {
    cashierDaysMap[c.id] = {};
  });

  // Tentukan 2 hari libur per siklus 7 hari untuk setiap kasir secara seimbang
  const getOffDaysForCashier = (idx: number, total: number): [number, number] => {
    if (total === 4) {
      // 4 kasir: sebaran sempurna tanpa hari kosong
      const table: Record<number, [number, number]> = {
        0: [0, 3], // Kasir 1 (misal Cindy): Libur hari 1 & 4
        1: [1, 4], // Kasir 2 (misal Lulu): Libur hari 2 & 5
        2: [2, 5], // Kasir 3 (misal Byeon): Libur hari 3 & 6
        3: [3, 6], // Kasir 4 (misal Sera): Libur hari 4 & 7
      };
      return table[idx] || [(idx * 2) % 7, (idx * 2 + 3) % 7];
    }
    return [(idx * 2) % 7, (idx * 2 + 3) % 7];
  };

  const cashierOffDaysMap = new Map<string, [number, number]>();
  effectiveCashiers.forEach((c, idx) => {
    cashierOffDaysMap.set(c.id, getOffDaysForCashier(idx, n));
  });

  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = (d - 1) % 7;
    const dailyShifts: Record<string, ShiftCode> = {};

    // 1. Tentukan siapa yang libur hari ini (jatah 2 hari seminggu)
    const workingCashiers: typeof effectiveCashiers = [];
    effectiveCashiers.forEach((c) => {
      const [off1, off2] = cashierOffDaysMap.get(c.id) || [0, 3];
      if (dayOfWeek === off1 || dayOfWeek === off2) {
        dailyShifts[c.id] = 'L';
      } else {
        workingCashiers.push(c);
      }
    });

    // 2. Bagi kasir yang bertugas hari ini ke shift Pagi dan Siang
    const workingMales = workingCashiers.filter((c) => isMaleCashier(c.name, c.id));
    const workingFemales = workingCashiers.filter((c) => !isMaleCashier(c.name, c.id));

    let sCount = 0;
    let pCount = 0;

    // Prioritas 1: Masukkan kasir cowok yang bertugas ke shift Siang (karena sampai malam)
    workingMales.forEach((m) => {
      if (sCount < 2) {
        dailyShifts[m.id] = 'S';
        sCount++;
      } else if (pCount < 2) {
        dailyShifts[m.id] = 'P';
        pCount++;
      } else {
        dailyShifts[m.id] = 'L';
      }
    });

    // Prioritas 2: Isi sisa shift dengan kasir cewek (bergantian adil antara Pagi & Siang)
    const rotatedFemales = workingFemales.map((_, i) => workingFemales[(i + d) % workingFemales.length]);

    rotatedFemales.forEach((f) => {
      if (sCount < 2 && (sCount <= pCount || pCount >= 2)) {
        dailyShifts[f.id] = 'S';
        sCount++;
      } else if (pCount < 2) {
        dailyShifts[f.id] = 'P';
        pCount++;
      } else if (sCount < 2) {
        dailyShifts[f.id] = 'S';
        sCount++;
      } else {
        dailyShifts[f.id] = 'L'; // Maksimal 2 per shift
      }
    });

    // Simpan ke grid hari
    effectiveCashiers.forEach((c) => {
      cashierDaysMap[c.id][d] = dailyShifts[c.id] || 'L';
    });
  }

  const rows: CashierScheduleRow[] = effectiveCashiers.map((c) => ({
    cashierId: c.id,
    cashierName: c.name,
    days: cashierDaysMap[c.id],
  }));

  const baseSchedule: MonthlySchedule = {
    id: 'sched-2026-10',
    month: 10,
    year: 2026,
    monthName: 'Oktober',
    daysInMonth,
    piketName: effectiveCashiers[0]?.name || 'Cindy',
    rows,
    createdAt: '2026-09-30T09:00:00Z',
  };

  // Sesuaikan dengan pengajuan-pengajuan yang sudah disetujui
  const allChanges = customChanges || scheduleService.getChanges();
  return applyAcceptedChanges(baseSchedule, allChanges);
}

// Initial seed pengajuan perubahan jadwal
export const INITIAL_CHANGES: ScheduleChange[] = [
  {
    id: 'chg-seed-1',
    category: 'Tukar Jadwal',
    cashierName: 'Cindy',
    targetCashierName: 'Lulu',
    dateRangeText: 'Tanggal 12 Oktober 2026',
    targetYear: 2026,
    targetMonth: 10,
    startDay: 12,
    endDay: 12,
    reason: 'Ada urusan keluarga mendadak',
    status: 'accepted',
    createdAt: '2026-10-02T08:30:00Z',
  },
  {
    id: 'chg-seed-2',
    category: 'Izin',
    cashierName: 'Cindy',
    dateRangeText: 'Tanggal 5 Oktober 2026',
    targetYear: 2026,
    targetMonth: 10,
    startDay: 5,
    endDay: 5,
    reason: 'Keperluan administrasi keluarga',
    status: 'accepted',
    createdAt: '2026-10-01T10:00:00Z',
  },
];

export const scheduleService = {
  getSchedules(): MonthlySchedule[] {
    if (typeof window === 'undefined') {
      return [generateOctoberSchedule(), generateSeptemberSchedule()];
    }

    const nonActiveSet = getNonActiveCashierNamesSync();

    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULES);
      if (saved) {
        let parsed: MonthlySchedule[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter otomatis: Kasir nonaktif tidak tercantum di jadwal mana pun
          parsed = parsed.map((sched) => {
            // Perbaikan khusus September 2026:
            // Pastikan jadwal September HANYA berisi kasir aktif Lulu dan Cindy (riwayat bulan lalu)
            if (sched.year === 2026 && sched.month === 9) {
              const isOnlyCindyLulu =
                sched.rows.length === 2 &&
                sched.rows.some((r) => (r.cashierName || '').trim().toLowerCase() === 'cindy') &&
                sched.rows.some((r) => (r.cashierName || '').trim().toLowerCase() === 'lulu');
              if (!isOnlyCindyLulu) {
                const baseSep = generateSeptemberSchedule();
                const allChanges = this.getChanges();
                return applyAcceptedChanges(baseSep, allChanges);
              }
            }

            return {
              ...sched,
              rows: sched.rows.filter(
                (r) =>
                  !nonActiveSet.has((r.cashierName || '').trim().toLowerCase()) &&
                  !nonActiveSet.has((r.cashierId || '').trim().toLowerCase())
              ),
            };
          });

          try {
            localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(parsed));
          } catch {}

          return parsed.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          });
        }
      }
    } catch (e) {
      console.warn('Gagal membaca jadwal dari localStorage:', e);
    }

    const initial = [generateOctoberSchedule(), generateSeptemberSchedule()];
    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(initial));
    } catch {}
    return initial;
  },

  // Buat ulang (rebuild) jadwal bulan Oktober dengan karyawan yang aktif dan sesuaikan pengajuan
  rebuildOctoberSchedule(
    customActiveCashiers?: Array<{ id: string; name: string }>,
    customChanges?: ScheduleChange[]
  ): MonthlySchedule {
    const changes = customChanges || this.getChanges();
    const oct = generateOctoberSchedule(customActiveCashiers, changes);

    if (typeof window !== 'undefined') {
      const existing = this.getSchedules();
      const nonActiveSet = getNonActiveCashierNamesSync();

      const filtered = existing
        .filter((s) => !(s.year === 2026 && s.month === 10))
        .map((s) => ({
          ...s,
          rows: s.rows.filter(
            (r) =>
              !nonActiveSet.has((r.cashierName || '').trim().toLowerCase()) &&
              !nonActiveSet.has((r.cashierId || '').trim().toLowerCase())
          ),
        }));

      const updated = [oct, ...filtered];
      this.saveSchedules(updated);
    }

    return oct;
  },

  saveSchedules(schedules: MonthlySchedule[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(schedules));
        window.dispatchEvent(new Event('meo_cafe_schedules_updated'));
      } catch (e) {
        console.error('Gagal menyimpan jadwal ke localStorage:', e);
      }
    }
  },

  addSchedule(newSched: Omit<MonthlySchedule, 'id' | 'createdAt'>): MonthlySchedule {
    const existing = this.getSchedules();
    const created: MonthlySchedule = {
      ...newSched,
      id: `sched-${newSched.year}-${String(newSched.month).padStart(2, '0')}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const filtered = existing.filter((s) => !(s.year === newSched.year && s.month === newSched.month));
    const updated = [created, ...filtered];
    this.saveSchedules(updated);
    return created;
  },

  deleteSchedule(id: string): void {
    const existing = this.getSchedules();
    const updated = existing.filter((s) => s.id !== id);
    this.saveSchedules(updated);
  },

  getChanges(): ScheduleChange[] {
    if (typeof window === 'undefined') return INITIAL_CHANGES;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHANGES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);
        }
      }
    } catch {}
    try {
      localStorage.setItem(STORAGE_KEY_CHANGES, JSON.stringify(INITIAL_CHANGES));
    } catch {}
    return INITIAL_CHANGES;
  },

  saveChanges(changes: ScheduleChange[]): void {
    try {
      const sorted = [...changes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const trimmed = sorted.slice(0, 10);
      localStorage.setItem(STORAGE_KEY_CHANGES, JSON.stringify(trimmed));
      window.dispatchEvent(new Event('meo_cafe_schedules_updated'));
    } catch {}
  },

  // Kasir mengajukan perubahan (Status awal: 'pending', belum langsung merubah jadwal sebelum di-ACC Owner)
  requestChange(changeData: Omit<ScheduleChange, 'id' | 'createdAt' | 'status'>): ScheduleChange {
    const newChange: ScheduleChange = {
      ...changeData,
      id: `chg-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const existingChanges = this.getChanges();
    this.saveChanges([newChange, ...existingChanges]);
    return newChange;
  },

  // Edit pengajuan perubahan jadwal oleh kasir
  updateChange(
    changeId: string,
    updatedData: Partial<Omit<ScheduleChange, 'id' | 'createdAt' | 'status'>>
  ): ScheduleChange | null {
    const changes = this.getChanges();
    const idx = changes.findIndex((c) => c.id === changeId);
    if (idx === -1) return null;

    const existing = changes[idx];
    const updated: ScheduleChange = {
      ...existing,
      ...updatedData,
    };
    if (updatedData.category && updatedData.category !== 'Tukar Jadwal') {
      delete updated.targetCashierName;
    }
    changes[idx] = updated;
    this.saveChanges(changes);
    return updated;
  },

  // Owner menyetujui (Accept) pengajuan -> Jadwal otomatis di-update sesuai perubahan
  acceptChange(changeId: string): void {
    const changes = this.getChanges();
    const change = changes.find((c) => c.id === changeId);
    if (!change) return;

    change.status = 'accepted';
    this.saveChanges([...changes]);

    // Update target schedule
    const schedules = this.getSchedules();
    const targetIdx = schedules.findIndex(
      (s) => Number(s.year) === Number(change.targetYear) && Number(s.month) === Number(change.targetMonth)
    );

    if (targetIdx >= 0) {
      const targetSched = schedules[targetIdx];
      const normalize = (str?: string) => (str || '').trim().toLowerCase();
      const start = Math.min(Number(change.startDay), Number(change.endDay));
      const end = Math.max(Number(change.startDay), Number(change.endDay));

      // Tukar Jadwal: tukar shift antara cashierName dan targetCashierName pada rentang hari tersebut
      if (change.category === 'Tukar Jadwal') {
        const mainName = normalize(change.cashierName);
        const partnerName = normalize(change.targetCashierName);

        let mainRowIndex = targetSched.rows.findIndex(
          (r) => normalize(r.cashierName) === mainName || normalize(r.cashierId) === mainName
        );
        let partnerRowIndex = targetSched.rows.findIndex(
          (r) => normalize(r.cashierName) === partnerName || normalize(r.cashierId) === partnerName
        );

        // Jika hanya ada 2 kasir di jadwal dan salah satunya cocok
        if (mainRowIndex === -1 && targetSched.rows.length === 2 && partnerRowIndex !== -1) {
          mainRowIndex = partnerRowIndex === 0 ? 1 : 0;
        }
        if (partnerRowIndex === -1 && targetSched.rows.length === 2 && mainRowIndex !== -1) {
          partnerRowIndex = mainRowIndex === 0 ? 1 : 0;
        }
        // Fallback jika tidak ada yang cocok tapi ada minimal 2 kasir
        if (mainRowIndex === -1 && partnerRowIndex === -1 && targetSched.rows.length >= 2) {
          mainRowIndex = 0;
          partnerRowIndex = 1;
        }

        if (mainRowIndex !== -1 && partnerRowIndex !== -1 && mainRowIndex !== partnerRowIndex) {
          const mainRow = targetSched.rows[mainRowIndex];
          const partnerRow = targetSched.rows[partnerRowIndex];

          const newMainDays = { ...mainRow.days };
          const newPartnerDays = { ...partnerRow.days };

          for (let d = start; d <= end; d++) {
            if (d >= 1 && d <= targetSched.daysInMonth) {
              const origMain = mainRow.days[d] !== undefined ? mainRow.days[d] : 'P';
              const origPartner = partnerRow.days[d] !== undefined ? partnerRow.days[d] : 'S';

              // Tukar shift: Main dapat shift Partner, Partner dapat shift Main
              newMainDays[d] = origPartner;
              newPartnerDays[d] = origMain;
            }
          }

          const newRows = [...targetSched.rows];
          newRows[mainRowIndex] = { ...mainRow, days: newMainDays };
          newRows[partnerRowIndex] = { ...partnerRow, days: newPartnerDays };

          schedules[targetIdx] = {
            ...targetSched,
            rows: newRows,
          };

          this.saveSchedules(schedules);
          return;
        }
      }

      // Cuti atau Izin
      if (change.category === 'Cuti' || change.category === 'Izin') {
        const code: ShiftCode = change.category === 'Cuti' ? 'C' : 'I';
        const targetName = normalize(change.cashierName);

        const updatedRows = targetSched.rows.map((row) => {
          if (
            normalize(row.cashierName) === targetName ||
            normalize(row.cashierId) === targetName
          ) {
            const newDays = { ...row.days };
            for (let d = start; d <= end; d++) {
              if (d >= 1 && d <= targetSched.daysInMonth) {
                newDays[d] = code;
              }
            }
            return { ...row, days: newDays };
          }
          return row;
        });

        schedules[targetIdx] = {
          ...targetSched,
          rows: updatedRows,
        };

        this.saveSchedules(schedules);
      }
    }
  },

  // Owner menolak (Decline) pengajuan -> Jadwal tidak diubah
  declineChange(changeId: string): void {
    const changes = this.getChanges();
    const change = changes.find((c) => c.id === changeId);
    if (!change) return;

    change.status = 'declined';
    this.saveChanges([...changes]);
  },

  // Owner menghapus pengajuan perubahan jadwal -> Jika sudah terlanjur di-ACC, otomatis jadwal tidak jadi berubah (dikembalikan ke semula)
  deleteChange(changeId: string): void {
    const changes = this.getChanges();
    const targetChange = changes.find((c) => c.id === changeId);
    if (!targetChange) return;

    const remaining = changes.filter((c) => c.id !== changeId);
    this.saveChanges(remaining);

    // Jika pengajuan yang dihapus sebelumnya berstatus 'accepted',
    // jadwal otomatis dikembalikan (revert) ke jadwal awal tanpa perubahan tersebut
    if (targetChange.status === 'accepted') {
      if (Number(targetChange.targetYear) === 2026 && Number(targetChange.targetMonth) === 10) {
        this.rebuildOctoberSchedule(undefined, remaining);
      } else {
        const schedules = this.getSchedules();
        const targetIdx = schedules.findIndex(
          (s) => Number(s.year) === Number(targetChange.targetYear) && Number(s.month) === Number(targetChange.targetMonth)
        );
        if (targetIdx >= 0) {
          const targetSched = schedules[targetIdx];
          if (targetSched.year === 2026 && targetSched.month === 9) {
            const baseSept = generateSeptemberSchedule();
            const revertedSept = applyAcceptedChanges(baseSept, remaining);
            schedules[targetIdx] = revertedSept;
            this.saveSchedules(schedules);
          }
        }
      }
    }
  },
};
