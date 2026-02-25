// Módulo de gerenciamento de orçamentos

function loadOrcamentosModule() {
    const user = auth.currentUser;
    if (!user) return;
    
    dashboardContent.innerHTML = `
        <div class="dashboard-section">
            <div class="section-header">
                <h2>Gerenciamento de Orçamentos</h2>
                <button id="btn-novo-orcamento" class="btn btn-success">+ Novo Orçamento</button>
            </div>
            
            <div class="table-container">
                <div class="table-responsive">
                    <table class="data-table" id="orcamentos-table">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Cliente</th>
                                <th>Veículo</th>
                                <th>Valor Total</th>
                                <th>Status</th>
                                <th>Data</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="orcamentos-body">
                            <!-- Dados serão carregados aqui -->
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="loader" id="orcamentos-loader"></div>
        </div>
    `;
    
    // Carregar orçamentos
    loadOrcamentos();
    
    // Adicionar evento ao botão de novo orçamento
    document.getElementById('btn-novo-orcamento').addEventListener('click', showNovoOrcamentoForm);
}

// Carregar lista de orçamentos
function loadOrcamentos() {
    const loader = document.getElementById('orcamentos-loader');
    const orcamentosBody = document.getElementById('orcamentos-body');
    
    loader.style.display = 'block';
    orcamentosBody.innerHTML = '';
    
    db.collection('orcamentos').orderBy('data', 'desc').get()
        .then((snapshot) => {
            loader.style.display = 'none';
            
            if (snapshot.empty) {
                orcamentosBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">Nenhum orçamento cadastrado.</td>
                    </tr>
                `;
                return;
            }
            
            // Carregar clientes e veículos para associação
            const clientesPromise = db.collection('clientes').get();
            const veiculosPromise = db.collection('veiculos').get();
            
            Promise.all([snapshot, clientesPromise, veiculosPromise])
                .then(([orcamentosSnapshot, clientesSnapshot, veiculosSnapshot]) => {
                    const clientesMap = {};
                    clientesSnapshot.forEach(doc => {
                        clientesMap[doc.id] = doc.data().nome;
                    });
                    
                    const veiculosMap = {};
                    veiculosSnapshot.forEach(doc => {
                        const veiculo = doc.data();
                        veiculosMap[doc.id] = `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}`;
                    });
                    
                    orcamentosSnapshot.forEach((doc) => {
                        const orcamento = doc.data();
                        const dataFormatada = orcamento.data ? orcamento.data.toDate().toLocaleDateString('pt-BR') : '';
                        
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${orcamento.numero || ''}</td>
                            <td>${clientesMap[orcamento.clienteId] || 'Não informado'}</td>
                            <td>${veiculosMap[orcamento.veiculoId] || 'Não informado'}</td>
                            <td>R$ ${parseFloat(orcamento.valorTotal || 0).toFixed(2)}</td>
                            <td><span class="status-badge status-${orcamento.status || 'pendente'}">${getStatusOrcamentoText(orcamento.status)}</span></td>
                            <td>${dataFormatada}</td>
                            <td class="actions">
                                <button class="btn btn-sm btn-primary" onclick="visualizarOrcamento('${doc.id}')">Ver</button>
                                <button class="btn btn-sm btn-success" onclick="gerarPDFOrcamento('${doc.id}')">PDF</button>
                                <button class="btn btn-sm btn-danger" onclick="excluirOrcamento('${doc.id}')">Excluir</button>
                            </td>
                        `;
                        orcamentosBody.appendChild(row);
                    });
                });
        })
        .catch((error) => {
            console.error('Erro ao carregar orçamentos:', error);
            loader.style.display = 'none';
            orcamentosBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Erro ao carregar orçamentos.</td>
                </tr>
            `;
        });
}

// Obter texto do status do orçamento
function getStatusOrcamentoText(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'aprovado': 'Aprovado',
        'recusado': 'Recusado',
        'pago': 'Pago'
    };
    return statusMap[status] || 'Pendente';
}

// Mostrar formulário de novo orçamento
function showNovoOrcamentoForm() {
    // Carregar clientes e veículos para selects
    Promise.all([
        db.collection('clientes').orderBy('nome').get(),
        db.collection('veiculos').orderBy('placa').get()
    ])
    .then(([clientesSnapshot, veiculosSnapshot]) => {
        let clientesOptions = '<option value="">Selecione um cliente</option>';
        clientesSnapshot.forEach((doc) => {
            const cliente = doc.data();
            clientesOptions += `<option value="${doc.id}">${cliente.nome}</option>`;
        });
        
        let veiculosOptions = '<option value="">Selecione um veículo</option>';
        veiculosSnapshot.forEach((doc) => {
            const veiculo = doc.data();
            veiculosOptions += `<option value="${doc.id}">${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}</option>`;
        });
        
        const modal = criarModal();
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <h2 class="modal-title">Novo Orçamento</h2>
                
                <form id="form-orcamento">
                    <div class="form-group">
                        <label for="orcamento-numero">Número do Orçamento</label>
                        <input type="text" id="orcamento-numero" placeholder="Gerado automaticamente" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label for="orcamento-cliente">Cliente *</label>
                        <select id="orcamento-cliente" required>
                            ${clientesOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="orcamento-veiculo">Veículo *</label>
                        <select id="orcamento-veiculo" required>
                            ${veiculosOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="orcamento-status">Status</label>
                        <select id="orcamento-status">
                            <option value="pendente">Pendente</option>
                            <option value="aprovado">Aprovado</option>
                            <option value="recusado">Recusado</option>
                            <option value="pago">Pago</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="orcamento-validade">Validade (dias)</label>
                        <input type="number" id="orcamento-validade" value="7" min="1">
                    </div>
                    
                    <div class="form-group">
                        <label for="orcamento-descricao">Descrição do Serviço</label>
                        <textarea id="orcamento-descricao" rows="4" placeholder="Descreva os serviços a serem realizados"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Itens do Orçamento</label>
                        <div id="orcamento-itens">
                            <div class="item-orcamento">
                                <input type="text" placeholder="Descrição do item" class="item-descricao">
                                <input type="number" placeholder="Quantidade" class="item-quantidade" min="1" value="1">
                                <input type="number" placeholder="Valor unitário" class="item-valor" step="0.01" min="0">
                                <button type="button" class="btn btn-sm btn-danger remover-item">×</button>
                            </div>
                        </div>
                        <button type="button" id="btn-add-item" class="btn btn-sm btn-secondary mt-10">+ Adicionar Item</button>
                    </div>
                    
                    <div class="form-group">
                        <label for="orcamento-observacoes">Observações</label>
                        <textarea id="orcamento-observacoes" rows="3"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Total: <span id="orcamento-total">R$ 0,00</span></label>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Salvar Orçamento</button>
                        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        
        // Gerar número automático para o orçamento
        gerarNumeroOrcamento();
        
        // Configurar evento de fechamento
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        // Configurar adição de itens
        document.getElementById('btn-add-item').addEventListener('click', adicionarItemOrcamento);
        
        // Configurar cálculo do total
        const itensContainer = document.getElementById('orcamento-itens');
        itensContainer.addEventListener('input', calcularTotalOrcamento);
        
        // Configurar remoção de itens
        itensContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover-item')) {
                if (itensContainer.children.length > 1) {
                    e.target.closest('.item-orcamento').remove();
                    calcularTotalOrcamento();
                }
            }
        });
        
        // Configurar envio do formulário
        const form = document.getElementById('form-orcamento');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            salvarOrcamento();
        });
    })
    .catch((error) => {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar lista de clientes/veículos.');
    });
}

// Gerar número automático para orçamento
function gerarNumeroOrcamento() {
    const ano = new Date().getFullYear();
    db.collection('orcamentos')
        .where('numero', '>=', `ORC-${ano}-0001`)
        .where('numero', '<=', `ORC-${ano}-9999`)
        .orderBy('numero', 'desc')
        .limit(1)
        .get()
        .then((snapshot) => {
            let proximoNumero = 1;
            
            if (!snapshot.empty) {
                const ultimoOrcamento = snapshot.docs[0].data();
                const ultimoNumero = ultimoOrcamento.numero;
                const partes = ultimoNumero.split('-');
                if (partes.length === 3 && partes[2]) {
                    proximoNumero = parseInt(partes[2]) + 1;
                }
            }
            
            const numeroFormatado = `ORC-${ano}-${proximoNumero.toString().padStart(4, '0')}`;
            document.getElementById('orcamento-numero').value = numeroFormatado;
        })
        .catch((error) => {
            console.error('Erro ao gerar número do orçamento:', error);
            document.getElementById('orcamento-numero').value = `ORC-${ano}-0001`;
        });
}

// Adicionar item ao orçamento
function adicionarItemOrcamento() {
    const itensContainer = document.getElementById('orcamento-itens');
    const novoItem = document.createElement('div');
    novoItem.className = 'item-orcamento';
    novoItem.innerHTML = `
        <input type="text" placeholder="Descrição do item" class="item-descricao">
        <input type="number" placeholder="Quantidade" class="item-quantidade" min="1" value="1">
        <input type="number" placeholder="Valor unitário" class="item-valor" step="0.01" min="0">
        <button type="button" class="btn btn-sm btn-danger remover-item">×</button>
    `;
    itensContainer.appendChild(novoItem);
}

// Calcular total do orçamento
function calcularTotalOrcamento() {
    const itens = document.querySelectorAll('.item-orcamento');
    let total = 0;
    
    itens.forEach(item => {
        const quantidade = parseFloat(item.querySelector('.item-quantidade').value) || 0;
        const valor = parseFloat(item.querySelector('.item-valor').value) || 0;
        total += quantidade * valor;
    });
    
    document.getElementById('orcamento-total').textContent = `R$ ${total.toFixed(2)}`;
}

// Salvar orçamento
function salvarOrcamento() {
    const itens = [];
    document.querySelectorAll('.item-orcamento').forEach(item => {
        const descricao = item.querySelector('.item-descricao').value;
        const quantidade = parseFloat(item.querySelector('.item-quantidade').value) || 0;
        const valor = parseFloat(item.querySelector('.item-valor').value) || 0;
        
        if (descricao && quantidade > 0 && valor > 0) {
            itens.push({
                descricao: descricao,
                quantidade: quantidade,
                valorUnitario: valor,
                total: quantidade * valor
            });
        }
    });
    
    const orcamentoData = {
        numero: document.getElementById('orcamento-numero').value,
        clienteId: document.getElementById('orcamento-cliente').value,
        veiculoId: document.getElementById('orcamento-veiculo').value,
        status: document.getElementById('orcamento-status').value,
        validade: parseInt(document.getElementById('orcamento-validade').value),
        descricao: document.getElementById('orcamento-descricao').value,
        itens: itens,
        valorTotal: itens.reduce((total, item) => total + item.total, 0),
        observacoes: document.getElementById('orcamento-observacoes').value,
        data: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('orcamentos').add(orcamentoData)
        .then(() => {
            alert('Orçamento salvo com sucesso!');
            document.querySelector('.modal').remove();
            loadOrcamentos();
        })
        .catch((error) => {
            console.error('Erro ao salvar orçamento:', error);
            alert('Erro ao salvar orçamento. Tente novamente.');
        });
}

// Visualizar orçamento
function visualizarOrcamento(orcamentoId) {
    Promise.all([
        db.collection('orcamentos').doc(orcamentoId).get(),
        db.collection('clientes').get(),
        db.collection('veiculos').get()
    ])
    .then(([orcamentoDoc, clientesSnapshot, veiculosSnapshot]) => {
        if (!orcamentoDoc.exists) {
            alert('Orçamento não encontrado.');
            return;
        }
        
        const orcamento = orcamentoDoc.data();
        const clientesMap = {};
        clientesSnapshot.forEach(doc => {
            clientesMap[doc.id] = doc.data();
        });
        
        const veiculosMap = {};
        veiculosSnapshot.forEach(doc => {
            veiculosMap[doc.id] = doc.data();
        });
        
        const cliente = clientesMap[orcamento.clienteId] || {};
        const veiculo = veiculosMap[orcamento.veiculoId] || {};
        
        const modal = criarModal();
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <h2 class="modal-title">Orçamento ${orcamento.numero}</h2>
                
                <div class="detail-card">
                    <h3>Informações do Orçamento</h3>
                    <div class="detail-row">
                        <div class="detail-label">Número:</div>
                        <div class="detail-value">${orcamento.numero}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Data:</div>
                        <div class="detail-value">${orcamento.data ? orcamento.data.toDate().toLocaleDateString('pt-BR') : ''}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Status:</div>
                        <div class="detail-value"><span class="status-badge status-${orcamento.status || 'pendente'}">${getStatusOrcamentoText(orcamento.status)}</span></div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Validade:</div>
                        <div class="detail-value">${orcamento.validade || 7} dias</div>
                    </div>
                </div>
                
                <div class="detail-card">
                    <h3>Cliente</h3>
                    <div class="detail-row">
                        <div class="detail-label">Nome:</div>
                        <div class="detail-value">${cliente.nome || 'Não informado'}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Telefone:</div>
                        <div class="detail-value">${cliente.telefone || 'Não informado'}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">E-mail:</div>
                        <div class="detail-value">${cliente.email || 'Não informado'}</div>
                    </div>
                </div>
                
                <div class="detail-card">
                    <h3>Veículo</h3>
                    <div class="detail-row">
                        <div class="detail-label">Placa:</div>
                        <div class="detail-value">${veiculo.placa || 'Não informado'}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Marca/Modelo:</div>
                        <div class="detail-value">${veiculo.marca || ''} ${veiculo.modelo || ''}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Ano/Cor:</div>
                        <div class="detail-value">${veiculo.ano || ''} / ${veiculo.cor || ''}</div>
                    </div>
                </div>
                
                <div class="detail-card">
                    <h3>Itens do Orçamento</h3>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Descrição</th>
                                    <th>Quantidade</th>
                                    <th>Valor Unitário</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orcamento.itens ? orcamento.itens.map(item => `
                                    <tr>
                                        <td>${item.descricao}</td>
                                        <td>${item.quantidade}</td>
                                        <td>R$ ${item.valorUnitario.toFixed(2)}</td>
                                        <td>R$ ${item.total.toFixed(2)}</td>
                                    </tr>
                                `).join('') : ''}
                                <tr>
                                    <td colspan="3" style="text-align: right; font-weight: bold;">Total:</td>
                                    <td style="font-weight: bold;">R$ ${orcamento.valorTotal ? orcamento.valorTotal.toFixed(2) : '0,00'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="detail-card">
                    <h3>Descrição e Observações</h3>
                    <p><strong>Descrição:</strong> ${orcamento.descricao || 'Não informada'}</p>
                    <p><strong>Observações:</strong> ${orcamento.observacoes || 'Nenhuma'}</p>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-success" onclick="gerarPDFOrcamento('${orcamentoId}')">Gerar PDF</button>
                    <button type="button" class="btn btn-secondary modal-close">Fechar</button>
                </div>
            </div>
        `;
        
        // Configurar evento de fechamento
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
    })
    .catch((error) => {
        console.error('Erro ao carregar orçamento:', error);
        alert('Erro ao carregar dados do orçamento.');
    });
}

// Gerar PDF do orçamento
function gerarPDFOrcamento(orcamentoId) {
    Promise.all([
        db.collection('orcamentos').doc(orcamentoId).get(),
        db.collection('clientes').get(),
        db.collection('veiculos').get()
    ])
    .then(([orcamentoDoc, clientesSnapshot, veiculosSnapshot]) => {
        if (!orcamentoDoc.exists) {
            alert('Orçamento não encontrado.');
            return;
        }
        
        const orcamento = orcamentoDoc.data();
        const clientesMap = {};
        clientesSnapshot.forEach(doc => {
            clientesMap[doc.id] = doc.data();
        });
        
        const veiculosMap = {};
        veiculosSnapshot.forEach(doc => {
            veiculosMap[doc.id] = doc.data();
        });
        
        const cliente = clientesMap[orcamento.clienteId] || {};
        const veiculo = veiculosMap[orcamento.veiculoId] || {};
        
        // Criar conteúdo do PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configurações do documento
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        let y = 20;
        
        // Cabeçalho
        doc.setFontSize(20);
        doc.setTextColor(26, 58, 143);
        doc.text("Alexandre Reparos Automotivos", pageWidth / 2, y, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        y += 10;
        doc.text("Soluções completas para seu veículo", pageWidth / 2, y, { align: 'center' });
        
        y += 15;
        doc.setDrawColor(26, 58, 143);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        
        // Título do orçamento
        y += 15;
        doc.setFontSize(16);
        doc.setTextColor(26, 58, 143);
        doc.text(`ORÇAMENTO: ${orcamento.numero}`, pageWidth / 2, y, { align: 'center' });
        
        // Informações do orçamento
        y += 15;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        doc.text(`Data: ${orcamento.data ? orcamento.data.toDate().toLocaleDateString('pt-BR') : ''}`, margin, y);
        doc.text(`Validade: ${orcamento.validade || 7} dias`, pageWidth - margin, y, { align: 'right' });
        
        y += 10;
        doc.text(`Status: ${getStatusOrcamentoText(orcamento.status)}`, margin, y);
        
        // Informações do cliente
        y += 20;
        doc.setFontSize(12);
        doc.setTextColor(26, 58, 143);
        doc.text("CLIENTE", margin, y);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        y += 8;
        doc.text(`Nome: ${cliente.nome || 'Não informado'}`, margin + 5, y);
        y += 6;
        doc.text(`Telefone: ${cliente.telefone || 'Não informado'}`, margin + 5, y);
        y += 6;
        doc.text(`E-mail: ${cliente.email || 'Não informado'}`, margin + 5, y);
        y += 6;
        doc.text(`CPF: ${cliente.cpf || 'Não informado'}`, margin + 5, y);
        
        // Informações do veículo
        y += 15;
        doc.setFontSize(12);
        doc.setTextColor(26, 58, 143);
        doc.text("VEÍCULO", margin, y);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        y += 8;
        doc.text(`Placa: ${veiculo.placa || 'Não informado'}`, margin + 5, y);
        y += 6;
        doc.text(`Marca/Modelo: ${veiculo.marca || ''} ${veiculo.modelo || ''}`, margin + 5, y);
        y += 6;
        doc.text(`Ano: ${veiculo.ano || 'Não informado'}`, margin + 5, y);
        y += 6;
        doc.text(`Cor: ${veiculo.cor || 'Não informado'}`, margin + 5, y);
        
        // Descrição do serviço
        y += 15;
        doc.setFontSize(12);
        doc.setTextColor(26, 58, 143);
        doc.text("DESCRIÇÃO DO SERVIÇO", margin, y);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        y += 8;
        const descricaoLines = doc.splitTextToSize(orcamento.descricao || 'Não informada', pageWidth - 2 * margin - 10);
        doc.text(descricaoLines, margin + 5, y);
        y += descricaoLines.length * 6;
        
        // Itens do orçamento
        y += 10;
        doc.setFontSize(12);
        doc.setTextColor(26, 58, 143);
        doc.text("ITENS DO ORÇAMENTO", margin, y);
        
        // Cabeçalho da tabela
        y += 10;
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(26, 58, 143);
        doc.rect(margin, y - 5, pageWidth - 2 * margin, 10, 'F');
        
        doc.text("Descrição", margin + 5, y);
        doc.text("Qtd", pageWidth - 150, y);
        doc.text("Valor Unit.", pageWidth - 120, y);
        doc.text("Total", pageWidth - 70, y);
        
        // Itens
        y += 10;
        doc.setTextColor(0, 0, 0);
        
        if (orcamento.itens && orcamento.itens.length > 0) {
            orcamento.itens.forEach((item, index) => {
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
                
                const descLines = doc.splitTextToSize(item.descricao, 80);
                doc.text(descLines, margin + 5, y);
                
                const descHeight = descLines.length * 5;
                doc.text(item.quantidade.toString(), pageWidth - 150, y + (descHeight / 2) - 2);
                doc.text(`R$ ${item.valorUnitario.toFixed(2)}`, pageWidth - 120, y + (descHeight / 2) - 2);
                doc.text(`R$ ${item.total.toFixed(2)}`, pageWidth - 70, y + (descHeight / 2) - 2);
                
                y += Math.max(descHeight, 10) + 5;
                
                // Linha divisória entre itens
                if (index < orcamento.itens.length - 1) {
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.1);
                    doc.line(margin, y - 2, pageWidth - margin, y - 2);
                }
            });
        } else {
            doc.text("Nenhum item cadastrado", margin + 5, y);
            y += 10;
        }
        
        // Total
        y += 10;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(pageWidth - 100, y, pageWidth - margin, y);
        
        y += 10;
        doc.setFontSize(12);
        doc.text("TOTAL:", pageWidth - 90, y);
        doc.text(`R$ ${orcamento.valorTotal ? orcamento.valorTotal.toFixed(2) : '0,00'}`, pageWidth - 30, y, { align: 'right' });
        
        // Observações
        y += 20;
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(26, 58, 143);
        doc.text("OBSERVAÇÕES", margin, y);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        y += 8;
        const obsLines = doc.splitTextToSize(orcamento.observacoes || 'Nenhuma', pageWidth - 2 * margin - 10);
        doc.text(obsLines, margin + 5, y);
        
        // Rodapé
        y = doc.internal.pageSize.height - 30;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Alexandre Reparos Automotivos • (11) 99999-9999 • contato@alexandrereparos.com", pageWidth / 2, y, { align: 'center' });
        
        // Salvar PDF
        doc.save(`orcamento-${orcamento.numero}.pdf`);
        
        alert('PDF gerado com sucesso!');
    })
    .catch((error) => {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Tente novamente.');
    });
}

// Excluir orçamento
function excluirOrcamento(orcamentoId) {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
        db.collection('orcamentos').doc(orcamentoId).delete()
            .then(() => {
                alert('Orçamento excluído com sucesso!');
                loadOrcamentos();
            })
            .catch((error) => {
                console.error('Erro ao excluir orçamento:', error);
                alert('Erro ao excluir orçamento. Tente novamente.');
            });
    }
}

// Estilos adicionais para itens do orçamento
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