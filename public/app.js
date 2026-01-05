const API_URL = '/api';

// Toast notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarUsuarios();
    carregarTransacoes();
    atualizarDashboard();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    document.getElementById('dataInicial').valueAsDate = hoje;
    document.getElementById('dataInicial').min = hoje.toISOString().split('T')[0];
});

// Tabs
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Carregar dados da aba quando ativada
    if (tabName === 'usuarios') {
        carregarUsuariosList();
    } else if (tabName === 'transacoes') {
        carregarTransacoes();
    } else if (tabName === 'dashboard') {
        atualizarDashboard();
    }
}

// Carregar usuários
async function carregarUsuarios() {
    try {
        const res = await fetch(`${API_URL}/users`);
        const data = await res.json();
        
        const select = document.getElementById('pixUserId');
        const filterSelect = document.getElementById('filterUserId');
        
        select.innerHTML = '<option value="">Selecione um usuário</option>';
        filterSelect.innerHTML = '<option value="">Todos os usuários</option>';
        
        data.data.forEach(user => {
            if (user.ativo) {
                const option = `<option value="${user.id}">${user.nome} (${user.cnpj})</option>`;
                select.innerHTML += option;
                filterSelect.innerHTML += option;
            }
        });
        
        // Atualizar estatísticas
        document.getElementById('statUsers').textContent = data.data.filter(u => u.ativo).length;
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showToast('Erro ao carregar usuários', 'error');
    }
}

// Formulário de recorrência
document.getElementById('formRecorrencia').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btnCriar');
    const alertDiv = document.getElementById('alert-criar');
    const resultado = document.getElementById('resultado');
    
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Processando...';
    alertDiv.innerHTML = '';
    resultado.style.display = 'none';

    try {
        const data = {
            pixUserId: parseInt(document.getElementById('pixUserId').value),
            cpfDevedor: document.getElementById('cpfDevedor').value,
            nomeDevedor: document.getElementById('nomeDevedor').value,
            contrato: document.getElementById('contrato').value,
            dataInicial: document.getElementById('dataInicial').value,
            periodicidade: document.getElementById('periodicidade').value,
            politicaRetentativa: document.getElementById('politicaRetentativa').value,
            valorRec: document.getElementById('valorRec').value,
            valorPrimeiroPagamento: document.getElementById('valorPrimeiroPagamento').value
        };

        const chavePix = document.getElementById('chavePixRecebedor').value;
        if (chavePix) {
            data.chavePixRecebedor = chavePix;
        }

        const res = await fetch(`${API_URL}/pix/jornada3`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok && result.success) {
            alertDiv.innerHTML = '<div class="alert alert-success"><i class="fas fa-check-circle"></i> Recorrência criada com sucesso!</div>';
            document.getElementById('qrCodeImage').src = result.data.qrCodeImage;
            document.getElementById('pixCode').textContent = result.data.pixCopiaECola;
            resultado.style.display = 'block';
            resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            document.getElementById('formRecorrencia').reset();
            document.getElementById('dataInicial').valueAsDate = new Date();
            carregarTransacoes();
            atualizarDashboard();
            showToast('Recorrência criada com sucesso!', 'success');
        } else {
            const errorMsg = result.error || 'Erro ao criar recorrência';
            alertDiv.innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${errorMsg}</div>`;
            showToast(errorMsg, 'error');
        }
    } catch (error) {
        const errorMsg = `Erro: ${error.message}`;
        alertDiv.innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${errorMsg}</div>`;
        showToast(errorMsg, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Criar Recorrência';
    }
});

// Copiar código PIX
function copiarPixCode() {
    const code = document.getElementById('pixCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showToast('Código PIX copiado para a área de transferência!', 'success');
    }).catch(() => {
        showToast('Erro ao copiar código', 'error');
    });
}

// Gerenciamento de usuários
let usersList = [];

async function carregarUsuariosList() {
    try {
        const res = await fetch(`${API_URL}/users`);
        const data = await res.json();
        usersList = data.data;
        renderUsersTable();
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showToast('Erro ao carregar usuários', 'error');
    }
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTable');
    if (usersList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>Nenhum usuário cadastrado</h3>
                        <p>Clique em "Novo Usuário" para adicionar</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usersList.map(user => `
        <tr>
            <td><strong>#${user.id}</strong></td>
            <td>${user.cnpj}</td>
            <td>${user.nome}</td>
            <td>${user.chave_pix_recebedor || '<span style="color: #999;">-</span>'}</td>
            <td>
                <span class="badge ${user.ativo ? 'badge-success' : 'badge-danger'}">
                    ${user.ativo ? '<i class="fas fa-check"></i> Ativo' : '<i class="fas fa-times"></i> Inativo'}
                </span>
            </td>
            <td>
                <div class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="editarUsuario(${user.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    ${user.ativo ? `
                        <button class="btn btn-danger btn-sm" onclick="removerUsuario(${user.id})">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function showUserForm(userId = null) {
    const form = document.getElementById('userForm');
    const title = document.getElementById('userFormTitle');
    
    if (userId) {
        title.innerHTML = '<i class="fas fa-user-edit"></i> Editar Usuário';
        const user = usersList.find(u => u.id === userId);
        if (user) {
            document.getElementById('userId').value = user.id;
            document.getElementById('userCnpj').value = user.cnpj;
            document.getElementById('userCnpj').disabled = true;
            document.getElementById('userNome').value = user.nome;
            document.getElementById('userChavePix').value = user.chave_pix_recebedor || '';
            document.getElementById('userNomeRecebedor').value = user.nome_recebedor || '';
            document.getElementById('userCidadeRecebedor').value = user.cidade_recebedor || '';
        }
    } else {
        title.innerHTML = '<i class="fas fa-user-plus"></i> Novo Usuário';
        document.getElementById('formUsuario').reset();
        document.getElementById('userId').value = '';
        document.getElementById('userCnpj').disabled = false;
    }
    
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideUserForm() {
    document.getElementById('userForm').style.display = 'none';
    document.getElementById('formUsuario').reset();
}

document.getElementById('formUsuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const data = {
        cnpj: document.getElementById('userCnpj').value,
        nome: document.getElementById('userNome').value,
        gw_app_key: document.getElementById('userGwAppKey').value,
        basic_auth_base64: document.getElementById('userBasicAuth').value,
        chave_pix_recebedor: document.getElementById('userChavePix').value,
        nome_recebedor: document.getElementById('userNomeRecebedor').value,
        cidade_recebedor: document.getElementById('userCidadeRecebedor').value
    };

    try {
        const url = userId ? `${API_URL}/users/${userId}` : `${API_URL}/users`;
        const method = userId ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        
        if (res.ok) {
            showToast(result.message || 'Usuário salvo com sucesso!', 'success');
            hideUserForm();
            carregarUsuarios();
            carregarUsuariosList();
        } else {
            showToast(result.error || 'Erro ao salvar usuário', 'error');
        }
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
});

async function editarUsuario(id) {
    const user = usersList.find(u => u.id === id);
    if (!user) return;

    try {
        const res = await fetch(`${API_URL}/users/${id}`);
        const data = await res.json();
        if (data.success) {
            showUserForm(id);
        }
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        showToast('Erro ao carregar dados do usuário', 'error');
    }
}

async function removerUsuario(id) {
    if (!confirm('Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.')) return;

    try {
        const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
        const result = await res.json();
        
        if (res.ok) {
            showToast('Usuário removido com sucesso!', 'success');
            carregarUsuarios();
            carregarUsuariosList();
        } else {
            showToast(result.error || 'Erro ao remover usuário', 'error');
        }
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

// Transações
async function carregarTransacoes() {
    try {
        const userId = document.getElementById('filterUserId').value;
        const status = document.getElementById('filterStatus').value;
        
        let url = `${API_URL}/transactions?limit=100`;
        if (userId) url += `&pixUserId=${userId}`;
        if (status) url += `&status=${status}`;

        const res = await fetch(url);
        const data = await res.json();
        
        const tbody = document.getElementById('transactionsTable');
        
        // Atualizar estatísticas
        const ativas = data.data.filter(t => t.status === 'ATIVA').length;
        document.getElementById('statTransactions').textContent = data.data.length;
        document.getElementById('statActive').textContent = ativas;
        
        if (data.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <h3>Nenhuma transação encontrada</h3>
                            <p>Tente ajustar os filtros ou criar uma nova recorrência</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.data.map(t => {
            const statusClass = t.status === 'ATIVA' ? 'badge-success' : 
                              t.status === 'PENDENTE' ? 'badge-warning' : 
                              t.status === 'REJEITADA' ? 'badge-danger' : 
                              'badge-info';
            const statusIcon = t.status === 'ATIVA' ? 'fa-check' : 
                             t.status === 'PENDENTE' ? 'fa-clock' : 
                             t.status === 'REJEITADA' ? 'fa-times' : 
                             'fa-info';
            return `
                <tr>
                    <td><code style="font-size: 11px;">${t.txid}</code></td>
                    <td>
                        <strong>${t.nome_devedor}</strong><br>
                        <small style="color: #999;">${t.cpf_devedor}</small>
                    </td>
                    <td><strong>R$ ${parseFloat(t.valor_recorrencia || 0).toFixed(2)}</strong></td>
                    <td>
                        <span class="badge ${statusClass}">
                            <i class="fas ${statusIcon}"></i> ${t.status || 'PENDENTE'}
                        </span>
                    </td>
                    <td>${new Date(t.created_at).toLocaleString('pt-BR')}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="verTransacao('${t.txid}')">
                            <i class="fas fa-qrcode"></i> Ver QR
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Erro ao carregar transações:', error);
        showToast('Erro ao carregar transações', 'error');
    }
}

async function verTransacao(txid) {
    try {
        const res = await fetch(`${API_URL}/pix/qrcode/${txid}`);
        const data = await res.json();
        
        if (data.success) {
            const resultado = document.getElementById('resultado');
            document.getElementById('qrCodeImage').src = data.data.qrCodeImage;
            document.getElementById('pixCode').textContent = data.data.pixCopiaECola;
            resultado.style.display = 'block';
            resultado.scrollIntoView({ behavior: 'smooth' });
            showTab('criar');
            showToast('QR Code carregado com sucesso!', 'success');
        } else {
            showToast(data.error || 'Erro ao carregar transação', 'error');
        }
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

// Dashboard
async function atualizarDashboard() {
    try {
        const [usersRes, transRes] = await Promise.all([
            fetch(`${API_URL}/users`),
            fetch(`${API_URL}/transactions?limit=1000`)
        ]);
        
        const usersData = await usersRes.json();
        const transData = await transRes.json();
        
        const usuariosAtivos = usersData.data.filter(u => u.ativo).length;
        const totalTransacoes = transData.data.length;
        const transacoesAtivas = transData.data.filter(t => t.status === 'ATIVA').length;
        const transacoesPendentes = transData.data.filter(t => t.status === 'PENDENTE').length;
        
        // Calcular valor total
        const valorTotal = transData.data.reduce((sum, t) => {
            return sum + parseFloat(t.valor_recorrencia || 0);
        }, 0);
        
        const dashboardContent = document.getElementById('dashboardContent');
        dashboardContent.innerHTML = `
            <div class="form-row" style="margin-bottom: 30px;">
                <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: 0;">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; font-weight: bold; margin-bottom: 10px;">${usuariosAtivos}</div>
                        <div style="font-size: 16px; opacity: 0.9;">Usuários Ativos</div>
                    </div>
                </div>
                <div class="card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; margin: 0;">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; font-weight: bold; margin-bottom: 10px;">${totalTransacoes}</div>
                        <div style="font-size: 16px; opacity: 0.9;">Total de Transações</div>
                    </div>
                </div>
                <div class="card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; margin: 0;">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; font-weight: bold; margin-bottom: 10px;">${transacoesAtivas}</div>
                        <div style="font-size: 16px; opacity: 0.9;">Transações Ativas</div>
                    </div>
                </div>
                <div class="card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; margin: 0;">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; font-weight: bold; margin-bottom: 10px;">R$ ${valorTotal.toFixed(2)}</div>
                        <div style="font-size: 16px; opacity: 0.9;">Valor Total</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3 style="margin-bottom: 20px;"><i class="fas fa-chart-pie"></i> Status das Transações</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="padding: 20px; background: #d1fae5; border-radius: 8px; text-align: center;">
                        <div style="font-size: 32px; font-weight: bold; color: #065f46; margin-bottom: 8px;">${transacoesAtivas}</div>
                        <div style="color: #065f46; font-weight: 600;">Ativas</div>
                    </div>
                    <div style="padding: 20px; background: #fef3c7; border-radius: 8px; text-align: center;">
                        <div style="font-size: 32px; font-weight: bold; color: #92400e; margin-bottom: 8px;">${transacoesPendentes}</div>
                        <div style="color: #92400e; font-weight: 600;">Pendentes</div>
                    </div>
                    <div style="padding: 20px; background: #fee2e2; border-radius: 8px; text-align: center;">
                        <div style="font-size: 32px; font-weight: bold; color: #991b1b; margin-bottom: 8px;">${transData.data.filter(t => t.status === 'REJEITADA').length}</div>
                        <div style="color: #991b1b; font-weight: 600;">Rejeitadas</div>
                    </div>
                    <div style="padding: 20px; background: #e5e7eb; border-radius: 8px; text-align: center;">
                        <div style="font-size: 32px; font-weight: bold; color: #374151; margin-bottom: 8px;">${transData.data.filter(t => t.status === 'CANCELADA').length}</div>
                        <div style="color: #374151; font-weight: 600;">Canceladas</div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        document.getElementById('dashboardContent').innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i> Erro ao carregar dashboard: ${error.message}
            </div>
        `;
    }
}

// Event listeners
document.getElementById('filterUserId').addEventListener('change', carregarTransacoes);
document.getElementById('filterStatus').addEventListener('change', carregarTransacoes);

// Carregar dados quando mudar de aba
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        const tabText = tab.textContent;
        if (tabText.includes('Usuários')) {
            setTimeout(carregarUsuariosList, 100);
        } else if (tabText.includes('Transações')) {
            setTimeout(carregarTransacoes, 100);
        } else if (tabText.includes('Dashboard')) {
            setTimeout(atualizarDashboard, 100);
        } else if (tabText.includes('White Label')) {
            setTimeout(() => {
                carregarUsuariosParaPerfil();
                const userId = document.getElementById('profileUserId')?.value;
                if (userId) carregarPerfil(userId);
            }, 100);
        } else if (tabText.includes('API Keys')) {
            setTimeout(() => {
                carregarUsuariosParaApiKeys();
                const userId = document.getElementById('apiKeyUserId')?.value;
                if (userId) carregarApiKeys(userId);
            }, 100);
        }
    });
});

// Funções para White Label
async function carregarUsuariosParaPerfil() {
    try {
        const res = await fetch(`${API_URL}/users`);
        const data = await res.json();
        const select = document.getElementById('profileUserId');
        if (select) {
            select.innerHTML = '<option value="">Selecione um usuário</option>';
            data.data.forEach(user => {
                if (user.ativo) {
                    select.innerHTML += `<option value="${user.id}">${user.nome} (${user.cnpj})</option>`;
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

async function carregarPerfil(userId) {
    try {
        const res = await fetch(`${API_URL}/profiles/${userId}`);
        const data = await res.json();
        
        if (data.success) {
            const profile = data.data;
            document.getElementById('profileForm').style.display = 'block';
            document.getElementById('profileBrandName').value = profile.brand_name || '';
            document.getElementById('profileBrandLogo').value = profile.brand_logo || '';
            document.getElementById('profilePrimaryColor').value = profile.primary_color || '#667eea';
            document.getElementById('profileSecondaryColor').value = profile.secondary_color || '#764ba2';
            document.getElementById('profileSuccessColor').value = profile.success_color || '#10b981';
            document.getElementById('profileDangerColor').value = profile.danger_color || '#ef4444';
            document.getElementById('profileHeaderText').value = profile.header_text || '';
            document.getElementById('profileFooterText').value = profile.footer_text || '';
            document.getElementById('profileFavicon').value = profile.favicon || '';
            document.getElementById('profileCustomCss').value = profile.custom_css || '';
            document.getElementById('profileCustomJs').value = profile.custom_js || '';
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

document.getElementById('profileUserId')?.addEventListener('change', (e) => {
    const userId = e.target.value;
    if (userId) {
        carregarPerfil(userId);
    } else {
        document.getElementById('profileForm').style.display = 'none';
    }
});

document.getElementById('formProfile')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('profileUserId').value;
    
    if (!userId) {
        showToast('Selecione um usuário', 'error');
        return;
    }

    const profileData = {
        brand_name: document.getElementById('profileBrandName').value || null,
        brand_logo: document.getElementById('profileBrandLogo').value || null,
        primary_color: document.getElementById('profilePrimaryColor').value,
        secondary_color: document.getElementById('profileSecondaryColor').value,
        success_color: document.getElementById('profileSuccessColor').value,
        danger_color: document.getElementById('profileDangerColor').value,
        header_text: document.getElementById('profileHeaderText').value || null,
        footer_text: document.getElementById('profileFooterText').value || null,
        favicon: document.getElementById('profileFavicon').value || null,
        custom_css: document.getElementById('profileCustomCss').value || null,
        custom_js: document.getElementById('profileCustomJs').value || null
    };

    try {
        const res = await fetch(`${API_URL}/profiles/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });

        const data = await res.json();
        if (data.success) {
            showToast('Perfil salvo com sucesso!', 'success');
            if (typeof loadProfile === 'function') {
                await loadProfile(userId);
            }
        } else {
            showToast(data.error || 'Erro ao salvar perfil', 'error');
        }
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
});

// Funções para API Keys
async function carregarUsuariosParaApiKeys() {
    try {
        const res = await fetch(`${API_URL}/users`);
        const data = await res.json();
        const select = document.getElementById('apiKeyUserId');
        if (select) {
            select.innerHTML = '<option value="">Selecione um usuário</option>';
            data.data.forEach(user => {
                if (user.ativo) {
                    select.innerHTML += `<option value="${user.id}">${user.nome} (${user.cnpj})</option>`;
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

async function carregarApiKeys(userId) {
    try {
        const res = await fetch(`${API_URL}/api-keys?userId=${userId}`);
        const data = await res.json();
        
        const tbody = document.getElementById('apiKeysTable');
        if (data.success && data.data.length > 0) {
            tbody.innerHTML = data.data.map(key => `
                <tr>
                    <td>${key.name || 'Sem nome'}</td>
                    <td><code style="font-size: 11px;">${key.key.substring(0, 20)}...</code></td>
                    <td><span class="badge ${key.active ? 'badge-success' : 'badge-danger'}">
                        ${key.active ? 'Ativa' : 'Inativa'}
                    </span></td>
                    <td>${key.last_used ? new Date(key.last_used).toLocaleString('pt-BR') : 'Nunca'}</td>
                    <td>${new Date(key.created_at).toLocaleString('pt-BR')}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="removerApiKey(${key.id})">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Nenhuma API Key encontrada</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar API keys:', error);
    }
}

document.getElementById('apiKeyUserId')?.addEventListener('change', (e) => {
    const userId = e.target.value;
    if (userId) {
        carregarApiKeys(userId);
    } else {
        document.getElementById('apiKeysTable').innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Selecione um usuário</td></tr>';
    }
});

function showApiKeyForm() {
    const userId = document.getElementById('apiKeyUserId').value;
    if (!userId) {
        showToast('Selecione um usuário primeiro', 'warning');
        return;
    }
    document.getElementById('apiKeyForm').style.display = 'block';
}

function hideApiKeyForm() {
    document.getElementById('apiKeyForm').style.display = 'none';
    document.getElementById('formApiKey').reset();
}

document.getElementById('formApiKey')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('apiKeyUserId').value;
    const name = document.getElementById('apiKeyName').value;

    if (!userId) {
        showToast('Selecione um usuário', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api-keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pixUserId: userId, name })
        });

        const data = await res.json();
        if (data.success) {
            showToast(`API Key criada: ${data.data.key}`, 'success');
            hideApiKeyForm();
            carregarApiKeys(userId);
            // Copiar para clipboard
            navigator.clipboard.writeText(data.data.key);
            showToast('API Key copiada para a área de transferência!', 'info');
        } else {
            showToast(data.error || 'Erro ao criar API Key', 'error');
        }
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
});

async function removerApiKey(id) {
    if (!confirm('Tem certeza que deseja remover esta API Key?')) return;

    try {
        const res = await fetch(`${API_URL}/api-keys/${id}`, { method: 'DELETE' });
        const data = await res.json();
        
        if (data.success) {
            showToast('API Key removida com sucesso!', 'success');
            const userId = document.getElementById('apiKeyUserId').value;
            if (userId) carregarApiKeys(userId);
        } else {
            showToast(data.error || 'Erro ao remover API Key', 'error');
        }
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

