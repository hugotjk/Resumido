import React, { useState } from 'react';
import { 
  PackagePlus, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  Search, 
  Layers, 
  Building, 
  Barcode, 
  DollarSign,
  Plus,
  ArrowRight
} from 'lucide-react';
import { SefazInvoice, SefazItem, MkpConfig, PdvProduct } from '../../types';

interface ProductRegistrationProps {
  invoices: SefazInvoice[];
  mkpConfig: MkpConfig;
  onRegisterProduct: (productData: Partial<PdvProduct>) => Promise<PdvProduct>;
  onOpenXmlModal: () => void;
}

export const ProductRegistration: React.FC<ProductRegistrationProps> = ({
  invoices,
  mkpConfig,
  onRegisterProduct,
  onOpenXmlModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Vestuário');
  const [registeredKeys, setRegisteredKeys] = useState<Record<string, boolean>>({});
  const [isRegistering, setIsRegistering] = useState(false);

  // Extract all unmapped items from invoices
  const missingItems: { item: SefazItem; invoice: SefazInvoice }[] = [];

  invoices.forEach(inv => {
    inv.itens.forEach(item => {
      if (item.statusMatch === 'NAO_CADASTRADO' && !registeredKeys[`${inv.chaveAcesso}-${item.nItem}`]) {
        missingItems.push({ item, invoice: inv });
      }
    });
  });

  const filtered = missingItems.filter(({ item, invoice }) => {
    const term = searchTerm.toLowerCase();
    return (
      item.xProd.toLowerCase().includes(term) ||
      item.cProd.toLowerCase().includes(term) ||
      item.cEAN.includes(term) ||
      invoice.emitente.xNome.toLowerCase().includes(term) ||
      item.NCM.includes(term)
    );
  });

  const handleRegisterSingle = async (item: SefazItem, invoice: SefazInvoice) => {
    const key = `${invoice.chaveAcesso}-${item.nItem}`;
    try {
      const precoSugerido = Number((item.custoLiquidoUnitario * mkpConfig.metaMkpPadrao).toFixed(2));
      await onRegisterProduct({
        codigo: item.cProd,
        referencia: item.cProd,
        descricao: item.xProd,
        ean: item.cEAN !== 'SEM GTIN' ? item.cEAN : '',
        custo: item.custoLiquidoUnitario,
        precoVenda: precoSugerido,
        estoque: item.qCom,
        categoria: selectedCategory,
        ncm: item.NCM,
        cest: item.CEST,
        unidade: item.uCom
      });

      setRegisteredKeys(prev => ({ ...prev, [key]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterAll = async () => {
    setIsRegistering(true);
    try {
      for (const { item, invoice } of filtered) {
        await handleRegisterSingle(item, invoice);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Numero_NF",
      "Fornecedor_CNPJ",
      "Fornecedor_Nome",
      "Codigo_Fornecedor",
      "Descricao_Produto",
      "EAN_GTIN",
      "NCM",
      "CEST",
      "CFOP",
      "Unidade",
      "Qtd_Entrada",
      "Custo_Unitario_Liquido",
      "MKP_Meta",
      "Preco_Venda_Sugerido",
      "Categoria_Sugerida"
    ];

    const rows = filtered.map(({ item, invoice }) => [
      invoice.numero,
      `"${invoice.emitente.cnpj}"`,
      `"${invoice.emitente.xNome}"`,
      `"${item.cProd}"`,
      `"${item.cEAN}"`,
      `"${item.cEAN !== 'SEM GTIN' ? item.cEAN : ''}"`,
      `"${item.NCM}"`,
      `"${item.CEST || ''}"`,
      `"${item.CFOP}"`,
      `"${item.uCom}"`,
      item.qCom,
      item.custoLiquidoUnitario.toFixed(2),
      mkpConfig.metaMkpPadrao.toFixed(2),
      (item.custoLiquidoUnitario * mkpConfig.metaMkpPadrao).toFixed(2),
      `"${selectedCategory}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_produtos_nao_cadastrados_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (invoices.length === 0) {
    return (
      <div className="p-8 text-center bg-[#F0EFED] rounded-sm border border-[#141414]">
        <div className="w-12 h-12 bg-[#141414] text-[#E4E3E0] rounded-sm flex items-center justify-center mx-auto mb-3">
          <PackagePlus className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold uppercase tracking-tight text-[#141414]">
          Nenhuma Nota SEFAZ Carregada
        </h3>
        <p className="text-xs font-mono text-[#141414]/70 max-w-md mx-auto mt-2 mb-4">
          Importe os arquivos XML das notas fiscais para detectar automaticamente os produtos que constam nas notas e ainda não existem no cadastro do sistema PDV.
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
      
      {/* Header */}
      <div className="bg-[#F0EFED] p-3.5 sm:p-4 rounded-sm border border-[#141414] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[#141414]">
              Divergências de Cadastro: Itens SEFAZ sem Cadastro
            </h2>
            <span className="text-[10px] font-mono font-bold bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 rounded-xs uppercase">
              {filtered.length} {filtered.length === 1 ? 'ITEM PENDENTE' : 'ITENS PENDENTES'}
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#141414]/70 mt-0.5">
            Gera o relatório com todas as notas da SEFAZ para pré-cadastrar itens novos no sistema com código, NCM, EAN, custo e preço de venda sugerido.
          </p>
        </div>

        {/* Action button */}
        {filtered.length > 0 && (
          <div className="flex items-center space-x-1.5 w-full md:w-auto">
            <button
              onClick={handleRegisterAll}
              disabled={isRegistering}
              className="flex-1 md:flex-none px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center space-x-1.5 border border-[#141414] disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isRegistering ? 'Cadastrando...' : `Cadastrar Todos (${filtered.length}) no PDV`}</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="p-1.5 bg-[#E4E3E0] hover:bg-[#d8d7d4] text-[#141414] rounded-sm text-xs transition border border-[#141414]"
              title="Exportar relatório de não cadastrados em CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Filter and Quick Category Assigner */}
      <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] flex flex-col sm:flex-row items-center justify-between gap-2.5">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#141414]/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descrição, cProd, EAN ou fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono bg-[#E4E3E0] border border-[#141414] rounded-sm focus:outline-none text-[#141414] placeholder-[#141414]/40"
          />
        </div>

        {/* Category selector */}
        <div className="flex items-center space-x-2 text-xs font-mono w-full sm:w-auto">
          <span className="text-[#141414]/70 uppercase text-[10px] font-bold whitespace-nowrap">Categoria Padrão:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#E4E3E0] border border-[#141414] text-[#141414] px-2.5 py-1 rounded-sm font-bold uppercase text-[11px] focus:outline-none cursor-pointer"
          >
            <option value="Vestuário">Vestuário</option>
            <option value="Calçados">Calçados</option>
            <option value="Acessórios">Acessórios</option>
            <option value="Perfumaria">Perfumaria</option>
            <option value="Utilidades">Utilidades</option>
            <option value="Geral">Geral</option>
          </select>
        </div>

      </div>

      {/* Grid of Missing Items */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-[#F0EFED] rounded-sm border border-[#141414]">
          <CheckCircle2 className="w-10 h-10 text-[#141414] mx-auto mb-2" />
          <h4 className="font-bold text-sm uppercase tracking-tight text-[#141414]">
            Tudo Cadastrado!
          </h4>
          <p className="text-xs font-mono text-[#141414]/70 mt-1">
            Todos os itens das notas fiscais da SEFAZ já possuem cadastro correspondente no seu sistema PDV.
          </p>
        </div>
      ) : (
        <div className="bg-[#F0EFED] rounded-sm border border-[#141414] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] border-b border-[#141414] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Item SEFAZ</th>
                  <th className="py-2.5 px-2.5">Fornecedor / NF</th>
                  <th className="py-2.5 px-2.5">EAN / NCM</th>
                  <th className="py-2.5 px-2.5">Qtd Faturada</th>
                  <th className="py-2.5 px-2.5">Custo Líquido</th>
                  <th className="py-2.5 px-2.5">Preço Sugerido (MKP {mkpConfig.metaMkpPadrao}x)</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/15">
                {filtered.map(({ item, invoice }) => {
                  const precoSugerido = item.custoLiquidoUnitario * mkpConfig.metaMkpPadrao;

                  return (
                    <tr key={`${invoice.chaveAcesso}-${item.nItem}`} className="hover:bg-[#E4E3E0]/60 transition">
                      
                      {/* Product details */}
                      <td className="py-2 px-3">
                        <div className="space-y-0.5 max-w-sm">
                          <div className="font-bold text-[#141414] text-xs">
                            {item.xProd}
                          </div>
                          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#141414]/60">
                            <span className="bg-[#E4E3E0] px-1 py-0.2 rounded-xs border border-[#141414]/30">
                              cProd: {item.cProd}
                            </span>
                            <span>Un: {item.uCom}</span>
                          </div>
                        </div>
                      </td>

                      {/* Supplier & Invoice */}
                      <td className="py-2 px-2.5">
                        <div className="font-bold text-[#141414] truncate max-w-[180px] text-xs">
                          {invoice.emitente.xNome}
                        </div>
                        <div className="text-[10px] font-mono text-[#141414]/60">
                          NF {invoice.numero} • {new Date(invoice.dataEmissao).toLocaleDateString('pt-BR')}
                        </div>
                      </td>

                      {/* EAN / NCM */}
                      <td className="py-2 px-2.5 font-mono">
                        <div className="text-[#141414] font-bold text-xs">
                          {item.cEAN && item.cEAN !== 'SEM GTIN' ? item.cEAN : <span className="text-[#141414]/50 italic">Sem GTIN</span>}
                        </div>
                        <div className="text-[10px] text-[#141414]/60">
                          NCM: {item.NCM} {item.CEST ? `• CEST ${item.CEST}` : ''}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-2 px-2.5 font-mono">
                        <span className="font-bold text-[#141414]">
                          {item.qCom} {item.uCom}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-2 px-2.5 font-mono">
                        <span className="font-bold text-[#141414]">
                          R$ {item.custoLiquidoUnitario.toFixed(2)}
                        </span>
                      </td>

                      {/* Suggested Retail Price */}
                      <td className="py-2 px-2.5 font-mono">
                        <div className="font-bold text-[#141414] text-xs">
                          R$ {precoSugerido.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-[#141414]/60">
                          Margem: {(((precoSugerido - item.custoLiquidoUnitario) / precoSugerido) * 100).toFixed(1)}%
                        </div>
                      </td>

                      {/* Single register action */}
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleRegisterSingle(item, invoice)}
                          className="px-2.5 py-1 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm font-mono font-bold text-[10px] uppercase tracking-wider transition border border-[#141414] inline-flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Cadastrar</span>
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
