import React, { useState } from 'react';
import { 
  TrendingDown, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  Package, 
  Percent,
  Check
} from 'lucide-react';
import { ClearanceItem, PdvProduct } from '../../types';
import { MOCK_CLEARANCE } from '../../services/mockData';

interface ClearanceSuggestionProps {
  onApplyPriceToPdv: (productId: string | number, newPrice: number, newCost: number) => Promise<void>;
}

export const ClearanceSuggestion: React.FC<ClearanceSuggestionProps> = ({
  onApplyPriceToPdv
}) => {
  const [items, setItems] = useState<ClearanceItem[]>(MOCK_CLEARANCE);
  const [appliedMap, setAppliedMap] = useState<Record<string | number, boolean>>({});
  const [targetDiscount, setTargetDiscount] = useState<number>(30);

  const totalCapitalRecuperavel = items.reduce((acc, i) => acc + (i.precoLiquidacaoSugerido * i.estoqueAtual), 0);
  const totalPecasParadas = items.reduce((acc, i) => acc + i.estoqueAtual, 0);

  const handleApplyClearance = async (item: ClearanceItem) => {
    await onApplyPriceToPdv(item.id, item.precoLiquidacaoSugerido, item.custoUnitario);
    setAppliedMap(prev => ({ ...prev, [item.id]: true }));
  };

  const handleExportCsv = () => {
    const headers = [
      "Codigo",
      "Referencia",
      "Descricao",
      "Categoria",
      "Estoque_Parado",
      "Custo_Unitario",
      "Preco_Original",
      "Dias_Sem_Venda",
      "Desconto_%",
      "Preco_Liquidacao",
      "Novo_MKP",
      "Margem_Residual_%",
      "Capital_Estimado"
    ];

    const rows = items.map(i => [
      `"${i.codigo}"`,
      `"${i.referencia}"`,
      `"${i.descricao}"`,
      `"${i.categoria}"`,
      i.estoqueAtual,
      i.custoUnitario.toFixed(2),
      i.precoVendaOriginal.toFixed(2),
      i.diasSemVenda,
      i.descontoSugeridoPercentual,
      i.precoLiquidacaoSugerido.toFixed(2),
      i.novoMkp.toFixed(2),
      i.margemResidualPercentual.toFixed(1),
      (i.precoLiquidacaoSugerido * i.estoqueAtual).toFixed(2)
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sugestao_liquidacao_queima_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-[#F0EFED] p-3.5 sm:p-4 rounded-sm border border-[#141414] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[#141414]">
              Sugestão de Liquidação & Queima de Estoque
            </h2>
            <span className="text-[10px] font-mono font-bold bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 rounded-xs uppercase">
              Giro Lento (&gt; 60 dias)
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#141414]/70 mt-0.5">
            Identifica produtos com alto estoque parado há mais de 60 dias e calcula preços promocionais de queima preservando a margem mínima.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition border border-[#141414] flex items-center space-x-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Remarcação</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414]">
          <div className="text-[10px] font-mono uppercase font-bold text-[#141414]/60">Capital a Recuperar (Caixa)</div>
          <div className="text-xl font-bold font-mono text-[#141414] mt-1">
            R$ {totalCapitalRecuperavel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
            Recuperação estimada de fluxo
          </div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414]">
          <div className="text-[10px] font-mono uppercase font-bold text-[#141414]">Peças Paradas no Estoque</div>
          <div className="text-xl font-bold font-mono text-[#141414] mt-1">
            {totalPecasParadas} unidades
          </div>
          <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
            Distribuição em {items.length} referências
          </div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414]">
          <div className="text-[10px] font-mono uppercase font-bold text-[#141414]">Desconto Médio Recomendado</div>
          <div className="text-xl font-bold font-mono text-[#141414] mt-1">
            30% OFF
          </div>
          <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
            Margem residual positiva garantida
          </div>
        </div>

      </div>

      {/* Items Table */}
      <div className="bg-[#F0EFED] rounded-sm border border-[#141414] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-[#141414] text-[#E4E3E0] border-b border-[#141414] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Produto</th>
                <th className="py-2.5 px-2.5">Estoque / Sem Venda</th>
                <th className="py-2.5 px-2.5">Custo Unitário</th>
                <th className="py-2.5 px-2.5">Preço Original</th>
                <th className="py-2.5 px-2.5">Desconto %</th>
                <th className="py-2.5 px-2.5">Preço Queima</th>
                <th className="py-2.5 px-2.5">Margem Res.</th>
                <th className="py-2.5 px-2.5">Capital Gerado</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/15">
              {items.map(item => {
                const isApplied = appliedMap[item.id];

                return (
                  <tr key={item.id} className="hover:bg-[#E4E3E0]/60 transition">
                    
                    <td className="py-2 px-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#141414] text-xs font-sans">
                          {item.descricao}
                        </div>
                        <div className="text-[10px] text-[#141414]/60">
                          Ref: {item.referencia} • {item.categoria}
                        </div>
                      </div>
                    </td>

                    <td className="py-2 px-2.5">
                      <div className="font-bold text-[#141414]">
                        {item.estoqueAtual} peças
                      </div>
                      <div className="text-[10px] text-[#141414]/70">
                        {item.diasSemVenda} dias sem giro
                      </div>
                    </td>

                    <td className="py-2 px-2.5 text-[#141414]">
                      R$ {item.custoUnitario.toFixed(2)}
                    </td>

                    <td className="py-2 px-2.5 text-[#141414]/50 line-through">
                      R$ {item.precoVendaOriginal.toFixed(2)}
                    </td>

                    <td className="py-2 px-2.5">
                      <span className="bg-[#E4E3E0] text-[#141414] border border-[#141414] px-1.5 py-0.2 rounded-xs font-bold text-[10px]">
                        -{item.descontoSugeridoPercentual}%
                      </span>
                    </td>

                    <td className="py-2 px-2.5">
                      <div className="font-bold text-[#141414] text-xs">
                        R$ {item.precoLiquidacaoSugerido.toFixed(2)}
                      </div>
                      <div className="text-[9px] text-[#141414]/60">
                        MKP: {item.novoMkp.toFixed(2)}x
                      </div>
                    </td>

                    <td className="py-2 px-2.5 font-bold text-[#141414]">
                      {item.margemResidualPercentual.toFixed(1)}%
                    </td>

                    <td className="py-2 px-2.5 font-bold text-[#141414]">
                      R$ {(item.precoLiquidacaoSugerido * item.estoqueAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleApplyClearance(item)}
                        className={`px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition inline-flex items-center space-x-1 border border-[#141414] ${
                          isApplied 
                            ? 'bg-[#E4E3E0] text-[#141414]'
                            : 'bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0]'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Remarcado</span>
                          </>
                        ) : (
                          <span>Remarcar</span>
                        )}
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
