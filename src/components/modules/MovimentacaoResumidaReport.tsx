import React, { useState, useMemo } from 'react';
import {
  Filter,
  ArrowDownUp,
  Download,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
  Building,
  UserCheck,
  TrendingUp,
  Package,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Printer,
  Table as TableIcon
} from 'lucide-react';
import {
  MovResItem,
  MovResFilters,
  MovResOrdenacao,
  MovResAgrupamento,
  MovResModoFiltro,
  MovResRefPrincipal
} from '../../types';
import {
  MovResService,
  GESTORES_PADRAO,
  LOJAS_PADRAO
} from '../../services/movResService';

interface MovimentacaoResumidaReportProps {
  initialItems?: MovResItem[];
}

export const MovimentacaoResumidaReport: React.FC<MovimentacaoResumidaReportProps> = ({
  initialItems
}) => {
  const [items] = useState<MovResItem[]>(() => {
    return initialItems && initialItems.length > 0
      ? initialItems
      : MovResService.getInitialData();
  });

  const [filters, setFilters] = useState<MovResFilters>({
    ordenacao: 'VENDA',
    agrupamento: 'GESTOR',
    dataInicio: '2026-08-01',
    dataFim: '2026-08-28',
    rede: 'TODAS',
    tipoLoja: 'TODOS',
    gestor: 'TODOS',
    modoFiltro: 'FORNECEDOR',
    fornecedorOuModelo: 'TODOS',
    subGrupoComprador: 'TODOS',
    colecao: 'TODAS',
    referenciaPrincipal: 'REFERENCIA_FORNECEDOR',
    grupo: 'TODOS',
    buscaTexto: ''
  });

  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(true);
  const [density, setDensity] = useState<'compact' | 'normal'>('compact');

  // Dynamic filter options derived from dataset
  const filterOptions = useMemo(() => {
    return MovResService.getFilterOptions(items);
  }, [items]);

  // Filtered & Sorted items based on exact rules
  const filteredItems = useMemo(() => {
    return MovResService.filterAndSort(items, filters);
  }, [items, filters]);

  // Dynamic column headers (Gestores or Lojas)
  const dynamicColumns = useMemo(() => {
    if (filters.agrupamento === 'GESTOR') {
      if (filters.gestor && filters.gestor !== 'TODOS') {
        return GESTORES_PADRAO.filter(g => g.id === filters.gestor);
      }
      return GESTORES_PADRAO;
    } else {
      if (filters.rede && filters.rede !== 'TODAS') {
        return LOJAS_PADRAO.filter(l => l.rede === filters.rede);
      }
      return LOJAS_PADRAO;
    }
  }, [filters.agrupamento, filters.gestor, filters.rede]);

  // Overall Totals
  const totals = useMemo(() => {
    const totalVendaPecas = filteredItems.reduce((acc, curr) => acc + curr.vendaTotal, 0);
    const totalEstoquePecas = filteredItems.reduce((acc, curr) => acc + curr.estoqueTotal, 0);
    const totalVendaValor = filteredItems.reduce((acc, curr) => acc + (curr.vendaTotal * curr.precoVarejo), 0);
    const totalEstoqueValor = filteredItems.reduce((acc, curr) => acc + (curr.estoqueTotal * curr.precoVarejo), 0);

    // Sum per dynamic column
    const colTotals: Record<string, { venda: number; estoque: number }> = {};
    dynamicColumns.forEach(col => {
      let colVenda = 0;
      let colEstoque = 0;
      filteredItems.forEach(item => {
        const val = item.dadosPorColuna[col.id];
        if (val) {
          colVenda += val.venda || 0;
          colEstoque += val.estoque || 0;
        }
      });
      colTotals[col.id] = { venda: colVenda, estoque: colEstoque };
    });

    return {
      totalVendaPecas,
      totalEstoquePecas,
      totalVendaValor,
      totalEstoqueValor,
      colTotals
    };
  }, [filteredItems, dynamicColumns]);

  const handleExportCsv = () => {
    const headers = [
      filters.referenciaPrincipal === 'REFERENCIA_FORNECEDOR' ? 'REF_FORNECEDOR' : 'REFERENCIA_INTERNA',
      filters.referenciaPrincipal === 'REFERENCIA_FORNECEDOR' ? 'REFERENCIA_INTERNA' : 'REF_FORNECEDOR',
      'DESCRICAO',
      'PRECO_VAREJO',
      'VENDA_TOTAL_PDV',
      'ESTOQUE_TOTAL',
      ...dynamicColumns.flatMap(c => [`VENDA_${c.id}`, `ESTOQUE_${c.id}`])
    ];

    const rows = filteredItems.map(item => {
      const col1 = filters.referenciaPrincipal === 'REFERENCIA_FORNECEDOR' ? item.referenciaFornecedor : item.referencia;
      const col2 = filters.referenciaPrincipal === 'REFERENCIA_FORNECEDOR' ? item.referencia : item.referenciaFornecedor;
      const dynamicCols = dynamicColumns.flatMap(c => {
        const val = item.dadosPorColuna[c.id] || { venda: 0, estoque: 0 };
        return [val.venda, val.estoque];
      });

      return [
        `"${col1}"`,
        `"${col2}"`,
        `"${item.descricao}"`,
        item.precoVarejo.toFixed(2),
        item.vendaTotal,
        item.estoqueTotal,
        ...dynamicCols
      ];
    });

    const csvContent = '\uFEFF' + [
      `RELATORIO MOVIMENTACAO RESUMIDA - ${filters.ordenacao === 'VENDA' ? 'ORDENADO POR VENDA' : 'ORDENADO POR ESTOQUE'}`,
      `Periodo: ${filters.dataInicio} ate ${filters.dataFim}`,
      `Rede: ${filters.rede} | Gestor: ${filters.gestor} | Tipo Loja: ${filters.tipoLoja}`,
      '',
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `movimentacao_resumida_${filters.ordenacao.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setFilters({
      ordenacao: 'VENDA',
      agrupamento: 'GESTOR',
      dataInicio: '2026-08-01',
      dataFim: '2026-08-28',
      rede: 'TODAS',
      tipoLoja: 'TODOS',
      gestor: 'TODOS',
      modoFiltro: 'FORNECEDOR',
      fornecedorOuModelo: 'TODOS',
      subGrupoComprador: 'TODOS',
      colecao: 'TODAS',
      referenciaPrincipal: 'REFERENCIA_FORNECEDOR',
      grupo: 'TODOS',
      buscaTexto: ''
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner & Control Bar */}
      <div className="bg-[#F0EFED] p-4 rounded-sm border border-[#141414] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono font-bold uppercase rounded-xs">
                Módulo Gerencial
              </span>
              <span className="text-[10px] font-mono font-bold text-[#141414]/60">
                VERSÃO 2026
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-[#141414] flex items-center space-x-2 mt-0.5">
              <TableIcon className="w-5 h-5 text-[#141414]" />
              <span>Movimentação Resumida</span>
            </h2>
            <p className="text-xs text-[#141414]/70 mt-0.5">
              Relatório de análise de vendas e estoque por Gestor / Loja, ordenado com regra decrescente e visualização zebra de alta legibilidade.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="px-3 py-1.5 bg-[#E4E3E0] hover:bg-[#d8d7d4] border border-[#141414] rounded-xs font-mono font-bold text-xs flex items-center space-x-1.5 text-[#141414] transition"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isFiltersOpen ? 'Ocultar Painel de Filtros' : 'Abrir Painel de Filtros'}</span>
              {isFiltersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] border border-[#141414] rounded-xs font-mono font-bold text-xs uppercase flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel / CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-[#E4E3E0] hover:bg-[#d8d7d4] border border-[#141414] rounded-xs font-mono font-bold text-xs flex items-center space-x-1.5 text-[#141414] transition"
              title="Imprimir Relatório"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] space-y-1 font-mono">
          <div className="flex items-center justify-between text-[#141414]/70 text-[10px] uppercase font-bold">
            <span>Venda Total (Peças)</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-900">
            {formatNumber(totals.totalVendaPecas)} un
          </div>
          <div className="text-[10px] text-[#141414]/60">
            Faturamento: {formatCurrency(totals.totalVendaValor)}
          </div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] space-y-1 font-mono">
          <div className="flex items-center justify-between text-[#141414]/70 text-[10px] uppercase font-bold">
            <span>Estoque Total (Peças)</span>
            <Package className="w-3.5 h-3.5 text-orange-700" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-orange-950">
            {formatNumber(totals.totalEstoquePecas)} un
          </div>
          <div className="text-[10px] text-[#141414]/60">
            Valor em Estoque: {formatCurrency(totals.totalEstoqueValor)}
          </div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] space-y-1 font-mono">
          <div className="flex items-center justify-between text-[#141414]/70 text-[10px] uppercase font-bold">
            <span>Produtos Filtrados</span>
            <Layers className="w-3.5 h-3.5 text-[#141414]" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-[#141414]">
            {filteredItems.length} itens
          </div>
          <div className="text-[10px] text-[#141414]/60">
            De um catálogo de {items.length} itens
          </div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] space-y-1 font-mono">
          <div className="flex items-center justify-between text-[#141414]/70 text-[10px] uppercase font-bold">
            <span>Modo de Ordenação</span>
            <ArrowDownUp className="w-3.5 h-3.5 text-[#141414]" />
          </div>
          <div className="text-xs sm:text-sm font-bold text-[#141414] uppercase">
            {filters.ordenacao === 'VENDA' ? '🔥 1º Venda → 2º Estoque' : '📦 1º Estoque → 2º Venda'}
          </div>
          <div className="text-[10px] text-[#141414]/60">
            Visão por {filters.agrupamento === 'GESTOR' ? 'Gestores' : 'Lojas'}
          </div>
        </div>
      </div>

      {/* Complete Filter Panel */}
      {isFiltersOpen && (
        <div className="bg-[#F0EFED] p-4 rounded-sm border border-[#141414] space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-[#141414] pb-2">
            <h3 className="font-bold text-xs uppercase text-[#141414] flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Painel de Filtros e Parâmetros da Consulta</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[10px] text-[#141414]/70 hover:text-[#141414] underline flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Redefinir Filtros</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 text-xs">
            
            {/* 1. ORDENAÇÃO */}
            <div className="space-y-1 bg-[#E4E3E0] p-2 rounded-xs border border-[#141414]">
              <label className="font-bold uppercase text-[10px] text-[#141414] flex items-center space-x-1">
                <span>1. Ordenação:</span>
              </label>
              <select
                value={filters.ordenacao}
                onChange={(e) => setFilters({ ...filters, ordenacao: e.target.value as MovResOrdenacao })}
                className="w-full p-1.5 bg-[#F0EFED] border border-[#141414] rounded-xs font-bold text-[#141414] focus:outline-none text-xs"
              >
                <option value="VENDA">Por VENDA (Depois Estoque)</option>
                <option value="ESTOQUE">Por ESTOQUE (Depois Venda)</option>
              </select>
            </div>

            {/* 2. VISÃO (GESTOR OU LOJA) */}
            <div className="space-y-1 bg-[#E4E3E0] p-2 rounded-xs border border-[#141414]">
              <label className="font-bold uppercase text-[10px] text-[#141414] flex items-center space-x-1">
                <span>2. Ver Venda x Estoque:</span>
              </label>
              <select
                value={filters.agrupamento}
                onChange={(e) => setFilters({ ...filters, agrupamento: e.target.value as MovResAgrupamento })}
                className="w-full p-1.5 bg-[#F0EFED] border border-[#141414] rounded-xs font-bold text-[#141414] focus:outline-none text-xs"
              >
                <option value="GESTOR">Por Gestor (MF, MAX, TONY...)</option>
                <option value="LOJA">Por Loja (Tijuca, Barra...)</option>
              </select>
            </div>

            {/* 3. DATA INICIAL & FINAL */}
            <div className="space-y-1 bg-[#E4E3E0] p-2 rounded-xs border border-[#141414]">
              <label className="font-bold uppercase text-[10px] text-[#141414]">
                3. Data Inicial:
              </label>
              <input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                className="w-full p-1 bg-[#F0EFED] border border-[#141414] rounded-xs font-mono text-xs text-[#141414] focus:outline-none"
              />
            </div>

            <div className="space-y-1 bg-[#E4E3E0] p-2 rounded-xs border border-[#141414]">
              <label className="font-bold uppercase text-[10px] text-[#141414]">
                Data Final:
              </label>
              <input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                className="w-full p-1 bg-[#F0EFED] border border-[#141414] rounded-xs font-mono text-xs text-[#141414] focus:outline-none"
              />
            </div>

            {/* 4. REDE */}
            <div className="space-y-1 bg-[#E4E3E0] p-2 rounded-xs border border-[#141414]">
              <label className="font-bold uppercase text-[10px] text-[#141414]">
                4. Rede:
              </label>
              <select
                value={filters.rede}
                onChange={(e) => setFilters({ ...filters, rede: e.target.value })}
                className="w-full p-1.5 bg-[#F0EFED] border border-[#141414] rounded-xs font-bold text-[#141414] focus:outline-none text-xs"
              >
                <option value="TODAS">Todas as Redes</option>
                {filterOptions.redes.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* 5. TIPO LOJA */}
            <div className="space-y-1 bg-[#E4E3E0] p-2 rounded-xs border border-[#141414]">
              <label className="font-bold uppercase text-[10px] text-[#141414]">
                5. Tipo Loja:
              </label>
              <select
                value={filters.tipoLoja}
                onChange={(e) => setFilters({ ...filters, tipoLoja: e.target.value })}
                className="w-full p-1.5 bg-[#F0EFED] border border-[#141414] rounded-xs font-bold text-[#141414] focus:outline-none text-xs"
              >
                <option value="TODOS">Todos os Tipos</option>
                {filterOptions.tiposLoja.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* 6. GESTOR */}
            <div className="space-y-1 bg-[#E4E3E0] p-2 rounded-xs border border-[#141414]">
              <label className="font-bold uppercase text-[10px] text-[#141414]">
                6. Gestor:
              </label>
              <select
                value={filters.gestor}
                onChange={(e) => setFilters({ ...filters, gestor: e.target.value })}
                className="w-full p-1.5 bg-[#F0EFED] border border-[#141414] rounded-xs font-bold text-[#141414] focus:outline-none text-xs"
              >
                <option value="TODOS">Todos os Gestores</option>
                {filterOptions.gestores.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* 7 & 8. SELETOR FORNECEDOR / MODELO */}
            <div className="space-y-1 bg-[#E4E3E0] p-2 rounded-xs border border-[#141414]">
              <div className="flex items-center justify-between">
                <label className="font-bold uppercase text-[10px] text-[#141414]">
                  7. Modo de Filtro:
                </label>
                <div className="flex space-x-1 text-[9px]">
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, modoFiltro: 'FORNECEDOR', fornecedorOuModelo: 'TODOS' })}
                    className={`px-1 py-0.5 rounded-xs ${filters.modoFiltro === 'FORNECEDOR' ? 'bg-[#141414] text-white font-bold' : 'bg-[#d8d7d4]'}`}
                  >
                    Forn.
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, modoFiltro: 'MODELO', fornecedorOuModelo: 'TODOS' })}
                    className={`px-1 py-0.5 rounded-xs ${filters.modoFiltro === 'MODELO' ? 'bg-[#141414] text-white font-bold' : 'bg-[#d8d7d4]'}`}
                  >
                    Mod.
                  </button>
                </div>
              </div>
              <select
                value={filters.fornecedorOuModelo}
                onChange={(e) => setFilters({ ...filters, fornecedorOuModelo: e.target.value })}
                className="w-full p-1.5 bg-[#F0EFED] border border-[#141414] rounded-xs font-bold text-[#141414] focus:outline-none text-xs"
              >
                <option value="TODOS">Todos ({filters.modoFiltro === 'FORNECEDOR' ? 'Fornecedores' : 'Modelos'})</option>
                {filters.modoFiltro === 'FORNECEDOR'
                  ? filterOptions.fornecedores.map(f => <option key={f} value={f}>{f}</option>)
                  : filterOptions.modelos.map(m => <option key={m} value={m}>{m}</option>)
                }
              </select>
            </div>

            {/* 9. SUB GRUPO (COMPRADOR) */}
            <div className="space-y-1 bg-[#E4E3E0] p-2 rounded-xs border border-[#141414]">
              <label className="font-bold uppercase text-[10px] text-[#141414]">
                9. Sub Grupo (Comprador):
              </label>
              <select
                value={filters.subGrupoComprador}
                onChange={(e) => setFilters({ ...filters, subGrupoComprador: e.target.value })}
                className="w-full p-1.5 bg-[#F0EFED] border border-[#141414] rounded-xs font-bold text-[#141414] focus:outline-none text-xs"
              >
                <option value="TODOS">Todos os Sub Grupos</option>
                {filterOptions.subGrupos.map(sg => (
                  <option key={sg} value={sg}>{sg}</option>
                ))}
              </select>
            </div>

            {/* 10. COLEÇÃO */}
            <div className="space-y-1 bg-[#E4E3E0] p-2 rounded-xs border border-[#141414]">
              <label className="font-bold uppercase text-[10px] text-[#141414]">
                10. Coleção:
              </label>
              <select
                value={filters.colecao}
                onChange={(e) => setFilters({ ...filters, colecao: e.target.value })}
                className="w-full p-1.5 bg-[#F0EFED] border border-[#141414] rounded-xs font-bold text-[#141414] focus:outline-none text-xs"
              >
                <option value="TODAS">Todas as Coleções</option>
                {filterOptions.colecoes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* 11. REFERÊNCIA PRINCIPAL */}
            <div className="space-y-1 bg-[#E4E3E0] p-2 rounded-xs border border-[#141414]">
              <label className="font-bold uppercase text-[10px] text-[#141414]">
                11. 1ª Coluna de Referência:
              </label>
              <select
                value={filters.referenciaPrincipal}
                onChange={(e) => setFilters({ ...filters, referenciaPrincipal: e.target.value as MovResRefPrincipal })}
                className="w-full p-1.5 bg-[#F0EFED] border border-[#141414] rounded-xs font-bold text-[#141414] focus:outline-none text-xs"
              >
                <option value="REFERENCIA_FORNECEDOR">Ref. Fornecedor (ex: JM5651)</option>
                <option value="REFERENCIA">Ref. Interna (ex: 143205)</option>
              </select>
            </div>

            {/* 12. GRUPO */}
            <div className="space-y-1 bg-[#E4E3E0] p-2 rounded-xs border border-[#141414]">
              <label className="font-bold uppercase text-[10px] text-[#141414]">
                12. Grupo:
              </label>
              <select
                value={filters.grupo}
                onChange={(e) => setFilters({ ...filters, grupo: e.target.value })}
                className="w-full p-1.5 bg-[#F0EFED] border border-[#141414] rounded-xs font-bold text-[#141414] focus:outline-none text-xs"
              >
                <option value="TODOS">Todos os Grupos</option>
                {filterOptions.grupos.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Inline Quick Search & Table density */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-[#141414]/20">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#141414]/60" />
              <input
                type="text"
                value={filters.buscaTexto}
                onChange={(e) => setFilters({ ...filters, buscaTexto: e.target.value })}
                placeholder="Busca rápida por Ref, Ref Fornecedor, Descrição..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#E4E3E0] border border-[#141414] rounded-xs text-xs font-mono text-[#141414] focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-mono">
              <span className="text-[#141414]/70 font-bold">Densidade:</span>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`px-2 py-0.5 rounded-xs border border-[#141414] ${density === 'compact' ? 'bg-[#141414] text-[#E4E3E0] font-bold' : 'bg-[#E4E3E0]'}`}
              >
                Compacta
              </button>
              <button
                type="button"
                onClick={() => setDensity('normal')}
                className={`px-2 py-0.5 rounded-xs border border-[#141414] ${density === 'normal' ? 'bg-[#141414] text-[#E4E3E0] font-bold' : 'bg-[#E4E3E0]'}`}
              >
                Confortável
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Main Data Table with Zebra Striping (1 White / 1 Gray) */}
      <div className="bg-[#F0EFED] rounded-sm border border-[#141414] overflow-hidden shadow-xs">
        
        {/* Table Header Info Bar */}
        <div className="p-2.5 bg-[#E4E3E0] border-b border-[#141414] flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#141414]">Exibindo {filteredItems.length} produtos</span>
            <span className="text-[#141414]/60">|</span>
            <span className="text-[#141414]/70">Linhas alternadas Branco / Cinza para máxima legibilidade</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] mt-1 sm:mt-0">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-2xs inline-block"></span>
              <span className="text-[#141414]/80 font-bold">Coluna VENDA</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-orange-400 rounded-2xs inline-block"></span>
              <span className="text-[#141414]/80 font-bold">Coluna ESTOQUE</span>
            </div>
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left border-collapse font-mono text-[11px]">
            
            {/* Multi-Tier Sticky Header */}
            <thead className="sticky top-0 z-10 shadow-xs">
              
              {/* Top Row: Group Headers */}
              <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] uppercase font-bold tracking-wider">
                <th
                  colSpan={6}
                  className="py-2 px-3 border-r border-[#E4E3E0]/20 text-center bg-[#141414]"
                >
                  IDENTIFICAÇÃO DO PRODUTO & TOTAIS GERAIS
                </th>

                {/* Dynamic Columns Group Headers */}
                {dynamicColumns.map(col => (
                  <th
                    key={col.id}
                    colSpan={2}
                    className="py-2 px-2 border-r border-[#E4E3E0]/20 text-center bg-[#242424]"
                  >
                    <div className="font-bold text-[#E4E3E0]">{col.nome}</div>
                    {col.tipo && <div className="text-[9px] text-[#E4E3E0]/60 font-normal">({col.tipo})</div>}
                  </th>
                ))}
              </tr>

              {/* Sub-Header Row: Exact Column Names */}
              <tr className="bg-[#242424] text-[#E4E3E0] text-[9.5px] uppercase font-bold divide-x divide-[#141414]/30 border-b border-[#141414]">
                
                {/* Col 1: Referência Principal */}
                <th className="py-2 px-2.5 whitespace-nowrap bg-[#1a1a1a]">
                  {filters.referenciaPrincipal === 'REFERENCIA_FORNECEDOR' ? 'REF. FORNECEDOR' : 'REFERÊNCIA'}
                </th>

                {/* Col 2: Referência Secundária */}
                <th className="py-2 px-2.5 whitespace-nowrap bg-[#1a1a1a]">
                  {filters.referenciaPrincipal === 'REFERENCIA_FORNECEDOR' ? 'REFERÊNCIA' : 'REF. FORNECEDOR'}
                </th>

                {/* Col 3: Descrição */}
                <th className="py-2 px-3 min-w-[240px] bg-[#1a1a1a]">
                  DESCRIÇÃO DO PRODUTO
                </th>

                {/* Col 4: Preço Varejo */}
                <th className="py-2 px-2.5 text-right whitespace-nowrap bg-[#1a1a1a]">
                  PDV (R$)
                </th>

                {/* Col 5: Venda Total PDV */}
                <th className="py-2 px-2.5 text-right whitespace-nowrap bg-emerald-900/90 text-emerald-100 font-bold">
                  VENDA TOT.
                </th>

                {/* Col 6: Estoque Total */}
                <th className="py-2 px-2.5 text-right whitespace-nowrap bg-orange-900/90 text-orange-100 font-bold border-r border-[#141414]">
                  %% ESTOQUE
                </th>

                {/* Dynamic Columns Sub-Headers (Venda / Estoque) */}
                {dynamicColumns.map(col => (
                  <React.Fragment key={col.id}>
                    <th className="py-2 px-2 text-right whitespace-nowrap bg-emerald-950/70 text-emerald-200">
                      VENDA
                    </th>
                    <th className="py-2 px-2 text-right whitespace-nowrap bg-orange-950/70 text-orange-200 border-r border-[#141414]/40">
                      ESTOQUE
                    </th>
                  </React.Fragment>
                ))}

              </tr>
            </thead>

            {/* Table Body with alternating White and Soft Gray rows */}
            <tbody className="divide-y divide-[#141414]/15">
              {filteredItems.map((item, idx) => {
                // Zebra styling: even is pure white, odd is soft gray
                const isEven = idx % 2 === 0;
                const rowBg = isEven ? 'bg-white' : 'bg-[#F2F1EE]';
                const paddingClass = density === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3';

                const col1Value = filters.referenciaPrincipal === 'REFERENCIA_FORNECEDOR' ? item.referenciaFornecedor : item.referencia;
                const col2Value = filters.referenciaPrincipal === 'REFERENCIA_FORNECEDOR' ? item.referencia : item.referenciaFornecedor;

                return (
                  <tr
                    key={item.id || idx}
                    className={`${rowBg} hover:bg-amber-50/80 transition-colors border-b border-[#141414]/10`}
                  >
                    
                    {/* Col 1 */}
                    <td className={`${paddingClass} font-bold text-[#141414] whitespace-nowrap border-r border-[#141414]/10`}>
                      {col1Value}
                    </td>

                    {/* Col 2 */}
                    <td className={`${paddingClass} text-[#141414]/80 whitespace-nowrap border-r border-[#141414]/10`}>
                      {col2Value}
                    </td>

                    {/* Col 3: Descrição com tags */}
                    <td className={`${paddingClass} border-r border-[#141414]/10`}>
                      <div className="font-bold text-[#141414] line-clamp-1">{item.descricao}</div>
                      <div className="flex items-center space-x-1.5 text-[9.5px] text-[#141414]/60 mt-0.5">
                        <span>Forn: {item.fornecedor}</span>
                        <span>•</span>
                        <span>Col: {item.colecao}</span>
                        <span>•</span>
                        <span>{item.subGrupo}</span>
                      </div>
                    </td>

                    {/* Col 4: Preço Varejo */}
                    <td className={`${paddingClass} text-right font-bold text-[#141414] whitespace-nowrap border-r border-[#141414]/10`}>
                      {formatCurrency(item.precoVarejo)}
                    </td>

                    {/* Col 5: Venda Total Geral */}
                    <td className={`${paddingClass} text-right font-bold text-emerald-950 bg-emerald-50/60 whitespace-nowrap border-r border-[#141414]/10`}>
                      {formatNumber(item.vendaTotal)}
                    </td>

                    {/* Col 6: Estoque Total Geral */}
                    <td className={`${paddingClass} text-right font-bold text-orange-950 bg-orange-50/60 whitespace-nowrap border-r border-[#141414]/20`}>
                      {formatNumber(item.estoqueTotal)}
                    </td>

                    {/* Dynamic Col Values */}
                    {dynamicColumns.map(col => {
                      const val = item.dadosPorColuna[col.id] || { venda: 0, estoque: 0 };
                      const hasVenda = val.venda > 0;
                      const hasEstoque = val.estoque > 0;

                      return (
                        <React.Fragment key={col.id}>
                          {/* Venda Gestor/Loja */}
                          <td className={`${paddingClass} text-right font-bold ${
                            hasVenda ? 'text-emerald-900 bg-emerald-50/30' : 'text-[#141414]/35'
                          }`}>
                            {hasVenda ? formatNumber(val.venda) : '-'}
                          </td>

                          {/* Estoque Gestor/Loja */}
                          <td className={`${paddingClass} text-right font-bold border-r border-[#141414]/10 ${
                            hasEstoque ? 'text-orange-950 bg-orange-50/30' : val.estoque < 0 ? 'text-red-700 bg-red-50' : 'text-[#141414]/35'
                          }`}>
                            {val.estoque !== 0 ? formatNumber(val.estoque) : '-'}
                          </td>
                        </React.Fragment>
                      );
                    })}

                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td
                    colSpan={6 + dynamicColumns.length * 2}
                    className="py-12 text-center text-[#141414]/60 bg-white"
                  >
                    <Package className="w-8 h-8 mx-auto mb-2 text-[#141414]/40" />
                    <div className="font-bold text-sm">Nenhum produto encontrado com os filtros selecionados.</div>
                    <div className="text-xs mt-1">Tente ajustar os parâmetros de Rede, Gestor ou Fornecedor.</div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Totalizer Footer */}
            {filteredItems.length > 0 && (
              <tfoot className="sticky bottom-0 z-10 bg-[#141414] text-[#E4E3E0] font-bold text-xs uppercase shadow-md">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-left border-r border-[#E4E3E0]/20">
                    TOTAIS GERAIS ({filteredItems.length} PRODUTOS)
                  </td>
                  <td className="py-2.5 px-2.5 text-right bg-emerald-900 text-emerald-100 font-bold border-r border-[#E4E3E0]/20">
                    {formatNumber(totals.totalVendaPecas)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right bg-orange-900 text-orange-100 font-bold border-r border-[#E4E3E0]/20">
                    {formatNumber(totals.totalEstoquePecas)}
                  </td>

                  {/* Dynamic Column Totalizers */}
                  {dynamicColumns.map(col => {
                    const colTot = totals.colTotals[col.id] || { venda: 0, estoque: 0 };
                    return (
                      <React.Fragment key={col.id}>
                        <td className="py-2.5 px-2 text-right bg-emerald-950 text-emerald-200">
                          {formatNumber(colTot.venda)}
                        </td>
                        <td className="py-2.5 px-2 text-right bg-orange-950 text-orange-200 border-r border-[#E4E3E0]/20">
                          {formatNumber(colTot.estoque)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              </tfoot>
            )}

          </table>
        </div>

      </div>

    </div>
  );
};
