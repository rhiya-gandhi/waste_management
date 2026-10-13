import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Dashboard } from './pages/Dashboard';
import { CreateBatchPage } from './pages/CreateBatchPage';
import { BatchDetailPage } from './pages/BatchDetailPage';
import { RecyclerMatchingPage } from './pages/RecyclerMatchingPage';
import { RecyclerDirectoryPage } from './pages/RecyclerDirectoryPage';
import { MapViewPage } from './pages/MapViewPage';
import { AdminDashboard } from './pages/AdminDashboard';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/recyclers" element={<RecyclerDirectoryPage />} />
              <Route path="/map" element={<MapViewPage />} />

              {/* Protected Authenticated Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-batch"
                element={
                  <ProtectedRoute allowedRoles={['generator', 'admin']}>
                    <CreateBatchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/batch/:batchId"
                element={
                  <ProtectedRoute>
                    <BatchDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/batch/:batchId/match"
                element={
                  <ProtectedRoute>
                    <RecyclerMatchingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
