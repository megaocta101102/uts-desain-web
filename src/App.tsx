import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { LazyFallback } from './components/common/LazyFallback';

// Lazy-loaded pages for optimal performance and chunk splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const KasirPOSPage = lazy(() => import('./pages/KasirPOSPage'));
const OwnerStatistikPage = lazy(() => import('./pages/OwnerStatistikPage'));
const OwnerMenuPage = lazy(() => import('./pages/OwnerMenuPage'));
const OwnerKasirPage = lazy(() => import('./pages/OwnerKasirPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Protected Route Guards
const ProtectedOwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return <LazyFallback message="Memverifikasi Sesi Akses Owner..." />;
  }

  if (!user || role !== 'owner') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const ProtectedKasirRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LazyFallback message="Memverifikasi Sesi POS Kasir..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            {/* Customer Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/index.html" element={<Navigate to="/" replace />} />

            {/* Staff & Owner Login */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login.html" element={<Navigate to="/login" replace />} />

            {/* Kasir POS */}
            <Route
              path="/kasir"
              element={
                <ProtectedKasirRoute>
                  <KasirPOSPage />
                </ProtectedKasirRoute>
              }
            />
            <Route path="/kasir.html" element={<Navigate to="/kasir" replace />} />

            {/* Owner Portal */}
            <Route path="/owner" element={<Navigate to="/owner/statistik" replace />} />
            <Route path="/owner.html" element={<Navigate to="/owner/statistik" replace />} />
            
            <Route
              path="/owner/statistik"
              element={
                <ProtectedOwnerRoute>
                  <OwnerStatistikPage />
                </ProtectedOwnerRoute>
              }
            />
            <Route path="/owner-statistik.html" element={<Navigate to="/owner/statistik" replace />} />

            <Route
              path="/owner/menu"
              element={
                <ProtectedOwnerRoute>
                  <OwnerMenuPage />
                </ProtectedOwnerRoute>
              }
            />
            <Route path="/owner-menu.html" element={<Navigate to="/owner/menu" replace />} />

            <Route
              path="/owner/kasir"
              element={
                <ProtectedOwnerRoute>
                  <OwnerKasirPage />
                </ProtectedOwnerRoute>
              }
            />
            <Route path="/owner-kasir.html" element={<Navigate to="/owner/kasir" replace />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Aesthetic Footer */}
      <footer className="bg-white/80 border-t border-blue-100 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} <strong>Meo Cafe</strong> • All Rights Reserved.
          </span>
          <span className="text-slate-400">
            Dikelola oleh Owner Mega Octa • Jl. Pelabuhan Tanjuk Priok No.10, Malang
          </span>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
