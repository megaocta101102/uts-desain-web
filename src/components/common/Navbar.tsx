import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Coffee, LogIn, LayoutDashboard, Utensils, Users, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const isOwnerArea = location.pathname.startsWith('/owner');
  const isKasirArea = location.pathname.startsWith('/kasir');
  const isLogin = location.pathname === '/login';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-blue-100/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-[0_6px_16px_rgba(37,99,235,0.3)] transition-transform group-hover:scale-105">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 font-sans">
                Meo <span className="text-blue-600">Cafe</span>
              </span>
              {isOwnerArea && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                  Owner Portal
                </span>
              )}
              {isKasirArea && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                  Kasir POS
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Navigation Links depending on area */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/60 shadow-inner">
          {isOwnerArea ? (
            <>
              <Link
                to="/owner/statistik"
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  location.pathname === '/owner/statistik'
                    ? 'bg-white text-blue-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
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
                    ? 'bg-white text-blue-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
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
                    ? 'bg-white text-blue-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Akun Kasir
              </Link>
            </>
          ) : isKasirArea ? (
            <>
              <span className="px-4 py-1.5 text-sm font-medium text-slate-700">
                Mode Kasir Aktif
              </span>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  location.pathname === '/'
                    ? 'bg-white text-blue-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
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
                Lokasi & Jam
              </a>
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-bold text-slate-800 leading-tight">
                  {user.name}
                </span>
                <span className="text-xs text-blue-600 uppercase font-bold tracking-wider">
                  {user.role}
                </span>
              </div>

              {role === 'owner' && !isOwnerArea && (
                <Link
                  to="/owner/statistik"
                  className="clay-btn clay-btn-secondary !py-2 !px-4 text-xs font-semibold"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
              )}

              {role === 'kasir' && !isKasirArea && (
                <Link
                  to="/kasir"
                  className="clay-btn clay-btn-secondary !py-2 !px-4 text-xs font-semibold"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  Ke POS Kasir
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="p-2.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
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
              Beranda Pelanggan
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
  );
};

export default Navbar;
