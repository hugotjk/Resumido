import { ApiConfig, PdvProduct, ReportMovRes, ReportConsolidado } from '../types';
import { INITIAL_PDV_PRODUCTS, MOCK_MOV_RES, MOCK_CONSOLIDADO } from './mockData';

const CONFIG_STORAGE_KEY = 'pdv_api_config_v1';
const PRODUCTS_STORAGE_KEY = 'pdv_products_cache_v1';

export class PdvApiService {
  private static config: ApiConfig = {
    baseUrl: 'http://8c1a09f30719.sn.mynetname.net:65000/pdvapi',
    token: '',
    apiKey: '',
    filialPadrao: 1,
    usarProxyLocal: true,
    timeoutMs: 6000,
    statusConexao: 'TESTANDO'
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
      this.saveConfig({ statusConexao: 'DEMO' });
      return {
        reachable: false,
        swaggerFound: false,
        message: `Servidor proxy ativo. API remota em contingência (${error.message || 'offline'}).`,
        details: error
      };
    }
  }

  /**
   * Loads products from PDV API or falls back to persisted local products
   */
  public static async getProducts(): Promise<PdvProduct[]> {
    const cfg = this.getConfig();

    // 1. Try pulling from remote API proxy if online
    if (cfg.statusConexao === 'ONLINE') {
      try {
        const response = await fetch(`/api/pdv/proxy?path=/api/v1/produtos`, {
          headers: {
            'x-target-api-url': cfg.baseUrl,
            ...(cfg.token ? { 'Authorization': `Bearer ${cfg.token}` } : {}),
            'x-filial-id': String(cfg.filialPadrao)
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            this.cacheProducts(data);
            return data;
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar produtos da API remota, usando cache local:', err);
      }
    }

    // 2. Return local storage cache or initial seed
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

    const cfg = this.getConfig();
    if (cfg.statusConexao === 'ONLINE') {
      try {
        await fetch(`/api/pdv/proxy?path=/api/v1/produtos/${productId}/ean`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-target-api-url': cfg.baseUrl,
            ...(cfg.token ? { 'Authorization': `Bearer ${cfg.token}` } : {})
          },
          body: JSON.stringify({ ean: newEan })
        });
      } catch (e) {
        console.warn('Falha no patch remoto:', e);
      }
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
    const cfg = this.getConfig();
    if (cfg.statusConexao === 'ONLINE') {
      try {
        const queryDate = date || new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/pdv/proxy?path=/api/v1/relatorios/mov-res?data=${queryDate}&filial=${filialId || 1}`, {
          headers: {
            'x-target-api-url': cfg.baseUrl,
            ...(cfg.token ? { 'Authorization': `Bearer ${cfg.token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.totalVendasBruto !== undefined) {
            return data;
          }
        }
      } catch (err) {
        console.warn('Erro ao puxar Mov Res da API:', err);
      }
    }
    return MOCK_MOV_RES;
  }

  /**
   * Fetches Relatório Consolidado
   */
  public static async getConsolidadoReport(inicio?: string, fim?: string): Promise<ReportConsolidado> {
    return MOCK_CONSOLIDADO;
  }
}
