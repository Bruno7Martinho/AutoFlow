// ===========================================
// SCRIPT PARA POPULAR O BANCO DE DADOS
// ===========================================
// COMO USAR:
// 1. Faça login como admin no sistema
// 2. Abra o console do navegador (F12)
// 3. Cole este script inteiro e pressione Enter
// 4. Aguarde a mensagem "✅ Banco populado com sucesso!"
// ===========================================

(async function popularBanco() {
    console.log('🚀 Iniciando população do banco de dados...');
    console.log('⏳ Isso pode levar alguns segundos...');
    
    // ===========================================
    // CONFIGURAÇÕES
    // ===========================================
    const ADMIN_UID = auth.currentUser?.uid || 'admin';
    const TOTAL_OFICINAS = 5; // Quantas oficinas criar
    const CLIENTES_POR_OFICINA = 15; // Clientes por oficina
    const VEICULOS_POR_CLIENTE = 2; // Veículos por cliente
    
    // ===========================================
    // DADOS FAKES REALISTAS
    // ===========================================
    
    // Nomes de oficinas
    const oficinasData = [
        {
            nome: 'Auto Mecânica Silva',
            cnpj: '12.345.678/0001-90',
            telefone: '(51) 3333-4444',
            whatsapp: '(51) 99999-8888',
            emailDono: 'joao.silva@oficina1.com',
            endereco: 'Av. Assis Brasil, 1500',
            bairro: 'São João',
            cidade: 'Porto Alegre',
            uf: 'RS',
            plano: 'pro'
        },
        {
            nome: 'Oficina do Porto',
            cnpj: '23.456.789/0001-01',
            telefone: '(51) 3222-1111',
            whatsapp: '(51) 98888-7777',
            emailDono: 'maria.santos@oficina2.com',
            endereco: 'Rua da Praia, 300',
            bairro: 'Centro',
            cidade: 'Porto Alegre',
            uf: 'RS',
            plano: 'basico'
        },
        {
            nome: 'Mecânica Express',
            cnpj: '34.567.890/0001-12',
            telefone: '(51) 3444-5555',
            whatsapp: '(51) 97777-6666',
            emailDono: 'carlos.oliveira@oficina3.com',
            endereco: 'Av. do Forte, 500',
            bairro: 'São Geraldo',
            cidade: 'Canoas',
            uf: 'RS',
            plano: 'enterprise'
        },
        {
            nome: 'Oficina Central',
            cnpj: '45.678.901/0001-23',
            telefone: '(51) 3666-7777',
            whatsapp: '(51) 96666-5555',
            emailDono: 'ana.rodrigues@oficina4.com',
            endereco: 'Rua Independência, 800',
            bairro: 'Centro',
            cidade: 'São Leopoldo',
            uf: 'RS',
            plano: 'basico'
        },
        {
            nome: 'Auto Center Premium',
            cnpj: '56.789.012/0001-34',
            telefone: '(51) 3888-9999',
            whatsapp: '(51) 95555-4444',
            emailDono: 'roberto.lima@oficina5.com',
            endereco: 'Av. dos Estados, 2000',
            bairro: 'Industrial',
            cidade: 'Novo Hamburgo',
            uf: 'RS',
            plano: 'pro'
        }
    ];
    
    // Nomes de clientes
    const nomesClientes = [
        'Ana Beatriz Souza', 'Carlos Eduardo Lima', 'Maria Fernanda Santos',
        'João Pedro Oliveira', 'Juliana Costa Rodrigues', 'Paulo Henrique Martins',
        'Camila Ferreira Dias', 'Lucas Gabriel Alves', 'Fernanda Cristina Rocha',
        'Rafael Augusto Mendes', 'Patrícia Gomes Carvalho', 'Diego Henrique Barbosa',
        'Aline Cristina Nunes', 'Bruno César Teixeira', 'Larissa Machado Araújo',
        'Gustavo Henrique Cardoso', 'Vanessa Cristina Freitas', 'Rodrigo Souza Pinto',
        'Tatiane Oliveira Ribeiro', 'Eduardo Lima Santos', 'Amanda Vieira Castro',
        'Marcelo Augusto Dias', 'Priscila Andrade Moreira', 'Renato Alves Monteiro',
        'Cristiane Barbosa Melo', 'Fábio Henrique Correia', 'Simone Aparecida Lima',
        'André Luiz Vieira', 'Luciana Santos Pereira', 'Thiago Oliveira Costa'
    ];
    
    // Marcas e modelos de veículos
    const veiculosData = [
        { marca: 'Fiat', modelo: 'Uno', ano: 2018, placa: 'ABC1234' },
        { marca: 'Fiat', modelo: 'Palio', ano: 2019, placa: 'DEF5678' },
        { marca: 'Fiat', modelo: 'Toro', ano: 2021, placa: 'GHI9012' },
        { marca: 'Volkswagen', modelo: 'Gol', ano: 2017, placa: 'JKL3456' },
        { marca: 'Volkswagen', modelo: 'Polo', ano: 2020, placa: 'MNO7890' },
        { marca: 'Volkswagen', modelo: 'T-Cross', ano: 2022, placa: 'PQR1234' },
        { marca: 'Chevrolet', modelo: 'Onix', ano: 2019, placa: 'STU5678' },
        { marca: 'Chevrolet', modelo: 'Tracker', ano: 2021, placa: 'VWX9012' },
        { marca: 'Chevrolet', modelo: 'S10', ano: 2020, placa: 'YZA3456' },
        { marca: 'Ford', modelo: 'Ka', ano: 2018, placa: 'BCD7890' },
        { marca: 'Ford', modelo: 'Ranger', ano: 2022, placa: 'EFG1234' },
        { marca: 'Ford', modelo: 'Focus', ano: 2019, placa: 'HIJ5678' },
        { marca: 'Toyota', modelo: 'Corolla', ano: 2021, placa: 'KLM9012' },
        { marca: 'Toyota', modelo: 'Hilux', ano: 2022, placa: 'NOP3456' },
        { marca: 'Toyota', modelo: 'Yaris', ano: 2020, placa: 'QRS7890' },
        { marca: 'Honda', modelo: 'Civic', ano: 2021, placa: 'TUV1234' },
        { marca: 'Honda', modelo: 'HR-V', ano: 2020, placa: 'WXY5678' },
        { marca: 'Honda', modelo: 'Fit', ano: 2019, placa: 'ZAB9012' },
        { marca: 'Renault', modelo: 'Sandero', ano: 2018, placa: 'CDE3456' },
        { marca: 'Renault', modelo: 'Duster', ano: 2021, placa: 'FGH7890' },
        { marca: 'Jeep', modelo: 'Renegade', ano: 2022, placa: 'IJK1234' },
        { marca: 'Jeep', modelo: 'Compass', ano: 2021, placa: 'LMN5678' },
        { marca: 'Hyundai', modelo: 'HB20', ano: 2020, placa: 'OPQ9012' },
        { marca: 'Hyundai', modelo: 'Creta', ano: 2022, placa: 'RST3456' }
    ];
    
    // Serviços realizados
    const servicos = [
        'Troca de óleo', 'Revisão completa', 'Alinhamento', 'Balanceamento',
        'Troca de pastilhas de freio', 'Troca de pneus', 'Injeção eletrônica',
        'Ar condicionado', 'Suspensão', 'Embreagem', 'Troca de correia dentada',
        'Diagnóstico computadorizado', 'Funilaria', 'Pintura', 'Troca de bateria'
    ];
    
    // ===========================================
    // FUNÇÕES AUXILIARES
    // ===========================================
    
    function randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }
    
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    function randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    function formatarTelefone() {
        const ddd = randomInt(11, 99);
        const prefixo = randomInt(3000, 9999);
        const sufixo = randomInt(1000, 9999);
        return `(${ddd}) ${prefixo}-${sufixo}`;
    }
    
    function formatarCelular() {
        const ddd = randomInt(11, 99);
        const prefixo = randomInt(90000, 99999);
        const sufixo = randomInt(1000, 9999);
        return `(${ddd}) ${prefixo}-${sufixo}`;
    }
    
    function formatarCPF() {
        const n = () => randomInt(100, 999);
        const d = () => randomInt(10, 99);
        return `${n()}.${n()}.${n()}-${d()}`;
    }
    
    function formatarPlaca() {
        const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let placa = '';
        for (let i = 0; i < 3; i++) placa += letras[randomInt(0, 25)];
        placa += randomInt(100, 999);
        return placa;
    }
    
    // ===========================================
    // POPULAR BANCO
    // ===========================================
    
    try {
        console.log('📊 Criando oficinas...');
        
        // Criar oficinas
        for (let i = 0; i < TOTAL_OFICINAS; i++) {
            const ofData = oficinasData[i] || {
                nome: `Oficina Teste ${i+1}`,
                cnpj: `${randomInt(10,99)}.${randomInt(100,999)}.${randomInt(100,999)}/0001-${randomInt(10,99)}`,
                telefone: formatarTelefone(),
                whatsapp: formatarCelular(),
                emailDono: `oficina${i+1}@teste.com`,
                endereco: `Rua ${i+1}, ${randomInt(100, 999)}`,
                bairro: 'Centro',
                cidade: 'Porto Alegre',
                uf: 'RS',
                plano: randomItem(['basico', 'pro', 'enterprise'])
            };
            
            // Criar documento da oficina
            const oficinaRef = await db.collection('oficinas').add({
                ...ofData,
                status: 'ativa',
                dataCadastro: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: ADMIN_UID
            });
            
            console.log(`  ✅ Oficina criada: ${ofData.nome} (${oficinaRef.id})`);
            
            // Criar clientes para esta oficina
            console.log(`    👥 Criando clientes...`);
            
            for (let c = 0; c < CLIENTES_POR_OFICINA; c++) {
                const nomeCliente = nomesClientes[c % nomesClientes.length] + ` ${c+1}`;
                const dataNascimento = randomDate(new Date(1970, 0, 1), new Date(2002, 0, 1));
                
                const clienteRef = await oficinaRef.collection('clientes').add({
                    nome: nomeCliente,
                    cpf: formatarCPF(),
                    rg: `${randomInt(1000000, 9999999)}`,
                    telefone: formatarCelular(),
                    telefone2: Math.random() > 0.5 ? formatarCelular() : '',
                    email: `${nomeCliente.toLowerCase().replace(/\s/g, '.')}@email.com`,
                    dataNascimento: dataNascimento.toISOString().split('T')[0],
                    endereco: `Rua ${randomInt(1, 100)}, ${randomInt(100, 999)}`,
                    bairro: randomItem(['Centro', 'Jardim', 'Industrial', 'São José']),
                    cidade: ofData.cidade,
                    uf: ofData.uf,
                    cep: `${randomInt(90000, 95000)}-${randomInt(100, 999)}`,
                    observacoes: Math.random() > 0.7 ? 'Cliente prefere atendimento pela manhã' : '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: ADMIN_UID
                });
                
                console.log(`      ✅ Cliente: ${nomeCliente}`);
                
                // Criar veículos para este cliente
                for (let v = 0; v < VEICULOS_POR_CLIENTE; v++) {
                    const veiculo = veiculosData[randomInt(0, veiculosData.length - 1)];
                    const ano = randomInt(2015, 2023);
                    
                    await clienteRef.collection('veiculos').add({
                        marca: veiculo.marca,
                        modelo: veiculo.modelo,
                        ano: ano,
                        placa: formatarPlaca(),
                        cor: randomItem(['Preto', 'Branco', 'Prata', 'Vermelho', 'Azul', 'Cinza']),
                        combustivel: randomItem(['Gasolina', 'Etanol', 'Flex', 'Diesel']),
                        km: randomInt(10000, 150000),
                        chassi: `${randomInt(10000000000000000, 99999999999999999)}`,
                        renavam: `${randomInt(1000000000, 9999999999)}`,
                        observacoes: Math.random() > 0.8 ? 'Revisão a cada 6 meses' : '',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        createdBy: ADMIN_UID
                    });
                }
                
                // Criar alguns orçamentos aleatórios para alguns clientes
                if (Math.random() > 0.6) {
                    const numOrcamentos = randomInt(1, 3);
                    
                    for (let o = 0; o < numOrcamentos; o++) {
                        const valorTotal = randomInt(200, 5000);
                        const servicosEscolhidos = [];
                        const numServicos = randomInt(1, 4);
                        
                        for (let s = 0; s < numServicos; s++) {
                            servicosEscolhidos.push(randomItem(servicos));
                        }
                        
                        await clienteRef.collection('orcamentos').add({
                            numero: `OR${randomInt(1000, 9999)}`,
                            servicos: servicosEscolhidos,
                            valorTotal: valorTotal,
                            status: randomItem(['pendente', 'aprovado', 'recusado', 'concluido']),
                            dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
                            validade: randomInt(7, 30),
                            observacoes: '',
                            createdBy: ADMIN_UID
                        });
                    }
                }
            }
            
            // Pausa pequena para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('\n✅✅✅ BANCO POPULADO COM SUCESSO! ✅✅✅');
        console.log(`📊 Resumo:`);
        console.log(`   🏪 ${TOTAL_OFICINAS} oficinas criadas`);
        console.log(`   👥 ${TOTAL_OFICINAS * CLIENTES_POR_OFICINA} clientes criados`);
        console.log(`   🚗 ${TOTAL_OFICINAS * CLIENTES_POR_OFICINA * VEICULOS_POR_CLIENTE} veículos criados`);
        console.log(`\n📝 Próximos passos:`);
        console.log(`   1. Vá para admin-oficinas.html e veja suas oficinas`);
        console.log(`   2. Faça login como dono de uma oficina para testar`);
        console.log(`   3. Emails de teste:`);
        for (let i = 0; i < Math.min(3, TOTAL_OFICINAS); i++) {
            console.log(`      - ${oficinasData[i]?.emailDono || `oficina${i+1}@teste.com`}`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao popular banco:', error);
        console.log('Tentando novamente em 5 segundos...');
        setTimeout(popularBanco, 5000);
    }
})();