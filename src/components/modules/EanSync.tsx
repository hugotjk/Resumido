import React, { useState } from 'react';
import { 
  Barcode, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Search, 
  Download, 
  Check, 
  AlertCircle,
  PackageCheck
} from 'lucide-react';
import { SefazInvoice, PdvProduct } from '../../types';

interface EanSyncProps {
  invoices: SefazInvoice[];
  pdvProducts: PdvProduct[];
  onUpdateProductEan: (productId: string | number, newEan: string) => Promise<boolean>;
  onOpenXmlModal: () => void;
}

export const EanSync: React.FC<EanSyncProps> = ({
  invoices,
  pdvProducts,
  onUpdateProductEan,
  onOpenXmlModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [syncedIds, setSyncedIds] = useState<Record<string | number, boolean>>({});
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Find products in PDV that lack EAN but have matching item in SEFAZ invoice with valid EAN
  const syncCandidates: {
    pdvProduct: PdvProduct;
    sefazEan: string;
    sefazDescricao: string;
    invoiceNumero: string;
    fornecedorNome: string;
  }[] = [];

  pdvProducts.forEach(prod => {
    const lacksEan = !prod.ean || prod.ean.trim() === '' || prod.ean === '0' || prod.ean.toUpperCase() === 'SEM GTIN';
    
    if (lacksEan) {
      // Look through all loaded invoices for a match
      for (const inv of invoices) {
        for (const item of inv.itens) {
          const hasValidSefazEan = item.cEAN && item.cEAN !== 'SEM GTIN' && item.cEAN.length >= 8;
          if (hasValidSefazEan) {
            // Check match by code / ref or description
            const isMatch = 
              item.cProd.toLowerCase() === prod.codigo.toLowerCase() ||
              (prod.referencia && item.cProd.toLowerCase() === prod.referencia.toLowerCase()) ||
              item.xProd.toLowerCase().includes(prod.descricao.toLowerCase()) ||
              prod.descricao.toLowerCase().includes(item.xProd.toLowerCase());

            if (isMatch) {
              syncCandidates.push({
                pdvProduct: prod,
                sefazEan: item.cEAN,
                sefazDescricao: item.xProd,
                invoiceNumero: inv.numero,
                fornecedorNome: inv.emitente.xNome
              });
              return; // stop searching for this product
            }
          }
        }
      }
    }
  });

  const filtered = syncCandidates.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.pdvProduct.descricao.toLowerCase().includes(term) ||
      c.pdvProduct.codigo.toLowerCase().includes(term) ||
      c.sefazEan.includes(term) ||
      c.fornecedorNome.toLowerCase().includes(term)
    );
  });

  const handleSyncSingle = async (prodId: string | number, newEan: string) => {
    await onUpdateProductEan(prodId, newEan);
    setSyncedIds(prev => ({ ...prev, [prodId]: true }));
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      for (const candidate of filtered) {
        await onUpdateProductEan(candidate.pdvProduct.id, candidate.sefazEan);
        setSyncedIds(prev => ({ ...prev, [candidate.pdvProduct.id]: true }));
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "ID_PDV",
      "Codigo_PDV",
      "Descricao_PDV",
      "Novo_EAN_SEFAZ",
      "Descricao_Nota",
      "Fornecedor",
      "Numero_NF"
    ];

    const rows = filtered.map(c => [
      c.pdvProduct.id,
      `"${c.pdvProduct.codigo}"`,
      `"${c.pdvProduct.descricao}"`,
      `"${c.sefazEan}"`,
      `"${c.sefazDescricao}"`,
      `"${c.fornecedorNome}"`,
      c.invoiceNumero
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sincronizacao_ean_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Products in PDV that have no EAN overall
  const totalPdvWithoutEan = pdvProducts.filter(p => !p.ean || p.ean.trim() === '').length;

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-[#F0EFED] p-3.5 sm:p-4 rounded-sm border border-[#141414] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[#141414]">
              Sincronização & Preenchimento de EAN / GTIN
            </h2>
            <span className="text-[10px] font-mono font-bold bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 rounded-xs uppercase">
              {filtered.length} PRONTOS PARA SINCRONIZAR
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#141414]/70 mt-0.5">
            Localiza produtos no seu sistema que estão sem código de barras cadastrado, mas que constam com EAN válido nas notas fiscais da SEFAZ.
          </p>
        </div>

        {/* Global actions */}
        {filtered.length > 0 && (
          <div className="flex items-center space-x-1.5 w-full md:w-auto">
            <button
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className="flex-1 md:flex-none px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center space-x-1.5 border border-[#141414] disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSyncingAll ? 'Sincronizando...' : `Sincronizar Todos (${filtered.length}) no PDV`}</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="p-1.5 bg-[#E4E3E0] hover:bg-[#d8d7d4] text-[#141414] rounded-sm text-xs transition border border-[#141414]"
              title="Exportar planilha de EANs"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414]">
          <div className="text-[10px] font-mono uppercase font-bold text-[#141414]/60">Produtos sem EAN no PDV</div>
          <div className="text-xl font-bold font-mono text-[#141414] mt-1">
            {totalPdvWithoutEan}
          </div>
          <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
            De um total de {pdvProducts.length} itens cadastrados
          </div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414]">
          <div className="text-[10px] font-mono uppercase font-bold text-[#141414]">EANs Localizados na SEFAZ</div>
          <div className="text-xl font-bold font-mono text-[#141414] mt-1">
            {syncCandidates.length}
          </div>
          <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
            Correspondência com notas recebidas
          </div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414]">
          <div className="text-[10px] font-mono uppercase font-bold text-[#141414]">Taxa de Resolução Auto</div>
          <div className="text-xl font-bold font-mono text-[#141414] mt-1">
            {totalPdvWithoutEan > 0 ? Math.round((syncCandidates.length / totalPdvWithoutEan) * 100) : 100}%
          </div>
          <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
            Elimina cadastro manual de código de barras
          </div>
        </div>

      </div>

      {/* Search Filter */}
      <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414]">
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 text-[#141414]/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por produto, código ou EAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono bg-[#E4E3E0] border border-[#141414] rounded-sm focus:outline-none text-[#141414] placeholder-[#141414]/40"
          />
        </div>
      </div>

      {/* Candidates List */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-[#F0EFED] rounded-sm border border-[#141414]">
          <CheckCircle2 className="w-10 h-10 text-[#141414] mx-auto mb-2" />
          <h4 className="font-bold text-sm uppercase tracking-tight text-[#141414]">
            Nenhum EAN Pendente de Sincronização
          </h4>
          <p className="text-xs font-mono text-[#141414]/70 mt-1 max-w-md mx-auto">
            {invoices.length === 0 
              ? 'Importe as notas fiscais da SEFAZ para que o sistema identifique os códigos de barras automaticamente.'
              : 'Todos os produtos correspondentes às notas carregadas já possuem código EAN preenchido no sistema.'}
          </p>
          {invoices.length === 0 && (
            <button
              onClick={onOpenXmlModal}
              className="mt-3 px-3.5 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-mono font-bold text-xs uppercase tracking-wider rounded-sm border border-[#141414] transition"
            >
              Importar XML SEFAZ
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#F0EFED] rounded-sm border border-[#141414] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] border-b border-[#141414] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Produto no Sistema PDV</th>
                  <th className="py-2.5 px-2.5">Status Atual EAN</th>
                  <th className="py-2.5 px-2.5">EAN Localizado na SEFAZ</th>
                  <th className="py-2.5 px-2.5">Origem (Fornecedor / NF)</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/15">
                {filtered.map(c => {
                  const isSynced = syncedIds[c.pdvProduct.id];

                  return (
                    <tr key={c.pdvProduct.id} className="hover:bg-[#E4E3E0]/60 transition">
                      
                      {/* Product */}
                      <td className="py-2 px-3">
                        <div className="space-y-0.5">
                          <div className="font-bold text-[#141414] text-xs">
                            {c.pdvProduct.descricao}
                          </div>
                          <div className="text-[10px] font-mono text-[#141414]/60">
                            Código: <span className="font-bold">{c.pdvProduct.codigo}</span> • Cat: {c.pdvProduct.categoria}
                          </div>
                        </div>
                      </td>

                      {/* Current Status */}
                      <td className="py-2 px-2.5 font-mono">
                        <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-bold uppercase bg-[#E4E3E0] text-[#141414] border border-[#141414]">
                          Sem EAN
                        </span>
                      </td>

                      {/* Discovered EAN */}
                      <td className="py-2 px-2.5">
                        <div className="flex items-center space-x-1.5">
                          <Barcode className="w-3.5 h-3.5 text-[#141414] shrink-0" />
                          <span className="font-mono font-bold text-xs text-[#141414] bg-[#E4E3E0] px-1.5 py-0.5 rounded-xs border border-[#141414]">
                            {c.sefazEan}
                          </span>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-2 px-2.5 font-mono">
                        <div className="font-bold text-[#141414] truncate max-w-[200px] text-xs">
                          {c.fornecedorNome}
                        </div>
                        <div className="text-[10px] text-[#141414]/60">
                          NF nº {c.invoiceNumero}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleSyncSingle(c.pdvProduct.id, c.sefazEan)}
                          className={`px-2.5 py-1 rounded-sm font-mono font-bold text-[10px] uppercase tracking-wider transition inline-flex items-center space-x-1 border border-[#141414] ${
                            isSynced
                              ? 'bg-[#E4E3E0] text-[#141414]'
                              : 'bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0]'
                          }`}
                        >
                          {isSynced ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>EAN Gravado</span>
                            </>
                          ) : (
                            <>
                              <Barcode className="w-3 h-3" />
                              <span>Gravar no PDV</span>
                            </>
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
      )}

    </div>
  );
};
