import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export function Users({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    cnpj: '',
    nome: '',
    gw_app_key: '',
    basic_auth_base64: '',
    chave_pix_recebedor: '',
    nome_recebedor: '',
    cidade_recebedor: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (error) {
      showToast('Erro ao carregar usuários', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
        showToast('Usuário atualizado com sucesso!', 'success');
      } else {
        await api.post('/users', formData);
        showToast('Usuário criado com sucesso!', 'success');
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({
        cnpj: '',
        nome: '',
        gw_app_key: '',
        basic_auth_base64: '',
        chave_pix_recebedor: '',
        nome_recebedor: '',
        cidade_recebedor: '',
      });
      loadUsers();
    } catch (error) {
      showToast(error.response?.data?.error || 'Erro ao salvar usuário', 'error');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      cnpj: user.cnpj,
      nome: user.nome,
      gw_app_key: '',
      basic_auth_base64: '',
      chave_pix_recebedor: user.chave_pix_recebedor || '',
      nome_recebedor: user.nome_recebedor || '',
      cidade_recebedor: user.cidade_recebedor || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;
    
    try {
      await api.delete(`/users/${id}`);
      showToast('Usuário removido com sucesso!', 'success');
      loadUsers();
    } catch (error) {
      showToast(error.response?.data?.error || 'Erro ao remover usuário', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Usuários PIX</h1>
          <p className="text-slate-400">Gerenciar usuários do sistema</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingUser(null); }}>
          <Plus size={20} />
          Novo Usuário
        </Button>
      </div>

      {showForm && (
        <Card title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="CNPJ"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                required
                disabled={!!editingUser}
                maxLength={14}
              />
              <Input
                label="Nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="GW App Key"
                value={formData.gw_app_key}
                onChange={(e) => setFormData({ ...formData, gw_app_key: e.target.value })}
                required={!editingUser}
                type="password"
              />
              <Input
                label="Basic Auth Base64"
                value={formData.basic_auth_base64}
                onChange={(e) => setFormData({ ...formData, basic_auth_base64: e.target.value })}
                required={!editingUser}
                type="password"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Chave PIX Recebedor"
                value={formData.chave_pix_recebedor}
                onChange={(e) => setFormData({ ...formData, chave_pix_recebedor: e.target.value })}
              />
              <Input
                label="Nome Recebedor"
                value={formData.nome_recebedor}
                onChange={(e) => setFormData({ ...formData, nome_recebedor: e.target.value })}
              />
            </div>
            <Input
              label="Cidade Recebedor"
              value={formData.cidade_recebedor}
              onChange={(e) => setFormData({ ...formData, cidade_recebedor: e.target.value })}
            />
            <div className="flex gap-3">
              <Button type="submit" variant="success">
                Salvar
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingUser(null); }}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="text-center py-8 text-slate-400">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-slate-400">Nenhum usuário cadastrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-red-500/20">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">ID</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">CNPJ</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Nome</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Chave PIX</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-white">#{user.id}</td>
                    <td className="py-3 px-4 text-slate-300">{user.cnpj}</td>
                    <td className="py-3 px-4 text-white font-medium">{user.nome}</td>
                    <td className="py-3 px-4 text-slate-400">{user.chave_pix_recebedor || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.ativo 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        {user.ativo && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

