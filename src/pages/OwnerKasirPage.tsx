import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  UserCheck,
  Edit2,
  Trash2,
  User,
  Shield,
  AlertCircle,
  KeyRound,
  Search,
  Crown,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  Copy,
  Check
} from 'lucide-react';
import { User as UserType } from '../types';
import { db } from '../services/supabase';

export const OwnerKasirPage: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filter for Cashiers
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aktif' | 'nonaktif'>('all');
  
  // Password Visibility state per cashier user ID
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'kasir' as 'kasir' | 'owner',
    status: 'aktif' as 'aktif' | 'nonaktif',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadUsers = async () => {
    try {
      const data = await db.getUsers();
      const sanitized = (Array.isArray(data) ? data : []).map((u) => ({
        ...u,
        name: u.name || u.username || 'Pengguna',
        username: u.username || 'user',
        role: (u.role || 'kasir') as 'kasir' | 'owner',
        status: (u.status || 'aktif') as 'aktif' | 'nonaktif',
      }));
      setUsers(sanitized);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Split Users into Owner & Kasir
  const owners = useMemo(() => {
    return users.filter((u) => u.role === 'owner');
  }, [users]);

  const cashiers = useMemo(() => {
    return users.filter((u) => u.role !== 'owner');
  }, [users]);

  const filteredCashiers = useMemo(() => {
    return cashiers.filter((c) => {
      const matchQuery =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [cashiers, searchQuery, statusFilter]);

  const activeCashiersCount = useMemo(() => {
    return cashiers.filter((c) => c.status === 'aktif').length;
  }, [cashiers]);

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopyPassword = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = (defaultRole: 'kasir' | 'owner' = 'kasir') => {
    setEditingUser(null);
    setUserForm({
      username: '',
      password: '',
      name: '',
      role: defaultRole,
      status: 'aktif',
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: UserType) => {
    setEditingUser(u);
    setUserForm({
      username: u?.username || '',
      password: u?.password || '',
      name: u?.name || u?.username || '',
      role: u?.role || 'kasir',
      status: (u?.status as 'aktif' | 'nonaktif') || 'aktif',
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user: UserType) => {
    if (user.role === 'owner' && user.status === 'aktif' && owners.filter(o => o.status === 'aktif').length <= 1) {
      alert('Minimal harus ada 1 akun owner yang aktif untuk mengelola sistem.');
      return;
    }
    const newStatus = user.status === 'aktif' ? 'nonaktif' : 'aktif';
    try {
      await db.updateUser(user.id, { status: newStatus });
      await loadUsers();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim() || !userForm.password.trim() || !userForm.name.trim()) {
      setErrorMsg('Semua kolom wajib diisi!');
      return;
    }

    try {
      if (editingUser) {
        await db.updateUser(editingUser.id, {
          username: userForm.username.trim().toLowerCase(),
          password: userForm.password.trim(),
          name: userForm.name.trim(),
          role: userForm.role,
          status: userForm.status,
        });
        setSuccessMsg(`Akun ${userForm.role === 'owner' ? 'Owner' : 'Kasir'} berhasil diperbarui!`);
      } else {
        // Check duplicate username
        const exists = users.some(
          (u) => (u?.username || '').toLowerCase() === userForm.username.trim().toLowerCase()
        );
        if (exists) {
          setErrorMsg('Username ini sudah digunakan, silakan pilih username lain.');
          return;
        }

        await db.insertUser({
          username: userForm.username.trim().toLowerCase(),
          password: userForm.password.trim(),
          name: userForm.name.trim(),
          role: userForm.role,
          status: userForm.status,
        });
        setSuccessMsg(`Akun ${userForm.role === 'owner' ? 'Owner' : 'Kasir'} baru berhasil dibuat!`);
      }

      setIsModalOpen(false);
      await loadUsers();
    } catch (err) {
      console.error('Error saving user', err);
      setErrorMsg('Gagal menyimpan akun pengguna.');
    }
  };

  const handleDelete = async (id: string, name: string, role: string) => {
    if (role === 'owner' && owners.length <= 1) {
      alert('Akun Owner terakhir tidak boleh dihapus demi keamanan sistem.');
      return;
    }

    const typeLabel = role === 'owner' ? 'Owner' : 'Kasir';
    if (confirm(`Apakah Anda yakin ingin menghapus akun ${typeLabel} "${name}"?`)) {
      await db.deleteUser(id);
      await loadUsers();
    }
  };

  const getInitialChar = (u: UserType) => {
    const raw = u?.name || u?.username || 'U';
    return raw.trim().charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header (Clean & minimal) */}
      <div className="bg-white px-6 py-5 rounded-3xl border border-blue-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
              Kontrol Akun
            </h1>
            <p className="text-xs text-slate-500">
              Pengaturan akun pengelola owner dan kasir POS
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Akun Owner (Memanjang ke bawah, scrollable bila bertambah) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-100/30 p-5 rounded-3xl border border-amber-200/80 shadow-sm flex flex-col space-y-4">
            
            {/* Owner Section Header with Add Button */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Crown className="w-4 h-4" />
                </div>
                <h2 className="font-extrabold text-slate-900 text-base font-display">
                  Akun Owner
                </h2>
              </div>
              
              <button
                onClick={() => handleOpenAdd('owner')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>+ Tambah Owner</span>
              </button>
            </div>

            {/* Scrollable Container for Owners */}
            <div className="max-h-[640px] overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
              {owners.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-amber-200">
                  Belum ada akun owner terdaftar.
                </div>
              ) : (
                owners.map((owner) => {
                  const initial = getInitialChar(owner);

                  return (
                    <div
                      key={owner.id}
                      className="bg-white p-4.5 rounded-2xl border border-amber-200/90 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden"
                    >
                      {/* Top Accent Stripe */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>

                      <div className="flex items-start justify-between gap-2 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                            {initial}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm">
                              {owner.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <User className="w-3 h-3 text-amber-600" />
                              <span className="font-medium text-slate-700">@{owner.username}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                            Owner
                          </span>
                          <button
                            onClick={() => handleToggleStatus(owner)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                              owner.status === 'aktif'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Klik untuk ubah status"
                          >
                            ● {owner.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </div>
                      </div>

                      {/* Card Footer Actions (Tanpa password) */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400">
                          {owner.created_at ? new Date(owner.created_at).toLocaleDateString('id-ID') : 'Akun Utama'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(owner)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          {owners.length > 1 && (
                            <button
                              onClick={() => handleDelete(owner.id, owner.name, 'owner')}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                              title="Hapus Akun Owner"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Akun Kasir (List Layout format) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm space-y-5">
            
            {/* Kasir Header & Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base font-display">
                    Akun Kasir
                  </h2>
                  <p className="text-xs text-slate-400">
                    Total {cashiers.length} Kasir ({activeCashiersCount} Aktif)
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleOpenAdd('kasir')}
                className="clay-btn clay-btn-primary !py-2 !px-4 text-xs font-bold flex items-center justify-center gap-1.5 self-start sm:self-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Tambah Kasir</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search with icon on right side */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="clay-input !py-2 pl-4 pr-10 text-xs w-full"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold shrink-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-white text-blue-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({cashiers.length})
                </button>
                <button
                  onClick={() => setStatusFilter('aktif')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    statusFilter === 'aktif'
                      ? 'bg-white text-emerald-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Aktif ({activeCashiersCount})
                </button>
                <button
                  onClick={() => setStatusFilter('nonaktif')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    statusFilter === 'nonaktif'
                      ? 'bg-white text-red-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Nonaktif ({cashiers.length - activeCashiersCount})
                </button>
              </div>
            </div>

            {/* Structured Cashier List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                  Memuat data kasir...
                </div>
              ) : filteredCashiers.length === 0 ? (
                <div className="p-10 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                  <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700">Tidak ada akun kasir ditemukan</p>
                    <p className="text-xs text-slate-400">
                      {searchQuery
                        ? `Tidak ada kasir yang cocok dengan pencarian "${searchQuery}"`
                        : 'Belum ada akun kasir terdaftar di sistem.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenAdd('kasir')}
                    className="clay-btn clay-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Tambah Kasir Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {filteredCashiers.map((cashier, idx) => {
                    const initial = getInitialChar(cashier);
                    const showPass = !!showPasswordMap[cashier.id];

                    return (
                      <div
                        key={cashier.id}
                        className={`p-4 transition-colors hover:bg-blue-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                        }`}
                      >
                        {/* Kasir Profile Info */}
                        <div className="flex items-center gap-3.5 min-w-[220px]">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-slate-900 text-sm">
                                {cashier.name}
                              </h3>
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase bg-blue-100 text-blue-800">
                                Kasir
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>username: <strong className="text-slate-700">{cashier.username}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Password Pill with Show/Copy (Khusus Akun Kasir) */}
                        <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60 self-start md:self-auto">
                          <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[11px] text-slate-500">Pass:</span>
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {showPass ? (cashier.password || '••••••••') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(cashier.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors ml-1"
                            title={showPass ? 'Sembunyikan' : 'Tampilkan'}
                          >
                            {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          {cashier.password && (
                            <button
                              type="button"
                              onClick={() => handleCopyPassword(cashier.password || '', cashier.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                              title="Salin Password"
                            >
                              {copiedId === cashier.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Status Toggle Button */}
                        <div className="flex items-center gap-2 self-start md:self-auto">
                          <button
                            onClick={() => handleToggleStatus(cashier)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                              cashier.status === 'aktif'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                            title="Klik untuk ubah status aktif/nonaktif"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${cashier.status === 'aktif' ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                            <span>{cashier.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</span>
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-end">
                          <button
                            onClick={() => handleOpenEdit(cashier)}
                            className="clay-btn clay-btn-secondary !py-1.5 !px-3 text-xs font-semibold flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDelete(cashier.id, cashier.name, 'kasir')}
                            className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                            title="Hapus Kasir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* Modal Add / Edit User (Otomatis menyesuaikan peran Owner / Kasir) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className={`p-5 text-white flex items-center justify-between shrink-0 ${
              userForm.role === 'owner'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}>
              <div className="flex items-center gap-2.5">
                {userForm.role === 'owner' ? <Crown className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                <h3 className="font-bold text-base">
                  {editingUser
                    ? `Edit Akun ${userForm.role === 'owner' ? 'Owner' : 'Kasir'}`
                    : `Tambah Akun ${userForm.role === 'owner' ? 'Owner Baru' : 'Kasir Baru'}`}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white font-bold p-1 text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Nama Lengkap {userForm.role === 'owner' ? 'Owner' : 'Kasir'} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={userForm.role === 'owner' ? 'Contoh: Mega Octavia' : 'Contoh: Budi Santoso'}
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="clay-input !py-2 pl-3.5 pr-10 text-xs w-full"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Username Login *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={userForm.role === 'owner' ? 'Contoh: owner2 / manager' : 'Contoh: kasir2 / kasir_malam'}
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="clay-input !py-2 pl-3.5 pr-10 text-xs w-full"
                  />
                  <Shield className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Password Login *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Masukkan password login"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="clay-input !py-2 pl-3.5 pr-10 text-xs font-mono w-full"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Status Akun
                </label>
                <select
                  value={userForm.status}
                  onChange={(e) =>
                    setUserForm({ ...userForm, status: e.target.value as 'aktif' | 'nonaktif' })
                  }
                  className="clay-input !py-2 text-xs w-full"
                >
                  <option value="aktif">Aktif (Bisa Login)</option>
                  <option value="nonaktif">Nonaktif (Akses Diblokir)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={
                    userForm.role === 'owner'
                      ? 'px-5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all'
                      : 'clay-btn clay-btn-primary !py-2 !px-5 text-xs shadow-md'
                  }
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerKasirPage;
