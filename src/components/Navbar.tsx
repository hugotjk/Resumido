import React from 'react';
import { 
  Building2, 
  Wifi, 
  WifiOff, 
  UploadCloud, 
  FileCode2, 
  RefreshCw, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles,
  KeyRound,
  Database
} from 'lucide-react';
import { ApiConfig, SefazInvoice, SefazCertificate } from '../types';

interface NavbarProps {
  apiConfig: ApiConfig;
  invoices: SefazInvoice[];
  activeCertificate?: SefazCertificate | null;
  onNavigateToCertificate?: () => void;
  onOpenXmlModal: () => void;
  onRefreshData: () => void;
  isLoading: boolean;
  selectedStore: string | number;
  onSelectStore: (storeId: number) => void;
  onLoadSampleInvoices: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiConfig,
  invoices,
  activeCertificate,
  onNavigateToCertificate,
  onOpenXmlModal,
  onRefreshData,
  isLoading,
  selectedStore,
  onSelectStore,
  onLoadSampleInvoices
}) => {
  const isOnline = apiConfig.statusConexao === 'ONLINE';

  return (
    <header id="main-navbar" className="bg-[#F0EFED] border-b border-[#141414] text-[#141414] sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] border border-[#141414] flex items-center justify-center rounded-sm">
              <ShieldCheck className="w-5 h-5 text-[#E4E3E0]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-[#141414] uppercase">
                  PDV Flow <span className="text-[10px] font-mono font-bold bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 rounded-sm">SEFAZ Hub</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm font-semibold bg-[#E4E3E0] text-[#141414] border border-[#141414]">
                  v2.5
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#141414]/70 hidden sm:block">
                CERTIFICADO A1 • SEFAZ DF-E • CONFERÊNCIA MKP • PDV
              </p>
            </div>
          </div>

          {/* Center / Status Indicator */}
          <div className="hidden md:flex items-center space-x-2.5">
            {/* Database Persistent Badge */}
            <div className="flex items-center space-x-1.5 bg-[#E4E3E0] px-2.5 py-1 rounded-sm border border-[#141414] text-[11px] font-mono" title="Banco de dados Cloud Firestore conectado e ativo para persistência contínua">
              <Database className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[#141414]/70 uppercase font-bold text-[10px]">BANCO:</span>
              <span className="font-bold text-emerald-800 text-[10px]">FIRESTORE ATIVO</span>
            </div>

            {/* Certificate Indicator Button */}
            <button
              id="navbar-cert-badge"
              onClick={onNavigateToCertificate}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-sm border text-[11px] font-mono transition ${
                activeCertificate
                  ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] hover:bg-[#2c2c2c]'
                  : 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
              }`}
              title={activeCertificate ? `Certificado ativo para ${activeCertificate.razaoSocial}` : 'Clique para importar Certificado A1'}
            >
              <KeyRound className={`w-3.5 h-3.5 ${activeCertificate ? 'text-emerald-400' : 'text-amber-700'}`} />
              <span className="font-bold uppercase text-[10px]">
                {activeCertificate ? `A1: ${activeCertificate.cnpj} (${activeCertificate.diasRestantes}d)` : 'SEM CERTIFICADO A1'}
              </span>
            </button>

            {/* API PDV Status */}
            <div className="flex items-center space-x-2 bg-[#E4E3E0] px-2.5 py-1 rounded-sm border border-[#141414] text-[11px] font-mono">
              <span className="text-[#141414]/60 uppercase font-bold text-[10px]">API PDV:</span>
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                <span className="font-bold text-[#141414]">
                  {isOnline ? 'ONLINE' : 'CONTINGÊNCIA'}
                </span>
              </div>
            </div>

            {/* Store selector */}
            <div className="flex items-center space-x-1.5 bg-[#E4E3E0] px-2.5 py-1 rounded-sm border border-[#141414] text-[11px] font-mono">
              <Building2 className="w-3.5 h-3.5 text-[#141414]" />
              <select 
                id="select-store-navbar"
                value={selectedStore} 
                onChange={(e) => onSelectStore(Number(e.target.value))}
                aria-label="Selecionar Loja ou Filial"
                className="bg-transparent text-[#141414] font-bold focus:outline-none cursor-pointer uppercase text-[11px]"
              >
                <option value={1} className="bg-[#F0EFED] text-[#141414]">LOJA 01 - MATRIZ CENTRO</option>
                <option value={2} className="bg-[#F0EFED] text-[#141414]">LOJA 02 - SHOPPING IGUATEMI</option>
                <option value={3} className="bg-[#F0EFED] text-[#141414]">LOJA 03 - GALERIA NORTE</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Upload XML SEFAZ */}
            <button
              id="btn-open-xml-modal"
              onClick={onOpenXmlModal}
              className="flex items-center space-x-1.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-[#141414] hover:bg-[#2c2c2c] text-[#E4E3E0] px-3 py-1.5 rounded-sm border border-[#141414] transition active:scale-98"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Importar XML</span>
              {invoices.length > 0 && (
                <span className="bg-[#E4E3E0] text-[#141414] font-mono px-1 py-0.2 rounded-xs text-[10px]">
                  {invoices.length} NF{invoices.length > 1 ? 's' : ''}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              id="btn-refresh-data"
              onClick={onRefreshData}
              disabled={isLoading}
              className="p-1.5 rounded-sm bg-[#E4E3E0] hover:bg-[#d8d7d4] text-[#141414] border border-[#141414] transition disabled:opacity-50"
              title="Sincronizar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

