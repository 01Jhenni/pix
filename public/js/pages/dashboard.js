// Dashboard Page
async function renderDashboard() {
  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="loading">Carregando estatísticas...</div>';

  try {
    const [usersRes, transRes] = await Promise.all([
      api.get('/users'),
      api.get('/transactions?limit=1000'),
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

    content.innerHTML = `
      <div>
        <h1 class="card-title">📊 Dashboard</h1>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-value">${users}</div>
            <div class="stat-card-label">Usuários Ativos</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-value">${transactions.length}</div>
            <div class="stat-card-label">Total de Transações</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-value">${active}</div>
            <div class="stat-card-label">Recorrências Ativas</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-value">${formatCurrency(totalValue)}</div>
            <div class="stat-card-label">Valor Total</div>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="stat-card">
            <div class="stat-card-value" style="color: var(--warning);">${pending}</div>
            <div class="stat-card-label">Pendentes</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-value" style="color: var(--danger);">${rejected}</div>
            <div class="stat-card-label">Rejeitadas</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-value" style="color: var(--danger);">${cancelled}</div>
            <div class="stat-card-label">Canceladas</div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="card">
        <h2>Erro ao carregar dashboard</h2>
        <p style="color: var(--danger);">${error.message}</p>
      </div>
    `;
  }
}

