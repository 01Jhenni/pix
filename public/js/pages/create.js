// Create Recurrence Page
let createState = {
  users: [],
  formData: {
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
  },
  loading: false,
  result: null,
};

async function renderCreate() {
  const content = document.getElementById('page-content');
  
  // Set today as default date
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  createState.formData.dataInicial = hoje.toISOString().split('T')[0];

  content.innerHTML = `
    <div class="card">
      <h1 class="card-title">➕ Criar Recorrência PIX</h1>
      
      <form id="form-create">
        <div class="form-group">
          <label class="form-label">Usuário PIX</label>
          <select class="form-select" id="select-user" required>
            <option value="">Selecione um usuário</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">CPF do Devedor</label>
          <input type="text" class="form-input" id="cpfDevedor" placeholder="12345678900" required maxlength="11" />
        </div>

        <div class="form-group">
          <label class="form-label">Nome do Devedor</label>
          <input type="text" class="form-input" id="nomeDevedor" placeholder="JOÃO DA SILVA" required maxlength="140" />
        </div>

        <div class="form-group">
          <label class="form-label">Contrato</label>
          <input type="text" class="form-input" id="contrato" placeholder="CONTRATO123" required maxlength="35" />
        </div>

        <div class="form-group">
          <label class="form-label">Data Inicial</label>
          <input type="date" class="form-input" id="dataInicial" required />
        </div>

        <div class="form-group">
          <label class="form-label">Periodicidade</label>
          <select class="form-select" id="periodicidade" required>
            <option value="DIARIA">Diária</option>
            <option value="SEMANAL">Semanal</option>
            <option value="MENSAL" selected>Mensal</option>
            <option value="ANUAL">Anual</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Política de Retentativa</label>
          <select class="form-select" id="politicaRetentativa" required>
            <option value="PERMITE_3R_7D" selected>3 tentativas em 7 dias</option>
            <option value="PERMITE_3R_15D">3 tentativas em 15 dias</option>
            <option value="PERMITE_3R_30D">3 tentativas em 30 dias</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Valor da Recorrência</label>
          <input type="text" class="form-input" id="valorRec" placeholder="99.90" required />
        </div>

        <div class="form-group">
          <label class="form-label">Valor do Primeiro Pagamento</label>
          <input type="text" class="form-input" id="valorPrimeiroPagamento" placeholder="99.90" required />
        </div>

        <div class="form-group">
          <label class="form-label">Chave PIX Recebedor (opcional)</label>
          <input type="text" class="form-input" id="chavePixRecebedor" placeholder="chave@exemplo.com" />
        </div>

        <button type="submit" class="btn btn-primary" id="btn-submit">
          Criar Recorrência
        </button>
      </form>

      <div id="result-container"></div>
    </div>
  `;

  // Set default date
  document.getElementById('dataInicial').value = createState.formData.dataInicial;

  // Load users
  await loadCreateUsers();

  // Setup form
  document.getElementById('form-create').addEventListener('submit', handleCreateSubmit);
}

async function loadCreateUsers() {
  try {
    const res = await api.get('/users');
    createState.users = res.data.data.filter(u => u.ativo);
    
    const select = document.getElementById('select-user');
    createState.users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.nome} (${user.cnpj})`;
      select.appendChild(option);
    });
  } catch (error) {
    showToast('Erro ao carregar usuários', 'error');
  }
}

async function handleCreateSubmit(e) {
  e.preventDefault();
  createState.loading = true;
  createState.result = null;

  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  btn.textContent = 'Criando...';

  try {
    const formData = {
      pixUserId: document.getElementById('select-user').value,
      cpfDevedor: document.getElementById('cpfDevedor').value,
      nomeDevedor: document.getElementById('nomeDevedor').value,
      contrato: document.getElementById('contrato').value,
      dataInicial: document.getElementById('dataInicial').value,
      periodicidade: document.getElementById('periodicidade').value,
      politicaRetentativa: document.getElementById('politicaRetentativa').value,
      valorRec: document.getElementById('valorRec').value,
      valorPrimeiroPagamento: document.getElementById('valorPrimeiroPagamento').value,
      chavePixRecebedor: document.getElementById('chavePixRecebedor').value || undefined,
    };

    const res = await api.post('/pix/jornada3', formData);

    if (res.success) {
      createState.result = res.data;
      showToast('Recorrência criada com sucesso!', 'success');
      renderResult();
    }
  } catch (error) {
    showToast(error.message || 'Erro ao criar recorrência', 'error');
  } finally {
    createState.loading = false;
    btn.disabled = false;
    btn.textContent = 'Criar Recorrência';
  }
}

function renderResult() {
  const container = document.getElementById('result-container');
  if (!createState.result) return;

  const { qrCodeImage, pixCopiaECola, txid, idRec, status } = createState.result;

  container.innerHTML = `
    <div class="card" style="margin-top: 2rem; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
      <h2 class="card-title">✅ Recorrência Criada com Sucesso!</h2>
      
      <div style="margin-bottom: 1rem;">
        <label class="form-label">TXID</label>
        <code class="code-block">${txid || 'N/A'}</code>
      </div>

      <div style="margin-bottom: 1rem;">
        <label class="form-label">ID Recorrência</label>
        <code class="code-block">${idRec || 'N/A'}</code>
      </div>

      <div style="margin-bottom: 1rem;">
        <label class="form-label">Status</label>
        <div style="padding: 0.5rem; background: var(--dark-tertiary); border-radius: var(--radius); color: var(--success);">
          ${status || 'N/A'}
        </div>
      </div>

      ${qrCodeImage ? `
        <div style="margin-bottom: 1rem;">
          <label class="form-label">QR Code</label>
          <div style="text-align: center; padding: 1rem; background: white; border-radius: var(--radius);">
            <img src="${qrCodeImage}" alt="QR Code" style="max-width: 300px;" />
          </div>
        </div>
      ` : ''}

      ${pixCopiaECola ? `
        <div style="margin-bottom: 1rem;">
          <label class="form-label">Copia e Cola PIX</label>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <code class="code-block" style="flex: 1; margin: 0; font-size: 0.7rem; word-break: break-all;">${pixCopiaECola}</code>
            <button class="btn btn-sm btn-secondary" onclick="copyToClipboard('${pixCopiaECola}')" title="Copiar">
              📋
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

