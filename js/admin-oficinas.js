// admin-oficinas.js
// Gerenciamento de oficinas para administradores

// CONSTANTES GLOBAIS
const PLANOS = {
    basico: {
        id: 'basico',
        nome: 'Básico',
        preco: 30,
        descricao: 'Apenas orçamentos',
        funcionalidades: ['orcamentos'],
        limiteClientes: 0,
        limiteVeiculos: 0,
        cor: '#c62828',
        badge: 'basico'
    },
    intermediario: {
        id: 'intermediario',
        nome: 'Intermediário',
        preco: 50,
        descricao: 'Clientes e Veículos',
        funcionalidades: ['clientes', 'veiculos', 'orcamentos'],
        limiteClientes: 100,
        limiteVeiculos: 200,
        cor: '#424242',
        badge: 'intermediario'
    },
    completo: {
        id: 'completo',
        nome: 'Completo',
        preco: 70,
        descricao: 'Todas funcionalidades',
        funcionalidades: ['clientes', 'veiculos', 'orcamentos', 'financeiro', 'relatorios', 'funcionarios'],
        limiteClientes: -1,
        limiteVeiculos: -1,
        cor: '#212121',
        badge: 'completo'
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando admin-oficinas...');
    
    // Verificar se é admin
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('👤 Usuário logado:', user.email);
            
            // Lista de admins
            const ADMIN_EMAILS = [
                'admin@autoflow.com',
                'rafael@gmail.com',
                'admin@gmail.com'
            ];
            
            if (!ADMIN_EMAILS.includes(user.email)) {
                alert('⛔ Acesso negado! Apenas administradores.');
                window.location.href = 'dashboard.html';
                return;
            }
            
            loadUserInfo(user);
            loadOficinas();
            loadEstatisticas();
            
        } else {
            console.log('🔒 Usuário não logado');
            window.location.href = 'login.html';
        }
    });

    // Elementos do DOM
    const oficinasBody = document.getElementById('oficinas-body');
    const loader = document.getElementById('loader');
    const modal = document.getElementById('oficina-modal');
    const viewModal = document.getElementById('view-oficina-modal');
    const bloquearModal = document.getElementById('bloquear-modal');
    const form = document.getElementById('form-oficina');
    const btnSalvar = document.getElementById('btn-salvar-oficina');
    
    // Variáveis de estado
    let oficinas = [];
    let oficinasFiltradas = [];
    let paginaAtual = 1;
    let itensPorPagina = 10;
    let oficinaSelecionadaId = null;

    // ===========================================
    // FUNÇÕES DE CARREGAMENTO
    // ===========================================

    function loadUserInfo(user) {
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <span class="user-email">${user.email}</span>
                <button id="logout-btn" class="btn btn-sm btn-danger">Sair</button>
            `;
            
            document.getElementById('logout-btn').addEventListener('click', function() {
                auth.signOut().then(() => {
                    window.location.href = 'login.html';
                });
            });
        }
    }

    async function loadEstatisticas() {
        try {
            const snapshot = await db.collection('oficinas').get();
            
            let ativas = 0;
            let bloqueadas = 0;
            let inativas = 0;
            
            for (const doc of snapshot.docs) {
                const oficina = doc.data();
                
                if (oficina.status === 'ativa') ativas++;
                else if (oficina.status === 'bloqueada') bloqueadas++;
                else if (oficina.status === 'inativa') inativas++;
            }
            
            // Atualizar elementos se existirem
            const elTotal = document.getElementById('total-oficinas');
            if (elTotal) elTotal.textContent = snapshot.size;
            
            const elAtivas = document.getElementById('oficinas-ativas');
            if (elAtivas) elAtivas.textContent = ativas;
            
            const elBloqueadas = document.getElementById('oficinas-bloqueadas');
            if (elBloqueadas) elBloqueadas.textContent = bloqueadas;
            
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    // ===========================================
    // CARREGAR OFICINAS
    // ===========================================

    async function loadOficinas() {
        console.log('📥 Carregando oficinas...');
        
        if (loader) {
            loader.style.display = 'block';
        }
        
        if (oficinasBody) {
            oficinasBody.innerHTML = '<tr><td colspan="7" class="text-center">Carregando...</td></tr>';
        }
        
        try {
            const snapshot = await db.collection('oficinas').get();
            
            console.log('📊 Documentos encontrados:', snapshot.size);
            
            if (loader) loader.style.display = 'none';
            
            if (snapshot.empty) {
                oficinasBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">
                            Nenhuma oficina cadastrada.<br>
                            <button onclick="criarOficinaTeste()" class="btn btn-sm btn-success" style="margin-top: 10px;">
                                + Criar Primeira Oficina
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Converter para array
            oficinas = [];
            snapshot.forEach(doc => {
                oficinas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Ordenar por nome
            oficinas.sort((a, b) => {
                const nomeA = (a.nome || '').toLowerCase();
                const nomeB = (b.nome || '').toLowerCase();
                return nomeA.localeCompare(nomeB);
            });
            
            oficinasFiltradas = [...oficinas];
            renderizarTabela();
            
        } catch (error) {
            console.error('❌ ERRO:', error);
            
            if (loader) loader.style.display = 'none';
            
            oficinasBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        ❌ Erro ao carregar oficinas: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    // ===========================================
    // RENDERIZAR TABELA
    // ===========================================

    function renderizarTabela() {
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const paginaData = oficinasFiltradas.slice(inicio, fim);
        
        if (!oficinasBody) return;
        
        oficinasBody.innerHTML = '';
        
        if (paginaData.length === 0) {
            oficinasBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Nenhuma oficina encontrada.</td>
                </tr>
            `;
            return;
        }
        
        paginaData.forEach(oficina => {
            const row = document.createElement('tr');
            
            const planoId = oficina.plano || 'basico';
            const planoInfo = PLANOS[planoId] || PLANOS.basico;
            
            const dataCadastro = oficina.createdAt ? new Date(oficina.createdAt).toLocaleDateString('pt-BR') : '-';
            
            row.innerHTML = `
                <td>
                    <strong>${oficina.nome || 'Sem nome'}</strong><br>
                    <small>${oficina.id?.substring(0, 8) || ''}...</small>
                </td>
                <td>
                    ${oficina.emailDono || '-'}<br>
                    <small>${formatarTelefone(oficina.telefone) || ''}</small>
                </td>
                <td>${formatarCNPJ(oficina.cnpj) || '-'}</td>
                <td>
                    <span class="badge badge-${planoInfo.badge}">
                        ${planoInfo.nome}
                    </span><br>
                    <small>R$ ${planoInfo.preco}/mês</small>
                </td>
                <td>
                    <span class="status-badge status-${oficina.status || 'ativa'}">
                        ${traduzirStatus(oficina.status || 'ativa')}
                    </span>
                </td>
                <td>${dataCadastro}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-info" onclick="verOficina('${oficina.id}')" title="Visualizar">👁️</button>
                    <button class="btn btn-sm btn-primary" onclick="editarOficina('${oficina.id}')" title="Editar">✏️</button>
                    ${oficina.status === 'bloqueada' ? 
                        `<button class="btn btn-sm btn-success" onclick="desbloquearOficina('${oficina.id}')" title="Desbloquear">🔓</button>` : 
                        `<button class="btn btn-sm btn-warning" onclick="bloquearOficina('${oficina.id}')" title="Bloquear">🔒</button>`
                    }
                    <button class="btn btn-sm btn-danger" onclick="excluirOficina('${oficina.id}')" title="Excluir">🗑️</button>
                </td>
            `;
            oficinasBody.appendChild(row);
        });
        
        // Atualizar paginação
        const totalPaginas = Math.ceil(oficinasFiltradas.length / itensPorPagina);
        const pageInfo = document.getElementById('page-info');
        const prevPage = document.getElementById('prev-page');
        const nextPage = document.getElementById('next-page');
        
        if (pageInfo) pageInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
        if (prevPage) prevPage.disabled = paginaAtual === 1;
        if (nextPage) nextPage.disabled = paginaAtual === totalPaginas || totalPaginas === 0;
    }

    // ===========================================
    // FUNÇÕES AUXILIARES
    // ===========================================

    function traduzirStatus(status) {
        const map = {
            'ativa': 'Ativa',
            'bloqueada': 'Bloqueada',
            'inativa': 'Inativa'
        };
        return map[status] || status;
    }

    function formatarTelefone(tel) {
        if (!tel) return '';
        const nums = tel.replace(/\D/g, '');
        if (nums.length === 10) return nums.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        if (nums.length === 11) return nums.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        return tel;
    }

    function formatarCNPJ(cnpj) {
        if (!cnpj) return '';
        const nums = cnpj.replace(/\D/g, '');
        if (nums.length === 14) return nums.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
        return cnpj;
    }

    // ===========================================
    // FILTROS
    // ===========================================

    document.getElementById('search-oficina')?.addEventListener('input', aplicarFiltros);
    document.getElementById('filter-status')?.addEventListener('change', aplicarFiltros);
    document.getElementById('filter-plano')?.addEventListener('change', aplicarFiltros);

    function aplicarFiltros() {
        const busca = document.getElementById('search-oficina')?.value.toLowerCase() || '';
        const status = document.getElementById('filter-status')?.value || '';
        const plano = document.getElementById('filter-plano')?.value || '';
        
        oficinasFiltradas = oficinas.filter(oficina => {
            const matchBusca = !busca || 
                (oficina.nome && oficina.nome.toLowerCase().includes(busca)) ||
                (oficina.emailDono && oficina.emailDono.toLowerCase().includes(busca));
            
            const matchStatus = !status || oficina.status === status;
            const matchPlano = !plano || oficina.plano === plano;
            
            return matchBusca && matchStatus && matchPlano;
        });
        
        paginaAtual = 1;
        renderizarTabela();
    }

    // ===========================================
    // PAGINAÇÃO
    // ===========================================

    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarTabela();
        }
    });

    document.getElementById('next-page')?.addEventListener('click', () => {
        const totalPaginas = Math.ceil(oficinasFiltradas.length / itensPorPagina);
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderizarTabela();
        }
    });

    // ===========================================
    // ABAS DO FORMULÁRIO
    // ===========================================

    document.querySelectorAll('.form-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.form-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.form-tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tab = this.getAttribute('data-tab');
            document.getElementById(`tab-${tab}`).classList.add('active');
        });
    });

    // ===========================================
    // BUSCAR CEP
    // ===========================================

    document.getElementById('btn-buscar-cep')?.addEventListener('click', function() {
        const cep = document.getElementById('oficina-cep').value.replace(/\D/g, '');
        if (cep.length === 8) {
            fetch(`https://viacep.com.br/ws/${cep}/json/`)
                .then(res => res.json())
                .then(data => {
                    if (!data.erro) {
                        document.getElementById('oficina-endereco').value = data.logradouro || '';
                        document.getElementById('oficina-bairro').value = data.bairro || '';
                        document.getElementById('oficina-cidade').value = data.localidade || '';
                        document.getElementById('oficina-uf').value = data.uf || '';
                    } else {
                        alert('❌ CEP não encontrado');
                    }
                })
                .catch(err => {
                    console.error('Erro ao buscar CEP:', err);
                    alert('❌ Erro ao buscar CEP');
                });
        } else {
            alert('❌ CEP inválido');
        }
    });

    // ===========================================
    // NOVA OFICINA
    // ===========================================

    document.getElementById('btn-nova-oficina')?.addEventListener('click', function() {
        oficinaSelecionadaId = null;
        document.getElementById('modal-title').textContent = 'Nova Oficina';
        document.getElementById('btn-salvar-oficina').innerHTML = '<i class="fas fa-save"></i> Salvar Oficina';
        
        if (form) form.reset();
        
        const statusField = document.getElementById('oficina-status');
        if (statusField) statusField.value = 'ativa';
        
        const planoField = document.getElementById('oficina-plano');
        if (planoField) planoField.value = 'basico';
        
        document.querySelectorAll('.form-tab-btn')[0]?.click();
        
        if (modal) modal.classList.add('active');
    });

    // ===========================================
    // SALVAR OFICINA
    // ===========================================

    form?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nome = document.getElementById('oficina-nome')?.value;
        const email = document.getElementById('oficina-email')?.value;
        const telefone = document.getElementById('oficina-telefone')?.value;
        const plano = document.getElementById('oficina-plano')?.value;
        
        if (!nome || !email || !telefone || !plano) {
            alert('❌ Preencha todos os campos obrigatórios!');
            return;
        }
        
        const oficinaData = {
            nome: nome,
            emailDono: email,
            telefone: telefone,
            plano: plano,
            status: document.getElementById('oficina-status')?.value || 'ativa',
            cnpj: document.getElementById('oficina-cnpj')?.value || '',
            whatsapp: document.getElementById('oficina-whatsapp')?.value || '',
            cep: document.getElementById('oficina-cep')?.value || '',
            endereco: document.getElementById('oficina-endereco')?.value || '',
            numero: document.getElementById('oficina-numero')?.value || '',
            complemento: document.getElementById('oficina-complemento')?.value || '',
            bairro: document.getElementById('oficina-bairro')?.value || '',
            cidade: document.getElementById('oficina-cidade')?.value || '',
            uf: document.getElementById('oficina-uf')?.value || '',
            dataVencimento: document.getElementById('oficina-vencimento')?.value || '',
            observacoes: document.getElementById('oficina-observacoes')?.value || '',
            updatedAt: new Date().toISOString()
        };
        
        if (btnSalvar) {
            btnSalvar.disabled = true;
            btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        }
        
        try {
            if (oficinaSelecionadaId) {
                await db.collection('oficinas').doc(oficinaSelecionadaId).update(oficinaData);
                alert('✅ Oficina atualizada com sucesso!');
            } else {
                oficinaData.createdAt = new Date().toISOString();
                await db.collection('oficinas').add(oficinaData);
                alert('✅ Oficina criada com sucesso!');
            }
            
            if (modal) modal.classList.remove('active');
            loadOficinas();
            loadEstatisticas();
            
        } catch (error) {
            console.error('❌ Erro:', error);
            alert('❌ Erro ao salvar oficina: ' + error.message);
        } finally {
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.innerHTML = oficinaSelecionadaId ? 
                    '<i class="fas fa-save"></i> Atualizar Oficina' : 
                    '<i class="fas fa-save"></i> Salvar Oficina';
            }
        }
    });

    // ===========================================
    // FECHAR MODAIS
    // ===========================================

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            if (modal) modal.classList.remove('active');
            if (viewModal) viewModal.classList.remove('active');
            if (bloquearModal) bloquearModal.classList.remove('active');
        });
    });

    // ===========================================
    // FUNÇÃO CORRIGIDA - VER OFICINA
    // ===========================================

    window.verOficina = async function(oficinaId) {
        console.log('🔍 Ver oficina:', oficinaId);
        
        try {
            const doc = await db.collection('oficinas').doc(oficinaId).get();
            
            if (!doc.exists) {
                alert('❌ Oficina não encontrada');
                return;
            }
            
            const of = doc.data();
            console.log('📄 Dados da oficina:', of);
            
            const planoId = of.plano || 'basico';
            const planoInfo = PLANOS[planoId] || PLANOS.basico;
            
            const detalhesDiv = document.getElementById('oficina-detalhes');
            if (!detalhesDiv) {
                console.error('❌ Elemento #oficina-detalhes não encontrado!');
                alert('Erro: Elemento de detalhes não encontrado');
                return;
            }
            
            // Formatar datas
            const dataCadastro = of.createdAt ? new Date(of.createdAt).toLocaleDateString('pt-BR') : '-';
            const dataVencimento = of.dataVencimento ? new Date(of.dataVencimento).toLocaleDateString('pt-BR') : '-';
            
            detalhesDiv.innerHTML = `
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e0e0e0;">
                        <h3 style="margin: 0 0 10px 0; color: #c62828;">${of.nome || 'Sem nome'}</h3>
                        <p style="margin: 5px 0;"><strong>ID:</strong> ${oficinaId}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <h4 style="margin: 0 0 10px 0; color: #424242;">Informações Básicas</h4>
                            <p><strong>Status:</strong> 
                                <span class="status-badge status-${of.status || 'ativa'}">
                                    ${traduzirStatus(of.status || 'ativa')}
                                </span>
                            </p>
                            <p><strong>Plano:</strong> ${planoInfo.nome} - R$ ${planoInfo.preco}/mês</p>
                            <p><strong>CNPJ:</strong> ${formatarCNPJ(of.cnpj) || '-'}</p>
                            <p><strong>Data Cadastro:</strong> ${dataCadastro}</p>
                        </div>
                        
                        <div>
                            <h4 style="margin: 0 0 10px 0; color: #424242;">Contato</h4>
                            <p><strong>Email:</strong> ${of.emailDono || '-'}</p>
                            <p><strong>Telefone:</strong> ${formatarTelefone(of.telefone) || '-'}</p>
                            <p><strong>WhatsApp:</strong> ${formatarTelefone(of.whatsapp) || '-'}</p>
                        </div>
                        
                        <div style="grid-column: span 2;">
                            <h4 style="margin: 0 0 10px 0; color: #424242;">Endereço</h4>
                            <p>${of.endereco || ''}, ${of.numero || ''} ${of.complemento || ''}</p>
                            <p>${of.bairro || ''} - ${of.cidade || ''}/${of.uf || ''}</p>
                            <p><strong>CEP:</strong> ${of.cep || '-'}</p>
                        </div>
                        
                        <div style="grid-column: span 2;">
                            <h4 style="margin: 0 0 10px 0; color: #424242;">Informações Adicionais</h4>
                            <p><strong>Vencimento:</strong> ${dataVencimento}</p>
                            ${of.observacoes ? `<p><strong>Observações:</strong> ${of.observacoes}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            // Abrir modal
            if (viewModal) {
                viewModal.classList.add('active');
                console.log('✅ Modal aberto com sucesso');
            } else {
                console.error('❌ Elemento #view-oficina-modal não encontrado');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar detalhes:', error);
            alert('❌ Erro ao carregar detalhes da oficina');
        }
    };

    // ===========================================
    // OUTRAS FUNÇÕES
    // ===========================================

    window.editarOficina = async function(oficinaId) {
        try {
            const doc = await db.collection('oficinas').doc(oficinaId).get();
            if (!doc.exists) return;
            
            const of = doc.data();
            oficinaSelecionadaId = oficinaId;
            
            document.getElementById('modal-title').textContent = 'Editar Oficina';
            document.getElementById('btn-salvar-oficina').innerHTML = '<i class="fas fa-save"></i> Atualizar Oficina';
            
            document.getElementById('oficina-nome').value = of.nome || '';
            document.getElementById('oficina-email').value = of.emailDono || '';
            document.getElementById('oficina-cnpj').value = of.cnpj || '';
            document.getElementById('oficina-telefone').value = of.telefone || '';
            document.getElementById('oficina-whatsapp').value = of.whatsapp || '';
            document.getElementById('oficina-cep').value = of.cep || '';
            document.getElementById('oficina-endereco').value = of.endereco || '';
            document.getElementById('oficina-numero').value = of.numero || '';
            document.getElementById('oficina-complemento').value = of.complemento || '';
            document.getElementById('oficina-bairro').value = of.bairro || '';
            document.getElementById('oficina-cidade').value = of.cidade || '';
            document.getElementById('oficina-uf').value = of.uf || '';
            document.getElementById('oficina-plano').value = of.plano || 'basico';
            document.getElementById('oficina-status').value = of.status || 'ativa';
            document.getElementById('oficina-vencimento').value = of.dataVencimento || '';
            document.getElementById('oficina-observacoes').value = of.observacoes || '';
            
            document.querySelectorAll('.form-tab-btn')[0]?.click();
            
            if (modal) modal.classList.add('active');
            
        } catch (error) {
            console.error('❌ Erro:', error);
            alert('❌ Erro ao carregar oficina');
        }
    };

    window.bloquearOficina = function(oficinaId) {
        if (confirm('🔒 Bloquear esta oficina?')) {
            db.collection('oficinas').doc(oficinaId).update({
                status: 'bloqueada',
                updatedAt: new Date().toISOString()
            })
            .then(() => {
                alert('✅ Oficina bloqueada');
                loadOficinas();
            })
            .catch(error => {
                console.error('❌ Erro:', error);
                alert('❌ Erro ao bloquear');
            });
        }
    };

    window.desbloquearOficina = function(oficinaId) {
        if (confirm('🔓 Desbloquear esta oficina?')) {
            db.collection('oficinas').doc(oficinaId).update({
                status: 'ativa',
                updatedAt: new Date().toISOString()
            })
            .then(() => {
                alert('✅ Oficina desbloqueada');
                loadOficinas();
            })
            .catch(error => {
                console.error('❌ Erro:', error);
                alert('❌ Erro ao desbloquear');
            });
        }
    };

    window.excluirOficina = function(oficinaId) {
        if (confirm('⚠️ Excluir esta oficina?')) {
            db.collection('oficinas').doc(oficinaId).delete()
                .then(() => {
                    alert('✅ Oficina excluída');
                    loadOficinas();
                })
                .catch(error => {
                    console.error('❌ Erro:', error);
                    alert('❌ Erro ao excluir');
                });
        }
    };

    window.criarOficinaTeste = async function() {
        const oficinaTeste = {
            nome: 'Oficina Teste',
            emailDono: 'teste@oficina.com',
            telefone: '(51) 99999-8888',
            plano: 'basico',
            status: 'ativa',
            createdAt: new Date().toISOString()
        };
        
        try {
            await db.collection('oficinas').add(oficinaTeste);
            alert('✅ Oficina de teste criada!');
            loadOficinas();
        } catch (error) {
            alert('❌ Erro: ' + error.message);
        }
    };

    // Adicionar CSS para os badges
    const style = document.createElement('style');
    style.textContent = `
        .badge-basico { background-color: #c62828; color: white; }
        .badge-intermediario { background-color: #424242; color: white; }
        .badge-completo { background-color: #212121; color: white; }
        .badge { padding: 4px 8px; font-size: 0.75rem; font-weight: 600; }
        
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            font-size: 0.75rem;
            font-weight: 500;
            border: 1px solid #e0e0e0;
        }
        .status-ativa { background-color: #e8f5e9; color: #1b5e20; border-color: #a5d6a7; }
        .status-bloqueada { background-color: #ffebee; color: #c62828; border-color: #ef9a9a; }
        .status-inativa { background-color: #eeeeee; color: #616161; border-color: #bdbdbd; }
    `;
    document.head.appendChild(style);
});