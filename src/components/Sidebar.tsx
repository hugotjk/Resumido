import React from 'react';
import { 
  KeyRound,
  Calculator, 
  PackagePlus, 
  Barcode, 
  CalendarClock, 
  BarChart3, 
  TrendingDown, 
  ArrowLeftRight, 
  Image as ImageIcon, 
  Settings, 
  FileText,
  AlertCircle
} from 'lucide-react';

export type TabType = 
  | 'certificado'
  | 'mkp' 
  | 'cadastro' 
  | 'ean' 
  | 'prazos' 
  | 'relatorios' 
  | 'liquidacao' 
  | 'remanejamento' 
  | 'fotos' 
  | 'config';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  badgeCounts: {
    mkpAlerts: number;
    missingProducts: number;
    missingEan: number;
    pendingInvoices: number;
    hasActiveCert?: boolean;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  badgeCounts
}) => {
  const mainModules = [
    {
      id: 'certificado' as TabType,
      label: 'Certificado & SEFAZ',
      desc: 'Importar A1 & Puxar Faturamentos',
      icon: KeyRound,
      badge: badgeCounts.hasActiveCert ? 'A1 ATIVO' : 'IMPORTAR A1',
      badgeColor: badgeCounts.hasActiveCert ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
    },
    {
      id: 'mkp' as TabType,
      label: 'Conferência de MKP',
      desc: 'Markup, custos e preços de venda',
      icon: Calculator,
      badge: badgeCounts.mkpAlerts > 0 ? `${badgeCounts.mkpAlerts} alertas` : null,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    },
    {
      id: 'cadastro' as TabType,
      label: 'Cadastro de Produto',
      desc: 'Itens da SEFAZ não cadastrados',
      icon: PackagePlus,
      badge: badgeCounts.missingProducts > 0 ? `${badgeCounts.missingProducts} novos` : null,
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
    },
    {
      id: 'ean' as TabType,
      label: 'Colocar EAN',
      desc: 'Sincronizar código de barras',
      icon: Barcode,
      badge: badgeCounts.missingEan > 0 ? `${badgeCounts.missingEan} sem EAN` : null,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    },
    {
      id: 'prazos' as TabType,
      label: 'Prazos de Pagamento',
      desc: 'Duplicatas e vencimentos SEFAZ',
      icon: CalendarClock,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'relatorios' as TabType,
      label: 'Relatórios Gerenciais',
      desc: 'Mov Res & Consolidado',
      icon: BarChart3,
      badge: null,
      badgeColor: ''
    }
  ];

  const advancedModules = [
    {
      id: 'liquidacao' as TabType,
      label: 'Sugestão de Liquidação',
      desc: 'Queima de estoque parado',
      icon: TrendingDown
    },
    {
      id: 'remanejamento' as TabType,
      label: 'Sugestão de Remanejamento',
      desc: 'Transferência entre filiais',
      icon: ArrowLeftRight
    },
    {
      id: 'fotos' as TabType,
      label: 'Extrair Fotos para Sistema',
      desc: 'Renomeador por EAN/Código',
      icon: ImageIcon
    },
    {
      id: 'config' as TabType,
      label: 'Configurações & Swagger',
      desc: 'API PDV e conexões',
      icon: Settings
    }
  ];

  return (
    <aside id="main-sidebar" className="w-full lg:w-64 bg-[#F0EFED] border-r border-[#141414] flex flex-col shrink-0 text-[#141414]">
      
      {/* Primary Modules Group */}
      <div className="p-3 space-y-1">
        <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/60 border-b border-[#141414]/15 mb-1.5">
          Módulos Principais
        </div>

        {mainModules.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-start space-x-2.5 px-2.5 py-2 rounded-sm text-left transition-all duration-100 group border ${
                isActive 
                  ? 'bg-[#141414] text-[#E4E3E0] border-[#141414]' 
                  : 'text-[#141414] hover:bg-[#E4E3E0] border-transparent hover:border-[#141414]/20'
              }`}
            >
              <div className={`p-1 rounded-xs shrink-0 transition-colors ${
                isActive 
                  ? 'bg-[#E4E3E0] text-[#141414]' 
                  : 'bg-[#E4E3E0] text-[#141414] group-hover:bg-[#141414] group-hover:text-[#E4E3E0]'
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold truncate uppercase tracking-tight ${isActive ? 'text-[#E4E3E0]' : 'text-[#141414]'}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1 py-0.2 rounded-xs font-bold uppercase tracking-wider border ${
                      isActive
                        ? 'bg-[#E4E3E0] text-[#141414] border-[#E4E3E0]'
                        : 'bg-[#141414] text-[#E4E3E0] border-[#141414]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-[#E4E3E0]/70' : 'text-[#141414]/60'}`}>
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Advanced / Planejamento Modules Group */}
      <div className="p-3 pt-2 space-y-1 border-t border-[#141414]">
        <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/60 border-b border-[#141414]/15 mb-1.5">
          Planejamento & Automação
        </div>

        {advancedModules.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-start space-x-2.5 px-2.5 py-1.5 rounded-sm text-left transition-all duration-100 group border ${
                isActive 
                  ? 'bg-[#141414] text-[#E4E3E0] border-[#141414]' 
                  : 'text-[#141414] hover:bg-[#E4E3E0] border-transparent hover:border-[#141414]/20'
              }`}
            >
              <div className={`p-1 rounded-xs shrink-0 transition-colors ${
                isActive 
                  ? 'bg-[#E4E3E0] text-[#141414]' 
                  : 'bg-[#E4E3E0] text-[#141414] group-hover:bg-[#141414] group-hover:text-[#E4E3E0]'
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-bold truncate block uppercase tracking-tight ${isActive ? 'text-[#E4E3E0]' : 'text-[#141414]'}`}>
                  {item.label}
                </span>
                <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-[#E4E3E0]/70' : 'text-[#141414]/60'}`}>
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

    </aside>
  );
};
