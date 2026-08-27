import { SefazInvoice, SefazItem, SefazDuplicata, SefazPagamento, PdvProduct, MkpConfig } from '../types';

/**
 * Robust SEFAZ NF-e XML Parser (Layout 4.00)
 */
export class SefazXmlParser {

  public static parseXmlString(xmlContent: string, pdvProducts: PdvProduct[] = [], mkpConfig?: MkpConfig): SefazInvoice {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

    // Check for parse errors
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      throw new Error(`Erro ao interpretar XML da SEFAZ: ${parseError.textContent}`);
    }

    const defaultMkp = mkpConfig?.metaMkpPadrao || 2.2;

    // Root node infNFe
    const infNFe = xmlDoc.querySelector("infNFe") || xmlDoc.querySelector("NFe") || xmlDoc.documentElement;
    const chaveAcesso = infNFe?.getAttribute("Id")?.replace(/^NFe/, "") || 
      xmlDoc.querySelector("chNFe")?.textContent || 
      `352608${Math.floor(10000000000000 + Math.random() * 90000000000000)}550010000012341234567890`;

    // IDE info
    const ide = xmlDoc.querySelector("ide");
    const nNF = ide?.querySelector("nNF")?.textContent || "000123";
    const serie = ide?.querySelector("serie")?.textContent || "1";
    const dhEmi = ide?.querySelector("dhEmi")?.textContent || ide?.querySelector("dEmi")?.textContent || new Date().toISOString();

    // Emitente
    const emit = xmlDoc.querySelector("emit");
    const emitCnpj = emit?.querySelector("CNPJ")?.textContent || emit?.querySelector("CPF")?.textContent || "12.345.678/0001-90";
    const emitNome = emit?.querySelector("xNome")?.textContent || "FORNECEDOR CONFECCOES BRASIL LTDA";
    const emitFant = emit?.querySelector("xFant")?.textContent || emitNome;
    const emitIE = emit?.querySelector("IE")?.textContent || "";
    const emitUF = emit?.querySelector("enderEmit > UF")?.textContent || "SP";
    const emitMun = emit?.querySelector("enderEmit > xMun")?.textContent || "São Paulo";

    // Destinatário
    const dest = xmlDoc.querySelector("dest");
    const destCnpj = dest?.querySelector("CNPJ")?.textContent || dest?.querySelector("CPF")?.textContent || "";
    const destNome = dest?.querySelector("xNome")?.textContent || "MINHA LOJA MATRIZ";
    const destIE = dest?.querySelector("IE")?.textContent || "";
    const destUF = dest?.querySelector("enderDest > UF")?.textContent || "SP";

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

      // Custo Real Unitário na Entrada = (vProd + vFrete + vSeg + vOutro + vIPI + vICMSST - vDesc) / qCom
      const custoTotalItem = (vProd + vFrete + vSeg + vOutro + vIPI + vICMSST) - vDesc;
      const custoLiquidoUnitario = qCom > 0 ? (custoTotalItem / qCom) : vUnCom;

      // Clean EANs
      const validEan = (cEAN && cEAN.toUpperCase() !== "SEM GTIN" && cEAN !== "0" && cEAN.length >= 8) ? cEAN : "";

      // Match with PDV Products
      let matchedPdvProduct: PdvProduct | null = null;
      let matchStatus: SefazItem['statusMatch'] = 'NAO_CADASTRADO';

      if (pdvProducts && pdvProducts.length > 0) {
        // 1. Try matching by valid EAN
        if (validEan) {
          matchedPdvProduct = pdvProducts.find(p => p.ean && p.ean === validEan) || null;
        }

        // 2. Try matching by supplier code / ref / internal code
        if (!matchedPdvProduct && cProd) {
          matchedPdvProduct = pdvProducts.find(p => 
            p.codigo.toLowerCase() === cProd.toLowerCase() || 
            (p.referencia && p.referencia.toLowerCase() === cProd.toLowerCase())
          ) || null;
        }

        // 3. Try matching by product description (fuzzy/exact)
        if (!matchedPdvProduct && xProd) {
          const normXProd = xProd.trim().toLowerCase();
          matchedPdvProduct = pdvProducts.find(p => 
            p.descricao.trim().toLowerCase() === normXProd ||
            normXProd.includes(p.descricao.trim().toLowerCase()) ||
            p.descricao.trim().toLowerCase().includes(normXProd)
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

      // Markup calculations
      const precoVendaAtual = matchedPdvProduct ? matchedPdvProduct.precoVenda : (custoLiquidoUnitario * defaultMkp);
      const mkpAtual = (custoLiquidoUnitario > 0 && precoVendaAtual > 0) ? (precoVendaAtual / custoLiquidoUnitario) : defaultMkp;
      const precoSugerido = custoLiquidoUnitario * defaultMkp;
      const margemBrutaPercentual = precoVendaAtual > 0 ? (((precoVendaAtual - custoLiquidoUnitario) / precoVendaAtual) * 100) : 0;

      let statusMkp: SefazItem['statusMkp'] = 'NA_META';
      if (precoVendaAtual < custoLiquidoUnitario) {
        statusMkp = 'PREJUIZO';
      } else if (mkpAtual < defaultMkp * 0.92) {
        statusMkp = 'ABAIXO_META';
      } else if (mkpAtual > defaultMkp * 1.15) {
        statusMkp = 'ACIMA_META';
      } else {
        statusMkp = 'NA_META';
      }

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
        statusMkp
      });
    });

    // Duplicatas (<cobr><dup>)
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

    // If no explicit <dup>, check <pag>
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

    // Summary of payment condition (e.g. 30/60/90)
    let condicaoPagamentoDeclarada = "À Vista";
    if (duplicatas.length > 0) {
      condicaoPagamentoDeclarada = duplicatas.map(d => `${d.diasPrazo}d`).join(" / ");
    }

    const prazoMedioDias = duplicatas.length > 0 ? 
      Math.round(duplicatas.reduce((acc, d) => acc + (d.diasPrazo || 0), 0) / duplicatas.length) : 0;

    return {
      id: chaveAcesso ? `NFE-${chaveAcesso}` : `NFE-${nNF}-${serie}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      chaveAcesso,
      numero: nNF,
      serie,
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
      xmlRaw: xmlContent
    };
  }

  /**
   * Generates realistic sample SEFAZ NF-e XMLs for testing
   */
  public static generateSampleInvoices(pdvProducts: PdvProduct[]): SefazInvoice[] {
    const sampleXml1 = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260812345678000190550010000045211009876543" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>00987654</cNF>
        <natOp>VENDA DE MERCADORIA ADQUIRIDA DE TERCEIROS</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>4521</nNF>
        <dhEmi>2026-08-25T09:30:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
      </ide>
      <emit>
        <CNPJ>12345678000190</CNPJ>
        <xNome>DUDALINA &amp; CIA TEXTIL S.A.</xNome>
        <xFant>DUDALINA TEXTIL</xFant>
        <enderEmit>
          <xLgr>AVENIDA PAULISTA</xLgr>
          <nro>1500</nro>
          <xBairro>BELA VISTA</xBairro>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>01310100</CEP>
        </enderEmit>
        <IE>110042456112</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>98765432000155</CNPJ>
        <xNome>VAREJO BRASIL MODA LTDA - MATRIZ</xNome>
        <enderDest>
          <xLgr>RUA XV DE NOVEMBRO</xLgr>
          <nro>250</nro>
          <xBairro>CENTRO</xBairro>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
        </enderDest>
        <IE>112233445566</IE>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>CAM-POLO-AZ</cProd>
          <cEAN>7891234560011</cEAN>
          <xProd>CAMISA POLO MASCULINA PIQUET AZUL MARINHO - G</xProd>
          <NCM>61051000</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>30.0000</qCom>
          <vUnCom>55.0000</vUnCom>
          <vProd>1650.00</vProd>
          <cEANTrib>7891234560011</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>30.0000</qTrib>
          <vUnTrib>55.0000</vUnTrib>
          <vFrete>45.00</vFrete>
          <vIPI>82.50</vIPI>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>1650.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>297.00</vICMS>
            </ICMS00>
          </ICMS>
          <IPI>
            <IPITrib>
              <CST>50</CST>
              <vBC>1650.00</vBC>
              <pIPI>5.00</pIPI>
              <vIPI>82.50</vIPI>
            </IPITrib>
          </IPI>
        </imposto>
      </det>
      <det nItem="2">
        <prod>
          <cProd>VES-MIDI-FL</cProd>
          <cEAN>7898765432109</cEAN>
          <xProd>VESTIDO MIDI ESTAMPADO FLORAL VISCOSE - M</xProd>
          <NCM>62044200</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>15.0000</qCom>
          <vUnCom>92.0000</vUnCom>
          <vProd>1380.00</vProd>
          <cEANTrib>7898765432109</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>15.0000</qTrib>
          <vUnTrib>92.0000</vUnTrib>
          <vFrete>30.00</vFrete>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <vBC>1380.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>248.40</vICMS>
            </ICMS00>
          </ICMS>
        </imposto>
      </det>
      <det nItem="3">
        <prod>
          <cProd>NOV-REG-LINHO</cProd>
          <cEAN>7899988771122</cEAN>
          <xProd>REGATA FEMININA LINHO PURO BREEZE NATURAL - P</xProd>
          <NCM>62064000</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>25.0000</qCom>
          <vUnCom>48.0000</vUnCom>
          <vProd>1200.00</vProd>
          <cEANTrib>7899988771122</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>25.0000</qTrib>
          <vUnTrib>48.0000</vUnTrib>
          <vFrete>25.00</vFrete>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <vBC>1200.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>216.00</vICMS>
            </ICMS00>
          </ICMS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>4230.00</vBC>
          <vICMS>761.40</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>4230.00</vProd>
          <vFrete>100.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>82.50</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>70.00</vPIS>
          <vCOFINS>322.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>4412.50</vNF>
        </ICMSTot>
      </total>
      <cobr>
        <fat>
          <nFat>4521</nFat>
          <vOrig>4412.50</vOrig>
          <vLiq>4412.50</vLiq>
        </fat>
        <dup>
          <nDup>001</nDup>
          <dVenc>2026-09-24</dVenc>
          <vDup>1470.83</vDup>
        </dup>
        <dup>
          <nDup>002</nDup>
          <dVenc>2026-10-24</dVenc>
          <vDup>1470.83</vDup>
        </dup>
        <dup>
          <nDup>003</nDup>
          <dVenc>2026-11-23</dVenc>
          <vDup>1470.84</vDup>
        </dup>
      </cobr>
      <pag>
        <detPag>
          <tPag>15</tPag>
          <vPag>4412.50</vPag>
        </detPag>
      </pag>
    </infNFe>
  </NFe>
</nfeProc>`;

    const sampleXml2 = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260888999000000144550010000088721001122334" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>00112233</cNF>
        <natOp>VENDA DE CALCADOS E ACESSORIOS</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>8872</nNF>
        <dhEmi>2026-08-26T14:15:00-03:00</dhEmi>
        <tpNF>1</tpNF>
      </ide>
      <emit>
        <CNPJ>88999000000144</CNPJ>
        <xNome>OLYMPIKUS CALCADOS DO BRASIL S.A.</xNome>
        <xFant>VULCABRAS OLYMPIKUS</xFant>
        <enderEmit>
          <xLgr>RODOVIA RS 239</xLgr>
          <nro>1000</nro>
          <xMun>PAROBE</xMun>
          <UF>RS</UF>
        </enderEmit>
        <IE>0987654321</IE>
      </emit>
      <dest>
        <CNPJ>98765432000155</CNPJ>
        <xNome>VAREJO BRASIL MODA LTDA - MATRIZ</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>TEN-CAS-BR</cProd>
          <cEAN>7891234567890</cEAN>
          <xProd>TENIS CASUAL UNISSEX COURO SINTETICO BRANCO - 41</xProd>
          <NCM>64041100</NCM>
          <CFOP>5102</CFOP>
          <uCom>PAR</uCom>
          <qCom>20.0000</qCom>
          <vUnCom>115.0000</vUnCom>
          <vProd>2300.00</vProd>
          <vFrete>60.00</vFrete>
          <vIPI>115.00</vIPI>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>NOV-MOCH-URB</cProd>
          <cEAN>7894561230099</cEAN>
          <xProd>MOCHILA URBANA IMPERMEAVEL NOTEBOOK 15.6 POL - PRETA</xProd>
          <NCM>42029200</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>10.0000</qCom>
          <vUnCom>78.0000</vUnCom>
          <vProd>780.00</vProd>
          <vFrete>20.00</vFrete>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vProd>3080.00</vProd>
          <vFrete>80.00</vFrete>
          <vIPI>115.00</vIPI>
          <vNF>3275.00</vNF>
        </ICMSTot>
      </total>
      <cobr>
        <dup>
          <nDup>001</nDup>
          <dVenc>2026-09-25</dVenc>
          <vDup>1637.50</vDup>
        </dup>
        <dup>
          <nDup>002</nDup>
          <dVenc>2026-10-25</dVenc>
          <vDup>1637.50</vDup>
        </dup>
      </cobr>
    </infNFe>
  </NFe>
</nfeProc>`;

    return [
      SefazXmlParser.parseXmlString(sampleXml1, pdvProducts),
      SefazXmlParser.parseXmlString(sampleXml2, pdvProducts)
    ];
  }
}
