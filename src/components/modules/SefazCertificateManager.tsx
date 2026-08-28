import React, { useState, useEffect, useRef } from 'react';
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
  Clock, 
  Receipt, 
  Copy, 
  Check, 
  Layers, 
  Lock,
  ExternalLink,
  Search,
  Trash2,
  FileCode,
  Archive,
  FileText,
  AlertCircle,
  HelpCircle,
  PlusCircle,
  Store,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { SefazCertificate, SefazInvoice } from '../../types';
import { SefazSyncService } from '../../services/sefazSyncService';
import { SefazXmlParser } from '../../services/sefazParser';
import { FirestoreDbService } from '../../services/firestoreDbService';
import { XmlUploaderModal } from './XmlUploaderModal';

interface SefazCertificateManagerProps {
  certificates: SefazCertificate[];
  activeCertificate: SefazCertificate | null;
  onCertificatesChange: (certs: SefazCertificate[]) => void;
  onCertificateChange: (cert: SefazCertificate | null) => void;
  invoices: SefazInvoice[];
  onInvoicesChange: (invoices: SefazInvoice[]) => void;
  onClearAllInvoices?: () => void;
}

export const SefazCertificateManager: React.FC<SefazCertificateManagerProps> = ({
  certificates = [],
  activeCertificate,
  onCertificatesChange,
  onCertificateChange,
  invoices = [],
  onInvoicesChange,
  onClearAllInvoices
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'xmls' | 'certificados' | 'status_sefaz'>('xmls');
  
  // Form states for Certificate
  const [selectedCertFile, setSelectedCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [certUf, setCertUf] = useState<string>(activeCertificate?.uf || 'SP');
  const [certAmbiente, setCertAmbiente] = useState<'PRODUCAO' | 'HOMOLOGACAO'>(activeCertificate?.ambiente || 'PRODUCAO');
  
  // Status & Feedback states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncingSefaz, setIsSyncingSefaz] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [isClearingInvoices, setIsClearingInvoices] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedXmlChave, setCopiedXmlChave] = useState<string | null>(null);

  // PDV / Sales & Chave Lookup Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isChaveModalOpen, setIsChaveModalOpen] = useState<boolean>(false);
  const [chaveInput, setChaveInput] = useState<string>('');
  const [isConsultingChave, setIsConsultingChave] = useState<boolean>(false);
  const [showFaturamentoInfo, setShowFaturamentoInfo] = useState<boolean>(true);

  // SEFAZ WebService Query states
  const [selectedStoreCnpj, setSelectedStoreCnpj] = useState<string>(activeCertificate?.cnpj || 'ALL');
  const [tipoConsultaSefaz, setTipoConsultaSefaz] = useState<'distNSU' | 'consNSU' | 'consChNFe'>('distNSU');
  const [sefazUltNSU, setSefazUltNSU] = useState<string>('0');
  const [sefazSpecificNSU, setSefazSpecificNSU] = useState<string>('');
  const [sefazChaveConsulta, setSefazChaveConsulta] = useState<string>('');
  const [lastSefazResult, setLastSefazResult] = useState<{
    cStat: number;
    xMotivo: string;
    ultNSU: string;
    maxNSU: string;
    totalDocs: number;
    cnpj?: string;
  } | null>(null);

  // Multi-page sync and NSU progress tracking state
  const [syncProgress, setSyncProgress] = useState<{
    isActive: boolean;
    mode: 'INCREMENTAL' | 'FULL';
    currentPage: number;
    ultNSU: string;
    maxNSU: string;
    newInvoicesCount: number;
    eventsCount: number;
    cceCount: number;
    cancelCount: number;
    statusText: string;
  } | null>(null);

  const [nsuSyncState, setNsuSyncState] = useState<import('../../types').SefazNsuSyncState | null>(null);

  // XML Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tipoOperacaoFilter, setTipoOperacaoFilter] = useState<'TODAS' | 'ENTRADA' | 'SAIDA'>('TODAS');
  const [statusNotaFilter, setStatusNotaFilter] = useState<'TODAS' | 'AUTORIZADA' | 'CANCELADA' | 'CCE'>('TODAS');
  const [selectedInvoiceModal, setSelectedInvoiceModal] = useState<SefazInvoice | null>(null);
  const [rawXmlModal, setRawXmlModal] = useState<{ chave: string; numero: string; xml: string } | null>(null);
  const [cceModalInvoice, setCceModalInvoice] = useState<SefazInvoice | null>(null);
  const [fiscalEventsList, setFiscalEventsList] = useState<import('../../types').SefazFiscalEvent[]>([]);

  // File Upload input refs
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    checkStatus();
  }, [certUf, certAmbiente]);

  useEffect(() => {
    if (activeCertificate && selectedStoreCnpj === 'ALL') {
      setSelectedStoreCnpj(activeCertificate.cnpj);
    }
    const targetCnpj = selectedStoreCnpj !== 'ALL' ? selectedStoreCnpj : (activeCertificate?.cnpj || (certificates[0]?.cnpj || ''));
    if (targetCnpj) {
      loadSyncStateAndEvents(targetCnpj);
    }
  }, [activeCertificate, selectedStoreCnpj, certificates]);

  const loadSyncStateAndEvents = async (cnpj: string) => {
    try {
      const state = await SefazSyncService.getSyncState(cnpj);
      if (state) {
        setNsuSyncState(state);
        setSefazUltNSU(state.ultimoNSUSincronizado || '0');
      }
      const events = await SefazSyncService.getFiscalEvents(cnpj);
      setFiscalEventsList(events);
    } catch {
      // ignore
    }
  };

  const checkStatus = async () => {
    try {
      const res = await SefazSyncService.checkSefazStatus(certUf, certAmbiente);
      setSefazStatus(res);
    } catch {
      // ignore
    }
  };

  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedCertFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleUploadCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCertFile) {
      setErrorMessage('Selecione o arquivo do certificado digital A1 (.pfx ou .p12).');
      return;
    }
    if (!certPassword) {
      setErrorMessage('Informe a senha do certificado digital A1.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const cert = await SefazSyncService.uploadAndVerifyCertificate(
        selectedCertFile,
        certPassword,
        certUf,
        certAmbiente
      );

      // Add to certificates list without replacing existing ones
      const cleanCnpj = cert.cnpj.replace(/\D/g, '');
      const filtered = certificates.filter(c => c.cnpj.replace(/\D/g, '') !== cleanCnpj);
      const updatedList = [cert, ...filtered];
      
      onCertificatesChange(updatedList);
      onCertificateChange(cert);
      setSelectedStoreCnpj(cert.cnpj);

      setSuccessMessage(`Certificado da loja "${cert.razaoSocial}" (CNPJ: ${cert.cnpj}) adicionado com sucesso! Total: ${updatedList.length} loja(s) cadastradas.`);
      setCertPassword('');
      setSelectedCertFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar certificado digital.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCertificate = async (cnpjToRemove: string) => {
    if (confirm(`Deseja realmente remover o certificado do CNPJ ${cnpjToRemove}?`)) {
      await SefazSyncService.removeCertificate(cnpjToRemove);
      const cleanToRemove = cnpjToRemove.replace(/\D/g, '');
      const updatedList = certificates.filter(c => c.cnpj.replace(/\D/g, '') !== cleanToRemove);
      onCertificatesChange(updatedList);
      
      if (activeCertificate && activeCertificate.cnpj.replace(/\D/g, '') === cleanToRemove) {
        onCertificateChange(updatedList.length > 0 ? updatedList[0] : null);
      }
      setSuccessMessage(`Certificado CNPJ ${cnpjToRemove} removido com sucesso.`);
    }
  };

  // 1. Sincronização Incremental (Apenas o que é novo ou sofreu alterações: novas notas, CC-e, cancelamentos)
  const handleSyncIncremental = async (targetCert?: SefazCertificate) => {
    const certToUse = targetCert || (selectedStoreCnpj !== 'ALL' && certificates.find(c => c.cnpj === selectedStoreCnpj)) || activeCertificate || (certificates.length > 0 ? certificates[0] : null);
    
    if (!certToUse) {
      setErrorMessage('Adicione ou selecione um certificado digital A1 antes de consultar a SEFAZ.');
      return;
    }

    setIsSyncingSefaz(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSyncProgress({
      isActive: true,
      mode: 'INCREMENTAL',
      currentPage: 0,
      ultNSU: sefazUltNSU,
      maxNSU: nsuSyncState?.maxNSUSefaz || sefazUltNSU,
      newInvoicesCount: 0,
      eventsCount: 0,
      cceCount: 0,
      cancelCount: 0,
      statusText: 'Iniciando sincronização incremental (buscando novos documentos e alterações)...'
    });

    try {
      const result = await SefazSyncService.syncIncremental(certToUse.cnpj, {
        uf: certToUse.uf,
        ambiente: certToUse.ambiente,
        maxPages: 15,
        onProgress: (p) => {
          setSyncProgress({
            isActive: true,
            mode: 'INCREMENTAL',
            ...p
          });
        }
      });

      // Reload fresh database state
      const freshInvoices = await SefazSyncService.loadRealInvoices();
      onInvoicesChange(freshInvoices);

      await loadSyncStateAndEvents(certToUse.cnpj);

      setSuccessMessage(result.mensagem);
    } catch (err: any) {
      setErrorMessage(`Falha na sincronização incremental: ${err.message}`);
    } finally {
      setIsSyncingSefaz(false);
      setTimeout(() => setSyncProgress(null), 3000);
    }
  };

  // 2. Puxada Completa (Todos os NSUs desde o início até o final)
  const handleSyncFullPages = async (targetCert?: SefazCertificate) => {
    const certToUse = targetCert || (selectedStoreCnpj !== 'ALL' && certificates.find(c => c.cnpj === selectedStoreCnpj)) || activeCertificate || (certificates.length > 0 ? certificates[0] : null);
    
    if (!certToUse) {
      setErrorMessage('Adicione ou selecione um certificado digital A1 antes de consultar a SEFAZ.');
      return;
    }

    if (!confirm(`Deseja iniciar a puxada completa de TODOS os NSUs da SEFAZ para a loja "${certToUse.razaoSocial}"? Isso buscará todo o histórico disponível.`)) {
      return;
    }

    setIsSyncingSefaz(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSyncProgress({
      isActive: true,
      mode: 'FULL',
      currentPage: 0,
      ultNSU: '0',
      maxNSU: '0',
      newInvoicesCount: 0,
      eventsCount: 0,
      cceCount: 0,
      cancelCount: 0,
      statusText: 'Iniciando varredura completa de todos os lotes de documentos da SEFAZ...'
    });

    try {
      const result = await SefazSyncService.syncFullAllPages(certToUse.cnpj, {
        uf: certToUse.uf,
        ambiente: certToUse.ambiente,
        maxPages: 50,
        onProgress: (p) => {
          setSyncProgress({
            isActive: true,
            mode: 'FULL',
            ...p
          });
        }
      });

      const freshInvoices = await SefazSyncService.loadRealInvoices();
      onInvoicesChange(freshInvoices);

      await loadSyncStateAndEvents(certToUse.cnpj);

      setSuccessMessage(result.mensagem);
    } catch (err: any) {
      setErrorMessage(`Falha na puxada completa: ${err.message}`);
    } finally {
      setIsSyncingSefaz(false);
      setTimeout(() => setSyncProgress(null), 3000);
    }
  };

  // Reset NSU pointer
  const handleResetNSU = async () => {
    const targetCnpj = selectedStoreCnpj !== 'ALL' ? selectedStoreCnpj : (activeCertificate?.cnpj || '');
    if (!targetCnpj) return;
    if (confirm('Deseja resetar o ponteiro de último NSU para 0? A próxima consulta incremental buscará desde o início.')) {
      await SefazSyncService.resetSyncState(targetCnpj);
      setSefazUltNSU('0');
      await loadSyncStateAndEvents(targetCnpj);
      setSuccessMessage('Ponteiro de NSU resetado com sucesso para 0.');
    }
  };

  // Synchronize XMLs for ALL registered certificates in sequence (Incremental)
  const handleSyncAllStores = async () => {
    if (certificates.length === 0) {
      setErrorMessage('Nenhum certificado cadastrado para sincronizar.');
      return;
    }

    setIsSyncingAll(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    let totalNewDocs = 0;
    let totalCces = 0;
    let totalCancels = 0;

    try {
      for (const cert of certificates) {
        try {
          const res = await SefazSyncService.syncIncremental(cert.cnpj, {
            uf: cert.uf,
            ambiente: cert.ambiente,
            maxPages: 10
          });

          totalNewDocs += res.novasNotas.length;
          totalCces += res.cartasCorrecaoNovas;
          totalCancels += res.cancelamentosNovos;
        } catch (storeErr: any) {
          console.warn(`[SEFAZ Sync All] Error querying for CNPJ ${cert.cnpj}:`, storeErr);
        }
      }

      const freshInvoices = await SefazSyncService.loadRealInvoices();
      onInvoicesChange(freshInvoices);

      if (totalNewDocs > 0 || totalCces > 0 || totalCancels > 0) {
        setSuccessMessage(`Sincronização de todas as ${certificates.length} lojas concluída! +${totalNewDocs} notas novas, ${totalCces} cartas de correção e ${totalCancels} cancelamentos processados.`);
      } else {
        setSuccessMessage(`Sincronização geral concluída nas ${certificates.length} lojas. Banco já estava 100% atualizado com a SEFAZ.`);
      }
    } catch (err: any) {
      setErrorMessage(`Erro na sincronização de todas as lojas: ${err.message}`);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Consultar nota específica por chave de acesso (44 dígitos) diretamente na SEFAZ
  const handleConsultarChave = async (chaveToQuery: string) => {
    const cleanKey = chaveToQuery.replace(/\D/g, '');
    if (cleanKey.length !== 44) {
      setErrorMessage('A chave de acesso da NF-e deve possuir exatamente 44 dígitos numéricos.');
      return;
    }

    const certToUse = (selectedStoreCnpj !== 'ALL' && certificates.find(c => c.cnpj === selectedStoreCnpj)) || activeCertificate || (certificates.length > 0 ? certificates[0] : null);
    if (!certToUse) {
      setErrorMessage('Adicione ou selecione um certificado digital A1 para assinar a consulta.');
      return;
    }

    setIsConsultingChave(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await SefazSyncService.syncFromSefazWebService({
        cnpj: certToUse.cnpj,
        uf: certToUse.uf,
        ambiente: certToUse.ambiente,
        tipoConsulta: 'consChNFe',
        chNFe: cleanKey
      });

      if (res.newInvoices.length > 0) {
        const existingMap = new Map<string, SefazInvoice>();
        invoices.forEach(i => existingMap.set(i.chaveAcesso, i));
        res.newInvoices.forEach(i => existingMap.set(i.chaveAcesso, i));
        const merged = Array.from(existingMap.values());
        onInvoicesChange(merged);
        await FirestoreDbService.saveInvoices(res.newInvoices);
        setSuccessMessage(`NF-e nº ${res.newInvoices[0].numero} (${res.newInvoices[0].emitente.xNome}) baixada com sucesso da SEFAZ!`);
        setChaveInput('');
        setIsChaveModalOpen(false);
      } else if (res.fiscalEvents.length > 0) {
        setSuccessMessage(`Evento fiscal localizado para a chave: ${res.fiscalEvents[0].descricaoEvento}`);
        setIsChaveModalOpen(false);
      } else {
        setErrorMessage(`Retorno SEFAZ (cStat ${res.cStat}): ${res.xMotivo}`);
      }
    } catch (err: any) {
      setErrorMessage(`Erro ao consultar chave na SEFAZ: ${err.message}`);
    } finally {
      setIsConsultingChave(false);
    }
  };

  // Download all XMLs as a ZIP
  const handleDownloadAllZip = async () => {
    if (invoices.length === 0) {
      setErrorMessage('Nenhum XML disponível no banco para exportação.');
      return;
    }

    setIsExportingZip(true);
    try {
      const zipBlob = await SefazSyncService.exportInvoicesToZip(invoices);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SEFAZ_XMLs_LOTE_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccessMessage(`Pacote ZIP com ${invoices.length} XML(s) baixado com sucesso!`);
    } catch (err: any) {
      setErrorMessage(`Falha ao gerar ZIP: ${err.message}`);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Clear all invoices from database
  const handleClearAll = async () => {
    if (confirm('Atenção: Deseja realmente apagar TODOS os registros de notas fiscais do banco de dados? Isso deixará a lista 100% limpa.')) {
      setIsClearingInvoices(true);
      try {
        if (onClearAllInvoices) {
          await onClearAllInvoices();
        } else {
          await SefazSyncService.clearAllInvoices();
          onInvoicesChange([]);
        }
        setSuccessMessage('Banco de notas fiscais limpo com sucesso!');
      } catch (err: any) {
        setErrorMessage(`Falha ao limpar banco de notas: ${err.message}`);
      } finally {
        setIsClearingInvoices(false);
      }
    }
  };

  // Download single XML file
  const handleDownloadSingleXml = (inv: SefazInvoice) => {
    const xmlContent = inv.xmlOriginal || inv.xmlRaw || SefazXmlParser.generateXml(inv);
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.chaveAcesso || `NFe_${inv.numero}`}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy raw XML string to clipboard
  const handleCopyXml = async (inv: SefazInvoice) => {
    const xmlContent = inv.xmlOriginal || inv.xmlRaw || SefazXmlParser.generateXml(inv);
    try {
      await navigator.clipboard.writeText(xmlContent);
      setCopiedXmlChave(inv.chaveAcesso);
      setTimeout(() => setCopiedXmlChave(null), 3000);
    } catch {
      // fallback
    }
  };

  // Copy Chave de Acesso
  const handleCopyChave = async (chave: string) => {
    try {
      await navigator.clipboard.writeText(chave);
      setCopiedKey(chave);
      setTimeout(() => setCopiedKey(null), 3000);
    } catch {
      // fallback
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (chaveAcesso: string) => {
    if (confirm('Deseja remover este XML do banco de dados?')) {
      await SefazSyncService.deleteInvoice(chaveAcesso);
      onInvoicesChange(invoices.filter(i => i.chaveAcesso !== chaveAcesso));
    }
  };

  // Filtered invoices list
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.chaveAcesso.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.numero.toString().includes(searchQuery) ||
      inv.emitente.xNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.emitente.cnpj.includes(searchQuery) ||
      inv.itens.some(it => it.xProd.toLowerCase().includes(searchQuery.toLowerCase()) || (it.cEAN && it.cEAN.includes(searchQuery)));

    if (!matchesSearch) return false;

    if (tipoOperacaoFilter === 'ENTRADA' && inv.tipoOperacao !== 'ENTRADA') return false;
    if (tipoOperacaoFilter === 'SAIDA' && inv.tipoOperacao !== 'SAIDA') return false;

    if (statusNotaFilter === 'AUTORIZADA' && (inv.statusNota === 'CANCELADA' || inv.cancelada)) return false;
    if (statusNotaFilter === 'CANCELADA' && (inv.statusNota !== 'CANCELADA' && !inv.cancelada)) return false;
    if (statusNotaFilter === 'CCE' && (inv.statusNota !== 'CCE' && !inv.cartaCorrecao)) return false;

    return true;
  });

  return (
    <div className="space-y-4 font-mono">

      {/* Header Banner */}
      <div className="bg-[#F0EFED] p-3.5 sm:p-4 rounded-sm border border-[#141414] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[#141414]">
              Central de XMLs SEFAZ & Multi-Certificados A1
            </h2>
            <span className="px-1.5 py-0.2 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase rounded-xs">
              DADOS 100% REAIS
            </span>
          </div>
          <p className="text-[11px] text-[#141414]/70 mt-0.5 font-sans">
            Comunicação direta com o WebService da SEFAZ Nacional via mTLS para múltiplas lojas/CNPJs com download automático de XMLs.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {invoices.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isClearingInvoices}
              className="px-3 py-1.5 bg-[#E4E3E0] hover:bg-red-200 text-red-900 font-bold text-xs uppercase tracking-wider rounded-sm transition flex items-center space-x-1.5 border border-red-900/30"
              title="Limpar todos os registros de notas fiscais do banco"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-800" />
              <span>Limpar Banco de Notas</span>
            </button>
          )}

          <button
            onClick={handleDownloadAllZip}
            disabled={isExportingZip || invoices.length === 0}
            className="px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-bold text-xs uppercase tracking-wider rounded-sm transition flex items-center space-x-1.5 border border-[#141414] disabled:opacity-50"
            title="Baixar todos os XMLs salvos no banco em um arquivo .zip"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{isExportingZip ? 'Gerando ZIP...' : `Baixar Todos (${invoices.length}) .ZIP`}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3 bg-[#E4E3E0] border border-[#141414] rounded-sm flex items-start space-x-2 text-[#141414] text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#141414]" />
          <div>
            <span className="font-bold uppercase">Aviso do Sistema: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-[#E4E3E0] border border-[#141414] rounded-sm flex items-start space-x-2 text-[#141414] text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#141414]" />
          <div>
            <span className="font-bold uppercase">Sucesso: </span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#141414] bg-[#F0EFED] p-1 gap-1 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('xmls')}
          className={`px-4 py-2 font-bold uppercase transition flex items-center space-x-2 rounded-xs whitespace-nowrap ${
            activeSubTab === 'xmls'
              ? 'bg-[#141414] text-[#E4E3E0]'
              : 'bg-transparent text-[#141414] hover:bg-[#E4E3E0]'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>XMLs da SEFAZ ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('eventos' as any)}
          className={`px-4 py-2 font-bold uppercase transition flex items-center space-x-2 rounded-xs whitespace-nowrap ${
            (activeSubTab as any) === 'eventos'
              ? 'bg-[#141414] text-[#E4E3E0]'
              : 'bg-transparent text-[#141414] hover:bg-[#E4E3E0]'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Eventos & Mudanças ({fiscalEventsList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('certificados')}
          className={`px-4 py-2 font-bold uppercase transition flex items-center space-x-2 rounded-xs whitespace-nowrap ${
            activeSubTab === 'certificados'
              ? 'bg-[#141414] text-[#E4E3E0]'
              : 'bg-transparent text-[#141414] hover:bg-[#E4E3E0]'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Certificados Digitais A1 ({certificates.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('status_sefaz')}
          className={`px-4 py-2 font-bold uppercase transition flex items-center space-x-2 rounded-xs whitespace-nowrap ${
            activeSubTab === 'status_sefaz'
              ? 'bg-[#141414] text-[#E4E3E0]'
              : 'bg-transparent text-[#141414] hover:bg-[#E4E3E0]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Status WebService SEFAZ</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: XMLS MANAGEMENT & COPIER */}
      {/* ========================================================================= */}
      {activeSubTab === 'xmls' && (
        <div className="space-y-4">
          
          {/* SEFAZ WebService Sync Action Bar */}
          <div className="bg-[#F0EFED] p-3.5 rounded-sm border border-[#141414] space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#141414] pb-2">
              <div className="flex items-center space-x-2">
                <RefreshCw className={`w-4 h-4 text-[#141414] ${isSyncingSefaz || isSyncingAll ? 'animate-spin' : ''}`} />
                <h3 className="font-bold text-[#141414] text-xs uppercase">
                  Sincronizador Inteligente SEFAZ (WebService DFe)
                </h3>
              </div>

              {/* Quick Status indicators */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 bg-[#E4E3E0] border border-[#141414] rounded-xs font-mono text-[10px]">
                  Último NSU Salvo: <strong>{sefazUltNSU}</strong>
                </span>
                {nsuSyncState?.maxNSUSefaz && nsuSyncState.maxNSUSefaz !== '0' && (
                  <span className="px-2 py-0.5 bg-[#E4E3E0] border border-[#141414] rounded-xs font-mono text-[10px]">
                    Total SEFAZ: <strong>{nsuSyncState.maxNSUSefaz}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Sync Controls Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
              {/* Store Selector */}
              <div className="lg:col-span-4 space-y-0.5">
                <label className="text-[10px] font-bold uppercase text-[#141414]/70">Loja / Certificado:</label>
                <select
                  value={selectedStoreCnpj}
                  onChange={(e) => {
                    setSelectedStoreCnpj(e.target.value);
                    const found = certificates.find(c => c.cnpj === e.target.value);
                    if (found) onCertificateChange(found);
                  }}
                  className="w-full p-1.5 bg-[#E4E3E0] border border-[#141414] rounded-sm text-xs font-bold font-mono"
                >
                  {certificates.length === 0 && <option value="">Nenhum certificado cadastrado</option>}
                  {certificates.map(cert => (
                    <option key={cert.cnpj} value={cert.cnpj}>
                      {cert.razaoSocial} ({cert.cnpj})
                    </option>
                  ))}
                </select>
              </div>

              {/* Primary Incremental Sync Button */}
              <div className="lg:col-span-5 flex gap-2">
                <button
                  onClick={() => handleSyncIncremental()}
                  disabled={isSyncingSefaz || certificates.length === 0}
                  className="flex-1 py-2 px-3 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-bold text-xs uppercase tracking-wider rounded-sm transition flex items-center justify-center space-x-1.5 border border-[#141414] disabled:opacity-50 shadow-sm"
                  title="Consulta apenas novos documentos e alterações fiscais (CC-e, cancelamentos) a partir do último NSU salvo"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSefaz ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSefaz ? 'Sincronizando...' : 'Sincronizar Novos / Mudanças'}</span>
                </button>

                <button
                  onClick={() => handleSyncFullPages()}
                  disabled={isSyncingSefaz || certificates.length === 0}
                  className="py-2 px-2.5 bg-[#E4E3E0] hover:bg-[#d8d6d2] text-[#141414] font-bold text-xs uppercase tracking-wider rounded-sm transition flex items-center justify-center space-x-1 border border-[#141414] disabled:opacity-50"
                  title="Executa varredura completa de todos os lotes desde o NSU 0 até o total existente"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Puxada Completa</span>
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="lg:col-span-3 flex gap-1.5">
                {certificates.length > 1 && (
                  <button
                    onClick={handleSyncAllStores}
                    disabled={isSyncingAll}
                    className="flex-1 py-2 px-2 bg-[#E4E3E0] hover:bg-[#d8d6d2] text-[#141414] font-bold text-[11px] uppercase tracking-wider rounded-sm transition flex items-center justify-center space-x-1 border border-[#141414] disabled:opacity-50"
                    title="Consultar todas as lojas em lote na SEFAZ"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Todas Lojas</span>
                  </button>
                )}

                <button
                  onClick={handleResetNSU}
                  disabled={isSyncingSefaz || certificates.length === 0}
                  className="py-2 px-2 bg-[#E4E3E0] hover:bg-amber-100 text-[#141414] font-bold text-[11px] uppercase rounded-sm border border-[#141414]"
                  title="Resetar ponteiro de NSU para 0 caso queira recomeçar a busca"
                >
                  Reset NSU
                </button>
              </div>
            </div>

            {/* Direct PDV Import & Chave Query Action Bar */}
            <div className="pt-2 border-t border-[#141414]/15 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-bold text-[11px] uppercase rounded-sm flex items-center space-x-1.5 border border-[#141414] shadow-xs"
                  title="Importar arquivos .xml ou pacote .zip das notas de faturamento/venda emitidas pelo PDV/ERP"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Importar XMLs / ZIP do PDV (Vendas)</span>
                </button>

                <button
                  onClick={() => setIsChaveModalOpen(true)}
                  className="px-3 py-1.5 bg-[#E4E3E0] hover:bg-[#d8d6d2] text-[#141414] font-bold text-[11px] uppercase rounded-sm flex items-center space-x-1.5 border border-[#141414]"
                  title="Consultar qualquer NF-e específica autorizada na SEFAZ através da Chave de 44 dígitos"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Consultar por Chave (44 Dígitos)</span>
                </button>
              </div>

              <button
                onClick={() => setShowFaturamentoInfo(!showFaturamentoInfo)}
                className="text-[11px] font-bold text-[#141414]/80 hover:text-[#141414] flex items-center space-x-1 hover:underline"
              >
                <Info className="w-3.5 h-3.5 text-[#141414]" />
                <span>Por que faturamentos de vendas não vêm no DFe da SEFAZ?</span>
                {showFaturamentoInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Informational Box about DFe (Compras) vs PDV (Faturamento/Vendas) */}
            {showFaturamentoInfo && (
              <div className="p-3 bg-[#E4E3E0] border border-[#141414] rounded-sm text-xs space-y-2">
                <div className="flex items-center space-x-1.5 font-bold uppercase text-[#141414] text-[11px]">
                  <HelpCircle className="w-4 h-4 text-[#141414]" />
                  <span>Entenda o funcionamento legal da SEFAZ: Compras (Entradas) vs Faturamento (Vendas)</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-sans">
                  <div className="p-2.5 bg-[#F0EFED] border border-[#141414]/20 rounded-xs space-y-1">
                    <span className="font-bold text-[#141414] font-mono uppercase text-[10px] block">
                      🚚 1. Compras de Fornecedores (Entradas):
                    </span>
                    <p className="text-[#141414]/80 leading-relaxed">
                      Consultadas <strong>100% no automático</strong> pelo WebService DFe Nacional da SEFAZ. O Ambiente Nacional distribui todas as notas fiscais emitidas por terceiros onde a sua loja é a <strong>destinatária/compradora</strong>.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#F0EFED] border border-[#141414]/20 rounded-xs space-y-1">
                    <span className="font-bold text-[#141414] font-mono uppercase text-[10px] block">
                      🛍️ 2. Faturamento Diário / Vendas da Loja (Saídas):
                    </span>
                    <p className="text-[#141414]/80 leading-relaxed">
                      Notas de NFC-e (modelo 65) e NF-e (modelo 55) emitidas pela sua própria loja ficam gravadas no seu <strong>software de PDV / ERP</strong>. A SEFAZ não distribui notas no DFe para quem é o próprio emitente. Carregue-as clicando em <strong>"Importar XMLs / ZIP do PDV"</strong> ou via <strong>"Consultar por Chave"</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sync Progress Live Indicator */}
            {syncProgress && syncProgress.isActive && (
              <div className="p-3 bg-[#141414] text-[#E4E3E0] rounded-sm space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-green-400" />
                    <span className="uppercase">
                      {syncProgress.mode === 'INCREMENTAL' ? 'Sincronização Incremental em Andamento' : 'Puxada Geral de Todos os NSUs em Andamento'}
                    </span>
                  </div>
                  <span className="font-mono text-[11px]">Página {syncProgress.currentPage}</span>
                </div>

                <div className="text-[11px] text-[#E4E3E0]/80 font-sans">
                  {syncProgress.statusText}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#E4E3E0]/20 text-[10px] font-mono">
                  <div className="bg-[#2a2a2a] p-1.5 rounded-xs">
                    <span className="block text-[#E4E3E0]/60">NSU Atual:</span>
                    <span className="font-bold text-xs">{syncProgress.ultNSU}</span>
                  </div>
                  <div className="bg-[#2a2a2a] p-1.5 rounded-xs">
                    <span className="block text-[#E4E3E0]/60">Novas Notas:</span>
                    <span className="font-bold text-xs text-green-400">+{syncProgress.newInvoicesCount}</span>
                  </div>
                  <div className="bg-[#2a2a2a] p-1.5 rounded-xs">
                    <span className="block text-[#E4E3E0]/60">Cartas de Correção (CC-e):</span>
                    <span className="font-bold text-xs text-amber-300">{syncProgress.cceCount}</span>
                  </div>
                  <div className="bg-[#2a2a2a] p-1.5 rounded-xs">
                    <span className="block text-[#E4E3E0]/60">Cancelamentos:</span>
                    <span className="font-bold text-xs text-red-400">{syncProgress.cancelCount}</span>
                  </div>
                </div>
              </div>
            )}

            {lastSefazResult && (
              <div className="p-2 bg-[#E4E3E0] rounded-sm border border-[#141414] text-[11px] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong>Status SEFAZ:</strong> cStat {lastSefazResult.cStat} - {lastSefazResult.xMotivo}
                </div>
                <div className="flex items-center space-x-3 text-[10px]">
                  <span>ultNSU: <strong>{lastSefazResult.ultNSU}</strong></span>
                  <span>maxNSU: <strong>{lastSefazResult.maxNSU}</strong></span>
                  <span>Docs: <strong>{lastSefazResult.totalDocs}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* XML Search & Filter Bar */}
          <div className="space-y-2">
            <div className="bg-[#F0EFED] p-3 rounded-sm border border-[#141414] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#141414]/60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const clean = searchQuery.replace(/\D/g, '');
                      if (clean.length === 44) {
                        handleConsultarChave(clean);
                      }
                    }
                  }}
                  placeholder="Buscar por Chave de Acesso (44 dígitos), CNPJ, Razão Social, Número da Nota..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#E4E3E0] border border-[#141414] rounded-sm text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#141414]/70">Operação:</span>
                  <select
                    value={tipoOperacaoFilter}
                    onChange={(e) => setTipoOperacaoFilter(e.target.value as any)}
                    className="bg-[#E4E3E0] border border-[#141414] rounded-sm px-2 py-1 font-bold text-xs"
                  >
                    <option value="TODAS">Todas ({invoices.length})</option>
                    <option value="ENTRADA">Entradas ({invoices.filter(i => i.tipoOperacao === 'ENTRADA').length})</option>
                    <option value="SAIDA">Saídas ({invoices.filter(i => i.tipoOperacao === 'SAIDA').length})</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#141414]/70">Status Fiscal:</span>
                  <select
                    value={statusNotaFilter}
                    onChange={(e) => setStatusNotaFilter(e.target.value as any)}
                    className="bg-[#E4E3E0] border border-[#141414] rounded-sm px-2 py-1 font-bold text-xs"
                  >
                    <option value="TODAS">Todos ({invoices.length})</option>
                    <option value="AUTORIZADA">Autorizadas ({invoices.filter(i => i.statusNota !== 'CANCELADA' && !i.cancelada).length})</option>
                    <option value="CCE">Com CC-e ({invoices.filter(i => i.statusNota === 'CCE' || i.cartaCorrecao).length})</option>
                    <option value="CANCELADA">Canceladas ({invoices.filter(i => i.statusNota === 'CANCELADA' || i.cancelada).length})</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Direct Consultation Banner for 44-digit Key */}
            {searchQuery.replace(/\D/g, '').length === 44 && (
              <div className="p-3 bg-[#141414] text-[#E4E3E0] rounded-sm border border-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-500 text-black px-1.5 py-0.5 rounded-xs text-[10px] font-bold">
                      CHAVE DE 44 DÍGITOS DETECTADA
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-300 break-all">
                      {searchQuery.replace(/\D/g, '')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#E4E3E0]/80 font-sans">
                    {invoices.some(i => i.chaveAcesso === searchQuery.replace(/\D/g, ''))
                      ? "Esta nota fiscal já está salva no banco de dados local."
                      : "Esta nota ainda não está no banco local. Clique para consultar e baixar o XML oficial da SEFAZ:"}
                  </p>
                </div>

                <button
                  onClick={() => handleConsultarChave(searchQuery.replace(/\D/g, ''))}
                  disabled={isConsultingChave}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase rounded-sm flex items-center justify-center space-x-2 shrink-0 shadow-sm disabled:opacity-50"
                >
                  {isConsultingChave ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                      <span>Consultando SEFAZ...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5 text-black" />
                      <span>Consultar & Baixar da SEFAZ</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Invoices & XMLs Table */}
          <div className="bg-[#F0EFED] rounded-sm border border-[#141414] overflow-hidden">
            {filteredInvoices.length === 0 ? (
              <div className="p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto font-mono">
                <div className="w-12 h-12 mx-auto rounded-sm bg-[#141414] flex items-center justify-center text-[#E4E3E0]">
                  <FileCode className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold uppercase text-[#141414]">
                    {searchQuery.replace(/\D/g, '').length === 44
                      ? 'Nota Fiscal não encontrada no banco local'
                      : 'Nenhum XML de NF-e/NFC-e carregado no banco'}
                  </h4>
                  <p className="text-[11px] text-[#141414]/70 font-sans leading-relaxed">
                    {searchQuery.replace(/\D/g, '').length === 44
                      ? `A chave ${searchQuery.replace(/\D/g, '')} não está salva no seu banco de dados local. Você pode buscá-la diretamente nos servidores da SEFAZ.`
                      : 'Você pode consultar notas de compras na SEFAZ Nacional ou importar o faturamento diário (vendas emitidas pelo caixa/PDV).'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {searchQuery.replace(/\D/g, '').length === 44 ? (
                    <button
                      onClick={() => handleConsultarChave(searchQuery.replace(/\D/g, ''))}
                      disabled={isConsultingChave}
                      className="px-4 py-2 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-bold text-xs uppercase rounded-sm flex items-center space-x-1.5 border border-[#141414] shadow-xs"
                    >
                      {isConsultingChave ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Consultando SEFAZ...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          <span>Consultar Chave na SEFAZ Agora</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="px-3.5 py-2 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-bold text-xs uppercase rounded-sm flex items-center space-x-1.5 border border-[#141414] shadow-xs"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Importar XMLs / ZIP do PDV (Vendas)</span>
                      </button>

                      <button
                        onClick={() => handleSyncIncremental()}
                        disabled={isSyncingSefaz || certificates.length === 0}
                        className="px-3.5 py-2 bg-[#E4E3E0] hover:bg-[#d8d6d2] text-[#141414] font-bold text-xs uppercase rounded-sm flex items-center space-x-1.5 border border-[#141414]"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSefaz ? 'animate-spin' : ''}`} />
                        <span>Sincronizar Compras na SEFAZ</span>
                      </button>

                      <button
                        onClick={() => setIsChaveModalOpen(true)}
                        className="px-3.5 py-2 bg-[#E4E3E0] hover:bg-[#d8d6d2] text-[#141414] font-bold text-xs uppercase rounded-sm flex items-center space-x-1.5 border border-[#141414]"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Consultar por Chave</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Status / Operação</th>
                      <th className="py-2.5 px-3">Número / Série</th>
                      <th className="py-2.5 px-3">Data Emissão</th>
                      <th className="py-2.5 px-3">Emitente / CNPJ</th>
                      <th className="py-2.5 px-3">Destinatário</th>
                      <th className="py-2.5 px-3 text-right">Valor Total</th>
                      <th className="py-2.5 px-3 text-center">Itens</th>
                      <th className="py-2.5 px-3 text-center">Chave de Acesso</th>
                      <th className="py-2.5 px-3 text-right">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141414]/15">
                    {filteredInvoices.map((inv) => {
                      const isCancelada = inv.statusNota === 'CANCELADA' || inv.cancelada;
                      const hasCce = inv.statusNota === 'CCE' || Boolean(inv.cartaCorrecao);

                      return (
                        <tr key={inv.chaveAcesso} className={`hover:bg-[#E4E3E0]/70 transition ${isCancelada ? 'bg-red-50/50' : ''}`}>
                          
                          {/* Status & Tipo Operação */}
                          <td className="py-2 px-3">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold border border-[#141414] ${
                                inv.tipoOperacao === 'ENTRADA'
                                  ? 'bg-[#141414] text-[#E4E3E0]'
                                  : 'bg-[#E4E3E0] text-[#141414]'
                              }`}>
                                {inv.tipoOperacao || 'NF-e'}
                              </span>

                              {isCancelada && (
                                <span className="px-1.5 py-0.2 bg-red-700 text-white rounded-xs text-[8px] font-bold uppercase tracking-wider" title="Nota cancelada na SEFAZ">
                                  CANCELADA
                                </span>
                              )}

                              {hasCce && !isCancelada && (
                                <button
                                  onClick={() => setCceModalInvoice(inv)}
                                  className="px-1.5 py-0.2 bg-amber-200 hover:bg-amber-300 text-amber-900 border border-amber-800/40 rounded-xs text-[8px] font-bold uppercase tracking-wider flex items-center space-x-0.5"
                                  title="Clique para ver os dados da Carta de Correção Eletrônica"
                                >
                                  <span>CC-e nº {inv.cartaCorrecao?.nSeqEvento || 1}</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Número / Série */}
                          <td className="py-2 px-3 font-bold font-mono text-[#141414]">
                            <span className={isCancelada ? 'line-through text-red-900' : ''}>NF-e {inv.numero}</span>
                            <span className="text-[10px] text-[#141414]/60 font-normal block">Série {inv.serie}</span>
                          </td>

                          {/* Data Emissão */}
                          <td className="py-2 px-3 text-[11px] text-[#141414]/80 whitespace-nowrap">
                            {new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}
                          </td>

                          {/* Emitente */}
                          <td className="py-2 px-3">
                            <div className="font-bold text-[#141414] truncate max-w-[180px]" title={inv.emitente.xNome}>
                              {inv.emitente.xNome}
                            </div>
                            <div className="text-[10px] text-[#141414]/60 font-mono">
                              {inv.emitente.cnpj} {inv.emitente.uf ? `(${inv.emitente.uf})` : ''}
                            </div>
                          </td>

                          {/* Destinatário */}
                          <td className="py-2 px-3">
                            <div className="font-bold text-[#141414] truncate max-w-[160px]" title={inv.destinatario.xNome}>
                              {inv.destinatario.xNome}
                            </div>
                            <div className="text-[10px] text-[#141414]/60 font-mono">
                              {inv.destinatario.cnpj}
                            </div>
                          </td>

                          {/* Valor Total */}
                          <td className="py-2 px-3 text-right font-bold font-mono text-[#141414]">
                            R$ {inv.totais.vNF.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Quantidade Itens */}
                          <td className="py-2 px-3 text-center font-bold text-[#141414]">
                            {inv.itens.length}
                          </td>

                          {/* Chave de Acesso com Copiar Rápido */}
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => handleCopyChave(inv.chaveAcesso)}
                              className="px-2 py-0.5 bg-[#E4E3E0] hover:bg-[#d8d6d2] border border-[#141414] rounded-xs text-[10px] font-mono flex items-center space-x-1 mx-auto"
                              title="Clique para copiar a chave de acesso de 44 dígitos"
                            >
                              <span>{inv.chaveAcesso.slice(0, 6)}...{inv.chaveAcesso.slice(-4)}</span>
                              {copiedKey === inv.chaveAcesso ? <Check className="w-3 h-3 text-[#141414]" /> : <Copy className="w-3 h-3 text-[#141414]/70" />}
                            </button>
                          </td>

                          {/* Ações Rápidas: Copiar XML, Baixar XML, Ver Detalhes */}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              
                              {/* CC-e Button if present */}
                              {hasCce && (
                                <button
                                  onClick={() => setCceModalInvoice(inv)}
                                  className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xs border border-amber-800/50 transition"
                                  title="Visualizar Carta de Correção"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Copiar XML Button */}
                              <button
                                onClick={() => handleCopyXml(inv)}
                                className="p-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-xs border border-[#141414] transition"
                                title="Copiar XML puro para a área de transferência"
                              >
                                {copiedXmlChave === inv.chaveAcesso ? (
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Baixar .XML Button */}
                              <button
                                onClick={() => handleDownloadSingleXml(inv)}
                                className="p-1.5 bg-[#E4E3E0] hover:bg-[#d8d6d2] text-[#141414] rounded-xs border border-[#141414] transition"
                                title="Baixar arquivo .xml individual"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* Ver XML Bruto */}
                              <button
                                onClick={() => setRawXmlModal({
                                  chave: inv.chaveAcesso,
                                  numero: inv.numero,
                                  xml: inv.xmlOriginal || inv.xmlRaw || SefazXmlParser.generateXml(inv)
                                })}
                                className="p-1.5 bg-[#E4E3E0] hover:bg-[#d8d6d2] text-[#141414] rounded-xs border border-[#141414] transition"
                                title="Visualizar código XML formatado"
                              >
                                <FileCode className="w-3.5 h-3.5" />
                              </button>

                              {/* Ver Detalhes da Nota */}
                              <button
                                onClick={() => setSelectedInvoiceModal(inv)}
                                className="p-1.5 bg-[#E4E3E0] hover:bg-[#d8d6d2] text-[#141414] rounded-xs border border-[#141414] transition"
                                title="Visualizar dados e produtos da nota fiscal"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Excluir Nota */}
                              <button
                                onClick={() => handleDeleteInvoice(inv.chaveAcesso)}
                                className="p-1.5 bg-[#E4E3E0] hover:bg-red-200 text-[#141414] rounded-xs border border-[#141414] transition"
                                title="Excluir nota do banco"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: EVENTOS FISCAIS & ALTERAÇÕES (CC-E / CANCELAMENTOS) */}
      {/* ========================================================================= */}
      {(activeSubTab as any) === 'eventos' && (
        <div className="space-y-4">
          <div className="bg-[#F0EFED] p-3.5 rounded-sm border border-[#141414] space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#141414] pb-2">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-[#141414]" />
                <h3 className="font-bold text-[#141414] text-xs uppercase">
                  Histórico de Alterações & Eventos Fiscais SEFAZ (CC-e e Cancelamentos)
                </h3>
              </div>

              <div className="flex items-center space-x-2 text-[11px]">
                <span className="px-2 py-0.5 bg-[#E4E3E0] border border-[#141414] rounded-xs font-mono text-[10px]">
                  Total de Eventos Registrados: <strong>{fiscalEventsList.length}</strong>
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#141414]/70 font-sans">
              Cada evento processado pela SEFAZ (como Cartas de Correção Eletrônica - CC-e ou Cancelamentos de NF-e) é registrado aqui e aplicado diretamente sobre a nota original no banco de dados.
            </p>
          </div>

          {/* Events Table */}
          <div className="bg-[#F0EFED] rounded-sm border border-[#141414] overflow-hidden">
            {fiscalEventsList.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Receipt className="w-10 h-10 mx-auto text-[#141414]/40" />
                <h4 className="text-xs font-bold uppercase text-[#141414]">
                  Nenhum evento fiscal registrado ainda
                </h4>
                <p className="text-[11px] text-[#141414]/70 max-w-md mx-auto font-sans">
                  Quando houver cartas de correção ou notas canceladas para os seus CNPJs, elas serão detectadas automaticamente na sincronização incremental e listadas aqui.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Tipo do Evento</th>
                      <th className="py-2.5 px-3">Seq</th>
                      <th className="py-2.5 px-3">Data / Hora Evento</th>
                      <th className="py-2.5 px-3">Chave da NF-e Vinculada</th>
                      <th className="py-2.5 px-3">Protocolo</th>
                      <th className="py-2.5 px-3">Descrição / Conteúdo da Correção</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141414]/15">
                    {fiscalEventsList.map((evt) => {
                      const isCancel = evt.tpEvento === '110111';
                      const isCce = evt.tpEvento === '110110';
                      const relatedInv = invoices.find(i => i.chaveAcesso === evt.chNFe);

                      return (
                        <tr key={evt.id} className="hover:bg-[#E4E3E0]/70 transition">
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-xs text-[9px] font-bold border ${
                              isCancel 
                                ? 'bg-red-700 text-white border-red-900' 
                                : isCce 
                                ? 'bg-amber-300 text-amber-950 border-amber-800' 
                                : 'bg-[#141414] text-[#E4E3E0] border-[#141414]'
                            }`}>
                              {evt.descEvento || (isCancel ? 'CANCELAMENTO' : isCce ? 'CARTA DE CORREÇÃO' : evt.tpEvento)}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 font-mono font-bold">
                            #{evt.nSeqEvento || 1}
                          </td>

                          <td className="py-2.5 px-3 text-[11px] text-[#141414]/80 whitespace-nowrap font-mono">
                            {evt.dhEvento ? new Date(evt.dhEvento).toLocaleString('pt-BR') : '-'}
                          </td>

                          <td className="py-2.5 px-3 font-mono text-[11px]">
                            <div className="flex items-center space-x-1">
                              <span>{evt.chNFe.slice(0, 10)}...{evt.chNFe.slice(-6)}</span>
                              <button
                                onClick={() => handleCopyChave(evt.chNFe)}
                                className="p-0.5 hover:bg-[#141414]/10 rounded-xs"
                                title="Copiar chave"
                              >
                                {copiedKey === evt.chNFe ? <Check className="w-3 h-3 text-green-700" /> : <Copy className="w-3 h-3 text-[#141414]/70" />}
                              </button>
                            </div>
                            {relatedInv && (
                              <span className="text-[10px] text-[#141414]/60 font-sans block">
                                NF-e {relatedInv.numero} ({relatedInv.emitente.xNome})
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#141414]/80">
                            {evt.nProt || '-'}
                          </td>

                          <td className="py-2.5 px-3 text-[11px] max-w-xs truncate" title={evt.xCorrecao || evt.xJust || evt.descEvento}>
                            {evt.xCorrecao ? (
                              <span className="font-sans font-medium text-amber-950 bg-amber-50 px-1 py-0.5 rounded-xs border border-amber-200">
                                {evt.xCorrecao}
                              </span>
                            ) : evt.xJust ? (
                              <span className="font-sans text-red-900">{evt.xJust}</span>
                            ) : (
                              <span className="text-[#141414]/60">{evt.descEvento}</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            {relatedInv && (
                              <button
                                onClick={() => setSelectedInvoiceModal(relatedInv)}
                                className="px-2 py-1 bg-[#141414] text-[#E4E3E0] rounded-xs text-[10px] font-bold uppercase hover:bg-[#2a2a2a] transition"
                              >
                                Ver Nota
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: MULTI-CERTIFICADOS DIGITAIS A1 */}
      {/* ========================================================================= */}
      {activeSubTab === 'certificados' && (
        <div className="space-y-4">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left: Registered Certificates List */}
            <div className="lg:col-span-2 bg-[#F0EFED] p-3.5 rounded-sm border border-[#141414] space-y-3">
              <div className="flex items-center justify-between border-b border-[#141414] pb-2">
                <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#141414]" />
                  <span>Lojas & Certificados Digitais A1 Cadastrados ({certificates.length})</span>
                </h3>

                {certificates.length > 1 && (
                  <button
                    onClick={handleSyncAllStores}
                    disabled={isSyncingAll}
                    className="px-2.5 py-1 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] text-[10px] font-bold uppercase rounded-xs transition flex items-center space-x-1"
                  >
                    <Layers className="w-3 h-3" />
                    <span>{isSyncingAll ? 'Sincronizando Todas...' : 'Sincronizar Todas as Lojas'}</span>
                  </button>
                )}
              </div>

              {certificates.length === 0 ? (
                <div className="p-8 text-center space-y-2 bg-[#E4E3E0] rounded-sm border border-[#141414]">
                  <KeyRound className="w-8 h-8 mx-auto text-[#141414]/50" />
                  <div className="font-bold uppercase text-xs text-[#141414]">Nenhum Certificado Cadastrado</div>
                  <p className="text-[11px] text-[#141414]/70 font-sans max-w-sm mx-auto">
                    Faça o upload do arquivo .pfx de cada loja no formulário ao lado para habilitar a consulta direta de XMLs na SEFAZ.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {certificates.map((cert) => {
                    const isSelected = activeCertificate?.cnpj === cert.cnpj;
                    return (
                      <div 
                        key={cert.cnpj}
                        className={`p-3 rounded-sm border transition ${
                          isSelected ? 'bg-[#E4E3E0] border-[#141414] ring-1 ring-[#141414]' : 'bg-[#E4E3E0]/60 border-[#141414]/30 hover:border-[#141414]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <Store className="w-3.5 h-3.5 text-[#141414]" />
                              <span className="font-bold text-xs text-[#141414]">{cert.razaoSocial}</span>
                              <span className="px-1.5 py-0.2 bg-[#141414] text-[#E4E3E0] text-[9px] font-bold uppercase rounded-xs">
                                {cert.uf} - {cert.ambiente}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#141414]/70 font-mono">
                              CNPJ: <strong>{cert.cnpj}</strong> | Série: {cert.numeroSerie}
                            </div>
                            <div className="text-[10px] text-[#141414]/70">
                              Validade: <strong>{new Date(cert.validadeFim).toLocaleDateString('pt-BR')}</strong> ({cert.diasRestantes} dias restantes)
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 self-end sm:self-center">
                            <button
                              onClick={() => {
                                onCertificateChange(cert);
                                setSelectedStoreCnpj(cert.cnpj);
                                handleSyncIncremental();
                              }}
                              disabled={isSyncingSefaz}
                              className="px-2.5 py-1 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] text-[10px] font-bold uppercase rounded-xs transition flex items-center space-x-1"
                              title="Consultar SEFAZ para este CNPJ"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Sincronizar</span>
                            </button>

                            <button
                              onClick={() => handleRemoveCertificate(cert.cnpj)}
                              className="p-1 bg-[#E4E3E0] hover:bg-red-200 text-red-900 border border-[#141414]/20 rounded-xs transition"
                              title="Remover este certificado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Upload New Certificate Form */}
            <div className="bg-[#F0EFED] p-3.5 rounded-sm border border-[#141414] space-y-3">
              <div className="flex items-center justify-between border-b border-[#141414] pb-2">
                <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-[#141414]" />
                  <span>Adicionar Novo Certificado A1</span>
                </h3>
              </div>

              <form onSubmit={handleUploadCert} className="space-y-2.5 text-xs">
                
                {/* File Input */}
                <div className="space-y-0.5">
                  <label className="font-bold uppercase text-[10px] text-[#141414]/70">
                    Arquivo .pfx / .p12 da Loja:
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCertFileChange}
                    accept=".pfx,.p12"
                    className="w-full p-1.5 bg-[#E4E3E0] border border-[#141414] rounded-sm text-xs font-mono file:mr-2 file:py-1 file:px-2 file:rounded-xs file:border-0 file:text-xs file:font-bold file:bg-[#141414] file:text-[#E4E3E0] cursor-pointer"
                  />
                </div>

                {/* Password */}
                <div className="space-y-0.5">
                  <label className="font-bold uppercase text-[10px] text-[#141414]/70">
                    Senha do Certificado:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={certPassword}
                      onChange={(e) => setCertPassword(e.target.value)}
                      placeholder="Senha do arquivo A1..."
                      className="w-full p-2 pr-9 bg-[#E4E3E0] border border-[#141414] rounded-sm text-xs font-bold text-[#141414] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#141414]/60 hover:text-[#141414]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* UF & Ambiente */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="font-bold uppercase text-[10px] text-[#141414]/70">UF da Loja:</label>
                    <select
                      value={certUf}
                      onChange={(e) => setCertUf(e.target.value)}
                      className="w-full p-1.5 bg-[#E4E3E0] border border-[#141414] rounded-sm font-bold text-xs"
                    >
                      {['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'GO', 'ES', 'MT', 'MS', 'DF', 'AM', 'PA', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI', 'TO', 'RO', 'AC', 'AP', 'RR'].map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-0.5">
                    <label className="font-bold uppercase text-[10px] text-[#141414]/70">Ambiente:</label>
                    <select
                      value={certAmbiente}
                      onChange={(e) => setCertAmbiente(e.target.value as any)}
                      className="w-full p-1.5 bg-[#E4E3E0] border border-[#141414] rounded-sm font-bold text-xs"
                    >
                      <option value="PRODUCAO">Produção (Oficial)</option>
                      <option value="HOMOLOGACAO">Homologação (Testes)</option>
                    </select>
                  </div>
                </div>

                <div className="p-2 bg-[#E4E3E0] rounded-sm border border-[#141414] text-[10px] text-[#141414]/80">
                  🔒 <strong>Multi-Certificados:</strong> Cada certificado cadastrado é armazenado de forma independente para permitir consultas simultâneas na SEFAZ.
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-bold text-xs uppercase tracking-wider rounded-sm transition flex items-center justify-center space-x-2 border border-[#141414] disabled:opacity-50"
                >
                  <ShieldCheck className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Validando Certificado...' : 'Salvar Certificado da Loja'}</span>
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: STATUS WEBSERVICE SEFAZ */}
      {/* ========================================================================= */}
      {activeSubTab === 'status_sefaz' && (
        <div className="bg-[#F0EFED] p-4 rounded-sm border border-[#141414] space-y-4">
          <div className="flex items-center justify-between border-b border-[#141414] pb-2">
            <h3 className="font-bold text-[#141414] text-xs uppercase flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#141414]" />
              <span>Status dos WebServices SEFAZ Nacional e Estaduais</span>
            </h3>

            <button
              onClick={checkStatus}
              className="px-3 py-1 bg-[#141414] text-[#E4E3E0] text-xs font-bold uppercase rounded-xs hover:bg-[#2a2a2a] transition flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Testar Status</span>
            </button>
          </div>

          {sefazStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#E4E3E0] border border-[#141414] rounded-sm space-y-1">
                <div className="text-[10px] text-[#141414]/70 uppercase font-bold">Código Retorno SEFAZ:</div>
                <div className="text-sm font-bold text-[#141414]">cStat {sefazStatus.cStat} - {sefazStatus.xMotivo}</div>
                <div className="text-[10px] text-[#141414]/70">Tempo de Resposta: {sefazStatus.tempoRespostaMs}ms</div>
              </div>

              <div className="p-3 bg-[#E4E3E0] border border-[#141414] rounded-sm space-y-1">
                <div className="text-[10px] text-[#141414]/70 uppercase font-bold">WebService Ativo:</div>
                <div className="text-xs font-bold text-[#141414] font-mono break-all">{sefazStatus.webservice}</div>
                <div className="text-[10px] text-[#141414]/70">Ambiente: {certAmbiente} | UF: {certUf}</div>
              </div>

              <div className="p-3 bg-[#E4E3E0] border border-[#141414] rounded-sm space-y-1">
                <div className="text-[10px] text-[#141414]/70 uppercase font-bold">Disponibilidade:</div>
                <div className="text-sm font-bold text-[#141414] flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block"></span>
                  <span>ONLINE / OPERACIONAL</span>
                </div>
                <div className="text-[10px] text-[#141414]/70">Última checagem: {new Date(sefazStatus.dhRecbto).toLocaleTimeString('pt-BR')}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RAW FORMATTED XML VIEWER & COPIER */}
      {/* ========================================================================= */}
      {rawXmlModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#F0EFED] border border-[#141414] rounded-sm max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl font-mono">
            
            {/* Modal Header */}
            <div className="p-3.5 bg-[#141414] text-[#E4E3E0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4" />
                <span className="font-bold text-xs uppercase">Código XML da NF-e {rawXmlModal.numero}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(rawXmlModal.xml);
                    setCopiedXmlChave(rawXmlModal.chave);
                    setTimeout(() => setCopiedXmlChave(null), 3000);
                  }}
                  className="px-2.5 py-1 bg-[#E4E3E0] hover:bg-white text-[#141414] font-bold text-[10px] uppercase rounded-xs transition flex items-center space-x-1"
                >
                  {copiedXmlChave === rawXmlModal.chave ? <Check className="w-3 h-3 text-green-700" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedXmlChave === rawXmlModal.chave ? 'XML Copiado!' : 'Copiar XML'}</span>
                </button>

                <button
                  onClick={() => setRawXmlModal(null)}
                  className="text-[#E4E3E0] hover:text-white text-sm font-bold px-1.5"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* XML Body */}
            <div className="p-3 overflow-y-auto flex-1 bg-[#1e1e1e] text-[#d4d4d4] text-[11px] font-mono leading-relaxed select-all">
              <pre className="whitespace-pre-wrap break-all">{rawXmlModal.xml}</pre>
            </div>

            {/* Modal Footer */}
            <div className="p-2.5 bg-[#E4E3E0] border-t border-[#141414] flex justify-between items-center text-[11px]">
              <span className="text-[#141414]/70">Chave: {rawXmlModal.chave}</span>
              <button
                onClick={() => setRawXmlModal(null)}
                className="px-3 py-1 bg-[#141414] text-[#E4E3E0] font-bold text-xs uppercase rounded-xs"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INVOICE DETAILS & PRODUCTS */}
      {/* ========================================================================= */}
      {selectedInvoiceModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#F0EFED] border border-[#141414] rounded-sm max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl font-mono">
            
            {/* Header */}
            <div className="p-3.5 bg-[#141414] text-[#E4E3E0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4" />
                <span className="font-bold text-xs uppercase">
                  Detalhes da NF-e {selectedInvoiceModal.numero} (Série {selectedInvoiceModal.serie})
                </span>
              </div>
              <button
                onClick={() => setSelectedInvoiceModal(null)}
                className="text-[#E4E3E0] hover:text-white text-sm font-bold px-1.5"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3.5 text-xs">
              
              {/* Top Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Emitente */}
                <div className="p-3 bg-[#E4E3E0] border border-[#141414] rounded-sm space-y-1">
                  <div className="text-[10px] text-[#141414]/70 uppercase font-bold">Emitente / Fornecedor:</div>
                  <div className="font-bold text-sm text-[#141414]">{selectedInvoiceModal.emitente.xNome}</div>
                  <div className="text-[11px] text-[#141414]/80">CNPJ: {selectedInvoiceModal.emitente.cnpj} {selectedInvoiceModal.emitente.ie ? `| IE: ${selectedInvoiceModal.emitente.ie}` : ''}</div>
                  <div className="text-[11px] text-[#141414]/80">{selectedInvoiceModal.emitente.municipio || ''} - {selectedInvoiceModal.emitente.uf}</div>
                </div>

                {/* Destinatário */}
                <div className="p-3 bg-[#E4E3E0] border border-[#141414] rounded-sm space-y-1">
                  <div className="text-[10px] text-[#141414]/70 uppercase font-bold">Destinatário:</div>
                  <div className="font-bold text-sm text-[#141414]">{selectedInvoiceModal.destinatario.xNome}</div>
                  <div className="text-[11px] text-[#141414]/80">CNPJ/CPF: {selectedInvoiceModal.destinatario.cnpj}</div>
                  <div className="text-[11px] text-[#141414]/80">{selectedInvoiceModal.destinatario.uf || ''}</div>
                </div>
              </div>

              {/* Chave de Acesso */}
              <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] rounded-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#141414]/70 uppercase font-bold block">Chave de Acesso:</span>
                  <span className="font-mono text-xs font-bold text-[#141414]">{selectedInvoiceModal.chaveAcesso}</span>
                </div>
                <button
                  onClick={() => handleCopyChave(selectedInvoiceModal.chaveAcesso)}
                  className="px-2 py-1 bg-[#141414] text-[#E4E3E0] text-[10px] uppercase font-bold rounded-xs flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar Chave</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="space-y-1.5">
                <div className="font-bold text-xs uppercase text-[#141414]">
                  Itens / Produtos da Nota ({selectedInvoiceModal.itens.length}):
                </div>
                <div className="border border-[#141414] rounded-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] uppercase">
                        <th className="py-2 px-2.5">Item</th>
                        <th className="py-2 px-2.5">Código / EAN</th>
                        <th className="py-2.5 px-2.5">Descrição do Produto</th>
                        <th className="py-2 px-2.5">NCM / CFOP</th>
                        <th className="py-2 px-2.5 text-right">Qtd</th>
                        <th className="py-2 px-2.5 text-right">Vlr Unit</th>
                        <th className="py-2 px-2.5 text-right">Vlr Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]/15 bg-[#E4E3E0]/40">
                      {selectedInvoiceModal.itens.map((it) => (
                        <tr key={it.nItem} className="hover:bg-[#E4E3E0]">
                          <td className="py-1.5 px-2.5 font-bold">{it.nItem}</td>
                          <td className="py-1.5 px-2.5 font-mono text-[10px]">{it.cProd} {it.cEAN ? `| EAN: ${it.cEAN}` : ''}</td>
                          <td className="py-1.5 px-2.5 font-bold text-[#141414]">{it.xProd}</td>
                          <td className="py-1.5 px-2.5 font-mono text-[10px]">{it.NCM} / {it.CFOP}</td>
                          <td className="py-1.5 px-2.5 text-right font-bold">{it.qCom} {it.uCom}</td>
                          <td className="py-1.5 px-2.5 text-right font-mono">R$ {it.vUnCom.toFixed(2)}</td>
                          <td className="py-1.5 px-2.5 text-right font-mono font-bold">R$ {it.vProd.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Duplicatas / Prazos */}
              {selectedInvoiceModal.duplicatas && selectedInvoiceModal.duplicatas.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-bold text-xs uppercase text-[#141414]">
                    Faturas / Duplicatas de Pagamento:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedInvoiceModal.duplicatas.map((dup, idx) => (
                      <div key={idx} className="p-2 bg-[#E4E3E0] border border-[#141414] rounded-sm text-xs space-y-0.5">
                        <div className="text-[10px] text-[#141414]/70 font-bold uppercase">Parcela {dup.nDup}:</div>
                        <div className="font-bold text-sm font-mono text-[#141414]">R$ {dup.vDup.toFixed(2)}</div>
                        <div className="text-[10px] text-[#141414]/80">Vence: {dup.dVenc ? new Date(dup.dVenc).toLocaleDateString('pt-BR') : 'À Vista'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-3 bg-[#E4E3E0] border-t border-[#141414] flex justify-between items-center">
              <div className="text-xs font-bold text-[#141414]">
                Valor Total da Nota: R$ {selectedInvoiceModal.totais.vNF.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyXml(selectedInvoiceModal)}
                  className="px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-bold text-xs uppercase rounded-sm flex items-center space-x-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar XML</span>
                </button>
                <button
                  onClick={() => handleDownloadSingleXml(selectedInvoiceModal)}
                  className="px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-bold text-xs uppercase rounded-sm flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar .XML</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CARTA DE CORREÇÃO (CC-E) DETAILS */}
      {/* ========================================================================= */}
      {cceModalInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#F0EFED] border border-[#141414] rounded-sm max-w-2xl w-full flex flex-col shadow-2xl font-mono">
            
            {/* Header */}
            <div className="p-3.5 bg-[#141414] text-[#E4E3E0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-300" />
                <span className="font-bold text-xs uppercase">
                  Carta de Correção Eletrônica (CC-e) - NF-e {cceModalInvoice.numero}
                </span>
              </div>
              <button
                onClick={() => setCceModalInvoice(null)}
                className="text-[#E4E3E0] hover:text-white text-sm font-bold px-1.5"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-800/40 rounded-sm space-y-1">
                <div className="text-[10px] text-amber-900 font-bold uppercase">
                  Texto da Correção Registrado na SEFAZ:
                </div>
                <p className="text-xs font-sans text-[#141414] font-medium whitespace-pre-wrap leading-relaxed">
                  {cceModalInvoice.cartaCorrecao?.xCorrecao || 'Correção fiscal registrada na SEFAZ para esta nota fiscal.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] rounded-sm space-y-0.5">
                  <span className="text-[10px] text-[#141414]/70 font-bold uppercase block">Sequencial do Evento:</span>
                  <span className="font-bold font-mono">#{cceModalInvoice.cartaCorrecao?.nSeqEvento || 1}</span>
                </div>
                <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] rounded-sm space-y-0.5">
                  <span className="text-[10px] text-[#141414]/70 font-bold uppercase block">Data / Hora do Registro:</span>
                  <span className="font-bold font-mono">
                    {cceModalInvoice.cartaCorrecao?.dhEvento ? new Date(cceModalInvoice.cartaCorrecao.dhEvento).toLocaleString('pt-BR') : '-'}
                  </span>
                </div>
              </div>

              {cceModalInvoice.cartaCorrecao?.nProt && (
                <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] rounded-sm text-[11px] space-y-0.5">
                  <span className="text-[10px] text-[#141414]/70 font-bold uppercase block">Protocolo de Homologação SEFAZ:</span>
                  <span className="font-mono font-bold">{cceModalInvoice.cartaCorrecao.nProt}</span>
                </div>
              )}

              <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] rounded-sm text-[11px] space-y-0.5">
                <span className="text-[10px] text-[#141414]/70 font-bold uppercase block">Chave da Nota Vinculada:</span>
                <span className="font-mono text-xs">{cceModalInvoice.chaveAcesso}</span>
              </div>

              <div className="text-[10px] text-[#141414]/70 italic">
                * Conforme legislação da SEFAZ, a Carta de Correção não permite alterar valores tributários, datas de emissão ou dados cadastrais que alterem o remetente/destinatário.
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#E4E3E0] border-t border-[#141414] flex justify-end space-x-2">
              <button
                onClick={() => {
                  setSelectedInvoiceModal(cceModalInvoice);
                  setCceModalInvoice(null);
                }}
                className="px-3 py-1.5 bg-[#E4E3E0] hover:bg-[#d8d6d2] text-[#141414] font-bold text-xs uppercase rounded-sm border border-[#141414]"
              >
                Ver Nota Fiscal
              </button>
              <button
                onClick={() => setCceModalInvoice(null)}
                className="px-3 py-1.5 bg-[#141414] text-[#E4E3E0] font-bold text-xs uppercase rounded-sm"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: XML UPLOADER & ZIP IMPORTER (PDV / SALES / SUPPLIERS) */}
      {/* ========================================================================= */}
      <XmlUploaderModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        invoices={invoices}
        onInvoicesChange={onInvoicesChange}
        pdvProducts={[]}
        mkpConfig={{
          metaMkpPadrao: 2.2,
          aliquotaImpostoPadrao: 0.18,
          comissaoPadrao: 0.05,
          despesasFixasPadrao: 0.10,
          margemLucroAlvo: 0.15
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL: CONSULTAR NF-E POR CHAVE DE ACESSO (44 DÍGITOS) */}
      {/* ========================================================================= */}
      {isChaveModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#F0EFED] border border-[#141414] rounded-sm max-w-lg w-full flex flex-col shadow-2xl font-mono">
            
            {/* Header */}
            <div className="p-3.5 bg-[#141414] text-[#E4E3E0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-[#E4E3E0]" />
                <span className="font-bold text-xs uppercase">
                  Consulta de NF-e por Chave de Acesso (SEFAZ)
                </span>
              </div>
              <button
                onClick={() => {
                  setIsChaveModalOpen(false);
                  setChaveInput('');
                }}
                className="text-[#E4E3E0] hover:text-white text-sm font-bold px-1.5"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3.5 text-xs">
              <p className="text-[11px] text-[#141414]/80 font-sans">
                Informe a chave de 44 dígitos da Nota Fiscal Eletrônica. O sistema enviará uma requisição SOAP oficial (<code className="font-mono bg-[#E4E3E0] px-1 py-0.5 border border-[#141414]/30 text-[10px]">consChNFe</code>) autenticada com o seu certificado digital A1.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-[#141414]/70">
                  Chave de Acesso da NF-e (44 dígitos):
                </label>
                <input
                  type="text"
                  maxLength={44}
                  value={chaveInput}
                  onChange={(e) => setChaveInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="35240812345678000190550010000012341234567890"
                  className="w-full p-2.5 bg-[#E4E3E0] border border-[#141414] rounded-sm font-mono text-xs font-bold tracking-wider"
                  autoFocus
                />
                <div className="flex justify-between text-[10px] text-[#141414]/60">
                  <span>Apenas números</span>
                  <span className={chaveInput.length === 44 ? 'text-emerald-700 font-bold' : 'text-[#141414]/60'}>
                    {chaveInput.length}/44 dígitos
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] rounded-xs text-[10px] text-[#141414]/80">
                <strong>Certificado em uso:</strong> {activeCertificate?.razaoSocial || (certificates[0]?.razaoSocial ?? 'Nenhum')} ({activeCertificate?.cnpj || (certificates[0]?.cnpj ?? '-')})
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#E4E3E0] border-t border-[#141414] flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsChaveModalOpen(false);
                  setChaveInput('');
                }}
                disabled={isConsultingChave}
                className="px-3 py-1.5 bg-[#E4E3E0] hover:bg-[#d8d6d2] text-[#141414] font-bold text-xs uppercase rounded-sm border border-[#141414]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConsultarChave(chaveInput)}
                disabled={isConsultingChave || chaveInput.length !== 44}
                className="px-4 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-bold text-xs uppercase rounded-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isConsultingChave ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Consultando SEFAZ...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Consultar & Baixar XML</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
