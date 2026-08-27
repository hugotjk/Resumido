import React from 'react';
import { 
  ShieldCheck, 
  KeyRound,
  Database,
  RefreshCw,
  FileCode,
  Globe
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
}

export const Navbar: React.FC<NavbarProps> = ({
  apiConfig,
  invoices,
  activeCertificate,
  onNavigateToCertificate,
  onOpenXmlModal,
  onRefreshData,
  isLoading
}) => {
  const isOnline = apiConfig.statusConexao === 'ONLINE';

  return (
    <header id="main-navbar" className="bg-[#F0EFED] border-b border-[#141414] text-[#141414] sticky top-0 z-30 font-mono">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] border border-[#141414] flex items-center justify-center rounded-sm">
              <ShieldCheck className="w-5 h-5 text-[#E4E3E0]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-[#141414] uppercase">
                  CONSOLIDADOR <span className="text-[10px] bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 rounded-sm">SEFAZ & API</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-sm font-semibold bg-[#E4E3E0] text-[#141414] border border-[#141414]">
                  PRODUÇÃO
                </span>
              </div>
              <p className="text-[10px] text-[#141414]/70 hidden sm:block">
                CENTRAL DE XMLS • BANCO UNIFICADO • CERTIFICADO A1
              </p>
            </div>
          </div>

          {/* Center / Status Badges */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Database Unified Persistent Badge */}
            <div className="flex items-center space-x-1.5 bg-[#E4E3E0] px-2.5 py-1 rounded-sm border border-[#141414] text-[10px]" title="Banco Central Unificado conectado no Cloud Firestore">
              <Database className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[#141414]/70 uppercase font-bold">BANCO:</span>
              <span className="font-bold text-emerald-800 uppercase">CENTRAL FIRESTORE</span>
            </div>

            {/* API Status */}
            <div className="flex items-center space-x-1.5 bg-[#E4E3E0] px-2.5 py-1 rounded-sm border border-[#141414] text-[10px]">
              <Globe className="w-3.5 h-3.5 text-[#141414]" />
              <span className="text-[#141414]/60 uppercase font-bold">API CONEXÃO:</span>
              <span className={`font-bold ${isOnline ? 'text-emerald-800' : 'text-[#141414]'}`}>
                {isOnline ? 'ONLINE' : 'CONFIGURADA'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Total XMLs in Database Indicator */}
            <button
              onClick={onNavigateToCertificate}
              className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider bg-[#141414] hover:bg-[#2c2c2c] text-[#E4E3E0] px-3 py-1.5 rounded-sm border border-[#141414] transition"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>XMLs SEFAZ</span>
              <span className="bg-[#E4E3E0] text-[#141414] px-1 py-0.2 rounded-xs text-[10px]">
                {invoices.length}
              </span>
            </button>

            {/* Refresh */}
            <button
              id="btn-refresh-data"
              onClick={onRefreshData}
              disabled={isLoading}
              className="p-1.5 rounded-sm bg-[#E4E3E0] hover:bg-[#d8d7d4] text-[#141414] border border-[#141414] transition disabled:opacity-50"
              title="Recarregar dados do banco"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

