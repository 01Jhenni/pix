// API Keys Page
let apiKeysState = {
  users: [],
  selectedUserId: '',
  apiKeys: [],
  showForm: false,
  newKey: null,
  selectedKeyForDocs: null,
};

async function renderApiKeys() {
  const content = document.getElementById('page-content');
  
  content.innerHTML = `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1 class="card-title">🔑 API Keys</h1>
          <p style="color: var(--text-muted); margin-top: 0.5rem;">Gerencie chaves de API para integração</p>
        </div>
        <button class="btn btn-primary" id="btn-new-key">
          ➕ Nova API Key
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">Usuário PIX</label>
        <select class="form-select" id="select-user">
          <option value="">Selecione um usuário</option>
        </select>
      </div>

      <div id="form-container" style="display: none;"></div>
      <div id="new-key-container" style="display: none;"></div>
      <div id="keys-table-container"></div>
      <div id="docs-container"></div>
    </div>
  `;

  // Load users
  await loadUsers();
  
  // Setup event listeners
  document.getElementById('select-user').addEventListener('change', (e) => {
    apiKeysState.selectedUserId = e.target.value;
    if (apiKeysState.selectedUserId) {
      loadApiKeys(apiKeysState.selectedUserId);
    } else {
      document.getElementById('keys-table-container').innerHTML = '';
    }
  });

  document.getElementById('btn-new-key').addEventListener('click', () => {
    if (!apiKeysState.selectedUserId) {
      showToast('Selecione um usuário primeiro', 'warning');
      return;
    }
    apiKeysState.showForm = true;
    renderForm();
  });
}

async function loadUsers() {
  try {
    const res = await api.get('/users');
    apiKeysState.users = res.data.data.filter(u => u.ativo);
    
    const select = document.getElementById('select-user');
    select.innerHTML = '<option value="">Selecione um usuário</option>';
    apiKeysState.users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.nome} (${user.cnpj})`;
      select.appendChild(option);
    });
  } catch (error) {
    showToast('Erro ao carregar usuários', 'error');
  }
}

async function loadApiKeys(userId) {
  try {
    const res = await api.get(`/api-keys?userId=${userId}`);
    apiKeysState.apiKeys = res.data.data || [];
    renderKeysTable();
  } catch (error) {
    showToast('Erro ao carregar API Keys', 'error');
  }
}

function renderForm() {
  const container = document.getElementById('form-container');
  container.style.display = 'block';
  container.innerHTML = `
    <div class="card" style="background: var(--dark-tertiary); margin-top: 1rem;">
      <form id="form-create-key">
        <div class="form-group">
          <label class="form-label">Nome da API Key</label>
          <input 
            type="text" 
            class="form-input" 
            id="input-key-name"
            placeholder="Ex: Integração Sistema X"
            required
          />
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button type="submit" class="btn btn-success">Gerar API Key</button>
          <button type="button" class="btn btn-secondary" id="btn-cancel">Cancelar</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('form-create-key').addEventListener('submit', handleCreate);
  document.getElementById('btn-cancel').addEventListener('click', () => {
    apiKeysState.showForm = false;
    container.style.display = 'none';
  });
}

async function handleCreate(e) {
  e.preventDefault();
  const name = document.getElementById('input-key-name').value;

  try {
    const res = await api.post('/api-keys', {
      pixUserId: apiKeysState.selectedUserId,
      name: name,
    });

    if (res.data.success) {
      apiKeysState.newKey = res.data.data.key;
      showToast('API Key criada com sucesso!', 'success');
      copyToClipboard(res.data.data.key);
      showToast('API Key copiada para a área de transferência!', 'info');
      
      apiKeysState.showForm = false;
      document.getElementById('form-container').style.display = 'none';
      renderNewKeyContainer();
      await loadApiKeys(apiKeysState.selectedUserId);
    }
  } catch (error) {
    showToast(error.message || 'Erro ao criar API Key', 'error');
  }
}

function renderNewKeyContainer() {
  const container = document.getElementById('new-key-container');
  if (!apiKeysState.newKey) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  container.innerHTML = `
    <div class="card" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); margin-top: 1rem;">
      <div style="color: #10b981; margin-bottom: 0.5rem; font-size: 0.875rem;">✅ Nova API Key criada:</div>
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; align-items: center;">
        <code class="code-block" style="flex: 1; margin: 0;">${apiKeysState.newKey}</code>
        <button class="btn btn-sm btn-secondary" onclick="copyToClipboard('${apiKeysState.newKey}')" title="Copiar">
          📋
        </button>
      </div>
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 1rem;">
        ⚠️ Salve esta chave agora, ela não será exibida novamente!
      </div>
      <button class="btn btn-success btn-sm" onclick="showDocumentationForNewKey()">
        📖 Ver Documentação de Integração
      </button>
    </div>
  `;
}

function renderKeysTable() {
  const container = document.getElementById('keys-table-container');
  
  if (apiKeysState.apiKeys.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Nenhuma API Key encontrada</div>';
    return;
  }

  let html = `
    <div class="card" style="margin-top: 1.5rem;">
      <h3 class="card-title">API Keys Existentes</h3>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>API Key</th>
              <th>Status</th>
              <th>Criada em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
  `;

  apiKeysState.apiKeys.forEach((key, index) => {
    const createdDate = new Date(key.created_at).toLocaleDateString('pt-BR');
    const keyData = JSON.stringify(key).replace(/"/g, '&quot;');
    html += `
      <tr style="cursor: pointer;" onclick="showDocumentationForKey(${index})">
        <td>${key.name || 'Sem nome'}</td>
        <td>
          <code style="color: var(--primary-light); font-size: 0.75rem;">${(key.key || key.api_key || '').substring(0, 20)}...</code>
        </td>
        <td>
          <span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: ${key.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(220, 38, 38, 0.2)'}; color: ${key.active ? '#10b981' : '#dc2626'};">
            ${key.active ? 'Ativa' : 'Inativa'}
          </span>
        </td>
        <td>${createdDate}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); handleDelete(${key.id})" title="Remover">
            🗑️
          </button>
        </td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

async function handleDelete(id) {
  if (!confirm('Tem certeza que deseja remover esta API Key?')) return;

  try {
    await api.delete(`/api-keys/${id}`);
    showToast('API Key removida com sucesso!', 'success');
    await loadApiKeys(apiKeysState.selectedUserId);
  } catch (error) {
    showToast(error.message || 'Erro ao remover API Key', 'error');
  }
}

function showDocumentation(keyData) {
  apiKeysState.selectedKeyForDocs = keyData;
  const container = document.getElementById('docs-container');
  
  const apiKey = keyData.key || keyData.api_key || 'N/A';
  const baseUrl = `${window.location.protocol}//${window.location.host}/api/v1`;
  const endpoint = `${baseUrl}/pix/jornada3`;
  
  const payload = {
    cpfDevedor: "12345678900",
    nomeDevedor: "João Silva",
    contrato: "CONTRATO123",
    dataInicial: new Date().toISOString().split('T')[0],
    periodicidade: "MENSAL",
    politicaRetentativa: "PERMITE_3R_7D",
    valorRec: "100.00",
    valorPrimeiroPagamento: "100.00",
    chavePixRecebedor: "chave@exemplo.com"
  };

  const payloadStr = JSON.stringify(payload, null, 2);

  container.innerHTML = `
    <div class="card" style="border: 2px solid rgba(59, 130, 246, 0.3); margin-top: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 class="card-title">📖 Documentação de Integração</h2>
        <button class="btn btn-secondary btn-sm" onclick="closeDocumentation()">Fechar</button>
      </div>

      <div style="margin-bottom: 2rem;">
        <label class="form-label">API Key</label>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <code class="code-block" style="flex: 1; margin: 0;">${apiKey}</code>
          <button class="btn btn-sm btn-secondary" onclick="copyApiKey('${apiKey.replace(/'/g, "\\'")}')" title="Copiar">
            📋
          </button>
        </div>
      </div>

      <div style="margin-bottom: 2rem;">
        <label class="form-label">URL Base da API</label>
        <code class="code-block">${baseUrl}</code>
      </div>

      <div style="margin-bottom: 2rem;">
        <label class="form-label">Endpoint</label>
        <code class="code-block">POST ${endpoint}</code>
      </div>

      <div style="margin-bottom: 2rem;">
        <label class="form-label">Headers de Autenticação</label>
        <code class="code-block">X-API-Key: ${apiKey}</code>
        <button class="btn btn-sm btn-secondary" style="margin-top: 0.5rem;" onclick="copyHeader('${apiKey.replace(/'/g, "\\'")}')" title="Copiar Header">
          📋 Copiar Header
        </button>
      </div>

      <div style="margin-bottom: 2rem;">
        <label class="form-label">Payload JSON (Exemplo)</label>
        <code class="code-block">${payloadStr}</code>
      </div>

      <div style="margin-bottom: 2rem;">
        <label class="form-label">Resposta (QR Code e Copia e Cola)</label>
        <code class="code-block">{
  "success": true,
  "data": {
    "qrCode": "00020126...",
    "copiaECola": "00020126...",
    "txid": "E123456782024..."
  }
}</code>
      </div>

      <div style="margin-bottom: 2rem;">
        <h3 style="color: white; margin-bottom: 1rem;">Exemplos de Código</h3>
        
        <div style="margin-bottom: 1rem;">
          <label class="form-label">JavaScript/Node.js</label>
          <code class="code-block">const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '${apiKey}'
  },
  body: JSON.stringify(${JSON.stringify(payload)})
});
const data = await response.json();</code>
        </div>

        <div style="margin-bottom: 1rem;">
          <label class="form-label">cURL</label>
          <code class="code-block">curl -X POST '${endpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: ${apiKey}' \\
  -d '${JSON.stringify(payload).replace(/'/g, "\\'")}'</code>
        </div>

        <div style="margin-bottom: 1rem;">
          <label class="form-label">Python</label>
          <code class="code-block">import requests

response = requests.post(
    '${endpoint}',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': '${apiKey}'
    },
    json=${JSON.stringify(payload)}
)
data = response.json()</code>
        </div>
      </div>

      <button class="btn btn-primary" onclick="copyAllCredentials()">
        📋 Copiar Todas as Credenciais
      </button>
    </div>
  `;

  // Scroll to documentation
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeDocumentation() {
  apiKeysState.selectedKeyForDocs = null;
  document.getElementById('docs-container').innerHTML = '';
}

function copyAllCredentials() {
  const keyData = apiKeysState.selectedKeyForDocs;
  if (!keyData) return;

  const apiKey = keyData.key || keyData.api_key || 'N/A';
  const baseUrl = `${window.location.protocol}//${window.location.host}/api/v1`;
  const endpoint = `${baseUrl}/pix/jornada3`;
  
  const credentials = `API Key: ${apiKey}
URL Base: ${baseUrl}
Endpoint: POST ${endpoint}
Header: X-API-Key: ${apiKey}`;

  copyToClipboard(credentials);
}

// Helper function to show documentation by index
function showDocumentationForKey(index) {
  const key = apiKeysState.apiKeys[index];
  if (key) {
    showDocumentation(key);
  }
}

// Helper function for new key documentation
function showDocumentationForNewKey() {
  const name = document.getElementById('input-key-name')?.value || 'Nova API Key';
  showDocumentation({ key: apiKeysState.newKey, name: name });
}

// Helper functions for copying
function copyApiKey(key) {
  copyToClipboard(key);
}

function copyHeader(key) {
  copyToClipboard(`X-API-Key: ${key}`);
}

// Make functions available globally
window.showDocumentation = showDocumentation;
window.showDocumentationForKey = showDocumentationForKey;
window.showDocumentationForNewKey = showDocumentationForNewKey;
window.handleDelete = handleDelete;
window.closeDocumentation = closeDocumentation;
window.copyAllCredentials = copyAllCredentials;
window.copyApiKey = copyApiKey;
window.copyHeader = copyHeader;

