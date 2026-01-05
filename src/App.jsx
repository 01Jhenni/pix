import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateRecurrence } from './pages/CreateRecurrence';
import { Users } from './pages/Users';
import { Transactions } from './pages/Transactions';
import { WhiteLabel } from './pages/WhiteLabel';
import { ApiKeys } from './pages/ApiKeys';
import { ToastContainer } from './components/Toast';

function AppContent() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard showToast={showToast} />} />
                  <Route path="/create" element={<CreateRecurrence showToast={showToast} />} />
                  <Route path="/users" element={<Users showToast={showToast} />} />
                  <Route path="/transactions" element={<Transactions showToast={showToast} />} />
                  <Route path="/whitelabel" element={<WhiteLabel showToast={showToast} />} />
                  <Route path="/apikeys" element={<ApiKeys showToast={showToast} />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer toasts={toasts} />
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

