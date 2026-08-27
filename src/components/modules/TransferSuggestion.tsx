import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  FileCheck,
  TrendingUp,
  PackageCheck
} from 'lucide-react';
import { TransferSuggestionItem } from '../../types';
import { MOCK_TRANSFERS } from '../../services/mockData';

export const TransferSuggestion: React.FC = () => {
  const [transfers, setTransfers] = useState<TransferSuggestionItem[]>(MOCK_TRANSFERS);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  const handleComplete = (id: string) => {
    setCompletedMap(prev => ({ ...prev, [id]: true }));
  };

  const handleExportCsv = () => {
    const headers = [
      "ID_Sugestao",
      "Codigo",
      "Referencia",
      "Descricao",
      "Loja_Origem",
      "Estoque_Origem",
      "Cobertura_Origem_Dias",
      "Loja_Destino",
      "Estoque_Destino",
      "Cobertura_Destino_Dias",
      "Qtd_Transferir",
      "Urgencia",
      "Justificativa"
    ];

    const rows = transfers.map(t => [
      t.id,
      `"${t.codigo}"`,
      `"${t.referencia}"`,
      `"${t.descricao}"`,
      `"${t.lojaOrigemNome}"`,
      t.estoqueOrigem,
      t.diasCoberturaOrigem,
      `"${t.lojaDestinoNome}"`,
      t.estoqueDestino,
      t.diasCoberturaDestino,
      t.quantidadeSugeridaTransferir,
      t.urgencia,
      `"${t.justificativa}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `guia_remanejamento_transferencia_${new Date().toISOString().split('T')[0]}.csv`);
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
              Sugestão de Remanejamento & Transferência entre Lojas
            </h2>
            <span className="text-[10px] font-mono font-bold bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 rounded-xs uppercase">
              Otimização de Ruptura
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#141414]/70 mt-0.5">
            Equilibra o estoque entre filiais, transferindo mercadorias de lojas com baixo giro para lojas com risco iminente de falta de produto.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition border border-[#141414] flex items-center space-x-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Ordem</span>
        </button>
      </div>

      {/* Transfer Cards */}
      <div className="space-y-3">
        {transfers.map(item => {
          const isDone = completedMap[item.id];

          return (
            <div 
              key={item.id}
              className="bg-[#F0EFED] rounded-sm border border-[#141414] p-3.5 space-y-3 font-mono"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#141414]/20 pb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#141414] text-xs font-sans">
                      {item.descricao}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded-xs text-[10px] font-bold border border-[#141414] ${
                      item.urgencia === 'CRITICA'
                        ? 'bg-[#141414] text-[#E4E3E0]'
                        : 'bg-[#E4E3E0] text-[#141414]'
                    }`}>
                      {item.urgencia === 'CRITICA' ? 'URGÊNCIA CRÍTICA' : 'RECOMENDADA'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#141414]/60 mt-0.5">
                    Código: <span className="font-bold text-[#141414]">{item.codigo}</span> • Ref: {item.referencia} • {item.categoria}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-[9px] uppercase text-[#141414]/60">Transferir:</div>
                    <div className="text-sm font-bold text-[#141414]">
                      {item.quantidadeSugeridaTransferir} unidades
                    </div>
                  </div>
                </div>
              </div>

              {/* Origin -> Destination comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                
                {/* Origin */}
                <div className="p-2.5 bg-[#E4E3E0] rounded-sm border border-[#141414] space-y-1.5">
                  <div className="flex items-center space-x-1.5 font-bold text-[#141414] uppercase text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-[#141414]" />
                    <span>ORIGEM (Sobra): {item.lojaOrigemNome}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[#141414]">
                    <div>
                      <span className="text-[9px] text-[#141414]/60 uppercase block">Estoque:</span>
                      <span className="font-bold">{item.estoqueOrigem} un</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#141414]/60 uppercase block">Venda (30d):</span>
                      <span className="font-bold">{item.vendaOrigemUltimos30d} un</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#141414]/60 uppercase block">Cobertura:</span>
                      <span className="font-bold">{item.diasCoberturaOrigem} dias</span>
                    </div>
                  </div>
                </div>

                {/* Destination */}
                <div className="p-2.5 bg-[#E4E3E0] rounded-sm border border-[#141414] space-y-1.5">
                  <div className="flex items-center space-x-1.5 font-bold text-[#141414] uppercase text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-[#141414]" />
                    <span>DESTINO (Demanda): {item.lojaDestinoNome}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[#141414]">
                    <div>
                      <span className="text-[9px] text-[#141414]/60 uppercase block">Estoque:</span>
                      <span className="font-bold">{item.estoqueDestino} un</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#141414]/60 uppercase block">Venda (30d):</span>
                      <span className="font-bold">{item.vendaDestinoUltimos30d} un</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#141414]/60 uppercase block">Cobertura:</span>
                      <span className="font-bold">{item.diasCoberturaDestino} dias (Risco)</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Justification and Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                <p className="text-[#141414]/80 text-[11px] font-sans">
                  <span className="font-bold font-mono">OBS:</span> {item.justificativa}
                </p>

                <button
                  onClick={() => handleComplete(item.id)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition shrink-0 flex items-center space-x-1.5 border border-[#141414] ${
                    isDone
                      ? 'bg-[#E4E3E0] text-[#141414]'
                      : 'bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0]'
                  }`}
                >
                  {isDone ? (
                    <>
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Guia Emitida</span>
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Gerar Transferência</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
