// Sistema de autenticação

// Elementos do DOM
let loginForm, registerForm, loginSection, dashboardContent, userInfo, authMessage;

// Inicializar elementos quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthElements();
    checkAuthState();
});

// Inicializar elementos de autenticação
function initializeAuthElements() {
    loginForm = document.getElementById('login-form');
    loginSection = document.getElementById('login-section');
    dashboardContent = document.getElementById('dashboard-content');
    userInfo = document.getElementById('user-info');
    authMessage = document.getElementById('auth-message');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', showRegisterForm);
    }
}

// Verificar estado de autenticação
function checkAuthState() {
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // Usuário está logado
            showDashboard(user);
        } else {
            // Usuário não está logado
            showLogin();
        }
    });
}

// Manipular login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    showMessage('Autenticando...', 'info');
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            showMessage('Login realizado com sucesso!', 'success');
        })
        .catch((error) => {
            console.error('Erro no login:', error);
            showMessage(getAuthErrorMessage(error), 'error');
        });
}

// Mostrar formulário de registro
function showRegisterForm() {
    const loginForm = document.getElementById('login-form');
    
    // Alterar o formulário para registro
    loginForm.innerHTML = `
        <h3>Criar Nova Conta</h3>
        <div class="form-group">
            <label for="reg-email">E-mail:</label>
            <input type="email" id="reg-email" required>
        </div>
        <div class="form-group">
            <label for="reg-password">Senha (mínimo 6 caracteres):</label>
            <input type="password" id="reg-password" required>
        </div>
        <div class="form-group">
            <label for="reg-confirm-password">Confirmar Senha:</label>
            <input type="password" id="reg-confirm-password" required>
        </div>
        <button type="button" id="do-register-btn" class="btn btn-primary">Criar Conta</button>
        <button type="button" id="cancel-register-btn" class="btn btn-secondary">Voltar ao Login</button>
    `;
    
    document.getElementById('do-register-btn').addEventListener('click', handleRegister);
    document.getElementById('cancel-register-btn').addEventListener('click', () => {
        location.reload();
    });
}

// Manipular registro
function handleRegister() {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    
    if (password !== confirmPassword) {
        showMessage('As senhas não coincidem!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('A senha deve ter pelo menos 6 caracteres!', 'error');
        return;
    }
    
    showMessage('Criando conta...', 'info');
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Criar documento do usuário no Firestore
            return db.collection('usuarios').doc(userCredential.user.uid).set({
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'admin'
            });
        })
        .then(() => {
            showMessage('Conta criada com sucesso!', 'success');
        })
        .catch((error) => {
            console.error('Erro no registro:', error);
            showMessage(getAuthErrorMessage(error), 'error');
        });
}

// Mostrar dashboard
function showDashboard(user) {
    // Esconder seção de login
    if (loginSection) loginSection.classList.add('hidden');
    
    // Mostrar conteúdo do dashboard
    if (dashboardContent) {
        dashboardContent.classList.remove('hidden');
        loadDashboardContent(user);
    }
    
    // Atualizar informações do usuário
    if (userInfo) {
        userInfo.innerHTML = `
            <span class="user-email">${user.email}</span>
            <button id="logout-btn" class="btn btn-sm btn-danger">Sair</button>
        `;
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
    }
    
    // Atualizar navegação
    loadNavigation();
}

// Carregar conteúdo do dashboard
function loadDashboardContent(user) {
    dashboardContent.innerHTML = `
        <div class="dashboard-section">
            <h2>Dashboard - Alexandre Reparos Automotivos</h2>
            <p>Bem-vindo, ${user.email}</p>
            
            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-value" id="clientes-count">0</div>
                    <div class="stat-label">Clientes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="veiculos-count">0</div>
                    <div class="stat-label">Veículos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="orcamentos-count">0</div>
                    <div class="stat-label">Orçamentos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="receita-total">R$ 0</div>
                    <div class="stat-label">Receita Total</div>
                </div>
            </div>
        </div>
        
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h3><span class="card-icon">👥</span> Clientes</h3>
                <p>Gerencie os clientes da oficina</p>
                <button id="btn-clientes" class="btn btn-primary">Gerenciar Clientes</button>
            </div>
            
            <div class="dashboard-card">
                <h3><span class="card-icon">🚗</span> Veículos</h3>
                <p>Controle os veículos em reparo</p>
                <button id="btn-veiculos" class="btn btn-primary">Gerenciar Veículos</button>
            </div>
            
            <div class="dashboard-card">
                <h3><span class="card-icon">💰</span> Orçamentos</h3>
                <p>Crie e gerencie orçamentos</p>
                <button id="btn-orcamentos" class="btn btn-primary">Gerenciar Orçamentos</button>
            </div>
            
            <div class="dashboard-card">
                <h3><span class="card-icon">📊</span> Financeiro</h3>
                <p>Controle financeiro da oficina</p>
                <button id="btn-financeiro" class="btn btn-primary">Gerenciar Financeiro</button>
            </div>
        </div>
    `;
    
    // Adicionar event listeners aos botões
    document.getElementById('btn-clientes').addEventListener('click', () => loadModule('clientes'));
    document.getElementById('btn-veiculos').addEventListener('click', () => loadModule('veiculos'));
    document.getElementById('btn-orcamentos').addEventListener('click', () => loadModule('orcamentos'));
    document.getElementById('btn-financeiro').addEventListener('click', () => loadModule('financeiro'));
    
    // Carregar estatísticas
    loadStats();
}

// Carregar estatísticas
function loadStats() {
    // Contar clientes
    db.collection('clientes').get().then((snapshot) => {
        document.getElementById('clientes-count').textContent = snapshot.size;
    });
    
    // Contar veículos
    db.collection('veiculos').get().then((snapshot) => {
        document.getElementById('veiculos-count').textContent = snapshot.size;
    });
    
    // Contar orçamentos
    db.collection('orcamentos').get().then((snapshot) => {
        document.getElementById('orcamentos-count').textContent = snapshot.size;
    });
    
    // Calcular receita total
    db.collection('orcamentos').where('status', '==', 'pago').get().then((snapshot) => {
        let total = 0;
        snapshot.forEach((doc) => {
            const data = doc.data();
            total += parseFloat(data.valorTotal) || 0;
        });
        document.getElementById('receita-total').textContent = `R$ ${total.toFixed(2)}`;
    });
}

// Carregar módulo específico
function loadModule(moduleName) {
    switch(moduleName) {
        case 'clientes':
            loadClientesModule();
            break;
        case 'veiculos':
            loadVeiculosModule();
            break;
        case 'orcamentos':
            loadOrcamentosModule();
            break;
        case 'financeiro':
            loadFinanceiroModule();
            break;
        default:
            loadDashboardContent(auth.currentUser);
    }
}

// Mostrar tela de login
function showLogin() {
    if (loginSection) loginSection.classList.remove('hidden');
    if (dashboardContent) dashboardContent.classList.add('hidden');
    if (userInfo) userInfo.innerHTML = '';
}

// Manipular logout
function handleLogout() {
    auth.signOut().then(() => {
        showMessage('Logout realizado com sucesso!', 'success');
    }).catch((error) => {
        console.error('Erro no logout:', error);
        showMessage('Erro ao fazer logout', 'error');
    });
}

// Mostrar mensagens
function showMessage(message, type) {
    if (!authMessage) return;
    
    authMessage.textContent = message;
    authMessage.className = 'auth-message';
    
    if (type === 'success') {
        authMessage.classList.add('message-success');
    } else if (type === 'error') {
        authMessage.classList.add('message-error');
    }
    
    // Limpar mensagem após 5 segundos
    setTimeout(() => {
        authMessage.textContent = '';
        authMessage.className = 'auth-message';
    }, 5000);
}

// Obter mensagem de erro amigável
function getAuthErrorMessage(error) {
    switch(error.code) {
        case 'auth/invalid-email':
            return 'E-mail inválido.';
        case 'auth/user-disabled':
            return 'Esta conta foi desativada.';
        case 'auth/user-not-found':
            return 'Usuário não encontrado.';
        case 'auth/wrong-password':
            return 'Senha incorreta.';
        case 'auth/email-already-in-use':
            return 'Este e-mail já está em uso.';
        case 'auth/weak-password':
            return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
        case 'auth/operation-not-allowed':
            return 'Operação não permitida.';
        case 'auth/too-many-requests':
            return 'Muitas tentativas. Tente novamente mais tarde.';
        default:
            return 'Erro na autenticação. Tente novamente.';
    }
}

// Carregar navegação
function loadNavigation() {
    const nav = document.getElementById('main-nav');
    if (nav) {
        nav.innerHTML = `
            <ul>
                <li><a href="#" id="nav-dashboard">Dashboard</a></li>
                <li><a href="#" id="nav-clientes">Clientes</a></li>
                <li><a href="#" id="nav-veiculos">Veículos</a></li>
                <li><a href="#" id="nav-orcamentos">Orçamentos</a></li>
                <li><a href="#" id="nav-financeiro">Financeiro</a></li>
            </ul>
        `;
        
        // Adicionar event listeners
        document.getElementById('nav-dashboard').addEventListener('click', (e) => {
            e.preventDefault();
            loadDashboardContent(auth.currentUser);
        });
        
        document.getElementById('nav-clientes').addEventListener('click', (e) => {
            e.preventDefault();
            loadModule('clientes');
        });
        
        document.getElementById('nav-veiculos').addEventListener('click', (e) => {
            e.preventDefault();
            loadModule('veiculos');
        });
        
        document.getElementById('nav-orcamentos').addEventListener('click', (e) => {
            e.preventDefault();
            loadModule('orcamentos');
        });
        
        document.getElementById('nav-financeiro').addEventListener('click', (e) => {
            e.preventDefault();
            loadModule('financeiro');
        });
    }
}