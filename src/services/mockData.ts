import { PdvProduct, ReportMovRes, ReportConsolidado, ClearanceItem, TransferSuggestionItem } from '../types';

export const INITIAL_PDV_PRODUCTS: PdvProduct[] = [
  {
    id: 101,
    codigo: "PRD00101",
    referencia: "CAM-POLO-AZ",
    descricao: "CAMISA POLO MASCULINA PIQUET AZUL MARINHO - G",
    ean: "7891234560011",
    precoVenda: 139.90,
    custo: 52.00,
    custoMedio: 50.80,
    estoque: 24,
    estoqueMinimo: 10,
    categoria: "Vestuário",
    subcategoria: "Camisas",
    marca: "Dudalina",
    ncm: "61051000",
    filialId: 1,
    unidade: "UN",
    diasSemVenda: 3,
    updatedAt: "2026-08-20T10:00:00"
  },
  {
    id: 102,
    codigo: "PRD00102",
    referencia: "CAL-JEANS-SK",
    descricao: "CALCA JEANS FEMININA SKINNY COM LYCRA - 38",
    ean: "7891234560028",
    precoVenda: 189.90,
    custo: 74.50,
    custoMedio: 72.00,
    estoque: 18,
    estoqueMinimo: 8,
    categoria: "Vestuário",
    subcategoria: "Calças",
    marca: "Sawary",
    ncm: "62046200",
    filialId: 1,
    unidade: "UN",
    diasSemVenda: 1,
    updatedAt: "2026-08-22T14:30:00"
  },
  {
    id: 103,
    codigo: "PRD00103",
    referencia: "VES-MIDI-FL",
    descricao: "VESTIDO MIDI ESTAMPADO FLORAL VISCOSE - M",
    ean: "", // Sem EAN de propósito para testar módulo de Colocar EAN
    precoVenda: 219.90,
    custo: 88.00,
    custoMedio: 86.50,
    estoque: 12,
    estoqueMinimo: 5,
    categoria: "Vestuário",
    subcategoria: "Vestidos",
    marca: "Farm",
    ncm: "62044200",
    filialId: 1,
    unidade: "UN",
    diasSemVenda: 8,
    updatedAt: "2026-08-15T09:15:00"
  },
  {
    id: 104,
    codigo: "PRD00104",
    referencia: "TEN-CAS-BR",
    descricao: "TENIS CASUAL UNISSEX COURO SINTETICO BRANCO - 41",
    ean: "", // Sem EAN no sistema
    precoVenda: 249.90,
    custo: 110.00,
    custoMedio: 105.00,
    estoque: 9,
    estoqueMinimo: 6,
    categoria: "Calçados",
    subcategoria: "Tênis",
    marca: "Olympikus",
    ncm: "64041100",
    filialId: 1,
    unidade: "PAR",
    diasSemVenda: 12,
    updatedAt: "2026-08-18T16:45:00"
  },
  {
    id: 105,
    codigo: "PRD00105",
    referencia: "BER-SARJA-BG",
    descricao: "BERMUDA CARGO SARJA BEGE - 42",
    ean: "7891234560059",
    precoVenda: 119.90,
    custo: 68.00, // Preço venda 119.90 / custo 68 = MKP 1.76 (abaixo da meta de 2.2)
    custoMedio: 65.00,
    estoque: 35,
    estoqueMinimo: 12,
    categoria: "Vestuário",
    subcategoria: "Bermudas",
    marca: "Hering",
    ncm: "62034200",
    filialId: 1,
    unidade: "UN",
    diasSemVenda: 75, // Parado há tempo para liquidação
    updatedAt: "2026-07-10T11:20:00"
  },
  {
    id: 106,
    codigo: "PRD00106",
    referencia: "JAQ-COURO-PR",
    descricao: "JAQUETA BOMBER COURO ECOLOGICO PRETA - G",
    ean: "7891234560066",
    precoVenda: 349.90,
    custo: 135.00,
    custoMedio: 130.00,
    estoque: 42,
    estoqueMinimo: 5,
    categoria: "Vestuário",
    subcategoria: "Casacos",
    marca: "Zara",
    ncm: "62019300",
    filialId: 1,
    unidade: "UN",
    diasSemVenda: 95, // Liquidação candidato
    updatedAt: "2026-06-01T15:00:00"
  },
  {
    id: 107,
    codigo: "PRD00107",
    referencia: "MEI-ALG-KIT3",
    descricao: "KIT MEIA CANO CURTO ALGODAO COM 3 PARES - BRANCO",
    ean: "7891234560073",
    precoVenda: 29.90,
    custo: 11.50,
    custoMedio: 11.20,
    estoque: 120,
    estoqueMinimo: 40,
    categoria: "Acessórios",
    subcategoria: "Meias",
    marca: "Lupo",
    ncm: "61159500",
    filialId: 1,
    unidade: "KIT",
    diasSemVenda: 0,
    updatedAt: "2026-08-25T17:10:00"
  },
  {
    id: 108,
    codigo: "PRD00108",
    referencia: "CIN-COURO-CV",
    descricao: "CINTO MASCULINO COURO LEGITIMO FIVELA DUPLA - 110CM",
    ean: "", // Sem EAN
    precoVenda: 89.90,
    custo: 32.00,
    custoMedio: 31.00,
    estoque: 15,
    estoqueMinimo: 10,
    categoria: "Acessórios",
    subcategoria: "Cintos",
    marca: "Fasolo",
    ncm: "42033000",
    filialId: 1,
    unidade: "UN",
    diasSemVenda: 4,
    updatedAt: "2026-08-24T11:00:00"
  }
];

// Movimento Resumido (Mov Res)
export const MOCK_MOV_RES: ReportMovRes = {
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

// Relatório Consolidado (Multilojas)
export const MOCK_CONSOLIDADO: ReportConsolidado = {
  periodo: {
    inicio: "2026-08-01",
    fim: "2026-08-27"
  },
  lojas: [
    {
      id: 1,
      nome: "Loja 01 - Matriz Centro",
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
      nome: "Loja 02 - Shopping Iguatemi",
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
      nome: "Loja 03 - Galeria Norte",
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
      nome: "Vestuário Feminino",
      vendaLiquida: 452000.00,
      participacaoPercentual: 45.6,
      quantidadePecas: 4120,
      margemMedia: 59.2
    },
    {
      nome: "Vestuário Masculino",
      vendaLiquida: 318000.00,
      participacaoPercentual: 32.1,
      quantidadePecas: 3280,
      margemMedia: 56.4
    },
    {
      nome: "Calçados",
      vendaLiquida: 142000.00,
      participacaoPercentual: 14.3,
      quantidadePecas: 740,
      margemMedia: 51.0
    },
    {
      nome: "Acessórios",
      vendaLiquida: 77900.00,
      participacaoPercentual: 8.0,
      quantidadePecas: 1850,
      margemMedia: 64.5
    }
  ]
};

// Sugestão de Liquidação
export const MOCK_CLEARANCE: ClearanceItem[] = [
  {
    id: 105,
    codigo: "PRD00105",
    referencia: "BER-SARJA-BG",
    descricao: "BERMUDA CARGO SARJA BEGE - 42",
    categoria: "Vestuário",
    estoqueAtual: 35,
    custoUnitario: 68.00,
    precoVendaOriginal: 119.90,
    diasSemVenda: 75,
    mkpAtual: 1.76,
    descontoSugeridoPercentual: 25,
    precoLiquidacaoSugerido: 89.90,
    novoMkp: 1.32,
    margemResidualPercentual: 24.3,
    recuperacaoCapitalEstimada: 3146.50,
    prioridade: "ALTA"
  },
  {
    id: 106,
    codigo: "PRD00106",
    referencia: "JAQ-COURO-PR",
    descricao: "JAQUETA BOMBER COURO ECOLOGICO PRETA - G",
    categoria: "Vestuário",
    estoqueAtual: 42,
    custoUnitario: 135.00,
    precoVendaOriginal: 349.90,
    diasSemVenda: 95,
    mkpAtual: 2.59,
    descontoSugeridoPercentual: 35,
    precoLiquidacaoSugerido: 227.40,
    novoMkp: 1.68,
    margemResidualPercentual: 40.6,
    recuperacaoCapitalEstimada: 9550.80,
    prioridade: "ALTA"
  },
  {
    id: 109,
    codigo: "PRD00109",
    referencia: "BLU-TRICOT-IN",
    descricao: "BLUSAO TRICOT GOLA ALTA INVERNO - CINZA",
    categoria: "Vestuário",
    estoqueAtual: 28,
    custoUnitario: 54.00,
    precoVendaOriginal: 149.90,
    diasSemVenda: 60,
    mkpAtual: 2.77,
    descontoSugeridoPercentual: 30,
    precoLiquidacaoSugerido: 104.90,
    novoMkp: 1.94,
    margemResidualPercentual: 48.5,
    recuperacaoCapitalEstimada: 2937.20,
    prioridade: "MEDIA"
  }
];

// Sugestão de Remanejamento entre Filiais
export const MOCK_TRANSFERS: TransferSuggestionItem[] = [
  {
    id: "TRF-001",
    codigo: "PRD00102",
    referencia: "CAL-JEANS-SK",
    descricao: "CALCA JEANS FEMININA SKINNY COM LYCRA - 38",
    categoria: "Vestuário",
    lojaOrigemId: 3,
    lojaOrigemNome: "Loja 03 - Galeria Norte",
    estoqueOrigem: 32,
    vendaOrigemUltimos30d: 4,
    diasCoberturaOrigem: 240, // Estoque alto demais
    lojaDestinoId: 2,
    lojaDestinoNome: "Loja 02 - Shopping Iguatemi",
    estoqueDestino: 2,
    vendaDestinoUltimos30d: 28,
    diasCoberturaDestino: 2, // Quase sem estoque com alta venda
    quantidadeSugeridaTransferir: 15,
    justificativa: "Loja 2 tem giro 7x maior e estoque para apenas 2 dias. Loja 3 tem 240 dias de cobertura.",
    urgencia: "CRITICA"
  },
  {
    id: "TRF-002",
    codigo: "PRD00101",
    referencia: "CAM-POLO-AZ",
    descricao: "CAMISA POLO MASCULINA PIQUET AZUL MARINHO - G",
    categoria: "Vestuário",
    lojaOrigemId: 1,
    lojaOrigemNome: "Loja 01 - Matriz Centro",
    estoqueOrigem: 45,
    vendaOrigemUltimos30d: 12,
    diasCoberturaOrigem: 112,
    lojaDestinoId: 3,
    lojaDestinoNome: "Loja 03 - Galeria Norte",
    estoqueDestino: 1,
    vendaDestinoUltimos30d: 14,
    diasCoberturaDestino: 2,
    quantidadeSugeridaTransferir: 20,
    justificativa: "Reposição da grade de polo na filial 3 com excedente da matriz.",
    urgencia: "RECOMENDADA"
  }
];
