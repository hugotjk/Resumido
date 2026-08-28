import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Trash2, 
  AlertCircle, 
  FileCode,
  Building,
  Calendar,
  Archive,
  Check
} from 'lucide-react';
import { SefazInvoice, PdvProduct, MkpConfig } from '../../types';
import { SefazSyncService } from '../../services/sefazSyncService';
import { SefazXmlParser } from '../../services/sefazParser';
import { FirestoreDbService } from '../../services/firestoreDbService';

interface XmlUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: SefazInvoice[];
  onInvoicesChange: (invoices: SefazInvoice[]) => void;
  pdvProducts: PdvProduct[];
  mkpConfig: MkpConfig;
}

export const XmlUploaderModal: React.FC<XmlUploaderModalProps> = ({
  isOpen,
  onClose,
  invoices,
  onInvoicesChange
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedXml, setPastedXml] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFiles = async (files: FileList | File[]) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(true);

    try {
      const fileList = Array.from(files);
      const res = await SefazSyncService.importXmlFiles(fileList);

      if (res.invoices.length > 0) {
        // Merge without duplicate chaveAcesso
        const existingMap = new Map<string, SefazInvoice>();
        invoices.forEach(i => existingMap.set(i.chaveAcesso, i));
        res.invoices.forEach(i => existingMap.set(i.chaveAcesso, i));
        const merged = Array.from(existingMap.values());
        onInvoicesChange(merged);

        setSuccessMsg(`${res.successCount} arquivo(s) XML gravados com sucesso no banco central!`);
      }

      if (res.errors.length > 0) {
        setErrorMsg(res.errors.slice(0, 3).join(' | '));
      }
    } catch (err: any) {
      setErrorMsg(`Erro na importação: ${err.message}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handlePasteProcess = async () => {
    if (!pastedXml.trim()) return;
    try {
      setErrorMsg(null);
      const parsed = SefazXmlParser.parseXml(pastedXml);
      if (!parsed) {
        throw new Error('O texto colado não contém uma estrutura válida de NF-e/NFC-e.');
      }

      const existingMap = new Map<string, SefazInvoice>();
      invoices.forEach(i => existingMap.set(i.chaveAcesso, i));
      existingMap.set(parsed.chaveAcesso, parsed);
      const merged = Array.from(existingMap.values());
      onInvoicesChange(merged);

      try {
        await FirestoreDbService.saveInvoices([parsed]);
      } catch (saveErr) {
        console.warn('Erro ao salvar no Firestore:', saveErr);
      }

      setPastedXml('');
      setPasteMode(false);
      setSuccessMsg(`NF-e nº ${parsed.numero} (${parsed.emitente.xNome}) importada e salva no banco de dados!`);
    } catch (err: any) {
      setErrorMsg(`Erro no XML colado: ${err.message}`);
    }
  };

  const removeInvoice = (chaveAcesso: string) => {
    onInvoicesChange(invoices.filter(i => i.chaveAcesso !== chaveAcesso));
  };

  const clearAll = () => {
    if (confirm('Deseja realmente limpar todos os XMLs da lista atual?')) {
      onInvoicesChange([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#141414]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        id="modal-xml-uploader"
        className="bg-[#F0EFED] rounded-sm max-w-3xl w-full shadow-2xl border border-[#141414] overflow-hidden flex flex-col max-h-[90vh] font-mono"
      >
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#141414] flex items-center justify-between bg-[#E4E3E0]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-sm bg-[#141414] text-[#E4E3E0]">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#141414] text-xs sm:text-sm uppercase tracking-tight">
                Importador de XMLs e Arquivos .ZIP da SEFAZ
              </h3>
              <p className="text-[10px] text-[#141414]/70">
                Envie arquivos .xml ou pacotes .zip contendo XMLs para armazenamento no banco central
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#141414] hover:bg-[#141414]/10 rounded-sm transition border border-[#141414]"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          
          {errorMsg && (
            <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] rounded-sm flex items-start space-x-2 text-[#141414] text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#141414]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] rounded-sm flex items-start space-x-2 text-[#141414] text-xs font-mono">
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-800" />
              <span className="text-emerald-800 font-bold">{successMsg}</span>
            </div>
          )}

          {!pasteMode ? (
            /* Drag & Drop Area */
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all ${
                dragActive 
                  ? 'border-[#141414] bg-[#E4E3E0]' 
                  : 'border-[#141414]/40 hover:border-[#141414] bg-[#E4E3E0]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xml,.zip,.txt"
                onChange={(e) => e.target.files && processFiles(e.target.files)}
                className="hidden"
              />
              <div className="w-10 h-10 mx-auto rounded-sm bg-[#141414] flex items-center justify-center text-[#E4E3E0] mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#141414]">
                {isProcessing ? 'Processando arquivos...' : 'Arraste seus arquivos .xml ou .zip aqui, ou clique para selecionar'}
              </p>
              <p className="text-[10px] text-[#141414]/70 mt-1">
                Suporta múltiplos arquivos XML e pacotes ZIP descompactados automaticamente
              </p>
            </div>
          ) : (
            /* Paste raw XML Area */
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#141414]/70">
                Cole o conteúdo XML da NF-e abaixo:
              </label>
              <textarea
                value={pastedXml}
                onChange={(e) => setPastedXml(e.target.value)}
                placeholder="<?xml version='1.0' encoding='UTF-8'?><nfeProc..."
                rows={7}
                className="w-full text-xs font-mono p-2.5 bg-[#E4E3E0] border border-[#141414] rounded-sm focus:outline-none text-[#141414]"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPasteMode(false)}
                  className="px-3 py-1 text-xs uppercase font-bold text-[#141414] hover:bg-[#E4E3E0] rounded-sm border border-[#141414]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handlePasteProcess}
                  disabled={!pastedXml.trim()}
                  className="px-3.5 py-1 text-xs font-bold uppercase bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm disabled:opacity-50 border border-[#141414]"
                >
                  Processar XML Colado
                </button>
              </div>
            </div>
          )}

          {/* Action pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setPasteMode(!pasteMode)}
              className="text-[11px] font-bold uppercase text-[#141414] hover:underline flex items-center space-x-1"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{pasteMode ? 'Voltar para envio por arquivo' : 'Ou colar texto XML manualmente'}</span>
            </button>
          </div>

          {/* List of currently loaded invoices */}
          {invoices.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between border-b border-[#141414] pb-1.5">
                <span className="text-xs font-bold text-[#141414] uppercase tracking-wider">
                  Notas Gravadas no Banco ({invoices.length})
                </span>
                <button
                  onClick={clearAll}
                  className="text-[11px] uppercase font-bold text-[#141414] hover:underline flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar todas</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {invoices.map((inv) => (
                  <div
                    key={inv.chaveAcesso}
                    className="p-2.5 bg-[#E4E3E0] rounded-sm border border-[#141414] flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#141414]">
                          NF-e nº {inv.numero} (Série {inv.serie})
                        </span>
                        <span className="bg-[#141414] text-[#E4E3E0] font-bold px-1.5 py-0.2 rounded-xs text-[10px] uppercase">
                          {inv.itens.length} {inv.itens.length === 1 ? 'item' : 'itens'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[#141414]/80 text-[10px]">
                        <span className="flex items-center space-x-1 truncate max-w-xs">
                          <Building className="w-3 h-3 text-[#141414]" />
                          <span className="truncate font-sans font-medium">{inv.emitente.xNome}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-[#141414]" />
                          <span>{new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}</span>
                        </span>
                        <span className="font-bold text-[#141414]">
                          R$ {inv.totais.vNF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeInvoice(inv.chaveAcesso)}
                      className="p-1 text-[#141414] hover:bg-[#141414]/10 rounded-sm transition border border-[#141414]"
                      title="Remover esta nota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#E4E3E0] border-t border-[#141414] flex items-center justify-between">
          <span className="text-[11px] text-[#141414]/70">
            {invoices.length > 0 ? `${invoices.reduce((acc, i) => acc + i.itens.length, 0)} itens gravados` : 'Nenhum XML carregado'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm transition border border-[#141414]"
          >
            Concluir & Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
