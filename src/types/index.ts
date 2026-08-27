/**
 * Types and interfaces for PDV ERP & SEFAZ Integration
 */

export interface PdvProduct {
  id: string | number;
  codigo: string;
  referencia?: string;
  descricao: string;
  ean: string;
  precoVenda: number;
  custo: number;
  custoMedio?: number;
  estoque: number;
  estoqueMinimo?: number;
  categoria?: string;
  subcategoria?: string;
  marca?: string;
  ncm?: string;
  cest?: string;
  cfop?: string;
  filialId?: string | number;
  unidade?: string;
  diasSemVenda?: number;
  fotoUrl?: string;
  updatedAt?: string;
}

export interface SefazDuplicata {
  nDup: string;
  dVenc: string; // YYYY-MM-DD
  vDup: number;
  diasPrazo?: number; // Days from invoice issue
  prazoEsperadoDias?: number;
  statusPrazo?: 'OK' | 'DIVERGENTE' | 'PENDENTE' | 'ALERTA';
  observacao?: string;
}

export interface SefazPagamento {
  tPag: string; // 01=Dinheiro, 02=Cheque, 03=Cartão Crédito, 04=Cartão Débito, 15=Boleto, 17=PIX, 99=Outros
  tPagDescricao: string;
  vPag: number;
}

export interface SefazItem {
  nItem: number;
  cProd: string;
  cEAN: string;
  cEANTrib?: string;
  xProd: string;
  NCM: string;
  CEST?: string;
  CFOP: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  vFrete: number;
  vSeg: number;
  vDesc: number;
  vOutro: number;
  vIPI: number;
  vICMS: number;
  vICMSST: number;
  vPIS: number;
  vCOFINS: number;
  
  // Computed cost values
  custoLiquidoUnitario: number; // (vProd + vFrete + vSeg + vOutro + vIPI + vICMSST - vDesc) / qCom
  
  // Link to PDV system product (if found)
  pdvProduct?: PdvProduct | null;
  statusMatch: 'CADASTRADO' | 'NAO_CADASTRADO' | 'EAN_DIVERGENTE' | 'CUSTO_ALTERADO';
  
  // Markup analysis
  mkpAtual?: number; // PrecoVenda / Custo
  mkpSugerido?: number; // Target markup (e.g. 2.4)
  precoVendaAtual?: number;
  precoSugerido?: number;
  margemBrutaPercentual?: number;
  statusMkp?: 'ABAIXO_META' | 'NA_META' | 'ACIMA_META' | 'PREJUIZO';
}

export interface SefazInvoice {
  id: string;
  chaveAcesso: string;
  numero: string;
  serie: string;
  dataEmissao: string; // ISO date
  tipoOperacao?: 'ENTRADA' | 'SAIDA';
  emitente: {
    cnpj: string;
    xNome: string;
    xFant?: string;
    ie?: string;
    uf: string;
    municipio?: string;
  };
  destinatario: {
    cnpj: string;
    xNome: string;
    ie?: string;
    uf?: string;
  };
  totais: {
    vProd: number;
    vFrete: number;
    vSeg: number;
    vDesc: number;
    vOutro: number;
    vIPI: number;
    vST: number;
    vNF: number;
  };
  itens: SefazItem[];
  duplicatas: SefazDuplicata[];
  pagamentos: SefazPagamento[];
  condicaoPagamentoDeclarada?: string; // ex: 30/60/90
  prazoMedioDias?: number;
  xmlRaw?: string;
  xmlOriginal?: string;
  fileName?: string;
}

export interface MkpConfig {
  metaMkpPadrao: number; // e.g. 2.20 (220% or factor 2.2)
  tipoCalculo: 'MULTIPLICADOR' | 'MARGEM_PERCENTUAL'; // Fator multiplicador ou Margem %
  margemMinimaPercentual: number; // e.g. 35%
  considerarImpostosNaVenda: boolean;
  aliquotaImpostoVendaPercentual: number; // e.g. 12% Simples / ICMS/PIS/COFINS
  despesasOperacionaisPercentual: number; // e.g. 15%
}

export interface ReportMovRes {
  data: string;
  filialNome: string;
  filialId: string | number;
  totalVendasBruto: number;
  totalDescontos: number;
  totalVendasLiquido: number;
  totalCustoMercadoria: number;
  lucroBruto: number;
  margemBrutaPercentual: number;
  quantidadeAtendimentos: number;
  quantidadePecasVendidas: number;
  ticketMedioValor: number;
  pecasPorAtendimento: number;
  precoMedioPeca: number;
  formasPagamento: {
    cartaoCredito: number;
    cartaoDebito: number;
    pix: number;
    dinheiro: number;
    crediario: number;
    convenio: number;
    outros: number;
  };
  totalDevolucoes: number;
  totalCancelamentos: number;
  horarioPico?: string;
}

export interface ReportConsolidado {
  periodo: {
    inicio: string;
    fim: string;
  };
  lojas: {
    id: string | number;
    nome: string;
    vendaBruta: number;
    vendaLiquida: number;
    meta: number;
    atingimentoMetaPercentual: number;
    ticketMedio: number;
    quantidadeVendas: number;
    estoqueValorCusto: number;
    estoqueValorVenda: number;
    coberturaDiasEstoque: number;
  }[];
  categorias: {
    nome: string;
    vendaLiquida: number;
    participacaoPercentual: number;
    quantidadePecas: number;
    margemMedia: number;
  }[];
}

export interface ClearanceItem {
  id: string | number;
  codigo: string;
  referencia: string;
  descricao: string;
  categoria: string;
  estoqueAtual: number;
  custoUnitario: number;
  precoVendaOriginal: number;
  diasSemVenda: number;
  mkpAtual: number;
  
  // Liquidation proposals
  descontoSugeridoPercentual: number;
  precoLiquidacaoSugerido: number;
  novoMkp: number;
  margemResidualPercentual: number;
  recuperacaoCapitalEstimada: number;
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
}

export interface TransferSuggestionItem {
  id: string;
  codigo: string;
  referencia: string;
  descricao: string;
  categoria: string;
  lojaOrigemId: string | number;
  lojaOrigemNome: string;
  estoqueOrigem: number;
  vendaOrigemUltimos30d: number;
  diasCoberturaOrigem: number;
  
  lojaDestinoId: string | number;
  lojaDestinoNome: string;
  estoqueDestino: number;
  vendaDestinoUltimos30d: number;
  diasCoberturaDestino: number;
  
  quantidadeSugeridaTransferir: number;
  justificativa: string;
  urgencia: 'CRITICA' | 'RECOMENDADA' | 'OPCIONAL';
}

export interface PhotoMappingItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  previewUrl: string;
  status: 'MAPEADO' | 'NAO_MAPEADO' | 'PROCESSADO';
  codigoIdentificado?: string;
  eanIdentificado?: string;
  referenciaIdentificada?: string;
  produtoPdvCorrespondente?: PdvProduct;
  novoNomeArquivoSugerido?: string;
}

export interface SefazCertificate {
  fileName: string;
  cnpj: string;
  cpf?: string;
  razaoSocial: string;
  nomeFantasia?: string;
  emissor: string;
  numeroSerie: string;
  validadeInicio: string;
  validadeFim: string;
  diasRestantes: number;
  status: 'VALIDO' | 'EXPIRADO' | 'ALERTA_VENCIMENTO';
  tipo: 'A1';
  uf: string;
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO';
  hasPrivateKey: boolean;
  thumbprint?: string;
  uploadedAt: string;
  lastSyncAt?: string;
}

export interface SefazFaturamentoReport {
  cnpj: string;
  razaoSocial: string;
  uf: string;
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO';
  periodo: {
    inicio: string;
    fim: string;
  };
  totalVendasFaturadas: number;
  totalComprasFornecedores: number;
  totalNotasEmitidas: number;
  totalNotasRecebidas: number;
  totalNotasCanceladas: number;
  impostosTotais: {
    icms: number;
    pis: number;
    cofins: number;
    ipi: number;
    icmsSt: number;
  };
  notasEmitidas: SefazInvoice[];
  notasRecebidas: SefazInvoice[];
  faturamentoDiario: { data: string; valorVendas: number; valorCompras: number; count: number }[];
  topClientes: { cnpj: string; nome: string; totalFaturado: number; totalNotas: number }[];
  topFornecedores: { cnpj: string; nome: string; totalComprado: number; totalNotas: number }[];
  statusSefaz: {
    online: boolean;
    cStat: number;
    xMotivo: string;
    tempoRespostaMs: number;
    ultimoNSU: string;
    maxNSU: string;
  };
}

export interface ApiConfig {
  baseUrl: string;
  usuario?: string;
  senha?: string;
  token?: string;
  apiKey?: string;
  filialPadrao?: string | number;
  usarProxyLocal: boolean;
  timeoutMs: number;
  lastConnected?: string;
  statusConexao: 'ONLINE' | 'OFFLINE' | 'DEMO' | 'TESTANDO';
}

export interface PdvSwaggerEndpoint {
  path: string;
  method: string;
  tags: string[];
  summary: string;
  operationId?: string;
  parameters: Array<{
    name: string;
    in: 'query' | 'header' | 'path' | 'body';
    required: boolean;
    type?: string;
    description?: string;
    default?: any;
    schema?: any;
  }>;
  responses: Record<string, any>;
}

export interface PdvSyncSummary {
  totalLojas: number;
  totalRedes: number;
  totalVendedores: number;
  totalProdutosPuxados: number;
  totalVariacoesPuxadas: number;
  totalCanaisVenda: number;
  totalTiposDesconto: number;
  totalTiposPessoa: number;
  totalCartoes: number;
  totalRegrasAtivas: number;
  totalTabelasPreco: number;
  totalLojasComVenda: number;
  endpointsSucesso: number;
  endpointsErro: number;
  duracaoMs: number;
}

export interface PdvSyncData {
  success: boolean;
  timestamp: string;
  usuario: string;
  baseUrl: string;
  summary: PdvSyncSummary;
  results: Record<string, any>;
  errors: Record<string, string>;
}
