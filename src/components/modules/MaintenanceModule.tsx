import React from 'react';
import { Wrench, Clock, Database, CheckCircle2, ShieldCheck, FileCode } from 'lucide-react';

interface MaintenanceModuleProps {
  moduleName: string;
  moduleCode: string;
  description?: string;
  onNavigateToSefaz?: () => void;
}

export const MaintenanceModule: React.FC<MaintenanceModuleProps> = ({
  moduleName,
  moduleCode,
  description,
  onNavigateToSefaz
}) => {
  return (
    <div className="space-y-4 font-mono">
      {/* Header Banner */}
      <div className="bg-[#F0EFED] p-4 sm:p-5 rounded-sm border border-[#141414] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-wider rounded-xs">
              MÓDULO EM MANUTENÇÃO
            </span>
            <span className="text-[10px] text-[#141414]/60 font-bold uppercase">
              CÓD: {moduleCode.toUpperCase()}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-[#141414] mt-1.5">
            {moduleName}
          </h2>
          <p className="text-xs text-[#141414]/70 mt-1 max-w-2xl font-sans">
            {description || "Este módulo está reservado e aguardando as definições de regras de negócio e consolidação. Nenhum dado mockado ou fictício está sendo exibido."}
          </p>
        </div>

        {onNavigateToSefaz && (
          <button
            onClick={onNavigateToSefaz}
            className="px-3.5 py-2 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] font-bold text-xs uppercase tracking-wider rounded-sm transition flex items-center space-x-2 shrink-0 border border-[#141414]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ir para Central SEFAZ XML</span>
          </button>
        )}
      </div>

      {/* Clean Maintenance State Box */}
      <div className="bg-[#F0EFED] border border-[#141414] rounded-sm p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border border-[#141414] bg-[#E4E3E0] flex items-center justify-center mx-auto text-[#141414]">
          <Wrench className="w-6 h-6" />
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-sm font-bold uppercase text-[#141414]">
            Layout e Regras em Definição
          </h3>
          <p className="text-xs text-[#141414]/70 font-sans leading-relaxed">
            Conforme solicitado, este módulo foi desativado temporariamente e mantido limpo (sem layouts fictícios ou dados de teste) enquanto estruturamos a consolidação total dos XMLs da SEFAZ e banco central.
          </p>
        </div>

        <div className="pt-4 max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-3 bg-[#E4E3E0] border border-[#141414] rounded-sm space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#141414] uppercase">
              <Database className="w-3.5 h-3.5" />
              <span>Banco Central</span>
            </div>
            <p className="text-[11px] text-[#141414]/70 font-sans">
              Pronto para receber a integração unificada de dados.
            </p>
          </div>

          <div className="p-3 bg-[#E4E3E0] border border-[#141414] rounded-sm space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#141414] uppercase">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#141414]" />
              <span>XMLs SEFAZ Reais</span>
            </div>
            <p className="text-[11px] text-[#141414]/70 font-sans">
              Central ativa para download e cópia de XMLs oficiais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
