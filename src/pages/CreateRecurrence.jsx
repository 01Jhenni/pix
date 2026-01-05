import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../services/api';
import QRCode from 'qrcode';

export function CreateRecurrence({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pixUserId: '',
    cpfDevedor: '',
    nomeDevedor: '',
    contrato: '',
    dataInicial: '',
    periodicidade: 'MENSAL',
    politicaRetentativa: 'PERMITE_3R_7D',
    valorRec: '',
    valorPrimeiroPagamento: '',
    chavePixRecebedor: '',
  });
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadUsers();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    setFormData(prev => ({
      ...prev,
      dataInicial: hoje.toISOString().split('T')[0],
    }));
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data.filter(u => u.ativo));
    } catch (error) {
      showToast('Erro ao carregar usuários', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await api.post('/pix/jornada3', formData);
      
      if (res.data.success) {
        showToast('Recorrência criada com sucesso!', 'success');
        setResult(res.data.data);
        
        // Gerar QR Code se não vier na resposta
        if (res.data.data.pixCopiaECola && !res.data.data.qrCodeImage) {
          try {
            const qrCodeImage = await QRCode.toDataURL(res.data.data.pixCopiaECola, {
              width: 300,
              margin: 2,
            });
            setResult(prev => ({ ...prev, qrCodeImage }));
          } catch (err) {
            console.error('Erro ao gerar QR Code:', err);
          }
        }
        
        // Reset form
        setFormData(prev => ({
          ...prev,
          cpfDevedor: '',
          nomeDevedor: '',
          contrato: '',
          valorRec: '',
          valorPrimeiroPagamento: '',
          chavePixRecebedor: '',
        }));
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Erro ao criar recorrência', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Código copiado!', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Criar Recorrência PIX</h1>
        <p className="text-slate-400">Gere uma nova recorrência PIX Jornada 3</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Usuário PIX <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.pixUserId}
                onChange={(e) => setFormData({ ...formData, pixUserId: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Selecione um usuário</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.nome} ({user.cnpj})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CPF do Devedor"
              type="text"
              value={formData.cpfDevedor}
              onChange={(e) => setFormData({ ...formData, cpfDevedor: e.target.value })}
              required
              maxLength={11}
              placeholder="12345678901"
              help="11 dígitos, apenas números"
            />
            <Input
              label="Nome do Devedor"
              type="text"
              value={formData.nomeDevedor}
              onChange={(e) => setFormData({ ...formData, nomeDevedor: e.target.value })}
              required
              maxLength={140}
              placeholder="JOÃO DA SILVA"
            />
          </div>

          <Input
            label="Contrato"
            type="text"
            value={formData.contrato}
            onChange={(e) => setFormData({ ...formData, contrato: e.target.value })}
            required
            maxLength={35}
            placeholder="63100555"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data Inicial"
              type="date"
              value={formData.dataInicial}
              onChange={(e) => setFormData({ ...formData, dataInicial: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Periodicidade <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.periodicidade}
                onChange={(e) => setFormData({ ...formData, periodicidade: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="DIARIA">Diária</option>
                <option value="SEMANAL">Semanal</option>
                <option value="MENSAL">Mensal</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Política Retentativa <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.politicaRetentativa}
                onChange={(e) => setFormData({ ...formData, politicaRetentativa: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="PERMITE_3R_7D">Permite 3R 7D</option>
                <option value="PERMITE_3R_15D">Permite 3R 15D</option>
                <option value="PERMITE_3R_30D">Permite 3R 30D</option>
              </select>
            </div>
            <Input
              label="Valor Recorrência"
              type="text"
              value={formData.valorRec}
              onChange={(e) => setFormData({ ...formData, valorRec: e.target.value })}
              required
              placeholder="99.90"
            />
          </div>

          <Input
            label="Valor Primeiro Pagamento"
            type="text"
            value={formData.valorPrimeiroPagamento}
            onChange={(e) => setFormData({ ...formData, valorPrimeiroPagamento: e.target.value })}
            required
            placeholder="99.90"
          />

          <Input
            label="Chave PIX Recebedor (opcional)"
            type="text"
            value={formData.chavePixRecebedor}
            onChange={(e) => setFormData({ ...formData, chavePixRecebedor: e.target.value })}
            placeholder="02429647000169"
            help="Deixe vazio para usar a chave padrão do usuário"
          />

          <Button type="submit" loading={loading} className="w-full">
            Criar Recorrência
          </Button>
        </form>
      </Card>

      {/* Resultado */}
      {result && (
        <Card title="QR Code Gerado">
          <div className="text-center space-y-4">
            {result.qrCodeImage && (
              <div className="flex justify-center">
                <img
                  src={result.qrCodeImage}
                  alt="QR Code PIX"
                  className="border-4 border-red-500/20 rounded-lg shadow-xl"
                />
              </div>
            )}
            {result.pixCopiaECola && (
              <div className="bg-slate-700/50 rounded-lg p-4 border border-red-500/20">
                <div className="text-sm text-slate-400 mb-2">PIX Copia e Cola:</div>
                <div className="font-mono text-xs text-white break-all mb-3">
                  {result.pixCopiaECola}
                </div>
                <Button
                  onClick={() => copyToClipboard(result.pixCopiaECola)}
                  size="sm"
                  className="w-full"
                >
                  Copiar Código
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

