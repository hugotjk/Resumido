import { SefazInvoice, SefazItem, SefazDuplicata, SefazPagamento, PdvProduct, MkpConfig } from '../types';

/**
 * Robust SEFAZ NF-e & NFC-e XML Parser (Layout 4.00)
 */
export class SefazXmlParser {

  /**
   * Main XML parser for real SEFAZ NF-e documents
   */
  public static parseXml(xmlContent: string, pdvProducts: PdvProduct[] = [], mkpConfig?: MkpConfig): SefazInvoice | null {
    if (!xmlContent || typeof xmlContent !== 'string' || !xmlContent.trim()) {
      return null;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError) {
        console.warn("XML Parse warning:", parseError.textContent);
        // If it was wrapped inside other tags, try extracting
      }

      const defaultMkp = mkpConfig?.metaMkpPadrao || 2.2;

      // Locate root info
      const infNFe = xmlDoc.querySelector("infNFe") || xmlDoc.querySelector("NFe") || xmlDoc.documentElement;
      const chaveAcesso = infNFe?.getAttribute("Id")?.replace(/^NFe/, "") || 
        xmlDoc.querySelector("chNFe")?.textContent || 
        xmlDoc.querySelector("protNFe chNFe")?.textContent ||
        `35${new Date().getFullYear().toString().slice(-2)}${Math.floor(10000000000000 + Math.random() * 90000000000000)}550010000012341234567890`;

      // IDE (Identificação da NF-e)
      const ide = xmlDoc.querySelector("ide");
      const nNF = ide?.querySelector("nNF")?.textContent || "1";
      const serie = ide?.querySelector("serie")?.textContent || "1";
      const tpNF = ide?.querySelector("tpNF")?.textContent || "1"; // 0 = Entrada, 1 = Saída
      const tipoOperacao: 'ENTRADA' | 'SAIDA' = tpNF === '0' ? 'ENTRADA' : 'SAIDA';
      const dhEmi = ide?.querySelector("dhEmi")?.textContent || ide?.querySelector("dEmi")?.textContent || new Date().toISOString();

      // Emitente
      const emit = xmlDoc.querySelector("emit");
      const emitCnpj = emit?.querySelector("CNPJ")?.textContent || emit?.querySelector("CPF")?.textContent || "00.000.000/0000-00";
      const emitNome = emit?.querySelector("xNome")?.textContent || "EMITENTE SEFAZ";
      const emitFant = emit?.querySelector("xFant")?.textContent || emitNome;
      const emitIE = emit?.querySelector("IE")?.textContent || "";
      const emitUF = emit?.querySelector("enderEmit > UF")?.textContent || "SP";
      const emitMun = emit?.querySelector("enderEmit > xMun")?.textContent || "São Paulo";

      // Destinatário
      const dest = xmlDoc.querySelector("dest");
      const destCnpj = dest?.querySelector("CNPJ")?.textContent || dest?.querySelector("CPF")?.textContent || "";
      const destNome = dest?.querySelector("xNome")?.textContent || "DESTINATÁRIO";
      const destIE = dest?.querySelector("IE")?.textContent || "";
      const destUF = dest?.querySelector("enderDest > UF")?.textContent || "SP";
      const destMun = dest?.querySelector("enderDest > xMun")?.textContent || "";

      // Totais da NF
      const icmsTot = xmlDoc.querySelector("ICMSTot");
      const vProdTotal = parseFloat(icmsTot?.querySelector("vProd")?.textContent || "0");
      const vFreteTotal = parseFloat(icmsTot?.querySelector("vFrete")?.textContent || "0");
      const vSegTotal = parseFloat(icmsTot?.querySelector("vSeg")?.textContent || "0");
      const vDescTotal = parseFloat(icmsTot?.querySelector("vDesc")?.textContent || "0");
      const vOutroTotal = parseFloat(icmsTot?.querySelector("vOutro")?.textContent || "0");
      const vIPITotal = parseFloat(icmsTot?.querySelector("vIPI")?.textContent || "0");
      const vSTTotal = parseFloat(icmsTot?.querySelector("vST")?.textContent || "0");
      const vNFTotal = parseFloat(icmsTot?.querySelector("vNF")?.textContent || `${vProdTotal}`);

      // Itens (<det>)
      const detElements = xmlDoc.querySelectorAll("det");
      const itens: SefazItem[] = [];

      detElements.forEach((det, index) => {
        const nItem = parseInt(det.getAttribute("nItem") || `${index + 1}`);
        const prod = det.querySelector("prod");
        
        const cProd = prod?.querySelector("cProd")?.textContent || `ITEM-${nItem}`;
        const cEAN = prod?.querySelector("cEAN")?.textContent || "";
        const cEANTrib = prod?.querySelector("cEANTrib")?.textContent || "";
        const xProd = prod?.querySelector("xProd")?.textContent || `Produto ${nItem}`;
        const NCM = prod?.querySelector("NCM")?.textContent || "";
        const CEST = prod?.querySelector("CEST")?.textContent || "";
        const CFOP = prod?.querySelector("CFOP")?.textContent || "5102";
        const uCom = prod?.querySelector("uCom")?.textContent || "UN";
        const qCom = parseFloat(prod?.querySelector("qCom")?.textContent || "1");
        const vUnCom = parseFloat(prod?.querySelector("vUnCom")?.textContent || "0");
        const vProd = parseFloat(prod?.querySelector("vProd")?.textContent || `${qCom * vUnCom}`);
        const vFrete = parseFloat(prod?.querySelector("vFrete")?.textContent || "0");
        const vSeg = parseFloat(prod?.querySelector("vSeg")?.textContent || "0");
        const vDesc = parseFloat(prod?.querySelector("vDesc")?.textContent || "0");
        const vOutro = parseFloat(prod?.querySelector("vOutro")?.textContent || "0");

        // Impostos do item
        const imposto = det.querySelector("imposto");
        const vIPI = parseFloat(imposto?.querySelector("IPI > IPITrib > vIPI")?.textContent || "0");
        const vICMS = parseFloat(imposto?.querySelector("ICMS vICMS")?.textContent || "0");
        const vICMSST = parseFloat(imposto?.querySelector("ICMS vICMSST")?.textContent || "0");
        const vPIS = parseFloat(imposto?.querySelector("PIS vPIS")?.textContent || "0");
        const vCOFINS = parseFloat(imposto?.querySelector("COFINS vCOFINS")?.textContent || "0");

        // Custo Real Unitário na Entrada
        const custoTotalItem = (vProd + vFrete + vSeg + vOutro + vIPI + vICMSST) - vDesc;
        const custoLiquidoUnitario = qCom > 0 ? (custoTotalItem / qCom) : vUnCom;

        const validEan = (cEAN && cEAN.toUpperCase() !== "SEM GTIN" && cEAN !== "0" && cEAN.length >= 8) ? cEAN : "";

        // Match with PDV Products
        let matchedPdvProduct: PdvProduct | null = null;
        let matchStatus: SefazItem['statusMatch'] = 'NAO_CADASTRADO';

        if (pdvProducts && pdvProducts.length > 0) {
          if (validEan) {
            matchedPdvProduct = pdvProducts.find(p => p.ean && p.ean === validEan) || null;
          }
          if (!matchedPdvProduct && cProd) {
            matchedPdvProduct = pdvProducts.find(p => 
              p.codigo.toLowerCase() === cProd.toLowerCase() || 
              (p.referencia && p.referencia.toLowerCase() === cProd.toLowerCase())
            ) || null;
          }
        }

        if (matchedPdvProduct) {
          if (validEan && (!matchedPdvProduct.ean || matchedPdvProduct.ean.trim() === "")) {
            matchStatus = 'EAN_DIVERGENTE';
          } else if (Math.abs(matchedPdvProduct.custo - custoLiquidoUnitario) > 0.05) {
            matchStatus = 'CUSTO_ALTERADO';
          } else {
            matchStatus = 'CADASTRADO';
          }
        } else {
          matchStatus = 'NAO_CADASTRADO';
        }

        const precoVendaAtual = matchedPdvProduct ? matchedPdvProduct.precoVenda : (custoLiquidoUnitario * defaultMkp);
        const mkpAtual = (custoLiquidoUnitario > 0 && precoVendaAtual > 0) ? (precoVendaAtual / custoLiquidoUnitario) : defaultMkp;
        const precoSugerido = custoLiquidoUnitario * defaultMkp;
        const margemBrutaPercentual = precoVendaAtual > 0 ? (((precoVendaAtual - custoLiquidoUnitario) / precoVendaAtual) * 100) : 0;

        itens.push({
          nItem,
          cProd,
          cEAN: validEan || (cEAN || "SEM GTIN"),
          cEANTrib,
          xProd,
          NCM,
          CEST,
          CFOP,
          uCom,
          qCom,
          vUnCom,
          vProd,
          vFrete,
          vSeg,
          vDesc,
          vOutro,
          vIPI,
          vICMS,
          vICMSST,
          vPIS,
          vCOFINS,
          custoLiquidoUnitario: Number(custoLiquidoUnitario.toFixed(2)),
          pdvProduct: matchedPdvProduct,
          statusMatch: matchStatus,
          mkpAtual: Number(mkpAtual.toFixed(2)),
          mkpSugerido: defaultMkp,
          precoVendaAtual: Number(precoVendaAtual.toFixed(2)),
          precoSugerido: Number(precoSugerido.toFixed(2)),
          margemBrutaPercentual: Number(margemBrutaPercentual.toFixed(1)),
          statusMkp: 'NA_META'
        });
      });

      // Duplicatas
      const duplicatas: SefazDuplicata[] = [];
      const dupElements = xmlDoc.querySelectorAll("cobr > dup");
      const dataEmissaoDate = new Date(dhEmi);

      dupElements.forEach((dup, idx) => {
        const nDup = dup.querySelector("nDup")?.textContent || `${nNF}/${idx + 1}`;
        const dVenc = dup.querySelector("dVenc")?.textContent || "";
        const vDup = parseFloat(dup.querySelector("vDup")?.textContent || "0");

        let diasPrazo = 0;
        if (dVenc) {
          const vencDate = new Date(dVenc);
          const diffTime = vencDate.getTime() - dataEmissaoDate.getTime();
          diasPrazo = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
        }

        duplicatas.push({
          nDup,
          dVenc,
          vDup,
          diasPrazo,
          statusPrazo: 'OK'
        });
      });

      // Pagamentos
      const pagamentos: SefazPagamento[] = [];
      const detPagElements = xmlDoc.querySelectorAll("pag > detPag");
      
      detPagElements.forEach(pag => {
        const tPag = pag.querySelector("tPag")?.textContent || "99";
        const vPag = parseFloat(pag.querySelector("vPag")?.textContent || `${vNFTotal}`);
        const tPagMap: Record<string, string> = {
          "01": "Dinheiro",
          "02": "Cheque",
          "03": "Cartão de Crédito",
          "04": "Cartão de Débito",
          "14": "Duplicata Mercantil",
          "15": "Boleto Bancário",
          "17": "PIX",
          "90": "Sem Pagamento",
          "99": "Outros"
        };

        pagamentos.push({
          tPag,
          tPagDescricao: tPagMap[tPag] || `Outro (${tPag})`,
          vPag
        });
      });

      let condicaoPagamentoDeclarada = "À Vista";
      if (duplicatas.length > 0) {
        condicaoPagamentoDeclarada = duplicatas.map(d => `${d.diasPrazo}d`).join(" / ");
      }

      const prazoMedioDias = duplicatas.length > 0 ? 
        Math.round(duplicatas.reduce((acc, d) => acc + (d.diasPrazo || 0), 0) / duplicatas.length) : 0;

      return {
        id: chaveAcesso ? `NFE-${chaveAcesso}` : `NFE-${nNF}-${serie}-${Date.now()}`,
        chaveAcesso,
        numero: nNF,
        serie,
        tipoOperacao,
        dataEmissao: dhEmi,
        emitente: {
          cnpj: emitCnpj,
          xNome: emitNome,
          xFant: emitFant,
          ie: emitIE,
          uf: emitUF,
          municipio: emitMun
        },
        destinatario: {
          cnpj: destCnpj,
          xNome: destNome,
          ie: destIE,
          uf: destUF
        },
        totais: {
          vProd: Number(vProdTotal.toFixed(2)),
          vFrete: Number(vFreteTotal.toFixed(2)),
          vSeg: Number(vSegTotal.toFixed(2)),
          vDesc: Number(vDescTotal.toFixed(2)),
          vOutro: Number(vOutroTotal.toFixed(2)),
          vIPI: Number(vIPITotal.toFixed(2)),
          vST: Number(vSTTotal.toFixed(2)),
          vNF: Number(vNFTotal.toFixed(2))
        },
        itens,
        duplicatas,
        pagamentos,
        condicaoPagamentoDeclarada,
        prazoMedioDias,
        xmlRaw: xmlContent,
        xmlOriginal: xmlContent
      };
    } catch (err) {
      console.error("Error parsing SEFAZ XML:", err);
      return null;
    }
  }

  public static parseXmlString(xmlContent: string, pdvProducts: PdvProduct[] = [], mkpConfig?: MkpConfig): SefazInvoice {
    const res = this.parseXml(xmlContent, pdvProducts, mkpConfig);
    if (!res) {
      throw new Error("Não foi possível interpretar o arquivo XML da NF-e.");
    }
    return res;
  }

  /**
   * Generates a valid XML string representation of the invoice if original raw is absent
   */
  public static generateXml(invoice: SefazInvoice): string {
    if (invoice.xmlOriginal || invoice.xmlRaw) {
      return invoice.xmlOriginal || invoice.xmlRaw || '';
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${invoice.chaveAcesso}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>00${invoice.numero}</cNF>
        <natOp>${invoice.tipoOperacao === 'ENTRADA' ? 'COMPRA DE MERCADORIA' : 'VENDA DE MERCADORIA'}</natOp>
        <mod>55</mod>
        <serie>${invoice.serie}</serie>
        <nNF>${invoice.numero}</nNF>
        <dhEmi>${invoice.dataEmissao}</dhEmi>
        <tpNF>${invoice.tipoOperacao === 'ENTRADA' ? '0' : '1'}</tpNF>
      </ide>
      <emit>
        <CNPJ>${invoice.emitente.cnpj.replace(/\D/g, '')}</CNPJ>
        <xNome>${invoice.emitente.xNome}</xNome>
        <xFant>${invoice.emitente.xFant || invoice.emitente.xNome}</xFant>
        <enderEmit>
          <xMun>${invoice.emitente.municipio || 'SAO PAULO'}</xMun>
          <UF>${invoice.emitente.uf}</UF>
        </enderEmit>
        <IE>${invoice.emitente.ie || ''}</IE>
      </emit>
      <dest>
        <CNPJ>${invoice.destinatario.cnpj.replace(/\D/g, '')}</CNPJ>
        <xNome>${invoice.destinatario.xNome}</xNome>
        <enderDest>
          <UF>${invoice.destinatario.uf || 'SP'}</UF>
        </enderDest>
      </dest>
      ${invoice.itens.map((it) => `
      <det nItem="${it.nItem}">
        <prod>
          <cProd>${it.cProd}</cProd>
          <cEAN>${it.cEAN || 'SEM GTIN'}</cEAN>
          <xProd>${it.xProd}</xProd>
          <NCM>${it.NCM || '61051000'}</NCM>
          <CFOP>${it.CFOP || '5102'}</CFOP>
          <uCom>${it.uCom || 'UN'}</uCom>
          <qCom>${it.qCom.toFixed(4)}</qCom>
          <vUnCom>${it.vUnCom.toFixed(4)}</vUnCom>
          <vProd>${it.vProd.toFixed(2)}</vProd>
          <vFrete>${it.vFrete.toFixed(2)}</vFrete>
          <vIPI>${it.vIPI.toFixed(2)}</vIPI>
        </prod>
      </det>`).join('')}
      <total>
        <ICMSTot>
          <vProd>${invoice.totais.vProd.toFixed(2)}</vProd>
          <vFrete>${invoice.totais.vFrete.toFixed(2)}</vFrete>
          <vIPI>${invoice.totais.vIPI.toFixed(2)}</vIPI>
          <vNF>${invoice.totais.vNF.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
      ${invoice.duplicatas.length > 0 ? `
      <cobr>
        ${invoice.duplicatas.map(d => `
        <dup>
          <nDup>${d.nDup}</nDup>
          <dVenc>${d.dVenc}</dVenc>
          <vDup>${d.vDup.toFixed(2)}</vDup>
        </dup>`).join('')}
      </cobr>` : ''}
    </infNFe>
  </NFe>
</nfeProc>`;
  }
}
