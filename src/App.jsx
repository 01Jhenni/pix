import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreateRecurrence } from './pages/CreateRecurrence';
import { Users } from './pages/Users';
import { Transactions } from './pages/Transactions';
import { WhiteLabel } from './pages/WhiteLabel';
import { ApiKeys } from './pages/ApiKeys';
import { ToastContainer } from './components/Toast';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard showToast={showToast} />}
      {activeTab === 'create' && <CreateRecurrence showToast={showToast} />}
      {activeTab === 'users' && <Users showToast={showToast} />}
      {activeTab === 'transactions' && <Transactions showToast={showToast} />}
      {activeTab === 'whitelabel' && <WhiteLabel showToast={showToast} />}
      {activeTab === 'apikeys' && <ApiKeys showToast={showToast} />}
      <ToastContainer toasts={toasts} />
    </Layout>
  );
}

export default App;

