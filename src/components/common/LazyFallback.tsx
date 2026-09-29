import React from 'react';
import { Coffee } from 'lucide-react';

export const LazyFallback: React.FC<{ message?: string }> = ({ message = 'Memuat Halaman...' }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="relative mb-6">
        {/* Claymorphic Glow Backdrop */}
        <div className="w-24 h-24 rounded-3xl bg-blue-50 shadow-[10px_14px_24px_rgba(37,99,235,0.1),-6px_-6px_18px_rgba(255,255,255,0.95)] border border-blue-100/70 flex items-center justify-center animate-pulse">
          <Coffee className="w-10 h-10 text-blue-600 animate-bounce" />
        </div>
        {/* Soft Ring Spinner */}
        <div className="absolute -inset-2 border-2 border-blue-400/30 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      
      <h3 className="font-semibold text-lg text-slate-800 tracking-wide font-sans">
        Meo Cafe
      </h3>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">
        {message}
      </p>

      {/* Modern Skeleton Bar */}
      <div className="w-48 h-1.5 bg-blue-100 rounded-full overflow-hidden mt-6 shadow-inner">
        <div className="w-1/2 h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-[shimmer_1.5s_infinite_linear]" style={{
          backgroundImage: 'linear-gradient(90deg, #2563EB 0%, #60A5FA 50%, #2563EB 100%)',
          backgroundSize: '200% 100%'
        }}></div>
      </div>
    </div>
  );
};

export default LazyFallback;
