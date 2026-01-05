// Gerenciador de Perfis White Label

let currentProfile = null;
let currentUserId = null;

/**
 * Carrega perfil do usuário e aplica white label
 */
async function loadProfile(userId) {
  try {
    currentUserId = userId;
    const res = await fetch(`${API_URL}/profiles/${userId}`);
    const data = await res.json();
    
    if (data.success) {
      currentProfile = data.data;
      applyWhiteLabel(currentProfile);
      return currentProfile;
    }
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
  }
  return null;
}

/**
 * Aplica configurações white label ao frontend
 */
function applyWhiteLabel(profile) {
  if (!profile) return;

  const root = document.documentElement;
  
  // Aplicar cores
  if (profile.primary_color) {
    root.style.setProperty('--primary', profile.primary_color);
    root.style.setProperty('--primary-dark', darkenColor(profile.primary_color, 10));
  }
  if (profile.secondary_color) {
    root.style.setProperty('--secondary', profile.secondary_color);
  }
  if (profile.success_color) {
    root.style.setProperty('--success', profile.success_color);
  }
  if (profile.danger_color) {
    root.style.setProperty('--danger', profile.danger_color);
  }
  if (profile.warning_color) {
    root.style.setProperty('--warning', profile.warning_color);
  }
  if (profile.info_color) {
    root.style.setProperty('--info', profile.info_color);
  }

  // Aplicar logo
  if (profile.brand_logo) {
    const logoElements = document.querySelectorAll('.brand-logo');
    logoElements.forEach(el => {
      el.src = profile.brand_logo;
      el.style.display = 'block';
    });
  }

  // Aplicar nome da marca
  if (profile.brand_name) {
    const brandElements = document.querySelectorAll('.brand-name');
    brandElements.forEach(el => {
      el.textContent = profile.brand_name;
    });
  }

  // Aplicar textos customizados
  if (profile.header_text) {
    const headerText = document.querySelector('.header-left p');
    if (headerText) headerText.textContent = profile.header_text;
  }

  if (profile.footer_text) {
    let footer = document.querySelector('.footer-text');
    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'footer-text';
      footer.style.cssText = 'text-align: center; padding: 20px; color: var(--text-light);';
      document.body.appendChild(footer);
    }
    footer.textContent = profile.footer_text;
  }

  // Aplicar favicon
  if (profile.favicon) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = profile.favicon;
  }

  // Aplicar CSS customizado
  if (profile.custom_css) {
    let style = document.getElementById('custom-white-label-css');
    if (!style) {
      style = document.createElement('style');
      style.id = 'custom-white-label-css';
      document.head.appendChild(style);
    }
    style.textContent = profile.custom_css;
  }

  // Aplicar JS customizado
  if (profile.custom_js) {
    let script = document.getElementById('custom-white-label-js');
    if (!script) {
      script = document.createElement('script');
      script.id = 'custom-white-label-js';
      document.head.appendChild(script);
    }
    script.textContent = profile.custom_js;
  }
}

/**
 * Escurece uma cor
 */
function darkenColor(color, percent) {
  const num = parseInt(color.replace("#",""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Salva perfil white label
 */
async function saveProfile(userId, profileData) {
  try {
    const res = await fetch(`${API_URL}/profiles/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });

    const data = await res.json();
    
    if (data.success) {
      showToast('Perfil salvo com sucesso!', 'success');
      await loadProfile(userId);
      return true;
    } else {
      showToast(data.error || 'Erro ao salvar perfil', 'error');
      return false;
    }
  } catch (error) {
    showToast('Erro: ' + error.message, 'error');
    return false;
  }
}

// Carregar perfil quando usuário for selecionado
document.addEventListener('DOMContentLoaded', () => {
  const userSelect = document.getElementById('pixUserId');
  if (userSelect) {
    userSelect.addEventListener('change', async (e) => {
      const userId = e.target.value;
      if (userId) {
        await loadProfile(userId);
      }
    });
  }
});

