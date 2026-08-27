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
  RotateCcw
} from 'lucide-react';
import { ReportMovRes, ReportConsolidado } from '../../types';

interface ReportsProps {
  movRes: ReportMovRes;
  consolidado: ReportConsolidado;
  onRefreshMovRes: (date: string) => Promise<void>;
  isLoading: boolean;
}

export const Reports: React.FC<ReportsProps> = ({
  movRes,
  consolidado,
  onRefreshMovRes,
  isLoading
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'movRes' | 'consolidado'>('movRes');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    onRefreshMovRes(e.target.value);
  };

  const handleExportMovResCsv = () => {
    const lines = [
      "RELATORIO DE MOVIMENTO RESUMIDO (MOV RES)",
      `Data;${movRes.data}`,
      `Filial;${movRes.filialNome}`,
      "",
      "INDICADOR;VALOR",
      `Total Vendas Bruto;R$ ${movRes.totalVendasBruto.toFixed(2)}`,
      `Total Descontos;R$ ${movRes.totalDescontos.toFixed(2)}`,
      `Total Vendas Liquido;R$ ${movRes.totalVendasLiquido.toFixed(2)}`,
      `Custo da Mercadoria (CMV);R$ ${movRes.totalCustoMercadoria.toFixed(2)}`,
      `Lucro Bruto;R$ ${movRes.lucroBruto.toFixed(2)}`,
      `Margem Bruta (%);${movRes.margemBrutaPercentual.toFixed(2)}%`,
      `Quantidade de Atendimentos;${movRes.quantidadeAtendimentos}`,
      `Total de Pecas Vendidas;${movRes.quantidadePecasVendidas}`,
      `Ticket Medio;R$ ${movRes.ticketMedioValor.toFixed(2)}`,
      `Pecas Por Atendimento (P.A.);${movRes.pecasPorAtendimento.toFixed(2)}`,
      `Preco Medio por Peca;R$ ${movRes.precoMedioPeca.toFixed(2)}`,
      "",
      "FORMAS DE PAGAMENTO;VALOR",
      `Cartao de Credito;R$ ${movRes.formasPagamento.cartaoCredito.toFixed(2)}`,
      `Cartao de Debito;R$ ${movRes.formasPagamento.cartaoDebito.toFixed(2)}`,
      `PIX;R$ ${movRes.formasPagamento.pix.toFixed(2)}`,
      `Dinheiro;R$ ${movRes.formasPagamento.dinheiro.toFixed(2)}`,
      `Crediario / Boleto;R$ ${movRes.formasPagamento.crediario.toFixed(2)}`,
      `Devolucoes;R$ ${movRes.totalDevolucoes.toFixed(2)}`,
      `Cancelamentos;R$ ${movRes.totalCancelamentos.toFixed(2)}`
    ];

    const csvContent = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `movimento_resumido_${movRes.data}.csv`);
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

    const rowsLojas = consolidado.lojas.map(l => [
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
    movRes.formasPagamento.cartaoCredito +
    movRes.formasPagamento.cartaoDebito +
    movRes.formasPagamento.pix +
    movRes.formasPagamento.dinheiro +
    movRes.formasPagamento.crediario
  );

  return (
    <div className="space-y-4">
      
      {/* Top bar with subtabs */}
      <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Tab selector */}
        <div className="flex items-center space-x-1 bg-[#E4E3E0] p-1 rounded-sm border border-[#141414]">
          <button
            onClick={() => setActiveReportTab('movRes')}
            className={`px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase transition ${
              activeReportTab === 'movRes'
                ? 'bg-[#141414] text-[#E4E3E0]'
                : 'text-[#141414]/70 hover:text-[#141414]'
            }`}
          >
            Movimento Resumido (Mov Res)
          </button>
          <button
            onClick={() => setActiveReportTab('consolidado')}
            className={`px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase transition ${
              activeReportTab === 'consolidado'
                ? 'bg-[#141414] text-[#E4E3E0]'
                : 'text-[#141414]/70 hover:text-[#141414]'
            }`}
          >
            Relatório Consolidado (Multilojas)
          </button>
        </div>

        {/* Date picker & export */}
        <div className="flex items-center space-x-2">
          {activeReportTab === 'movRes' && (
            <div className="flex items-center space-x-1.5 bg-[#E4E3E0] px-2.5 py-1 rounded-sm border border-[#141414] text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-[#141414]/70" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                aria-label="Selecionar Data do Movimento"
                className="bg-transparent font-bold text-[#141414] focus:outline-none uppercase"
              />
            </div>
          )}

          <button
            onClick={activeReportTab === 'movRes' ? handleExportMovResCsv : handleExportConsolidadoCsv}
            className="px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition flex items-center space-x-1.5 border border-[#141414]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>

      </div>

      {activeReportTab === 'movRes' ? (
        /* MOV RES TAB */
        <div className="space-y-4">
          
          {/* Main KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] space-y-0.5">
              <div className="text-[10px] font-mono uppercase font-bold text-[#141414]/60">Venda Líquida do Dia</div>
              <div className="text-xl font-bold font-mono text-[#141414]">
                R$ {movRes.totalVendasLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-mono text-[#141414]/70">
                Bruta: R$ {movRes.totalVendasBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] space-y-0.5">
              <div className="text-[10px] font-mono uppercase font-bold text-[#141414]">Lucro Bruto / Margem</div>
              <div className="text-xl font-bold font-mono text-[#141414]">
                R$ {movRes.lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-mono font-bold text-[#141414]">
                Margem média: {movRes.margemBrutaPercentual.toFixed(1)}%
              </div>
            </div>

            <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] space-y-0.5">
              <div className="text-[10px] font-mono uppercase font-bold text-[#141414]">Ticket Médio (R$)</div>
              <div className="text-xl font-bold font-mono text-[#141414]">
                R$ {movRes.ticketMedioValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-mono text-[#141414]/70">
                {movRes.quantidadeAtendimentos} atendimentos realizados
              </div>
            </div>

            <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] space-y-0.5">
              <div className="text-[10px] font-mono uppercase font-bold text-[#141414]">Peças por Atendimento (P.A.)</div>
              <div className="text-xl font-bold font-mono text-[#141414]">
                {movRes.pecasPorAtendimento.toFixed(2)} peças
              </div>
              <div className="text-[10px] font-mono text-[#141414]/70">
                {movRes.quantidadePecasVendidas} peças vendidas
              </div>
            </div>

          </div>

          {/* Payment Methods and Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            
            {/* Payment Methods */}
            <div className="bg-[#F0EFED] p-3.5 rounded-sm border border-[#141414] space-y-3">
              <div className="flex items-center justify-between border-b border-[#141414] pb-2 font-mono">
                <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#141414]" />
                  <span>Vendas por Meio de Pagamento</span>
                </h3>
                <span className="text-[10px] font-bold text-[#141414]">
                  Total: R$ {formasPagamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-2 font-mono">
                {[
                  { label: 'Cartão de Crédito', val: movRes.formasPagamento.cartaoCredito },
                  { label: 'PIX', val: movRes.formasPagamento.pix },
                  { label: 'Cartão de Débito', val: movRes.formasPagamento.cartaoDebito },
                  { label: 'Dinheiro em Espécie', val: movRes.formasPagamento.dinheiro },
                  { label: 'Crediário / Boleto', val: movRes.formasPagamento.crediario },
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
            <div className="bg-[#F0EFED] p-3.5 rounded-sm border border-[#141414] space-y-3">
              <div className="flex items-center justify-between border-b border-[#141414] pb-2 font-mono">
                <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-[#141414]" />
                  <span>Resumo Operacional & Descontos</span>
                </h3>
              </div>

              <div className="space-y-2 text-xs font-mono">
                
                <div className="flex items-center justify-between p-2 bg-[#E4E3E0] rounded-sm border border-[#141414]">
                  <span className="text-[#141414]/80">Total de Descontos Concedidos:</span>
                  <span className="font-bold text-[#141414]">
                    R$ {movRes.totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-[#E4E3E0] rounded-sm border border-[#141414]">
                  <span className="text-[#141414]/80">Devoluções / Trocas:</span>
                  <span className="font-bold text-[#141414]">
                    R$ {movRes.totalDevolucoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-[#E4E3E0] rounded-sm border border-[#141414]">
                  <span className="text-[#141414]/80">Cancelamentos no PDV:</span>
                  <span className="font-bold text-[#141414]">
                    R$ {movRes.totalCancelamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-[#E4E3E0] rounded-sm border border-[#141414]">
                  <span className="text-[#141414]/80">Horário de Maior Movimento:</span>
                  <span className="font-bold text-[#141414]">
                    {movRes.horarioPico || "15h às 18h"}
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>
      ) : (
        /* CONSOLIDADO TAB */
        <div className="space-y-4">
          
          {/* Lojas Performance Table */}
          <div className="bg-[#F0EFED] rounded-sm border border-[#141414] overflow-hidden">
            <div className="p-3 bg-[#E4E3E0] border-b border-[#141414] flex items-center justify-between font-mono">
              <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#141414]" />
                <span>Desempenho Consolidado por Loja / Filial</span>
              </h3>
              <span className="text-[10px] text-[#141414]/70">
                Período: {consolidado.periodo.inicio} a {consolidado.periodo.fim}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0] border-b border-[#141414] font-mono text-[10px] uppercase tracking-wider">
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
                <tbody className="divide-y divide-[#141414]/15 font-mono">
                  {consolidado.lojas.map(loja => (
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
            <h3 className="font-bold text-[#141414] text-xs font-mono uppercase flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-[#141414]" />
              <span>Participação por Departamento / Categoria</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
              {consolidado.categorias.map((cat, idx) => (
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

    </div>
  );
};
