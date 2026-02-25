// Módulo de gerenciamento de veículos - VERSÃO CORRIGIDA

function loadVeiculosModule() {
    const user = auth.currentUser;
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    if (!user || !oficinaId) {
        window.location.href = 'login.html';
        return;
    }
    
    dashboardContent.innerHTML = `
        <div class="dashboard-section">
            <div class="section-header">
                <h2>Gerenciamento de Veículos</h2>
                <button id="btn-novo-veiculo" class="btn btn-success">+ Novo Veículo</button>
            </div>
            
            <div class="table-container">
                <div class="table-responsive">
                    <table class="data-table" id="veiculos-table">
                        <thead>
                            <tr>
                                <th>Placa</th>
                                <th>Marca/Modelo</th>
                                <th>Ano</th>
                                <th>Cor</th>
                                <th>Cliente</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="veiculos-body">
                            <tr><td colspan="7" class="text-center">Carregando...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="loader" id="veiculos-loader" style="display: none;"></div>
        </div>
    `;
    
    // Carregar veículos
    loadVeiculos();
    
    // Adicionar evento ao botão de novo veículo
    document.getElementById('btn-novo-veiculo').addEventListener('click', showNovoVeiculoForm);
}

// ===========================================
// VARIÁVEL DE CONTROLE PARA EVITAR LOOP
// ===========================================
let carregandoVeiculos = false;

// ===========================================
// FUNÇÃO CORRIGIDA - CARREGAR VEÍCULOS
// ===========================================
function loadVeiculos() {
    if (carregandoVeiculos) return;
    
    const loader = document.getElementById('veiculos-loader');
    const veiculosBody = document.getElementById('veiculos-body');
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    if (!oficinaId) {
        console.error('ID da oficina não encontrado');
        return;
    }
    
    carregandoVeiculos = true;
    
    if (loader) loader.style.display = 'block';
    if (veiculosBody) veiculosBody.innerHTML = '<tr><td colspan="7" class="text-center">Carregando...</td></tr>';
    
    // Buscar veículos da oficina
    db.collection('oficinas').doc(oficinaId).collection('veiculos').orderBy('placa').get()
        .then((veiculosSnapshot) => {
            carregandoVeiculos = false;
            if (loader) loader.style.display = 'none';
            
            if (!veiculosBody) return;
            
            if (veiculosSnapshot.empty) {
                veiculosBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">
                            Nenhum veículo cadastrado.<br>
                            <button onclick="showNovoVeiculoForm()" class="btn btn-sm btn-primary" style="margin-top: 10px;">
                                + Cadastrar Primeiro Veículo
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Buscar clientes para mostrar o nome
            db.collection('oficinas').doc(oficinaId).collection('clientes').get()
                .then((clientesSnapshot) => {
                    const clientesMap = {};
                    clientesSnapshot.forEach(doc => {
                        clientesMap[doc.id] = doc.data().nome;
                    });
                    
                    veiculosBody.innerHTML = '';
                    
                    veiculosSnapshot.forEach((doc) => {
                        const veiculo = doc.data();
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td><strong>${veiculo.placa || ''}</strong></td>
                            <td>${veiculo.marca || ''} ${veiculo.modelo || ''}</td>
                            <td>${veiculo.ano || ''}</td>
                            <td>${veiculo.cor || ''}</td>
                            <td>${clientesMap[veiculo.clienteId] || 'Não informado'}</td>
                            <td><span class="status-badge status-${veiculo.status || 'pendente'}">${getStatusText(veiculo.status)}</span></td>
                            <td class="actions">
                                <button class="btn btn-sm btn-primary" onclick="editarVeiculo('${doc.id}')">Editar</button>
                                <button class="btn btn-sm btn-danger" onclick="excluirVeiculo('${doc.id}')">Excluir</button>
                            </td>
                        `;
                        veiculosBody.appendChild(row);
                    });
                });
        })
        .catch((error) => {
            carregandoVeiculos = false;
            console.error('Erro ao carregar veículos:', error);
            if (loader) loader.style.display = 'none';
            if (veiculosBody) {
                veiculosBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">Erro ao carregar veículos.</td>
                    </tr>
                `;
            }
        });
}

// ===========================================
// OBTER TEXTO DO STATUS
// ===========================================
function getStatusText(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'andamento': 'Em Andamento',
        'concluido': 'Concluído',
        'entregue': 'Entregue'
    };
    return statusMap[status] || 'Pendente';
}

// ===========================================
// FUNÇÃO CORRIGIDA - MOSTRAR FORMULÁRIO
// ===========================================
function showNovoVeiculoForm() {
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    // Carregar clientes da oficina para select
    db.collection('oficinas').doc(oficinaId).collection('clientes').orderBy('nome').get()
        .then((clientesSnapshot) => {
            let clientesOptions = '<option value="">Selecione um cliente</option>';
            clientesSnapshot.forEach((doc) => {
                const cliente = doc.data();
                clientesOptions += `<option value="${doc.id}">${cliente.nome}</option>`;
            });
            
            const modal = criarModal();
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Novo Veículo</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="form-veiculo">
                            <div class="form-group">
                                <label for="veiculo-placa">Placa *</label>
                                <input type="text" id="veiculo-placa" required placeholder="ABC-1234" style="text-transform: uppercase;">
                            </div>
                            
                            <div class="form-group">
                                <label for="veiculo-marca">Marca *</label>
                                <input type="text" id="veiculo-marca" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="veiculo-modelo">Modelo *</label>
                                <input type="text" id="veiculo-modelo" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="veiculo-ano">Ano</label>
                                <input type="number" id="veiculo-ano" min="1900" max="2026">
                            </div>
                            
                            <div class="form-group">
                                <label for="veiculo-cor">Cor</label>
                                <input type="text" id="veiculo-cor">
                            </div>
                            
                            <div class="form-group">
                                <label for="veiculo-cliente">Cliente *</label>
                                <select id="veiculo-cliente" required>
                                    ${clientesOptions}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="veiculo-status">Status</label>
                                <select id="veiculo-status">
                                    <option value="pendente">Pendente</option>
                                    <option value="andamento">Em Andamento</option>
                                    <option value="concluido">Concluído</option>
                                    <option value="entregue">Entregue</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="veiculo-problema">Problema/Descrição</label>
                                <textarea id="veiculo-problema" rows="4"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="veiculo-observacoes">Observações</label>
                                <textarea id="veiculo-observacoes" rows="3"></textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Salvar Veículo</button>
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
            const form = document.getElementById('form-veiculo');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                salvarVeiculo(modal);
            });
        })
        .catch((error) => {
            console.error('Erro ao carregar clientes:', error);
            alert('Erro ao carregar lista de clientes.');
        });
}

// ===========================================
// FUNÇÃO CORRIGIDA - SALVAR VEÍCULO
// ===========================================
function salvarVeiculo(modal) {
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    const veiculoData = {
        placa: document.getElementById('veiculo-placa').value.toUpperCase(),
        marca: document.getElementById('veiculo-marca').value,
        modelo: document.getElementById('veiculo-modelo').value,
        ano: document.getElementById('veiculo-ano').value,
        cor: document.getElementById('veiculo-cor').value,
        clienteId: document.getElementById('veiculo-cliente').value,
        status: document.getElementById('veiculo-status').value,
        problema: document.getElementById('veiculo-problema').value,
        observacoes: document.getElementById('veiculo-observacoes').value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    const btnSalvar = document.getElementById('btn-salvar-veiculo');
    if (btnSalvar) {
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';
    }
    
    db.collection('oficinas').doc(oficinaId).collection('veiculos').add(veiculoData)
        .then(() => {
            alert('Veículo salvo com sucesso!');
            modal.remove();
            loadVeiculos();
        })
        .catch((error) => {
            console.error('Erro ao salvar veículo:', error);
            alert('Erro ao salvar veículo. Tente novamente.');
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.textContent = 'Salvar Veículo';
            }
        });
}

// ===========================================
// FUNÇÃO CORRIGIDA - EDITAR VEÍCULO
// ===========================================
window.editarVeiculo = function(veiculoId) {
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    Promise.all([
        db.collection('oficinas').doc(oficinaId).collection('veiculos').doc(veiculoId).get(),
        db.collection('oficinas').doc(oficinaId).collection('clientes').orderBy('nome').get()
    ])
    .then(([veiculoDoc, clientesSnapshot]) => {
        if (!veiculoDoc.exists) {
            alert('Veículo não encontrado.');
            return;
        }
        
        const veiculo = veiculoDoc.data();
        
        let clientesOptions = '<option value="">Selecione um cliente</option>';
        clientesSnapshot.forEach((doc) => {
            const cliente = doc.data();
            const selected = doc.id === veiculo.clienteId ? 'selected' : '';
            clientesOptions += `<option value="${doc.id}" ${selected}>${cliente.nome}</option>`;
        });
        
        const modal = criarModal();
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Editar Veículo</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-veiculo-edit">
                        <div class="form-group">
                            <label for="veiculo-placa">Placa *</label>
                            <input type="text" id="veiculo-placa" value="${veiculo.placa || ''}" required placeholder="ABC-1234" style="text-transform: uppercase;">
                        </div>
                        
                        <div class="form-group">
                            <label for="veiculo-marca">Marca *</label>
                            <input type="text" id="veiculo-marca" value="${veiculo.marca || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="veiculo-modelo">Modelo *</label>
                            <input type="text" id="veiculo-modelo" value="${veiculo.modelo || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="veiculo-ano">Ano</label>
                            <input type="number" id="veiculo-ano" value="${veiculo.ano || ''}" min="1900" max="2026">
                        </div>
                        
                        <div class="form-group">
                            <label for="veiculo-cor">Cor</label>
                            <input type="text" id="veiculo-cor" value="${veiculo.cor || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="veiculo-cliente">Cliente *</label>
                            <select id="veiculo-cliente" required>
                                ${clientesOptions}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="veiculo-status">Status</label>
                            <select id="veiculo-status">
                                <option value="pendente" ${veiculo.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                                <option value="andamento" ${veiculo.status === 'andamento' ? 'selected' : ''}>Em Andamento</option>
                                <option value="concluido" ${veiculo.status === 'concluido' ? 'selected' : ''}>Concluído</option>
                                <option value="entregue" ${veiculo.status === 'entregue' ? 'selected' : ''}>Entregue</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="veiculo-problema">Problema/Descrição</label>
                            <textarea id="veiculo-problema" rows="4">${veiculo.problema || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="veiculo-observacoes">Observações</label>
                            <textarea id="veiculo-observacoes" rows="3">${veiculo.observacoes || ''}</textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Atualizar Veículo</button>
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
        const form = document.getElementById('form-veiculo-edit');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            atualizarVeiculo(veiculoId, modal);
        });
    })
    .catch((error) => {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados do veículo.');
    });
};

// ===========================================
// FUNÇÃO CORRIGIDA - ATUALIZAR VEÍCULO
// ===========================================
function atualizarVeiculo(veiculoId, modal) {
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    const veiculoData = {
        placa: document.getElementById('veiculo-placa').value.toUpperCase(),
        marca: document.getElementById('veiculo-marca').value,
        modelo: document.getElementById('veiculo-modelo').value,
        ano: document.getElementById('veiculo-ano').value,
        cor: document.getElementById('veiculo-cor').value,
        clienteId: document.getElementById('veiculo-cliente').value,
        status: document.getElementById('veiculo-status').value,
        problema: document.getElementById('veiculo-problema').value,
        observacoes: document.getElementById('veiculo-observacoes').value,
        updatedAt: new Date().toISOString()
    };
    
    db.collection('oficinas').doc(oficinaId).collection('veiculos').doc(veiculoId).update(veiculoData)
        .then(() => {
            alert('Veículo atualizado com sucesso!');
            modal.remove();
            loadVeiculos();
        })
        .catch((error) => {
            console.error('Erro ao atualizar veículo:', error);
            alert('Erro ao atualizar veículo. Tente novamente.');
        });
}

// ===========================================
// FUNÇÃO CORRIGIDA - EXCLUIR VEÍCULO
// ===========================================
window.excluirVeiculo = function(veiculoId) {
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    if (!oficinaId) {
        alert('Erro: ID da oficina não encontrado');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir este veículo?')) {
        db.collection('oficinas').doc(oficinaId).collection('veiculos').doc(veiculoId).delete()
            .then(() => {
                alert('Veículo excluído com sucesso!');
                loadVeiculos();
            })
            .catch((error) => {
                console.error('Erro ao excluir veículo:', error);
                alert('Erro ao excluir veículo. Tente novamente.');
            });
    }
};

// ===========================================
// FUNÇÃO AUXILIAR - CRIAR MODAL
// ===========================================
function criarModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    document.body.appendChild(modal);
    return modal;
}