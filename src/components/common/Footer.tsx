import React from 'react';
import { Link } from 'react-router-dom';
import {
  Coffee,
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { DEFAULT_CONFIG } from '../../services/config';

export const Footer: React.FC = () => {
  return (
    <footer id="infoSection" className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
          
          {/* Column 1: Brand & About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Coffee className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white font-display">
                  Meo <span className="text-blue-400">Cafe</span>
                </span>
                <span className="text-[11px] text-blue-400 font-medium tracking-wider uppercase">
                  Specialty Coffee & Eatery
                </span>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed">
              Tempat singgah nyaman di Kota Malang untuk menikmati racikan kopi istimewa, hidangan lezat, dan suasana hangat yang cocok untuk santai maupun bekerja.
            </p>
          </div>

          {/* Column 2: Hubungi Kami */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white tracking-wide font-display border-b border-slate-800 pb-2">
              Hubungi Kami
            </h3>
            
            <ul className="space-y-3.5 text-sm">
              {/* Phone / WhatsApp */}
              <li>
                <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Contact Person / WhatsApp</span>
                </div>
                <div className="flex flex-col gap-1">
                  <a
                    href="https://wa.me/6282245951378"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-200 hover:text-blue-400 font-semibold inline-flex items-center gap-2 transition-colors group"
                  >
                    <span className="group-hover:underline">082245951378</span>
                    <MessageCircle className="w-4 h-4 text-emerald-400 opacity-80 group-hover:opacity-100" />
                  </a>
                </div>
              </li>

              {/* Email */}
              <li>
                <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Email Resmi</span>
                </div>
                <a
                  href={`mailto:${DEFAULT_CONFIG.CAFE_EMAIL}`}
                  className="text-slate-200 hover:text-blue-400 text-xs sm:text-sm break-all font-medium transition-colors hover:underline block"
                >
                  {DEFAULT_CONFIG.CAFE_EMAIL}
                </a>
              </li>

              {/* Alamat Singkat */}
              <li>
                <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Alamat</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {DEFAULT_CONFIG.CAFE_ADDRESS}
                </p>
              </li>
            </ul>
          </div>

          {/* Column 3: Jam Operasional */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white tracking-wide font-display border-b border-slate-800 pb-2">
              Jam Operasional
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Senin - Jumat:</span>
                    <span className="text-slate-100 font-semibold">09:00 - 23:00 WIB</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Sabtu - Minggu:</span>
                    <span className="text-slate-100 font-semibold">08:00 - 00:00 WIB</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                Melayani pesanan <strong>Dine-in</strong>, <strong>Takeaway</strong>, dan reservasi acara.
              </div>

              <a
                href={DEFAULT_CONFIG.CAFE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors pt-1"
              >
                <span>Buka Petunjuk Arah di Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Column 4: Navigasi Cepat (Hanya tampil di HP / Mobile, disembunyikan di Laptop/Desktop) */}
          <div className="space-y-4 md:hidden pt-4 border-t border-slate-800">
            <h3 className="text-base font-bold text-white tracking-wide font-display border-b border-slate-800 pb-2">
              Navigasi Cepat
            </h3>

            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2 group text-xs"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  <span>Beranda</span>
                </Link>
              </li>
              <li>
                <a
                  href="/#menuSection"
                  className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2 group text-xs"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  <span>Daftar Menu & Kategori</span>
                </a>
              </li>
              <li>
                <a
                  href="#infoSection"
                  className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2 group text-xs"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  <span>Kontak & Jam Kerja</span>
                </a>
              </li>
              <li className="pt-2 border-t border-slate-800/80">
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors inline-flex items-center gap-2 group text-xs"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                  <span>Portal Login Staf (Kasir / Owner)</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar / Copyright */}
      <div className="border-t border-slate-800/80 bg-slate-950/60 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} <strong className="text-slate-300">Meo Cafe</strong>. Seluruh Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Kota Malang, Jawa Timur</span>
            <span>•</span>
            <span>Est. 2024</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
