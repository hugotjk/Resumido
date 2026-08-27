import React, { useState } from 'react';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  Globe, 
  Key, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileCode, 
  SlidersHorizontal,
  Save
} from 'lucide-react';
import { ApiConfig, MkpConfig } from '../../types';
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
  const [formData, setFormData] = useState<ApiConfig>({ ...apiConfig });
  const [localMkp, setLocalMkp] = useState<MkpConfig>({ ...mkpConfig });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTestPing = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await PdvApiService.testConnection(formData.baseUrl);
      setTestResult({
        tested: true,
        success: res.reachable,
        message: res.message,
        details: res.details
      });
      if (res.reachable) {
        setFormData(prev => ({ ...prev, statusConexao: 'ONLINE' }));
      } else {
        setFormData(prev => ({ ...prev, statusConexao: 'DEMO' }));
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: `Falha ao testar conexão: ${err.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAll = () => {
    onSaveApiConfig(formData);
    onSaveMkpConfig(localMkp);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    onRefreshData();
  };

  const mappedEndpoints = [
    { method: "GET", path: "/pdvapi/api/v1/produtos", desc: "Listagem de produtos, estoque e preços" },
    { method: "PATCH", path: "/pdvapi/api/v1/produtos/{id}/ean", desc: "Atualização de código de barras EAN/GTIN" },
    { method: "PUT", path: "/pdvapi/api/v1/produtos/{id}/preco", desc: "Reajuste de preço de venda e markup" },
    { method: "POST", path: "/pdvapi/api/v1/produtos", desc: "Inclusão de novos produtos cadastrados da SEFAZ" },
    { method: "GET", path: "/pdvapi/api/v1/relatorios/mov-res", desc: "Relatório de Movimento Resumido diário" },
    { method: "GET", path: "/pdvapi/api/v1/relatorios/consolidado", desc: "Relatório consolidado por filiais" },
    { method: "GET", path: "/pdvapi/swagger/ui/index#/", desc: "Documentação Swagger UI da API" }
  ];

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-[#F0EFED] p-3.5 sm:p-4 rounded-sm border border-[#141414] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[#141414]">
            Configurações da API PDV & Parâmetros SEFAZ
          </h2>
          <p className="text-[11px] font-mono text-[#141414]/70 mt-0.5">
            Gerencie o endereço da API do seu sistema ERP, chaves de autenticação e parâmetros de precificação de Markup.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-3.5 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-mono font-bold text-xs uppercase tracking-wider rounded-sm shadow-sm transition flex items-center space-x-1.5 border border-[#141414]"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Salvar Configurações</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-[#E4E3E0] border border-[#141414] rounded-sm flex items-center space-x-2 text-[#141414] text-xs font-mono font-bold uppercase">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#141414]" />
          <span>Configurações salvas e aplicadas com sucesso!</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        
        {/* Connection Settings */}
        <div className="bg-[#F0EFED] p-3.5 rounded-sm border border-[#141414] space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-[#141414] pb-2">
            <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-[#141414]" />
              <span>Conexão da API PDV</span>
            </h3>
            <span className={`px-1.5 py-0.2 rounded-xs text-[10px] font-bold border border-[#141414] ${
              formData.statusConexao === 'ONLINE'
                ? 'bg-[#141414] text-[#E4E3E0]'
                : 'bg-[#E4E3E0] text-[#141414]'
            }`}>
              {formData.statusConexao === 'ONLINE' ? 'ONLINE' : 'CONTINGÊNCIA / DEMO'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            
            {/* URL */}
            <div className="space-y-0.5">
              <label className="font-bold uppercase text-[10px] text-[#141414]/70">
                Endereço Base da API (REST):
              </label>
              <input
                type="text"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="http://8c1a09f30719.sn.mynetname.net:65000/pdvapi"
                className="w-full font-mono p-2 bg-[#E4E3E0] border border-[#141414] rounded-sm text-[#141414] focus:outline-none text-xs font-bold"
              />
            </div>

            {/* Token */}
            <div className="space-y-0.5">
              <label className="font-bold uppercase text-[10px] text-[#141414]/70">
                Token de Autorização / Bearer (Opcional):
              </label>
              <input
                type="password"
                value={formData.token || ''}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                placeholder="Ex: eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full font-mono p-2 bg-[#E4E3E0] border border-[#141414] rounded-sm text-[#141414] focus:outline-none text-xs"
              />
            </div>

            {/* Store */}
            <div className="space-y-0.5">
              <label className="font-bold uppercase text-[10px] text-[#141414]/70">
                Filial / Loja Padrão:
              </label>
              <select
                value={formData.filialPadrao}
                onChange={(e) => setFormData({ ...formData, filialPadrao: Number(e.target.value) })}
                className="w-full p-2 bg-[#E4E3E0] border border-[#141414] rounded-sm text-[#141414] focus:outline-none font-bold text-xs"
              >
                <option value={1}>Loja 01 - Matriz Centro</option>
                <option value={2}>Loja 02 - Shopping Iguatemi</option>
                <option value={3}>Loja 03 - Galeria Norte</option>
              </select>
            </div>

            {/* Proxy info */}
            <div className="p-2.5 bg-[#E4E3E0] rounded-sm border border-[#141414] text-[10px] text-[#141414]/80">
              ⚡ <strong>Proxy Node.js Integrado:</strong> O servidor repassa as requisições para a API remota no MikroTik eliminando qualquer bloqueio de CORS do navegador.
            </div>

            {/* Ping Button & Output */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestPing}
                disabled={testing}
                className="w-full py-2 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-mono font-bold uppercase text-xs rounded-sm transition flex items-center justify-center space-x-2 disabled:opacity-50 border border-[#141414]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-[#E4E3E0]' : ''}`} />
                <span>{testing ? 'Testando Conexão...' : 'Testar Conexão com API PDV'}</span>
              </button>

              {testResult && (
                <div className={`mt-2.5 p-2.5 rounded-sm border border-[#141414] text-xs flex items-start space-x-2 bg-[#E4E3E0] text-[#141414]`}>
                  {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#141414]" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#141414]" />}
                  <div>
                    <div className="font-bold uppercase text-[11px]">{testResult.success ? 'Conexão Estabelecida!' : 'Modo Demonstração / Contingência'}</div>
                    <div className="mt-0.5 text-[10px]">{testResult.message}</div>
                  </div>
                </div>
              )}
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

            <div className="space-y-0.5">
              <label className="font-bold uppercase text-[10px] text-[#141414]/70">
                Margem Mínima de Segurança (%):
              </label>
              <input
                type="number"
                value={localMkp.margemMinimaPercentual}
                onChange={(e) => setLocalMkp({ ...localMkp, margemMinimaPercentual: parseFloat(e.target.value) })}
                className="w-full p-2 bg-[#E4E3E0] border border-[#141414] rounded-sm text-[#141414] focus:outline-none font-bold text-xs"
              />
              <p className="text-[10px] text-[#141414]/70">
                Abaixo dessa margem, o sistema sinaliza alerta crítico de prejuízo.
              </p>
            </div>

            <div className="space-y-0.5">
              <label className="font-bold uppercase text-[10px] text-[#141414]/70">
                Despesas Operacionais Estimadas (%):
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

      {/* Mapped API Endpoints Table */}
      <div className="bg-[#F0EFED] rounded-sm border border-[#141414] p-3.5 space-y-3 font-mono">
        <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
          <FileCode className="w-3.5 h-3.5 text-[#141414]" />
          <span>Endpoints Mapeados da API PDV & Swagger</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141414] text-[#E4E3E0] border-b border-[#141414] text-[10px] uppercase tracking-wider">
                <th className="py-2 px-3">Método</th>
                <th className="py-2 px-3">Rota / Endpoint</th>
                <th className="py-2 px-3">Descrição Operacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/15">
              {mappedEndpoints.map((ep, idx) => (
                <tr key={idx} className="hover:bg-[#E4E3E0]/60 transition">
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.2 rounded-xs font-mono font-bold text-[10px] border border-[#141414] bg-[#E4E3E0] text-[#141414]">
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-[#141414]">
                    {ep.path}
                  </td>
                  <td className="py-2 px-3 text-[#141414]/80 font-sans text-xs">
                    {ep.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
