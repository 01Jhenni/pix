import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { RefreshCw, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { api } from '../services/api';

export function Dashboard({ showToast }) {
  const [stats, setStats] = useState({
    users: 0,
    transactions: 0,
    active: 0,
    pending: 0,
    rejected: 0,
    cancelled: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [usersRes, transRes] = await Promise.all([
        api.get('/users'),
        api.get('/transactions?limit=1000')
      ]);

      const users = usersRes.data.data.filter(u => u.ativo).length;
      const transactions = transRes.data.data;
      const active = transactions.filter(t => t.status === 'ATIVA').length;
      const pending = transactions.filter(t => t.status === 'PENDENTE').length;
      const rejected = transactions.filter(t => t.status === 'REJEITADA').length;
      const cancelled = transactions.filter(t => t.status === 'CANCELADA').length;
      const totalValue = transactions.reduce((sum, t) => {
        return sum + parseFloat(t.valor_recorrencia || 0);
      }, 0);

      setStats({
        users,
        transactions: transactions.length,
        active,
        pending,
        rejected,
        cancelled,
        totalValue,
      });
    } catch (error) {
      showToast('Erro ao carregar estatísticas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Usuários Ativos',
      value: stats.users,
      icon: Users,
      color: 'from-red-500 to-red-700',
    },
    {
      label: 'Total Transações',
      value: stats.transactions,
      icon: Activity,
      color: 'from-green-500 to-green-700',
    },
    {
      label: 'Transações Ativas',
      value: stats.active,
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-700',
    },
    {
      label: 'Valor Total',
      value: `R$ ${stats.totalValue.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Visão geral do sistema PIX</p>
        </div>
        <button
          onClick={loadStats}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`
                bg-gradient-to-br ${stat.color}
                rounded-xl p-6 text-white
                shadow-xl transform transition-transform hover:scale-105
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon size={24} className="opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm opacity-90">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Status Chart */}
      <Card title="Status das Transações">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="text-2xl font-bold text-green-400 mb-1">{stats.active}</div>
            <div className="text-sm text-slate-400">Ativas</div>
          </div>
          <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.pending}</div>
            <div className="text-sm text-slate-400">Pendentes</div>
          </div>
          <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="text-2xl font-bold text-red-400 mb-1">{stats.rejected}</div>
            <div className="text-sm text-slate-400">Rejeitadas</div>
          </div>
          <div className="text-center p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="text-2xl font-bold text-slate-400 mb-1">{stats.cancelled}</div>
            <div className="text-sm text-slate-400">Canceladas</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

