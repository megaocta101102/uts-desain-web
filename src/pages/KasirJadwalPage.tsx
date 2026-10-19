import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Sparkles,
  Clock
} from 'lucide-react';
import { db } from '../services/supabase';
import { User as UserType } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  scheduleService,
  MonthlySchedule,
  ScheduleChange,
  ShiftCode,
  MONTH_NAMES,
  getDaysInMonth
} from '../services/scheduleService';

export const KasirJadwalPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  // State Jadwal & Perubahan
  const [schedules, setSchedules] = useState<MonthlySchedule[]>(() => scheduleService.getSchedules());
  const [changes, setChanges] = useState<ScheduleChange[]>(() => scheduleService.getChanges());
  const [cashiers, setCashiers] = useState<UserType[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingChangeId, setEditingChangeId] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Filter Kalender State (Persis dengan yang ada di Halaman Transaksi Kasir)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // 'YYYY-MM-DD' atau ''
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(9); // 0-indexed (9 = Oktober)
  const [yearInput, setYearInput] = useState<string>('2026');

  // Sinkronisasi yearInput ketika viewYear berubah
  useEffect(() => {
    setYearInput(String(viewYear));
  }, [viewYear]);

  // Form Input Jadwal Baru
  const [newScheduleMonth, setNewScheduleMonth] = useState<number>(11); // Default November
  const [newScheduleYear, setNewScheduleYear] = useState<number>(2026);
  const [newSchedulePiket, setNewSchedulePiket] = useState<string>('');
  // Grid input kosongan: { [cashierId]: { [day]: ShiftCode } }
  const [newScheduleGrid, setNewScheduleGrid] = useState<Record<string, Record<number, ShiftCode>>>({});

  // Form Perubahan Jadwal
  const [changeForm, setChangeForm] = useState({
    category: 'Cuti' as 'Cuti' | 'Izin' | 'Tukar Jadwal',
    targetYear: 2026,
    targetMonth: 10,
    cashierName: '',
    targetCashierName: '',
    startDay: 1,
    endDay: 1,
    reason: '',
  });

  // Load kasir aktif secara dinamis dari database
  const loadCashiers = async () => {
    try {
      const users = await db.getUsers();
      const activeCashiers = users.filter((u) => u.role === 'kasir' && u.status === 'aktif');
      setCashiers(activeCashiers);
      scheduleService.rebuildOctoberSchedule(activeCashiers.map((c) => ({ id: c.id, name: c.name })));
      setSchedules(scheduleService.getSchedules());
      setChanges(scheduleService.getChanges());
      if (activeCashiers.length > 0) {
        if (!newSchedulePiket) setNewSchedulePiket(activeCashiers[0].name);
        setChangeForm((prev) => ({
          ...prev,
          cashierName: prev.cashierName || activeCashiers[0].name,
          targetCashierName: prev.targetCashierName || activeCashiers[1]?.name || activeCashiers[0].name,
        }));
      }
    } catch (e) {
      console.error('Failed to load cashiers', e);
    }
  };

  useEffect(() => {
    loadCashiers();
  }, []);

  // Listen to schedule & user updates
  useEffect(() => {
    const handleUpdate = () => {
      setSchedules(scheduleService.getSchedules());
      setChanges(scheduleService.getChanges());
      loadCashiers();
    };
    window.addEventListener('meo_cafe_schedules_updated', handleUpdate);
    window.addEventListener('meo_cafe_users_updated', handleUpdate);
    return () => {
      window.removeEventListener('meo_cafe_schedules_updated', handleUpdate);
      window.removeEventListener('meo_cafe_users_updated', handleUpdate);
    };
  }, []);

  // Tutup kalender dan popover status pengajuan saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setIsStatusModalOpen(false);
      }
    };
    if (isCalendarOpen || isStatusModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen, isStatusModalOpen]);

  // List Kasir Aktif
  const activeCashierList = useMemo(() => {
    if (cashiers.length > 0) {
      return cashiers.map((c) => ({ id: c.id, name: c.name }));
    }
    return [
      { id: 'usr-kasir-cindy', name: 'Cindy' },
      { id: 'usr-kasir-lulu', name: 'Lulu' },
      { id: 'usr-kasir-byeon', name: 'Byeon Woo Seok' },
      { id: 'usr-kasir-sera', name: 'Sera' },
    ];
  }, [cashiers]);

  // Kasir yang sedang login di akun kasir
  const activeCashier = useMemo(() => {
    if (currentUser && currentUser.role === 'kasir') {
      const match = activeCashierList.find(
        (c) =>
          c.name.toLowerCase() === (currentUser.name || '').toLowerCase() ||
          c.id.toLowerCase() === (currentUser.id || '').toLowerCase()
      );
      if (match) return match.name;
      return currentUser.name || activeCashierList[0]?.name || 'Cindy';
    }
    return currentUser?.name || activeCashierList[0]?.name || 'Cindy';
  }, [currentUser, activeCashierList]);

  // Filtered schedules berdasarkan kalender
  const filteredSchedules = useMemo(() => {
    if (!selectedDate) return schedules;
    const [yStr, mStr] = selectedDate.split('-');
    const targetY = Number(yStr);
    const targetM = Number(mStr);
    return schedules.filter((s) => s.year === targetY && s.month === targetM);
  }, [schedules, selectedDate]);

  // Buka Modal Input Jadwal Baru (Tabel Selalu Kosongan)
  const handleOpenAddModal = () => {
    const days = getDaysInMonth(newScheduleYear, newScheduleMonth);
    const emptyGrid: Record<string, Record<number, ShiftCode>> = {};

    activeCashierList.forEach((c) => {
      emptyGrid[c.id] = {};
      for (let d = 1; d <= days; d++) {
        emptyGrid[c.id][d] = ''; // Kosongan
      }
    });

    setNewScheduleGrid(emptyGrid);
    if (!newSchedulePiket && activeCashierList.length > 0) {
      setNewSchedulePiket(activeCashierList[0].name);
    }
    setIsAddModalOpen(true);
  };

  // Mengubah shift pada sel melalui filter dropdown di kotak
  const handleCellChange = (cashierId: string, day: number, value: ShiftCode) => {
    setNewScheduleGrid((prev) => ({
      ...prev,
      [cashierId]: {
        ...(prev[cashierId] || {}),
        [day]: value,
      },
    }));
  };

  // Submit Jadwal Baru
  const handleSaveNewSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const daysInMonth = getDaysInMonth(newScheduleYear, newScheduleMonth);
    const rows = activeCashierList.map((c) => {
      const days: Record<number, ShiftCode> = {};
      for (let d = 1; d <= daysInMonth; d++) {
        days[d] = newScheduleGrid[c.id]?.[d] || 'P';
      }
      return {
        cashierId: c.id,
        cashierName: c.name,
        days,
      };
    });

    scheduleService.addSchedule({
      month: newScheduleMonth,
      year: newScheduleYear,
      monthName: MONTH_NAMES[newScheduleMonth] || `Bulan ${newScheduleMonth}`,
      daysInMonth,
      piketName: newSchedulePiket || activeCashierList[0]?.name || 'Kasir',
      rows,
    });

    setSchedules(scheduleService.getSchedules());
    setIsAddModalOpen(false);
  };

  // Hapus Jadwal (hanya ada tombol hapus kalau ada salah input ulang dari awal)
  const handleDeleteSchedule = (sched: MonthlySchedule) => {
    if (confirm(`Apakah Anda yakin ingin menghapus jadwal bulan ${sched.monthName} ${sched.year}?`)) {
      scheduleService.deleteSchedule(sched.id);
      setSchedules(scheduleService.getSchedules());
    }
  };

  // Helper: Kasir yang mengajukan bisa mengedit pengajuannya sendiri, tidak bisa edit punya orang lain
  const isAuthorOfChange = (chg: ScheduleChange): boolean => {
    const changeAuthor = (chg.cashierName || '').trim().toLowerCase();
    const currentName = (currentUser?.name || activeCashier || '').trim().toLowerCase();
    const currentUsername = (currentUser?.username || '').trim().toLowerCase();
    return Boolean(
      (currentName && changeAuthor === currentName) ||
      (currentUsername && changeAuthor === currentUsername)
    );
  };

  // Opsi Kasir untuk permohonan perubahan jadwal (diambil dari jadwal yang dipilih atau list kasir)
  const cashierOptions = useMemo(() => {
    const targetSched = schedules.find(
      (s) => Number(s.year) === Number(changeForm.targetYear) && Number(s.month) === Number(changeForm.targetMonth)
    );
    if (targetSched && targetSched.rows.length > 0) {
      return targetSched.rows.map((r) => ({ id: r.cashierId, name: r.cashierName }));
    }
    if (activeCashierList.length > 0) {
      return activeCashierList;
    }
    return [
      { id: 'usr-kasir-cindy', name: 'Cindy' },
      { id: 'usr-kasir-lulu', name: 'Lulu' },
      { id: 'usr-kasir-byeon', name: 'Byeon Woo Seok' },
      { id: 'usr-kasir-sera', name: 'Sera' },
    ];
  }, [schedules, changeForm.targetYear, changeForm.targetMonth, activeCashierList]);

  // Buka Form Pengajuan Baru
  const handleOpenNewChange = () => {
    setEditingChangeId(null);
    const defaultSched = schedules[0] || { year: 2026, month: 10 };
    const defaultYear = defaultSched.year;
    const defaultMonth = defaultSched.month;
    const defaultTargetSched = schedules.find(
      (s) => Number(s.year) === Number(defaultYear) && Number(s.month) === Number(defaultMonth)
    );
    const targetRows = defaultTargetSched?.rows || [];

    const defaultAuthor = activeCashier;

    const defaultTarget =
      targetRows.find((r) => r.cashierName.toLowerCase() !== defaultAuthor.toLowerCase())?.cashierName ||
      activeCashierList.find((c) => c.name.toLowerCase() !== defaultAuthor.toLowerCase())?.name ||
      targetRows[1]?.cashierName ||
      activeCashierList[1]?.name ||
      'Lulu';

    setChangeForm({
      category: 'Cuti',
      targetYear: defaultYear,
      targetMonth: defaultMonth,
      cashierName: defaultAuthor,
      targetCashierName: defaultTarget,
      startDay: 1,
      endDay: 1,
      reason: '',
    });
    setIsChangeModalOpen(true);
  };

  // Buka Form Edit Pengajuan (HANYA kasir yang mengajukan dan BELUM di-ACC)
  const handleOpenEditChange = (chg: ScheduleChange) => {
    if (chg.status === 'accepted') {
      alert('Pengajuan yang sudah disetujui (di-ACC) tidak dapat diedit lagi.');
      return;
    }
    if (!isAuthorOfChange(chg)) {
      alert(`Hanya kasir yang mengajukan (${chg.cashierName}) yang dapat mengedit pengajuan ini.`);
      return;
    }
    setEditingChangeId(chg.id);

    // Cari calon partner default jika kasir mengubah kategori ke Tukar Jadwal
    const sched = schedules.find(
      (s) => Number(s.year) === Number(chg.targetYear) && Number(s.month) === Number(chg.targetMonth)
    );
    const rows = sched?.rows || [];
    const fallbackPartner =
      rows.find((r) => r.cashierName.toLowerCase() !== chg.cashierName.toLowerCase())?.cashierName ||
      activeCashierList.find((c) => c.name.toLowerCase() !== chg.cashierName.toLowerCase())?.name ||
      '';

    setChangeForm({
      category: chg.category,
      targetYear: chg.targetYear,
      targetMonth: chg.targetMonth,
      cashierName: chg.cashierName,
      targetCashierName: chg.targetCashierName || fallbackPartner,
      startDay: chg.startDay,
      endDay: chg.endDay,
      reason: chg.reason,
    });
    setIsChangeModalOpen(true);
  };

  // Submit Permohonan Perubahan Jadwal (Baru atau Update Edit)
  const handleSaveChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeForm.reason.trim()) {
      alert('Alasan perubahan wajib diisi!');
      return;
    }

    let finalTargetCashier = changeForm.targetCashierName;
    if (changeForm.category === 'Tukar Jadwal') {
      if (
        !finalTargetCashier ||
        finalTargetCashier.trim() === '' ||
        finalTargetCashier.toLowerCase() === (changeForm.cashierName || '').toLowerCase()
      ) {
        const partner = cashierOptions.find(
          (c) => c.name.toLowerCase() !== (changeForm.cashierName || '').toLowerCase()
        );
        if (partner) {
          finalTargetCashier = partner.name;
        } else {
          alert('Pilih kasir pengganti yang berbeda untuk tukar jadwal!');
          return;
        }
      }
    }

    const start = Number(changeForm.startDay);
    const end = Number(changeForm.endDay);
    const dateRangeText =
      start === end
        ? `Tanggal ${start} ${MONTH_NAMES[changeForm.targetMonth]} ${changeForm.targetYear}`
        : `Tanggal ${start} s/d ${end} ${MONTH_NAMES[changeForm.targetMonth]} ${changeForm.targetYear}`;

    if (editingChangeId) {
      const existing = changes.find((c) => c.id === editingChangeId);
      if (existing && existing.status === 'accepted') {
        alert('Pengajuan yang sudah disetujui (di-ACC) tidak dapat diedit lagi.');
        return;
      }
      if (existing && !isAuthorOfChange(existing)) {
        alert('Anda hanya dapat mengedit pengajuan yang Anda buat sendiri.');
        return;
      }
      scheduleService.updateChange(editingChangeId, {
        category: changeForm.category,
        cashierName: changeForm.cashierName,
        targetCashierName: changeForm.category === 'Tukar Jadwal' ? finalTargetCashier : undefined,
        dateRangeText,
        targetYear: Number(changeForm.targetYear),
        targetMonth: Number(changeForm.targetMonth),
        startDay: Math.min(start, end),
        endDay: Math.max(start, end),
        reason: changeForm.reason.trim(),
      });
    } else {
      scheduleService.requestChange({
        category: changeForm.category,
        cashierName: changeForm.cashierName,
        targetCashierName: changeForm.category === 'Tukar Jadwal' ? finalTargetCashier : undefined,
        dateRangeText,
        targetYear: Number(changeForm.targetYear),
        targetMonth: Number(changeForm.targetMonth),
        startDay: Math.min(start, end),
        endDay: Math.max(start, end),
        reason: changeForm.reason.trim(),
      });
    }

    setChanges(scheduleService.getChanges());
    setIsChangeModalOpen(false);
    setEditingChangeId(null);
    setChangeForm((prev) => ({ ...prev, reason: '' }));
    setIsStatusModalOpen(true);
  };

  // Kalender Handlers dengan Input Tahun yang Bisa Diedit
  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setYearInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
      setViewYear(parsed);
    }
  };

  const handleYearInputBlur = () => {
    const parsed = parseInt(yearInput, 10);
    if (!isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
      setViewYear(parsed);
      setYearInput(String(parsed));
    } else {
      setYearInput(String(viewYear));
    }
  };

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleOpenCalendar = () => {
    if (selectedDate) {
      const [y, m] = selectedDate.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
      setYearInput(String(y));
    } else {
      const current = new Date();
      setViewYear(current.getFullYear());
      setViewMonth(current.getMonth());
      setYearInput(String(current.getFullYear()));
    }
    setIsCalendarOpen((prev) => !prev);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    setSelectedDate(`${viewYear}-${mStr}-${dStr}`);
    setIsCalendarOpen(false);
  };

  const clearCalendarFilter = () => {
    setSelectedDate('');
  };

  const formatIndonesianDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const CALENDAR_MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4 sm:space-y-5">
      
      {/* Top Header: Judul & 3 Tombol Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Jadwal Shift <span className="text-blue-600">Kasir</span>
          </h1>
        </div>

        {/* Tombol di Bagian Sebelah Judul */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol 1: Input Jadwal Baru */}
          <button
            onClick={handleOpenAddModal}
            className="clay-btn clay-btn-primary !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Input Jadwal Baru</span>
          </button>

          {/* Tombol 2: Perubahan Jadwal */}
          <button
            onClick={handleOpenNewChange}
            className="clay-btn clay-btn-secondary !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer border border-blue-200 text-blue-700 bg-blue-50/70 hover:bg-blue-100"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Perubahan Jadwal</span>
          </button>

          {/* Tombol 3: Status Pengajuan (Dropdown Notifikasi Ringkas dengan Tombol Edit, Scrollable Sticky Header) */}
          <div className="relative" ref={statusRef}>
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(!isStatusModalOpen)}
              className="clay-btn clay-btn-secondary !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <Bell className="w-3.5 h-3.5 text-blue-600" />
              <span>Status Pengajuan</span>
            </button>

            {isStatusModalOpen && (
              <div className="absolute right-0 mt-2 z-50 w-[calc(100vw-2rem)] sm:w-[460px] max-w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in flex flex-col max-h-[420px]">
                {/* Header dengan HANYA tombol silang X saja (Sticky agar tidak ikut kegulir) */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/95 shrink-0 sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="font-extrabold text-slate-900 text-sm">Status Pengajuan</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStatusModalOpen(false)}
                    className="w-7 h-7 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Tutup"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* List Notifikasi Bisa Digulir ke Bawah, Maksimal 10 Pengajuan Terakhir */}
                <div className="overflow-y-auto divide-y divide-slate-100 flex-1 overscroll-contain">
                  {changes.slice(0, 10).length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Belum ada catatan pengajuan perubahan jadwal.
                    </div>
                  ) : (
                    changes.slice(0, 10).map((chg) => (
                      <div key={chg.id} className="p-3.5 hover:bg-slate-50/80 transition-colors space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{chg.cashierName}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                chg.category === 'Cuti'
                                  ? 'bg-amber-100 text-amber-900'
                                  : chg.category === 'Izin'
                                  ? 'bg-sky-100 text-sky-900'
                                  : 'bg-blue-100 text-blue-900'
                              }`}
                            >
                              {chg.category}
                            </span>
                          </div>
                          {chg.status === 'pending' ? (
                            <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Menunggu Persetujuan
                            </span>
                          ) : chg.status === 'accepted' ? (
                            <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Diterima (Di-ACC)
                            </span>
                          ) : (
                            <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                              ✕ Ditolak
                            </span>
                          )}
                        </div>

                        {chg.targetCashierName && (
                          <div className="text-slate-600 text-[11px]">
                            Ditukar dengan: <strong>{chg.targetCashierName}</strong>
                          </div>
                        )}

                        <div className="text-slate-600 text-[11px]">
                          Tanggal: <strong>{chg.dateRangeText}</strong>
                        </div>

                        <div className="text-slate-500 italic text-[11px]">
                          "{chg.reason}"
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="text-[10px] text-slate-400">
                            {new Date(chg.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          {/* Tombol Edit Pengajuan (Hanya bisa diedit oleh kasir yang mengajukan dan BELUM di-ACC) */}
                          {isAuthorOfChange(chg) && chg.status !== 'accepted' && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditChange(chg)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="Edit pengajuan ini"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Baris Keterangan Shift & Filter Kalender (Kompak, Rapi, Seimbang & Tanpa Ruang Kosong Berlebih) */}
      <div className="clay-card p-3 sm:py-2.5 sm:px-4 bg-white border border-slate-200/90 shadow-xs rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Keterangan Jam Shift: Shift Pagi & Shift Siang Bersebelahan dengan Sekat Rapi */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div>
              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                Shift pagi
              </div>
              <div className="text-[11px] text-slate-600 leading-tight mt-0.5">
                <span>Senin–Jumat: 09.00–16.00</span>
                <span className="mx-1 text-slate-300">&bull;</span>
                <span>Sabtu–Minggu: 08.00–16.00</span>
              </div>
            </div>
            <div className="sm:pl-4 pt-1 sm:pt-0">
              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
                Shift siang
              </div>
              <div className="text-[11px] text-slate-600 leading-tight mt-0.5">
                <span>Senin–Jumat: 16.00–23.00</span>
                <span className="mx-1 text-slate-300">&bull;</span>
                <span>Sabtu–Minggu: 16.00–00.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Kalender (Kanan di Atas Tabel Jadwal) */}
        <div className="relative shrink-0 self-end md:self-auto" ref={calendarRef}>
          <button
            type="button"
            onClick={handleOpenCalendar}
            className={`clay-btn !py-2 !px-3 text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer border ${
              selectedDate
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>
              {selectedDate ? formatIndonesianDate(selectedDate) : 'Kalender'}
            </span>
          </button>

          {selectedDate && (
            <button
              type="button"
              onClick={clearCalendarFilter}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] hover:bg-red-600 shadow cursor-pointer"
              title="Hapus filter kalender"
            >
              ✕
            </button>
          )}

          {/* Kalender Popover dengan Input Tahun yang Bisa Diedit */}
          {isCalendarOpen && (
            <div className="absolute right-0 mt-2 z-50 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden animate-fade-in">
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-3.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-200 shrink-0" />
                  <span className="font-bold text-sm tracking-wide">
                    {CALENDAR_MONTH_NAMES[viewMonth]}
                  </span>
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={yearInput}
                    onChange={handleYearInputChange}
                    onBlur={handleYearInputBlur}
                    onKeyDown={handleYearKeyDown}
                    className="w-16 bg-white/20 hover:bg-white/30 focus:bg-white text-white focus:text-blue-900 font-bold text-sm text-center rounded-lg px-1 py-0.5 border border-white/30 focus:border-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all cursor-text"
                    title="Klik untuk mengedit tahun"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-xl hover:bg-white/20 transition-colors text-white active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-xl hover:bg-white/20 transition-colors text-white active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-500 pt-3 pb-1.5 px-2.5 bg-white border-b border-slate-100">
                {DAY_NAMES.map((name, idx) => (
                  <div key={name} className={idx === 0 ? 'text-red-500' : 'text-slate-600'}>
                    {name}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 p-2.5 pt-0 text-center text-xs bg-white">
                {Array.from({ length: new Date(viewYear, viewMonth, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8 w-8" />
                ))}
                {Array.from({ length: new Date(viewYear, viewMonth + 1, 0).getDate() }).map((_, i) => {
                  const dayNumber = i + 1;
                  const mStr = String(viewMonth + 1).padStart(2, '0');
                  const dStr = String(dayNumber).padStart(2, '0');
                  const dateStr = `${viewYear}-${mStr}-${dStr}`;
                  const isSelected = dateStr === selectedDate;

                  return (
                    <button
                      key={dayNumber}
                      type="button"
                      onClick={() => handleSelectDay(dayNumber)}
                      className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-md scale-105'
                          : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      {dayNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daftar Card Jadwal Bulanan */}
      <div className="space-y-6">
        {filteredSchedules.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
            Tidak ada jadwal yang sesuai dengan filter kalender.
          </div>
        ) : (
          filteredSchedules.map((sched) => (
            <div
              key={sched.id}
              className="clay-card p-5 sm:p-6 bg-white border border-slate-200/90 shadow-md rounded-3xl space-y-4 overflow-hidden"
            >
              {/* Header Card: Bulan & Tahun + Tombol Hapus */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight font-sans">
                    {sched.monthName} {sched.year}
                  </h2>
                </div>

                {/* Tombol Hapus */}
                <button
                  onClick={() => handleDeleteSchedule(sched)}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                  title={`Hapus Jadwal ${sched.monthName} ${sched.year}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Tabel Jadwal Bulanan */}
              <div className="overflow-x-auto pb-2">
                <table className="w-full border-collapse border border-slate-300 text-xs text-center select-none">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700">
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold min-w-[120px] bg-slate-200/60 sticky left-0 z-10">
                        Nama Kasir
                      </th>
                      {Array.from({ length: sched.daysInMonth }, (_, i) => i + 1).map((day) => (
                        <th
                          key={day}
                          className="border border-slate-300 w-8 h-8 font-extrabold text-slate-800 text-[11px] bg-slate-50"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sched.rows.map((row) => (
                      <tr key={row.cashierId} className="hover:bg-slate-50/50">
                        <td className="border border-slate-300 px-3 py-2 text-left font-extrabold text-slate-900 bg-white sticky left-0 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                          {row.cashierName}
                        </td>
                        {Array.from({ length: sched.daysInMonth }, (_, i) => i + 1).map((day) => {
                          const shift = row.days[day] || '';
                          const isLibur = shift === 'L';
                          const isCuti = shift === 'C';
                          const isIzin = shift === 'I';

                          return (
                            <td
                              key={day}
                              className={`border border-slate-300 w-8 h-8 font-extrabold text-xs transition-colors ${
                                isLibur
                                  ? 'bg-red-500 text-white font-bold'
                                  : isCuti
                                  ? 'bg-amber-400 text-slate-900 font-bold'
                                  : isIzin
                                  ? 'bg-sky-200 text-sky-950 font-bold'
                                  : shift === 'P'
                                  ? 'bg-white text-blue-700 font-bold'
                                  : shift === 'S'
                                  ? 'bg-amber-50 text-amber-800 font-bold'
                                  : 'bg-white text-slate-300'
                              }`}
                            >
                              {shift || '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bagian Bawah Card Jadwal: Nama Piket Membuat Jadwal */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Piket Pembuat Jadwal:</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    <User className="w-3 h-3" />
                    {sched.piketName}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: Input Jadwal Baru (Tabel Kosongan + Filter Shift P, S, L-Merah, C-Kuning, I-Biru Muda) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="clay-card bg-white w-full max-w-4xl max-h-[92vh] my-auto flex flex-col overflow-hidden relative shadow-2xl rounded-3xl animate-in fade-in zoom-in duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0 sticky top-0 z-20">
              <h3 className="font-extrabold text-slate-900 text-base">Input Jadwal Baru</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form & Grid Kosongan */}
            <form onSubmit={handleSaveNewSchedule} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Bulan
                  </label>
                  <select
                    value={newScheduleMonth}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setNewScheduleMonth(m);
                      const days = getDaysInMonth(newScheduleYear, m);
                      const emptyGrid: Record<string, Record<number, ShiftCode>> = {};
                      activeCashierList.forEach((c) => {
                        emptyGrid[c.id] = {};
                        for (let d = 1; d <= days; d++) emptyGrid[c.id][d] = '';
                      });
                      setNewScheduleGrid(emptyGrid);
                    }}
                    className="clay-input py-2 text-xs w-full cursor-pointer"
                  >
                    {Object.entries(MONTH_NAMES).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Tahun
                  </label>
                  <select
                    value={newScheduleYear}
                    onChange={(e) => setNewScheduleYear(Number(e.target.value))}
                    className="clay-input py-2 text-xs w-full cursor-pointer"
                  >
                    {[2026, 2027, 2028].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Piket Pembuat Jadwal
                  </label>
                  <select
                    value={newSchedulePiket}
                    onChange={(e) => setNewSchedulePiket(e.target.value)}
                    className="clay-input py-2 text-xs w-full cursor-pointer"
                  >
                    {activeCashierList.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabel Input Grid Kosongan per Kasir Aktif - Filter Langsung di Kotak (Kosong/P/S/L-Merah) */}
              <div className="overflow-x-auto pb-2 border border-slate-300 rounded-xl">
                <table className="w-full border-collapse border border-slate-300 text-xs text-center select-none">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700">
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold min-w-[120px] bg-slate-200/60 sticky left-0 z-10">
                        Nama Kasir
                      </th>
                      {Array.from(
                        { length: getDaysInMonth(newScheduleYear, newScheduleMonth) },
                        (_, i) => i + 1
                      ).map((day) => (
                        <th
                          key={day}
                          className="border border-slate-300 w-8 h-8 font-bold text-slate-800 text-[11px]"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeCashierList.map((c) => (
                      <tr key={c.id}>
                        <td className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-900 bg-white sticky left-0 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                          {c.name}
                        </td>
                        {Array.from(
                          { length: getDaysInMonth(newScheduleYear, newScheduleMonth) },
                          (_, i) => i + 1
                        ).map((day) => {
                          const currentVal = newScheduleGrid[c.id]?.[day] || '';
                          const isLibur = currentVal === 'L';

                          return (
                            <td
                              key={day}
                              className={`border border-slate-300 p-0 text-center align-middle w-8 h-8 min-w-[32px] max-w-[32px] relative transition-colors ${
                                isLibur
                                  ? 'bg-red-600'
                                  : currentVal === 'P'
                                  ? 'bg-blue-50'
                                  : currentVal === 'S'
                                  ? 'bg-amber-50'
                                  : 'bg-white'
                              }`}
                            >
                              <select
                                value={currentVal}
                                onChange={(e) => handleCellChange(c.id, day, e.target.value as ShiftCode)}
                                className={`w-full h-8 text-center font-extrabold text-xs cursor-pointer appearance-none outline-none border-0 transition-colors ${
                                  isLibur
                                    ? 'bg-red-600 text-white font-extrabold'
                                    : currentVal === 'P'
                                    ? 'bg-blue-50 text-blue-700 font-extrabold'
                                    : currentVal === 'S'
                                    ? 'bg-amber-50 text-amber-800 font-extrabold'
                                    : 'bg-white text-transparent hover:bg-slate-100'
                                }`}
                                title={currentVal ? `Shift: ${currentVal}` : 'Pilih shift'}
                              >
                                <option value="" className="text-slate-800 bg-white font-normal">
                                  Kotak kosong (none)
                                </option>
                                <option value="P" className="text-blue-700 bg-white font-bold">
                                  P
                                </option>
                                <option value="S" className="text-amber-800 bg-white font-bold">
                                  S
                                </option>
                                <option value="L" className="text-red-600 bg-white font-bold">
                                  L
                                </option>
                              </select>
                              {currentVal && (
                                <div
                                  className={`pointer-events-none absolute inset-0 flex items-center justify-center font-extrabold text-xs ${
                                    isLibur
                                      ? 'text-white'
                                      : currentVal === 'P'
                                      ? 'text-blue-700'
                                      : 'text-amber-800'
                                  }`}
                                >
                                  {currentVal}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary w-full !py-3 text-xs font-bold shadow-md cursor-pointer"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Perubahan Jadwal (Cuti / Izin / Tukar Jadwal) */}
      {isChangeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="clay-card bg-white w-full max-w-lg max-h-[90vh] my-auto flex flex-col overflow-hidden relative shadow-2xl rounded-3xl animate-in fade-in zoom-in duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0 sticky top-0 z-20">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingChangeId ? 'Edit Pengajuan Perubahan' : 'Perubahan Jadwal'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsChangeModalOpen(false);
                  setEditingChangeId(null);
                }}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Perubahan */}
            <form onSubmit={handleSaveChange} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Kategori Perubahan *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cuti', 'Izin', 'Tukar Jadwal'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        let target = changeForm.targetCashierName;
                        if (
                          cat === 'Tukar Jadwal' &&
                          (!target || target.toLowerCase() === (changeForm.cashierName || '').toLowerCase())
                        ) {
                          const partner = cashierOptions.find(
                            (c) => c.name.toLowerCase() !== (changeForm.cashierName || '').toLowerCase()
                          );
                          target = partner?.name || '';
                        }
                        setChangeForm((prev) => ({
                          ...prev,
                          category: cat,
                          targetCashierName: target,
                        }));
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        changeForm.category === cat
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Bulan Jadwal *
                  </label>
                  <select
                    value={`${changeForm.targetYear}-${changeForm.targetMonth}`}
                    onChange={(e) => {
                      const [y, m] = e.target.value.split('-').map(Number);
                      setChangeForm((prev) => ({ ...prev, targetYear: y, targetMonth: m }));
                    }}
                    className="clay-input py-2 text-xs w-full cursor-pointer"
                  >
                    {schedules.map((s) => (
                      <option key={s.id} value={`${s.year}-${s.month}`}>
                        {s.monthName} {s.year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Kasir yang Mengajukan *
                  </label>
                  <select
                    disabled={Boolean(editingChangeId) || Boolean(currentUser && currentUser.role === 'kasir')}
                    value={changeForm.cashierName}
                    onChange={(e) => setChangeForm({ ...changeForm, cashierName: e.target.value })}
                    className="clay-input py-2 text-xs w-full cursor-pointer disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    {cashierOptions.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {changeForm.category === 'Tukar Jadwal' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Ditukar dengan Kasir *
                  </label>
                  <select
                    value={
                      changeForm.targetCashierName ||
                      cashierOptions.find(
                        (c) => c.name.toLowerCase() !== (changeForm.cashierName || '').toLowerCase()
                      )?.name ||
                      ''
                    }
                    onChange={(e) => setChangeForm({ ...changeForm, targetCashierName: e.target.value })}
                    className="clay-input py-2 text-xs w-full cursor-pointer"
                  >
                    {cashierOptions
                      .filter((c) => c.name.toLowerCase() !== (changeForm.cashierName || '').toLowerCase())
                      .map((c) => (
                        <option key={c.id || c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Dari Tanggal *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={getDaysInMonth(changeForm.targetYear, changeForm.targetMonth)}
                    required
                    value={changeForm.startDay}
                    onChange={(e) => setChangeForm({ ...changeForm, startDay: Number(e.target.value) })}
                    className="clay-input py-2 text-xs w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Sampai Tanggal *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={getDaysInMonth(changeForm.targetYear, changeForm.targetMonth)}
                    required
                    value={changeForm.endDay}
                    onChange={(e) => setChangeForm({ ...changeForm, endDay: Number(e.target.value) })}
                    className="clay-input py-2 text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Alasan Perubahan *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Tuliskan alasan pengajuan..."
                  value={changeForm.reason}
                  onChange={(e) => setChangeForm({ ...changeForm, reason: e.target.value })}
                  className="clay-input py-2 text-xs w-full resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary w-full !py-2.5 text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingChangeId ? 'Simpan Perubahan' : 'Kirim Pengajuan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default KasirJadwalPage;
