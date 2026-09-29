import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  UserCheck,
  Edit2,
  Trash2,
  Lock,
  User,
  Shield,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { User as UserType } from '../types';
import { db } from '../services/supabase';

export const OwnerKasirPage: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
      // Ensure data is valid array and each user has safe fallbacks
      const sanitized = (Array.isArray(data) ? data : []).map((u) => ({
        ...u,
        name: u.name || u.username || 'Kasir',
        username: u.username || 'kasir',
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

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      password: '',
      name: '',
      role: 'kasir',
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
        setSuccessMsg('Akun kasir berhasil diperbarui!');
      } else {
        // Check duplicate
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
        setSuccessMsg('Akun kasir baru berhasil dibuat!');
      }

      setIsModalOpen(false);
      await loadUsers();
    } catch (err) {
      console.error('Error saving user', err);
      setErrorMsg('Gagal menyimpan akun pengguna.');
    }
  };

  const handleDelete = async (id: string, name: string, role: string) => {
    if (role === 'owner') {
      alert('Akun owner utama tidak boleh dihapus demi keamanan sistem.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun kasir "${name}"?`)) {
      await db.deleteUser(id);
      await loadUsers();
    }
  };

  const getInitialChar = (u: UserType) => {
    const raw = u?.name || u?.username || 'K';
    return raw.trim().charAt(0).toUpperCase() || 'K';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-blue-700 text-xs font-bold mb-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Manajemen Akses & Karyawan</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Manajemen Akun Kasir <span className="text-blue-600">Meo Cafe</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tambah akun kasir baru, atur kredensial login, dan pantau status aktif staf kasir.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="clay-btn clay-btn-primary !py-2.5 !px-5 text-sm font-semibold flex items-center gap-2 shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Kasir Baru</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => {
          const displayName = u?.name || u?.username || 'Kasir';
          const displayUsername = u?.username || 'kasir';
          const displayRole = u?.role || 'kasir';
          const displayStatus = u?.status || 'aktif';
          const initial = getInitialChar(u);

          return (
            <div
              key={u?.id || Math.random().toString()}
              className="clay-card p-6 bg-white border border-blue-100 flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {initial}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        displayRole === 'owner'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {displayRole}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        displayStatus === 'nonaktif'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {displayStatus}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-lg font-sans">
                    {displayName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Username: <strong>{displayUsername}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>Password: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">{u?.password || '••••••••'}</code></span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {u?.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : 'Sistem Utama'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="clay-btn clay-btn-secondary !py-1.5 !px-3 text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  {displayRole !== 'owner' && (
                    <button
                      onClick={() => handleDelete(u.id, displayName, displayRole)}
                      className="p-2 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                      title="Hapus Kasir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Cashier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                <h3 className="font-bold text-base">
                  {editingUser ? 'Edit Akun Kasir' : 'Tambah Akun Kasir Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Nama Lengkap Kasir *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso / Siti Rahma"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="clay-input !py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Username Login *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: kasir2 / kasir_malam"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="clay-input !py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Password Login (Plain Text) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan password untuk login"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="clay-input !py-2 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Hak Akses / Role
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({ ...userForm, role: e.target.value as 'kasir' | 'owner' })
                    }
                    className="clay-input !py-2 text-xs"
                  >
                    <option value="kasir">Kasir POS</option>
                    <option value="owner">Owner Manager</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Status Akun
                  </label>
                  <select
                    value={userForm.status}
                    onChange={(e) =>
                      setUserForm({ ...userForm, status: e.target.value as 'aktif' | 'nonaktif' })
                    }
                    className="clay-input !py-2 text-xs"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
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
                  className="clay-btn clay-btn-primary !py-2 !px-5 text-xs shadow-md"
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
