/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { SefazCertificateManager } from './components/modules/SefazCertificateManager';
import { MkpConference } from './components/modules/MkpConference';
import { ProductRegistration } from './components/modules/ProductRegistration';
import { EanSync } from './components/modules/EanSync';
import { PaymentTermsConference } from './components/modules/PaymentTermsConference';
import { Reports } from './components/modules/Reports';
import { ClearanceSuggestion } from './components/modules/ClearanceSuggestion';
import { TransferSuggestion } from './components/modules/TransferSuggestion';
import { PhotoExtractor } from './components/modules/PhotoExtractor';
import { ApiSettings } from './components/modules/ApiSettings';
import { XmlUploaderModal } from './components/modules/XmlUploaderModal';

import { SefazInvoice, PdvProduct, ApiConfig, MkpConfig, ReportMovRes, ReportConsolidado, SefazCertificate } from './types';
import { PdvApiService } from './services/apiService';
import { SefazXmlParser } from './services/sefazParser';
import { SefazSyncService } from './services/sefazSyncService';
import { FirestoreDbService } from './services/firestoreDbService';
import { MOCK_MOV_RES, MOCK_CONSOLIDADO } from './services/mockData';

export default function App() {
  const [activeCertificate, setActiveCertificate] = useState<SefazCertificate | null>(SefazSyncService.getSavedCertificateSync());
  const [activeTab, setActiveTab] = useState<TabType>('certificado');
  const [invoices, setInvoices] = useState<SefazInvoice[]>([]);
  const [pdvProducts, setPdvProducts] = useState<PdvProduct[]>([]);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(PdvApiService.getConfig());
  const [selectedStore, setSelectedStore] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);

  const [mkpConfig, setMkpConfig] = useState<MkpConfig>({
    metaMkpPadrao: 2.20,
    tipoCalculo: 'MULTIPLICADOR',
    margemMinimaPercentual: 35,
    considerarImpostosNaVenda: true,
    aliquotaImpostoVendaPercentual: 12,
    despesasOperacionaisPercentual: 15
  });

  const [movRes, setMovRes] = useState<ReportMovRes>(MOCK_MOV_RES);
  const [consolidado, setConsolidado] = useState<ReportConsolidado>(MOCK_CONSOLIDADO);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch saved config and products from Cloud DB / Local
      const [savedDbMkp, savedDbInvoices, savedDbProducts, savedCert] = await Promise.all([
        FirestoreDbService.getMkpConfig(),
        FirestoreDbService.getAllInvoices(),
        FirestoreDbService.getPdvProducts(),
        SefazSyncService.getSavedCertificate()
      ]);

      if (savedDbMkp) setMkpConfig(savedDbMkp);
      
      let currentProducts = savedDbProducts;
      if (!currentProducts || currentProducts.length === 0) {
        currentProducts = await PdvApiService.getProducts();
        FirestoreDbService.savePdvProducts(currentProducts);
      }
      setPdvProducts(currentProducts);

      // 2. Load persisted invoices from database
      if (savedDbInvoices && savedDbInvoices.length > 0) {
        setInvoices(savedDbInvoices);
      }

      // 3. Load active certificate
      if (savedCert) {
        setActiveCertificate(savedCert);
        // If we don't have invoices yet, query or load from faturamento cache
        if (!savedDbInvoices || savedDbInvoices.length === 0) {
          const cachedReport = await FirestoreDbService.getLatestFaturamentoReport(savedCert.cnpj);
          if (cachedReport) {
            const allInvs = [...cachedReport.notasRecebidas, ...cachedReport.notasEmitidas];
            setInvoices(allInvs);
          } else {
            try {
              const report = await SefazSyncService.fetchSefazFaturamento(savedCert, currentProducts, savedDbMkp || mkpConfig);
              const allInvs = [...report.notasRecebidas, ...report.notasEmitidas];
              setInvoices(allInvs);
            } catch {
              // fallback
            }
          }
        }
      }

      // 4. Test connectivity in background
      PdvApiService.testConnection().then(res => {
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
      const prods = await PdvApiService.getProducts();
      setPdvProducts(prods);
      FirestoreDbService.savePdvProducts(prods);

      const resMov = await PdvApiService.getMovResReport(undefined, selectedStore);
      setMovRes(resMov);
      setApiConfig(PdvApiService.getConfig());

      if (activeCertificate) {
        const report = await SefazSyncService.fetchSefazFaturamento(activeCertificate, prods, mkpConfig);
        const allInvs = [...report.notasRecebidas, ...report.notasEmitidas];
        setInvoices(allInvs);
        FirestoreDbService.saveInvoices(allInvs);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyInvoicesToSystem = (newInvoices: SefazInvoice[]) => {
    setInvoices(newInvoices);
    FirestoreDbService.saveInvoices(newInvoices);
  };

  const handleLoadSampleInvoices = () => {
    const samples = SefazXmlParser.generateSampleInvoices(pdvProducts);
    setInvoices(samples);
    FirestoreDbService.saveInvoices(samples);
  };

  const handleApplyPriceToPdv = async (productId: string | number, newPrice: number, newCost: number) => {
    await PdvApiService.updateProductPrice(productId, newPrice, newCost);
    const updated = await PdvApiService.getProducts();
    setPdvProducts(updated);
    FirestoreDbService.savePdvProducts(updated);
  };

  const handleRegisterProduct = async (productData: Partial<PdvProduct>): Promise<PdvProduct> => {
    const created = await PdvApiService.createProduct(productData);
    const updated = await PdvApiService.getProducts();
    setPdvProducts(updated);
    FirestoreDbService.savePdvProducts(updated);
    return created;
  };

  const handleUpdateProductEan = async (productId: string | number, newEan: string): Promise<boolean> => {
    const ok = await PdvApiService.updateProductEan(productId, newEan);
    const updated = await PdvApiService.getProducts();
    setPdvProducts(updated);
    FirestoreDbService.savePdvProducts(updated);
    return ok;
  };

  const handleRefreshMovRes = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await PdvApiService.getMovResReport(date, selectedStore);
      setMovRes(res);
    } finally {
      setIsLoading(false);
    }
  };

  // Badge calculations for the sidebar
  const mkpAlertsCount = invoices.reduce((acc, inv) => {
    return acc + inv.itens.filter(item => {
      const custo = item.custoLiquidoUnitario;
      const precoVenda = item.pdvProduct ? item.pdvProduct.precoVenda : (custo * mkpConfig.metaMkpPadrao);
      const mkp = custo > 0 ? (precoVenda / custo) : mkpConfig.metaMkpPadrao;
      return mkp < mkpConfig.metaMkpPadrao * 0.95;
    }).length;
  }, 0);

  const missingProductsCount = invoices.reduce((acc, inv) => {
    return acc + inv.itens.filter(i => i.statusMatch === 'NAO_CADASTRADO').length;
  }, 0);

  const missingEanCount = pdvProducts.filter(p => !p.ean || p.ean.trim() === '').length;

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
        selectedStore={selectedStore}
        onSelectStore={setSelectedStore}
        onLoadSampleInvoices={handleLoadSampleInvoices}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto border-x border-[#141414]">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          badgeCounts={{
            mkpAlerts: mkpAlertsCount,
            missingProducts: missingProductsCount,
            missingEan: missingEanCount,
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
              {activeTab === 'certificado' && (
                <SefazCertificateManager
                  activeCertificate={activeCertificate}
                  onCertificateChange={setActiveCertificate}
                  onApplyInvoicesToSystem={handleApplyInvoicesToSystem}
                  pdvProducts={pdvProducts}
                  mkpConfig={mkpConfig}
                />
              )}

              {activeTab === 'mkp' && (
                <MkpConference
                  invoices={invoices}
                  mkpConfig={mkpConfig}
                  onUpdateMkpConfig={setMkpConfig}
                  onApplyPriceToPdv={handleApplyPriceToPdv}
                  onOpenXmlModal={() => setIsXmlModalOpen(true)}
                />
              )}

              {activeTab === 'cadastro' && (
                <ProductRegistration
                  invoices={invoices}
                  mkpConfig={mkpConfig}
                  onRegisterProduct={handleRegisterProduct}
                  onOpenXmlModal={() => setIsXmlModalOpen(true)}
                />
              )}

              {activeTab === 'ean' && (
                <EanSync
                  invoices={invoices}
                  pdvProducts={pdvProducts}
                  onUpdateProductEan={handleUpdateProductEan}
                  onOpenXmlModal={() => setIsXmlModalOpen(true)}
                />
              )}

              {activeTab === 'prazos' && (
                <PaymentTermsConference
                  invoices={invoices}
                  onOpenXmlModal={() => setIsXmlModalOpen(true)}
                />
              )}

              {activeTab === 'relatorios' && (
                <Reports
                  movRes={movRes}
                  consolidado={consolidado}
                  onRefreshMovRes={handleRefreshMovRes}
                  isLoading={isLoading}
                />
              )}

              {activeTab === 'liquidacao' && (
                <ClearanceSuggestion
                  onApplyPriceToPdv={handleApplyPriceToPdv}
                />
              )}

              {activeTab === 'remanejamento' && (
                <TransferSuggestion />
              )}

              {activeTab === 'fotos' && (
                <PhotoExtractor
                  pdvProducts={pdvProducts}
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
        onInvoicesChange={setInvoices}
        pdvProducts={pdvProducts}
        mkpConfig={mkpConfig}
        onLoadSamples={handleLoadSampleInvoices}
      />

    </div>
  );
}

