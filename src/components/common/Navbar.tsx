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
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 border-b border-blue-100/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_6px_16px_rgba(37,99,235,0.25)] transition-transform group-hover:scale-105">
            <Coffee className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 font-sans">
            Meo <span className="text-blue-600">Cafe</span>
          </span>
        </Link>

        {/* Navigation Links */}
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
                Akun Kasir
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
  );
};

export default Navbar;
