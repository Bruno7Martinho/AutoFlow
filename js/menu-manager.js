// menu-manager.js
// Gerenciador centralizado de menus com todas as verificações

const MenuManager = {
    // Cache do plano para evitar múltiplas buscas
    planoCache: null,

    // ===========================================
    // INICIALIZAR MENU
    // ===========================================
    init: async function() {
        console.log('Inicializando MenuManager...');

        // Aguardar um pouco para garantir que sessionStorage esteja carregado
        await new Promise(resolve => setTimeout(resolve, 100));

        const oficinaId = sessionStorage.getItem('oficinaId');
        const adminMode = sessionStorage.getItem('adminMode');
        const plano = sessionStorage.getItem('planoAtual') || 'basico';

        console.log('Dados da sessão:', {
            oficinaId,
            adminMode,
            plano,
            planoNome: sessionStorage.getItem('planoNome'),
            planoPreco: sessionStorage.getItem('planoPreco')
        });

        // Se for admin, mostrar menu admin
        if (!oficinaId || adminMode === 'true') {
            console.log('Modo admin detectado');
            return this.gerarMenuAdmin();
        }

        // Se não tiver plano na sessão, tentar buscar do Firestore
        if (!sessionStorage.getItem('planoAtual')) {
            console.log('Plano não encontrado na sessão, buscando do Firestore...');
            await this.atualizarPlanoDoFirestore(oficinaId);
        }

        // Gerar menu baseado no plano
        return this.gerarMenuPorPlano(plano);
    },

    // ===========================================
    // ATUALIZAR PLANO DO FIRESTORE
    // ===========================================
    atualizarPlanoDoFirestore: async function(oficinaId) {
        try {
            const doc = await db.collection('oficinas').doc(oficinaId).get();

            if (doc.exists) {
                const oficina = doc.data();
                const plano = oficina.plano || 'basico';

                // Mapeamento de planos
                const planosInfo = {
                    basico: { nome: 'Básico', preco: 30 },
                    intermediario: { nome: 'Intermediário', preco: 50 },
                    completo: { nome: 'Completo', preco: 70 }
                };

                const info = planosInfo[plano] || planosInfo.basico;

                // Salvar na sessão
                sessionStorage.setItem('planoAtual', plano);
                sessionStorage.setItem('planoNome', info.nome);
                sessionStorage.setItem('planoPreco', info.preco);

                console.log('Plano atualizado do Firestore:', plano);
                return plano;
            }
        } catch (error) {
            console.error('Erro ao buscar plano do Firestore:', error);
        }
        return 'basico';
    },

    // ===========================================
    // GERAR MENU ADMIN
    // ===========================================
    gerarMenuAdmin: function() {
        const paginaAtual = window.location.pathname.split('/').pop();

        return `
            <ul>
                <li><a href="admin-dashboard.html" ${paginaAtual === 'admin-dashboard.html' ? 'class="active"' : ''}>Dashboard</a></li>
                <li><a href="admin-oficinas.html" ${paginaAtual === 'admin-oficinas.html' ? 'class="active"' : ''}>Oficinas</a></li>
                <li><a href="admin-usuarios.html" ${paginaAtual === 'admin-usuarios.html' ? 'class="active"' : ''}>Usuários</a></li>
                <li><a href="admin-relatorios.html" ${paginaAtual === 'admin-relatorios.html' ? 'class="active"' : ''}>Relatórios</a></li>
                <li><a href="admin-config.html" ${paginaAtual === 'admin-config.html' ? 'class="active"' : ''}>Configurações</a></li>
            </ul>
        `;
    },

    // ===========================================
    // GERAR MENU POR PLANO
    // ===========================================
    gerarMenuPorPlano: function(plano) {
        const paginaAtual = window.location.pathname.split('/').pop();

        console.log('Gerando menu para plano:', plano);

        // VALIDAÇÕES DE SEGURANÇA
        // Se o plano não for reconhecido, usar básico como fallback
        if (!['basico', 'intermediario', 'completo'].includes(plano)) {
            console.warn('Plano não reconhecido:', plano, 'usando básico como fallback');
            plano = 'basico';
        }

        let menuHtml = '<ul>';

        // Dashboard - sempre presente para todos os planos
        menuHtml += `<li><a href="dashboard.html" ${paginaAtual === 'dashboard.html' ? 'class="active"' : ''}>Dashboard</a></li>`;

        if (plano === 'basico') {
            // Plano Básico: apenas Dashboard e Orçamentos
            menuHtml += `<li><a href="orcamentos.html" ${paginaAtual === 'orcamentos.html' ? 'class="active"' : ''}>Orçamentos</a></li>`;

        } else if (plano === 'intermediario') {
            // Plano Intermediário: Dashboard, Clientes, Veículos, Orçamentos
            menuHtml += `<li><a href="clientes.html" ${paginaAtual === 'clientes.html' ? 'class="active"' : ''}>Clientes</a></li>`;
            menuHtml += `<li><a href="veiculos.html" ${paginaAtual === 'veiculos.html' ? 'class="active"' : ''}>Veículos</a></li>`;
            menuHtml += `<li><a href="orcamentos.html" ${paginaAtual === 'orcamentos.html' ? 'class="active"' : ''}>Orçamentos</a></li>`;

        } else if (plano === 'completo') {
            // Plano Completo: Clientes, Veículos, Orçamentos, Financeiro
            menuHtml += `<li><a href="clientes.html" ${paginaAtual === 'clientes.html' ? 'class="active"' : ''}>Clientes</a></li>`;
            menuHtml += `<li><a href="veiculos.html" ${paginaAtual === 'veiculos.html' ? 'class="active"' : ''}>Veículos</a></li>`;
            menuHtml += `<li><a href="orcamentos.html" ${paginaAtual === 'orcamentos.html' ? 'class="active"' : ''}>Orçamentos</a></li>`;
            menuHtml += `<li><a href="financeiro.html" ${paginaAtual === 'financeiro.html' ? 'class="active"' : ''}>Financeiro</a></li>`;
        }

        menuHtml += '</ul>';

        return menuHtml;
    },

    // ===========================================
    // APLICAR MENU NA PÁGINA ATUAL
    // ===========================================
    aplicarMenu: async function() {
        const navContainer = document.getElementById('main-nav');
        if (!navContainer) {
            console.error('Elemento #main-nav não encontrado!');
            return;
        }

        try {
            const menuHtml = await this.init();
            navContainer.innerHTML = menuHtml;
            console.log('Menu aplicado com sucesso');
        } catch (error) {
            console.error('Erro ao aplicar menu:', error);

            // Fallback: menu básico em caso de erro
            navContainer.innerHTML = `
                <ul>
                    <li><a href="dashboard.html">Dashboard</a></li>
                    <li><a href="orcamentos.html">Orçamentos</a></li>
                </ul>
            `;
        }
    },

    // ===========================================
    // VERIFICAR SE PODE ACESSAR PÁGINA
    // ===========================================
    podeAcessarPagina: function(pagina) {
        const plano = sessionStorage.getItem('planoAtual') || 'basico';
        const adminMode = sessionStorage.getItem('adminMode');

        // Admin pode tudo
        if (adminMode === 'true' || !sessionStorage.getItem('oficinaId')) {
            return true;
        }

        // Mapeamento de páginas por plano
        const paginasPorPlano = {
            basico: ['dashboard.html', 'orcamentos.html', 'orcamento-rapido.html'],
            intermediario: ['dashboard.html', 'clientes.html', 'veiculos.html', 'orcamentos.html', 'orcamento-rapido.html'],
            completo: ['dashboard.html', 'clientes.html', 'veiculos.html', 'orcamentos.html', 'orcamento-rapido.html', 'financeiro.html']
        };

        return paginasPorPlano[plano]?.includes(pagina) || false;
    },

    // ===========================================
    // REDIRECIONAR SE NÃO TIVER PERMISSÃO
    // ===========================================
    verificarEAplicarRedirecionamento: function() {
        const paginaAtual = window.location.pathname.split('/').pop();
        const podeAcessar = this.podeAcessarPagina(paginaAtual);

        if (!podeAcessar) {
            console.log('Sem permissão para acessar:', paginaAtual);

            const plano = sessionStorage.getItem('planoAtual') || 'basico';

            if (plano === 'basico') {
                window.location.href = 'orcamentos.html';
            } else {
                window.location.href = 'dashboard.html';
            }
            return false;
        }

        return true;
    },

    // ===========================================
    // DEBUG - MOSTRAR INFORMAÇÕES DO PLANO
    // ===========================================
    debug: function() {
        console.log('===  DEBUG DO MENU MANAGER ===');
        console.log('oficinaId:', sessionStorage.getItem('oficinaId'));
        console.log('adminMode:', sessionStorage.getItem('adminMode'));
        console.log('planoAtual:', sessionStorage.getItem('planoAtual'));
        console.log('planoNome:', sessionStorage.getItem('planoNome'));
        console.log('planoPreco:', sessionStorage.getItem('planoPreco'));
        console.log('página atual:', window.location.pathname.split('/').pop());
        console.log('pode acessar:', this.podeAcessarPagina(window.location.pathname.split('/').pop()));
        console.log('================================');
    }
};

// Exportar para uso global
window.MenuManager = MenuManager;

// Auto-executar debug se estiver em desenvolvimento
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(() => {
        MenuManager.debug();
    }, 500);
}