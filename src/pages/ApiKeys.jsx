import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Plus, Trash2, Copy, Code, BookOpen, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export function ApiKeys({ showToast }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [apiKeys, setApiKeys] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [newKey, setNewKey] = useState(null);
  const [selectedKeyForDocs, setSelectedKeyForDocs] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadApiKeys(selectedUserId);
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

  const loadApiKeys = async (userId) => {
    try {
      const res = await api.get(`/api-keys?userId=${userId}`);
      setApiKeys(res.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar API Keys:', error);
      showToast('Erro ao carregar API Keys', 'error');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      showToast('Selecione um usuário', 'warning');
      return;
    }

    try {
      const res = await api.post('/api-keys', {
        pixUserId: selectedUserId,
        name: formData.name,
      });

      if (res.data.success) {
        setNewKey(res.data.data.key);
        showToast('API Key criada com sucesso!', 'success');
        setFormData({ name: '' });
        setShowForm(false);
        loadApiKeys(selectedUserId);
        
        // Copiar para clipboard
        navigator.clipboard.writeText(res.data.data.key);
        showToast('API Key copiada para a área de transferência!', 'info');
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Erro ao criar API Key', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover esta API Key?')) return;

    try {
      await api.delete(`/api-keys/${id}`);
      showToast('API Key removida com sucesso!', 'success');
      loadApiKeys(selectedUserId);
    } catch (error) {
      showToast(error.response?.data?.error || 'Erro ao remover API Key', 'error');
    }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    showToast('API Key copiada!', 'success');
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    showToast('Código copiado!', 'success');
  };

  const getBaseUrl = () => {
    return `${window.location.protocol}//${window.location.host}/api/v1`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Keys</h1>
          <p className="text-slate-400">Gerencie chaves de API para integração</p>
        </div>
        <Button
          onClick={() => {
            if (!selectedUserId) {
              showToast('Selecione um usuário primeiro', 'warning');
              return;
            }
            setShowForm(true);
          }}
        >
          <Plus size={20} />
          Nova API Key
        </Button>
      </div>

      <Card>
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Usuário PIX
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

        {showForm && selectedUserId && (
          <Card className="mb-6 bg-slate-700/30">
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Nome da API Key"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                required
                placeholder="Ex: Integração Sistema X"
              />
              <div className="flex gap-3">
                <Button type="submit" variant="success">
                  Gerar API Key
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setFormData({ name: '' }); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {newKey && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-sm text-green-400 mb-2">✅ Nova API Key criada:</div>
            <div className="flex items-center gap-2 mb-4">
              <code className="flex-1 px-3 py-2 bg-slate-800 rounded text-white text-sm break-all">
                {newKey}
              </code>
              <button
                onClick={() => copyKey(newKey)}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
                title="Copiar API Key"
              >
                <Copy size={16} />
              </button>
            </div>
            <div className="text-xs text-slate-400 mb-4">
              ⚠️ Salve esta chave agora, ela não será exibida novamente!
            </div>
            <Button
              onClick={() => setSelectedKeyForDocs({ key: newKey, name: formData.name || 'Nova API Key' })}
              variant="success"
              size="sm"
            >
              <Code size={16} className="mr-2" />
              Ver Documentação de Integração
            </Button>
          </div>
        )}

        {selectedUserId ? (
          apiKeys.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Nenhuma API Key encontrada</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-red-500/20">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Nome</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">API Key</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Último Uso</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Criada em</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map(key => (
                    <tr 
                      key={key.id} 
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
                      onClick={(e) => {
                        // Não abrir se clicou em um botão
                        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                          return;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        const keyData = {
                          ...key,
                          key: key.key || key.api_key
                        };
                        setSelectedKeyForDocs(keyData);
                        // Scroll para a documentação após um pequeno delay
                        setTimeout(() => {
                          const docElement = document.getElementById('api-documentation');
                          if (docElement) {
                            docElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          } else {
                            console.warn('⚠️ Elemento api-documentation não encontrado');
                          }
                        }, 200);
                      }}
                    >
                      <td className="py-3 px-4 text-white font-medium">{key.name || 'Sem nome'}</td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-red-400">{key.key.substring(0, 20)}...</code>
                          <button
                            onClick={() => copyKey(key.key)}
                            className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
                            title="Copiar API Key completa"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          (key.active === 1 || key.active === true)
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {(key.active === 1 || key.active === true) ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-sm">
                        {key.last_used ? new Date(key.last_used).toLocaleString('pt-BR') : 'Nunca'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-sm">
                        {new Date(key.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const keyData = {
                                ...key,
                                key: key.key || key.api_key
                              };
                              setSelectedKeyForDocs(keyData);
                              setTimeout(() => {
                                const docElement = document.getElementById('api-documentation');
                                if (docElement) {
                                  docElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 200);
                            }}
                            className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400 hover:text-blue-300 transition-colors"
                            title="Ver documentação de integração"
                          >
                            <Code size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(key.id);
                            }}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 hover:text-red-300 transition-colors"
                            title="Remover API Key"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="text-center py-8 text-slate-400">
            Selecione um usuário para ver suas API Keys
          </div>
        )}
      </Card>

      {/* Seção de Documentação da API - Mostrar quando uma key específica for selecionada */}
      {selectedKeyForDocs ? (
        <Card id="api-documentation" className="border-2 border-blue-500/30 mt-6 animate-fadeIn" style={{ display: 'block', opacity: 1 }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Code className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Documentação de Integração</h2>
            </div>
            <Button
              onClick={() => setSelectedKeyForDocs(null)}
              variant="secondary"
              size="sm"
            >
              Fechar
            </Button>
          </div>

          <div className="space-y-6">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                🔑 Sua API Key:
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2 bg-slate-800 rounded text-red-400 text-sm break-all">
                  {selectedKeyForDocs.key || selectedKeyForDocs.api_key || 'N/A'}
                </code>
                <Button
                  onClick={() => copyKey(selectedKeyForDocs.key || selectedKeyForDocs.api_key)}
                  variant="secondary"
                  size="sm"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            {/* URL Base */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                🌐 URL Base da API:
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2 bg-slate-800 rounded text-blue-400 text-sm break-all">
                  {getBaseUrl()}
                </code>
                <Button
                  onClick={() => copyCode(getBaseUrl())}
                  variant="secondary"
                  size="sm"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            {/* Endpoint */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                📡 Endpoint para Criar Recorrência PIX:
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2 bg-slate-800 rounded text-green-400 text-sm break-all">
                  POST {getBaseUrl()}/pix/jornada3
                </code>
                <Button
                  onClick={() => copyCode(`POST ${getBaseUrl()}/pix/jornada3`)}
                  variant="secondary"
                  size="sm"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            {/* Headers */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">🔐 Headers de Autenticação:</h3>
              <div className="space-y-2">
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">X-API-Key (Recomendado):</div>
                  <code className="text-sm text-green-400">
                    X-API-Key: {selectedKeyForDocs.key || selectedKeyForDocs.api_key}
                  </code>
                  <Button
                    onClick={() => copyCode(`X-API-Key: ${selectedKeyForDocs.key || selectedKeyForDocs.api_key}`)}
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                  >
                    <Copy size={14} className="mr-1" /> Copiar Header
                  </Button>
                </div>
              </div>
            </div>

            {/* Payload */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">📦 Dados para Enviar (Payload):</h3>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">JSON de exemplo:</span>
                  <Button
                    onClick={() => {
                      const payload = {
                        cpfDevedor: "12345678901",
                        nomeDevedor: "JOÃO DA SILVA",
                        contrato: "63100555",
                        dataInicial: new Date().toISOString().split('T')[0],
                        periodicidade: "MENSAL",
                        politicaRetentativa: "PERMITE_3R_7D",
                        valorRec: "99.90",
                        valorPrimeiroPagamento: "99.90"
                      };
                      copyCode(JSON.stringify(payload, null, 2));
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Copy size={14} className="mr-1" /> Copiar JSON
                  </Button>
                </div>
                <pre className="text-xs text-slate-300 overflow-x-auto">
                  <code>{JSON.stringify({
                    cpfDevedor: "12345678901",
                    nomeDevedor: "JOÃO DA SILVA",
                    contrato: "63100555",
                    dataInicial: "2025-12-01",
                    periodicidade: "MENSAL",
                    politicaRetentativa: "PERMITE_3R_7D",
                    valorRec: "99.90",
                    valorPrimeiroPagamento: "99.90"
                  }, null, 2)}</code>
                </pre>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                <strong>Campos obrigatórios:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><code className="text-red-400">cpfDevedor</code>: CPF do devedor (11 dígitos)</li>
                  <li><code className="text-red-400">nomeDevedor</code>: Nome do devedor (máx 140 caracteres)</li>
                  <li><code className="text-red-400">contrato</code>: Código do contrato (máx 35 caracteres)</li>
                  <li><code className="text-red-400">dataInicial</code>: Data inicial (YYYY-MM-DD, hoje ou futura)</li>
                  <li><code className="text-red-400">periodicidade</code>: DIARIA, SEMANAL, MENSAL ou ANUAL</li>
                  <li><code className="text-red-400">politicaRetentativa</code>: PERMITE_3R_7D, PERMITE_3R_15D ou PERMITE_3R_30D</li>
                  <li><code className="text-red-400">valorRec</code>: Valor da recorrência (ex: "99.90")</li>
                  <li><code className="text-red-400">valorPrimeiroPagamento</code>: Valor do primeiro pagamento (ex: "99.90")</li>
                </ul>
              </div>
            </div>

            {/* Resposta */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">✅ Resposta da API (Sucesso):</h3>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Estrutura da resposta:</span>
                  <Button
                    onClick={() => {
                      const response = {
                        success: true,
                        data: {
                          txid: "E12345678202501101234567890123456789012345",
                          idRec: "rec123456789012345678901234567890",
                          pixCopiaECola: "00020126...",
                          qrCodeImage: "data:image/png;base64,iVBORw0KGgo...",
                          status: "ATIVA"
                        }
                      };
                      copyCode(JSON.stringify(response, null, 2));
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Copy size={14} className="mr-1" /> Copiar Exemplo
                  </Button>
                </div>
                <pre className="text-xs text-slate-300 overflow-x-auto">
                  <code>{JSON.stringify({
                    success: true,
                    data: {
                      txid: "E12345678202501101234567890123456789012345",
                      idRec: "rec123456789012345678901234567890",
                      pixCopiaECola: "00020126...",
                      qrCodeImage: "data:image/png;base64,iVBORw0KGgo...",
                      status: "ATIVA"
                    }
                  }, null, 2)}</code>
                </pre>
                <div className="mt-3 text-xs text-slate-400">
                  <strong>Campos retornados:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li><code className="text-green-400">pixCopiaECola</code>: Código PIX para copiar e colar</li>
                    <li><code className="text-green-400">qrCodeImage</code>: QR Code em Base64 (data:image/png;base64,...)</li>
                    <li><code className="text-green-400">txid</code>: ID da transação</li>
                    <li><code className="text-green-400">idRec</code>: ID da recorrência</li>
                    <li><code className="text-green-400">status</code>: Status da recorrência (ATIVA, PENDENTE, etc.)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Exemplos de Código */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">💻 Exemplos de Código Prontos:</h3>
              
              {/* JavaScript */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">JavaScript/Node.js (Axios)</span>
                  <Button
                    onClick={() => {
                      const code = `const axios = require('axios');

const API_KEY = '${selectedKeyForDocs.key || selectedKeyForDocs.api_key}';
const API_URL = '${getBaseUrl()}';

async function criarRecorrenciaPIX() {
  try {
    const response = await axios.post(
      \`\${API_URL}/pix/jornada3\`,
      {
        cpfDevedor: '12345678901',
        nomeDevedor: 'JOÃO DA SILVA',
        contrato: '63100555',
        dataInicial: '2025-12-01',
        periodicidade: 'MENSAL',
        politicaRetentativa: 'PERMITE_3R_7D',
        valorRec: '99.90',
        valorPrimeiroPagamento: '99.90'
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ QR Code:', response.data.data.qrCodeImage);
    console.log('✅ Copia e Cola:', response.data.data.pixCopiaECola);
    return response.data;
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}`;
                      copyCode(code);
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Copy size={14} className="mr-1" /> Copiar
                  </Button>
                </div>
                <pre className="bg-slate-900 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                  <code>{`const axios = require('axios');

const API_KEY = '${(selectedKeyForDocs.key || selectedKeyForDocs.api_key).substring(0, 30)}...';
const API_URL = '${getBaseUrl()}';

async function criarRecorrenciaPIX() {
  const response = await axios.post(
    \`\${API_URL}/pix/jornada3\`,
    {
      cpfDevedor: '12345678901',
      nomeDevedor: 'JOÃO DA SILVA',
      contrato: '63100555',
      dataInicial: '2025-12-01',
      periodicidade: 'MENSAL',
      politicaRetentativa: 'PERMITE_3R_7D',
      valorRec: '99.90',
      valorPrimeiroPagamento: '99.90'
    },
    {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}`}</code>
                </pre>
              </div>

              {/* cURL */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">cURL</span>
                  <Button
                    onClick={() => {
                      const code = `curl -X POST ${getBaseUrl()}/pix/jornada3 \\
  -H "X-API-Key: ${selectedKeyForDocs.key || selectedKeyForDocs.api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "cpfDevedor": "12345678901",
    "nomeDevedor": "JOÃO DA SILVA",
    "contrato": "63100555",
    "dataInicial": "2025-12-01",
    "periodicidade": "MENSAL",
    "politicaRetentativa": "PERMITE_3R_7D",
    "valorRec": "99.90",
    "valorPrimeiroPagamento": "99.90"
  }'`;
                      copyCode(code);
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Copy size={14} className="mr-1" /> Copiar
                  </Button>
                </div>
                <pre className="bg-slate-900 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                  <code>{`curl -X POST ${getBaseUrl()}/pix/jornada3 \\
  -H "X-API-Key: ${(selectedKeyForDocs.key || selectedKeyForDocs.api_key).substring(0, 30)}..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "cpfDevedor": "12345678901",
    "nomeDevedor": "JOÃO DA SILVA",
    "contrato": "63100555",
    "dataInicial": "2025-12-01",
    "periodicidade": "MENSAL",
    "politicaRetentativa": "PERMITE_3R_7D",
    "valorRec": "99.90",
    "valorPrimeiroPagamento": "99.90"
  }'`}</code>
                </pre>
              </div>

              {/* Python */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Python (requests)</span>
                  <Button
                    onClick={() => {
                      const code = `import requests

API_KEY = '${selectedKeyForDocs.key || selectedKeyForDocs.api_key}'
API_URL = '${getBaseUrl()}'

response = requests.post(
    f'{API_URL}/pix/jornada3',
    json={
        'cpfDevedor': '12345678901',
        'nomeDevedor': 'JOÃO DA SILVA',
        'contrato': '63100555',
        'dataInicial': '2025-12-01',
        'periodicidade': 'MENSAL',
        'politicaRetentativa': 'PERMITE_3R_7D',
        'valorRec': '99.90',
        'valorPrimeiroPagamento': '99.90'
    },
    headers={
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
    }
)

data = response.json()
print('✅ QR Code:', data['data']['qrCodeImage'][:50] + '...')
print('✅ Copia e Cola:', data['data']['pixCopiaECola'])`;
                      copyCode(code);
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Copy size={14} className="mr-1" /> Copiar
                  </Button>
                </div>
                <pre className="bg-slate-900 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                  <code>{`import requests

API_KEY = '${(selectedKeyForDocs.key || selectedKeyForDocs.api_key).substring(0, 30)}...'
API_URL = '${getBaseUrl()}'

response = requests.post(
    f'{API_URL}/pix/jornada3',
    json={...},
    headers={'X-API-Key': API_KEY}
)

data = response.json()
print('QR Code:', data['data']['qrCodeImage'])
print('Copia e Cola:', data['data']['pixCopiaECola'])`}</code>
                </pre>
              </div>
            </div>

            {/* Botão para copiar tudo */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Copy size={18} />
                <span className="font-semibold">Copiar Tudo de Uma Vez</span>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Copie todas as credenciais e exemplos em um único bloco
              </p>
              <Button
                onClick={() => {
                  const tudo = `🔑 API KEY: ${selectedKeyForDocs.key || selectedKeyForDocs.api_key}

🌐 URL BASE: ${getBaseUrl()}
📡 ENDPOINT: POST ${getBaseUrl()}/pix/jornada3

🔐 HEADER:
X-API-Key: ${selectedKeyForDocs.key || selectedKeyForDocs.api_key}

📦 PAYLOAD (JSON):
${JSON.stringify({
  cpfDevedor: "12345678901",
  nomeDevedor: "JOÃO DA SILVA",
  contrato: "63100555",
  dataInicial: "2025-12-01",
  periodicidade: "MENSAL",
  politicaRetentativa: "PERMITE_3R_7D",
  valorRec: "99.90",
  valorPrimeiroPagamento: "99.90"
}, null, 2)}

✅ RESPOSTA:
A API retorna:
- pixCopiaECola: Código PIX para copiar e colar
- qrCodeImage: QR Code em Base64
- txid: ID da transação
- idRec: ID da recorrência
- status: Status (ATIVA, PENDENTE, etc.)`;
                  copyCode(tudo);
                  showToast('Todas as credenciais copiadas!', 'success');
                }}
                variant="primary"
                className="w-full"
              >
                <Copy size={16} className="mr-2" />
                Copiar Todas as Credenciais
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Seção de Documentação da API - Mostrar quando houver keys mas nenhuma selecionada */}
      {selectedUserId && apiKeys.length > 0 && !selectedKeyForDocs && (
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Code className="h-6 w-6 text-red-400" />
            <h2 className="text-2xl font-bold text-white">Como Usar a API</h2>
          </div>

          <div className="space-y-6">
            {/* URL Base */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                URL Base da API:
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2 bg-slate-800 rounded text-red-400 text-sm break-all">
                  {getBaseUrl()}
                </code>
                <Button
                  onClick={() => copyCode(getBaseUrl())}
                  variant="secondary"
                  size="sm"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            {/* Autenticação */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <BookOpen size={18} /> Autenticação
              </h3>
              <p className="text-slate-400 mb-3">
                Use sua API Key em um dos seguintes formatos:
              </p>
              
              <div className="space-y-3">
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-2">1. Header X-API-Key (Recomendado)</div>
                  <code className="text-sm text-green-400">
                    X-API-Key: {apiKeys[0]?.key?.substring(0, 20)}...
                  </code>
                </div>
                
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-2">2. Header Authorization</div>
                  <code className="text-sm text-green-400">
                    Authorization: Bearer {apiKeys[0]?.key?.substring(0, 20)}...
                  </code>
                </div>
                
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-2">3. Query Parameter</div>
                  <code className="text-sm text-green-400">
                    ?api_key={apiKeys[0]?.key?.substring(0, 20)}...
                  </code>
                </div>
              </div>
            </div>

            {/* Exemplos de Código */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Exemplos de Integração</h3>
              
              {/* JavaScript/Node.js */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">JavaScript/Node.js (Axios)</span>
                  <Button
                    onClick={() => {
                      const code = `const axios = require('axios');

const API_KEY = '${apiKeys[0]?.key || 'SUA_API_KEY'}';
const API_URL = '${getBaseUrl()}';

async function criarRecorrencia() {
  try {
    const response = await axios.post(
      \`\${API_URL}/pix/jornada3\`,
      {
        cpfDevedor: '12345678901',
        nomeDevedor: 'JOÃO DA SILVA',
        contrato: '63100555',
        dataInicial: '2025-12-01',
        periodicidade: 'MENSAL',
        politicaRetentativa: 'PERMITE_3R_7D',
        valorRec: '99.90',
        valorPrimeiroPagamento: '99.90'
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Recorrência criada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}`;
                      copyCode(code);
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Copy size={14} /> Copiar
                  </Button>
                </div>
                <pre className="bg-slate-900 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                  <code>{`const axios = require('axios');

const API_KEY = '${apiKeys[0]?.key?.substring(0, 30)}...';
const API_URL = '${getBaseUrl()}';

async function criarRecorrencia() {
  const response = await axios.post(
    \`\${API_URL}/pix/jornada3\`,
    {
      cpfDevedor: '12345678901',
      nomeDevedor: 'JOÃO DA SILVA',
      contrato: '63100555',
      dataInicial: '2025-12-01',
      periodicidade: 'MENSAL',
      politicaRetentativa: 'PERMITE_3R_7D',
      valorRec: '99.90',
      valorPrimeiroPagamento: '99.90'
    },
    {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}`}</code>
                </pre>
              </div>

              {/* cURL */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">cURL</span>
                  <Button
                    onClick={() => {
                      const code = `curl -X POST ${getBaseUrl()}/pix/jornada3 \\
  -H "X-API-Key: ${apiKeys[0]?.key || 'SUA_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "cpfDevedor": "12345678901",
    "nomeDevedor": "JOÃO DA SILVA",
    "contrato": "63100555",
    "dataInicial": "2025-12-01",
    "periodicidade": "MENSAL",
    "politicaRetentativa": "PERMITE_3R_7D",
    "valorRec": "99.90",
    "valorPrimeiroPagamento": "99.90"
  }'`;
                      copyCode(code);
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Copy size={14} /> Copiar
                  </Button>
                </div>
                <pre className="bg-slate-900 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                  <code>{`curl -X POST ${getBaseUrl()}/pix/jornada3 \\
  -H "X-API-Key: ${apiKeys[0]?.key?.substring(0, 30)}..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "cpfDevedor": "12345678901",
    "nomeDevedor": "JOÃO DA SILVA",
    "contrato": "63100555",
    "dataInicial": "2025-12-01",
    "periodicidade": "MENSAL",
    "politicaRetentativa": "PERMITE_3R_7D",
    "valorRec": "99.90",
    "valorPrimeiroPagamento": "99.90"
  }'`}</code>
                </pre>
              </div>

              {/* Python */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Python (requests)</span>
                  <Button
                    onClick={() => {
                      const code = `import requests

API_KEY = '${apiKeys[0]?.key || 'SUA_API_KEY'}'
API_URL = '${getBaseUrl()}'

def criar_recorrencia():
    response = requests.post(
        f'{API_URL}/pix/jornada3',
        json={
            'cpfDevedor': '12345678901',
            'nomeDevedor': 'JOÃO DA SILVA',
            'contrato': '63100555',
            'dataInicial': '2025-12-01',
            'periodicidade': 'MENSAL',
            'politicaRetentativa': 'PERMITE_3R_7D',
            'valorRec': '99.90',
            'valorPrimeiroPagamento': '99.90'
        },
        headers={
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json'
        }
    )
    
    return response.json()`;
                      copyCode(code);
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Copy size={14} /> Copiar
                  </Button>
                </div>
                <pre className="bg-slate-900 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                  <code>{`import requests

API_KEY = '${apiKeys[0]?.key?.substring(0, 30)}...'
API_URL = '${getBaseUrl()}'

def criar_recorrencia():
    response = requests.post(
        f'{API_URL}/pix/jornada3',
        json={
            'cpfDevedor': '12345678901',
            'nomeDevedor': 'JOÃO DA SILVA',
            'contrato': '63100555',
            'dataInicial': '2025-12-01',
            'periodicidade': 'MENSAL',
            'politicaRetentativa': 'PERMITE_3R_7D',
            'valorRec': '99.90',
            'valorPrimeiroPagamento': '99.90'
        },
        headers={
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json'
        }
    )
    
    return response.json()`}</code>
                </pre>
              </div>

              {/* PHP */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">PHP (cURL)</span>
                  <Button
                    onClick={() => {
                      const code = `<?php

$apiKey = '${apiKeys[0]?.key || 'SUA_API_KEY'}';
$apiUrl = '${getBaseUrl()}';

$ch = curl_init(\$apiUrl . '/pix/jornada3');
curl_setopt_array(\$ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: ' . \$apiKey,
        'Content-Type: application/json'
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'cpfDevedor' => '12345678901',
        'nomeDevedor' => 'JOÃO DA SILVA',
        'contrato' => '63100555',
        'dataInicial' => '2025-12-01',
        'periodicidade' => 'MENSAL',
        'politicaRetentativa' => 'PERMITE_3R_7D',
        'valorRec' => '99.90',
        'valorPrimeiroPagamento' => '99.90'
    ])
]);

\$response = curl_exec(\$ch);
\$data = json_decode(\$response, true);
curl_close(\$ch);

return \$data;`;
                      copyCode(code);
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Copy size={14} /> Copiar
                  </Button>
                </div>
                <pre className="bg-slate-900 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                  <code>{`<?php

$apiKey = '${apiKeys[0]?.key?.substring(0, 30)}...';
$apiUrl = '${getBaseUrl()}';

$ch = curl_init(\$apiUrl . '/pix/jornada3');
curl_setopt_array(\$ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: ' . \$apiKey,
        'Content-Type: application/json'
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'cpfDevedor' => '12345678901',
        'nomeDevedor' => 'JOÃO DA SILVA',
        'contrato' => '63100555',
        'dataInicial' => '2025-12-01',
        'periodicidade' => 'MENSAL',
        'politicaRetentativa' => 'PERMITE_3R_7D',
        'valorRec' => '99.90',
        'valorPrimeiroPagamento' => '99.90'
    ])
]);

$response = curl_exec(\$ch);
$data = json_decode(\$response, true);
curl_close(\$ch);

return \$data;`}</code>
                </pre>
              </div>
            </div>

            {/* Endpoints Disponíveis */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Endpoints Disponíveis</h3>
              <div className="space-y-2">
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-sm font-semibold text-green-400 mb-1">POST /pix/jornada3</div>
                  <div className="text-xs text-slate-400">Criar recorrência PIX (Jornada 3)</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-sm font-semibold text-blue-400 mb-1">GET /pix/qrcode/:txid</div>
                  <div className="text-xs text-slate-400">Obter QR Code de uma transação</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-sm font-semibold text-blue-400 mb-1">GET /pix/recorrencia/:idRec</div>
                  <div className="text-xs text-slate-400">Consultar status de uma recorrência</div>
                </div>
              </div>
            </div>

            {/* Link para documentação completa */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <ExternalLink size={18} />
                <span className="font-semibold">Documentação Completa</span>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Para mais detalhes sobre todos os endpoints, parâmetros e exemplos, consulte a documentação completa da API.
              </p>
              <Button
                onClick={() => window.open('/API_DOCUMENTATION.md', '_blank')}
                variant="outline"
                size="sm"
              >
                <BookOpen size={16} className="mr-2" />
                Ver Documentação Completa
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

