import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LazyFallback } from './components/common/LazyFallback';

// Lazy-loaded pages for optimal performance and chunk splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const KasirPOSPage = lazy(() => import('./pages/KasirPOSPage'));
const KasirRiwayatPage = lazy(() => import('./pages/KasirRiwayatPage'));
const OwnerStatistikPage = lazy(() => import('./pages/OwnerStatistikPage'));
const OwnerTransaksiPage = lazy(() => import('./pages/OwnerTransaksiPage'));
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
    return <LazyFallback message="Memverifikasi Sesi Kasir POS..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/login.html';

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {!isLoginPage && <Navbar />}
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

            {/* Riwayat Transaksi Kasir (Dedicated Full Page) */}
            <Route
              path="/kasir/riwayat"
              element={
                <ProtectedKasirRoute>
                  <KasirRiwayatPage />
                </ProtectedKasirRoute>
              }
            />
            <Route path="/kasir-riwayat.html" element={<Navigate to="/kasir/riwayat" replace />} />

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
              path="/owner/transaksi"
              element={
                <ProtectedOwnerRoute>
                  <OwnerTransaksiPage />
                </ProtectedOwnerRoute>
              }
            />
            <Route path="/owner-transaksi.html" element={<Navigate to="/owner/transaksi" replace />} />

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

      {/* Structured, clean standard footer */}
      <Footer />
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
