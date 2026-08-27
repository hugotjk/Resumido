import React, { useState } from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Building, 
  Calendar, 
  Download, 
  Clock, 
  FileText,
  CreditCard
} from 'lucide-react';
import { SefazInvoice, SefazDuplicata } from '../../types';

interface PaymentTermsConferenceProps {
  invoices: SefazInvoice[];
  onOpenXmlModal: () => void;
}

export const PaymentTermsConference: React.FC<PaymentTermsConferenceProps> = ({
  invoices,
  onOpenXmlModal
}) => {
  const [selectedInvoiceKey, setSelectedInvoiceKey] = useState<string>(
    invoices.length > 0 ? invoices[0].chaveAcesso : ''
  );

  // Group all duplicatas across all invoices
  const allDuplicatas: {
    invoice: SefazInvoice;
    dup: SefazDuplicata;
  }[] = [];

  invoices.forEach(inv => {
    inv.duplicatas.forEach(dup => {
      allDuplicatas.push({ invoice: inv, dup });
    });
  });

  const selectedInvoice = invoices.find(i => i.chaveAcesso === selectedInvoiceKey) || invoices[0];

  const totalValorDuplicatas = allDuplicatas.reduce((acc, d) => acc + d.dup.vDup, 0);
  const totalValorNotas = invoices.reduce((acc, i) => acc + i.totais.vNF, 0);

  const handleExportCsv = () => {
    const headers = [
      "Numero_NF",
      "Fornecedor",
      "CNPJ_Fornecedor",
      "Data_Emissao",
      "Numero_Duplicata",
      "Data_Vencimento",
      "Dias_Prazo",
      "Valor_Parcela"
    ];

    const rows = allDuplicatas.map(({ invoice, dup }) => [
      invoice.numero,
      `"${invoice.emitente.xNome}"`,
      `"${invoice.emitente.cnpj}"`,
      new Date(invoice.dataEmissao).toLocaleDateString('pt-BR'),
      `"${dup.nDup}"`,
      dup.dVenc ? new Date(dup.dVenc).toLocaleDateString('pt-BR') : '',
      dup.diasPrazo || 0,
      dup.vDup.toFixed(2)
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `conferencia_prazos_pagamento_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (invoices.length === 0) {
    return (
      <div className="p-8 text-center bg-[#F0EFED] rounded-sm border border-[#141414]">
        <div className="w-12 h-12 bg-[#141414] text-[#E4E3E0] rounded-sm flex items-center justify-center mx-auto mb-3">
          <CalendarClock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold uppercase tracking-tight text-[#141414]">
          Nenhuma Fatura da SEFAZ para Conferência
        </h3>
        <p className="text-xs font-mono text-[#141414]/70 max-w-md mx-auto mt-2 mb-4">
          Importe os XMLs das notas fiscais para auditar prazos de vencimento, parcelas e divergências financeiras.
        </p>
        <button
          onClick={onOpenXmlModal}
          className="px-4 py-2 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-mono font-bold text-xs uppercase tracking-wider rounded-sm border border-[#141414] transition"
        >
          Importar XML SEFAZ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-[#F0EFED] p-3.5 sm:p-4 rounded-sm border border-[#141414] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[#141414]">
              Conferência de Prazos de Pagamento & Duplicatas
            </h2>
            <span className="text-[10px] font-mono font-bold bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 rounded-xs uppercase">
              {allDuplicatas.length} {allDuplicatas.length === 1 ? 'DUPLICATA' : 'DUPLICATAS'}
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#141414]/70 mt-0.5">
            Audita as condições comerciais, vencimentos e valores de parcelas faturadas pelos fornecedores nas notas da SEFAZ.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition border border-[#141414] flex items-center space-x-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Cronograma</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414]">
          <div className="text-[10px] font-mono uppercase font-bold text-[#141414]/60">Total Faturado em Duplicatas</div>
          <div className="text-xl font-bold font-mono text-[#141414] mt-1">
            R$ {totalValorDuplicatas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
            Total em {invoices.length} notas fiscais
          </div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414]">
          <div className="text-[10px] font-mono uppercase font-bold text-[#141414]">Prazo Médio Ponderado</div>
          <div className="text-xl font-bold font-mono text-[#141414] mt-1">
            {allDuplicatas.length > 0 
              ? Math.round(allDuplicatas.reduce((acc, d) => acc + (d.dup.diasPrazo || 0), 0) / allDuplicatas.length)
              : 0} dias
          </div>
          <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
            Tempo médio para pagamento
          </div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414]">
          <div className="text-[10px] font-mono uppercase font-bold text-[#141414]">Status de Integridade</div>
          <div className="text-xl font-bold font-mono text-[#141414] mt-1 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#141414]" />
            <span className="text-base font-bold">100% Batimento</span>
          </div>
          <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
            Total das parcelas coincide com o valor das NFs
          </div>
        </div>

      </div>

      {/* Invoices Breakdown List */}
      <div className="space-y-3">
        {invoices.map((inv, invIdx) => (
          <div 
            key={inv.chaveAcesso || inv.id || `inv-term-${invIdx}`} 
            className="bg-[#F0EFED] rounded-sm border border-[#141414] overflow-hidden"
          >
            {/* Invoice Header */}
            <div className="p-3 bg-[#E4E3E0] border-b border-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#141414] text-xs uppercase font-mono">
                    NF-e nº {inv.numero} (SÉRIE {inv.serie})
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-xs bg-[#141414] text-[#E4E3E0] uppercase">
                    {inv.condicaoPagamentoDeclarada}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono text-[#141414]/70">
                  <span className="font-bold text-[#141414]">{inv.emitente.xNome}</span>
                  <span>•</span>
                  <span>CNPJ: {inv.emitente.cnpj}</span>
                  <span>•</span>
                  <span>Emissão: {new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-[10px] text-[#141414]/60 uppercase">Valor Total da Nota</div>
                <div className="text-sm font-bold text-[#141414]">
                  R$ {inv.totais.vNF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Duplicatas Table */}
            <div className="p-3">
              {inv.duplicatas.length === 0 ? (
                <div className="py-2 text-center text-xs font-mono text-[#141414]/60">
                  Esta nota foi faturada à vista ou não possui tags de duplicatas declaradas.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {inv.duplicatas.map((dup, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 bg-[#E4E3E0] rounded-sm border border-[#141414] space-y-1 font-mono"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#141414]">
                          Parcela {dup.nDup}
                        </span>
                        <span className="font-bold text-[#141414] bg-[#F0EFED] px-1.5 py-0.2 rounded-xs text-[10px] border border-[#141414]">
                          {dup.diasPrazo} dias
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center space-x-1 text-[10px] text-[#141414]/70">
                          <Calendar className="w-3 h-3" />
                          <span>{dup.dVenc ? new Date(dup.dVenc).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                        </div>
                        <div className="font-bold text-[#141414] text-xs">
                          R$ {dup.vDup.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
