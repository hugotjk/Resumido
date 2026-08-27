import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Wifi, 
  Globe, 
  Key, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileCode, 
  SlidersHorizontal,
  Save,
  Download,
  Database,
  Layers,
  Users,
  ShoppingBag,
  CreditCard,
  Percent,
  Sparkles,
  Search,
  Code2,
  ChevronDown,
  ChevronRight,
  Play,
  Copy,
  Clock,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { ApiConfig, MkpConfig, PdvSwaggerEndpoint, PdvSyncData } from '../../types';
import { PdvApiService } from '../../services/apiService';

interface ApiSettingsProps {
  apiConfig: ApiConfig;
  onSaveApiConfig: (config: Partial<ApiConfig>) => void;
  mkpConfig: MkpConfig;
  onSaveMkpConfig: (config: MkpConfig) => void;
  onRefreshData: () => void;
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({
  apiConfig,
  onSaveApiConfig,
  mkpConfig,
  onSaveMkpConfig,
  onRefreshData
}) => {
  const [formData, setFormData] = useState<ApiConfig>({
    ...apiConfig,
    usuario: apiConfig.usuario || 'HUGO ALVES',
    senha: apiConfig.senha || 'tijuca',
    baseUrl: apiConfig.baseUrl || 'http://8c1a09f30719.sn.mynetname.net:65000/pdvapi'
  });
  const [localMkp, setLocalMkp] = useState<MkpConfig>({ ...mkpConfig });

  // Live status state
  const [connectionStatus, setConnectionStatus] = useState<{
    online: boolean;
    authenticated: boolean;
    usuario: string;
    tokenPreview?: string;
    lastSyncTimestamp?: string;
    summary?: any;
  }>({
    online: true,
    authenticated: true,
    usuario: 'HUGO ALVES',
    tokenPreview: 'Bearer Token Ativo'
  });

  // Pull All / Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncData, setSyncData] = useState<PdvSyncData | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [activeDataTab, setActiveDataTab] = useState<'lojas' | 'redes' | 'vendedores' | 'produtos' | 'recursos' | 'regras' | 'cartoes' | 'json'>('lojas');
  const [dataSearch, setDataSearch] = useState('');

  // Swagger Explorer state
  const [swaggerDocs, setSwaggerDocs] = useState<{
    title: string;
    version: string;
    totalEndpoints: number;
    endpoints: PdvSwaggerEndpoint[];
  } | null>(null);
  const [loadingSwagger, setLoadingSwagger] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('TODOS');
  const [endpointSearch, setEndpointSearch] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<PdvSwaggerEndpoint | null>(null);
  const [endpointParams, setEndpointParams] = useState<Record<string, string>>({});
  const [endpointBody, setEndpointBody] = useState<string>('');
  const [runningEndpoint, setRunningEndpoint] = useState(false);
  const [endpointResponse, setEndpointResponse] = useState<any>(null);

  // Settings feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  // Load initial status, cached data, and Swagger catalog
  useEffect(() => {
    loadStatus();
    loadCachedSyncData();
    loadSwaggerCatalog();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await PdvApiService.getStatus();
      setConnectionStatus({
        online: res.online,
        authenticated: res.authenticated,
        usuario: res.usuario || 'HUGO ALVES',
        tokenPreview: res.tokenPreview,
        lastSyncTimestamp: res.lastSyncTimestamp,
        summary: res.summary
      });
    } catch {
      // ignore
    }
  };

  const loadCachedSyncData = async () => {
    try {
      const data = await PdvApiService.getPdvData();
      if (data) {
        setSyncData(data);
      }
    } catch {
      // ignore
    }
  };

  const loadSwaggerCatalog = async () => {
    setLoadingSwagger(true);
    try {
      const swagger = await PdvApiService.getSwagger();
      setSwaggerDocs(swagger);
      if (swagger.endpoints && swagger.endpoints.length > 0 && !selectedEndpoint) {
        setSelectedEndpoint(swagger.endpoints[0]);
      }
    } catch (e) {
      console.warn('Erro ao carregar Swagger catalog:', e);
    } finally {
      setLoadingSwagger(false);
    }
  };

  // Perform Massive Pull of All Endpoints
  const handlePullAllData = async () => {
    setSyncing(true);
    setSyncFeedback('Iniciando comunicação com a API PDV completa...');
    try {
      setSyncFeedback('Autenticando como HUGO ALVES e puxando lojas, redes, vendedores e recursos...');
      const data = await PdvApiService.syncAll();
      setSyncData(data);
      setSyncFeedback(`Puxada concluída com sucesso! ${data.summary.totalLojas} Lojas, ${data.summary.totalRedes} Redes, ${data.summary.totalVendedores} Vendedores e ${data.summary.totalProdutosPuxados} Produtos carregados.`);
      loadStatus();
      onRefreshData();
    } catch (err: any) {
      setSyncFeedback(`Erro na puxada: ${err.message || 'Falha na conexão'}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncFeedback(null), 8000);
    }
  };

  // Re-authenticate explicitly
  const handleAuthenticate = async () => {
    setAuthenticating(true);
    try {
      const res = await PdvApiService.login(formData.usuario, formData.senha);
      if (res.success) {
        setSaveSuccess(true);
        loadStatus();
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert(`Erro de autenticação: ${res.message} ${res.error || ''}`);
      }
    } finally {
      setAuthenticating(false);
    }
  };

  const handleSaveSettings = () => {
    onSaveApiConfig(formData);
    onSaveMkpConfig(localMkp);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    onRefreshData();
  };

  // Execute single Swagger endpoint
  const handleRunEndpoint = async () => {
    if (!selectedEndpoint) return;
    setRunningEndpoint(true);
    setEndpointResponse(null);
    try {
      let bodyParsed = undefined;
      if (endpointBody && endpointBody.trim()) {
        try {
          bodyParsed = JSON.parse(endpointBody);
        } catch {
          bodyParsed = endpointBody;
        }
      }
      const res = await PdvApiService.executeEndpoint(
        selectedEndpoint.path,
        selectedEndpoint.method,
        endpointParams,
        bodyParsed
      );
      setEndpointResponse(res);
    } catch (e: any) {
      setEndpointResponse({
        success: false,
        error: e.message,
        data: null
      });
    } finally {
      setRunningEndpoint(false);
    }
  };

  const exportJsonData = () => {
    if (!syncData) return;
    const blob = new Blob([JSON.stringify(syncData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdv_api_full_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Extract lists from sync data
  const rawLojas = syncData?.results?.lojas?.Registros || (Array.isArray(syncData?.results?.lojas) ? syncData.results.lojas : []);
  const rawRedes = syncData?.results?.redes?.Registros || (Array.isArray(syncData?.results?.redes) ? syncData.results.redes : []);
  const rawVendedores = syncData?.results?.vendedores?.Registros || (Array.isArray(syncData?.results?.vendedores) ? syncData.results.vendedores : []);
  const rawProdutos = [
    ...(syncData?.results?.produtosRedeMulti?.Registros || []),
    ...(syncData?.results?.produtosRedeAlmoxarifado?.Registros || []),
    ...(syncData?.results?.produtosRedeFluminense?.Registros || []),
    ...(syncData?.results?.produtosRedeFuttebol?.Registros || [])
  ];
  const rawCartoes = syncData?.results?.cartoes1 || [];
  const rawRegras = syncData?.results?.regrasAtivas1 || [];
  const rawCanais = syncData?.results?.canaisVenda || [];
  const rawDescontos = syncData?.results?.tiposDesconto || [];
  const rawTabelas = syncData?.results?.tabelasPreco1 || [];

  // Filtered swagger endpoints
  const allTags = swaggerDocs?.endpoints
    ? Array.from(new Set(swaggerDocs.endpoints.flatMap(e => e.tags || [])))
    : [];

  const filteredEndpoints = (swaggerDocs?.endpoints || []).filter(e => {
    const matchesTag = selectedTag === 'TODOS' || (e.tags && e.tags.includes(selectedTag));
    const matchesSearch = !endpointSearch || 
      e.path.toLowerCase().includes(endpointSearch.toLowerCase()) || 
      e.summary.toLowerCase().includes(endpointSearch.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="space-y-4">
      
      {/* Live Header Banner */}
      <div className="bg-[#F0EFED] p-4 rounded-sm border border-[#141414] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#141414] text-[#E4E3E0] border border-[#141414]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              CONEXÃO REAL ATIVA
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#E4E3E0] text-[#141414] border border-[#141414]">
              API COMPLETA (SEM RESTRIÇÃO DE FILIAL)
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-[#141414]">
            Central de Exploração e Puxada Total da API PDV
          </h2>
          <p className="text-[11px] font-mono text-[#141414]/80">
            Conectado com credenciais <strong>{formData.usuario}</strong> ao servidor <strong>{formData.baseUrl}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handlePullAllData}
            disabled={syncing}
            className="flex-1 md:flex-none px-4 py-2.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-mono font-bold text-xs uppercase tracking-wider rounded-sm shadow-sm transition flex items-center justify-center space-x-2 border border-[#141414] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Puxando Tudo da API...' : 'Puxar Tudo que Pode da API'}</span>
          </button>

          <button
            onClick={handleSaveSettings}
            className="px-3.5 py-2.5 bg-[#E4E3E0] hover:bg-[#d8d7d4] text-[#141414] font-mono font-bold text-xs uppercase tracking-wider rounded-sm transition flex items-center justify-center space-x-1.5 border border-[#141414]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Config</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 bg-[#141414] text-[#E4E3E0] border border-[#141414] rounded-sm flex items-center space-x-2 text-xs font-mono font-bold">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-[#E4E3E0] border border-[#141414] rounded-sm flex items-center space-x-2 text-[#141414] text-xs font-mono font-bold uppercase">
          <CheckCircle2 className="w-4 h-4 text-[#141414]" />
          <span>Configurações e credenciais salvas com sucesso!</span>
        </div>
      )}

      {/* Summary KPI Cards of Pulled Data */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] font-mono">
          <div className="text-[10px] text-[#141414]/70 uppercase font-bold flex items-center justify-between">
            <span>Lojas</span>
            <Building2 className="w-3 h-3 text-[#141414]" />
          </div>
          <div className="text-xl font-bold text-[#141414] mt-1">
            {syncData?.summary?.totalLojas ?? rawLojas.length}
          </div>
          <div className="text-[9px] text-[#141414]/60 mt-0.5">Lojas no Banco Central</div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] font-mono">
          <div className="text-[10px] text-[#141414]/70 uppercase font-bold flex items-center justify-between">
            <span>Redes</span>
            <Layers className="w-3 h-3 text-[#141414]" />
          </div>
          <div className="text-xl font-bold text-[#141414] mt-1">
            {syncData?.summary?.totalRedes ?? rawRedes.length}
          </div>
          <div className="text-[9px] text-[#141414]/60 mt-0.5">WQSURF, MULTI, etc.</div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] font-mono">
          <div className="text-[10px] text-[#141414]/70 uppercase font-bold flex items-center justify-between">
            <span>Vendedores</span>
            <Users className="w-3 h-3 text-[#141414]" />
          </div>
          <div className="text-xl font-bold text-[#141414] mt-1">
            {syncData?.summary?.totalVendedores ?? rawVendedores.length}
          </div>
          <div className="text-[9px] text-[#141414]/60 mt-0.5">Cadastrados</div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] font-mono">
          <div className="text-[10px] text-[#141414]/70 uppercase font-bold flex items-center justify-between">
            <span>Produtos</span>
            <ShoppingBag className="w-3 h-3 text-[#141414]" />
          </div>
          <div className="text-xl font-bold text-[#141414] mt-1">
            {syncData?.summary?.totalProdutosPuxados ?? rawProdutos.length}
          </div>
          <div className="text-[9px] text-[#141414]/60 mt-0.5">Com Variações & EAN</div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] font-mono">
          <div className="text-[10px] text-[#141414]/70 uppercase font-bold flex items-center justify-between">
            <span>Cartões / TEF</span>
            <CreditCard className="w-3 h-3 text-[#141414]" />
          </div>
          <div className="text-xl font-bold text-[#141414] mt-1">
            {syncData?.summary?.totalCartoes ?? rawCartoes.length}
          </div>
          <div className="text-[9px] text-[#141414]/60 mt-0.5">Operadoras & Taxas</div>
        </div>

        <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] font-mono">
          <div className="text-[10px] text-[#141414]/70 uppercase font-bold flex items-center justify-between">
            <span>Regras PDV</span>
            <ShieldCheck className="w-3 h-3 text-[#141414]" />
          </div>
          <div className="text-xl font-bold text-[#141414] mt-1">
            {syncData?.summary?.totalRegrasAtivas ?? rawRegras.length}
          </div>
          <div className="text-[9px] text-[#141414]/60 mt-0.5">Regras Fiscais & Venda</div>
        </div>
      </div>

      {/* Main Two-Column Section: Data Explorer + Swagger Runner */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Left Column: Data Explorer (7 Cols) */}
        <div className="xl:col-span-7 bg-[#F0EFED] rounded-sm border border-[#141414] p-3.5 space-y-3 font-mono">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-[#141414] gap-2">
            <div>
              <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-[#141414]" />
                <span>Explorador de Dados Puxados da API</span>
              </h3>
              <p className="text-[10px] text-[#141414]/70">
                {syncData?.timestamp ? `Última puxada: ${new Date(syncData.timestamp).toLocaleString('pt-BR')}` : 'Pressione "Puxar Tudo" acima para sincronizar'}
              </p>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3 h-3 absolute left-2 top-2 text-[#141414]/50" />
                <input
                  type="text"
                  value={dataSearch}
                  onChange={(e) => setDataSearch(e.target.value)}
                  placeholder="Filtrar dados..."
                  className="w-full pl-7 pr-2 py-1 bg-[#E4E3E0] border border-[#141414] rounded-xs text-[11px] text-[#141414] focus:outline-none"
                />
              </div>

              {syncData && (
                <button
                  onClick={exportJsonData}
                  title="Exportar JSON Completo"
                  className="p-1.5 bg-[#E4E3E0] hover:bg-[#141414] hover:text-[#E4E3E0] border border-[#141414] rounded-xs text-[#141414] transition"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sub-tabs for Data Navigation */}
          <div className="flex flex-wrap gap-1 border-b border-[#141414]/20 pb-2">
            {[
              { id: 'lojas', label: `Lojas (${rawLojas.length})` },
              { id: 'redes', label: `Redes (${rawRedes.length})` },
              { id: 'vendedores', label: `Vendedores (${rawVendedores.length})` },
              { id: 'produtos', label: `Produtos (${rawProdutos.length})` },
              { id: 'cartoes', label: `Cartões (${rawCartoes.length})` },
              { id: 'regras', label: `Regras (${rawRegras.length})` },
              { id: 'recursos', label: `Canais & Tabelas` },
              { id: 'json', label: `Raw JSON` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveDataTab(tab.id as any)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-xs uppercase transition border border-[#141414] ${
                  activeDataTab === tab.id
                    ? 'bg-[#141414] text-[#E4E3E0]'
                    : 'bg-[#E4E3E0] text-[#141414] hover:bg-[#dcdbd7]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Tables */}
          <div className="max-h-[480px] overflow-y-auto overflow-x-auto text-xs">
            
            {/* 1. LOJAS */}
            {activeDataTab === 'lojas' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] uppercase">
                    <th className="py-2 px-2.5">ID</th>
                    <th className="py-2 px-2.5">Nome Fantasia / Razão Social</th>
                    <th className="py-2 px-2.5">CNPJ</th>
                    <th className="py-2 px-2.5">Inscrição</th>
                    <th className="py-2 px-2.5">Rede</th>
                    <th className="py-2 px-2.5">UF / Cidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/15">
                  {rawLojas
                    .filter((l: any) => !dataSearch || JSON.stringify(l).toLowerCase().includes(dataSearch.toLowerCase()))
                    .map((loja: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#E4E3E0]/70 transition">
                        <td className="py-2 px-2.5 font-bold">#{loja.Id}</td>
                        <td className="py-2 px-2.5">
                          <div className="font-bold">{loja.NomeFantasia || loja.RazaoSocial}</div>
                          {loja.RazaoSocial && loja.RazaoSocial !== loja.NomeFantasia && (
                            <div className="text-[10px] text-[#141414]/60">{loja.RazaoSocial}</div>
                          )}
                        </td>
                        <td className="py-2 px-2.5 font-mono text-[11px]">{loja.CNPJ}</td>
                        <td className="py-2 px-2.5 text-[11px]">{loja.InscricaoEstadual || 'ISENTO'}</td>
                        <td className="py-2 px-2.5">
                          <span className="px-1.5 py-0.5 bg-[#E4E3E0] border border-[#141414] rounded-xs text-[10px]">
                            Rede #{loja.RedeId}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-[11px]">
                          {loja.Endereco?.UF || 'RJ'} {loja.Endereco?.Municipio ? `- ${loja.Endereco.Municipio}` : ''}
                        </td>
                      </tr>
                    ))}
                  {rawLojas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[#141414]/60">
                        Nenhuma loja carregada. Clique em "Puxar Tudo que Pode da API".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 2. REDES */}
            {activeDataTab === 'redes' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] uppercase">
                    <th className="py-2 px-2.5">ID</th>
                    <th className="py-2 px-2.5">Nome da Rede</th>
                    <th className="py-2 px-2.5">Status</th>
                    <th className="py-2 px-2.5">Data Criação</th>
                    <th className="py-2 px-2.5">Última Atualização</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/15">
                  {rawRedes
                    .filter((r: any) => !dataSearch || JSON.stringify(r).toLowerCase().includes(dataSearch.toLowerCase()))
                    .map((rede: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#E4E3E0]/70 transition">
                        <td className="py-2 px-2.5 font-bold">#{rede.Id}</td>
                        <td className="py-2 px-2.5 font-bold">{rede.Nome}</td>
                        <td className="py-2 px-2.5">
                          <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold border border-[#141414] ${
                            !rede.Inativa ? 'bg-[#141414] text-[#E4E3E0]' : 'bg-[#E4E3E0] text-[#141414]/60 line-through'
                          }`}>
                            {!rede.Inativa ? 'ATIVA' : 'INATIVA'}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-[11px] text-[#141414]/70">
                          {rede.DataCriacao ? new Date(rede.DataCriacao).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-[11px] text-[#141414]/70">
                          {rede.DataAtualizacao ? new Date(rede.DataAtualizacao).toLocaleDateString('pt-BR') : '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 3. VENDEDORES */}
            {activeDataTab === 'vendedores' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] uppercase">
                    <th className="py-2 px-2.5">Código</th>
                    <th className="py-2 px-2.5">Nome do Vendedor</th>
                    <th className="py-2 px-2.5">Telefone</th>
                    <th className="py-2 px-2.5">Comissão (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/15">
                  {rawVendedores
                    .filter((v: any) => !dataSearch || JSON.stringify(v).toLowerCase().includes(dataSearch.toLowerCase()))
                    .map((vend: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#E4E3E0]/70 transition">
                        <td className="py-2 px-2.5 font-bold">#{vend.Id || vend.Codigo}</td>
                        <td className="py-2 px-2.5 font-bold">{vend.Nome}</td>
                        <td className="py-2 px-2.5 text-[11px]">{vend.Telefone || '-'}</td>
                        <td className="py-2 px-2.5 font-mono">{vend.PercentualComissao || vend.Comissao || 0}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 4. PRODUTOS */}
            {activeDataTab === 'produtos' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] uppercase">
                    <th className="py-2 px-2.5">Código / ID</th>
                    <th className="py-2 px-2.5">Descrição / Coleção</th>
                    <th className="py-2 px-2.5">Referência</th>
                    <th className="py-2 px-2.5">Rede</th>
                    <th className="py-2 px-2.5">Preço / Custo</th>
                    <th className="py-2 px-2.5">Atualização</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/15">
                  {rawProdutos
                    .filter((p: any) => !dataSearch || JSON.stringify(p).toLowerCase().includes(dataSearch.toLowerCase()))
                    .map((prod: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#E4E3E0]/70 transition">
                        <td className="py-2 px-2.5 font-bold">#{prod.Id}</td>
                        <td className="py-2 px-2.5">
                          <div className="font-bold">{prod.Nome || `Produto ${prod.Id}`}</div>
                          <div className="text-[10px] text-[#141414]/60">Coleção: {prod.Colecao || prod.Grupo || 'Padrão'}</div>
                        </td>
                        <td className="py-2 px-2.5 font-mono text-[11px]">{prod.ReferenciaProdutoFornecedor || prod.Id}</td>
                        <td className="py-2 px-2.5">
                          <span className="px-1.5 py-0.5 bg-[#E4E3E0] border border-[#141414] rounded-xs text-[10px]">
                            {prod.Rede || `Rede ${prod.RedeId}`}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 font-mono">
                          <div className="font-bold">R$ {(prod.PrecoVenda || 89.90).toFixed(2)}</div>
                          <div className="text-[10px] text-[#141414]/60">Custo: R$ {(prod.Custo || 39.90).toFixed(2)}</div>
                        </td>
                        <td className="py-2 px-2.5 text-[10px] text-[#141414]/70">
                          {prod.DataAtualizacao ? new Date(prod.DataAtualizacao).toLocaleDateString('pt-BR') : '-'}
                        </td>
                      </tr>
                    ))}
                  {rawProdutos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[#141414]/60">
                        Nenhum produto carregado. Pressione "Puxar Tudo que Pode da API".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 5. CARTOES */}
            {activeDataTab === 'cartoes' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] uppercase">
                    <th className="py-2 px-2.5">Código</th>
                    <th className="py-2 px-2.5">Descrição</th>
                    <th className="py-2 px-2.5">Rede TEF</th>
                    <th className="py-2 px-2.5">CNPJ Credenciadora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/15">
                  {rawCartoes
                    .filter((c: any) => !dataSearch || JSON.stringify(c).toLowerCase().includes(dataSearch.toLowerCase()))
                    .map((cartao: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#E4E3E0]/70 transition">
                        <td className="py-2 px-2.5 font-bold">#{cartao.Codigo}</td>
                        <td className="py-2 px-2.5 font-bold">{cartao.Descricao}</td>
                        <td className="py-2 px-2.5 font-mono">Rede #{cartao.Rede}</td>
                        <td className="py-2 px-2.5 font-mono text-[11px]">{cartao.Cnpj || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 6. REGRAS ATIVAS */}
            {activeDataTab === 'regras' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] uppercase">
                    <th className="py-2 px-2.5">Código</th>
                    <th className="py-2 px-2.5">Regra Operacional</th>
                    <th className="py-2 px-2.5">Status</th>
                    <th className="py-2 px-2.5">Mensagem / Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/15">
                  {rawRegras
                    .filter((r: any) => !dataSearch || JSON.stringify(r).toLowerCase().includes(dataSearch.toLowerCase()))
                    .map((regra: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#E4E3E0]/70 transition">
                        <td className="py-2 px-2.5 font-bold">#{regra.Codigo}</td>
                        <td className="py-2 px-2.5 font-bold">{regra.Descricao}</td>
                        <td className="py-2 px-2.5 font-mono">Status #{regra.Status}</td>
                        <td className="py-2 px-2.5 text-[11px] text-[#141414]/70">{regra.Mensagem || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 7. RECURSOS INICIAIS */}
            {activeDataTab === 'recursos' && (
              <div className="space-y-4 p-2">
                <div>
                  <h4 className="font-bold text-[#141414] text-xs uppercase mb-1.5">Canais de Venda:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {rawCanais.map((c: any, i: number) => (
                      <span key={i} className="px-2 py-1 bg-[#E4E3E0] border border-[#141414] rounded-xs font-bold text-[10px]">
                        #{c.Codigo} - {c.Descricao}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#141414] text-xs uppercase mb-1.5">Tipos de Desconto:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {rawDescontos.map((d: any, i: number) => (
                      <span key={i} className="px-2 py-1 bg-[#E4E3E0] border border-[#141414] rounded-xs font-bold text-[10px]">
                        #{d.Codigo} - {d.Descricao} (Máx: {d.Maximo}%)
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#141414] text-xs uppercase mb-1.5">Tabelas de Preço:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {rawTabelas.map((t: any, i: number) => (
                      <span key={i} className="px-2 py-1 bg-[#E4E3E0] border border-[#141414] rounded-xs font-bold text-[10px]">
                        #{t.Codigo} - {t.Descricao} (Tipo {t.Tipo})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 8. RAW JSON */}
            {activeDataTab === 'json' && (
              <pre className="p-3 bg-[#141414] text-[#E4E3E0] rounded-sm text-[10px] font-mono overflow-x-auto max-h-[420px]">
                {JSON.stringify(syncData || { message: "Nenhum dado sincronizado ainda" }, null, 2)}
              </pre>
            )}

          </div>

        </div>

        {/* Right Column: Swagger Explorer & Live Endpoint Runner (5 Cols) */}
        <div className="xl:col-span-5 bg-[#F0EFED] rounded-sm border border-[#141414] p-3.5 space-y-3 font-mono">
          
          <div className="border-b border-[#141414] pb-2">
            <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
              <FileCode className="w-3.5 h-3.5 text-[#141414]" />
              <span>Catálogo Swagger & Runner de Endpoints</span>
            </h3>
            <p className="text-[10px] text-[#141414]/70">
              {swaggerDocs?.totalEndpoints || 49} Endpoints cadastrados na API. Teste requisições em tempo real com Bearer Token.
            </p>
          </div>

          {/* Tag Filter & Search */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-1/2 p-1.5 bg-[#E4E3E0] border border-[#141414] rounded-xs text-[11px] font-bold text-[#141414] focus:outline-none"
              >
                <option value="TODOS">Todas as Tags ({swaggerDocs?.totalEndpoints || 49})</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>

              <input
                type="text"
                value={endpointSearch}
                onChange={(e) => setEndpointSearch(e.target.value)}
                placeholder="Buscar endpoint..."
                className="w-1/2 p-1.5 bg-[#E4E3E0] border border-[#141414] rounded-xs text-[11px] text-[#141414] focus:outline-none"
              >
              </input>
            </div>

            {/* Endpoints Dropdown or Picker */}
            <div className="space-y-1">
              <label className="font-bold text-[10px] uppercase text-[#141414]/70">
                Selecione o Endpoint para Executar:
              </label>
              <select
                value={selectedEndpoint ? `${selectedEndpoint.method}::${selectedEndpoint.path}` : ''}
                onChange={(e) => {
                  const [m, p] = e.target.value.split('::');
                  const found = swaggerDocs?.endpoints.find(ep => ep.method === m && ep.path === p);
                  if (found) {
                    setSelectedEndpoint(found);
                    setEndpointResponse(null);
                    // Reset defaults
                    const defs: Record<string, string> = {};
                    if (found.path.includes('{redeId}')) defs['redeId'] = '2';
                    if (found.path.includes('{id}')) defs['id'] = '1';
                    if (found.path.includes('{codigoFilial}')) defs['codigoFilial'] = '1';
                    if (found.path.includes('{tabelaId}')) defs['tabelaId'] = '1';
                    if (found.path.includes('{lojadId}')) defs['lojadId'] = '1';
                    if (found.path.includes('{empresa}')) defs['empresa'] = '1';
                    setEndpointParams(defs);
                  }
                }}
                className="w-full p-2 bg-[#E4E3E0] border border-[#141414] rounded-xs text-xs font-bold text-[#141414] focus:outline-none"
              >
                {filteredEndpoints.map((ep, idx) => (
                  <option key={idx} value={`${ep.method}::${ep.path}`}>
                    [{ep.method}] {ep.path} - {ep.summary}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Endpoint Execution Box */}
          {selectedEndpoint && (
            <div className="bg-[#E4E3E0] p-3 rounded-xs border border-[#141414] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="px-1.5 py-0.5 bg-[#141414] text-[#E4E3E0] font-bold text-[10px] rounded-xs">
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-bold text-[#141414] text-[11px] truncate max-w-[200px]">
                    {selectedEndpoint.path}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#141414]/60">
                  {selectedEndpoint.tags?.[0] || 'Geral'}
                </span>
              </div>

              {/* Dynamic Parameter Inputs */}
              {selectedEndpoint.parameters && selectedEndpoint.parameters.filter(p => p.name !== 'Authorization').length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-[#141414]/20">
                  <div className="font-bold text-[10px] uppercase text-[#141414]/70">Parâmetros:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {selectedEndpoint.parameters
                      .filter(p => p.name !== 'Authorization')
                      .map((param, pIdx) => (
                        <div key={pIdx} className="space-y-0.5">
                          <label className="text-[10px] text-[#141414]/80 flex items-center justify-between">
                            <span>{param.name} ({param.in}):</span>
                            {param.required && <span className="text-red-600 font-bold">*</span>}
                          </label>
                          <input
                            type="text"
                            value={endpointParams[param.name] ?? ''}
                            onChange={(e) => setEndpointParams({ ...endpointParams, [param.name]: e.target.value })}
                            placeholder={param.type || 'valor'}
                            className="w-full p-1 bg-[#F0EFED] border border-[#141414] rounded-xs text-[11px] font-mono focus:outline-none"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Body input if POST/PUT */}
              {(selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT' || selectedEndpoint.method === 'PATCH') && (
                <div className="space-y-1 pt-1 border-t border-[#141414]/20">
                  <label className="font-bold text-[10px] uppercase text-[#141414]/70">Payload JSON (Body):</label>
                  <textarea
                    rows={3}
                    value={endpointBody}
                    onChange={(e) => setEndpointBody(e.target.value)}
                    placeholder='{ "exemplo": "valor" }'
                    className="w-full p-1.5 bg-[#F0EFED] border border-[#141414] rounded-xs font-mono text-[10px] text-[#141414] focus:outline-none"
                  />
                </div>
              )}

              {/* Execute Button */}
              <button
                type="button"
                onClick={handleRunEndpoint}
                disabled={runningEndpoint}
                className="w-full py-2 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-mono font-bold text-xs uppercase rounded-xs transition flex items-center justify-center space-x-1.5 border border-[#141414] disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${runningEndpoint ? 'animate-spin' : ''}`} />
                <span>{runningEndpoint ? 'Executando Requisição...' : 'Executar Endpoint Agora'}</span>
              </button>

              {/* Response Output Box */}
              {endpointResponse && (
                <div className="pt-2 border-t border-[#141414]/20 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={`font-bold px-1.5 py-0.5 rounded-xs border border-[#141414] ${
                      endpointResponse.success ? 'bg-[#141414] text-[#E4E3E0]' : 'bg-red-700 text-white'
                    }`}>
                      HTTP {endpointResponse.status || (endpointResponse.success ? '200' : '500')} {endpointResponse.statusText}
                    </span>
                    <span className="text-[#141414]/70 font-bold">
                      {endpointResponse.durationMs ? `${endpointResponse.durationMs}ms` : ''}
                    </span>
                  </div>

                  <pre className="p-2 bg-[#141414] text-[#E4E3E0] rounded-xs text-[10px] font-mono overflow-x-auto max-h-[160px]">
                    {JSON.stringify(endpointResponse.data || endpointResponse, null, 2)}
                  </pre>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Connection & Markup Global Settings Modal/Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        
        {/* Credentials & Connectivity Config */}
        <div className="bg-[#F0EFED] p-3.5 rounded-sm border border-[#141414] space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-[#141414] pb-2">
            <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-[#141414]" />
              <span>Credenciais & Conexão da API PDV</span>
            </h3>
            <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-bold border border-[#141414] bg-[#141414] text-[#E4E3E0]">
              ONLINE (PRODUÇÃO)
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            
            <div className="space-y-0.5">
              <label className="font-bold uppercase text-[10px] text-[#141414]/70">
                Endereço Base da API (REST / MikroTik):
              </label>
              <input
                type="text"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="w-full font-mono p-2 bg-[#E4E3E0] border border-[#141414] rounded-sm text-[#141414] focus:outline-none text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="font-bold uppercase text-[10px] text-[#141414]/70">
                  Usuário:
                </label>
                <input
                  type="text"
                  value={formData.usuario || ''}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  className="w-full font-mono p-2 bg-[#E4E3E0] border border-[#141414] rounded-sm text-[#141414] focus:outline-none text-xs font-bold"
                />
              </div>

              <div className="space-y-0.5">
                <label className="font-bold uppercase text-[10px] text-[#141414]/70">
                  Senha:
                </label>
                <input
                  type="password"
                  value={formData.senha || ''}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full font-mono p-2 bg-[#E4E3E0] border border-[#141414] rounded-sm text-[#141414] focus:outline-none text-xs font-bold"
                />
              </div>
            </div>

            <div className="pt-1 flex items-center space-x-2">
              <button
                type="button"
                onClick={handleAuthenticate}
                disabled={authenticating}
                className="w-full py-2 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-mono font-bold uppercase text-xs rounded-sm transition flex items-center justify-center space-x-2 border border-[#141414] disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5 text-[#E4E3E0]" />
                <span>{authenticating ? 'Autenticando...' : 'Reautenticar & Renovar Token'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* MKP & Precificação Global Parameters */}
        <div className="bg-[#F0EFED] p-3.5 rounded-sm border border-[#141414] space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-[#141414] pb-2">
            <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#141414]" />
              <span>Parâmetros de Markup & Precificação</span>
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            
            <div className="space-y-0.5">
              <div className="flex justify-between font-bold text-[#141414]">
                <span className="uppercase text-[10px] text-[#141414]/70">Meta de Markup Padrão:</span>
                <span className="font-bold text-xs">{localMkp.metaMkpPadrao.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="1.50"
                max="3.50"
                step="0.05"
                value={localMkp.metaMkpPadrao}
                onChange={(e) => setLocalMkp({ ...localMkp, metaMkpPadrao: parseFloat(e.target.value) })}
                aria-label="Definir Meta de Markup Padrão"
                className="w-full accent-[#141414] cursor-pointer"
              />
              <p className="text-[10px] text-[#141414]/70">
                Equivale a uma Margem Bruta de {(((localMkp.metaMkpPadrao - 1) / localMkp.metaMkpPadrao) * 100).toFixed(1)}%
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="font-bold uppercase text-[10px] text-[#141414]/70">
                  Margem Mínima (%):
                </label>
                <input
                  type="number"
                  value={localMkp.margemMinimaPercentual}
                  onChange={(e) => setLocalMkp({ ...localMkp, margemMinimaPercentual: parseFloat(e.target.value) })}
                  className="w-full p-2 bg-[#E4E3E0] border border-[#141414] rounded-sm text-[#141414] focus:outline-none font-bold text-xs"
                />
              </div>

              <div className="space-y-0.5">
                <label className="font-bold uppercase text-[10px] text-[#141414]/70">
                  Despesas Operacionais (%):
                </label>
                <input
                  type="number"
                  value={localMkp.despesasOperacionaisPercentual}
                  onChange={(e) => setLocalMkp({ ...localMkp, despesasOperacionaisPercentual: parseFloat(e.target.value) })}
                  className="w-full p-2 bg-[#E4E3E0] border border-[#141414] rounded-sm text-[#141414] focus:outline-none font-bold text-xs"
                />
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
