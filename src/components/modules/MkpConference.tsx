import React, { useState } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  Search, 
  ArrowUpDown, 
  SlidersHorizontal,
  Info,
  Check,
  Building,
  DollarSign
} from 'lucide-react';
import { SefazInvoice, SefazItem, MkpConfig, PdvProduct } from '../../types';

interface MkpConferenceProps {
  invoices: SefazInvoice[];
  mkpConfig: MkpConfig;
  onUpdateMkpConfig: (newConfig: MkpConfig) => void;
  onApplyPriceToPdv: (productId: string | number, newPrice: number, newCost: number) => Promise<void>;
  onOpenXmlModal: () => void;
}

export const MkpConference: React.FC<MkpConferenceProps> = ({
  invoices,
  mkpConfig,
  onUpdateMkpConfig,
  onApplyPriceToPdv,
  onOpenXmlModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ABAIXO_META' | 'CUSTO_AUMENTOU' | 'PREJUIZO'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [appliedItems, setAppliedItems] = useState<Record<string, boolean>>({});
  const [activeItemDetail, setActiveItemDetail] = useState<SefazItem | null>(null);

  // Flatten all items across loaded invoices
  const allItems: { item: SefazItem; invoice: SefazInvoice }[] = [];
  invoices.forEach(inv => {
    inv.itens.forEach(item => {
      allItems.push({ item, invoice: inv });
    });
  });

  // Calculate dynamic MKP and status based on current config meta
  const enrichedItems = allItems.map(({ item, invoice }) => {
    const custo = item.custoLiquidoUnitario;
    const custoAnterior = item.pdvProduct?.custo || custo;
    const variacaoCustoPercentual = custoAnterior > 0 ? (((custo - custoAnterior) / custoAnterior) * 100) : 0;
    
    const precoVendaAtual = item.pdvProduct ? item.pdvProduct.precoVenda : (custo * mkpConfig.metaMkpPadrao);
    const mkpAtual = custo > 0 ? (precoVendaAtual / custo) : mkpConfig.metaMkpPadrao;
    const precoSugerido = custo * mkpConfig.metaMkpPadrao;
    const margemBrutaAtual = precoVendaAtual > 0 ? (((precoVendaAtual - custo) / precoVendaAtual) * 100) : 0;
    const margemSugerida = precoSugerido > 0 ? (((precoSugerido - custo) / precoSugerido) * 100) : 0;

    let statusMkp: SefazItem['statusMkp'] = 'NA_META';
    if (precoVendaAtual < custo) {
      statusMkp = 'PREJUIZO';
    } else if (mkpAtual < mkpConfig.metaMkpPadrao * 0.95) {
      statusMkp = 'ABAIXO_META';
    } else if (mkpAtual > mkpConfig.metaMkpPadrao * 1.10) {
      statusMkp = 'ACIMA_META';
    }

    return {
      item,
      invoice,
      custo,
      custoAnterior,
      variacaoCustoPercentual,
      precoVendaAtual,
      mkpAtual,
      precoSugerido,
      margemBrutaAtual,
      margemSugerida,
      statusMkp
    };
  });

  // Filter items
  const filtered = enrichedItems.filter(({ item, variacaoCustoPercentual, statusMkp }) => {
    const matchesSearch = 
      item.xProd.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cProd.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cEAN.includes(searchTerm) ||
      (item.pdvProduct?.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ABAIXO_META') return statusMkp === 'ABAIXO_META' || statusMkp === 'PREJUIZO';
    if (statusFilter === 'CUSTO_AUMENTOU') return variacaoCustoPercentual > 1.0;
    if (statusFilter === 'PREJUIZO') return statusMkp === 'PREJUIZO';

    return true;
  });

  // Metrics
  const totalItens = enrichedItems.length;
  const countAbaixoMeta = enrichedItems.filter(i => i.statusMkp === 'ABAIXO_META' || i.statusMkp === 'PREJUIZO').length;
  const countCustoAumentou = enrichedItems.filter(i => i.variacaoCustoPercentual > 2.0).length;
  const mediaMkp = totalItens > 0 
    ? (enrichedItems.reduce((acc, i) => acc + i.mkpAtual, 0) / totalItens)
    : 0;

  const handleApplyPrice = async (item: SefazItem, newPrice: number, newCost: number) => {
    if (!item.pdvProduct) return;
    const prodId = item.pdvProduct.id;
    setUpdatingId(prodId);
    try {
      await onApplyPriceToPdv(prodId, newPrice, newCost);
      setAppliedItems(prev => ({ ...prev, [prodId]: true }));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApplyAllSuggested = async () => {
    for (const enriched of filtered) {
      if (enriched.item.pdvProduct) {
        await onApplyPriceToPdv(
          enriched.item.pdvProduct.id, 
          enriched.precoSugerido, 
          enriched.custo
        );
        setAppliedItems(prev => ({ ...prev, [enriched.item.pdvProduct!.id]: true }));
      }
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Numero_NF",
      "Fornecedor",
      "Codigo_Fornecedor",
      "Descricao_SEFAZ",
      "EAN",
      "Codigo_PDV",
      "Descricao_PDV",
      "Custo_NF",
      "Custo_Anterior_PDV",
      "Variacao_Custo_%",
      "Preco_Venda_Atual",
      "MKP_Atual",
      "Meta_MKP",
      "Preco_Sugerido",
      "Margem_Bruta_%",
      "Status_MKP"
    ];

    const rows = filtered.map(i => [
      i.invoice.numero,
      `"${i.invoice.emitente.xNome}"`,
      `"${i.item.cProd}"`,
      `"${i.item.xProd}"`,
      `"${i.item.cEAN}"`,
      `"${i.item.pdvProduct?.codigo || 'NAO_CADASTRADO'}"`,
      `"${i.item.pdvProduct?.descricao || ''}"`,
      i.custo.toFixed(2),
      i.custoAnterior.toFixed(2),
      i.variacaoCustoPercentual.toFixed(2),
      i.precoVendaAtual.toFixed(2),
      i.mkpAtual.toFixed(2),
      mkpConfig.metaMkpPadrao.toFixed(2),
      i.precoSugerido.toFixed(2),
      i.margemBrutaAtual.toFixed(2),
      i.statusMkp
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `conferencia_mkp_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (invoices.length === 0) {
    return (
      <div className="p-8 text-center bg-[#F0EFED] rounded-sm border border-[#141414]">
        <div className="w-12 h-12 bg-[#141414] text-[#E4E3E0] rounded-sm flex items-center justify-center mx-auto mb-3">
          <Calculator className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold uppercase tracking-tight text-[#141414]">
          Nenhuma Nota Fiscal da SEFAZ Carregada
        </h3>
        <p className="text-xs font-mono text-[#141414]/70 max-w-md mx-auto mt-2 mb-4">
          Para realizar a conferência de Markup e precificação, importe um arquivo XML da SEFAZ ou carregue o exemplo de demonstração.
        </p>
        <button
          onClick={onOpenXmlModal}
          className="px-4 py-2 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-mono font-bold text-xs uppercase tracking-wider rounded-sm border border-[#141414] transition"
        >
          Importar XML de Notas Fiscais
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Top Header & Settings bar */}
      <div className="bg-[#F0EFED] p-3.5 sm:p-4 rounded-sm border border-[#141414] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[#141414]">
              Conferência de Markup (MKP) & Precificação
            </h2>
            <span className="text-[10px] font-mono font-bold bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 rounded-xs uppercase">
              {invoices.length} {invoices.length === 1 ? 'NOTA SEFAZ' : 'NOTAS SEFAZ'}
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#141414]/70 mt-0.5">
            Cruza o custo líquido de entrada das notas da SEFAZ com os preços de venda atuais cadastrados no sistema PDV.
          </p>
        </div>

        {/* Target Markup Configurator Slider */}
        <div className="flex items-center space-x-3 bg-[#E4E3E0] px-3 py-2 rounded-sm border border-[#141414] w-full md:w-auto">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between space-x-3 text-xs font-mono font-bold text-[#141414]">
              <span className="flex items-center space-x-1 uppercase text-[10px]">
                <SlidersHorizontal className="w-3 h-3 text-[#141414]" />
                <span>Meta MKP:</span>
              </span>
              <span className="text-[#141414] font-bold text-xs bg-[#F0EFED] px-1.5 py-0.2 rounded-xs border border-[#141414]/30">
                {mkpConfig.metaMkpPadrao.toFixed(2)}x
              </span>
            </div>
            <p className="text-[9px] font-mono text-[#141414]/60 uppercase">
              Margem Bruta eq.: {(((mkpConfig.metaMkpPadrao - 1) / mkpConfig.metaMkpPadrao) * 100).toFixed(1)}%
            </p>
          </div>

          <input
            type="range"
            min="1.40"
            max="3.50"
            step="0.05"
            value={mkpConfig.metaMkpPadrao}
            onChange={(e) => onUpdateMkpConfig({ ...mkpConfig, metaMkpPadrao: parseFloat(e.target.value) })}
            aria-label="Ajustar Meta de Markup Global"
            className="w-28 accent-[#141414] cursor-pointer"
          />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414]">
          <div className="flex items-center justify-between text-[#141414]/60 text-[10px] font-mono uppercase font-bold">
            <span>Total Analisado</span>
            <Calculator className="w-3.5 h-3.5 text-[#141414]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#141414] mt-1">
            {totalItens}
          </div>
          <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
            Média MKP: <span className="font-bold text-[#141414]">{mediaMkp.toFixed(2)}x</span>
          </div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414]">
          <div className="flex items-center justify-between text-[#141414] text-[10px] font-mono uppercase font-bold">
            <span>Abaixo da Meta MKP</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#141414]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#141414] mt-1">
            {countAbaixoMeta}
          </div>
          <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
            Necessitam reajuste de venda
          </div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414]">
          <div className="flex items-center justify-between text-[#141414] text-[10px] font-mono uppercase font-bold">
            <span>Aumento de Custo</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#141414]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#141414] mt-1">
            {countCustoAumentou}
          </div>
          <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
            Custo superior ao histórico
          </div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#141414] text-[10px] font-mono uppercase font-bold">
            <span>Ações em Lote</span>
            <Sparkles className="w-3.5 h-3.5 text-[#141414]" />
          </div>
          <div className="flex items-center space-x-1.5 mt-1.5">
            <button
              onClick={handleApplyAllSuggested}
              className="flex-1 py-1 px-2.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider border border-[#141414] transition"
              title="Aplica todos os preços sugeridos calculados para os produtos cadastrados"
            >
              Aplicar Sugestões
            </button>
            <button
              onClick={handleExportCsv}
              className="p-1 bg-[#E4E3E0] hover:bg-[#d8d7d4] text-[#141414] rounded-sm text-xs transition border border-[#141414]"
              title="Exportar tabela completa em CSV / Excel"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] flex flex-col sm:flex-row items-center justify-between gap-2.5">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#141414]/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por produto, código ou EAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono bg-[#E4E3E0] border border-[#141414] rounded-sm focus:outline-none text-[#141414] placeholder-[#141414]/40"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition border border-[#141414] ${
              statusFilter === 'ALL'
                ? 'bg-[#141414] text-[#E4E3E0]'
                : 'bg-[#E4E3E0] text-[#141414] hover:bg-[#d8d7d4]'
            }`}
          >
            Todos ({enrichedItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('ABAIXO_META')}
            className={`px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition border border-[#141414] ${
              statusFilter === 'ABAIXO_META'
                ? 'bg-[#141414] text-[#E4E3E0]'
                : 'bg-[#E4E3E0] text-[#141414] hover:bg-[#d8d7d4]'
            }`}
          >
            Abaixo da Meta ({countAbaixoMeta})
          </button>
          <button
            onClick={() => setStatusFilter('CUSTO_AUMENTOU')}
            className={`px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition border border-[#141414] ${
              statusFilter === 'CUSTO_AUMENTOU'
                ? 'bg-[#141414] text-[#E4E3E0]'
                : 'bg-[#E4E3E0] text-[#141414] hover:bg-[#d8d7d4]'
            }`}
          >
            Custo Subiu ({countCustoAumentou})
          </button>
        </div>

      </div>

      {/* Data Table */}
      <div className="bg-[#F0EFED] rounded-sm border border-[#141414] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141414] text-[#E4E3E0] border-b border-[#141414] font-mono text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Item / NF-e</th>
                <th className="py-2.5 px-2.5">Custo NF</th>
                <th className="py-2.5 px-2.5">Custo Ant.</th>
                <th className="py-2.5 px-2.5">Preço PDV</th>
                <th className="py-2.5 px-2.5">MKP Atual</th>
                <th className="py-2.5 px-2.5">Preço Sugerido</th>
                <th className="py-2.5 px-2.5">Margem</th>
                <th className="py-2.5 px-2.5 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/15">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center font-mono text-xs text-[#141414]/60">
                    Nenhum item encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map(({ item, invoice, custo, custoAnterior, variacaoCustoPercentual, precoVendaAtual, mkpAtual, precoSugerido, margemBrutaAtual, statusMkp }) => {
                  const isRegistered = !!item.pdvProduct;
                  const prodId = item.pdvProduct?.id;
                  const isApplied = prodId ? appliedItems[prodId] : false;

                  return (
                    <tr key={`${invoice.chaveAcesso}-${item.nItem}`} className="hover:bg-[#E4E3E0]/60 transition">
                      
                      {/* Item Info */}
                      <td className="py-2 px-3">
                        <div className="space-y-0.5 max-w-xs">
                          <div className="font-bold text-[#141414] truncate text-xs">
                            {item.xProd}
                          </div>
                          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#141414]/60">
                            <span>cProd: {item.cProd}</span>
                            <span>•</span>
                            <span>NF {invoice.numero}</span>
                            {item.cEAN && item.cEAN !== 'SEM GTIN' && (
                              <>
                                <span>•</span>
                                <span className="font-mono">{item.cEAN}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Custo NF */}
                      <td className="py-2 px-2.5 font-mono">
                        <div className="font-bold text-[#141414]">
                          R$ {custo.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-[#141414]/60">
                          {item.qCom} {item.uCom}
                        </div>
                      </td>

                      {/* Custo Anterior & Variação */}
                      <td className="py-2 px-2.5 font-mono">
                        {isRegistered ? (
                          <div>
                            <span className="text-[#141414]">
                              R$ {custoAnterior.toFixed(2)}
                            </span>
                            {Math.abs(variacaoCustoPercentual) > 0.1 && (
                              <div className="text-[9px] font-bold flex items-center space-x-0.5 text-[#141414]">
                                {variacaoCustoPercentual > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                <span>{variacaoCustoPercentual > 0 ? `+${variacaoCustoPercentual.toFixed(1)}%` : `${variacaoCustoPercentual.toFixed(1)}%`}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#141414]/50 italic">Novo</span>
                        )}
                      </td>

                      {/* Preço Atual PDV */}
                      <td className="py-2 px-2.5 font-mono">
                        {isRegistered ? (
                          <span className="font-bold text-[#141414]">
                            R$ {precoVendaAtual.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[#141414]/50 italic text-[10px]">Não cadastrado</span>
                        )}
                      </td>

                      {/* MKP Praticado */}
                      <td className="py-2 px-2.5 font-mono">
                        <span className="font-bold text-xs bg-[#E4E3E0] px-1.5 py-0.5 rounded-xs border border-[#141414]/30 text-[#141414]">
                          {mkpAtual.toFixed(2)}x
                        </span>
                      </td>

                      {/* Preço Sugerido */}
                      <td className="py-2 px-2.5 font-mono">
                        <div className="font-bold text-[#141414]">
                          R$ {precoSugerido.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-[#141414]/60">
                          Meta {mkpConfig.metaMkpPadrao.toFixed(2)}x
                        </div>
                      </td>

                      {/* Margem Bruta */}
                      <td className="py-2 px-2.5 font-mono">
                        <span className="font-bold text-[#141414]">
                          {margemBrutaAtual.toFixed(1)}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-2.5 text-center font-mono">
                        {statusMkp === 'PREJUIZO' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-xs bg-[#141414] text-[#E4E3E0] border border-[#141414]">
                            Prejuízo
                          </span>
                        )}
                        {statusMkp === 'ABAIXO_META' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-xs bg-[#E4E3E0] text-[#141414] border border-[#141414]">
                            Abaixo Meta
                          </span>
                        )}
                        {statusMkp === 'NA_META' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-xs bg-[#F0EFED] text-[#141414] border border-[#141414]/40">
                            Na Meta
                          </span>
                        )}
                        {statusMkp === 'ACIMA_META' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-xs bg-[#141414] text-[#E4E3E0] border border-[#141414]">
                            Margem Alta
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2 px-3 text-right">
                        {isRegistered ? (
                          <button
                            onClick={() => handleApplyPrice(item, precoSugerido, custo)}
                            disabled={updatingId === prodId}
                            className={`px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition inline-flex items-center space-x-1 border border-[#141414] ${
                              isApplied
                                ? 'bg-[#E4E3E0] text-[#141414]'
                                : 'bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0]'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <Check className="w-2.5 h-2.5" />
                                <span>Aplicado</span>
                              </>
                            ) : (
                              <span>Aplicar R$ {precoSugerido.toFixed(2)}</span>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-[#141414]/50">Pendente Cad.</span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
