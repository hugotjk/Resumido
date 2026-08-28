import { MovResItem, MovResFilters, MovResColumnHeader } from '../types';

export const GESTORES_PADRAO: MovResColumnHeader[] = [
  { id: 'MF', nome: 'MF' },
  { id: 'MAX', nome: 'MAX' },
  { id: 'RAFAGOL', nome: 'RAFAGOL' },
  { id: 'TONY', nome: 'TONY' },
  { id: 'BOMBA', nome: 'BOMBA' },
  { id: 'DRN', nome: 'DRN' }
];

export const LOJAS_PADRAO: MovResColumnHeader[] = [
  { id: 'LJ01', nome: 'LJ 01 - TIJUCA', tipo: 'Rua', rede: 'MULTI' },
  { id: 'LJ02', nome: 'LJ 02 - BARRA SHOPPING', tipo: 'Shopping', rede: 'MULTI' },
  { id: 'LJ03', nome: 'LJ 03 - NORTE SHOPPING', tipo: 'Shopping', rede: 'MULTI' },
  { id: 'LJ04', nome: 'LJ 04 - CENTRO RIO', tipo: 'Rua', rede: 'MULTI' },
  { id: 'LJ05', nome: 'LJ 05 - PLAZA NITEROI', tipo: 'Shopping', rede: 'FLUMINENSE' },
  { id: 'LJ06', nome: 'LJ 06 - BOTAFOGO PRAIA', tipo: 'Shopping', rede: 'FLUMINENSE' },
  { id: 'LJ07', nome: 'LJ 07 - OUTLET PREMIUM', tipo: 'Outlet', rede: 'FUTTEBOL' },
  { id: 'LJ08', nome: 'LJ 08 - COPACABANA', tipo: 'Rua', rede: 'WQSURF' }
];

export const INITIAL_MOV_RES_DATA: MovResItem[] = [
  {
    id: 1,
    referenciaFornecedor: 'JM5651',
    referencia: '143205',
    descricao: 'MANTO FLAMENGO I 2026 JM5651',
    precoVarejo: 449.99,
    custo: 180.00,
    vendaTotal: 66058,
    estoqueTotal: 31552,
    rede: 'MULTI',
    tipoLoja: 'Shopping',
    gestor: 'MF',
    fornecedor: 'ADIDAS',
    modelo: 'MANTO FLAMENGO I',
    subGrupo: 'FUTEBOL',
    colecao: '2026',
    grupo: 'CONFECÇÃO',
    dadosPorColuna: {
      'MF': { venda: 14266, estoque: 4858 },
      'MAX': { venda: 3628, estoque: 1433 },
      'RAFAGOL': { venda: 2626, estoque: 885 },
      'TONY': { venda: 2189, estoque: 386 },
      'BOMBA': { venda: 2187, estoque: 569 },
      'DRN': { venda: 1382, estoque: 167 },
      // Lojas
      'LJ01': { venda: 12500, estoque: 5400 },
      'LJ02': { venda: 16800, estoque: 7200 },
      'LJ03': { venda: 11200, estoque: 4900 },
      'LJ04': { venda: 8900, estoque: 3800 },
      'LJ05': { venda: 6400, estoque: 3200 },
      'LJ06': { venda: 4800, estoque: 2900 },
      'LJ07': { venda: 3200, estoque: 2300 },
      'LJ08': { venda: 2258, estoque: 1852 }
    }
  },
  {
    id: 2,
    referenciaFornecedor: 'JM5653',
    referencia: '144137',
    descricao: 'MANTO FLAMENGO II 2026 JM5653',
    precoVarejo: 449.99,
    custo: 180.00,
    vendaTotal: 15966,
    estoqueTotal: 12145,
    rede: 'MULTI',
    tipoLoja: 'Shopping',
    gestor: 'MF',
    fornecedor: 'ADIDAS',
    modelo: 'MANTO FLAMENGO II',
    subGrupo: 'FUTEBOL',
    colecao: '2026',
    grupo: 'CONFECÇÃO',
    dadosPorColuna: {
      'MF': { venda: 3261, estoque: 2001 },
      'MAX': { venda: 951, estoque: 270 },
      'RAFAGOL': { venda: 862, estoque: 374 },
      'TONY': { venda: 610, estoque: 153 },
      'BOMBA': { venda: 410, estoque: 430 },
      'DRN': { venda: 273, estoque: 56 },
      // Lojas
      'LJ01': { venda: 3100, estoque: 2400 },
      'LJ02': { venda: 4200, estoque: 3100 },
      'LJ03': { venda: 2800, estoque: 2100 },
      'LJ04': { venda: 2100, estoque: 1600 },
      'LJ05': { venda: 1500, estoque: 1100 },
      'LJ06': { venda: 1100, estoque: 890 },
      'LJ07': { venda: 700, estoque: 600 },
      'LJ08': { venda: 466, estoque: 455 }
    }
  },
  {
    id: 3,
    referenciaFornecedor: 'KZ3128',
    referencia: '145897',
    descricao: 'MANTO FLAMENGO FANSHIRT WC BRASIL 2026 KZ3128',
    precoVarejo: 279.99,
    custo: 110.00,
    vendaTotal: 15920,
    estoqueTotal: 286,
    rede: 'FLUMINENSE',
    tipoLoja: 'Rua',
    gestor: 'MAX',
    fornecedor: 'ADIDAS',
    modelo: 'MANTO FANSHIRT',
    subGrupo: 'FUTEBOL',
    colecao: '2026',
    grupo: 'CONFECÇÃO',
    dadosPorColuna: {
      'MF': { venda: 5045, estoque: 1 },
      'MAX': { venda: 1600, estoque: 84 },
      'RAFAGOL': { venda: 1123, estoque: 3 },
      'TONY': { venda: 314, estoque: 0 },
      'BOMBA': { venda: 1071, estoque: -14 },
      'DRN': { venda: 271, estoque: 0 },
      // Lojas
      'LJ01': { venda: 3800, estoque: 45 },
      'LJ02': { venda: 4500, estoque: 80 },
      'LJ03': { venda: 2900, estoque: 50 },
      'LJ04': { venda: 2100, estoque: 35 },
      'LJ05': { venda: 1200, estoque: 28 },
      'LJ06': { venda: 850, estoque: 24 },
      'LJ07': { venda: 420, estoque: 14 },
      'LJ08': { venda: 150, estoque: 10 }
    }
  },
  {
    id: 4,
    referenciaFornecedor: 'JZ2374',
    referencia: '139611',
    descricao: 'CAMISA TREINO MARROM FLAMENGO 2026 JZ2374',
    precoVarejo: 249.99,
    custo: 95.00,
    vendaTotal: 13279,
    estoqueTotal: 2536,
    rede: 'MULTI',
    tipoLoja: 'Shopping',
    gestor: 'RAFAGOL',
    fornecedor: 'ADIDAS',
    modelo: 'CAMISA TREINO',
    subGrupo: 'FUTEBOL',
    colecao: '2026',
    grupo: 'CONFECÇÃO',
    dadosPorColuna: {
      'MF': { venda: 2675, estoque: 73 },
      'MAX': { venda: 303, estoque: 5 },
      'RAFAGOL': { venda: 560, estoque: 0 },
      'TONY': { venda: 692, estoque: 22 },
      'BOMBA': { venda: 555, estoque: 80 },
      'DRN': { venda: 531, estoque: 1 },
      // Lojas
      'LJ01': { venda: 2900, estoque: 520 },
      'LJ02': { venda: 3600, estoque: 680 },
      'LJ03': { venda: 2400, estoque: 460 },
      'LJ04': { venda: 1800, estoque: 340 },
      'LJ05': { venda: 1100, estoque: 220 },
      'LJ06': { venda: 790, estoque: 160 },
      'LJ07': { venda: 450, estoque: 96 },
      'LJ08': { venda: 239, estoque: 60 }
    }
  },
  {
    id: 5,
    referenciaFornecedor: 'JZ8871',
    referencia: '143210',
    descricao: 'MANTO FLAMENGO I FEMININA 2026 JZ8871',
    precoVarejo: 449.99,
    custo: 180.00,
    vendaTotal: 12526,
    estoqueTotal: 10220,
    rede: 'MULTI',
    tipoLoja: 'Shopping',
    gestor: 'TONY',
    fornecedor: 'ADIDAS',
    modelo: 'MANTO FLAMENGO I FEM',
    subGrupo: 'FUTEBOL',
    colecao: '2026',
    grupo: 'CONFECÇÃO',
    dadosPorColuna: {
      'MF': { venda: 2550, estoque: 1688 },
      'MAX': { venda: 748, estoque: 810 },
      'RAFAGOL': { venda: 637, estoque: 710 },
      'TONY': { venda: 391, estoque: 362 },
      'BOMBA': { venda: 397, estoque: 189 },
      'DRN': { venda: 227, estoque: 93 },
      // Lojas
      'LJ01': { venda: 2600, estoque: 2100 },
      'LJ02': { venda: 3400, estoque: 2800 },
      'LJ03': { venda: 2300, estoque: 1900 },
      'LJ04': { venda: 1700, estoque: 1350 },
      'LJ05': { venda: 1150, estoque: 920 },
      'LJ06': { venda: 720, estoque: 580 },
      'LJ07': { venda: 410, estoque: 340 },
      'LJ08': { venda: 246, estoque: 230 }
    }
  },
  {
    id: 6,
    referenciaFornecedor: 'JZ8872',
    referencia: '143211',
    descricao: 'MANTO FLAMENGO I INFANTIL 2026 JZ8872',
    precoVarejo: 399.99,
    custo: 155.00,
    vendaTotal: 11081,
    estoqueTotal: 8854,
    rede: 'MULTI',
    tipoLoja: 'Shopping',
    gestor: 'BOMBA',
    fornecedor: 'ADIDAS',
    modelo: 'MANTO FLAMENGO I INF',
    subGrupo: 'FUTEBOL',
    colecao: '2026',
    grupo: 'LINHA INFANTIL',
    dadosPorColuna: {
      'MF': { venda: 2462, estoque: 1443 },
      'MAX': { venda: 752, estoque: 666 },
      'RAFAGOL': { venda: 539, estoque: 652 },
      'TONY': { venda: 240, estoque: 225 },
      'BOMBA': { venda: 236, estoque: 110 },
      'DRN': { venda: 319, estoque: 96 },
      // Lojas
      'LJ01': { venda: 2300, estoque: 1800 },
      'LJ02': { venda: 2950, estoque: 2350 },
      'LJ03': { venda: 2050, estoque: 1600 },
      'LJ04': { venda: 1500, estoque: 1200 },
      'LJ05': { venda: 1000, estoque: 880 },
      'LJ06': { venda: 650, estoque: 520 },
      'LJ07': { venda: 380, estoque: 310 },
      'LJ08': { venda: 251, estoque: 194 }
    }
  },
  {
    id: 7,
    referenciaFornecedor: 'NK-AIR-90',
    referencia: '129840',
    descricao: 'TENIS NIKE AIR MAX 90 ALL BLACK - 41',
    precoVarejo: 699.99,
    custo: 290.00,
    vendaTotal: 8420,
    estoqueTotal: 4120,
    rede: 'FUTTEBOL',
    tipoLoja: 'Shopping',
    gestor: 'DRN',
    fornecedor: 'NIKE',
    modelo: 'AIR MAX 90',
    subGrupo: 'CALÇADOS',
    colecao: '2026',
    grupo: 'CALÇADOS',
    dadosPorColuna: {
      'MF': { venda: 1850, estoque: 980 },
      'MAX': { venda: 1420, estoque: 750 },
      'RAFAGOL': { venda: 1310, estoque: 680 },
      'TONY': { venda: 1250, estoque: 610 },
      'BOMBA': { venda: 1440, estoque: 620 },
      'DRN': { venda: 1150, estoque: 480 },
      'LJ01': { venda: 1800, estoque: 850 },
      'LJ02': { venda: 2400, estoque: 1200 },
      'LJ03': { venda: 1600, estoque: 780 },
      'LJ04': { venda: 1100, estoque: 540 },
      'LJ05': { venda: 720, estoque: 390 },
      'LJ06': { venda: 480, estoque: 210 },
      'LJ07': { venda: 220, estoque: 100 },
      'LJ08': { venda: 100, estoque: 50 }
    }
  },
  {
    id: 8,
    referenciaFornecedor: 'PM-ULT-26',
    referencia: '138920',
    descricao: 'CHUTEIRA PUMA ULTRA MATCH FG CAMPO - 40',
    precoVarejo: 499.99,
    custo: 210.00,
    vendaTotal: 5210,
    estoqueTotal: 2980,
    rede: 'FUTTEBOL',
    tipoLoja: 'Outlet',
    gestor: 'MAX',
    fornecedor: 'PUMA',
    modelo: 'ULTRA MATCH',
    subGrupo: 'FUTEBOL',
    colecao: '2026',
    grupo: 'CALÇADOS',
    dadosPorColuna: {
      'MF': { venda: 1200, estoque: 680 },
      'MAX': { venda: 1050, estoque: 590 },
      'RAFAGOL': { venda: 890, estoque: 510 },
      'TONY': { venda: 720, estoque: 430 },
      'BOMBA': { venda: 780, estoque: 440 },
      'DRN': { venda: 570, estoque: 330 },
      'LJ01': { venda: 1100, estoque: 600 },
      'LJ02': { venda: 1500, estoque: 850 },
      'LJ03': { venda: 1050, estoque: 580 },
      'LJ04': { venda: 720, estoque: 410 },
      'LJ05': { venda: 450, estoque: 280 },
      'LJ06': { venda: 230, estoque: 150 },
      'LJ07': { venda: 110, estoque: 80 },
      'LJ08': { venda: 50, estoque: 30 }
    }
  },
  {
    id: 9,
    referenciaFornecedor: 'UB-FLU-OF2',
    referencia: '141098',
    descricao: 'CAMISA FLUMINENSE OFICIAL II 2026 UMBRO',
    precoVarejo: 379.99,
    custo: 150.00,
    vendaTotal: 4890,
    estoqueTotal: 6540,
    rede: 'FLUMINENSE',
    tipoLoja: 'Shopping',
    gestor: 'MF',
    fornecedor: 'UMBRO',
    modelo: 'CAMISA OFICIAL II',
    subGrupo: 'FUTEBOL',
    colecao: '2026',
    grupo: 'CONFECÇÃO',
    dadosPorColuna: {
      'MF': { venda: 1650, estoque: 2200 },
      'MAX': { venda: 980, estoque: 1300 },
      'RAFAGOL': { venda: 840, estoque: 1100 },
      'TONY': { venda: 590, estoque: 820 },
      'BOMBA': { venda: 480, estoque: 670 },
      'DRN': { venda: 350, estoque: 450 },
      'LJ01': { venda: 980, estoque: 1300 },
      'LJ02': { venda: 1450, estoque: 1950 },
      'LJ03': { venda: 980, estoque: 1300 },
      'LJ04': { venda: 680, estoque: 920 },
      'LJ05': { venda: 420, estoque: 570 },
      'LJ06': { venda: 240, estoque: 310 },
      'LJ07': { venda: 90, estoque: 130 },
      'LJ08': { venda: 50, estoque: 60 }
    }
  },
  {
    id: 10,
    referenciaFornecedor: 'WQ-BRD-SH',
    referencia: '115430',
    descricao: 'BERMUDA BOARDSHORTS WATERPROOF WQSURF 2026',
    precoVarejo: 189.90,
    custo: 68.00,
    vendaTotal: 3410,
    estoqueTotal: 7890,
    rede: 'WQSURF',
    tipoLoja: 'Rua',
    gestor: 'TONY',
    fornecedor: 'WQSURF',
    modelo: 'BOARDSHORTS',
    subGrupo: 'SURFWEAR',
    colecao: 'VERÃO 2026',
    grupo: 'CONFECÇÃO',
    dadosPorColuna: {
      'MF': { venda: 850, estoque: 1950 },
      'MAX': { venda: 720, estoque: 1650 },
      'RAFAGOL': { venda: 610, estoque: 1400 },
      'TONY': { venda: 520, estoque: 1200 },
      'BOMBA': { venda: 430, estoque: 990 },
      'DRN': { venda: 280, estoque: 700 },
      'LJ01': { venda: 750, estoque: 1700 },
      'LJ02': { venda: 1050, estoque: 2450 },
      'LJ03': { venda: 700, estoque: 1600 },
      'LJ04': { venda: 450, estoque: 1050 },
      'LJ05': { venda: 280, estoque: 650 },
      'LJ06': { venda: 120, estoque: 290 },
      'LJ07': { venda: 40, estoque: 100 },
      'LJ08': { venda: 20, estoque: 50 }
    }
  },
  {
    id: 11,
    referenciaFornecedor: 'AL-CX-001',
    referencia: '100450',
    descricao: 'SACOLA KRAFT PERSONALIZADA MULTI 100UN',
    precoVarejo: 45.00,
    custo: 18.00,
    vendaTotal: 0, // Sem venda - apenas estoque para testar transição venda -> estoque
    estoqueTotal: 15400,
    rede: 'ALMOXARIFADO',
    tipoLoja: 'Almoxarifado',
    gestor: 'MF',
    fornecedor: 'EMBALAGENS BRASIL',
    modelo: 'SACOLA KRAFT',
    subGrupo: 'SUPRIMENTOS',
    colecao: 'PADRAO',
    grupo: 'ACESSÓRIOS',
    dadosPorColuna: {
      'MF': { venda: 0, estoque: 5200 },
      'MAX': { venda: 0, estoque: 3100 },
      'RAFAGOL': { venda: 0, estoque: 2800 },
      'TONY': { venda: 0, estoque: 1900 },
      'BOMBA': { venda: 0, estoque: 1400 },
      'DRN': { venda: 0, estoque: 1000 },
      'LJ01': { venda: 0, estoque: 3400 },
      'LJ02': { venda: 0, estoque: 4600 },
      'LJ03': { venda: 0, estoque: 3100 },
      'LJ04': { venda: 0, estoque: 2200 },
      'LJ05': { venda: 0, estoque: 1200 },
      'LJ06': { venda: 0, estoque: 600 },
      'LJ07': { venda: 0, estoque: 200 },
      'LJ08': { venda: 0, estoque: 100 }
    }
  },
  {
    id: 12,
    referenciaFornecedor: 'AL-CAB-02',
    referencia: '100488',
    descricao: 'CABIDE ACRILICO REFORCADO CRISTAL - 50UN',
    precoVarejo: 65.00,
    custo: 26.00,
    vendaTotal: 0, // Sem venda - apenas estoque
    estoqueTotal: 8900,
    rede: 'ALMOXARIFADO',
    tipoLoja: 'Almoxarifado',
    gestor: 'BOMBA',
    fornecedor: 'PLASTICOS SUL',
    modelo: 'CABIDE CRISTAL',
    subGrupo: 'SUPRIMENTOS',
    colecao: 'PADRAO',
    grupo: 'ACESSÓRIOS',
    dadosPorColuna: {
      'MF': { venda: 0, estoque: 2900 },
      'MAX': { venda: 0, estoque: 1800 },
      'RAFAGOL': { venda: 0, estoque: 1600 },
      'TONY': { venda: 0, estoque: 1100 },
      'BOMBA': { venda: 0, estoque: 900 },
      'DRN': { venda: 0, estoque: 600 },
      'LJ01': { venda: 0, estoque: 1900 },
      'LJ02': { venda: 0, estoque: 2600 },
      'LJ03': { venda: 0, estoque: 1800 },
      'LJ04': { venda: 0, estoque: 1300 },
      'LJ05': { venda: 0, estoque: 700 },
      'LJ06': { venda: 0, estoque: 380 },
      'LJ07': { venda: 0, estoque: 140 },
      'LJ08': { venda: 0, estoque: 80 }
    }
  }
];

export class MovResService {
  private static storageKey = 'mov_res_items_v1';

  public static getInitialData(): MovResItem[] {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_MOV_RES_DATA;
  }

  public static saveData(items: MovResItem[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  }

  /**
   * Applies the exact multi-tier ordering logic requested:
   * - If Ordenação === 'VENDA':
   *   1. Products with sales (vendaTotal > 0) ordered by vendaTotal DESC
   *   2. Then products without sales (vendaTotal === 0) ordered by estoqueTotal DESC
   * - If Ordenação === 'ESTOQUE':
   *   1. Products with stock (estoqueTotal > 0) ordered by estoqueTotal DESC
   *   2. Then products without stock (estoqueTotal === 0) ordered by vendaTotal DESC
   */
  public static filterAndSort(
    items: MovResItem[],
    filters: MovResFilters
  ): MovResItem[] {
    let result = items.filter(item => {
      // 1. Rede filter
      if (filters.rede && filters.rede !== 'TODAS' && item.rede !== filters.rede) {
        return false;
      }

      // 2. Tipo Loja filter
      if (filters.tipoLoja && filters.tipoLoja !== 'TODOS' && item.tipoLoja !== filters.tipoLoja) {
        return false;
      }

      // 3. Gestor filter
      if (filters.gestor && filters.gestor !== 'TODOS' && item.gestor !== filters.gestor) {
        return false;
      }

      // 4. Fornecedor / Modelo filter
      if (filters.fornecedorOuModelo && filters.fornecedorOuModelo !== 'TODOS') {
        if (filters.modoFiltro === 'FORNECEDOR') {
          if (item.fornecedor !== filters.fornecedorOuModelo) return false;
        } else {
          if (item.modelo !== filters.fornecedorOuModelo) return false;
        }
      }

      // 5. Sub Grupo / Comprador filter
      if (filters.subGrupoComprador && filters.subGrupoComprador !== 'TODOS' && item.subGrupo !== filters.subGrupoComprador) {
        return false;
      }

      // 6. Coleção filter
      if (filters.colecao && filters.colecao !== 'TODAS' && item.colecao !== filters.colecao) {
        return false;
      }

      // 7. Grupo filter
      if (filters.grupo && filters.grupo !== 'TODOS' && item.grupo !== filters.grupo) {
        return false;
      }

      // 8. Text Search
      if (filters.buscaTexto && filters.buscaTexto.trim()) {
        const query = filters.buscaTexto.toLowerCase();
        const matchesRef = item.referencia.toLowerCase().includes(query);
        const matchesRefForn = item.referenciaFornecedor.toLowerCase().includes(query);
        const matchesDesc = item.descricao.toLowerCase().includes(query);
        const matchesForn = item.fornecedor.toLowerCase().includes(query);
        if (!matchesRef && !matchesRefForn && !matchesDesc && !matchesForn) {
          return false;
        }
      }

      return true;
    });

    // Multi-tier sorting
    if (filters.ordenacao === 'VENDA') {
      result.sort((a, b) => {
        const hasVendaA = a.vendaTotal > 0;
        const hasVendaB = b.vendaTotal > 0;

        if (hasVendaA && hasVendaB) {
          return b.vendaTotal - a.vendaTotal; // highest sales first
        }
        if (hasVendaA && !hasVendaB) {
          return -1; // A comes first
        }
        if (!hasVendaA && hasVendaB) {
          return 1; // B comes first
        }
        // Both have 0 sales -> sort by highest stock
        return b.estoqueTotal - a.estoqueTotal;
      });
    } else {
      // Ordenação por ESTOQUE
      result.sort((a, b) => {
        const hasEstoqueA = a.estoqueTotal > 0;
        const hasEstoqueB = b.estoqueTotal > 0;

        if (hasEstoqueA && hasEstoqueB) {
          return b.estoqueTotal - a.estoqueTotal; // highest stock first
        }
        if (hasEstoqueA && !hasEstoqueB) {
          return -1; // A comes first
        }
        if (!hasEstoqueA && hasEstoqueB) {
          return 1; // B comes first
        }
        // Both have 0 stock -> sort by highest sales
        return b.vendaTotal - a.vendaTotal;
      });
    }

    return result;
  }

  /**
   * Helper to extract unique filter options dynamically from data
   */
  public static getFilterOptions(items: MovResItem[]) {
    const redes = Array.from(new Set(items.map(i => i.rede).filter(Boolean)));
    const tiposLoja = Array.from(new Set(items.map(i => i.tipoLoja).filter(Boolean)));
    const gestores = Array.from(new Set(items.map(i => i.gestor).filter(Boolean)));
    const fornecedores = Array.from(new Set(items.map(i => i.fornecedor).filter(Boolean)));
    const modelos = Array.from(new Set(items.map(i => i.modelo).filter(Boolean)));
    const subGrupos = Array.from(new Set(items.map(i => i.subGrupo).filter(Boolean)));
    const colecoes = Array.from(new Set(items.map(i => i.colecao).filter(Boolean)));
    const grupos = Array.from(new Set(items.map(i => i.grupo).filter(Boolean)));

    return {
      redes,
      tiposLoja,
      gestores,
      fornecedores,
      modelos,
      subGrupos,
      colecoes,
      grupos
    };
  }
}
