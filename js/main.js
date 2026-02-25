// Arquivo principal que inicializa o sistema

// Adicionar estilos para módulos
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar estilos CSS adicionais
    adicionarEstilosOrcamento();
    
    // Inicializar sistema de autenticação
    if (typeof initializeAuthElements === 'function') {
        initializeAuthElements();
    }
    
    // Verificar se o usuário está autenticado
    checkAuthState();
    
    // Configurar navegação
    if (typeof loadNavigation === 'function') {
        loadNavigation();
    }
});

// Função para adicionar estilos do módulo de orçamentos
function adicionarEstilosOrcamento() {
    const style = document.createElement('style');
    style.textContent = `
        .item-orcamento {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr auto;
            gap: 10px;
            margin-bottom: 10px;
            align-items: center;
        }
        
        .mt-10 {
            margin-top: 10px;
        }
    `;
    document.head.appendChild(style);
}