(function () {
    function money(value) {
        const number = Number(value) || 0;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(number);
    }

    function text(value, fallback = '-') {
        if (value === null || value === undefined || value === '') return fallback;
        return String(value);
    }

    function dateValue(value) {
        if (!value) return '-';
        const raw = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
        if (Number.isNaN(raw.getTime())) return '-';
        return raw.toLocaleDateString('pt-BR');
    }

    function safeName(value) {
        return text(value, 'orcamento').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-');
    }

    function firestoreDb() {
        if (typeof db !== 'undefined') return db;
        return window.firebaseApp && window.firebaseApp.db;
    }

    function normalizeItem(item) {
        const quantity = Number(item.quantidade || item.qtd || 1) || 1;
        const unit = Number(item.valorUnitario || item.valor || item.preco || 0) || 0;
        const total = Number(item.total || quantity * unit) || 0;

        return {
            descricao: text(item.descricao || item.nome || item.servico, '-'),
            quantidade: quantity,
            valorUnitario: unit,
            total
        };
    }

    async function getDocData(ref) {
        const snap = await ref.get();
        return snap.exists ? snap.data() : null;
    }

    async function collectPdfData(id) {
        const oficinaId = sessionStorage.getItem('oficinaId');
        if (!oficinaId) throw new Error('Oficina nao encontrada na sessao.');

        const database = firestoreDb();
        if (!database) throw new Error('Banco de dados nao inicializado.');

        const oficinaRef = database.collection('oficinas').doc(oficinaId);
        const orc = await getDocData(oficinaRef.collection('orcamentos').doc(id));

        if (!orc) throw new Error('Orcamento nao encontrado.');

        const oficina = await getDocData(oficinaRef).catch(() => null);
        let cliente = orc.cliente || null;
        let veiculo = orc.veiculo || null;

        if (orc.clienteId) {
            cliente = await getDocData(oficinaRef.collection('clientes').doc(orc.clienteId)).catch(() => cliente);
        }

        if (orc.veiculoId) {
            veiculo = await getDocData(oficinaRef.collection('veiculos').doc(orc.veiculoId)).catch(() => veiculo);
        }

        return {
            oficina: oficina || { nome: sessionStorage.getItem('oficinaNome') || 'AutoFlow' },
            orcamento: orc,
            cliente: cliente || {},
            veiculo: veiculo || {}
        };
    }

    function drawFooter(doc, cfg) {
        const totalPages = doc.getNumberOfPages();
        const generatedAt = new Date().toLocaleDateString('pt-BR');

        for (let i = 1; i <= totalPages; i += 1) {
            doc.setPage(i);
            doc.setDrawColor(210, 210, 210);
            doc.setLineWidth(0.2);
            doc.line(cfg.margin, cfg.pageHeight - 18, cfg.pageWidth - cfg.margin, cfg.pageHeight - 18);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(120, 120, 120);
            doc.text(`Gerado em ${generatedAt} pelo AutoFlow`, cfg.margin, cfg.pageHeight - 11);
            doc.text(`Pagina ${i} de ${totalPages}`, cfg.pageWidth - cfg.margin, cfg.pageHeight - 11, { align: 'right' });
        }
    }

    function drawSectionTitle(doc, title, x, y, width) {
        doc.setDrawColor(35, 35, 35);
        doc.setLineWidth(0.25);
        doc.line(x, y + 2, x + width, y + 2);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(35, 35, 35);
        doc.text(title, x, y);
    }

    function drawInfoRows(doc, rows, x, y, width) {
        const lineHeight = 6;
        let cursor = y;

        rows.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(70, 70, 70);
            doc.text(label, x, cursor);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(45, 45, 45);
            const valueX = x + 27;
            const lines = doc.splitTextToSize(text(value), width - 28);
            doc.text(lines, valueX, cursor);
            cursor += Math.max(lineHeight, lines.length * 4.2);
        });

        return cursor;
    }

    function tableHeader(doc, cfg, y) {
        const left = cfg.margin;
        const width = cfg.pageWidth - cfg.margin * 2;

        doc.setFillColor(43, 43, 43);
        doc.rect(left, y, width, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('Descricao', left + 4, y + 5.4);
        doc.text('Qtd', cfg.col.qty, y + 5.4, { align: 'right' });
        doc.text('Unitario', cfg.col.unit, y + 5.4, { align: 'right' });
        doc.text('Total', cfg.col.total, y + 5.4, { align: 'right' });
        return y + 8;
    }

    function maybePageBreak(doc, cfg, y, neededHeight) {
        if (y + neededHeight <= cfg.pageHeight - 30) return y;
        doc.addPage();
        return tableHeader(doc, cfg, cfg.margin);
    }

    function generate(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 14;
        const cfg = {
            pageWidth,
            pageHeight,
            margin,
            col: {
                qty: pageWidth - 74,
                unit: pageWidth - 42,
                total: pageWidth - margin - 2
            }
        };

        const oficina = data.oficina || {};
        const orc = data.orcamento || {};
        const cliente = data.cliente || {};
        const veiculo = data.veiculo || {};
        const itens = Array.isArray(orc.itens) ? orc.itens.map(normalizeItem) : [];
        const total = itens.reduce((sum, item) => sum + item.total, 0) || Number(orc.valorTotal || 0) || 0;

        let y = margin;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(25, 25, 25);
        doc.text(text(oficina.nome || sessionStorage.getItem('oficinaNome'), 'AutoFlow'), margin, y);

        doc.setFontSize(18);
        doc.text('ORCAMENTO', pageWidth - margin, y, { align: 'right' });

        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        const oficinaLine = [
            oficina.telefone || oficina.whatsapp,
            oficina.email || oficina.emailDono,
            oficina.cidade && oficina.uf ? `${oficina.cidade}/${oficina.uf}` : ''
        ].filter(Boolean).join(' | ');
        doc.text(oficinaLine || 'Gestao de servicos automotivos', margin, y);
        doc.text(`No. ${text(orc.numero, 'sem numero')}`, pageWidth - margin, y, { align: 'right' });

        y += 7;
        doc.setDrawColor(35, 35, 35);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);

        y += 9;
        const metaY = y;
        doc.setFontSize(8);
        doc.setTextColor(70, 70, 70);
        doc.setFont('helvetica', 'bold');
        doc.text('DATA', margin, metaY);
        doc.text('VALIDADE', margin + 42, metaY);
        doc.text('STATUS', margin + 88, metaY);
        doc.text('TOTAL', pageWidth - margin, metaY, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(25, 25, 25);
        doc.text(dateValue(orc.data || orc.createdAt), margin, metaY + 5);
        doc.text(`${text(orc.validade, 7)} dias`, margin + 42, metaY + 5);
        doc.text(text(orc.status, 'pendente'), margin + 88, metaY + 5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(money(total), pageWidth - margin, metaY + 5, { align: 'right' });

        y += 18;

        const halfWidth = (pageWidth - margin * 2 - 8) / 2;
        drawSectionTitle(doc, 'CLIENTE', margin, y, halfWidth);
        drawSectionTitle(doc, 'VEICULO', margin + halfWidth + 8, y, halfWidth);

        y += 9;
        const leftEnd = drawInfoRows(doc, [
            ['Nome', cliente.nome || cliente.razaoSocial],
            ['Telefone', cliente.telefone || cliente.whatsapp],
            ['CPF/CNPJ', cliente.cpf || cliente.cnpj],
            ['Email', cliente.email],
            ['Endereco', cliente.endereco]
        ], margin, y, halfWidth);

        const rightEnd = drawInfoRows(doc, [
            ['Placa', veiculo.placa],
            ['Modelo', [veiculo.marca, veiculo.modelo].filter(Boolean).join(' ')],
            ['Ano/Cor', [veiculo.ano, veiculo.cor].filter(Boolean).join(' / ')],
            ['KM', veiculo.km ? `${veiculo.km} km` : ''],
            ['Chassi', veiculo.chassi]
        ], margin + halfWidth + 8, y, halfWidth);

        y = Math.max(leftEnd, rightEnd) + 8;

        if (orc.descricao) {
            y = maybePageBreak(doc, cfg, y, 22);
            drawSectionTitle(doc, 'SERVICO SOLICITADO', margin, y, pageWidth - margin * 2);
            y += 8;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(45, 45, 45);
            const lines = doc.splitTextToSize(text(orc.descricao), pageWidth - margin * 2);
            doc.text(lines, margin, y);
            y += lines.length * 4.5 + 8;
        }

        y = maybePageBreak(doc, cfg, y, 20);
        drawSectionTitle(doc, 'ITENS', margin, y, pageWidth - margin * 2);
        y += 7;
        y = tableHeader(doc, cfg, y);

        if (itens.length === 0) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(80, 80, 80);
            doc.text('Nenhum item cadastrado.', margin + 4, y + 6);
            y += 13;
        }

        itens.forEach((item, index) => {
            const descLines = doc.splitTextToSize(item.descricao, cfg.col.qty - margin - 10);
            const rowHeight = Math.max(8, descLines.length * 4.2 + 4);
            y = maybePageBreak(doc, cfg, y, rowHeight + 3);

            if (index % 2 === 0) {
                doc.setFillColor(248, 248, 248);
                doc.rect(margin, y, pageWidth - margin * 2, rowHeight, 'F');
            }

            doc.setDrawColor(225, 225, 225);
            doc.setLineWidth(0.15);
            doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.2);
            doc.setTextColor(35, 35, 35);
            doc.text(descLines, margin + 4, y + 5);
            doc.text(String(item.quantidade), cfg.col.qty, y + 5, { align: 'right' });
            doc.text(money(item.valorUnitario), cfg.col.unit, y + 5, { align: 'right' });
            doc.text(money(item.total), cfg.col.total, y + 5, { align: 'right' });
            y += rowHeight;
        });

        y += 8;
        y = maybePageBreak(doc, cfg, y, 24);
        doc.setDrawColor(35, 35, 35);
        doc.setLineWidth(0.35);
        doc.line(pageWidth - 82, y, pageWidth - margin, y);
        y += 7;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(25, 25, 25);
        doc.text('TOTAL DO ORCAMENTO', pageWidth - 82, y);
        doc.setFontSize(13);
        doc.text(money(total), pageWidth - margin, y, { align: 'right' });

        y += 13;
        if (orc.observacoes) {
            y = maybePageBreak(doc, cfg, y, 28);
            drawSectionTitle(doc, 'OBSERVACOES', margin, y, pageWidth - margin * 2);
            y += 8;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.2);
            doc.setTextColor(60, 60, 60);
            const obsLines = doc.splitTextToSize(text(orc.observacoes), pageWidth - margin * 2);
            doc.text(obsLines, margin, y);
            y += obsLines.length * 4.4;
        }

        y = maybePageBreak(doc, cfg, y + 8, 18);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.text('Valores sujeitos a confirmacao apos avaliacao tecnica. Pecas e servicos podem variar conforme disponibilidade e diagnostico.', margin, y + 8);

        drawFooter(doc, cfg);
        doc.save(`orcamento-${safeName(orc.numero || id)}.pdf`);
    }

    function install() {
        if (!window.jspdf || !firestoreDb()) return;

        window.gerarPDF = async function (id) {
            try {
                const data = await collectPdfData(id);
                generate(data);
                alert('PDF gerado com sucesso!');
            } catch (error) {
                console.error('Erro ao gerar PDF:', error);
                alert('Erro ao gerar PDF: ' + error.message);
            }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install);
    } else {
        install();
    }
})();
