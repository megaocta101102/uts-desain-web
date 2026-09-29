import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-md mb-6">
        <Coffee className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 font-display">404</h1>
      <h2 className="text-xl font-bold text-slate-800 mt-2">Halaman Tidak Ditemukan</h2>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-8">
        Halaman yang Anda cari mungkin telah dipindahkan atau URL salah.
      </p>
      <Link to="/" className="clay-btn clay-btn-primary flex items-center gap-2">
        <Home className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
