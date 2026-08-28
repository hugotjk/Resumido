import React, { useRef, useEffect } from 'react';
import { SefazInvoice } from '../../types';
import { Printer, Download, X } from 'lucide-react';

interface DanfeModalProps {
  invoice: SefazInvoice;
  onClose: () => void;
  onDownloadXml?: (inv: SefazInvoice) => void;
}

export const DanfeModal: React.FC<DanfeModalProps> = ({ invoice, onClose, onDownloadXml }) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  // Format Chave de Acesso into 4-digit groups (e.g. 3526 0846 1464 6200 ...)
  const formatChave = (key: string) => {
    if (!key) return '';
    const clean = key.replace(/\D/g, '');
    return clean.match(/.{1,4}/g)?.join(' ') || key;
  };

  // Format numbers to Brazilian currency string
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0,00';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format quantities
  const formatQty = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0,0000';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  };

  // Format Date
  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('pt-BR');
    } catch {
      return isoString;
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('pt-BR');
    } catch {
      return '';
    }
  };

  // Format 9-digit NF number like 000.035.901
  const formatNfNumber = (numStr?: string) => {
    if (!numStr) return '000.000.001';
    const clean = numStr.replace(/\D/g, '');
    const padded = clean.padStart(9, '0');
    return `${padded.slice(0, 3)}.${padded.slice(3, 6)}.${padded.slice(6, 9)}`;
  };

  // Series format (3 digits)
  const formatSerie = (serieStr?: string) => {
    if (!serieStr) return '001';
    return serieStr.padStart(3, '0');
  };

  const isSaida = invoice.tipoOperacao !== 'ENTRADA';
  const isCancelada = invoice.statusNota === 'CANCELADA';

  // Fallback calculations if specific totals are missing
  const totais = invoice.totais || {
    vProd: 0,
    vFrete: 0,
    vSeg: 0,
    vDesc: 0,
    vOutro: 0,
    vIPI: 0,
    vST: 0,
    vNF: 0
  };

  const emit = invoice.emitente || { cnpj: '', xNome: '', uf: 'SP' };
  const dest = invoice.destinatario || { cnpj: '', xNome: '', uf: 'SP' };
  const transp = invoice.transporte;
  const localEntrega = invoice.localEntrega;

  return (
    <div 
      className="fixed inset-0 bg-black/75 z-50 flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4 print:p-0 print:bg-white print:static print:z-auto cursor-pointer"
      onClick={onClose}
    >
      
      {/* Inner Document & Action Bar Container (Stop propagation so clicks inside don't close) */}
      <div 
        className="w-full max-w-5xl flex flex-col my-0 sm:my-2 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Top Action Bar (hidden when printing) */}
        <div className="w-full bg-[#141414] text-[#E4E3E0] p-3 rounded-t-sm flex items-center justify-between shadow-xl mb-0 print:hidden sticky top-0 z-10 border border-[#333]">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xs uppercase tracking-wider">
              DANFE - NF-e Nº {invoice.numero} (Série {invoice.serie})
            </span>
            {isCancelada && (
              <span className="px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] uppercase rounded-xs">
                NF-e Cancelada
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#E4E3E0] hover:bg-white text-[#141414] font-bold text-xs uppercase rounded-xs transition flex items-center space-x-1.5 shadow-xs"
              title="Imprimir DANFE ou Salvar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir DANFE / Salvar PDF</span>
            </button>

            {onDownloadXml && (
              <button
                onClick={() => onDownloadXml(invoice)}
                className="px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#E4E3E0] font-bold text-xs uppercase rounded-xs transition flex items-center space-x-1.5 border border-[#444]"
                title="Baixar arquivo XML original"
              >
                <Download className="w-4 h-4" />
                <span>Baixar XML</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-[#E4E3E0] hover:text-white rounded-xs hover:bg-[#2a2a2a] transition ml-2"
              title="Fechar Visualização (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DANFE DOCUMENT PAPER CONTAINER */}
        <div 
          ref={printRef}
          id="danfe-print-area"
          className="w-full bg-white text-black font-sans p-4 sm:p-6 shadow-2xl rounded-b-sm print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full text-[9px] leading-tight border border-gray-400 print:border-none"
        >
        
        {/* ========================================================================= */}
        {/* CANHOTO / COMPROVANTE DE RECEBIMENTO */}
        {/* ========================================================================= */}
        <div className="border border-black mb-1">
          <div className="flex border-b border-black">
            <div className="flex-1 p-1 text-[8px] leading-tight border-r border-black">
              RECEBEMOS DE <strong>{emit.xNome}</strong> OS PRODUTOS E/OU SERVIÇOS CONSTANTES DA NOTA FISCAL ELETRÔNICA INDICADA ABAIXO. EMISSÃO: <strong>{formatDate(invoice.dataEmissao)}</strong> VALOR TOTAL: <strong>R$ {formatCurrency(totais.vNF)}</strong> DESTINATÁRIO: <strong>{dest.xNome}</strong> - {dest.logradouro ? `${dest.logradouro}, ${dest.numero || ''} ${dest.bairro || ''} ${dest.municipio || ''}-${dest.uf || ''}` : ''}
            </div>
            <div className="w-36 p-1 text-center font-bold flex flex-col justify-center border-l border-black">
              <span className="text-[10px]">NF-e</span>
              <span className="text-[9px]">Nº. {formatNfNumber(invoice.numero)}</span>
              <span className="text-[8px]">Série {formatSerie(invoice.serie)}</span>
            </div>
          </div>
          <div className="flex">
            <div className="w-40 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">DATA DE RECEBIMENTO</div>
              <div className="h-4"></div>
            </div>
            <div className="flex-1 p-1">
              <div className="text-[7px] uppercase font-bold text-gray-700">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</div>
              <div className="h-4"></div>
            </div>
          </div>
        </div>

        {/* Linha pontilhada de corte */}
        <div className="border-b border-dashed border-black my-1 text-center text-[7px] text-gray-600">
          - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        </div>

        {/* ========================================================================= */}
        {/* CABEÇALHO DANFE (EMITENTE | DANFE INFO | CÓDIGO DE BARRAS & CHAVE) */}
        {/* ========================================================================= */}
        <div className="border border-black mb-1 flex">
          
          {/* Emitente */}
          <div className="w-[45%] p-2 border-r border-black flex flex-col justify-between">
            <div>
              <div className="text-[7px] uppercase font-bold text-gray-700">IDENTIFICAÇÃO DO EMITENTE</div>
              <div className="font-bold text-xs uppercase text-black mt-0.5 leading-snug">
                {emit.xNome}
              </div>
              {emit.xFant && emit.xFant !== emit.xNome && (
                <div className="text-[9px] font-bold text-gray-800 uppercase">{emit.xFant}</div>
              )}
              <div className="text-[8px] text-gray-800 mt-1 space-y-0.5">
                {emit.logradouro && (
                  <div>{emit.logradouro}, {emit.numero || 'S/N'} {emit.complemento || ''}</div>
                )}
                <div>
                  {emit.bairro ? `${emit.bairro} - ` : ''}{emit.cep ? `CEP: ${emit.cep}` : ''}
                </div>
                <div>
                  {emit.municipio || ''} - {emit.uf || ''} {emit.fone ? `Fone/Fax: ${emit.fone}` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* DANFE Box */}
          <div className="w-[20%] p-1.5 border-r border-black text-center flex flex-col justify-between">
            <div>
              <div className="font-bold text-base tracking-wider">DANFE</div>
              <div className="text-[7px] leading-tight text-gray-800">
                Documento Auxiliar da Nota Fiscal Eletrônica
              </div>
              <div className="flex justify-center items-center my-1">
                <div className="text-[8px] text-left mr-2">
                  <div>0 - ENTRADA</div>
                  <div>1 - SAÍDA</div>
                </div>
                <div className="w-5 h-6 border border-black font-bold text-xs flex items-center justify-center">
                  {isSaida ? '1' : '0'}
                </div>
              </div>
            </div>
            <div>
              <div className="font-bold text-[10px]">Nº. {formatNfNumber(invoice.numero)}</div>
              <div className="font-bold text-[9px]">Série {formatSerie(invoice.serie)}</div>
              <div className="text-[8px] text-gray-700">Folha 1/1</div>
            </div>
          </div>

          {/* Código de Barras e Chave de Acesso */}
          <div className="w-[35%] p-1.5 flex flex-col justify-between">
            <div>
              {/* Fake SVG Barcode simulating Code 128 / EAN */}
              <div className="h-9 w-full bg-white flex items-center justify-center overflow-hidden my-0.5">
                <svg className="w-full h-8" viewBox="0 0 260 30" preserveAspectRatio="none">
                  {/* Generated clean bar lines */}
                  {Array.from({ length: 58 }).map((_, i) => {
                    const width = (i % 3 === 0 || i % 7 === 0) ? 3 : (i % 2 === 0 ? 2 : 1);
                    const x = i * 4.4;
                    return <rect key={i} x={x} y="0" width={width} height="30" fill="#000" />;
                  })}
                </svg>
              </div>

              <div className="border-t border-black pt-0.5">
                <div className="text-[7px] uppercase font-bold text-gray-700">CHAVE DE ACESSO</div>
                <div className="font-mono font-bold text-[9px] text-center tracking-wide text-black my-0.5 break-all">
                  {formatChave(invoice.chaveAcesso)}
                </div>
              </div>
            </div>

            <div className="border-t border-black pt-0.5 text-[7px] leading-tight text-gray-700 text-center">
              Consulta de autenticidade no portal nacional da NF-e
              <div className="font-mono text-[7px] text-black font-bold">
                www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* NATUREZA DA OPERAÇÃO & PROTOCOLO */}
        {/* ========================================================================= */}
        <div className="border border-black mb-1">
          <div className="flex border-b border-black">
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">NATUREZA DA OPERAÇÃO</div>
              <div className="font-bold text-[9px] uppercase">{invoice.naturezaOperacao || 'VENDA DE MERCADORIA'}</div>
            </div>
            <div className="w-72 p-1">
              <div className="text-[7px] uppercase font-bold text-gray-700">PROTOCOLO DE AUTORIZAÇÃO DE USO</div>
              <div className="font-mono font-bold text-[9px]">
                {invoice.protocoloAutorizacao?.nProt ? `${invoice.protocoloAutorizacao.nProt} - ${formatDate(invoice.protocoloAutorizacao.dhRecbto)} ${formatTime(invoice.protocoloAutorizacao.dhRecbto)}` : (isCancelada ? 'NOTA FISCAL CANCELADA' : 'AUTORIZADA')}
              </div>
            </div>
          </div>

          <div className="flex">
            <div className="w-1/4 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">INSCRIÇÃO ESTADUAL</div>
              <div className="font-mono font-bold text-[9px]">{emit.ie || 'ISENTO'}</div>
            </div>
            <div className="w-1/4 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">INSCRIÇÃO MUNICIPAL</div>
              <div className="font-mono font-bold text-[9px]">{emit.im || 'ISENTO'}</div>
            </div>
            <div className="w-1/4 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">INSC. ESTADUAL DO SUBST. TRIB.</div>
              <div className="font-mono font-bold text-[9px]">{emit.ieST || ''}</div>
            </div>
            <div className="w-1/4 p-1">
              <div className="text-[7px] uppercase font-bold text-gray-700">CNPJ</div>
              <div className="font-mono font-bold text-[9px]">{emit.cnpj}</div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DESTINATÁRIO / REMETENTE */}
        {/* ========================================================================= */}
        <div className="border border-black mb-1">
          <div className="bg-gray-100 px-1 py-0.5 border-b border-black text-[7px] font-bold uppercase">
            DESTINATÁRIO / REMETENTE
          </div>

          {/* Row 1 */}
          <div className="flex border-b border-black">
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">NOME / RAZÃO SOCIAL</div>
              <div className="font-bold text-[9px] uppercase">{dest.xNome}</div>
            </div>
            <div className="w-48 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">CNPJ / CPF</div>
              <div className="font-mono font-bold text-[9px]">{dest.cnpj}</div>
            </div>
            <div className="w-28 p-1">
              <div className="text-[7px] uppercase font-bold text-gray-700">DATA DA EMISSÃO</div>
              <div className="font-mono font-bold text-[9px]">{formatDate(invoice.dataEmissao)}</div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex border-b border-black">
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">ENDEREÇO</div>
              <div className="font-bold text-[9px] uppercase">
                {dest.logradouro ? `${dest.logradouro}, ${dest.numero || 'S/N'} ${dest.complemento || ''}` : 'ENDEREÇO NÃO DECLARADO'}
              </div>
            </div>
            <div className="w-44 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">BAIRRO / DISTRITO</div>
              <div className="font-bold text-[9px] uppercase">{dest.bairro || ''}</div>
            </div>
            <div className="w-28 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">CEP</div>
              <div className="font-mono font-bold text-[9px]">{dest.cep || ''}</div>
            </div>
            <div className="w-28 p-1">
              <div className="text-[7px] uppercase font-bold text-gray-700">DATA SAÍDA/ENTRADA</div>
              <div className="font-mono font-bold text-[9px]">{formatDate(invoice.dataEmissao)}</div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="flex">
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">MUNICÍPIO</div>
              <div className="font-bold text-[9px] uppercase">{dest.municipio || ''}</div>
            </div>
            <div className="w-12 p-1 border-r border-black text-center">
              <div className="text-[7px] uppercase font-bold text-gray-700">UF</div>
              <div className="font-bold text-[9px]">{dest.uf || ''}</div>
            </div>
            <div className="w-36 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">FONE / FAX</div>
              <div className="font-mono font-bold text-[9px]">{dest.fone || ''}</div>
            </div>
            <div className="w-36 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">INSCRIÇÃO ESTADUAL</div>
              <div className="font-mono font-bold text-[9px]">{dest.ie || 'ISENTO'}</div>
            </div>
            <div className="w-28 p-1">
              <div className="text-[7px] uppercase font-bold text-gray-700">HORA SAÍDA/ENTRADA</div>
              <div className="font-mono font-bold text-[9px]">{formatTime(invoice.dataEmissao)}</div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LOCAL DE ENTREGA (SE PRESENTE) */}
        {/* ========================================================================= */}
        {localEntrega && (
          <div className="border border-black mb-1">
            <div className="bg-gray-100 px-1 py-0.5 border-b border-black text-[7px] font-bold uppercase">
              INFORMAÇÕES DO LOCAL DE ENTREGA
            </div>
            <div className="flex border-b border-black">
              <div className="flex-1 p-1 border-r border-black">
                <div className="text-[7px] uppercase font-bold text-gray-700">NOME / RAZÃO SOCIAL</div>
                <div className="font-bold text-[9px] uppercase">{localEntrega.xNome || dest.xNome}</div>
              </div>
              <div className="w-48 p-1 border-r border-black">
                <div className="text-[7px] uppercase font-bold text-gray-700">CNPJ / CPF</div>
                <div className="font-mono font-bold text-[9px]">{localEntrega.cnpj || dest.cnpj}</div>
              </div>
              <div className="w-36 p-1">
                <div className="text-[7px] uppercase font-bold text-gray-700">INSCRIÇÃO ESTADUAL</div>
                <div className="font-mono font-bold text-[9px]">{localEntrega.ie || ''}</div>
              </div>
            </div>
            <div className="flex">
              <div className="flex-1 p-1 border-r border-black">
                <div className="text-[7px] uppercase font-bold text-gray-700">ENDEREÇO</div>
                <div className="font-bold text-[9px] uppercase">
                  {localEntrega.logradouro ? `${localEntrega.logradouro}, ${localEntrega.numero || ''} ${localEntrega.complemento || ''}` : ''}
                </div>
              </div>
              <div className="w-44 p-1 border-r border-black">
                <div className="text-[7px] uppercase font-bold text-gray-700">BAIRRO / DISTRITO</div>
                <div className="font-bold text-[9px] uppercase">{localEntrega.bairro || ''}</div>
              </div>
              <div className="w-24 p-1 border-r border-black">
                <div className="text-[7px] uppercase font-bold text-gray-700">CEP</div>
                <div className="font-mono font-bold text-[9px]">{localEntrega.cep || ''}</div>
              </div>
              <div className="w-36 p-1 border-r border-black">
                <div className="text-[7px] uppercase font-bold text-gray-700">MUNICÍPIO</div>
                <div className="font-bold text-[9px] uppercase">{localEntrega.municipio || ''}</div>
              </div>
              <div className="w-12 p-1 text-center">
                <div className="text-[7px] uppercase font-bold text-gray-700">UF</div>
                <div className="font-bold text-[9px]">{localEntrega.uf || ''}</div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FATURA / DUPLICATAS */}
        {/* ========================================================================= */}
        {invoice.duplicatas && invoice.duplicatas.length > 0 && (
          <div className="border border-black mb-1">
            <div className="bg-gray-100 px-1 py-0.5 border-b border-black text-[7px] font-bold uppercase">
              FATURA / DUPLICATA
            </div>
            <div className="p-1 flex flex-wrap gap-2">
              {invoice.duplicatas.map((dup, idx) => (
                <div key={idx} className="border border-gray-400 p-1 min-w-[120px] text-[8px] bg-white">
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-bold">Num.</span>
                    <span className="font-mono font-bold">{dup.nDup || `00${idx + 1}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-bold">Venc.</span>
                    <span className="font-mono">{formatDate(dup.dVenc)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-bold">Valor</span>
                    <span className="font-mono font-bold">R$ {formatCurrency(dup.vDup)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CÁLCULO DO IMPOSTO */}
        {/* ========================================================================= */}
        <div className="border border-black mb-1">
          <div className="bg-gray-100 px-1 py-0.5 border-b border-black text-[7px] font-bold uppercase">
            CÁLCULO DO IMPOSTO
          </div>

          {/* Imposto Linha 1 */}
          <div className="flex border-b border-black text-right">
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">BASE DE CÁLC. DO ICMS</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vBCICMS || 0)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">VALOR DO ICMS</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vICMS || 0)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">BASE DE CÁLC. ICMS S.T.</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vBCST || 0)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">VALOR DO ICMS SUBST.</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vST || 0)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">V. IMP. IMPORTAÇÃO</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vII || 0)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">V. ICMS UF REMET.</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vICMSUFRemet || 0)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">V. FCP UF DEST.</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vFCPUFDest || 0)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">VALOR DO PIS</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vPIS || 0)}</div>
            </div>
            <div className="flex-1 p-1">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">V. TOTAL PRODUTOS</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vProd)}</div>
            </div>
          </div>

          {/* Imposto Linha 2 */}
          <div className="flex text-right">
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">VALOR DO FRETE</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vFrete)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">VALOR DO SEGURO</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vSeg)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">DESCONTO</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vDesc)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">OUTRAS DESPESAS</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vOutro)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">VALOR TOTAL IPI</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vIPI)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">V. ICMS UF DEST.</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vICMSUFDest || 0)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">V. TOT. TRIB.</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vTotTrib || 0)}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">VALOR DA COFINS</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(totais.vCOFINS || 0)}</div>
            </div>
            <div className="flex-1 p-1 bg-gray-100">
              <div className="text-[7px] uppercase font-bold text-gray-900 text-left">V. TOTAL DA NOTA</div>
              <div className="font-mono font-bold text-[10px] text-black">R$ {formatCurrency(totais.vNF)}</div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* TRANSPORTADOR / VOLUMES TRANSPORTADOS */}
        {/* ========================================================================= */}
        <div className="border border-black mb-1">
          <div className="bg-gray-100 px-1 py-0.5 border-b border-black text-[7px] font-bold uppercase">
            TRANSPORTADOR / VOLUMES TRANSPORTADOS
          </div>

          {/* Row 1 */}
          <div className="flex border-b border-black">
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">NOME / RAZÃO SOCIAL</div>
              <div className="font-bold text-[9px] uppercase">{transp?.transportador?.xNome || 'SEM TRANSPORTE / PRÓPRIO'}</div>
            </div>
            <div className="w-40 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">FRETE</div>
              <div className="font-bold text-[8px]">{transp?.modFreteDesc || '9-Sem Frete'}</div>
            </div>
            <div className="w-24 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">CÓDIGO ANTT</div>
              <div className="font-mono text-[8px]">{transp?.veiculo?.rntc || ''}</div>
            </div>
            <div className="w-28 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">PLACA DO VEÍCULO</div>
              <div className="font-mono font-bold text-[9px]">{transp?.veiculo?.placa || ''}</div>
            </div>
            <div className="w-12 p-1 border-r border-black text-center">
              <div className="text-[7px] uppercase font-bold text-gray-700">UF</div>
              <div className="font-bold text-[9px]">{transp?.veiculo?.uf || ''}</div>
            </div>
            <div className="w-44 p-1">
              <div className="text-[7px] uppercase font-bold text-gray-700">CNPJ / CPF</div>
              <div className="font-mono font-bold text-[9px]">{transp?.transportador?.cnpj || ''}</div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex border-b border-black">
            <div className="flex-1 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">ENDEREÇO</div>
              <div className="font-bold text-[9px] uppercase">{transp?.transportador?.xEnder || ''}</div>
            </div>
            <div className="w-48 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700">MUNICÍPIO</div>
              <div className="font-bold text-[9px] uppercase">{transp?.transportador?.xMun || ''}</div>
            </div>
            <div className="w-12 p-1 border-r border-black text-center">
              <div className="text-[7px] uppercase font-bold text-gray-700">UF</div>
              <div className="font-bold text-[9px]">{transp?.transportador?.uf || ''}</div>
            </div>
            <div className="w-48 p-1">
              <div className="text-[7px] uppercase font-bold text-gray-700">INSCRIÇÃO ESTADUAL</div>
              <div className="font-mono font-bold text-[9px]">{transp?.transportador?.ie || ''}</div>
            </div>
          </div>

          {/* Row 3 (Volumes) */}
          <div className="flex text-right">
            <div className="w-24 p-1 border-r border-black text-left">
              <div className="text-[7px] uppercase font-bold text-gray-700">QUANTIDADE</div>
              <div className="font-mono font-bold text-[9px]">{transp?.volumes?.qVol ?? 1}</div>
            </div>
            <div className="w-28 p-1 border-r border-black text-left">
              <div className="text-[7px] uppercase font-bold text-gray-700">ESPÉCIE</div>
              <div className="font-bold text-[8px] uppercase">{transp?.volumes?.esp || 'CAIXA(S)'}</div>
            </div>
            <div className="w-28 p-1 border-r border-black text-left">
              <div className="text-[7px] uppercase font-bold text-gray-700">MARCA</div>
              <div className="text-[8px] uppercase">{transp?.volumes?.marca || '.'}</div>
            </div>
            <div className="flex-1 p-1 border-r border-black text-left">
              <div className="text-[7px] uppercase font-bold text-gray-700">NUMERAÇÃO</div>
              <div className="font-mono text-[8px]">{transp?.volumes?.nVol || ''}</div>
            </div>
            <div className="w-32 p-1 border-r border-black">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">PESO BRUTO</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(transp?.volumes?.pesoB || 0)}</div>
            </div>
            <div className="w-32 p-1">
              <div className="text-[7px] uppercase font-bold text-gray-700 text-left">PESO LÍQUIDO</div>
              <div className="font-mono font-bold text-[9px]">{formatCurrency(transp?.volumes?.pesoL || 0)}</div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DADOS DOS PRODUTOS / SERVIÇOS */}
        {/* ========================================================================= */}
        <div className="border border-black mb-1">
          <div className="bg-gray-100 px-1 py-0.5 border-b border-black text-[7px] font-bold uppercase">
            DADOS DOS PRODUTOS / SERVIÇOS ({invoice.itens?.length || 0} ITENS)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[8px]">
              <thead>
                <tr className="bg-gray-50 border-b border-black text-[7px] font-bold text-black uppercase">
                  <th className="p-0.5 border-r border-black w-24">CÓDIGO PRODUTO</th>
                  <th className="p-0.5 border-r border-black">DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
                  <th className="p-0.5 border-r border-black w-14">NCM/SH</th>
                  <th className="p-0.5 border-r border-black w-10 text-center">O/CST</th>
                  <th className="p-0.5 border-r border-black w-10 text-center">CFOP</th>
                  <th className="p-0.5 border-r border-black w-8 text-center">UN</th>
                  <th className="p-0.5 border-r border-black w-12 text-right">QUANT</th>
                  <th className="p-0.5 border-r border-black w-14 text-right">VALOR UNIT</th>
                  <th className="p-0.5 border-r border-black w-16 text-right">VALOR TOTAL</th>
                  <th className="p-0.5 border-r border-black w-12 text-right">VALOR DESC</th>
                  <th className="p-0.5 border-r border-black w-14 text-right">B.CÁLC ICMS</th>
                  <th className="p-0.5 border-r border-black w-14 text-right">VALOR ICMS</th>
                  <th className="p-0.5 border-r border-black w-12 text-right">VALOR IPI</th>
                  <th className="p-0.5 border-r border-black w-10 text-right">ALÍQ. ICMS</th>
                  <th className="p-0.5 w-10 text-right">ALÍQ. IPI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {(!invoice.itens || invoice.itens.length === 0) ? (
                  <tr>
                    <td colSpan={15} className="p-4 text-center text-gray-500 font-bold uppercase">
                      Nenhum item detalhado disponível (Resumo SEFAZ ou aguardando Ciência da Emissão).
                    </td>
                  </tr>
                ) : (
                  invoice.itens.map((it, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-0.5 border-r border-black font-mono font-bold">{it.cProd}</td>
                      <td className="p-0.5 border-r border-black font-semibold text-black uppercase">{it.xProd}</td>
                      <td className="p-0.5 border-r border-black font-mono">{it.NCM}</td>
                      <td className="p-0.5 border-r border-black font-mono text-center">{it.orig || '0'}{it.cstICMS || '00'}</td>
                      <td className="p-0.5 border-r border-black font-mono text-center">{it.CFOP}</td>
                      <td className="p-0.5 border-r border-black font-bold text-center">{it.uCom}</td>
                      <td className="p-0.5 border-r border-black font-mono text-right">{formatQty(it.qCom)}</td>
                      <td className="p-0.5 border-r border-black font-mono text-right">{formatCurrency(it.vUnCom)}</td>
                      <td className="p-0.5 border-r border-black font-mono font-bold text-right">{formatCurrency(it.vProd)}</td>
                      <td className="p-0.5 border-r border-black font-mono text-right">{formatCurrency(it.vDesc || 0)}</td>
                      <td className="p-0.5 border-r border-black font-mono text-right">{formatCurrency(it.vBCICMS ?? it.vProd)}</td>
                      <td className="p-0.5 border-r border-black font-mono text-right">{formatCurrency(it.vICMS || 0)}</td>
                      <td className="p-0.5 border-r border-black font-mono text-right">{formatCurrency(it.vIPI || 0)}</td>
                      <td className="p-0.5 border-r border-black font-mono text-right">{it.pICMS ? `${it.pICMS.toFixed(2)}` : '0,00'}</td>
                      <td className="p-0.5 font-mono text-right">{it.pIPI ? `${it.pIPI.toFixed(2)}` : '0,00'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DADOS ADICIONAIS */}
        {/* ========================================================================= */}
        <div className="border border-black mb-1 flex">
          <div className="w-[70%] p-1 border-r border-black">
            <div className="bg-gray-100 px-1 py-0.5 border-b border-black text-[7px] font-bold uppercase mb-1">
              DADOS ADICIONAIS - INFORMAÇÕES COMPLEMENTARES
            </div>
            <div className="text-[7.5px] leading-snug whitespace-pre-line text-gray-900 font-mono select-text min-h-[48px]">
              {invoice.dadosAdicionais?.infCpl || 'Documento emitido por ME ou EPP optante pelo Simples Nacional ou regime normal. Não gera direito a crédito fiscal de IPI.'}
              {invoice.dadosAdicionais?.infAdFisco ? `\nInformações do Fisco: ${invoice.dadosAdicionais.infAdFisco}` : ''}
            </div>
          </div>

          <div className="w-[30%] p-1 flex flex-col justify-between">
            <div>
              <div className="bg-gray-100 px-1 py-0.5 border-b border-black text-[7px] font-bold uppercase mb-1">
                RESERVADO AO FISCO
              </div>
              <div className="h-10"></div>
            </div>
          </div>
        </div>

        {/* Rodapé Oficial */}
        <div className="flex justify-between items-center text-[7px] text-gray-600 mt-1 pt-1 border-t border-gray-300">
          <div>
            Impresso em {new Date().toLocaleString('pt-BR')} | Sistema de Conferência & Gestão PDV
          </div>
          <div>
            Powered by DANFE Engine
          </div>
        </div>

      </div>

    </div>

  </div>
  );
};
