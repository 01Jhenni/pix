// Main App
let currentPage = 'dashboard';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Load header stats
  loadHeaderStats();
  setInterval(loadHeaderStats, 30000); // Update every 30 seconds

  // Setup navigation
  setupNavigation();

  // Load initial page
  loadPage('dashboard');
});

function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      loadPage(page);
    });
  });
}

function loadPage(page) {
  currentPage = page;

  // Update active nav button
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.page === page) {
      btn.classList.add('active');
    }
  });

  // Load page content
  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="loading">Carregando...</div>';

  // Import and render page
  switch (page) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'create':
      renderCreate();
      break;
    case 'users':
      renderUsers();
      break;
    case 'transactions':
      renderTransactions();
      break;
    case 'whitelabel':
      renderWhiteLabel();
      break;
    case 'apikeys':
      renderApiKeys();
      break;
    default:
      content.innerHTML = '<div class="card"><h2>Página não encontrada</h2></div>';
  }
}

// Make loadPage available globally
window.loadPage = loadPage;

