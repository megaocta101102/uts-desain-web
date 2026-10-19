import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ArrowLeft,
  Trash2,
  X,
  Bell,
  Check,
  User,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  scheduleService,
  MonthlySchedule,
  ScheduleChange,
  MONTH_NAMES
} from '../services/scheduleService';
import { db } from '../services/supabase';

export const OwnerJadwalPage: React.FC = () => {
  const navigate = useNavigate();

  // State Jadwal & Perubahan
  const [schedules, setSchedules] = useState<MonthlySchedule[]>(() => scheduleService.getSchedules());
  const [changes, setChanges] = useState<ScheduleChange[]>(() => scheduleService.getChanges());

  // Notification / Pengajuan Slide-over State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Filter Kalender State (Persis Kalender di Halaman Transaksi Kasir)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // 'YYYY-MM-DD' atau ''
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(9); // 0-indexed (9 = Oktober)
  const [yearInput, setYearInput] = useState<string>('2026');

  // Load and Listen updates
  useEffect(() => {
    const syncWithCashiers = async () => {
      try {
        const users = await db.getUsers();
        const activeCashiers = users.filter((u) => u.role === 'kasir' && u.status === 'aktif');
        scheduleService.rebuildOctoberSchedule(activeCashiers.map((c) => ({ id: c.id, name: c.name })));
        setSchedules(scheduleService.getSchedules());
        setChanges(scheduleService.getChanges());
      } catch {
        setSchedules(scheduleService.getSchedules());
        setChanges(scheduleService.getChanges());
      }
    };

    syncWithCashiers();

    const handleUpdate = () => {
      setSchedules(scheduleService.getSchedules());
      setChanges(scheduleService.getChanges());
    };
    window.addEventListener('meo_cafe_schedules_updated', handleUpdate);
    window.addEventListener('meo_cafe_users_updated', syncWithCashiers);
    return () => {
      window.removeEventListener('meo_cafe_schedules_updated', handleUpdate);
      window.removeEventListener('meo_cafe_users_updated', syncWithCashiers);
    };
  }, []);

  // Tutup popover kalender & notifikasi jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    if (isCalendarOpen || isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen, isNotificationOpen]);

  // Pending changes count for notification badge
  const pendingCount = useMemo(() => {
    return changes.filter((c) => c.status === 'pending').length;
  }, [changes]);

  // Filtered schedules berdasarkan kalender
  const filteredSchedules = useMemo(() => {
    if (!selectedDate) return schedules;
    const [yStr, mStr] = selectedDate.split('-');
    const targetY = Number(yStr);
    const targetM = Number(mStr);
    return schedules.filter((s) => s.year === targetY && s.month === targetM);
  }, [schedules, selectedDate]);

  // Kalender Handlers
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
      setViewYear((prev) => {
        const next = prev - 1;
        setYearInput(String(next));
        return next;
      });
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => {
        const next = prev + 1;
        setYearInput(String(next));
        return next;
      });
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

  // Hapus Jadwal
  const handleDeleteSchedule = (sched: MonthlySchedule) => {
    if (confirm(`Apakah Anda yakin ingin menghapus jadwal bulan ${sched.monthName} ${sched.year}?`)) {
      scheduleService.deleteSchedule(sched.id);
      setSchedules(scheduleService.getSchedules());
    }
  };

  // Accept / Decline Pengajuan
  const handleAccept = (changeId: string) => {
    scheduleService.acceptChange(changeId);
    setSchedules(scheduleService.getSchedules());
    setChanges(scheduleService.getChanges());
  };

  const handleDecline = (changeId: string) => {
    scheduleService.declineChange(changeId);
    setChanges(scheduleService.getChanges());
  };

  // Hapus Pengajuan (HANYA di halaman Owner. Jika terlanjur di-ACC, otomatis jadwal tidak jadi berubah)
  const handleDeleteChange = (chg: ScheduleChange) => {
    scheduleService.deleteChange(chg.id);
    setSchedules(scheduleService.getSchedules());
    setChanges(scheduleService.getChanges());
  };

  // Helper format tanggal Indonesia
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
      
      {/* Top Header: Judul & Tombol Notifikasi Pengajuan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/owner/kasir')}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors shadow-xs shrink-0 cursor-pointer"
            title="Kembali ke Kontrol Akun"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Jadwal Shift <span className="text-blue-600">Kasir</span>
            </h1>
          </div>
        </div>

        {/* Toolbar Kanan: Tombol Pengajuan */}
        <div className="flex items-center gap-2">
          {/* Tombol Pengajuan (Bentuk Notifikasi Dropdown Ringkas Tanpa Card Boros Ruang) */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="clay-btn clay-btn-primary !py-2 !px-3.5 text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              <span>Pengajuan</span>
              {pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
                  {pendingCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 z-50 w-[calc(100vw-2rem)] sm:w-[480px] max-w-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in flex flex-col max-h-[420px]">
                {/* Header Sticky dengan HANYA tombol silang X saja (Tanda silang tidak ikut kegulir) */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/95 shrink-0 sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="font-extrabold text-slate-900 text-sm">
                      Pengajuan Perubahan Jadwal
                    </span>
                    {pendingCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold">
                        {pendingCount} baru
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotificationOpen(false)}
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
                      Tidak ada pengajuan perubahan jadwal saat ini.
                    </div>
                  ) : (
                    changes.slice(0, 10).map((chg) => (
                      <div key={chg.id} className="p-3.5 hover:bg-slate-50/80 transition-colors space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-sm">{chg.cashierName}</span>
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
                            <span className="text-slate-600 font-semibold text-xs">
                              {chg.dateRangeText}
                            </span>
                          </div>
                        </div>

                        {chg.targetCashierName && (
                          <div className="text-slate-600 text-[11px]">
                            Ditukar dengan: <strong>{chg.targetCashierName}</strong>
                          </div>
                        )}

                        <div className="text-slate-500 italic text-[11px]">
                          "{chg.reason}"
                        </div>

                        {/* Status & Action Buttons (Accept / Decline) */}
                        <div className="pt-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            {new Date(chg.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {chg.status === 'pending' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAccept(chg.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDecline(chg.id)}
                                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Decline</span>
                                </button>
                              </>
                            ) : (
                              <>
                                {chg.status === 'accepted' ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ✓ Diterima (Di-ACC)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                    ✕ Ditolak
                                  </span>
                                )}
                                {/* Tombol Hapus Pengajuan (Hanya ikon tempat sampah, muncul saat sudah di-ACC atau di-Decline) */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChange(chg)}
                                  className="p-1 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
                                  title="Hapus pengajuan ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
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

      {/* Baris Keterangan Shift & Filter Kalender (Kompak, Rapi, Seimbang & Konsisten dengan Halaman Kasir) */}
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

          {/* Reset Filter Badge jika terpilih */}
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

          {/* Kalender Popover */}
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
              {/* Header Card: Bulan & Tahun + Tanggal Pembuatan + Tombol Hapus */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight font-sans">
                      {sched.monthName} {sched.year}
                    </h2>
                    {/* Tanggal Pembuatan Jadwal (Khusus di Halaman Owner) */}
                    <div className="text-[11px] text-slate-500 font-medium">
                      Tanggal Dibuat: {formatIndonesianDate(sched.createdAt)}
                    </div>
                  </div>
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

              {/* Tabel Jadwal Bulanan (Garis Tegas & Inisial P / S / L / C / I) */}
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

    </div>
  );
};

export default OwnerJadwalPage;
