// js/verificar-plano.js
// Funções para verificar permissões baseadas no plano

const PLANOS_CONFIG = {
    basico: {
        id: 'basico',
        nome: 'Básico',
        preco: 30,
        descricao: 'Apenas orçamentos',
        funcionalidades: ['orcamentos'],
        rotasPermitidas: [
            'dashboard.html',
            'orcamentos.html',
            'orcamento-rapido.html',
            'perfil.html',
            'logout.html'
        ],
        menu: [
            { nome: 'Dashboard', url: 'dashboard.html' },
            { nome: 'Orçamentos', url: 'orcamentos.html' }
        ],
        redirectSeNaoPermitido: 'orcamentos.html',
        mensagemRestricao: 'Seu plano Básico (R$30) permite apenas acesso a orçamentos.'
    },
    intermediario: {
        id: 'intermediario',
        nome: 'Intermediário',
        preco: 50,
        descricao: 'Clientes e Veículos',
        funcionalidades: ['orcamentos', 'clientes', 'veiculos'],
        rotasPermitidas: [
            'dashboard.html',
            'clientes.html',
            'veiculos.html',
            'orcamentos.html',
            'orcamento-rapido.html',
            'perfil.html',
            'logout.html'
        ],
        menu: [
            { nome: 'Dashboard', url: 'dashboard.html' },
            { nome: 'Clientes', url: 'clientes.html' },
            { nome: 'Veículos', url: 'veiculos.html' },
            { nome: 'Orçamentos', url: 'orcamentos.html' }
        ],
        redirectSeNaoPermitido: 'dashboard.html'
    },
    completo: {
        id: 'completo',
        nome: 'Completo',
        preco: 70,
        descricao: 'Todas funcionalidades',
        funcionalidades: ['orcamentos', 'clientes', 'veiculos', 'financeiro', 'funcionarios'],
        rotasPermitidas: [
            'dashboard.html',
            'clientes.html',
            'veiculos.html',
            'orcamentos.html',
            'orcamento-rapido.html',
            'financeiro.html',
            'funcionarios.html',
            'perfil.html',
            'logout.html'
        ],
        menu: [
            { nome: 'Dashboard', url: 'dashboard.html' },
            { nome: 'Clientes', url: 'clientes.html' },
            { nome: 'Veículos', url: 'veiculos.html' },
            { nome: 'Orçamentos', url: 'orcamentos.html' },
            { nome: 'Financeiro', url: 'financeiro.html' }
        ],
        redirectSeNaoPermitido: 'dashboard.html'
    }
};

// Cache do plano para não buscar toda hora
let planoCache = {
    id: null,
    dados: null,
    timestamp: null
};

// Tempo de cache (5 minutos)
const CACHE_TIME = 5 * 60 * 1000;

// ===========================================
// FUNÇÃO PRINCIPAL - VERIFICAR PERMISSÃO
// ===========================================
async function verificarPermissaoPagina() {
    const oficinaId = sessionStorage.getItem('oficinaId');
    const paginaAtual = window.location.pathname.split('/').pop();
    
    console.log('Verificando permissão para:', paginaAtual);
    console.log('Oficina ID:', oficinaId);
    
    // Se não tem oficinaId, é admin - permite tudo
    if (!oficinaId) {
        console.log('Modo admin - acesso liberado');
        return true;
    }
    
    // Páginas públicas (sempre acessíveis)
    const paginasPublicas = ['login.html', 'primeiro-acesso.html', 'recuperar-senha.html', 'logout.html'];
    if (paginasPublicas.includes(paginaAtual)) {
        return true;
    }
    
    try {
        // Buscar dados da oficina (com cache)
        const oficina = await getDadosOficina(oficinaId);
        
        if (!oficina) {
            console.error('Oficina não encontrada');
            window.location.href = 'login.html';
            return false;
        }
        
        // Verificar status
        if (oficina.status !== 'ativa') {
            const mensagens = {
                'bloqueada': 'Sua oficina está bloqueada. Entre em contato com o suporte.',
                'inativa': 'Sua oficina está inativa. Ative seu plano para acessar.'
            };
            alert(mensagens[oficina.status] || 'Acesso negado');
            window.location.href = 'logout.html';
            return false;
        }
        
        // Obter configurações do plano
        const plano = oficina.plano || 'basico';
        const config = PLANOS_CONFIG[plano] || PLANOS_CONFIG.basico;
        
        // SALVAR NA SESSÃO - ESSENCIAL!
        sessionStorage.setItem('planoAtual', plano);
        sessionStorage.setItem('planoNome', config.nome);
        sessionStorage.setItem('planoPreco', config.preco);
        sessionStorage.setItem('planoFuncionalidades', JSON.stringify(config.funcionalidades));
        
        console.log('Plano atual:', plano, config.nome);
        console.log('Dados salvos na sessão');
        
        // Verificar se a página atual é permitida
        if (!config.rotasPermitidas.includes(paginaAtual)) {
            console.log(`Plano ${config.nome} não permite ${paginaAtual}`);
            
            const mensagem = config.mensagemRestricao || 
                `Seu plano ${config.nome} (R$${config.preco}) não inclui acesso a esta página.`;
            
            alert(mensagem);
            window.location.href = config.redirectSeNaoPermitido;
            return false;
        }
        
        console.log(`Acesso permitido a ${paginaAtual}`);
        return true;
        
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        return false;
    }
}

// ===========================================
// BUSCAR DADOS DA OFICINA COM CACHE
// ===========================================
async function getDadosOficina(oficinaId) {
    // Verificar cache
    const agora = Date.now();
    if (planoCache.id === oficinaId && 
        planoCache.dados && 
        (agora - planoCache.timestamp) < CACHE_TIME) {
        console.log('Usando cache do plano');
        return planoCache.dados;
    }
    
    try {
        console.log('Buscando dados da oficina no Firestore...');
        const doc = await db.collection('oficinas').doc(oficinaId).get();
        
        if (!doc.exists) {
            return null;
        }
        
        const dados = doc.data();
        
        // Atualizar cache
        planoCache = {
            id: oficinaId,
            dados: dados,
            timestamp: agora
        };
        
        return dados;
        
    } catch (error) {
        console.error('Erro ao buscar oficina:', error);
        return null;
    }
}

// ===========================================
// FORÇAR ATUALIZAÇÃO DO PLANO
// ===========================================
async function atualizarPlano() {
    const oficinaId = sessionStorage.getItem('oficinaId');
    if (!oficinaId) return;
    
    // Limpar cache
    planoCache.id = null;
    
    // Buscar novo
    const oficina = await getDadosOficina(oficinaId);
    
    if (oficina) {
        const config = PLANOS_CONFIG[oficina.plano || 'basico'];
        sessionStorage.setItem('planoAtual', oficina.plano || 'basico');
        sessionStorage.setItem('planoNome', config.nome);
        sessionStorage.setItem('planoPreco', config.preco);
    }
}

// ===========================================
// GERAR MENU BASEADO NO PLANO - SEM EMOJIS
// ===========================================
async function gerarMenu() {
    const oficinaId = sessionStorage.getItem('oficinaId');
    const adminMode = sessionStorage.getItem('adminMode');
    
    // Menu para admin
    if (!oficinaId || adminMode === 'true') {
        return `
            <li><a href="dashboard.html">Dashboard</a></li>
            <li><a href="clientes.html">Clientes</a></li>
            <li><a href="veiculos.html">Veículos</a></li>
            <li><a href="orcamentos.html">Orçamentos</a></li>
            <li><a href="financeiro.html">Financeiro</a></li>
            <li><a href="admin-oficinas.html" style="color: #ffc107; font-weight: 600;">Admin</a></li>
        `;
    }
    
    // Buscar plano da sessão (já deve estar salvo)
    const plano = sessionStorage.getItem('planoAtual') || 'basico';
    const config = PLANOS_CONFIG[plano] || PLANOS_CONFIG.basico;
    
    console.log('Gerando menu para plano:', plano, config.nome);
    
    let menuHtml = '';
    config.menu.forEach(item => {
        const activeClass = window.location.pathname.includes(item.url) ? 'active' : '';
        menuHtml += `<li><a href="${item.url}" class="${activeClass}">${item.nome}</a></li>`;
    });
    
    return menuHtml;
}

// ===========================================
// VERIFICAR FUNCIONALIDADE ESPECÍFICA
// ===========================================
function temFuncionalidade(funcionalidade) {
    const funcsString = sessionStorage.getItem('planoFuncionalidades');
    if (!funcsString) return false;
    
    try {
        const funcionalidades = JSON.parse(funcsString);
        return funcionalidades.includes(funcionalidade);
    } catch {
        return false;
    }
}

// ===========================================
// MOSTRAR BANNER DO PLANO - SEM EMOJIS
// ===========================================
function mostrarBannerPlano() {
    const plano = sessionStorage.getItem('planoAtual') || 'basico';
    const planoNome = sessionStorage.getItem('planoNome') || 'Básico';
    const planoPreco = sessionStorage.getItem('planoPreco') || '30';
    
    const cores = {
        basico: '#cd7f32',
        intermediario: '#6c757d',
        completo: '#ffc107'
    };
    
    const textos = {
        basico: 'Plano Básico - Acesso apenas a orçamentos.',
        intermediario: 'Plano Intermediário - Acesso a clientes e veículos.',
        completo: 'Plano Completo - Todos os recursos liberados.'
    };
    
    const banner = document.createElement('div');
    banner.style.cssText = `
        background: ${cores[plano]};
        color: ${plano === 'completo' ? '#000' : '#fff'};
        padding: 10px 20px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        border: 1px solid #e0e0e0;
    `;
    
    banner.innerHTML = `
        <span>
            <strong>${textos[plano]}</strong> 
            <span style="margin-left: 10px; background: rgba(255,255,255,0.2); padding: 4px 8px; border: 1px solid rgba(255,255,255,0.3);">
                R$ ${planoPreco}/mês
            </span>
        </span>
        <a href="planos.html" style="color: ${plano === 'completo' ? '#000' : '#fff'}; text-decoration: underline;">
            Gerenciar Plano →
        </a>
    `;
    
    banner.classList.add('plano-banner');
    
    const content = document.querySelector('.main-content');
    if (content) {
        const bannerAntigo = document.querySelector('.plano-banner');
        if (bannerAntigo) bannerAntigo.remove();
        content.prepend(banner);
    }
}

// ===========================================
// EXPORTAR FUNÇÕES
// ===========================================
window.permissoes = {
    verificarPermissaoPagina,
    gerarMenu,
    mostrarBannerPlano,
    temFuncionalidade,
    atualizarPlano,
    PLANOS_CONFIG
};