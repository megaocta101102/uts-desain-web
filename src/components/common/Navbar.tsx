import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Coffee,
  LogIn,
  LayoutDashboard,
  Utensils,
  Users,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [isMobileOwnerSidebarOpen, setIsMobileOwnerSidebarOpen] = useState(false);

  const isOwnerArea = location.pathname.startsWith('/owner');
  const isKasirArea = location.pathname.startsWith('/kasir');
  const isLogin = location.pathname === '/login';

  // Automatically close sidebar when route changes
  useEffect(() => {
    setIsMobileOwnerSidebarOpen(false);
  }, [location.pathname]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOwnerSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 border-b border-blue-100/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            {/* Mobile Owner Sidebar Toggle Button (Hide / Show) */}
            {isOwnerArea && (
              <button
                onClick={() => setIsMobileOwnerSidebarOpen(!isMobileOwnerSidebarOpen)}
                className="md:hidden p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all active:scale-95 flex items-center gap-1.5"
                title={isMobileOwnerSidebarOpen ? "Sembunyikan Navigasi" : "Tampilkan Navigasi Menu"}
                aria-label="Toggle Menu Navigasi Owner"
              >
                {isMobileOwnerSidebarOpen ? (
                  <X className="w-5 h-5 text-blue-700" />
                ) : (
                  <Menu className="w-5 h-5 text-blue-700" />
                )}
                <span className="text-xs font-bold">Navigasi</span>
              </button>
            )}

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_6px_16px_rgba(37,99,235,0.25)] transition-transform group-hover:scale-105">
                <Coffee className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 font-sans">
                Meo <span className="text-blue-600">Cafe</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links (Untouched as requested: 'pada tampilan desktop biarin') */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60">
            {isOwnerArea ? (
              <>
                <Link
                  to="/owner/statistik"
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                    location.pathname === '/owner/statistik'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Statistik
                </Link>
                <Link
                  to="/owner/menu"
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                    location.pathname === '/owner/menu'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  Kelola Menu
                </Link>
                <Link
                  to="/owner/kasir"
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                    location.pathname === '/owner/kasir'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Kontrol Akun
                </Link>
              </>
            ) : isKasirArea ? (
              <span className="px-4 py-1.5 text-sm font-medium text-slate-700">
                Kasir POS
              </span>
            ) : (
              <>
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    location.pathname === '/'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Beranda
                </Link>
                <a
                  href="/#menuSection"
                  className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all"
                >
                  Daftar Menu
                </a>
                <a
                  href="/#infoSection"
                  className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all"
                >
                  Kontak & Info
                </a>
              </>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-bold text-slate-800 leading-tight">
                    {user?.name || user?.username || 'User'}
                  </span>
                  <span className="text-xs text-blue-600 uppercase font-bold tracking-wider">
                    {user?.role || 'kasir'}
                  </span>
                </div>

                {role === 'owner' && !isOwnerArea && (
                  <Link
                    to="/owner/statistik"
                    className="clay-btn clay-btn-secondary !py-2 !px-3 sm:!px-4 text-xs font-semibold"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                )}

                {role === 'kasir' && !isKasirArea && (
                  <Link
                    to="/kasir"
                    className="clay-btn clay-btn-secondary !py-2 !px-3 sm:!px-4 text-xs font-semibold"
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ke POS</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2 sm:p-2.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : isLogin ? (
              <Link
                to="/"
                className="clay-btn clay-btn-secondary !py-2 !px-4 text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Beranda
              </Link>
            ) : (
              <Link
                to="/login"
                className="clay-btn clay-btn-primary !py-2.5 !px-5 text-sm flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login Staf
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer / Sidebar for Owner Navigation */}
      {isOwnerArea && isMobileOwnerSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
          {/* Backdrop with click-to-hide */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOwnerSidebarOpen(false)}
          />

          {/* Slide-in Sidebar Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl border-r border-blue-100 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Sidebar Header with Hide Button */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block leading-tight font-sans">
                      Meo <span className="text-blue-600">Cafe</span>
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                      Panel Owner
                    </span>
                  </div>
                </div>

                {/* Hide Button (Tombol Tutup / Hide) */}
                <button
                  onClick={() => setIsMobileOwnerSidebarOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Sembunyikan Navigasi"
                  aria-label="Tutup Navigasi"
                >
                  <X className="w-4 h-4" />
                  <span>Tutup</span>
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="p-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1 block">
                  Navigasi Halaman Owner
                </span>

                <Link
                  to="/owner/statistik"
                  onClick={() => setIsMobileOwnerSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    location.pathname === '/owner/statistik'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Statistik & Laporan</span>
                </Link>

                <Link
                  to="/owner/menu"
                  onClick={() => setIsMobileOwnerSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    location.pathname === '/owner/menu'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Utensils className="w-4 h-4 shrink-0" />
                  <span>Manajemen Menu & Topping</span>
                </Link>

                <Link
                  to="/owner/kasir"
                  onClick={() => setIsMobileOwnerSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    location.pathname === '/owner/kasir'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Kontrol Akun</span>
                </Link>

                <div className="pt-3 border-t border-slate-100 my-2"></div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1 block">
                  Akses Cepat Lainnya
                </span>

                <Link
                  to="/kasir"
                  onClick={() => setIsMobileOwnerSidebarOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <Coffee className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>Buka POS Kasir</span>
                </Link>

                <Link
                  to="/"
                  onClick={() => setIsMobileOwnerSidebarOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <Home className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>Lihat Halaman Utama</span>
                </Link>
              </nav>
            </div>

            {/* Sidebar Footer: User Info & Logout */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
              <div className="px-2">
                <span className="text-xs font-bold text-slate-800 block truncate">
                  {user?.name || user?.username || 'Owner'}
                </span>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                  Hak Akses: Pemilik Kafe
                </span>
              </div>

              <button
                onClick={() => {
                  setIsMobileOwnerSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar / Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default Navbar;
