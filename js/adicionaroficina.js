// adicionaroficina.js
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    auth.onAuthStateChanged(function(user) {
        if (user) {
            loadUserInfo(user);
            loadOficinas();
            loadEstatisticas();
        } else {
            window.location.href = 'login.html';
        }
    });

    // Elementos do DOM
    const oficinasBody = document.getElementById('oficinas-body');
    const oficinasLoader = document.getElementById('oficinas-loader');
    const oficinaModal = document.getElementById('oficina-modal');
    const detalhesModal = document.getElementById('oficina-detalhes-modal');
    const modalTitle = document.getElementById('modal-title');
    const formOficina = document.getElementById('form-oficina');
    const btnSalvar = document.getElementById('btn-salvar-oficina');
    
    let oficinaAtualId = null;
    let todasOficinas = [];
    let oficinasFiltradas = [];
    let paginaAtual = 1;
    const itensPorPagina = 10;

    // Configurar informações do usuário
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

    // Carregar estatísticas
    function loadEstatisticas() {
        db.collection('oficinas').get()
            .then((snapshot) => {
                const total = snapshot.size;
                let ativas = 0;
                const cidades = new Set();

                snapshot.forEach(doc => {
                    const oficina = doc.data();
                    if (oficina.status === 'ativa') ativas++;
                    if (oficina.cidade) cidades.add(oficina.cidade.trim().toLowerCase());
                });

                document.getElementById('total-oficinas').textContent = total;
                document.getElementById('oficinas-ativas').textContent = ativas;
                document.getElementById('cidades-atuacao').textContent = cidades.size;
            })
            .catch(error => console.error('Erro ao carregar estatísticas:', error));
    }

    // Carregar oficinas
    function loadOficinas() {
        oficinasLoader.style.display = 'block';
        oficinasBody.innerHTML = '';

        db.collection('oficinas').orderBy('nome').get()
            .then((snapshot) => {
                oficinasLoader.style.display = 'none';
                
                if (snapshot.empty) {
                    oficinasBody.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center">Nenhuma oficina cadastrada.</td>
                        </tr>
                    `;
                    return;
                }

                todasOficinas = [];
                snapshot.forEach((doc) => {
                    todasOficinas.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                oficinasFiltradas = [...todasOficinas];
                renderizarTabela();
            })
            .catch((error) => {
                console.error('Erro ao carregar oficinas:', error);
                oficinasLoader.style.display = 'none';
                oficinasBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">Erro ao carregar oficinas.</td>
                    </tr>
                `;
            });
    }

    // Renderizar tabela com paginação
    function renderizarTabela() {
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const oficinasPagina = oficinasFiltradas.slice(inicio, fim);

        oficinasBody.innerHTML = '';

        if (oficinasPagina.length === 0) {
            oficinasBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Nenhuma oficina encontrada.</td>
                </tr>
            `;
        } else {
            oficinasPagina.forEach(oficina => {
                const row = document.createElement('tr');
                const especialidades = oficina.especialidades ? 
                    (Array.isArray(oficina.especialidades) ? oficina.especialidades.slice(0, 2).join(', ') : oficina.especialidades) : 
                    'Não informado';
                
                row.innerHTML = `
                    <td><strong>${oficina.nome || ''}</strong></td>
                    <td>${formatarCNPJ(oficina.cnpj) || '-'}</td>
                    <td>${formatarTelefone(oficina.telefone1) || '-'}</td>
                    <td>${oficina.cidade || ''}${oficina.uf ? '/' + oficina.uf : ''}</td>
                    <td>${especialidades}${oficina.especialidades && oficina.especialidades.length > 2 ? '...' : ''}</td>
                    <td><span class="status-badge status-${oficina.status || 'inativa'}">${oficina.status || 'Inativa'}</span></td>
                    <td class="actions">
                        <button class="btn btn-sm btn-info" onclick="verDetalhes('${oficina.id}')">Ver</button>
                        <button class="btn btn-sm btn-primary" onclick="editarOficina('${oficina.id}')">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="excluirOficina('${oficina.id}')">Excluir</button>
                    </td>
                `;
                oficinasBody.appendChild(row);
            });
        }

        // Atualizar paginação
        const totalPaginas = Math.ceil(oficinasFiltradas.length / itensPorPagina);
        document.getElementById('page-info').textContent = `Página ${paginaAtual} de ${totalPaginas || 1}`;
        document.getElementById('prev-page').disabled = paginaAtual === 1;
        document.getElementById('next-page').disabled = paginaAtual === totalPaginas || totalPaginas === 0;
    }

    // Configurar abas do formulário
    document.querySelectorAll('.form-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.form-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.form-tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-form-tab');
            document.getElementById(`form-tab-${tabId}`).classList.add('active');
        });
    });

    // Configurar abas principais
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    // Buscar CEP
    document.getElementById('btn-buscar-cep').addEventListener('click', function() {
        const cep = document.getElementById('oficina-cep').value.replace(/\D/g, '');
        if (cep.length === 8) {
            fetch(`https://viacep.com.br/ws/${cep}/json/`)
                .then(response => response.json())
                .then(data => {
                    if (!data.erro) {
                        document.getElementById('oficina-endereco').value = data.logradouro;
                        document.getElementById('oficina-bairro').value = data.bairro;
                        document.getElementById('oficina-cidade').value = data.localidade;
                        document.getElementById('oficina-uf').value = data.uf;
                    } else {
                        alert('CEP não encontrado');
                    }
                })
                .catch(error => {
                    console.error('Erro ao buscar CEP:', error);
                    alert('Erro ao buscar CEP');
                });
        } else {
            alert('CEP inválido');
        }
    });

    // Nova oficina
    document.getElementById('btn-nova-oficina').addEventListener('click', function() {
        oficinaAtualId = null;
        modalTitle.textContent = 'Nova Oficina';
        btnSalvar.textContent = 'Salvar Oficina';
        
        // Resetar abas do formulário
        document.querySelectorAll('.form-tab-btn')[0].click();
        
        // Limpar formulário
        formOficina.reset();
        document.getElementById('oficina-status').value = 'ativa';
        
        // Mostrar modal
        oficinaModal.classList.add('active');
    });

    // Fechar modais
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            oficinaModal.classList.remove('active');
            detalhesModal.classList.remove('active');
        });
    });

    // Fechar modal ao clicar fora
    oficinaModal.addEventListener('click', function(e) {
        if (e.target === oficinaModal) {
            oficinaModal.classList.remove('active');
        }
    });

    detalhesModal.addEventListener('click', function(e) {
        if (e.target === detalhesModal) {
            detalhesModal.classList.remove('active');
        }
    });

    // Salvar oficina
    formOficina.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Coletar especialidades selecionadas
        const especialidades = [];
        document.querySelectorAll('#form-tab-servicos input[type="checkbox"]:checked').forEach(cb => {
            especialidades.push(cb.value);
        });

        const oficinaData = {
            nome: document.getElementById('oficina-nome').value,
            status: document.getElementById('oficina-status').value,
            cnpj: document.getElementById('oficina-cnpj').value,
            ie: document.getElementById('oficina-ie').value,
            razaoSocial: document.getElementById('oficina-razao-social').value,
            cep: document.getElementById('oficina-cep').value,
            endereco: document.getElementById('oficina-endereco').value,
            numero: document.getElementById('oficina-numero').value,
            complemento: document.getElementById('oficina-complemento').value,
            bairro: document.getElementById('oficina-bairro').value,
            cidade: document.getElementById('oficina-cidade').value,
            uf: document.getElementById('oficina-uf').value,
            pais: document.getElementById('oficina-pais').value,
            especialidades: especialidades,
            descricao: document.getElementById('oficina-descricao').value,
            horario: document.getElementById('oficina-horario').value,
            telefone1: document.getElementById('oficina-telefone1').value,
            telefone2: document.getElementById('oficina-telefone2').value,
            email: document.getElementById('oficina-email').value,
            site: document.getElementById('oficina-site').value,
            whatsapp: document.getElementById('oficina-whatsapp').value,
            redesSociais: document.getElementById('oficina-redes').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Desabilitar botão
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';

        if (oficinaAtualId) {
            // Atualizar
            db.collection('oficinas').doc(oficinaAtualId).update(oficinaData)
                .then(() => {
                    alert('Oficina atualizada com sucesso!');
                    oficinaModal.classList.remove('active');
                    loadOficinas();
                    loadEstatisticas();
                })
                .catch((error) => {
                    console.error('Erro ao atualizar oficina:', error);
                    alert('Erro ao atualizar oficina. Tente novamente.');
                })
                .finally(() => {
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = 'Atualizar Oficina';
                });
        } else {
            // Adicionar
            oficinaData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            
            db.collection('oficinas').add(oficinaData)
                .then(() => {
                    alert('Oficina salva com sucesso!');
                    oficinaModal.classList.remove('active');
                    loadOficinas();
                    loadEstatisticas();
                })
                .catch((error) => {
                    console.error('Erro ao salvar oficina:', error);
                    alert('Erro ao salvar oficina. Tente novamente.');
                })
                .finally(() => {
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = 'Salvar Oficina';
                });
        }
    });

    // Filtros e busca
    document.getElementById('btn-search').addEventListener('click', aplicarFiltros);
    document.getElementById('search-oficina').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') aplicarFiltros();
    });
    document.getElementById('filter-status').addEventListener('change', aplicarFiltros);
    document.getElementById('filter-especialidade').addEventListener('change', aplicarFiltros);

    function aplicarFiltros() {
        const termoBusca = document.getElementById('search-oficina').value.toLowerCase();
        const statusFiltro = document.getElementById('filter-status').value;
        const especialidadeFiltro = document.getElementById('filter-especialidade').value;

        oficinasFiltradas = todasOficinas.filter(oficina => {
            // Filtro por busca
            const matchBusca = !termoBusca || 
                (oficina.nome && oficina.nome.toLowerCase().includes(termoBusca)) ||
                (oficina.cidade && oficina.cidade.toLowerCase().includes(termoBusca));
            
            // Filtro por status
            const matchStatus = !statusFiltro || oficina.status === statusFiltro;
            
            // Filtro por especialidade
            const matchEspecialidade = !especialidadeFiltro || 
                (oficina.especialidades && oficina.especialidades.includes(especialidadeFiltro));
            
            return matchBusca && matchStatus && matchEspecialidade;
        });

        paginaAtual = 1;
        renderizarTabela();
    }

    // Paginação
    document.getElementById('prev-page').addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarTabela();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        const totalPaginas = Math.ceil(oficinasFiltradas.length / itensPorPagina);
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderizarTabela();
        }
    });

    // Funções globais para os botões
    window.verDetalhes = function(oficinaId) {
        db.collection('oficinas').doc(oficinaId).get()
            .then((doc) => {
                if (!doc.exists) {
                    alert('Oficina não encontrada.');
                    return;
                }

                const oficina = doc.data();
                const content = document.getElementById('oficina-detalhes-content');
                
                content.innerHTML = `
                    <div class="detalhes-oficina">
                        <div class="detalhes-header">
                            <h3>${oficina.nome || 'Sem nome'}</h3>
                            <span class="status-badge status-${oficina.status || 'inativa'}">${oficina.status || 'Inativa'}</span>
                        </div>
                        
                        <div class="detalhes-grid">
                            <div class="detalhes-section">
                                <h4>Informações Básicas</h4>
                                <p><strong>CNPJ:</strong> ${formatarCNPJ(oficina.cnpj) || '-'}</p>
                                <p><strong>Razão Social:</strong> ${oficina.razaoSocial || '-'}</p>
                                <p><strong>Insc. Estadual:</strong> ${oficina.ie || '-'}</p>
                            </div>
                            
                            <div class="detalhes-section">
                                <h4>Endereço</h4>
                                <p>${oficina.endereco || ''}, ${oficina.numero || ''} ${oficina.complemento || ''}</p>
                                <p>${oficina.bairro || ''} - ${oficina.cidade || ''}/${oficina.uf || ''}</p>
                                <p>CEP: ${formatarCEP(oficina.cep) || '-'}</p>
                            </div>
                            
                            <div class="detalhes-section">
                                <h4>Contato</h4>
                                <p><strong>Tel:</strong> ${formatarTelefone(oficina.telefone1) || '-'}</p>
                                <p><strong>Tel2:</strong> ${formatarTelefone(oficina.telefone2) || '-'}</p>
                                <p><strong>WhatsApp:</strong> ${formatarTelefone(oficina.whatsapp) || '-'}</p>
                                <p><strong>Email:</strong> ${oficina.email || '-'}</p>
                                <p><strong>Site:</strong> ${oficina.site ? `<a href="${oficina.site}" target="_blank">${oficina.site}</a>` : '-'}</p>
                            </div>
                            
                            <div class="detalhes-section">
                                <h4>Serviços</h4>
                                <p><strong>Especialidades:</strong> ${oficina.especialidades ? oficina.especialidades.join(', ') : '-'}</p>
                                <p><strong>Horário:</strong> ${oficina.horario || '-'}</p>
                                <p><strong>Descrição:</strong> ${oficina.descricao || '-'}</p>
                            </div>
                        </div>
                    </div>
                `;
                
                document.getElementById('detalhes-modal-title').textContent = 'Detalhes da Oficina';
                detalhesModal.classList.add('active');
            })
            .catch((error) => {
                console.error('Erro ao carregar oficina:', error);
                alert('Erro ao carregar dados da oficina.');
            });
    };

    window.editarOficina = function(oficinaId) {
        db.collection('oficinas').doc(oficinaId).get()
            .then((doc) => {
                if (!doc.exists) {
                    alert('Oficina não encontrada.');
                    return;
                }

                const oficina = doc.data();
                oficinaAtualId = oficinaId;
                modalTitle.textContent = 'Editar Oficina';
                btnSalvar.textContent = 'Atualizar Oficina';

                // Preencher formulário
                document.getElementById('oficina-nome').value = oficina.nome || '';
                document.getElementById('oficina-status').value = oficina.status || 'ativa';
                document.getElementById('oficina-cnpj').value = oficina.cnpj || '';
                document.getElementById('oficina-ie').value = oficina.ie || '';
                document.getElementById('oficina-razao-social').value = oficina.razaoSocial || '';
                document.getElementById('oficina-cep').value = oficina.cep || '';
                document.getElementById('oficina-endereco').value = oficina.endereco || '';
                document.getElementById('oficina-numero').value = oficina.numero || '';
                document.getElementById('oficina-complemento').value = oficina.complemento || '';
                document.getElementById('oficina-bairro').value = oficina.bairro || '';
                document.getElementById('oficina-cidade').value = oficina.cidade || '';
                document.getElementById('oficina-uf').value = oficina.uf || '';
                document.getElementById('oficina-descricao').value = oficina.descricao || '';
                document.getElementById('oficina-horario').value = oficina.horario || '';
                document.getElementById('oficina-telefone1').value = oficina.telefone1 || '';
                document.getElementById('oficina-telefone2').value = oficina.telefone2 || '';
                document.getElementById('oficina-email').value = oficina.email || '';
                document.getElementById('oficina-site').value = oficina.site || '';
                document.getElementById('oficina-whatsapp').value = oficina.whatsapp || '';
                document.getElementById('oficina-redes').value = oficina.redesSociais || '';

                // Especialidades
                document.querySelectorAll('#form-tab-servicos input[type="checkbox"]').forEach(cb => {
                    cb.checked = oficina.especialidades && oficina.especialidades.includes(cb.value);
                });

                // Mostrar primeira aba
                document.querySelectorAll('.form-tab-btn')[0].click();
                
                // Mostrar modal
                oficinaModal.classList.add('active');
            })
            .catch((error) => {
                console.error('Erro ao carregar oficina:', error);
                alert('Erro ao carregar dados da oficina.');
            });
    };

    window.excluirOficina = function(oficinaId) {
        if (confirm('Tem certeza que deseja excluir esta oficina?')) {
            db.collection('oficinas').doc(oficinaId).delete()
                .then(() => {
                    alert('Oficina excluída com sucesso!');
                    loadOficinas();
                    loadEstatisticas();
                })
                .catch((error) => {
                    console.error('Erro ao excluir oficina:', error);
                    alert('Erro ao excluir oficina. Tente novamente.');
                });
        }
    };

    // Funções auxiliares de formatação
    function formatarCNPJ(cnpj) {
        if (!cnpj) return '';
        const numeros = cnpj.replace(/\D/g, '');
        return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }

    function formatarTelefone(telefone) {
        if (!telefone) return '';
        const numeros = telefone.replace(/\D/g, '');
        if (numeros.length === 10) {
            return numeros.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
        } else if (numeros.length === 11) {
            return numeros.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        }
        return telefone;
    }

    function formatarCEP(cep) {
        if (!cep) return '';
        const numeros = cep.replace(/\D/g, '');
        return numeros.replace(/^(\d{5})(\d{3})$/, '$1-$2');
    }

    // Aplicar máscaras com jQuery (opcional)
    if (typeof $ !== 'undefined') {
        $('#oficina-cnpj').mask('00.000.000/0000-00');
        $('#oficina-cep').mask('00000-000');
        $('#oficina-telefone1, #oficina-telefone2, #oficina-whatsapp').mask('(00) 00000-0000');
    }
});