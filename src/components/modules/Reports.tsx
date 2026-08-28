import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  ShoppingBag, 
  Users, 
  FileSpreadsheet, 
  ArrowUpRight,
  Layers,
  RotateCcw,
  Table as TableIcon,
  PieChart,
  Boxes,
  Sparkles
} from 'lucide-react';
import { ReportMovRes, ReportConsolidado } from '../../types';
import { MovimentacaoResumidaReport } from './MovimentacaoResumidaReport';

interface ReportsProps {
  movRes?: ReportMovRes;
  consolidado?: ReportConsolidado;
  onRefreshMovRes?: (date: string) => Promise<void>;
  isLoading?: boolean;
}

export type ReportOptionTab = 'movimentacaoResumida' | 'movRes' | 'consolidado' | 'curvaAbc' | 'cobertura';

export const Reports: React.FC<ReportsProps> = ({
  movRes,
  consolidado,
  onRefreshMovRes,
  isLoading
}) => {
  const [activeReportTab, setActiveReportTab] = useState<ReportOptionTab>('movimentacaoResumida');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const defaultMovRes: ReportMovRes = movRes || {
    data: new Date().toISOString().split('T')[0],
    filialNome: "Loja 01 - Matriz Centro",
    filialId: 1,
    totalVendasBruto: 18450.80,
    totalDescontos: 890.30,
    totalVendasLiquido: 17560.50,
    totalCustoMercadoria: 7320.00,
    lucroBruto: 10240.50,
    margemBrutaPercentual: 58.31,
    quantidadeAtendimentos: 142,
    quantidadePecasVendidas: 298,
    ticketMedioValor: 123.66,
    pecasPorAtendimento: 2.1,
    precoMedioPeca: 58.92,
    formasPagamento: {
      cartaoCredito: 9480.20,
      cartaoDebito: 3250.00,
      pix: 3410.30,
      dinheiro: 980.00,
      crediario: 440.00,
      convenio: 0.00,
      outros: 0.00
    },
    totalDevolucoes: 280.00,
    totalCancelamentos: 150.00,
    horarioPico: "15:00 às 17:00"
  };

  const defaultConsolidado: ReportConsolidado = consolidado || {
    periodo: { inicio: "2026-08-01", fim: "2026-08-28" },
    lojas: [
      {
        id: 1,
        nome: "Loja 01 - Matriz Tijuca",
        vendaBruta: 342500.00,
        vendaLiquida: 328000.00,
        meta: 310000.00,
        atingimentoMetaPercentual: 105.8,
        ticketMedio: 135.40,
        quantidadeVendas: 2422,
        estoqueValorCusto: 184000.00,
        estoqueValorVenda: 441600.00,
        coberturaDiasEstoque: 42
      },
      {
        id: 2,
        nome: "Loja 02 - Barra Shopping",
        vendaBruta: 489000.00,
        vendaLiquida: 472500.00,
        meta: 450000.00,
        atingimentoMetaPercentual: 105.0,
        ticketMedio: 182.20,
        quantidadeVendas: 2593,
        estoqueValorCusto: 245000.00,
        estoqueValorVenda: 588000.00,
        coberturaDiasEstoque: 38
      },
      {
        id: 3,
        nome: "Loja 03 - Norte Shopping",
        vendaBruta: 198000.00,
        vendaLiquida: 189400.00,
        meta: 220000.00,
        atingimentoMetaPercentual: 86.1,
        ticketMedio: 98.60,
        quantidadeVendas: 1920,
        estoqueValorCusto: 165000.00,
        estoqueValorVenda: 396000.00,
        coberturaDiasEstoque: 68
      }
    ],
    categorias: [
      {
        nome: "Futebol & Oficial",
        vendaLiquida: 452000.00,
        participacaoPercentual: 45.6,
        quantidadePecas: 4120,
        margemMedia: 59.2
      },
      {
        nome: "Confecção Casual",
        vendaLiquida: 318000.00,
        participacaoPercentual: 32.1,
        quantidadePecas: 3280,
        margemMedia: 56.4
      },
      {
        nome: "Calçados & Chuteiras",
        vendaLiquida: 142000.00,
        participacaoPercentual: 14.3,
        quantidadePecas: 740,
        margemMedia: 51.0
      },
      {
        nome: "Acessórios & Equipamentos",
        vendaLiquida: 77900.00,
        participacaoPercentual: 8.0,
        quantidadePecas: 1850,
        margemMedia: 64.5
      }
    ]
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    if (onRefreshMovRes) {
      onRefreshMovRes(e.target.value);
    }
  };

  const handleExportMovResCsv = () => {
    const lines = [
      "RELATORIO DE MOVIMENTO RESUMIDO (MOV RES)",
      `Data;${defaultMovRes.data}`,
      `Filial;${defaultMovRes.filialNome}`,
      "",
      "INDICADOR;VALOR",
      `Total Vendas Bruto;R$ ${defaultMovRes.totalVendasBruto.toFixed(2)}`,
      `Total Descontos;R$ ${defaultMovRes.totalDescontos.toFixed(2)}`,
      `Total Vendas Liquido;R$ ${defaultMovRes.totalVendasLiquido.toFixed(2)}`,
      `Custo da Mercadoria (CMV);R$ ${defaultMovRes.totalCustoMercadoria.toFixed(2)}`,
      `Lucro Bruto;R$ ${defaultMovRes.lucroBruto.toFixed(2)}`,
      `Margem Bruta (%);${defaultMovRes.margemBrutaPercentual.toFixed(2)}%`,
      `Quantidade de Atendimentos;${defaultMovRes.quantidadeAtendimentos}`,
      `Total de Pecas Vendidas;${defaultMovRes.quantidadePecasVendidas}`,
      `Ticket Medio;R$ ${defaultMovRes.ticketMedioValor.toFixed(2)}`,
      `Pecas Por Atendimento (P.A.);${defaultMovRes.pecasPorAtendimento.toFixed(2)}`,
      `Preco Medio por Peca;R$ ${defaultMovRes.precoMedioPeca.toFixed(2)}`,
      "",
      "FORMAS DE PAGAMENTO;VALOR",
      `Cartao de Credito;R$ ${defaultMovRes.formasPagamento.cartaoCredito.toFixed(2)}`,
      `Cartao de Debito;R$ ${defaultMovRes.formasPagamento.cartaoDebito.toFixed(2)}`,
      `PIX;R$ ${defaultMovRes.formasPagamento.pix.toFixed(2)}`,
      `Dinheiro;R$ ${defaultMovRes.formasPagamento.dinheiro.toFixed(2)}`,
      `Crediario / Boleto;R$ ${defaultMovRes.formasPagamento.crediario.toFixed(2)}`,
      `Devolucoes;R$ ${defaultMovRes.totalDevolucoes.toFixed(2)}`,
      `Cancelamentos;R$ ${defaultMovRes.totalCancelamentos.toFixed(2)}`
    ];

    const csvContent = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `movimento_resumido_${defaultMovRes.data}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportConsolidadoCsv = () => {
    const headersLojas = [
      "Loja",
      "Venda_Bruta",
      "Venda_Liquida",
      "Meta",
      "Atingimento_%",
      "Ticket_Medio",
      "Qtd_Vendas",
      "Estoque_Custo",
      "Estoque_Venda",
      "Cobertura_Dias"
    ];

    const rowsLojas = defaultConsolidado.lojas.map(l => [
      `"${l.nome}"`,
      l.vendaBruta.toFixed(2),
      l.vendaLiquida.toFixed(2),
      l.meta.toFixed(2),
      l.atingimentoMetaPercentual.toFixed(1),
      l.ticketMedio.toFixed(2),
      l.quantidadeVendas,
      l.estoqueValorCusto.toFixed(2),
      l.estoqueValorVenda.toFixed(2),
      l.coberturaDiasEstoque
    ]);

    const csvContent = "\uFEFF" + [
      "RELATORIO CONSOLIDADO DE LOJAS",
      headersLojas.join(";"),
      ...rowsLojas.map(r => r.join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_consolidado_multilojas.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formasPagamentoTotal = (
    defaultMovRes.formasPagamento.cartaoCredito +
    defaultMovRes.formasPagamento.cartaoDebito +
    defaultMovRes.formasPagamento.pix +
    defaultMovRes.formasPagamento.dinheiro +
    defaultMovRes.formasPagamento.crediario
  );

  return (
    <div className="space-y-4">
      
      {/* Top Report Navigation Suite */}
      <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
        
        {/* Ready Report Options */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#E4E3E0] p-1 rounded-sm border border-[#141414]">
          <button
            onClick={() => setActiveReportTab('movimentacaoResumida')}
            className={`px-3 py-1.5 rounded-xs text-xs font-bold uppercase transition flex items-center space-x-1.5 ${
              activeReportTab === 'movimentacaoResumida'
                ? 'bg-[#141414] text-[#E4E3E0] shadow-xs'
                : 'text-[#141414]/80 hover:text-[#141414] hover:bg-[#dcdbd8]'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Movimentação Resumida</span>
            <span className="px-1 py-0.2 bg-emerald-500 text-black text-[9px] font-bold rounded-2xs">NOVO</span>
          </button>

          <button
            onClick={() => setActiveReportTab('movRes')}
            className={`px-3 py-1.5 rounded-xs text-xs font-bold uppercase transition flex items-center space-x-1.5 ${
              activeReportTab === 'movRes'
                ? 'bg-[#141414] text-[#E4E3E0] shadow-xs'
                : 'text-[#141414]/80 hover:text-[#141414] hover:bg-[#dcdbd8]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Movimento Resumido (Mov Res)</span>
          </button>

          <button
            onClick={() => setActiveReportTab('consolidado')}
            className={`px-3 py-1.5 rounded-xs text-xs font-bold uppercase transition flex items-center space-x-1.5 ${
              activeReportTab === 'consolidado'
                ? 'bg-[#141414] text-[#E4E3E0] shadow-xs'
                : 'text-[#141414]/80 hover:text-[#141414] hover:bg-[#dcdbd8]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Consolidado Multilojas</span>
          </button>

          <button
            onClick={() => setActiveReportTab('curvaAbc')}
            className={`px-3 py-1.5 rounded-xs text-xs font-bold uppercase transition flex items-center space-x-1.5 ${
              activeReportTab === 'curvaAbc'
                ? 'bg-[#141414] text-[#E4E3E0] shadow-xs'
                : 'text-[#141414]/80 hover:text-[#141414] hover:bg-[#dcdbd8]'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Curva ABC</span>
          </button>

          <button
            onClick={() => setActiveReportTab('cobertura')}
            className={`px-3 py-1.5 rounded-xs text-xs font-bold uppercase transition flex items-center space-x-1.5 ${
              activeReportTab === 'cobertura'
                ? 'bg-[#141414] text-[#E4E3E0] shadow-xs'
                : 'text-[#141414]/80 hover:text-[#141414] hover:bg-[#dcdbd8]'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Giro & Cobertura</span>
          </button>
        </div>

        {/* Action button for sub-tabs */}
        {activeReportTab === 'movRes' && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-[#E4E3E0] px-2.5 py-1 rounded-sm border border-[#141414] text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#141414]/70" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                aria-label="Selecionar Data do Movimento"
                className="bg-transparent font-bold text-[#141414] focus:outline-none uppercase"
              />
            </div>

            <button
              onClick={handleExportMovResCsv}
              className="px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center space-x-1.5 border border-[#141414]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        )}

        {activeReportTab === 'consolidado' && (
          <button
            onClick={handleExportConsolidadoCsv}
            className="px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center space-x-1.5 border border-[#141414]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        )}

      </div>

      {/* 1. MOVIMENTAÇÃO RESUMIDA (THE PRIMARY REQUESTED REPORT) */}
      {activeReportTab === 'movimentacaoResumida' && (
        <MovimentacaoResumidaReport />
      )}

      {/* 2. MOV RES TAB */}
      {activeReportTab === 'movRes' && (
        <div className="space-y-4">
          
          {/* Main KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] space-y-0.5 font-mono">
              <div className="text-[10px] uppercase font-bold text-[#141414]/60">Venda Líquida do Dia</div>
              <div className="text-xl font-bold text-[#141414]">
                R$ {defaultMovRes.totalVendasLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-[#141414]/70">
                Bruta: R$ {defaultMovRes.totalVendasBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] space-y-0.5 font-mono">
              <div className="text-[10px] uppercase font-bold text-[#141414]">Lucro Bruto / Margem</div>
              <div className="text-xl font-bold text-[#141414]">
                R$ {defaultMovRes.lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-bold text-[#141414]">
                Margem média: {defaultMovRes.margemBrutaPercentual.toFixed(1)}%
              </div>
            </div>

            <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] space-y-0.5 font-mono">
              <div className="text-[10px] uppercase font-bold text-[#141414]">Ticket Médio (R$)</div>
              <div className="text-xl font-bold text-[#141414]">
                R$ {defaultMovRes.ticketMedioValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-[#141414]/70">
                {defaultMovRes.quantidadeAtendimentos} atendimentos realizados
              </div>
            </div>

            <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] space-y-0.5 font-mono">
              <div className="text-[10px] uppercase font-bold text-[#141414]">Peças por Atendimento (P.A.)</div>
              <div className="text-xl font-bold text-[#141414]">
                {defaultMovRes.pecasPorAtendimento.toFixed(2)} peças
              </div>
              <div className="text-[10px] text-[#141414]/70">
                {defaultMovRes.quantidadePecasVendidas} peças vendidas
              </div>
            </div>

          </div>

          {/* Payment Methods and Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            
            {/* Payment Methods */}
            <div className="bg-[#F0EFED] p-3.5 rounded-sm border border-[#141414] space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-[#141414] pb-2">
                <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#141414]" />
                  <span>Vendas por Meio de Pagamento</span>
                </h3>
                <span className="text-[10px] font-bold text-[#141414]">
                  Total: R$ {formasPagamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { label: 'Cartão de Crédito', val: defaultMovRes.formasPagamento.cartaoCredito },
                  { label: 'PIX', val: defaultMovRes.formasPagamento.pix },
                  { label: 'Cartão de Débito', val: defaultMovRes.formasPagamento.cartaoDebito },
                  { label: 'Dinheiro em Espécie', val: defaultMovRes.formasPagamento.dinheiro },
                  { label: 'Crediário / Boleto', val: defaultMovRes.formasPagamento.crediario },
                ].map((item, idx) => {
                  const percent = formasPagamentoTotal > 0 ? ((item.val / formasPagamentoTotal) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#141414]">{item.label}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#141414]">
                            R$ {item.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[#141414]/70 text-[10px] w-10 text-right">
                            {percent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-[#E4E3E0] h-1.5 rounded-none border border-[#141414]/30 overflow-hidden">
                        <div 
                          className="h-full bg-[#141414]" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operational Summary & Adjustments */}
            <div className="bg-[#F0EFED] p-3.5 rounded-sm border border-[#141414] space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-[#141414] pb-2">
                <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-[#141414]" />
                  <span>Resumo Operacional & Descontos</span>
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                
                <div className="flex items-center justify-between p-2 bg-[#E4E3E0] rounded-sm border border-[#141414]">
                  <span className="text-[#141414]/80">Total de Descontos Concedidos:</span>
                  <span className="font-bold text-[#141414]">
                    R$ {defaultMovRes.totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-[#E4E3E0] rounded-sm border border-[#141414]">
                  <span className="text-[#141414]/80">Devoluções / Trocas:</span>
                  <span className="font-bold text-[#141414]">
                    R$ {defaultMovRes.totalDevolucoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-[#E4E3E0] rounded-sm border border-[#141414]">
                  <span className="text-[#141414]/80">Cancelamentos no PDV:</span>
                  <span className="font-bold text-[#141414]">
                    R$ {defaultMovRes.totalCancelamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-[#E4E3E0] rounded-sm border border-[#141414]">
                  <span className="text-[#141414]/80">Horário de Maior Movimento:</span>
                  <span className="font-bold text-[#141414]">
                    {defaultMovRes.horarioPico || "15h às 18h"}
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* 3. CONSOLIDADO TAB */}
      {activeReportTab === 'consolidado' && (
        <div className="space-y-4 font-mono">
          
          {/* Lojas Performance Table */}
          <div className="bg-[#F0EFED] rounded-sm border border-[#141414] overflow-hidden">
            <div className="p-3 bg-[#E4E3E0] border-b border-[#141414] flex items-center justify-between">
              <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#141414]" />
                <span>Desempenho Consolidado por Loja / Filial</span>
              </h3>
              <span className="text-[10px] text-[#141414]/70">
                Período: {defaultConsolidado.periodo.inicio} a {defaultConsolidado.periodo.fim}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0] border-b border-[#141414] text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Filial</th>
                    <th className="py-2.5 px-2.5">Venda Líquida</th>
                    <th className="py-2.5 px-2.5">Meta do Mês</th>
                    <th className="py-2.5 px-2.5">Atingimento %</th>
                    <th className="py-2.5 px-2.5">Ticket Médio</th>
                    <th className="py-2.5 px-2.5">Atendimentos</th>
                    <th className="py-2.5 px-2.5">Estoque (Custo)</th>
                    <th className="py-2.5 px-3 text-right">Cobertura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/15">
                  {defaultConsolidado.lojas.map(loja => (
                    <tr key={loja.id} className="hover:bg-[#E4E3E0]/60 transition">
                      <td className="py-2 px-3 font-bold text-[#141414]">
                        {loja.nome}
                      </td>
                      <td className="py-2 px-2.5 font-bold text-[#141414]">
                        R$ {loja.vendaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 text-[#141414]/80">
                        R$ {loja.meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5">
                        <span className={`px-1.5 py-0.5 rounded-xs font-bold text-[10px] border border-[#141414] ${
                          loja.atingimentoMetaPercentual >= 100 
                            ? 'bg-[#141414] text-[#E4E3E0]' 
                            : 'bg-[#E4E3E0] text-[#141414]'
                        }`}>
                          {loja.atingimentoMetaPercentual.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-bold text-[#141414]">
                        R$ {loja.ticketMedio.toFixed(2)}
                      </td>
                      <td className="py-2 px-2.5 text-[#141414]/80">
                        {loja.quantidadeVendas.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 px-2.5 text-[#141414]/80">
                        R$ {loja.estoqueValorCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-[#141414]">
                        {loja.coberturaDiasEstoque} dias
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Categorias Breakdown */}
          <div className="bg-[#F0EFED] rounded-sm border border-[#141414] p-3.5 space-y-3">
            <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-[#141414]" />
              <span>Participação por Departamento / Categoria</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {defaultConsolidado.categorias.map((cat, idx) => (
                <div key={idx} className="p-3 bg-[#E4E3E0] rounded-sm border border-[#141414] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#141414] truncate">{cat.nome}</span>
                    <span className="font-bold text-[#141414] bg-[#F0EFED] px-1 py-0.2 rounded-xs border border-[#141414] text-[10px]">{cat.participacaoPercentual}%</span>
                  </div>
                  <div className="text-sm font-bold text-[#141414]">
                    R$ {cat.vendaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#141414]/70 pt-1 border-t border-[#141414]/20">
                    <span>{cat.quantidadePecas} peças</span>
                    <span className="font-bold text-[#141414]">Margem: {cat.margemMedia}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 4. CURVA ABC TAB */}
      {activeReportTab === 'curvaAbc' && (
        <div className="bg-[#F0EFED] p-5 rounded-sm border border-[#141414] space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-[#141414] pb-2">
            <div>
              <h3 className="font-bold text-sm uppercase text-[#141414]">Classificação Curva ABC (Regra 80/15/5)</h3>
              <p className="text-xs text-[#141414]/70">Produtos agrupados por relevância de faturamento e giro no período.</p>
            </div>
            <span className="px-2 py-0.5 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold rounded-xs uppercase">
              PRONTO PARA ANÁLISE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#E4E3E0] p-3 rounded-sm border border-[#141414] space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span>CLASSE A (80% Faturamento)</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 border border-emerald-900 rounded-xs">6 Itens</span>
              </div>
              <div className="text-lg font-bold text-[#141414]">R$ 134.820,00</div>
              <div className="text-[10px] text-[#141414]/70">Mantos Oficiais e Lançamentos 2026</div>
            </div>

            <div className="bg-[#E4E3E0] p-3 rounded-sm border border-[#141414] space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span>CLASSE B (15% Faturamento)</span>
                <span className="px-1.5 py-0.2 bg-amber-100 border border-amber-900 rounded-xs">18 Itens</span>
              </div>
              <div className="text-lg font-bold text-[#141414]">R$ 25.290,00</div>
              <div className="text-[10px] text-[#141414]/70">Linha Treino, Calçados e Bermudas</div>
            </div>

            <div className="bg-[#E4E3E0] p-3 rounded-sm border border-[#141414] space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <span>CLASSE C (5% Faturamento)</span>
                <span className="px-1.5 py-0.2 bg-blue-100 border border-blue-900 rounded-xs">42 Itens</span>
              </div>
              <div className="text-lg font-bold text-[#141414]">R$ 8.430,00</div>
              <div className="text-[10px] text-[#141414]/70">Acessórios, Meias e Itens de Cauda Longa</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. COBERTURA TAB */}
      {activeReportTab === 'cobertura' && (
        <div className="bg-[#F0EFED] p-5 rounded-sm border border-[#141414] space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-[#141414] pb-2">
            <div>
              <h3 className="font-bold text-sm uppercase text-[#141414]">Giro e Cobertura de Estoque (Dias de Venda)</h3>
              <p className="text-xs text-[#141414]/70">Relação entre estoque disponível e média de venda diária por rede.</p>
            </div>
            <span className="px-2 py-0.5 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold rounded-xs uppercase">
              STATUS SAUDÁVEL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-[#E4E3E0] p-3 rounded-sm border border-[#141414] space-y-1">
              <div className="text-[10px] font-bold text-[#141414]/70 uppercase">Rede MULTI</div>
              <div className="text-lg font-bold text-emerald-900">32 Dias Cobertura</div>
              <div className="text-[10px] text-[#141414]/60">Giro rápido de camisas 2026</div>
            </div>

            <div className="bg-[#E4E3E0] p-3 rounded-sm border border-[#141414] space-y-1">
              <div className="text-[10px] font-bold text-[#141414]/70 uppercase">Rede FLUMINENSE</div>
              <div className="text-lg font-bold text-emerald-900">28 Dias Cobertura</div>
              <div className="text-[10px] text-[#141414]/60">Estoque balanceado</div>
            </div>

            <div className="bg-[#E4E3E0] p-3 rounded-sm border border-[#141414] space-y-1">
              <div className="text-[10px] font-bold text-[#141414]/70 uppercase">Rede FUTTEBOL</div>
              <div className="text-lg font-bold text-orange-950">45 Dias Cobertura</div>
              <div className="text-[10px] text-[#141414]/60">Estoque de calçados</div>
            </div>

            <div className="bg-[#E4E3E0] p-3 rounded-sm border border-[#141414] space-y-1">
              <div className="text-[10px] font-bold text-[#141414]/70 uppercase">Rede WQSURF</div>
              <div className="text-lg font-bold text-orange-950">52 Dias Cobertura</div>
              <div className="text-[10px] text-[#141414]/60">Coleção Verão</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
