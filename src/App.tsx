/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { SefazCertificateManager } from './components/modules/SefazCertificateManager';
import { MaintenanceModule } from './components/modules/MaintenanceModule';
import { ApiSettings } from './components/modules/ApiSettings';
import { XmlUploaderModal } from './components/modules/XmlUploaderModal';
import { Reports } from './components/modules/Reports';
import { MOCK_MOV_RES, MOCK_CONSOLIDADO } from './services/mockData';

import { SefazInvoice, PdvProduct, ApiConfig, MkpConfig, SefazCertificate } from './types';
import { PdvApiService } from './services/apiService';
import { SefazSyncService } from './services/sefazSyncService';
import { FirestoreDbService } from './services/firestoreDbService';

export default function App() {
  const [certificates, setCertificates] = useState<SefazCertificate[]>([]);
  const [activeCertificate, setActiveCertificate] = useState<SefazCertificate | null>(SefazSyncService.getSavedCertificateSync());
  const [activeTab, setActiveTab] = useState<TabType>('certificado');
  const [invoices, setInvoices] = useState<SefazInvoice[]>([]);
  const [pdvProducts, setPdvProducts] = useState<PdvProduct[]>([]);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(PdvApiService.getConfig());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isXmlModalOpen, setIsXmlModalOpen] = useState<boolean>(false);

  const [mkpConfig, setMkpConfig] = useState<MkpConfig>({
    metaMkpPadrao: 2.20,
    tipoCalculo: 'MULTIPLICADOR',
    margemMinimaPercentual: 35,
    considerarImpostosNaVenda: true,
    aliquotaImpostoVendaPercentual: 12,
    despesasOperacionaisPercentual: 15
  });

  // Initial load from Cloud Firestore / Local Persistence
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch saved config, certificates, and invoices from Cloud DB / Local
      const [savedDbMkp, savedDbInvoices, savedDbProducts, savedCert, savedCertList] = await Promise.all([
        FirestoreDbService.getMkpConfig(),
        FirestoreDbService.getAllInvoices(),
        FirestoreDbService.getPdvProducts(),
        SefazSyncService.getSavedCertificate(),
        SefazSyncService.getAllCertificates()
      ]);

      if (savedDbMkp) setMkpConfig(savedDbMkp);
      
      if (savedDbProducts && savedDbProducts.length > 0) {
        setPdvProducts(savedDbProducts);
      }

      // 2. Load persisted real invoices from database
      if (savedDbInvoices) {
        setInvoices(savedDbInvoices);
      }

      // 3. Load certificates list
      if (savedCertList && savedCertList.length > 0) {
        setCertificates(savedCertList);
        if (!savedCert) {
          setActiveCertificate(savedCertList[0]);
        }
      }

      // 4. Load active certificate
      if (savedCert) {
        setActiveCertificate(savedCert);
      }

      // 5. Test connectivity in background
      PdvApiService.testConnection().then(() => {
        setApiConfig(PdvApiService.getConfig());
      });
    } catch (e) {
      console.error('[App Init Error]', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      const [savedDbInvoices, savedDbProducts, savedCert, savedCertList] = await Promise.all([
        FirestoreDbService.getAllInvoices(),
        FirestoreDbService.getPdvProducts(),
        SefazSyncService.getSavedCertificate(),
        SefazSyncService.getAllCertificates()
      ]);

      if (savedDbInvoices) setInvoices(savedDbInvoices);
      if (savedDbProducts) setPdvProducts(savedDbProducts);
      if (savedCertList) setCertificates(savedCertList);
      if (savedCert) setActiveCertificate(savedCert);
      
      await PdvApiService.testConnection();
      setApiConfig(PdvApiService.getConfig());
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInvoices = (newInvoices: SefazInvoice[]) => {
    setInvoices(newInvoices);
    FirestoreDbService.saveInvoices(newInvoices);
  };

  const handleClearAllInvoices = async () => {
    await SefazSyncService.clearAllInvoices();
    setInvoices([]);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      
      {/* Top Navbar */}
      <Navbar
        apiConfig={apiConfig}
        invoices={invoices}
        activeCertificate={activeCertificate}
        onNavigateToCertificate={() => setActiveTab('certificado')}
        onOpenXmlModal={() => setIsXmlModalOpen(true)}
        onRefreshData={handleRefreshData}
        isLoading={isLoading}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto border-x border-[#141414]">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          badgeCounts={{
            mkpAlerts: 0,
            missingProducts: 0,
            missingEan: 0,
            pendingInvoices: invoices.length,
            hasActiveCert: !!activeCertificate
          }}
        />

        {/* Content Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto bg-[#E4E3E0]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
            >
              {/* PRIMARY FOCUS: SEFAZ XML HUB & DIGITAL CERTIFICATE */}
              {activeTab === 'certificado' && (
                <SefazCertificateManager
                  certificates={certificates}
                  activeCertificate={activeCertificate}
                  onCertificatesChange={setCertificates}
                  onCertificateChange={setActiveCertificate}
                  invoices={invoices}
                  onInvoicesChange={handleUpdateInvoices}
                  onClearAllInvoices={handleClearAllInvoices}
                />
              )}

              {/* MODULES RESERVED & IN MAINTENANCE WITHOUT LAYOUTS / FAKES */}
              {activeTab === 'mkp' && (
                <MaintenanceModule
                  moduleName="Conferência de MKP (Markup & Custos)"
                  moduleCode="MKP-CONF"
                  description="Módulo reservado para conferência de preços de venda e markup com base nos XMLs consolidados. Aguardando definições de regras de negócio."
                  onNavigateToSefaz={() => setActiveTab('certificado')}
                />
              )}

              {activeTab === 'cadastro' && (
                <MaintenanceModule
                  moduleName="Cadastro de Produto (SEFAZ → PDV)"
                  moduleCode="CAD-PROD"
                  description="Módulo reservado para importação e cadastro automático de novos itens encontrados nos XMLs da SEFAZ diretamente no banco central."
                  onNavigateToSefaz={() => setActiveTab('certificado')}
                />
              )}

              {activeTab === 'ean' && (
                <MaintenanceModule
                  moduleName="Sincronização de Código EAN / Barras"
                  moduleCode="EAN-SYNC"
                  description="Módulo reservado para conciliação e inserção de códigos de barras (EAN/GTIN) extraídos dos XMLs para o cadastro unificado."
                  onNavigateToSefaz={() => setActiveTab('certificado')}
                />
              )}

              {activeTab === 'prazos' && (
                <MaintenanceModule
                  moduleName="Prazos de Pagamento & Duplicatas"
                  moduleCode="PAY-TERMS"
                  description="Módulo reservado para conferência de faturas, parcelas e prazos de vencimento emitidos nos XMLs oficiais da SEFAZ."
                  onNavigateToSefaz={() => setActiveTab('certificado')}
                />
              )}

              {activeTab === 'relatorios' && (
                <Reports
                  movRes={MOCK_MOV_RES}
                  consolidado={MOCK_CONSOLIDADO}
                  isLoading={isLoading}
                />
              )}

              {activeTab === 'liquidacao' && (
                <MaintenanceModule
                  moduleName="Sugestão de Liquidação"
                  moduleCode="CLEARANCE"
                  description="Módulo em manutenção. Aguardando parametrização das regras de liquidação."
                  onNavigateToSefaz={() => setActiveTab('certificado')}
                />
              )}

              {activeTab === 'remanejamento' && (
                <MaintenanceModule
                  moduleName="Sugestão de Remanejamento"
                  moduleCode="TRANSFER"
                  description="Módulo em manutenção. Aguardando parametrização das regras de remanejamento."
                  onNavigateToSefaz={() => setActiveTab('certificado')}
                />
              )}

              {activeTab === 'fotos' && (
                <MaintenanceModule
                  moduleName="Extração de Fotos por EAN / Código"
                  moduleCode="PHOTO-EXTRACT"
                  description="Módulo em manutenção. Aguardando definições de formato de armazenamento."
                  onNavigateToSefaz={() => setActiveTab('certificado')}
                />
              )}

              {activeTab === 'config' && (
                <ApiSettings
                  apiConfig={apiConfig}
                  onSaveApiConfig={(cfg) => setApiConfig(prev => ({ ...prev, ...cfg }))}
                  mkpConfig={mkpConfig}
                  onSaveMkpConfig={setMkpConfig}
                  onRefreshData={handleRefreshData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* XML Uploader Modal */}
      <XmlUploaderModal
        isOpen={isXmlModalOpen}
        onClose={() => setIsXmlModalOpen(false)}
        invoices={invoices}
        onInvoicesChange={handleUpdateInvoices}
        pdvProducts={pdvProducts}
        mkpConfig={mkpConfig}
      />

    </div>
  );
}
