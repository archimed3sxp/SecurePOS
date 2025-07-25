import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { CashierDashboard } from './pages/CashierDashboard';
import { AuditorDashboard } from './pages/AuditorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/cashier" 
                element={
                  <ProtectedRoute requiredRole="cashier">
                    <CashierDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/auditor" 
                element={
                  <ProtectedRoute requiredRole="auditor">
                    <AuditorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;