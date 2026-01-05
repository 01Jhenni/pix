// Users Page
let usersState = {
  users: [],
};

async function renderUsers() {
  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="loading">Carregando usuários...</div>';

  try {
    const res = await api.get('/users');
    usersState.users = res.data.data.filter(u => u.ativo);

    content.innerHTML = `
      <div class="card">
        <h1 class="card-title">👥 Usuários PIX</h1>
        
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Client ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${usersState.users.map(user => `
                <tr>
                  <td>${user.id}</td>
                  <td>${user.nome}</td>
                  <td>${user.cnpj}</td>
                  <td><code style="font-size: 0.75rem;">${user.client_id?.substring(0, 20) || 'N/A'}...</code></td>
                  <td>
                    <span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: rgba(16, 185, 129, 0.2); color: #10b981;">
                      ${user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="card">
        <h2>Erro ao carregar usuários</h2>
        <p style="color: var(--danger);">${error.message}</p>
      </div>
    `;
  }
}

