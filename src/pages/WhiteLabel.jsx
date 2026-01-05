import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Save } from 'lucide-react';
import { api } from '../services/api';

export function WhiteLabel({ showToast }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brand_name: '',
    brand_logo: '',
    primary_color: '#dc2626',
    secondary_color: '#991b1b',
    success_color: '#10b981',
    danger_color: '#dc2626',
    header_text: '',
    footer_text: '',
    favicon: '',
    custom_css: '',
    custom_js: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadProfile(selectedUserId);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data.filter(u => u.ativo));
    } catch (error) {
      showToast('Erro ao carregar usuários', 'error');
    }
  };

  const loadProfile = async (userId) => {
    try {
      const res = await api.get(`/profiles/${userId}`);
      if (res.data.success) {
        const p = res.data.data;
        setProfile(p);
        setFormData({
          brand_name: p.brand_name || '',
          brand_logo: p.brand_logo || '',
          primary_color: p.primary_color || '#dc2626',
          secondary_color: p.secondary_color || '#991b1b',
          success_color: p.success_color || '#10b981',
          danger_color: p.danger_color || '#dc2626',
          header_text: p.header_text || '',
          footer_text: p.footer_text || '',
          favicon: p.favicon || '',
          custom_css: p.custom_css || '',
          custom_js: p.custom_js || '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      showToast('Selecione um usuário', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await api.put(`/profiles/${selectedUserId}`, formData);
      if (res.data.success) {
        showToast('Perfil salvo com sucesso!', 'success');
        loadProfile(selectedUserId);
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Erro ao salvar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">White Label</h1>
        <p className="text-slate-400">Personalize a aparência do sistema por usuário</p>
      </div>

      <Card>
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Usuário PIX <span className="text-red-400">*</span>
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
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

        {selectedUserId && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome da Marca"
              value={formData.brand_name}
              onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
              placeholder="Ex: Minha Empresa"
            />

            <Input
              label="Logo (URL ou Base64)"
              value={formData.brand_logo}
              onChange={(e) => setFormData({ ...formData, brand_logo: e.target.value })}
              placeholder="https://exemplo.com/logo.png"
              help="URL da imagem ou Base64"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cor Primária</label>
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cor Secundária</label>
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cor Sucesso</label>
                <input
                  type="color"
                  value={formData.success_color}
                  onChange={(e) => setFormData({ ...formData, success_color: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cor Erro</label>
                <input
                  type="color"
                  value={formData.danger_color}
                  onChange={(e) => setFormData({ ...formData, danger_color: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <Input
              label="Texto do Header"
              value={formData.header_text}
              onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
              placeholder="Texto personalizado para o header"
            />

            <Input
              label="Texto do Footer"
              value={formData.footer_text}
              onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
              placeholder="Texto personalizado para o footer"
            />

            <Input
              label="Favicon (URL)"
              value={formData.favicon}
              onChange={(e) => setFormData({ ...formData, favicon: e.target.value })}
              placeholder="https://exemplo.com/favicon.ico"
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">CSS Customizado</label>
              <textarea
                value={formData.custom_css}
                onChange={(e) => setFormData({ ...formData, custom_css: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="/* Seu CSS customizado aqui */"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">JavaScript Customizado</label>
              <textarea
                value={formData.custom_js}
                onChange={(e) => setFormData({ ...formData, custom_js: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="// Seu JavaScript customizado aqui"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full">
              <Save size={20} />
              Salvar Perfil
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

