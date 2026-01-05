// Transactions Page
let transactionsState = {
  transactions: [],
};

async function renderTransactions() {
  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="loading">Carregando transações...</div>';

  try {
    const res = await api.get('/transactions?limit=1000');
    transactionsState.transactions = res.data.data;

    if (transactionsState.transactions.length === 0) {
      content.innerHTML = `
        <div class="card">
          <h1 class="card-title">📋 Transações</h1>
          <p style="text-align: center; color: var(--text-muted); padding: 2rem;">
            Nenhuma transação encontrada
          </p>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="card">
        <h1 class="card-title">📋 Transações</h1>
        
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>TXID</th>
                <th>CPF Devedor</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              ${transactionsState.transactions.map(trans => {
                const statusInfo = formatStatus(trans.status);
                return `
                  <tr>
                    <td>${trans.id}</td>
                    <td><code style="font-size: 0.75rem;">${trans.txid?.substring(0, 20) || 'N/A'}...</code></td>
                    <td>${trans.cpf_devedor || 'N/A'}</td>
                    <td>${formatCurrency(parseFloat(trans.valor_recorrencia || 0))}</td>
                    <td>
                      <span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: rgba(220, 38, 38, 0.2); color: var(--${statusInfo.class});">
                        ${statusInfo.text}
                      </span>
                    </td>
                    <td>${formatDate(trans.created_at)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="card">
        <h2>Erro ao carregar transações</h2>
        <p style="color: var(--danger);">${error.message}</p>
      </div>
    `;
  }
}

