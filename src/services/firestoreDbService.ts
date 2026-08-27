import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import { SefazCertificate, SefazInvoice, SefazFaturamentoReport, PdvProduct, MkpConfig, ApiConfig } from '../types';

export class FirestoreDbService {
  
  // ==========================================
  // CERTIFICATES
  // ==========================================
  
  public static async saveActiveCertificate(cert: SefazCertificate): Promise<void> {
    try {
      const cleanCnpj = cert.cnpj.replace(/\D/g, '') || 'default_cert';
      const certRef = doc(db, 'certificates', cleanCnpj);
      await setDoc(certRef, {
        ...cert,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Mark as current active
      const activeRef = doc(db, 'system_config', 'active_certificate');
      await setDoc(activeRef, {
        activeCnpj: cleanCnpj,
        certificate: cert,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Failed to save certificate:', err);
    }
  }

  public static async getActiveCertificate(): Promise<SefazCertificate | null> {
    try {
      const activeRef = doc(db, 'system_config', 'active_certificate');
      const snap = await getDoc(activeRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.certificate) return data.certificate as SefazCertificate;
      }
    } catch (err) {
      console.warn('[Firestore] Failed to get active certificate:', err);
    }
    return null;
  }

  public static async removeActiveCertificate(): Promise<void> {
    try {
      const activeRef = doc(db, 'system_config', 'active_certificate');
      await deleteDoc(activeRef);
    } catch (err) {
      console.warn('[Firestore] Failed to remove certificate:', err);
    }
  }

  // ==========================================
  // INVOICES (NOTAS FISCAIS)
  // ==========================================

  public static async saveInvoices(invoices: SefazInvoice[]): Promise<void> {
    if (!invoices || invoices.length === 0) return;
    try {
      // Use batches of max 500
      const batch = writeBatch(db);
      for (const inv of invoices) {
        const docId = inv.chaveAcesso || inv.id;
        if (!docId) continue;
        const invRef = doc(db, 'invoices', docId);
        batch.set(invRef, {
          ...inv,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      await batch.commit();
    } catch (err) {
      console.warn('[Firestore] Failed to save invoices batch:', err);
    }
  }

  public static async getAllInvoices(): Promise<SefazInvoice[]> {
    try {
      const invoicesColl = collection(db, 'invoices');
      const q = query(invoicesColl, limit(200));
      const snap = await getDocs(q);
      const list: SefazInvoice[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as SefazInvoice);
      });
      return list;
    } catch (err) {
      console.warn('[Firestore] Failed to fetch invoices:', err);
      return [];
    }
  }

  public static async deleteInvoice(chaveAcessoOrId: string): Promise<void> {
    try {
      const invRef = doc(db, 'invoices', chaveAcessoOrId);
      await deleteDoc(invRef);
    } catch (err) {
      console.warn('[Firestore] Failed to delete invoice:', err);
    }
  }

  // ==========================================
  // FATURAMENTO SEFAZ CACHE
  // ==========================================

  public static async saveFaturamentoReport(report: SefazFaturamentoReport): Promise<void> {
    try {
      const cleanCnpj = report.cnpj.replace(/\D/g, '') || 'default_faturamento';
      const docRef = doc(db, 'faturamento_reports', cleanCnpj);
      await setDoc(docRef, {
        ...report,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Also persist invoices extracted from this report
      const allInvs = [...report.notasRecebidas, ...report.notasEmitidas];
      if (allInvs.length > 0) {
        await this.saveInvoices(allInvs);
      }
    } catch (err) {
      console.warn('[Firestore] Failed to save faturamento report:', err);
    }
  }

  public static async getLatestFaturamentoReport(cnpj?: string): Promise<SefazFaturamentoReport | null> {
    try {
      if (cnpj) {
        const cleanCnpj = cnpj.replace(/\D/g, '');
        const docRef = doc(db, 'faturamento_reports', cleanCnpj);
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data() as SefazFaturamentoReport;
      } else {
        const coll = collection(db, 'faturamento_reports');
        const q = query(coll, limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs[0].data() as SefazFaturamentoReport;
        }
      }
    } catch (err) {
      console.warn('[Firestore] Failed to get faturamento report:', err);
    }
    return null;
  }

  // ==========================================
  // PDV PRODUCTS CATALOG
  // ==========================================

  public static async savePdvProducts(products: PdvProduct[]): Promise<void> {
    if (!products || products.length === 0) return;
    try {
      const batch = writeBatch(db);
      for (const prod of products) {
        const prodId = prod.id || prod.codigo;
        if (!prodId) continue;
        const prodRef = doc(db, 'pdv_products', String(prodId));
        batch.set(prodRef, {
          ...prod,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      await batch.commit();
    } catch (err) {
      console.warn('[Firestore] Failed to save products to DB:', err);
    }
  }

  public static async getPdvProducts(): Promise<PdvProduct[]> {
    try {
      const coll = collection(db, 'pdv_products');
      const q = query(coll, limit(300));
      const snap = await getDocs(q);
      const list: PdvProduct[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as PdvProduct);
      });
      return list;
    } catch (err) {
      console.warn('[Firestore] Failed to load products from DB:', err);
      return [];
    }
  }

  // ==========================================
  // CONFIGURATIONS (MKP & API)
  // ==========================================

  public static async saveMkpConfig(config: MkpConfig): Promise<void> {
    try {
      const configRef = doc(db, 'system_config', 'mkp_settings');
      await setDoc(configRef, {
        ...config,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Failed to save MKP config:', err);
    }
  }

  public static async getMkpConfig(): Promise<MkpConfig | null> {
    try {
      const configRef = doc(db, 'system_config', 'mkp_settings');
      const snap = await getDoc(configRef);
      if (snap.exists()) return snap.data() as MkpConfig;
    } catch (err) {
      console.warn('[Firestore] Failed to load MKP config:', err);
    }
    return null;
  }
}
