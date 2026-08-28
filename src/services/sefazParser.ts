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
      const natOp = ide?.querySelector("natOp")?.textContent || "VENDA";

      // Protocolo de Autorização
      const infProt = xmlDoc.querySelector("protNFe > infProt") || xmlDoc.querySelector("infProt");
      const nProt = infProt?.querySelector("nProt")?.textContent || xmlDoc.querySelector("nProt")?.textContent || "";
      const dhRecbto = infProt?.querySelector("dhRecbto")?.textContent || xmlDoc.querySelector("dhRecbto")?.textContent || dhEmi;

      // Emitente
      const emit = xmlDoc.querySelector("emit");
      const emitCnpj = emit?.querySelector("CNPJ")?.textContent || emit?.querySelector("CPF")?.textContent || "00.000.000/0000-00";
      const emitNome = emit?.querySelector("xNome")?.textContent || "EMITENTE SEFAZ";
      const emitFant = emit?.querySelector("xFant")?.textContent || emitNome;
      const emitIE = emit?.querySelector("IE")?.textContent || "";
      const emitIM = emit?.querySelector("IM")?.textContent || "ISENTO";
      const emitIEST = emit?.querySelector("IEST")?.textContent || "";
      const emitUF = emit?.querySelector("enderEmit > UF")?.textContent || "SP";
      const emitMun = emit?.querySelector("enderEmit > xMun")?.textContent || "São Paulo";
      const emitLgr = emit?.querySelector("enderEmit > xLgr")?.textContent || "";
      const emitNro = emit?.querySelector("enderEmit > nro")?.textContent || "";
      const emitCpl = emit?.querySelector("enderEmit > xCpl")?.textContent || "";
      const emitBairro = emit?.querySelector("enderEmit > xBairro")?.textContent || "";
      const emitCEP = emit?.querySelector("enderEmit > CEP")?.textContent || "";
      const emitFone = emit?.querySelector("enderEmit > fone")?.textContent || "";

      // Destinatário
      const dest = xmlDoc.querySelector("dest");
      const destCnpj = dest?.querySelector("CNPJ")?.textContent || dest?.querySelector("CPF")?.textContent || "";
      const destNome = dest?.querySelector("xNome")?.textContent || "DESTINATÁRIO";
      const destIE = dest?.querySelector("IE")?.textContent || "";
      const destUF = dest?.querySelector("enderDest > UF")?.textContent || "SP";
      const destMun = dest?.querySelector("enderDest > xMun")?.textContent || "";
      const destLgr = dest?.querySelector("enderDest > xLgr")?.textContent || "";
      const destNro = dest?.querySelector("enderDest > nro")?.textContent || "";
      const destCpl = dest?.querySelector("enderDest > xCpl")?.textContent || "";
      const destBairro = dest?.querySelector("enderDest > xBairro")?.textContent || "";
      const destCEP = dest?.querySelector("enderDest > CEP")?.textContent || "";
      const destFone = dest?.querySelector("enderDest > fone")?.textContent || "";
      const destEmail = dest?.querySelector("email")?.textContent || "";

      // Local de Entrega (se houver)
      const entrega = xmlDoc.querySelector("entrega");
      let localEntrega: SefazInvoice['localEntrega'] = undefined;
      if (entrega) {
        localEntrega = {
          cnpj: entrega.querySelector("CNPJ")?.textContent || entrega.querySelector("CPF")?.textContent || "",
          xNome: entrega.querySelector("xNome")?.textContent || "",
          ie: entrega.querySelector("IE")?.textContent || "",
          logradouro: entrega.querySelector("xLgr")?.textContent || "",
          numero: entrega.querySelector("nro")?.textContent || "",
          complemento: entrega.querySelector("xCpl")?.textContent || "",
          bairro: entrega.querySelector("xBairro")?.textContent || "",
          cep: entrega.querySelector("CEP")?.textContent || "",
          municipio: entrega.querySelector("xMun")?.textContent || "",
          uf: entrega.querySelector("UF")?.textContent || "",
          fone: entrega.querySelector("fone")?.textContent || ""
        };
      }

      // Totais da NF
      const icmsTot = xmlDoc.querySelector("ICMSTot");
      const vBCICMSTotal = parseFloat(icmsTot?.querySelector("vBC")?.textContent || "0");
      const vICMSTotal = parseFloat(icmsTot?.querySelector("vICMS")?.textContent || "0");
      const vBCSTTotal = parseFloat(icmsTot?.querySelector("vBCST")?.textContent || "0");
      const vSTTotal = parseFloat(icmsTot?.querySelector("vST")?.textContent || "0");
      const vProdTotal = parseFloat(icmsTot?.querySelector("vProd")?.textContent || "0");
      const vFreteTotal = parseFloat(icmsTot?.querySelector("vFrete")?.textContent || "0");
      const vSegTotal = parseFloat(icmsTot?.querySelector("vSeg")?.textContent || "0");
      const vDescTotal = parseFloat(icmsTot?.querySelector("vDesc")?.textContent || "0");
      const vOutroTotal = parseFloat(icmsTot?.querySelector("vOutro")?.textContent || "0");
      const vIPITotal = parseFloat(icmsTot?.querySelector("vIPI")?.textContent || "0");
      const vPISTotal = parseFloat(icmsTot?.querySelector("vPIS")?.textContent || "0");
      const vCOFINSTotal = parseFloat(icmsTot?.querySelector("vCOFINS")?.textContent || "0");
      const vIITotal = parseFloat(icmsTot?.querySelector("vII")?.textContent || "0");
      const vTotTribTotal = parseFloat(xmlDoc.querySelector("vTotTrib")?.textContent || icmsTot?.querySelector("vTotTrib")?.textContent || "0");
      const vFCPUFDestTotal = parseFloat(icmsTot?.querySelector("vFCPUFDest")?.textContent || "0");
      const vICMSUFDestTotal = parseFloat(icmsTot?.querySelector("vICMSUFDest")?.textContent || "0");
      const vICMSUFRemetTotal = parseFloat(icmsTot?.querySelector("vICMSUFRemet")?.textContent || "0");
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
        const pIPI = parseFloat(imposto?.querySelector("IPI > IPITrib > pIPI")?.textContent || "0");
        const vICMS = parseFloat(imposto?.querySelector("ICMS vICMS")?.textContent || "0");
        const vBCICMS = parseFloat(imposto?.querySelector("ICMS vBC")?.textContent || "0");
        const pICMS = parseFloat(imposto?.querySelector("ICMS pICMS")?.textContent || "0");
        const cstICMS = imposto?.querySelector("ICMS CST")?.textContent || imposto?.querySelector("ICMS CSOSN")?.textContent || "000";
        const orig = imposto?.querySelector("ICMS orig")?.textContent || "0";
        const vICMSST = parseFloat(imposto?.querySelector("ICMS vICMSST")?.textContent || "0");
        const vBCST = parseFloat(imposto?.querySelector("ICMS vBCST")?.textContent || "0");
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
          pIPI,
          vICMS,
          pICMS,
          vBCICMS,
          cstICMS,
          orig,
          vICMSST,
          vBCST,
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

      // Transporte
      const transp = xmlDoc.querySelector("transp");
      const modFrete = transp?.querySelector("modFrete")?.textContent || "9";
      const modFreteMap: Record<string, string> = {
        "0": "0-Por conta do Rem",
        "1": "1-Por conta do Dest",
        "2": "2-Por conta de Terceiros",
        "3": "3-Próprio por conta do Rem",
        "4": "4-Próprio por conta do Dest",
        "9": "9-Sem Frete"
      };

      const transporta = transp?.querySelector("transporta");
      const veicTransp = transp?.querySelector("veicTransp");
      const vol = transp?.querySelector("vol");

      const transporte: SefazInvoice['transporte'] = {
        modFrete,
        modFreteDesc: modFreteMap[modFrete] || `Frete (${modFrete})`,
        transportador: transporta ? {
          cnpj: transporta.querySelector("CNPJ")?.textContent || transporta.querySelector("CPF")?.textContent || "",
          xNome: transporta.querySelector("xNome")?.textContent || "",
          ie: transporta.querySelector("IE")?.textContent || "",
          xEnder: transporta.querySelector("xEnder")?.textContent || "",
          xMun: transporta.querySelector("xMun")?.textContent || "",
          uf: transporta.querySelector("UF")?.textContent || ""
        } : undefined,
        veiculo: veicTransp ? {
          placa: veicTransp.querySelector("placa")?.textContent || "",
          uf: veicTransp.querySelector("UF")?.textContent || "",
          rntc: veicTransp.querySelector("RNTC")?.textContent || ""
        } : undefined,
        volumes: vol ? {
          qVol: parseFloat(vol.querySelector("qVol")?.textContent || "1"),
          esp: vol.querySelector("esp")?.textContent || "CAIXA(S)",
          marca: vol.querySelector("marca")?.textContent || "",
          nVol: vol.querySelector("nVol")?.textContent || "",
          pesoL: parseFloat(vol.querySelector("pesoL")?.textContent || "0"),
          pesoB: parseFloat(vol.querySelector("pesoB")?.textContent || "0")
        } : undefined
      };

      // Dados Adicionais
      const infAdic = xmlDoc.querySelector("infAdic");
      const infCpl = infAdic?.querySelector("infCpl")?.textContent || "";
      const infAdFisco = infAdic?.querySelector("infAdFisco")?.textContent || "";

      return {
        id: chaveAcesso ? `NFE-${chaveAcesso}` : `NFE-${nNF}-${serie}-${Date.now()}`,
        chaveAcesso,
        numero: nNF,
        serie,
        tipoOperacao,
        naturezaOperacao: natOp,
        protocoloAutorizacao: nProt ? {
          nProt,
          dhRecbto
        } : undefined,
        dataEmissao: dhEmi,
        emitente: {
          cnpj: emitCnpj,
          xNome: emitNome,
          xFant: emitFant,
          ie: emitIE,
          im: emitIM,
          ieST: emitIEST,
          uf: emitUF,
          municipio: emitMun,
          logradouro: emitLgr,
          numero: emitNro,
          complemento: emitCpl,
          bairro: emitBairro,
          cep: emitCEP,
          fone: emitFone
        },
        destinatario: {
          cnpj: destCnpj,
          xNome: destNome,
          ie: destIE,
          uf: destUF,
          municipio: destMun,
          logradouro: destLgr,
          numero: destNro,
          complemento: destCpl,
          bairro: destBairro,
          cep: destCEP,
          fone: destFone,
          email: destEmail
        },
        localEntrega,
        totais: {
          vProd: Number(vProdTotal.toFixed(2)),
          vFrete: Number(vFreteTotal.toFixed(2)),
          vSeg: Number(vSegTotal.toFixed(2)),
          vDesc: Number(vDescTotal.toFixed(2)),
          vOutro: Number(vOutroTotal.toFixed(2)),
          vIPI: Number(vIPITotal.toFixed(2)),
          vST: Number(vSTTotal.toFixed(2)),
          vBCST: Number(vBCSTTotal.toFixed(2)),
          vBCICMS: Number(vBCICMSTotal.toFixed(2)),
          vICMS: Number(vICMSTotal.toFixed(2)),
          vPIS: Number(vPISTotal.toFixed(2)),
          vCOFINS: Number(vCOFINSTotal.toFixed(2)),
          vII: Number(vIITotal.toFixed(2)),
          vTotTrib: Number(vTotTribTotal.toFixed(2)),
          vFCPUFDest: Number(vFCPUFDestTotal.toFixed(2)),
          vICMSUFDest: Number(vICMSUFDestTotal.toFixed(2)),
          vICMSUFRemet: Number(vICMSUFRemetTotal.toFixed(2)),
          vNF: Number(vNFTotal.toFixed(2))
        },
        transporte,
        dadosAdicionais: (infCpl || infAdFisco) ? {
          infCpl,
          infAdFisco
        } : undefined,
        statusNota: 'AUTORIZADA',
        temCartaCorrecao: false,
        totalCartasCorrecao: 0,
        cartasCorrecao: [],
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

  /**
   * Parses resNFe (Resumo de NF-e retornado na distribuição de DFe)
   */
  public static parseResNFe(xmlContent: string, nsu?: string): SefazInvoice | null {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const resNFe = xmlDoc.querySelector("resNFe");
      if (!resNFe) return null;

      const chNFe = resNFe.querySelector("chNFe")?.textContent || "";
      if (!chNFe) return null;

      const emitCnpj = resNFe.querySelector("CNPJ")?.textContent || resNFe.querySelector("CPF")?.textContent || "";
      const emitNome = resNFe.querySelector("xNome")?.textContent || "EMITENTE SEFAZ (RESUMO)";
      const emitIE = resNFe.querySelector("IE")?.textContent || "";
      const dhEmi = resNFe.querySelector("dhEmi")?.textContent || resNFe.querySelector("dEmi")?.textContent || new Date().toISOString();
      const tpNF = resNFe.querySelector("tpNF")?.textContent || "1";
      const vNF = parseFloat(resNFe.querySelector("vNF")?.textContent || "0");
      const cSitNFe = resNFe.querySelector("cSitNFe")?.textContent || "1"; // 1=Autorizada, 2=Denegada, 3=Cancelada

      let statusNota: 'AUTORIZADA' | 'CANCELADA' | 'DENEGADA' = 'AUTORIZADA';
      if (cSitNFe === "2") statusNota = 'DENEGADA';
      if (cSitNFe === "3") statusNota = 'CANCELADA';

      // Extract number & serie from 44-digit key if available
      // Pos 25-31: Serie (3 digits), Pos 26-34: Número (9 digits)
      let numero = "1";
      let serie = "1";
      if (chNFe.length === 44) {
        serie = parseInt(chNFe.substring(22, 25), 10).toString();
        numero = parseInt(chNFe.substring(25, 34), 10).toString();
      }

      return {
        id: `NFE-${chNFe}`,
        chaveAcesso: chNFe,
        numero,
        serie,
        tipoOperacao: tpNF === "0" ? "ENTRADA" : "SAIDA",
        statusNota,
        temCartaCorrecao: false,
        totalCartasCorrecao: 0,
        cartasCorrecao: [],
        dataEmissao: dhEmi,
        nsu: nsu || "",
        emitente: {
          cnpj: emitCnpj,
          xNome: emitNome,
          ie: emitIE,
          uf: "SP"
        },
        destinatario: {
          cnpj: "",
          xNome: "DESTINATÁRIO"
        },
        totais: {
          vProd: vNF,
          vFrete: 0,
          vSeg: 0,
          vDesc: 0,
          vOutro: 0,
          vIPI: 0,
          vST: 0,
          vNF: vNF
        },
        itens: [],
        duplicatas: [],
        pagamentos: [],
        condicaoPagamentoDeclarada: "Resumo SEFAZ (resNFe)",
        prazoMedioDias: 0,
        xmlRaw: xmlContent,
        xmlOriginal: xmlContent
      };
    } catch (err) {
      console.warn("Error parsing resNFe:", err);
      return null;
    }
  }

  /**
   * Parses Fiscal Events from SEFAZ:
   * - 110110: Carta de Correção Eletrônica (CC-e)
   * - 110111: Cancelamento de NF-e
   * - 110112: Cancelamento por Substituição
   * - 210200 / 210210 / 210220 / 210240: Manifestações
   */
  public static parseFiscalEvent(xmlContent: string, nsu?: string): import('../types').SefazFiscalEvent | null {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

      const evento = xmlDoc.querySelector("evento") || xmlDoc.querySelector("procEventoNFe") || xmlDoc.querySelector("resEvento") || xmlDoc.documentElement;
      if (!evento) return null;

      const infEvento = xmlDoc.querySelector("infEvento") || evento;
      const chNFe = infEvento.querySelector("chNFe")?.textContent || xmlDoc.querySelector("chNFe")?.textContent || "";
      if (!chNFe) return null;

      const tpEvento = infEvento.querySelector("tpEvento")?.textContent || "";
      const nSeqEvento = parseInt(infEvento.querySelector("nSeqEvento")?.textContent || "1", 10);
      const dhEvento = infEvento.querySelector("dhEvento")?.textContent || infEvento.querySelector("dhRecbto")?.textContent || new Date().toISOString();
      const xEvento = infEvento.querySelector("xEvento")?.textContent || "";
      const nProt = xmlDoc.querySelector("retEvento nProt")?.textContent || xmlDoc.querySelector("nProt")?.textContent || infEvento.querySelector("nProt")?.textContent || "";
      const cnpjInteressado = infEvento.querySelector("CNPJ")?.textContent || infEvento.querySelector("CPF")?.textContent || "";

      // Event-specific details
      const detEvento = xmlDoc.querySelector("detEvento");
      const xCorrecao = detEvento?.querySelector("xCorrecao")?.textContent || "";
      const xJust = detEvento?.querySelector("xJust")?.textContent || detEvento?.querySelector("xJustificativa")?.textContent || "";
      const xCondUso = detEvento?.querySelector("xCondUso")?.textContent || "";

      let tipoEvento: 'CCE' | 'CANCELAMENTO' | 'MANIFESTACAO' | 'EPEC' | 'OUTRO' = 'OUTRO';
      let descricaoEvento = xEvento || 'Evento Fiscal SEFAZ';

      if (tpEvento === '110110' || xEvento.toLowerCase().includes('correcao') || xCorrecao) {
        tipoEvento = 'CCE';
        descricaoEvento = `Carta de Correção Eletrônica (Seq #${nSeqEvento})`;
      } else if (tpEvento === '110111' || tpEvento === '110112' || xEvento.toLowerCase().includes('cancelamento')) {
        tipoEvento = 'CANCELAMENTO';
        descricaoEvento = 'Cancelamento de NF-e Homologado';
      } else if (tpEvento.startsWith('210')) {
        tipoEvento = 'MANIFESTACAO';
        descricaoEvento = xEvento || 'Manifestação do Destinatário';
      } else if (tpEvento === '110140') {
        tipoEvento = 'EPEC';
        descricaoEvento = 'EPEC - Emissão Prévia em Contingência';
      }

      const eventId = `EVT-${chNFe}-${tpEvento}-${nSeqEvento}-${nsu || Date.now()}`;

      return {
        id: eventId,
        nsu: nsu || "",
        chaveAcesso: chNFe,
        tipoEvento,
        tpEventoCodigo: tpEvento,
        descricaoEvento,
        nSeqEvento,
        dataHoraEvento: dhEvento,
        protocolo: nProt,
        detalhes: {
          xCorrecao: xCorrecao || undefined,
          xJustificativa: xJust || undefined,
          xCondUso: xCondUso || undefined
        },
        cnpjInteressado: cnpjInteressado || undefined,
        xmlRaw: xmlContent,
        createdAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn("Error parsing fiscal event XML:", err);
      return null;
    }
  }

  /**
   * Applies an event (CC-e, Cancelamento, etc.) onto a SefazInvoice
   */
  public static applyEventToInvoice(invoice: SefazInvoice, event: import('../types').SefazFiscalEvent): SefazInvoice {
    const updated = { ...invoice };

    if (!updated.eventosFiscais) {
      updated.eventosFiscais = [];
    }

    // Avoid duplicate event entries by id
    const existingEvtIndex = updated.eventosFiscais.findIndex(e => e.id === event.id || (e.tpEventoCodigo === event.tpEventoCodigo && e.nSeqEvento === event.nSeqEvento));
    if (existingEvtIndex >= 0) {
      updated.eventosFiscais[existingEvtIndex] = event;
    } else {
      updated.eventosFiscais.push(event);
    }

    // Handle CC-e (Carta de Correção)
    if (event.tipoEvento === 'CCE') {
      updated.temCartaCorrecao = true;
      if (!updated.cartasCorrecao) updated.cartasCorrecao = [];
      
      const cceEntry = {
        nSeqEvento: event.nSeqEvento,
        dhEvento: event.dataHoraEvento,
        xCorrecao: event.detalhes?.xCorrecao || 'Correção registrada na SEFAZ',
        nProt: event.protocolo
      };

      const cceIdx = updated.cartasCorrecao.findIndex(c => c.nSeqEvento === event.nSeqEvento);
      if (cceIdx >= 0) {
        updated.cartasCorrecao[cceIdx] = cceEntry;
      } else {
        updated.cartasCorrecao.push(cceEntry);
      }
      updated.totalCartasCorrecao = updated.cartasCorrecao.length;
    }

    // Handle Cancelamento
    if (event.tipoEvento === 'CANCELAMENTO') {
      updated.statusNota = 'CANCELADA';
      updated.cancelamento = {
        dhEvento: event.dataHoraEvento,
        nProt: event.protocolo || '',
        xJust: event.detalhes?.xJustificativa || 'Cancelamento homologado pela SEFAZ'
      };
    }

    updated.updatedAt = new Date().toISOString();
    return updated;
  }

  /**
   * Universal document parser dispatcher for SEFAZ distribution feed
   */
  public static parseDocument(
    xmlContent: string, 
    schema: string = "", 
    nsu: string = "", 
    pdvProducts: PdvProduct[] = [], 
    mkpConfig?: MkpConfig
  ): {
    type: 'NFE' | 'EVENTO' | 'RESUMO_NFE' | 'DESCONHECIDO';
    invoice?: SefazInvoice;
    event?: import('../types').SefazFiscalEvent;
  } {
    if (!xmlContent) return { type: 'DESCONHECIDO' };

    // Check if it is an event
    if (
      schema.includes('Evento') || 
      schema.includes('resEvento') || 
      xmlContent.includes('<procEventoNFe') || 
      xmlContent.includes('<resEvento') || 
      xmlContent.includes('<tpEvento>')
    ) {
      const event = this.parseFiscalEvent(xmlContent, nsu);
      if (event) {
        return { type: 'EVENTO', event };
      }
    }

    // Check if it is a full NF-e
    if (
      schema.includes('procNFe') || 
      xmlContent.includes('<infNFe') || 
      xmlContent.includes('<NFe>') ||
      xmlContent.includes('<nfeProc')
    ) {
      const invoice = this.parseXml(xmlContent, pdvProducts, mkpConfig);
      if (invoice) {
        if (nsu) invoice.nsu = nsu;
        return { type: 'NFE', invoice };
      }
    }

    // Check if it is a resNFe (resumo)
    if (schema.includes('resNFe') || xmlContent.includes('<resNFe')) {
      const invoice = this.parseResNFe(xmlContent, nsu);
      if (invoice) {
        return { type: 'RESUMO_NFE', invoice };
      }
    }

    // Fallback: try parsing as NF-e first, then event
    const fallbackNfe = this.parseXml(xmlContent, pdvProducts, mkpConfig);
    if (fallbackNfe) {
      if (nsu) fallbackNfe.nsu = nsu;
      return { type: 'NFE', invoice: fallbackNfe };
    }

    const fallbackEvt = this.parseFiscalEvent(xmlContent, nsu);
    if (fallbackEvt) {
      return { type: 'EVENTO', event: fallbackEvt };
    }

    return { type: 'DESCONHECIDO' };
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
