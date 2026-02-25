// Módulo de gerenciamento de clientes - VERSÃO CORRIGIDA

function loadClientesModule() {
    const user = auth.currentUser;
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    if (!user || !oficinaId) {
        window.location.href = 'login.html';
        return;
    }
    
    dashboardContent.innerHTML = `
        <div class="dashboard-section">
            <div class="section-header">
                <h2>Gerenciamento de Clientes</h2>
                <button id="btn-novo-cliente" class="btn btn-success">+ Novo Cliente</button>
            </div>
            
            <div class="table-container">
                <div class="table-responsive">
                    <table class="data-table" id="clientes-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Telefone</th>
                                <th>E-mail</th>
                                <th>CPF</th>
                                <th>Endereço</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="clientes-body">
                            <!-- Dados serão carregados aqui -->
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="loader" id="clientes-loader"></div>
        </div>
    `;
    
    // Carregar clientes
    loadClientes();
    
    // Adicionar evento ao botão de novo cliente
    document.getElementById('btn-novo-cliente').addEventListener('click', showNovoClienteForm);
}

// ===========================================
// FUNÇÃO CORRIGIDA - CARREGAR CLIENTES
// ===========================================
function loadClientes() {
    const loader = document.getElementById('clientes-loader');
    const clientesBody = document.getElementById('clientes-body');
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    if (!oficinaId) {
        console.error('ID da oficina não encontrado');
        return;
    }
    
    loader.style.display = 'block';
    clientesBody.innerHTML = '';
    
    // CORREÇÃO: Buscar da subcoleção da oficina
    db.collection('oficinas').doc(oficinaId).collection('clientes').orderBy('nome').get()
        .then((snapshot) => {
            loader.style.display = 'none';
            
            if (snapshot.empty) {
                clientesBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">Nenhum cliente cadastrado nesta oficina.</td>
                    </tr>
                `;
                return;
            }
            
            snapshot.forEach((doc) => {
                const cliente = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${cliente.nome || ''}</td>
                    <td>${cliente.telefone || ''}</td>
                    <td>${cliente.email || ''}</td>
                    <td>${cliente.cpf || ''}</td>
                    <td>${cliente.endereco || ''}</td>
                    <td class="actions">
                        <button class="btn btn-sm btn-primary" onclick="editarCliente('${doc.id}')">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="excluirCliente('${doc.id}')">Excluir</button>
                    </td>
                `;
                clientesBody.appendChild(row);
            });
        })
        .catch((error) => {
            console.error('Erro ao carregar clientes:', error);
            loader.style.display = 'none';
            clientesBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">Erro ao carregar clientes: ${error.message}</td>
                </tr>
            `;
        });
}

// ===========================================
// FUNÇÃO CORRIGIDA - MOSTRAR FORMULÁRIO
// ===========================================
function showNovoClienteForm() {
    const modal = criarModal();
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Novo Cliente</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="form-cliente">
                    <div class="form-group">
                        <label for="cliente-nome">Nome Completo *</label>
                        <input type="text" id="cliente-nome" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="cliente-cpf">CPF</label>
                        <input type="text" id="cliente-cpf" placeholder="000.000.000-00">
                    </div>
                    
                    <div class="form-group">
                        <label for="cliente-telefone">Telefone *</label>
                        <input type="tel" id="cliente-telefone" required placeholder="(11) 99999-9999">
                    </div>
                    
                    <div class="form-group">
                        <label for="cliente-email">E-mail</label>
                        <input type="email" id="cliente-email">
                    </div>
                    
                    <div class="form-group">
                        <label for="cliente-endereco">Endereço</label>
                        <textarea id="cliente-endereco" rows="3"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="cliente-observacoes">Observações</label>
                        <textarea id="cliente-observacoes" rows="3"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Salvar Cliente</button>
                        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Configurar evento de fechamento
    modal.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });
    
    // Configurar envio do formulário
    const form = document.getElementById('form-cliente');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        salvarCliente(modal);
    });
}

// ===========================================
// FUNÇÃO CORRIGIDA - SALVAR CLIENTE
// ===========================================
function salvarCliente(modal) {
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    if (!oficinaId) {
        alert('Erro: ID da oficina não encontrado');
        return;
    }
    
    const clienteData = {
        nome: document.getElementById('cliente-nome').value,
        cpf: document.getElementById('cliente-cpf').value,
        telefone: document.getElementById('cliente-telefone').value,
        email: document.getElementById('cliente-email').value,
        endereco: document.getElementById('cliente-endereco').value,
        observacoes: document.getElementById('cliente-observacoes').value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Verificar limite antes de salvar
    verificarLimiteClientes(oficinaId).then((limite) => {
        if (!limite.permitido) {
            alert(limite.mensagem);
            return;
        }
        
        // CORREÇÃO: Salvar na subcoleção da oficina
        db.collection('oficinas').doc(oficinaId).collection('clientes').add(clienteData)
            .then(() => {
                alert('Cliente salvo com sucesso!');
                modal.remove();
                loadClientes();
            })
            .catch((error) => {
                console.error('Erro ao salvar cliente:', error);
                alert('Erro ao salvar cliente. Tente novamente.');
            });
    });
}

// ===========================================
// FUNÇÃO CORRIGIDA - EDITAR CLIENTE
// ===========================================
function editarCliente(clienteId) {
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    if (!oficinaId) {
        alert('Erro: ID da oficina não encontrado');
        return;
    }
    
    // CORREÇÃO: Buscar da subcoleção da oficina
    db.collection('oficinas').doc(oficinaId).collection('clientes').doc(clienteId).get()
        .then((doc) => {
            if (!doc.exists) {
                alert('Cliente não encontrado.');
                return;
            }
            
            const cliente = doc.data();
            const modal = criarModal();
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Editar Cliente</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="form-cliente">
                            <div class="form-group">
                                <label for="cliente-nome">Nome Completo *</label>
                                <input type="text" id="cliente-nome" value="${cliente.nome || ''}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="cliente-cpf">CPF</label>
                                <input type="text" id="cliente-cpf" value="${cliente.cpf || ''}" placeholder="000.000.000-00">
                            </div>
                            
                            <div class="form-group">
                                <label for="cliente-telefone">Telefone *</label>
                                <input type="tel" id="cliente-telefone" value="${cliente.telefone || ''}" required placeholder="(11) 99999-9999">
                            </div>
                            
                            <div class="form-group">
                                <label for="cliente-email">E-mail</label>
                                <input type="email" id="cliente-email" value="${cliente.email || ''}">
                            </div>
                            
                            <div class="form-group">
                                <label for="cliente-endereco">Endereço</label>
                                <textarea id="cliente-endereco" rows="3">${cliente.endereco || ''}</textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="cliente-observacoes">Observações</label>
                                <textarea id="cliente-observacoes" rows="3">${cliente.observacoes || ''}</textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Atualizar Cliente</button>
                                <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            // Configurar evento de fechamento
            modal.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', () => modal.remove());
            });
            
            // Configurar envio do formulário
            const form = document.getElementById('form-cliente');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                atualizarCliente(clienteId, modal);
            });
        })
        .catch((error) => {
            console.error('Erro ao carregar cliente:', error);
            alert('Erro ao carregar dados do cliente.');
        });
}

// ===========================================
// FUNÇÃO CORRIGIDA - ATUALIZAR CLIENTE
// ===========================================
function atualizarCliente(clienteId, modal) {
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    if (!oficinaId) {
        alert('Erro: ID da oficina não encontrado');
        return;
    }
    
    const clienteData = {
        nome: document.getElementById('cliente-nome').value,
        cpf: document.getElementById('cliente-cpf').value,
        telefone: document.getElementById('cliente-telefone').value,
        email: document.getElementById('cliente-email').value,
        endereco: document.getElementById('cliente-endereco').value,
        observacoes: document.getElementById('cliente-observacoes').value,
        updatedAt: new Date().toISOString()
    };
    
    // CORREÇÃO: Atualizar na subcoleção da oficina
    db.collection('oficinas').doc(oficinaId).collection('clientes').doc(clienteId).update(clienteData)
        .then(() => {
            alert('Cliente atualizado com sucesso!');
            modal.remove();
            loadClientes();
        })
        .catch((error) => {
            console.error('Erro ao atualizar cliente:', error);
            alert('Erro ao atualizar cliente. Tente novamente.');
        });
}

// ===========================================
// FUNÇÃO CORRIGIDA - EXCLUIR CLIENTE
// ===========================================
function excluirCliente(clienteId) {
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    if (!oficinaId) {
        alert('Erro: ID da oficina não encontrado');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        // CORREÇÃO: Excluir da subcoleção da oficina
        db.collection('oficinas').doc(oficinaId).collection('clientes').doc(clienteId).delete()
            .then(() => {
                alert('Cliente excluído com sucesso!');
                loadClientes();
            })
            .catch((error) => {
                console.error('Erro ao excluir cliente:', error);
                alert('Erro ao excluir cliente. Tente novamente.');
            });
    }
}

// ===========================================
// FUNÇÃO PARA VERIFICAR LIMITE DE CLIENTES
// ===========================================
async function verificarLimiteClientes(oficinaId) {
    try {
        const oficinaDoc = await db.collection('oficinas').doc(oficinaId).get();
        const oficina = oficinaDoc.data();
        const plano = oficina.plano || 'basico';
        
        // Plano intermediário tem limite de 100 clientes
        if (plano === 'intermediario') {
            const clientesSnap = await db.collection('oficinas').doc(oficinaId).collection('clientes').get();
            const totalClientes = clientesSnap.size;
            
            if (totalClientes >= 100) {
                return {
                    permitido: false,
                    mensagem: 'Limite de 100 clientes atingido. Faça upgrade para o plano Completo!'
                };
            }
        }
        
        return { permitido: true };
        
    } catch (error) {
        console.error('Erro ao verificar limite:', error);
        return { permitido: true };
    }
}

// Criar modal (mantém igual)
function criarModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    document.body.appendChild(modal);
    return modal;
}