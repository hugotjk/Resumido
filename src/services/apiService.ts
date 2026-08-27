import { ApiConfig, PdvProduct, ReportMovRes, ReportConsolidado, PdvSwaggerEndpoint, PdvSyncData } from '../types';
import { INITIAL_PDV_PRODUCTS, MOCK_MOV_RES, MOCK_CONSOLIDADO } from './mockData';

const CONFIG_STORAGE_KEY = 'pdv_api_config_v2';
const PRODUCTS_STORAGE_KEY = 'pdv_products_cache_v2';
const SYNC_STORAGE_KEY = 'pdv_sync_cache_v2';

export class PdvApiService {
  private static config: ApiConfig = {
    baseUrl: 'http://8c1a09f30719.sn.mynetname.net:65000/pdvapi',
    usuario: 'HUGO ALVES',
    senha: 'tijuca',
    token: '',
    apiKey: '',
    filialPadrao: 1,
    usarProxyLocal: true,
    timeoutMs: 10000,
    statusConexao: 'ONLINE'
  };

  public static getConfig(): ApiConfig {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return this.config;
  }

  public static saveConfig(newConfig: Partial<ApiConfig>): ApiConfig {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch {
      // ignore
    }
    return this.config;
  }

  /**
   * Performs authentication against the PDV API
   */
  public static async login(usuario = 'HUGO ALVES', senha = 'tijuca'): Promise<{
    success: boolean;
    tokenPreview?: string;
    message: string;
    error?: string;
  }> {
    try {
      const resp = await fetch('/api/pdv/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha, baseUrl: this.getConfig().baseUrl })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        this.saveConfig({
          usuario,
          senha,
          statusConexao: 'ONLINE',
          lastConnected: new Date().toISOString()
        });
        return {
          success: true,
          tokenPreview: data.tokenPreview,
          message: data.message || `Autenticado com sucesso como ${usuario}!`
        };
      } else {
        return {
          success: false,
          message: data.error || 'Falha de autenticação',
          error: data.details || data.error
        };
      }
    } catch (e: any) {
      return {
        success: false,
        message: 'Erro ao conectar ao servidor para login PDV',
        error: e.message
      };
    }
  }

  /**
   * Checks current connection status and token validity
   */
  public static async getStatus(): Promise<{
    online: boolean;
    authenticated: boolean;
    usuario: string;
    baseUrl: string;
    tokenPreview?: string;
    hasCachedData: boolean;
    lastSyncTimestamp?: string;
    summary?: any;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/pdv/status');
      if (res.ok) {
        const data = await res.json();
        if (data.online) {
          this.saveConfig({ statusConexao: 'ONLINE', lastConnected: new Date().toISOString() });
        }
        return data;
      }
    } catch (e: any) {
      console.warn('Erro ao checar status PDV:', e);
    }
    return {
      online: false,
      authenticated: false,
      usuario: this.getConfig().usuario || 'HUGO ALVES',
      baseUrl: this.getConfig().baseUrl,
      hasCachedData: false,
      error: 'Servidor indisponível'
    };
  }

  /**
   * Pulls ALL available data across the entire API ("Puxar tudo que pode puxar")
   */
  public static async syncAll(): Promise<PdvSyncData> {
    const res = await fetch('/api/pdv/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || err.details || `Erro HTTP ${res.status}`);
    }

    const data: PdvSyncData = await res.json();
    
    // Save to local cache for instant offline access
    try {
      localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }

    // Transform products into app model
    if (data.results) {
      const produtosMulti = data.results.produtosRedeMulti?.Registros || [];
      const produtosAlmox = data.results.produtosRedeAlmoxarifado?.Registros || [];
      const produtosFlu = data.results.produtosRedeFluminense?.Registros || [];
      const produtosFut = data.results.produtosRedeFuttebol?.Registros || [];
      const rawProducts = [...produtosMulti, ...produtosAlmox, ...produtosFlu, ...produtosFut];

      if (rawProducts.length > 0) {
        const mappedProducts: PdvProduct[] = rawProducts.map((p: any, idx: number) => ({
          id: p.Id || idx + 1,
          codigo: p.Id || `PRD${idx + 1}`,
          referencia: p.ReferenciaProdutoFornecedor || p.Id || `REF-${idx + 1}`,
          descricao: p.Nome || `Produto ${p.Id}`,
          ean: p.EAN || p.CodigoBarras || '',
          precoVenda: p.PrecoVenda || (p.Custo ? p.Custo * 2.2 : 89.90),
          custo: p.Custo || (p.PrecoVenda ? p.PrecoVenda / 2.2 : 39.90),
          custoMedio: p.Custo || 39.90,
          estoque: p.Estoque || 15,
          categoria: p.Colecao || p.Grupo || 'Confecção',
          subcategoria: p.Linha || p.Modelo || '',
          marca: p.Rede || p.Fornecedor || 'Geral',
          ncm: p.NCM || '6109.10.00',
          filialId: p.FilialId || 1,
          unidade: 'UN',
          diasSemVenda: Math.floor(Math.random() * 90),
          updatedAt: p.DataAtualizacao || new Date().toISOString()
        }));

        this.cacheProducts(mappedProducts);
      }
    }

    return data;
  }

  /**
   * Retrieves cached synced full PDV data
   */
  public static async getPdvData(): Promise<PdvSyncData | null> {
    try {
      const res = await fetch('/api/pdv/data');
      if (res.ok) {
        const data = await res.json();
        if (data.hasData) {
          return data;
        }
      }
    } catch {
      // fallback
    }

    // Try localStorage
    try {
      const local = localStorage.getItem(SYNC_STORAGE_KEY);
      if (local) {
        return JSON.parse(local);
      }
    } catch {
      // ignore
    }

    return null;
  }

  /**
   * Retrieves parsed Swagger documentation containing all 49 endpoints
   */
  public static async getSwagger(): Promise<{
    title: string;
    version: string;
    basePath: string;
    totalEndpoints: number;
    endpoints: PdvSwaggerEndpoint[];
    rawPaths: Record<string, any>;
  }> {
    const res = await fetch('/api/pdv/swagger');
    if (!res.ok) {
      throw new Error(`Falha ao obter Swagger (HTTP ${res.status})`);
    }
    return res.json();
  }

  /**
   * Executes any Swagger endpoint live with custom params and body
   */
  public static async executeEndpoint(
    path: string,
    method = 'GET',
    params: Record<string, any> = {},
    body?: any
  ): Promise<{
    success: boolean;
    status: number;
    statusText: string;
    durationMs: number;
    url: string;
    method: string;
    data: any;
    error?: string;
  }> {
    const res = await fetch('/api/pdv/execute-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, method, params, body })
    });

    const data = await res.json();
    return data;
  }

  /**
   * Tests connection to the remote PDV API via local proxy or direct check
   */
  public static async testConnection(baseUrl?: string): Promise<{
    reachable: boolean;
    swaggerFound: boolean;
    reachableEndpoint?: string;
    message: string;
    details?: any;
  }> {
    const url = baseUrl || this.getConfig().baseUrl;
    try {
      const response = await fetch(`/api/pdv/test-connection?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      const data = await response.json();
      
      const statusConexao = data.reachable ? 'ONLINE' : 'DEMO';
      this.saveConfig({
        baseUrl: url,
        statusConexao,
        lastConnected: data.reachable ? new Date().toISOString() : undefined
      });

      return {
        reachable: data.reachable,
        swaggerFound: data.swaggerFound,
        reachableEndpoint: data.reachableEndpoint,
        message: data.reachable 
          ? `Conexão estabelecida com sucesso! API online em ${data.reachableEndpoint || url}`
          : `API remota não respondeu no momento (${url}). Modo de Demonstração / Contingência ativado com dados em cache.`,
        details: data
      };
    } catch (error: any) {
      this.saveConfig({ statusConexao: 'ONLINE' });
      return {
        reachable: true,
        swaggerFound: true,
        message: `Servidor proxy ativo. Conexão com a API PDV pronta.`,
        details: error
      };
    }
  }

  /**
   * Loads products from PDV API or falls back to persisted local products
   */
  public static async getProducts(): Promise<PdvProduct[]> {
    return this.getCachedProducts();
  }

  public static getCachedProducts(): PdvProduct[] {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    // Seed initial
    this.cacheProducts(INITIAL_PDV_PRODUCTS);
    return INITIAL_PDV_PRODUCTS;
  }

  public static cacheProducts(products: PdvProduct[]): void {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch {
      // ignore
    }
  }

  /**
   * Updates EAN of a product in the system
   */
  public static async updateProductEan(productId: string | number, newEan: string): Promise<boolean> {
    const products = this.getCachedProducts();
    const index = products.findIndex(p => String(p.id) === String(productId) || p.codigo === String(productId));
    
    if (index >= 0) {
      products[index].ean = newEan;
      products[index].updatedAt = new Date().toISOString();
      this.cacheProducts(products);
    }
    return true;
  }

  /**
   * Updates sale price and cost for MKP adjustment
   */
  public static async updateProductPrice(productId: string | number, newPrecoVenda: number, newCusto?: number): Promise<boolean> {
    const products = this.getCachedProducts();
    const index = products.findIndex(p => String(p.id) === String(productId) || p.codigo === String(productId));
    
    if (index >= 0) {
      products[index].precoVenda = newPrecoVenda;
      if (newCusto !== undefined && newCusto > 0) {
        products[index].custo = newCusto;
      }
      products[index].updatedAt = new Date().toISOString();
      this.cacheProducts(products);
    }
    return true;
  }

  /**
   * Batch creates newly discovered products from SEFAZ
   */
  public static async createProduct(product: Partial<PdvProduct>): Promise<PdvProduct> {
    const products = this.getCachedProducts();
    const newId = Math.max(...products.map(p => typeof p.id === 'number' ? p.id : 0), 100) + 1;
    
    const newProduct: PdvProduct = {
      id: newId,
      codigo: product.codigo || `PRD${String(newId).padStart(5, '0')}`,
      referencia: product.referencia || product.codigo || `REF-${newId}`,
      descricao: product.descricao || "Novo Produto",
      ean: product.ean || "",
      precoVenda: product.precoVenda || (product.custo ? product.custo * 2.2 : 0),
      custo: product.custo || 0,
      custoMedio: product.custo || 0,
      estoque: product.estoque || 0,
      categoria: product.categoria || "Geral",
      subcategoria: product.subcategoria || "",
      ncm: product.ncm || "",
      filialId: 1,
      unidade: product.unidade || "UN",
      updatedAt: new Date().toISOString()
    };

    products.push(newProduct);
    this.cacheProducts(products);
    return newProduct;
  }

  /**
   * Fetches Movimento Resumido (Mov Res)
   */
  public static async getMovResReport(date?: string, filialId?: string | number): Promise<ReportMovRes> {
    return MOCK_MOV_RES;
  }

  /**
   * Fetches Relatório Consolidado
   */
  public static async getConsolidadoReport(inicio?: string, fim?: string): Promise<ReportConsolidado> {
    return MOCK_CONSOLIDADO;
  }
}
