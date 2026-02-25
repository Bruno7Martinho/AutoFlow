// permissions.js
// Verificador de permissões baseado no plano da oficina

const PLANOS_CONFIG = {
    basico: {
        funcionalidades: ['orcamentos'],
        rotas: ['orcamentos.html'],
        menus: ['Orçamentos']
    },
    intermediario: {
        funcionalidades: ['orcamentos', 'clientes', 'veiculos'],
        rotas: ['orcamentos.html', 'clientes.html', 'veiculos.html'],
        menus: ['Orçamentos', 'Clientes', 'Veículos']
    },
    completo: {
        funcionalidades: ['orcamentos', 'clientes', 'veiculos', 'financeiro', 'relatorios', 'funcionarios'],
        rotas: ['orcamentos.html', 'clientes.html', 'veiculos.html', 'financeiro.html', 'relatorios.html', 'funcionarios.html'],
        menus: ['Orçamentos', 'Clientes', 'Veículos', 'Financeiro', 'Relatórios', 'Funcionários']
    }
};

// Verificar se a oficina tem acesso a uma funcionalidade
async function verificarPermissao(oficinaId, funcionalidade) {
    try {
        // Buscar dados da oficina
        const oficinaDoc = await db.collection('oficinas').doc(oficinaId).get();
        
        if (!oficinaDoc.exists) {
            return false;
        }
        
        const oficina = oficinaDoc.data();
        
        // Verificar status
        if (oficina.status !== 'ativa') {
            return false;
        }
        
        // Verificar plano
        const plano = oficina.plano || 'basico';
        const config = PLANOS_CONFIG[plano];
        
        return config.funcionalidades.includes(funcionalidade);
        
    } catch (error) {
        console.error('Erro ao verificar permissão:', error);
        return false;
    }
}

// Verificar permissão para a página atual
async function verificarPaginaAtual() {
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    // Se não tem oficinaId, é admin
    if (!oficinaId) {
        return true;
    }
    
    const paginaAtual = window.location.pathname.split('/').pop();
    
    // Páginas públicas (sempre acessíveis)
    const paginasPublicas = ['dashboard.html', 'login.html', 'logout.html'];
    
    if (paginasPublicas.includes(paginaAtual)) {
        return true;
    }
    
    try {
        const oficinaDoc = await db.collection('oficinas').doc(oficinaId).get();
        
        if (!oficinaDoc.exists) {
            window.location.href = 'login.html';
            return false;
        }
        
        const oficina = oficinaDoc.data();
        
        // Verificar status
        if (oficina.status !== 'ativa') {
            alert('Sua oficina está bloqueada. Entre em contato com o suporte.');
            window.location.href = 'logout.html';
            return false;
        }
        
        // Verificar plano
        const plano = oficina.plano || 'basico';
        const config = PLANOS_CONFIG[plano];
        
        // Mapear página para funcionalidade
        const paginaFuncionalidade = {
            'clientes.html': 'clientes',
            'veiculos.html': 'veiculos',
            'orcamentos.html': 'orcamentos',
            'financeiro.html': 'financeiro',
            'relatorios.html': 'relatorios',
            'funcionarios.html': 'funcionarios'
        };
        
        const funcionalidadeNecessaria = paginaFuncionalidade[paginaAtual];
        
        if (funcionalidadeNecessaria && !config.funcionalidades.includes(funcionalidadeNecessaria)) {
            // Plano não permite esta página
            alert(`Seu plano não inclui acesso a ${paginaAtual.replace('.html', '')}. Faça um upgrade!`);
            window.location.href = 'dashboard.html';
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('Erro ao verificar permissão:', error);
        return false;
    }
}

// Gerar menu baseado no plano
async function gerarMenu() {
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    // Menu para admin
    if (!oficinaId) {
        return `
            <li><a href="admin-dashboard.html">Dashboard</a></li>
            <li><a href="admin-oficinas.html">Oficinas</a></li>
            <li><a href="admin-relatorios.html">Relatórios</a></li>
        `;
    }
    
    try {
        const oficinaDoc = await db.collection('oficinas').doc(oficinaId).get();
        const oficina = oficinaDoc.data();
        const plano = oficina.plano || 'basico';
        const config = PLANOS_CONFIG[plano];
        
        let menu = '';
        
        // Dashboard sempre visível
        menu += '<li><a href="dashboard.html">Dashboard</a></li>';
        
        // Adicionar menus baseado no plano
        if (config.menus.includes('Clientes')) {
            menu += '<li><a href="clientes.html">Clientes</a></li>';
        }
        if (config.menus.includes('Veículos')) {
            menu += '<li><a href="veiculos.html">Veículos</a></li>';
        }
        if (config.menus.includes('Orçamentos')) {
            menu += '<li><a href="orcamentos.html">Orçamentos</a></li>';
        }
        if (config.menus.includes('Financeiro')) {
            menu += '<li><a href="financeiro.html">Financeiro</a></li>';
        }
        
        return menu;
        
    } catch (error) {
        console.error('Erro ao gerar menu:', error);
        return '<li><a href="dashboard.html">Dashboard</a></li>';
    }
}

// Função para verificar limite de clientes
async function verificarLimiteClientes(oficinaId) {
    try {
        const oficinaDoc = await db.collection('oficinas').doc(oficinaId).get();
        const oficina = oficinaDoc.data();
        const plano = oficina.plano || 'basico';
        
        // Planos sem clientes
        if (plano === 'basico') {
            return { permitido: false, mensagem: 'Seu plano não permite cadastrar clientes' };
        }
        
        // Ilimitado
        if (plano === 'completo') {
            return { permitido: true };
        }
        
        // Contar clientes atuais
        const clientesSnap = await db.collection('oficinas')
            .doc(oficinaId)
            .collection('clientes')
            .count()
            .get();
        
        const totalClientes = clientesSnap.data().count || 0;
        const limite = 100; // limite do plano intermediário
        
        if (totalClientes >= limite) {
            return { 
                permitido: false, 
                mensagem: `Limite de ${limite} clientes atingido. Faça upgrade para o plano completo!` 
            };
        }
        
        return { permitido: true };
        
    } catch (error) {
        console.error('Erro ao verificar limite:', error);
        return { permitido: false, mensagem: 'Erro ao verificar limite' };
    }
}

// Exportar funções
window.permissions = {
    verificarPermissao,
    verificarPaginaAtual,
    gerarMenu,
    verificarLimiteClientes,
    PLANOS_CONFIG
};