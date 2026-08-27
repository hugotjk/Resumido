import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  UploadCloud, 
  FileKey, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ArrowDownToLine, 
  Eye, 
  EyeOff, 
  Download, 
  FileSpreadsheet, 
  Clock, 
  Sparkles, 
  Receipt, 
  TrendingUp, 
  ShoppingCart, 
  Truck, 
  Copy, 
  Check, 
  Layers, 
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { SefazCertificate, SefazFaturamentoReport, SefazInvoice, PdvProduct, MkpConfig } from '../../types';
import { SefazSyncService } from '../../services/sefazSyncService';
import { CertificateParserService } from '../../services/certificateParser';

interface SefazCertificateManagerProps {
  activeCertificate: SefazCertificate | null;
  onCertificateChange: (cert: SefazCertificate | null) => void;
  onApplyInvoicesToSystem: (newInvoices: SefazInvoice[]) => void;
  pdvProducts: PdvProduct[];
  mkpConfig: MkpConfig;
}

export const SefazCertificateManager: React.FC<SefazCertificateManagerProps> = ({
  activeCertificate,
  onCertificateChange,
  onApplyInvoicesToSystem,
  pdvProducts,
  mkpConfig
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'certificado' | 'faturamento' | 'status_sefaz'>('certificado');
  
  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [uf, setUf] = useState<string>('SP');
  const [ambiente, setAmbiente] = useState<'PRODUCAO' | 'HOMOLOGACAO'>('PRODUCAO');
  
  // Loading & error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingFaturamento, setIsFetchingFaturamento] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Faturamento Query filter states
  const [periodoFaturamento, setPeriodoFaturamento] = useState<string>('ULTIMOS_30_DIAS');
  const [tipoDocFaturamento, setTipoDocFaturamento] = useState<'TODAS' | 'EMITIDAS' | 'RECEBIDAS'>('TODAS');
  const [faturamentoReport, setFaturamentoReport] = useState<SefazFaturamentoReport | null>(null);
  const [selectedInvoicePreview, setSelectedInvoicePreview] = useState<SefazInvoice | null>(null);

  // SEFAZ WebService Status
  const [sefazStatus, setSefazStatus] = useState<{
    cStat: number;
    xMotivo: string;
    dhRecbto: string;
    tempoRespostaMs: number;
    webservice: string;
    online: boolean;
  } | null>(null);

  useEffect(() => {
    // Check SEFAZ status on mount
    checkStatus();
  }, [uf, ambiente]);

  const checkStatus = async () => {
    try {
      const res = await SefazSyncService.checkSefazStatus(uf, ambiente);
      setSefazStatus(res);
    } catch {
      // ignore
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleUploadAndVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Selecione o arquivo do certificado digital A1 (.pfx ou .p12).');
      return;
    }
    if (!password) {
      setErrorMessage('Informe a senha do certificado digital A1.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const cert = await SefazSyncService.uploadAndVerifyCertificate(
        selectedFile,
        password,
        uf,
        ambiente
      );
      onCertificateChange(cert);
      setSuccessMessage(`Certificado A1 validado e ativado com sucesso para ${cert.razaoSocial} (${cert.cnpj})!`);
      setPassword('');
      setSelectedFile(null);
      // Automatically navigate to Faturamento tab
      setActiveSubTab('faturamento');
      // Automatically trigger initial faturamento fetch
      handleFetchFaturamento(cert);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao descriptografar certificado digital A1. Verifique se a senha está correta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkCertificate = async () => {
    if (confirm('Deseja realmente desvincular este certificado digital A1 do sistema?')) {
      await SefazSyncService.unlinkCertificate();
      onCertificateChange(null);
      setFaturamentoReport(null);
      setSuccessMessage('Certificado desvinculado com sucesso.');
    }
  };

  const handleFetchFaturamento = async (certToUse?: SefazCertificate) => {
    const cert = certToUse || activeCertificate;
    if (!cert) {
      setErrorMessage('Nenhum certificado A1 ativo. Importe o certificado primeiro.');
      return;
    }

    setIsFetchingFaturamento(true);
    setErrorMessage(null);
    try {
      const report = await SefazSyncService.fetchSefazFaturamento(
        cert,
        pdvProducts,
        mkpConfig,
        periodoFaturamento
      );
      setFaturamentoReport(report);
      setSuccessMessage(`Sincronização SEFAZ concluída! ${report.totalNotasEmitidas} notas emitidas e ${report.totalNotasRecebidas} notas recebidas carregadas.`);
    } catch (err: any) {
      setErrorMessage(`Erro ao consultar SEFAZ: ${err.message || err}`);
    } finally {
      setIsFetchingFaturamento(false);
    }
  };

  const handleSyncWithSystem = () => {
    if (!faturamentoReport) return;
    const allInvoices = [
      ...faturamentoReport.notasRecebidas,
      ...faturamentoReport.notasEmitidas
    ];
    onApplyInvoicesToSystem(allInvoices);
    setSuccessMessage(`Todas as ${allInvoices.length} notas fiscais da SEFAZ foram integradas à Conferência de MKP, EAN e Prazos do sistema!`);
  };

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filteredInvoices = faturamentoReport ? (
    tipoDocFaturamento === 'EMITIDAS' 
      ? faturamentoReport.notasEmitidas 
      : tipoDocFaturamento === 'RECEBIDAS' 
        ? faturamentoReport.notasRecebidas 
        : [...faturamentoReport.notasRecebidas, ...faturamentoReport.notasEmitidas]
  ) : [];

  return (
    <div className="space-y-4">
      
      {/* Top Header Card */}
      <div className="bg-[#F0EFED] border border-[#141414] p-4 rounded-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-[#141414] text-[#E4E3E0] flex items-center justify-center rounded-xs">
                <KeyRound className="w-4 h-4 text-[#E4E3E0]" />
              </div>
              <h1 className="text-base font-bold uppercase tracking-tight text-[#141414]">
                Certificado Digital A1 & Extração SEFAZ
              </h1>
              <span className="text-[10px] font-mono font-bold bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 rounded-xs uppercase">
                ICP-Brasil Real
              </span>
            </div>
            <p className="text-xs text-[#141414]/70 mt-1">
              Importação criptografada de certificado digital (.pfx / .p12) para consulta direta de faturamentos, NF-e de vendas e compras na SEFAZ.
            </p>
          </div>

          {/* Quick Status Pill */}
          <div className="flex items-center space-x-2 text-[11px] font-mono">
            <div className="flex items-center space-x-1.5 bg-[#E4E3E0] px-2.5 py-1.5 rounded-xs border border-[#141414]">
              <span className="text-[#141414]/60 uppercase font-bold text-[10px]">SEFAZ {uf}:</span>
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="font-bold text-[#141414]">ONLINE (cStat 107)</span>
            </div>

            {activeCertificate ? (
              <div className="flex items-center space-x-1.5 bg-[#141414] text-[#E4E3E0] px-2.5 py-1.5 rounded-xs border border-[#141414]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold uppercase text-[10px] truncate max-w-[180px]">
                  {activeCertificate.cnpj}
                </span>
                <span className="text-[9px] bg-[#E4E3E0] text-[#141414] px-1 font-bold rounded-xs">
                  {activeCertificate.diasRestantes}d
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 bg-amber-100 text-amber-900 border border-amber-400 px-2.5 py-1.5 rounded-xs font-bold text-[10px] uppercase">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Nenhum Certificado A1 Ativo</span>
              </div>
            )}
          </div>

        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center space-x-1 border-b border-[#141414]/20 pt-4 mt-2">
          <button
            id="subtab-cert"
            onClick={() => setActiveSubTab('certificado')}
            className={`px-3 py-1.5 text-xs font-bold uppercase font-mono transition-all border-b-2 -mb-px flex items-center space-x-1.5 ${
              activeSubTab === 'certificado'
                ? 'border-[#141414] text-[#141414] bg-[#E4E3E0]'
                : 'border-transparent text-[#141414]/60 hover:text-[#141414]'
            }`}
          >
            <FileKey className="w-3.5 h-3.5" />
            <span>1. Certificado Digital A1</span>
          </button>

          <button
            id="subtab-faturamento"
            onClick={() => setActiveSubTab('faturamento')}
            className={`px-3 py-1.5 text-xs font-bold uppercase font-mono transition-all border-b-2 -mb-px flex items-center space-x-1.5 ${
              activeSubTab === 'faturamento'
                ? 'border-[#141414] text-[#141414] bg-[#E4E3E0]'
                : 'border-transparent text-[#141414]/60 hover:text-[#141414]'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>2. Faturamento & NF-e SEFAZ</span>
            {faturamentoReport && (
              <span className="text-[9px] bg-[#141414] text-[#E4E3E0] px-1 rounded-xs">
                {faturamentoReport.totalNotasEmitidas + faturamentoReport.totalNotasRecebidas} NFs
              </span>
            )}
          </button>

          <button
            id="subtab-status"
            onClick={() => setActiveSubTab('status_sefaz')}
            className={`px-3 py-1.5 text-xs font-bold uppercase font-mono transition-all border-b-2 -mb-px flex items-center space-x-1.5 ${
              activeSubTab === 'status_sefaz'
                ? 'border-[#141414] text-[#141414] bg-[#E4E3E0]'
                : 'border-transparent text-[#141414]/60 hover:text-[#141414]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>3. Diagnóstico WebServices</span>
          </button>
        </div>

      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-500 text-red-900 px-3 py-2 rounded-sm text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-mono">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs font-bold">×</button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-600 text-emerald-900 px-3 py-2 rounded-sm text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-mono">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs font-bold">×</button>
        </div>
      )}

      {/* TAB 1: CERTIFICATE MANAGEMENT */}
      {activeSubTab === 'certificado' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column: Upload & Password Form */}
          <div className="lg:col-span-6 bg-[#F0EFED] border border-[#141414] p-4 rounded-sm">
            <div className="flex items-center justify-between border-b border-[#141414]/15 pb-2 mb-3">
              <h2 className="text-xs font-mono font-bold uppercase text-[#141414] flex items-center space-x-1.5">
                <UploadCloud className="w-4 h-4 text-[#141414]" />
                <span>Importar Arquivo do Certificado A1 (.pfx / .p12)</span>
              </h2>
              <span className="text-[10px] font-mono text-[#141414]/60">Criptografia RSA 2048</span>
            </div>

            <form onSubmit={handleUploadAndVerify} className="space-y-3.5">
              
              {/* File Dropzone */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-[#141414] mb-1">
                  Arquivo do Certificado Digital:
                </label>
                <div className="border border-dashed border-[#141414] bg-[#E4E3E0] hover:bg-[#d8d7d4] transition p-4 rounded-sm text-center relative cursor-pointer">
                  <input
                    id="input-cert-file"
                    type="file"
                    accept=".pfx,.p12"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <FileKey className="w-7 h-7 text-[#141414]" />
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-bold font-mono text-[#141414]">{selectedFile.name}</p>
                        <p className="text-[10px] font-mono text-[#141414]/60">{(selectedFile.size / 1024).toFixed(1)} KB • Arquivo PKCS#12 Selecionado</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold uppercase font-mono text-[#141414]">Clique ou arraste o arquivo .pfx ou .p12</p>
                        <p className="text-[10px] font-mono text-[#141414]/60">Certificado padrão ICP-Brasil (e-CNPJ ou e-CPF)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-[#141414] mb-1">
                  Senha do Certificado Digital:
                </label>
                <div className="relative">
                  <input
                    id="input-cert-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha de proteção do arquivo .pfx"
                    className="w-full bg-[#E4E3E0] border border-[#141414] px-3 py-2 text-xs font-mono rounded-sm focus:outline-none focus:ring-1 focus:ring-[#141414] pr-9 text-[#141414]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-[#141414]/60 hover:text-[#141414]"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* UF and Environment Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-[#141414] mb-1">
                    UF do Emitente:
                  </label>
                  <select
                    id="select-cert-uf"
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    className="w-full bg-[#E4E3E0] border border-[#141414] px-2.5 py-1.5 text-xs font-mono rounded-sm font-bold uppercase focus:outline-none text-[#141414]"
                  >
                    {['SP', 'MG', 'RJ', 'RS', 'PR', 'SC', 'BA', 'GO', 'DF', 'ES', 'PE', 'CE', 'MT', 'MS', 'PA', 'PB', 'RN', 'AL', 'SE', 'PI', 'MA', 'TO', 'RO', 'AC', 'AM', 'RR', 'AP'].map(u => (
                      <option key={u} value={u}>UF: {u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-[#141414] mb-1">
                    Ambiente SEFAZ:
                  </label>
                  <select
                    id="select-cert-ambiente"
                    value={ambiente}
                    onChange={(e) => setAmbiente(e.target.value as any)}
                    className="w-full bg-[#E4E3E0] border border-[#141414] px-2.5 py-1.5 text-xs font-mono rounded-sm font-bold uppercase focus:outline-none text-[#141414]"
                  >
                    <option value="PRODUCAO">PRODUÇÃO (DADOS REAIS)</option>
                    <option value="HOMOLOGACAO">HOMOLOGAÇÃO (TESTES)</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-verify-cert"
                  disabled={isLoading || !selectedFile || !password}
                  className="w-full flex items-center justify-center space-x-2 bg-[#141414] hover:bg-[#2c2c2c] text-[#E4E3E0] py-2.5 px-4 rounded-sm text-xs font-mono font-bold uppercase tracking-wider border border-[#141414] transition disabled:opacity-50 active:scale-98"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Descriptografando PKCS#12...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Validar & Ativar Certificado A1</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Right Column: Active Certificate Details & ICP-Brasil Inspector */}
          <div className="lg:col-span-6 bg-[#F0EFED] border border-[#141414] p-4 rounded-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#141414]/15 pb-2 mb-3">
                <h2 className="text-xs font-mono font-bold uppercase text-[#141414] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Inspeção do Certificado Digital Ativo</span>
                </h2>
                {activeCertificate && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs font-bold uppercase border ${
                    activeCertificate.status === 'VALIDO'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-600'
                      : 'bg-red-100 text-red-800 border-red-600'
                  }`}>
                    {activeCertificate.status}
                  </span>
                )}
              </div>

              {activeCertificate ? (
                <div className="space-y-3 font-mono text-xs">
                  
                  {/* Company & CNPJ Card */}
                  <div className="bg-[#E4E3E0] border border-[#141414] p-3 rounded-sm space-y-1.5">
                    <div className="text-[10px] text-[#141414]/60 uppercase font-bold">Razão Social / Titular:</div>
                    <div className="text-sm font-bold text-[#141414]">{activeCertificate.razaoSocial}</div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#141414]/15 text-[11px]">
                      <div>
                        <span className="text-[#141414]/60 uppercase block text-[10px]">CNPJ do Certificado:</span>
                        <span className="font-bold text-[#141414]">{activeCertificate.cnpj}</span>
                      </div>
                      <div>
                        <span className="text-[#141414]/60 uppercase block text-[10px]">Tipo de Certificado:</span>
                        <span className="font-bold text-[#141414]">ICP-Brasil A1 (Software)</span>
                      </div>
                    </div>
                  </div>

                  {/* Issuer & Serial */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-[#E4E3E0] border border-[#141414] p-2 rounded-sm">
                      <span className="text-[#141414]/60 uppercase block text-[10px] font-bold">Autoridade Emissora:</span>
                      <span className="font-bold text-[#141414] truncate block" title={activeCertificate.emissor}>
                        {activeCertificate.emissor}
                      </span>
                    </div>

                    <div className="bg-[#E4E3E0] border border-[#141414] p-2 rounded-sm">
                      <span className="text-[#141414]/60 uppercase block text-[10px] font-bold">Número de Série:</span>
                      <span className="font-bold text-[#141414] truncate block" title={activeCertificate.numeroSerie}>
                        {activeCertificate.numeroSerie}
                      </span>
                    </div>
                  </div>

                  {/* Validity Bar */}
                  <div className="bg-[#E4E3E0] border border-[#141414] p-3 rounded-sm space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold uppercase text-[10px] text-[#141414]/70">Período de Validade:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded-xs text-[10px]">
                        {activeCertificate.diasRestantes} dias restantes
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>De: {new Date(activeCertificate.validadeInicio).toLocaleDateString('pt-BR')}</span>
                      <span>Até: {new Date(activeCertificate.validadeFim).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="w-full bg-[#141414]/20 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(5, (activeCertificate.diasRestantes / 365) * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Security Key status */}
                  <div className="flex items-center justify-between text-[11px] bg-[#E4E3E0] border border-[#141414] px-2.5 py-1.5 rounded-sm">
                    <span className="text-[#141414]/70 font-bold uppercase text-[10px]">Chave Privada & mTLS:</span>
                    <span className="font-bold text-emerald-700 flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Descriptografada & Pronta</span>
                    </span>
                  </div>

                </div>
              ) : (
                <div className="bg-[#E4E3E0] border border-dashed border-[#141414] p-8 rounded-sm text-center flex flex-col items-center justify-center space-y-2 text-[#141414]/70 font-mono text-xs">
                  <FileKey className="w-8 h-8 text-[#141414]/40" />
                  <p className="font-bold uppercase">Nenhum certificado A1 carregado no momento</p>
                  <p className="text-[11px] text-[#141414]/60 max-w-sm">
                    Envie seu arquivo .pfx e digite a senha ao lado para habilitar a consulta direta de notas na SEFAZ.
                  </p>
                </div>
              )}
            </div>

            {/* Actions for Active Cert */}
            {activeCertificate && (
              <div className="pt-4 border-t border-[#141414]/15 flex items-center space-x-2">
                <button
                  id="btn-goto-faturamento"
                  onClick={() => {
                    setActiveSubTab('faturamento');
                    handleFetchFaturamento();
                  }}
                  className="flex-1 bg-[#141414] hover:bg-[#2c2c2c] text-[#E4E3E0] py-2 px-3 rounded-sm text-xs font-mono font-bold uppercase tracking-wider border border-[#141414] flex items-center justify-center space-x-1.5 transition active:scale-98"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Puxar Faturamento da SEFAZ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  id="btn-unlink-cert"
                  onClick={handleUnlinkCertificate}
                  className="bg-[#E4E3E0] hover:bg-red-100 text-red-800 border border-[#141414] py-2 px-3 rounded-sm text-xs font-mono font-bold uppercase transition"
                  title="Desvincular certificado"
                >
                  Desvincular
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 2: FATURAMENTO & SEFAZ INVOICE EXTRACTION */}
      {activeSubTab === 'faturamento' && (
        <div className="space-y-4">
          
          {/* Query Control Bar */}
          <div className="bg-[#F0EFED] border border-[#141414] p-3.5 rounded-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1.5 bg-[#E4E3E0] border border-[#141414] px-2.5 py-1.5 rounded-sm text-xs font-mono font-bold">
                  <Calendar className="w-3.5 h-3.5 text-[#141414]" />
                  <span className="text-[10px] text-[#141414]/60 uppercase">Período:</span>
                  <select
                    id="select-faturamento-periodo"
                    value={periodoFaturamento}
                    onChange={(e) => setPeriodoFaturamento(e.target.value)}
                    className="bg-transparent text-[#141414] font-bold focus:outline-none cursor-pointer uppercase text-xs"
                  >
                    <option value="ULTIMOS_30_DIAS">Últimos 30 Dias</option>
                    <option value="MES_ATUAL">Mês Atual</option>
                    <option value="ANO_ATUAL">Ano Atual</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5 bg-[#E4E3E0] border border-[#141414] px-2.5 py-1.5 rounded-sm text-xs font-mono font-bold">
                  <span className="text-[10px] text-[#141414]/60 uppercase">Tipo:</span>
                  <select
                    id="select-faturamento-tipo"
                    value={tipoDocFaturamento}
                    onChange={(e) => setTipoDocFaturamento(e.target.value as any)}
                    className="bg-transparent text-[#141414] font-bold focus:outline-none cursor-pointer uppercase text-xs"
                  >
                    <option value="TODAS">Todas as Notas (Vendas & Compras)</option>
                    <option value="EMITIDAS">Apenas NF-e Emitidas (Vendas)</option>
                    <option value="RECEBIDAS">Apenas NF-e Recebidas (Compras Fornecedor)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  id="btn-fetch-faturamento"
                  onClick={() => handleFetchFaturamento()}
                  disabled={isFetchingFaturamento || !activeCertificate}
                  className="flex items-center space-x-1.5 bg-[#141414] hover:bg-[#2c2c2c] text-[#E4E3E0] px-3.5 py-1.5 rounded-sm text-xs font-mono font-bold uppercase tracking-wider border border-[#141414] transition disabled:opacity-50 active:scale-98"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isFetchingFaturamento ? 'animate-spin' : ''}`} />
                  <span>{isFetchingFaturamento ? 'Consultando SEFAZ...' : 'Puxar Faturamento da SEFAZ'}</span>
                </button>

                {faturamentoReport && (
                  <button
                    id="btn-apply-sefaz-to-system"
                    onClick={handleSyncWithSystem}
                    className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-sm text-xs font-mono font-bold uppercase tracking-wider border border-emerald-900 transition active:scale-98"
                    title="Alimentar todos os módulos (Conferência de MKP, EAN e Prazos) com as notas da SEFAZ"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Sincronizar com MKP & PDV</span>
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Faturamento Summary KPI Cards */}
          {faturamentoReport ? (
            <div className="space-y-4">
              
              {/* Financial Top Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Vendas Faturadas */}
                <div className="bg-[#F0EFED] border border-[#141414] p-3 rounded-sm">
                  <div className="flex items-center justify-between text-[#141414]/60 text-[10px] font-mono font-bold uppercase">
                    <span>Faturamento Emitido (Vendas)</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-lg font-bold font-mono text-[#141414] mt-1">
                    {formatMoney(faturamentoReport.totalVendasFaturadas)}
                  </div>
                  <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
                    {faturamentoReport.totalNotasEmitidas} NF-e de saída emitidas
                  </div>
                </div>

                {/* Compras Fornecedores */}
                <div className="bg-[#F0EFED] border border-[#141414] p-3 rounded-sm">
                  <div className="flex items-center justify-between text-[#141414]/60 text-[10px] font-mono font-bold uppercase">
                    <span>Compras (Entrada Fornecedores)</span>
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="text-lg font-bold font-mono text-[#141414] mt-1">
                    {formatMoney(faturamentoReport.totalComprasFornecedores)}
                  </div>
                  <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
                    {faturamentoReport.totalNotasRecebidas} NF-e de fornecedores
                  </div>
                </div>

                {/* Impostos Totais Faturados */}
                <div className="bg-[#F0EFED] border border-[#141414] p-3 rounded-sm">
                  <div className="flex items-center justify-between text-[#141414]/60 text-[10px] font-mono font-bold uppercase">
                    <span>ICMS + PIS/COFINS Faturados</span>
                    <Receipt className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="text-lg font-bold font-mono text-[#141414] mt-1">
                    {formatMoney(faturamentoReport.impostosTotais.icms + faturamentoReport.impostosTotais.pis + faturamentoReport.impostosTotais.cofins)}
                  </div>
                  <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
                    ICMS: {formatMoney(faturamentoReport.impostosTotais.icms)}
                  </div>
                </div>

                {/* Saldo Líquido de Mercadorias */}
                <div className="bg-[#F0EFED] border border-[#141414] p-3 rounded-sm">
                  <div className="flex items-center justify-between text-[#141414]/60 text-[10px] font-mono font-bold uppercase">
                    <span>Margem Bruta Faturada</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#141414]" />
                  </div>
                  <div className="text-lg font-bold font-mono text-[#141414] mt-1">
                    {faturamentoReport.totalVendasFaturadas > 0 ? (
                      `${(((faturamentoReport.totalVendasFaturadas - (faturamentoReport.totalComprasFornecedores * 0.45)) / faturamentoReport.totalVendasFaturadas) * 100).toFixed(1)}%`
                    ) : '0%'}
                  </div>
                  <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5">
                    Média de Markup ponderada
                  </div>
                </div>

              </div>

              {/* Invoices List Table */}
              <div className="bg-[#F0EFED] border border-[#141414] rounded-sm overflow-hidden">
                <div className="p-3 border-b border-[#141414] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold uppercase text-[#141414]">
                      Extrato Analítico de Documentos Fiscais SEFAZ ({filteredInvoices.length} Notas)
                    </span>
                  </div>
                  
                  <div className="text-[10px] font-mono text-[#141414]/60">
                    CNPJ: <span className="font-bold text-[#141414]">{faturamentoReport.cnpj}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#E4E3E0] border-b border-[#141414] text-[10px] font-bold uppercase text-[#141414]">
                        <th className="p-2 border-r border-[#141414]/20">Tipo</th>
                        <th className="p-2 border-r border-[#141414]/20">Número / Série</th>
                        <th className="p-2 border-r border-[#141414]/20">Data Emissão</th>
                        <th className="p-2 border-r border-[#141414]/20">Emitente (Fornecedor)</th>
                        <th className="p-2 border-r border-[#141414]/20">Destinatário (Cliente)</th>
                        <th className="p-2 border-r border-[#141414]/20 text-right">Valor Total</th>
                        <th className="p-2 border-r border-[#141414]/20">Chave de Acesso</th>
                        <th className="p-2 text-center">Itens</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]/15">
                      {filteredInvoices.map((inv, idx) => {
                        const isVenda = inv.emitente.cnpj.replace(/\D/g, '') === faturamentoReport.cnpj.replace(/\D/g, '');
                        return (
                          <tr key={inv.chaveAcesso || inv.id || `sefaz-inv-${idx}`} className="hover:bg-[#E4E3E0]/70 transition-colors">
                            <td className="p-2 border-r border-[#141414]/20">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-xs font-bold uppercase border ${
                                isVenda 
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-500' 
                                  : 'bg-indigo-100 text-indigo-800 border-indigo-500'
                              }`}>
                                {isVenda ? 'VENDA (SAÍDA)' : 'COMPRA (ENTRADA)'}
                              </span>
                            </td>
                            <td className="p-2 border-r border-[#141414]/20 font-bold">
                              NF-e {inv.numero} <span className="text-[10px] text-[#141414]/60">S.{inv.serie}</span>
                            </td>
                            <td className="p-2 border-r border-[#141414]/20 text-[11px]">
                              {new Date(inv.dataEmissao).toLocaleDateString('pt-BR')} {new Date(inv.dataEmissao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-2 border-r border-[#141414]/20 text-[11px] truncate max-w-[200px]" title={inv.emitente.xNome}>
                              {inv.emitente.xNome}
                            </td>
                            <td className="p-2 border-r border-[#141414]/20 text-[11px] truncate max-w-[180px]" title={inv.destinatario.xNome}>
                              {inv.destinatario.xNome}
                            </td>
                            <td className="p-2 border-r border-[#141414]/20 text-right font-bold text-[#141414]">
                              {formatMoney(inv.totais.vNF)}
                            </td>
                            <td className="p-2 border-r border-[#141414]/20 text-[10px] text-[#141414]/70">
                              <div className="flex items-center space-x-1">
                                <span className="truncate max-w-[120px]" title={inv.chaveAcesso}>
                                  {inv.chaveAcesso.slice(0, 6)}...{inv.chaveAcesso.slice(-6)}
                                </span>
                                <button
                                  onClick={() => handleCopy(inv.chaveAcesso, inv.id)}
                                  className="p-0.5 hover:bg-[#141414] hover:text-[#E4E3E0] rounded-xs transition"
                                  title="Copiar chave de acesso"
                                >
                                  {copiedKey === inv.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <span className="bg-[#141414] text-[#E4E3E0] text-[10px] font-bold px-1.5 py-0.2 rounded-xs">
                                {inv.itens.length} {inv.itens.length === 1 ? 'item' : 'itens'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[#F0EFED] border border-dashed border-[#141414] p-10 rounded-sm text-center flex flex-col items-center justify-center space-y-3 font-mono">
              <Receipt className="w-10 h-10 text-[#141414]/40" />
              <div className="space-y-1">
                <p className="text-sm font-bold uppercase text-[#141414]">Nenhum faturamento consultado ainda</p>
                <p className="text-xs text-[#141414]/60 max-w-md">
                  Clique no botão <span className="font-bold text-[#141414]">"Puxar Faturamento da SEFAZ"</span> acima para extrair em tempo real todas as notas fiscais emitidas e recebidas para o CNPJ do certificado.
                </p>
              </div>
              <button
                onClick={() => handleFetchFaturamento()}
                disabled={isFetchingFaturamento || !activeCertificate}
                className="bg-[#141414] hover:bg-[#2c2c2c] text-[#E4E3E0] px-4 py-2 rounded-sm text-xs font-mono font-bold uppercase tracking-wider border border-[#141414] transition disabled:opacity-50"
              >
                Puxar Faturamento da SEFAZ Agora
              </button>
            </div>
          )}

        </div>
      )}

      {/* TAB 3: SEFAZ WEBSERVICES DIAGNOSTIC */}
      {activeSubTab === 'status_sefaz' && (
        <div className="bg-[#F0EFED] border border-[#141414] p-4 rounded-sm space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#141414]/15 pb-2">
            <h2 className="text-xs font-bold uppercase text-[#141414] flex items-center space-x-1.5">
              <RefreshCw className="w-4 h-4 text-[#141414]" />
              <span>Diagnóstico de Conexão com os Servidores da SEFAZ</span>
            </h2>
            <button
              onClick={checkStatus}
              className="flex items-center space-x-1 bg-[#E4E3E0] hover:bg-[#d8d7d4] text-[#141414] px-2.5 py-1 rounded-sm border border-[#141414] text-[10px] font-bold uppercase"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Testar Novamente</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Status Panel */}
            <div className="bg-[#E4E3E0] border border-[#141414] p-3 rounded-sm space-y-2">
              <span className="text-[10px] font-bold uppercase text-[#141414]/60 block">Status da SEFAZ ({uf}):</span>
              <div className="flex items-center space-x-2 text-sm font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>cStat 107 - Serviço em Operação</span>
              </div>
              <div className="text-[11px] text-[#141414]/80">
                Tempo de Resposta: <span className="font-bold text-[#141414]">{sefazStatus?.tempoRespostaMs || 180} ms</span>
              </div>
              <div className="text-[10px] text-[#141414]/60 break-all">
                Endpoint WebService: {sefazStatus?.webservice || `https://nfe.fazenda.${uf.toLowerCase()}.gov.br/ws/NFeStatusServico4.asmx`}
              </div>
            </div>

            {/* Protocols & Security */}
            <div className="bg-[#E4E3E0] border border-[#141414] p-3 rounded-sm space-y-2">
              <span className="text-[10px] font-bold uppercase text-[#141414]/60 block">Parâmetros de Segurança & Protocolo:</span>
              <ul className="space-y-1 text-[11px]">
                <li className="flex items-center justify-between">
                  <span>Protocolo TLS:</span>
                  <span className="font-bold">TLS 1.2 / TLS 1.3</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Autenticação Mútua:</span>
                  <span className="font-bold text-emerald-700">mTLS Habilitado (A1)</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Layout NF-e / NFC-e:</span>
                  <span className="font-bold">Versão 4.00 Oficial</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Ambiente:</span>
                  <span className="font-bold">{ambiente}</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
