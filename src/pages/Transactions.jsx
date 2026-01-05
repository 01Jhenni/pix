import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { RefreshCw, QrCode } from 'lucide-react';
import { api } from '../services/api';

export function Transactions({ showToast }) {
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    status: '',
  });
  const [selectedQR, setSelectedQR] = useState(null);

  useEffect(() => {
    loadUsers();
    loadTransactions();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data.filter(u => u.ativo));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      let url = '/transactions?limit=100';
      if (filters.userId) url += `&pixUserId=${filters.userId}`;
      if (filters.status) url += `&status=${filters.status}`;
      
      const res = await api.get(url);
      setTransactions(res.data.data);
    } catch (error) {
      showToast('Erro ao carregar transações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const viewQRCode = async (txid) => {
    try {
      const res = await api.get(`/pix/qrcode/${txid}`);
      if (res.data.success) {
        setSelectedQR(res.data.data);
      } else {
        showToast('QR Code não disponível', 'warning');
      }
    } catch (error) {
      showToast('Erro ao carregar QR Code', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      ATIVA: 'bg-green-500/20 text-green-400 border-green-500/30',
      PENDENTE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      REJEITADA: 'bg-red-500/20 text-red-400 border-red-500/30',
      CANCELADA: 'bg-slate-700 text-slate-400 border-slate-600',
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold border ${styles[status] || styles.PENDENTE}`}>
        {status || 'PENDENTE'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transações</h1>
          <p className="text-slate-400">Visualize e gerencie todas as transações</p>
        </div>
        <Button onClick={loadTransactions} variant="secondary">
          <RefreshCw size={20} />
          Atualizar
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Filtrar por Usuário
            </label>
            <select
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todos os usuários</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nome} ({user.cnpj})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Filtrar por Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todos os status</option>
              <option value="ATIVA">Ativa</option>
              <option value="PENDENTE">Pendente</option>
              <option value="REJEITADA">Rejeitada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Carregando...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">Nenhuma transação encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-red-500/20">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">TXID</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Devedor</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Valor</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Data</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(trans => (
                  <tr key={trans.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4">
                      <code className="text-xs text-red-400">{trans.txid}</code>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">{trans.nome_devedor}</div>
                      <div className="text-xs text-slate-400">{trans.cpf_devedor}</div>
                    </td>
                    <td className="py-3 px-4 text-white font-semibold">
                      R$ {parseFloat(trans.valor_recorrencia || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(trans.status)}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-sm">
                      {new Date(trans.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => viewQRCode(trans.txid)}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
                      >
                        <QrCode size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal QR Code */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedQR(null)}>
          <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">QR Code PIX</h3>
              {selectedQR.qrCodeImage && (
                <img
                  src={selectedQR.qrCodeImage}
                  alt="QR Code"
                  className="mx-auto border-4 border-red-500/20 rounded-lg"
                />
              )}
              {selectedQR.pixCopiaECola && (
                <div className="bg-slate-700/50 rounded-lg p-4 border border-red-500/20">
                  <div className="text-sm text-slate-400 mb-2">PIX Copia e Cola:</div>
                  <div className="font-mono text-xs text-white break-all mb-3">
                    {selectedQR.pixCopiaECola}
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedQR.pixCopiaECola);
                      showToast('Código copiado!', 'success');
                    }}
                    size="sm"
                    className="w-full"
                  >
                    Copiar Código
                  </Button>
                </div>
              )}
              <Button variant="secondary" onClick={() => setSelectedQR(null)} className="w-full">
                Fechar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

