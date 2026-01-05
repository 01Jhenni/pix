// Utility Functions

// Toast notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 3000);
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copiado para a área de transferência!', 'success');
  }).catch(() => {
    showToast('Erro ao copiar', 'error');
  });
}

// Format currency
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Format status
function formatStatus(status) {
  const statusMap = {
    'ATIVA': { text: 'Ativa', class: 'success' },
    'PENDENTE': { text: 'Pendente', class: 'warning' },
    'REJEITADA': { text: 'Rejeitada', class: 'error' },
    'CANCELADA': { text: 'Cancelada', class: 'error' },
  };
  return statusMap[status] || { text: status, class: 'info' };
}

// Load stats for header
async function loadHeaderStats() {
  try {
    const [usersRes, transRes] = await Promise.all([
      api.get('/users'),
      api.get('/transactions?limit=1000'),
    ]);

    const users = usersRes.data.data.filter(u => u.ativo).length;
    const transactions = transRes.data.data.length;
    const active = transRes.data.data.filter(t => t.status === 'ATIVA').length;

    document.getElementById('stat-users').textContent = users;
    document.getElementById('stat-transactions').textContent = transactions;
    document.getElementById('stat-active').textContent = active;
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

