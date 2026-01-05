import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  List, 
  Palette, 
  Key,
  Menu,
  X
} from 'lucide-react';
import { api } from '../services/api';

export function Layout({ children, activeTab, setActiveTab }) {
  const [stats, setStats] = useState({ users: 0, transactions: 0, active: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, transRes] = await Promise.all([
        api.get('/users'),
        api.get('/transactions?limit=1000')
      ]);
      
      const users = usersRes.data.data.filter(u => u.ativo).length;
      const transactions = transRes.data.data.length;
      const active = transRes.data.data.filter(t => t.status === 'ATIVA').length;
      
      setStats({ users, transactions, active });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Criar Recorrência', icon: PlusCircle },
    { id: 'users', label: 'Usuários PIX', icon: Users },
    { id: 'transactions', label: 'Transações', icon: List },
    { id: 'whitelabel', label: 'White Label', icon: Palette },
    { id: 'apikeys', label: 'API Keys', icon: Key },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-lg border-b border-red-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">PIX Jornada 3</h1>
                <p className="text-xs text-slate-400">Sistema Completo</p>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="text-red-400 font-bold text-lg">{stats.users}</div>
                <div className="text-xs text-slate-400">Usuários</div>
              </div>
              <div className="text-center px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="text-red-400 font-bold text-lg">{stats.transactions}</div>
                <div className="text-xs text-slate-400">Transações</div>
              </div>
              <div className="text-center px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="text-red-400 font-bold text-lg">{stats.active}</div>
                <div className="text-xs text-slate-400">Ativas</div>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-slate-900/95 backdrop-blur-lg border-r border-red-500/20
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          pt-16 md:pt-0
        `}>
          <nav className="p-4 space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Overlay para mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

