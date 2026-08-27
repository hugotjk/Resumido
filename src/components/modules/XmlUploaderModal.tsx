import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  FileCode,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';
import { SefazInvoice, PdvProduct, MkpConfig } from '../../types';
import { SefazXmlParser } from '../../services/sefazParser';

interface XmlUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: SefazInvoice[];
  onInvoicesChange: (invoices: SefazInvoice[]) => void;
  pdvProducts: PdvProduct[];
  mkpConfig: MkpConfig;
  onLoadSamples: () => void;
}

export const XmlUploaderModal: React.FC<XmlUploaderModalProps> = ({
  isOpen,
  onClose,
  invoices,
  onInvoicesChange,
  pdvProducts,
  mkpConfig,
  onLoadSamples
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedXml, setPastedXml] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFiles = (files: FileList | File[]) => {
    setErrorMsg(null);
    const newInvoices: SefazInvoice[] = [...invoices];
    let loadedCount = 0;

    Array.from(files).forEach((file) => {
      if (!file.name.endsWith('.xml') && !file.type.includes('xml')) {
        setErrorMsg('Por favor, selecione arquivos com extensão .xml válidos da SEFAZ (NF-e).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = SefazXmlParser.parseXmlString(content, pdvProducts, mkpConfig);
          parsed.fileName = file.name;

          // Check if already in list
          const existingIdx = newInvoices.findIndex(inv => inv.chaveAcesso === parsed.chaveAcesso);
          if (existingIdx >= 0) {
            newInvoices[existingIdx] = parsed;
          } else {
            newInvoices.push(parsed);
          }

          loadedCount++;
          if (loadedCount === files.length) {
            onInvoicesChange([...newInvoices]);
          }
        } catch (err: any) {
          console.error(err);
          setErrorMsg(`Erro ao processar ${file.name}: ${err.message || 'XML inválido'}`);
        }
      };
      reader.readAsText(file);
    });
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

  const handlePasteProcess = () => {
    if (!pastedXml.trim()) return;
    try {
      setErrorMsg(null);
      const parsed = SefazXmlParser.parseXmlString(pastedXml, pdvProducts, mkpConfig);
      parsed.fileName = `NFe-${parsed.numero}.xml`;

      const existingIdx = invoices.findIndex(inv => inv.chaveAcesso === parsed.chaveAcesso);
      if (existingIdx >= 0) {
        const updated = [...invoices];
        updated[existingIdx] = parsed;
        onInvoicesChange(updated);
      } else {
        onInvoicesChange([...invoices, parsed]);
      }
      setPastedXml('');
      setPasteMode(false);
    } catch (err: any) {
      setErrorMsg(`Erro no XML colado: ${err.message}`);
    }
  };

  const removeInvoice = (chaveAcesso: string) => {
    onInvoicesChange(invoices.filter(i => i.chaveAcesso !== chaveAcesso));
  };

  const clearAll = () => {
    onInvoicesChange([]);
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
                Importador de XML SEFAZ (NF-e)
              </h3>
              <p className="text-[10px] text-[#141414]/70">
                Arraste os arquivos XML das notas fiscais dos fornecedores para cruzar com o PDV
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
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
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
                accept=".xml,text/xml"
                onChange={(e) => e.target.files && processFiles(e.target.files)}
                className="hidden"
              />
              <div className="w-10 h-10 mx-auto rounded-sm bg-[#141414] flex items-center justify-center text-[#E4E3E0] mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#141414]">
                Arraste seus arquivos XML de NF-e aqui, ou <span className="underline">clique para selecionar</span>
              </p>
              <p className="text-[10px] text-[#141414]/70 mt-1">
                Suporta múltiplos arquivos XML simultâneos (Layout NF-e v4.00 SEFAZ)
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

            <button
              type="button"
              onClick={() => {
                onLoadSamples();
                onClose();
              }}
              className="text-xs font-bold uppercase text-[#141414] bg-[#E4E3E0] hover:bg-[#d8d6d2] px-2.5 py-1 rounded-sm border border-[#141414] flex items-center space-x-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#141414]" />
              <span>Carregar 2 XMLs Exemplo para Teste</span>
            </button>
          </div>

          {/* List of currently loaded invoices */}
          {invoices.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between border-b border-[#141414] pb-1.5">
                <span className="text-xs font-bold text-[#141414] uppercase tracking-wider">
                  Notas Carregadas ({invoices.length})
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
            {invoices.length > 0 ? `${invoices.reduce((acc, i) => acc + i.itens.length, 0)} itens disponíveis` : 'Nenhuma nota carregada'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm transition border border-[#141414]"
          >
            Concluir & Visualizar
          </button>
        </div>

      </div>
    </div>
  );
};
