// ======== Fluxo do Usuário, Eventos de UI e Admin ========

function addCliente(nome) {
  clienteAtual = nome.trim();
  
  // Ocultar seção de login
  document.getElementById("cliente-section").style.display = "none";
  
  // Mostrar conteúdo principal
  document.getElementById("main-content").style.display = "block";
  
  // Atualizar header com nome do usuário
  document.getElementById("user-info-header").style.display = "block";
  document.getElementById("user-name-header").textContent = clienteAtual;
  
  // Mostrar busca vazia inicialmente
  buscarVideosYouTube("");

  // Atualizar total do catálogo (dinâmico)
  totalCatalogo.textContent = "∞";
  
  // Feedback visual
  showNotification(`Bem-vindo, ${clienteAtual}! 🎉`);
}

// Eventos principais
(function bindMainEvents() {
  document.getElementById("entrar").onclick = () => {
    const nome = document.getElementById("cliente-nome").value;
    if (!nome.trim()) {
      showNotification("⚠️ Por favor, informe seu nome ou mesa!");
      return;
    }
    addCliente(nome);
  };
  
  document.getElementById("cliente-nome").onkeypress = (e) => {
    if (e.key === 'Enter') {
      document.getElementById("entrar").click();
    }
  };
  
  document.getElementById("buscar").onclick = async () => {
    const termo = document.getElementById("busca").value;
    await buscarMusica(termo);
  };
  
  document.getElementById("busca").onkeypress = async (e) => {
    if (e.key === 'Enter') {
      await document.getElementById("buscar").click();
    }
  };
  
  const debouncedSearch = debounce(async () => {
    const termo = document.getElementById("busca").value;
    // Mínimo 3 caracteres ou vazio
    if (termo.trim().length >= 3 || termo.trim().length === 0) {
      await buscarMusica(termo);
    }
  }, 500);

  document.getElementById("busca").oninput = () => {
    debouncedSearch();
  };

  // Scroll-based preloading para resultados
  let scrollPreloadObserver = null;
  function setupResultScrollPreloading() {
    if (scrollPreloadObserver) scrollPreloadObserver.disconnect();

    scrollPreloadObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
          // Usuário rolou 80% da lista, pré-carregar próxima página
          const term = lastQueryTerm;
          if (term && lastPageTokenByTerm.get(term)?.nextPageToken) {
            buscarVideosYouTube(term, { append: true, background: true });
          }
        }
      });
    }, { threshold: 0.8 });

    // Observar o último item da lista
    const lastItem = resultadosDiv.lastElementChild;
    if (lastItem && lastItem.classList.contains('musica-card')) {
      scrollPreloadObserver.observe(lastItem);
    }
  }

  document.getElementById("limpar-fila").onclick = limparFila;

  // Scroll header effect
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });
})();

// ======== Admin ========
function verificarAdminLogado() {
  const adminData = localStorage.getItem('adminCredentials');
  if (adminData) {
    const { username, password } = JSON.parse(adminData);
    if (username === 'admin' && password === 'admin') {
      adminLogado = true;
      atualizarUIAdmin();
      return true;
    }
  }
  adminLogado = false;
  atualizarUIAdmin();
  return false;
}

function loginAdmin(username, password) {
  if (username === 'admin' && password === 'admin') {
    // Armazenar no localStorage
    localStorage.setItem('adminCredentials', JSON.stringify({ username, password }));
    adminLogado = true;
    atualizarUIAdmin();
    fecharModalAdmin();
    showNotification('Login de admin realizado com sucesso! 👑');
    return true;
  } else {
    showNotification('⚠️ Credenciais inválidas!');
    return false;
  }
}

function logoutAdmin() {
  localStorage.removeItem('adminCredentials');
  adminLogado = false;
  atualizarUIAdmin();
  showNotification('Logout realizado! 🔐');
}

function atualizarUIAdmin() {
  const loginBtn = document.getElementById('admin-login-btn');
  const loggedInDiv = document.getElementById('admin-logged-in');

  if (adminLogado) {
    loginBtn.style.display = 'none';
    loggedInDiv.style.display = 'block';
  } else {
    loginBtn.style.display = 'block';
    loggedInDiv.style.display = 'none';
  }
}

function abrirModalAdmin() {
  document.getElementById('admin-login-modal').style.display = 'flex';
  document.getElementById('admin-username').focus();
}

function fecharModalAdmin() {
  document.getElementById('admin-login-modal').style.display = 'none';
  document.getElementById('admin-username').value = '';
  document.getElementById('admin-password').value = '';
}

// Eventos Admin
(function bindAdminEvents() {
  document.getElementById('admin-login-btn').onclick = abrirModalAdmin;
  document.getElementById('admin-logout-btn').onclick = logoutAdmin;

  document.getElementById('admin-login-submit').onclick = () => {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value.trim();

    if (!username || !password) {
      showNotification('⚠️ Preencha usuário e senha!');
      return;
    }

    loginAdmin(username, password);
  };

  document.getElementById('admin-login-cancel').onclick = fecharModalAdmin;

  document.getElementById('admin-username').onkeypress = (e) => {
    if (e.key === 'Enter') {
      document.getElementById('admin-password').focus();
    }
  };

  document.getElementById('admin-password').onkeypress = (e) => {
    if (e.key === 'Enter') {
      document.getElementById('admin-login-submit').click();
    }
  };

  // Fechar modal ao clicar fora
  document.getElementById('admin-login-modal').onclick = (e) => {
    if (e.target.id === 'admin-login-modal') {
      fecharModalAdmin();
    }
  };
})();

// ======== Inicialização ========
(function init() {
  updateFila();
  totalCatalogo.textContent = "∞"; // Catálogo ilimitado do YouTube
  verificarAdminLogado();
})();
