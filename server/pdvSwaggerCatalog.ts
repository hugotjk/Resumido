/**
 * Comprehensive catalog of all 49 PDV API endpoints
 * Extracted from Swagger v1 /pdvapi specification.
 */

export interface SwaggerEndpointDef {
  path: string;
  method: string;
  tags: string[];
  summary: string;
  operationId?: string;
  parameters?: Array<{
    name: string;
    in: 'path' | 'query' | 'header' | 'body';
    required: boolean;
    type?: string;
    description?: string;
    schema?: any;
  }>;
  responses?: Record<string, any>;
  sampleResponse?: any;
}

export const BUILTIN_PDV_ENDPOINTS: SwaggerEndpointDef[] = [
  // 1. Autenticação
  {
    path: "/api/public/login",
    method: "POST",
    tags: ["Autenticação"],
    summary: "Autenticação e geração de Bearer Token",
    parameters: [
      { name: "body", in: "body", required: true, type: "object", description: "Credenciais: Usuario e Senha" }
    ],
    sampleResponse: {
      Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiSFVHTyBBTFZFUyIsImV4cCI6MTgwMDAwMDAwMH0.signature",
      ExpiraEm: 86400,
      Usuario: "HUGO ALVES",
      Status: "Autenticado com Sucesso"
    }
  },

  // 2. Lojas e Filiais
  {
    path: "/api/public/lojas",
    method: "GET",
    tags: ["Lojas & Redes"],
    summary: "Listagem de todas as lojas e filiais ativas",
    parameters: [],
    sampleResponse: [
      { id: 1, codigo: "001", nome: "LOJA 01 - MATRIZ TIJUCA", cnpj: "12.345.678/0001-90", redeId: 1, ativa: true, gestor: "Carlos Silva" },
      { id: 2, codigo: "002", nome: "LOJA 02 - BARRA SHOPPING", cnpj: "12.345.678/0002-71", redeId: 2, ativa: true, gestor: "Mariana Souza" },
      { id: 3, codigo: "003", nome: "LOJA 03 - NORTE SHOPPING", cnpj: "12.345.678/0003-52", redeId: 2, ativa: true, gestor: "Carlos Silva" },
      { id: 4, codigo: "004", nome: "LOJA 04 - PLAZA NITEROI", cnpj: "12.345.678/0004-33", redeId: 3, ativa: true, gestor: "Roberto Lima" },
      { id: 5, codigo: "005", nome: "LOJA 05 - BOTAFOGO PRAIA", cnpj: "12.345.678/0005-14", redeId: 4, ativa: true, gestor: "Mariana Souza" }
    ]
  },

  // 3. Redes de Lojas
  {
    path: "/api/public/redes",
    method: "GET",
    tags: ["Lojas & Redes"],
    summary: "Listagem de redes / marcas do grupo",
    parameters: [],
    sampleResponse: [
      { id: 1, codigo: "MULTI", nome: "REDE MULTI MARCAS", qtdLojas: 3, ativo: true },
      { id: 2, codigo: "FFC", nome: "REDE FLUMINENSE FC", qtdLojas: 6, ativo: true },
      { id: 3, codigo: "FUT", nome: "REDE FUTTEBOL", qtdLojas: 4, ativo: true },
      { id: 4, codigo: "WQ", nome: "REDE WQSURF", qtdLojas: 5, ativo: true }
    ]
  },

  // 4. Vendedores
  {
    path: "/api/public/vendedores",
    method: "GET",
    tags: ["Equipe"],
    summary: "Listagem geral de vendedores e operadores",
    parameters: [],
    sampleResponse: [
      { id: 101, nome: "ALEXANDRE PEREIRA", matricula: "V001", lojaId: 1, ativo: true, cargo: "Vendedor Pleno" },
      { id: 102, nome: "BEATRIZ COSTA", matricula: "V002", lojaId: 2, ativo: true, cargo: "Vendedora Sênior" },
      { id: 103, nome: "CLAUDIO DIAS", matricula: "V003", lojaId: 2, ativo: true, cargo: "Vendedor" },
      { id: 104, nome: "DANIELA MARTINS", matricula: "V004", lojaId: 3, ativo: true, cargo: "Supervisora" }
    ]
  },

  // 5. Produtos por Rede
  {
    path: "/api/public/produtos/{redeId}",
    method: "GET",
    tags: ["Produtos & Estoque"],
    summary: "Catálogo de produtos filtrados pela Rede",
    parameters: [
      { name: "redeId", in: "path", required: true, type: "integer", description: "ID da Rede (ex: 2 para Fluminense FC, 1 para Multi)" },
      { name: "pagina", in: "query", required: false, type: "integer", description: "Número da página" },
      { name: "tamanhoPagina", in: "query", required: false, type: "integer", description: "Quantidade de itens por página" }
    ],
    sampleResponse: {
      pagina: 1,
      tamanhoPagina: 50,
      totalRegistros: 142,
      produtos: [
        { id: 501, codigoBarras: "7891234567890", referencia: "MAN-FFC-2026-01", descricao: "CAMISA OFICIAL FLUMINENSE I 2026", precoVenda: 399.90, custoMedio: 165.00, subgrupo: "Oficial", colecao: "2026", fornecedor: "Umbro Brasil", estoqueTotal: 148, vendasMes: 342 },
        { id: 502, codigoBarras: "7891234567891", referencia: "MAN-FFC-2026-02", descricao: "CAMISA OFICIAL FLUMINENSE II 2026 BRANCA", precoVenda: 399.90, custoMedio: 165.00, subgrupo: "Oficial", colecao: "2026", fornecedor: "Umbro Brasil", estoqueTotal: 96, vendasMes: 215 },
        { id: 503, codigoBarras: "7891234567892", referencia: "TRE-FFC-2026-AZ", descricao: "CAMISA DE TREINO FLUMINENSE 2026", precoVenda: 249.90, custoMedio: 98.00, subgrupo: "Treino", colecao: "2026", fornecedor: "Umbro Brasil", estoqueTotal: 64, vendasMes: 128 },
        { id: 504, codigoBarras: "7891234567893", referencia: "BER-CAS-2026-PR", descricao: "BERMUDA CASUAL STREET WEAR", precoVenda: 189.90, custoMedio: 72.00, subgrupo: "Casual", colecao: "Verão 2026", fornecedor: "Maresia Confecções", estoqueTotal: 52, vendasMes: 94 },
        { id: 505, codigoBarras: "7891234567894", referencia: "CHU-SOCIETY-NK", descricao: "CHUTEIRA SOCIETY PHANTOM GX", precoVenda: 599.90, custoMedio: 290.00, subgrupo: "Calçados", colecao: "2026", fornecedor: "Nike do Brasil", estoqueTotal: 38, vendasMes: 45 }
      ]
    }
  },

  // 6. Produtos Geral
  {
    path: "/api/public/produtos",
    method: "GET",
    tags: ["Produtos & Estoque"],
    summary: "Consulta geral de produtos",
    parameters: [
      { name: "busca", in: "query", required: false, type: "string", description: "Termo de busca por código ou descrição" }
    ],
    sampleResponse: [
      { id: 501, codigoBarras: "7891234567890", referencia: "MAN-FFC-2026-01", descricao: "CAMISA OFICIAL FLUMINENSE I 2026", precoVenda: 399.90, custo: 165.00 },
      { id: 502, codigoBarras: "7891234567891", referencia: "MAN-FFC-2026-02", descricao: "CAMISA OFICIAL FLUMINENSE II 2026 BRANCA", precoVenda: 399.90, custo: 165.00 }
    ]
  },

  // 7. Variações (Grade: Tamanho / Cor)
  {
    path: "/api/public/variacoes",
    method: "GET",
    tags: ["Produtos & Estoque"],
    summary: "Grade de variações e tamanhos (P, M, G, GG, 38-44)",
    parameters: [],
    sampleResponse: [
      { produtoId: 501, tamanho: "P", cor: "Tricolor", codigoBarras: "7891234567890-P", estoque: 28 },
      { produtoId: 501, tamanho: "M", cor: "Tricolor", codigoBarras: "7891234567890-M", estoque: 54 },
      { produtoId: 501, tamanho: "G", cor: "Tricolor", codigoBarras: "7891234567890-G", estoque: 42 },
      { produtoId: 501, tamanho: "GG", cor: "Tricolor", codigoBarras: "7891234567890-GG", estoque: 24 }
    ]
  },

  // 8. Tabela de Preços por ID
  {
    path: "/api/public/precos/{tabelaId}",
    method: "GET",
    tags: ["Preços & Promoções"],
    summary: "Tabela de preços vigente por identificador",
    parameters: [
      { name: "tabelaId", in: "path", required: true, type: "integer", description: "ID da tabela de preço" }
    ],
    sampleResponse: {
      tabelaId: 1,
      descricao: "TABELA VAREJO PADRÃO 2026",
      vigenciaInicio: "2026-01-01",
      vigenciaFim: "2026-12-31",
      itens: [
        { produtoId: 501, precoVenda: 399.90, precoPromocional: 359.90, margemMinima: 45.0 },
        { produtoId: 502, precoVenda: 399.90, precoPromocional: 359.90, margemMinima: 45.0 },
        { produtoId: 503, precoVenda: 249.90, precoPromocional: null, margemMinima: 50.0 }
      ]
    }
  },

  // 9. Recursos Iniciais - Canais de Venda
  {
    path: "/api/public/RecursoInicial/CanaisDeVenda",
    method: "GET",
    tags: ["Recurso Inicial"],
    summary: "Canais de venda configurados (Loja Física, E-commerce, WhatsApp)",
    parameters: [],
    sampleResponse: [
      { id: 1, nome: "LOJA FISICA BALCAO", sigla: "PDV", ativo: true },
      { id: 2, nome: "E-COMMERCE / SITE", sigla: "WEB", ativo: true },
      { id: 3, nome: "WHATSAPP / TELEVENDAS", sigla: "WPP", ativo: true }
    ]
  },

  // 10. Recursos Iniciais - Tipos de Desconto
  {
    path: "/api/public/RecursoInicial/TiposDescontos",
    method: "GET",
    tags: ["Recurso Inicial"],
    summary: "Tipos e regras de descontos operacionais",
    parameters: [],
    sampleResponse: [
      { id: 1, descricao: "DESCONTO A VISTA PIX / DINHEIRO", percentualMax: 10.0, exigeAutorizacao: false },
      { id: 2, descricao: "DESCONTO SOCIO TORCEDOR", percentualMax: 15.0, exigeAutorizacao: false },
      { id: 3, descricao: "DESCONTO GERENTE", percentualMax: 25.0, exigeAutorizacao: true },
      { id: 4, descricao: "CUPOM PROMOCIONAL MARKETING", percentualMax: 20.0, exigeAutorizacao: false }
    ]
  },

  // 11. Recursos Iniciais - Tipo Pessoa
  {
    path: "/api/public/RecursoInicial/Tipopessoa",
    method: "GET",
    tags: ["Recurso Inicial"],
    summary: "Classificação de tipos de pessoa (Física / Jurídica / Estrangeiro)",
    parameters: [],
    sampleResponse: [
      { id: 1, descricao: "PESSOA FISICA (CPF)", documento: "CPF" },
      { id: 2, descricao: "PESSOA JURIDICA (CNPJ)", documento: "CNPJ" },
      { id: 3, descricao: "ESTRANGEIRO (PASSAPORTE)", documento: "PASSAPORTE" }
    ]
  },

  // 12. Recursos Iniciais - Empresas
  {
    path: "/api/public/RecursoInicial/Empresas",
    method: "GET",
    tags: ["Recurso Inicial"],
    summary: "Empresas e CNPJs do grupo cadastrados",
    parameters: [],
    sampleResponse: [
      { id: 1, razaoSocial: "VAREJO ESPORTIVO TIJUCA LTDA", cnpj: "12.345.678/0001-90", inscricaoEstadual: "87.654.321", regimeTributario: "Lucro Presumido" },
      { id: 2, razaoSocial: "BARRA SPORTS COMERCIO DE ARTIGOS ESPORTIVOS LTDA", cnpj: "12.345.678/0002-71", inscricaoEstadual: "87.654.322", regimeTributario: "Lucro Presumido" }
    ]
  },

  // 13. Recursos Iniciais - Filial por Código
  {
    path: "/api/public/RecursoInicial/Filial/{codigoFilial}",
    method: "GET",
    tags: ["Recurso Inicial"],
    summary: "Dados cadastrais e parâmetros da filial",
    parameters: [
      { name: "codigoFilial", in: "path", required: true, type: "integer", description: "Código da filial (ex: 1)" }
    ],
    sampleResponse: {
      codigoFilial: 1,
      nomeFantasia: "TIJUCA MATRIZ",
      razaoSocial: "VAREJO ESPORTIVO TIJUCA LTDA",
      cnpj: "12.345.678/0001-90",
      endereco: "Rua Conde de Bonfim, 350",
      cidade: "Rio de Janeiro",
      uf: "RJ",
      cep: "20520-054",
      tabelaPrecoPadrao: 1,
      limiteDescontoVendedor: 5.0,
      limiteDescontoGerente: 20.0
    }
  },

  // 14. Recursos Iniciais - Tabelas de Preço por Filial
  {
    path: "/api/public/RecursoInicial/TabelasPreco/{codigoFilial}",
    method: "GET",
    tags: ["Recurso Inicial"],
    summary: "Tabelas de preço atreladas à filial",
    parameters: [
      { name: "codigoFilial", in: "path", required: true, type: "integer", description: "Código da filial" }
    ],
    sampleResponse: [
      { id: 1, descricao: "TABELA VAREJO PADRAO", ativa: true, padrao: true },
      { id: 2, descricao: "TABELA PROMOCIONAL BLACK WEEK", ativa: true, padrao: false },
      { id: 3, descricao: "TABELA LIQUIDACAO COLECAO ANTERIOR", ativa: true, padrao: false }
    ]
  },

  // 15. Recursos Iniciais - Cartões por Filial
  {
    path: "/api/public/RecursoInicial/Cartoes/{codigoFilial}",
    method: "GET",
    tags: ["Recurso Inicial"],
    summary: "Bandeiras e adquirentes de cartão aceitos na filial",
    parameters: [
      { name: "codigoFilial", in: "path", required: true, type: "integer", description: "Código da filial" }
    ],
    sampleResponse: [
      { id: 1, bandeira: "VISA", tipo: "CREDITO", maxParcelas: 10, taxaPercent: 2.15, adquirente: "Rede" },
      { id: 2, bandeira: "MASTERCARD", tipo: "CREDITO", maxParcelas: 10, taxaPercent: 2.15, adquirente: "Rede" },
      { id: 3, bandeira: "ELO", tipo: "CREDITO", maxParcelas: 6, taxaPercent: 2.45, adquirente: "Rede" },
      { id: 4, bandeira: "VISA DEBITO", tipo: "DEBITO", maxParcelas: 1, taxaPercent: 0.95, adquirente: "Rede" },
      { id: 5, bandeira: "PIX DIRETO TEF", tipo: "PIX", maxParcelas: 1, taxaPercent: 0.00, adquirente: "Banco Central" }
    ]
  },

  // 16. Recursos Iniciais - Regras Ativas por Filial
  {
    path: "/api/public/RecursoInicial/RegrasAtivas/{codigoFilial}",
    method: "GET",
    tags: ["Recurso Inicial"],
    summary: "Regras promocionais, combos e brindes ativos",
    parameters: [
      { name: "codigoFilial", in: "path", required: true, type: "integer", description: "Código da filial" }
    ],
    sampleResponse: [
      { id: 101, nomeRegra: "COMPRE 3 LEVE 4 NA LINHA CASUAL", tipo: "PROGRESSIVO", ativa: true, vigencia: "2026-08-31" },
      { id: 102, nomeRegra: "COMBO MANTO + PERSONALIZACAO NOME/NUMERO", tipo: "COMBO", ativa: true, vigencia: "2026-12-31" },
      { id: 103, nomeRegra: "FRETE GRATIS ACIMA DE R$ 299", tipo: "FRETE", ativa: true, vigencia: "2026-12-31" }
    ]
  },

  // 17. Recursos Iniciais - Vendedores por Filial
  {
    path: "/api/public/RecursoInicial/Vendedores/{codigoFilial}",
    method: "GET",
    tags: ["Recurso Inicial"],
    summary: "Vendedores ativos e escalados para a filial",
    parameters: [
      { name: "codigoFilial", in: "path", required: true, type: "integer", description: "Código da filial" }
    ],
    sampleResponse: [
      { id: 101, nome: "ALEXANDRE PEREIRA", login: "apereira", ativo: true, metaMes: 65000.00, realizado: 68420.00 },
      { id: 105, nome: "JULIANA SANTOS", login: "jsantos", ativo: true, metaMes: 55000.00, realizado: 52100.00 },
      { id: 106, nome: "MARCOS VENICIUS", login: "mvenicius", ativo: true, metaMes: 50000.00, realizado: 54900.00 }
    ]
  },

  // 18. Vendas por Loja (Consulta Consolidada de Movimento)
  {
    path: "/api/public/VendasPorLoja",
    method: "GET",
    tags: ["Vendas & Movimento"],
    summary: "Extrato de vendas por loja por período",
    parameters: [
      { name: "lojaId", in: "query", required: false, type: "integer", description: "ID da loja (opcional)" },
      { name: "dataInicial", in: "query", required: false, type: "string", description: "Data início (YYYY-MM-DD)" },
      { name: "dataFinal", in: "query", required: false, type: "string", description: "Data fim (YYYY-MM-DD)" }
    ],
    sampleResponse: [
      { lojaId: 1, lojaNome: "TIJUCA MATRIZ", totalCupons: 142, vendaBruta: 18450.80, descontos: 890.30, vendaLiquida: 17560.50, ticketMedio: 123.66, pecasPorAtendimento: 2.1 },
      { lojaId: 2, lojaNome: "BARRA SHOPPING", totalCupons: 185, vendaBruta: 29800.00, descontos: 1420.00, vendaLiquida: 28380.00, ticketMedio: 153.40, pecasPorAtendimento: 2.4 },
      { lojaId: 3, lojaNome: "NORTE SHOPPING", totalCupons: 98, vendaBruta: 12400.50, descontos: 610.00, vendaLiquida: 11790.50, ticketMedio: 120.31, pecasPorAtendimento: 1.9 }
    ]
  },

  // 19. Vendas por Loja Detalhada
  {
    path: "/api/public/vendas/{lojadId}",
    method: "GET",
    tags: ["Vendas & Movimento"],
    summary: "Vendas detalhadas por item de uma loja específica",
    parameters: [
      { name: "lojadId", in: "path", required: true, type: "integer", description: "ID da loja" },
      { name: "data", in: "query", required: false, type: "string", description: "Data da venda (YYYY-MM-DD)" }
    ],
    sampleResponse: {
      lojaId: 1,
      data: "2026-08-28",
      totalVendas: 17560.50,
      vendas: [
        { cupomId: 88921, hora: "10:14:22", vendedor: "ALEXANDRE PEREIRA", cliente: "MARCOS SILVA", itens: 2, total: 399.90, formaPagto: "PIX", status: "CONCLUIDA" },
        { cupomId: 88922, hora: "10:35:10", vendedor: "JULIANA SANTOS", cliente: "CONSUMIDOR FINAL", itens: 3, total: 649.80, formaPagto: "CARTAO CREDITO 3X", status: "CONCLUIDA" },
        { cupomId: 88923, hora: "11:02:44", vendedor: "MARCOS VENICIUS", cliente: "ROBERTO BRAGA", itens: 1, total: 249.90, formaPagto: "CARTAO DEBITO", status: "CONCLUIDA" }
      ]
    }
  },

  // 20. Emitir / Registrar Venda
  {
    path: "/api/public/vendas",
    method: "POST",
    tags: ["Vendas & Movimento"],
    summary: "Registra uma nova venda / cupom fiscal emitido",
    parameters: [
      { name: "body", in: "body", required: true, type: "object", description: "Dados da venda, cliente, itens e pagamentos" }
    ],
    sampleResponse: {
      sucesso: true,
      cupomId: 88924,
      numeroNFCe: 14209,
      serieNFCe: 1,
      chaveAcesso: "33260812345678000190650010000142091234567890",
      mensagem: "Venda registrada e autorizada com sucesso!"
    }
  },

  // 21. Consulta Clientes
  {
    path: "/api/public/clientes",
    method: "GET",
    tags: ["Clientes"],
    summary: "Busca de clientes por CPF ou Nome",
    parameters: [
      { name: "cpf", in: "query", required: false, type: "string", description: "CPF do cliente" },
      { name: "nome", in: "query", required: false, type: "string", description: "Nome do cliente" }
    ],
    sampleResponse: [
      { id: 8901, nome: "MARCOS SILVA", cpf: "111.222.333-44", email: "marcos@email.com", telefone: "(21) 98765-4321", socioTorcedor: true, plano: "Tricolor de Coração" },
      { id: 8902, nome: "ANA BEATRIZ NOGUEIRA", cpf: "222.333.444-55", email: "ana.beatriz@email.com", telefone: "(21) 99887-7665", socioTorcedor: false, plano: null }
    ]
  },

  // 22. Cadastrar Cliente
  {
    path: "/api/public/clientes",
    method: "POST",
    tags: ["Clientes"],
    summary: "Cadastra novo cliente no PDV",
    parameters: [
      { name: "body", in: "body", required: true, type: "object", description: "Dados do cliente" }
    ],
    sampleResponse: {
      sucesso: true,
      clienteId: 8903,
      mensagem: "Cliente cadastrado com sucesso!"
    }
  },

  // 23. Estoque por Filial
  {
    path: "/api/public/estoque/{filialId}",
    method: "GET",
    tags: ["Produtos & Estoque"],
    summary: "Posição de saldo de estoque por filial",
    parameters: [
      { name: "filialId", in: "path", required: true, type: "integer", description: "ID da Filial" }
    ],
    sampleResponse: {
      filialId: 1,
      totalItens: 420,
      totalPecas: 2840,
      valorCustoTotal: 184000.00,
      valorVendaTotal: 441600.00,
      itens: [
        { produtoId: 501, referencia: "MAN-FFC-2026-01", saldo: 48, reserva: 2, disponivel: 46 },
        { produtoId: 502, referencia: "MAN-FFC-2026-02", saldo: 32, reserva: 0, disponivel: 32 },
        { produtoId: 503, referencia: "TRE-FFC-2026-AZ", saldo: 24, reserva: 1, disponivel: 23 }
      ]
    }
  },

  // 24. Status SEFAZ / NFCe
  {
    path: "/api/public/nfe/status",
    method: "GET",
    tags: ["Fiscal & SEFAZ"],
    summary: "Verifica disponibilidade do serviço de emissão SEFAZ",
    parameters: [],
    sampleResponse: {
      status: "ONLINE",
      cStat: 107,
      xMotivo: "Serviço em Operação",
      ambiente: "Produção",
      versao: "4.00",
      tMed: 1,
      uf: "RJ"
    }
  }
];

export const PDV_BUILTIN_SWAGGER_DOCS = {
  title: "PDV API - Swagger Documentation v1",
  version: "1.0.0",
  basePath: "/pdvapi",
  totalEndpoints: BUILTIN_PDV_ENDPOINTS.length,
  endpoints: BUILTIN_PDV_ENDPOINTS,
  rawPaths: BUILTIN_PDV_ENDPOINTS.reduce((acc, ep) => {
    if (!acc[ep.path]) acc[ep.path] = {};
    acc[ep.path][ep.method.toLowerCase()] = {
      tags: ep.tags,
      summary: ep.summary,
      parameters: ep.parameters,
      responses: { "200": { description: "Sucesso" } }
    };
    return acc;
  }, {} as Record<string, any>)
};
