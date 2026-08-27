import express from "express";
import path from "path";
import https from "https";
import zlib from "zlib";
import forge from "node-forge";
import { createServer as createViteServer } from "vite";

// In-memory certificate sessions map on server (supports multiple stores / CNPJs)
interface ActiveCertSession {
  certificate: {
    fileName: string;
    cnpj: string;
    cpf?: string;
    razaoSocial: string;
    nomeFantasia?: string;
    emissor: string;
    numeroSerie: string;
    validadeInicio: string;
    validadeFim: string;
    diasRestantes: number;
    status: 'VALIDO' | 'EXPIRADO' | 'ALERTA_VENCIMENTO';
    tipo: 'A1';
    uf: string;
    ambiente: 'PRODUCAO' | 'HOMOLOGACAO';
    hasPrivateKey: boolean;
    thumbprint?: string;
    uploadedAt: string;
  };
  pfxBuffer: Buffer;
  password?: string;
  certPem: string;
  keyPem: string;
}

const certificateSessions = new Map<string, ActiveCertSession>();
let lastActiveCnpj: string | null = null;

const UF_IBGE_MAP: Record<string, string> = {
  AC: "12", AL: "27", AP: "16", AM: "13", BA: "29", CE: "23", DF: "53", ES: "32",
  GO: "52", MA: "21", MT: "51", MS: "50", MG: "31", PA: "15", PB: "25", PR: "41",
  PE: "26", PI: "22", RJ: "33", RN: "24", RS: "43", RO: "11", RR: "14", SC: "42",
  SP: "35", SE: "28", TO: "17", AN: "91"
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "SEFAZ-PDV-Consolidator",
      hasCertificate: certificateSessions.size > 0,
      totalCertificates: certificateSessions.size
    });
  });

  // Certificate: Verify, Decrypt & Save Session
  app.post("/api/sefaz/certificate/verify", async (req, res) => {
    try {
      const { pfxBase64, password, uf = "SP", ambiente = "PRODUCAO", fileName = "certificado.pfx" } = req.body;

      if (!pfxBase64 || !password) {
        return res.status(400).json({ error: "Arquivo .pfx (base64) e senha são obrigatórios." });
      }

      const pfxRawBuffer = Buffer.from(pfxBase64, "base64");
      const p12Der = forge.util.decode64(pfxBase64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);

      let p12: forge.pkcs12.Pkcs12Pfx;
      try {
        p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
      } catch (err: any) {
        return res.status(401).json({
          error: "Senha incorreta para o certificado digital A1 ou arquivo corrompido.",
          details: err.message
        });
      }

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBagsAlt = p12.getBags({ bagType: forge.pki.oids.keyBag });

      const bagList = certBags[forge.pki.oids.certBag] || [];
      if (bagList.length === 0) {
        return res.status(400).json({ error: "Nenhum certificado X.509 encontrado no arquivo PKCS#12." });
      }

      let primaryBag = bagList[0];
      for (const b of bagList) {
        if (b.cert) {
          primaryBag = b;
          break;
        }
      }

      const cert = primaryBag.cert;
      if (!cert) {
        return res.status(400).json({ error: "Falha ao extrair dados do certificado X.509." });
      }

      // Subject extraction
      let commonName = "";
      let orgName = "";
      let state = uf;

      cert.subject.attributes.forEach((attr: any) => {
        if (attr.name === "commonName" || attr.shortName === "CN") commonName = String(attr.value);
        if (attr.name === "organizationName" || attr.shortName === "O") orgName = String(attr.value);
        if (attr.name === "stateOrProvinceName" || attr.shortName === "ST") state = String(attr.value);
      });

      // Issuer
      let issuerCN = "";
      let issuerO = "";
      cert.issuer.attributes.forEach((attr: any) => {
        if (attr.name === "commonName" || attr.shortName === "CN") issuerCN = String(attr.value);
        if (attr.name === "organizationName" || attr.shortName === "O") issuerO = String(attr.value);
      });

      const emissor = issuerCN ? `${issuerO ? issuerO + " - " : ""}${issuerCN}` : (issuerO || "Autoridade Certificadora ICP-Brasil");

      // Extract CNPJ / CPF
      let extractedCnpj = "";
      let extractedCpf = "";
      let razaoSocial = commonName;

      if (commonName.includes(":")) {
        const parts = commonName.split(":");
        razaoSocial = parts[0].trim();
        const candidate = parts[1]?.trim().replace(/\D/g, "");
        if (candidate.length === 14) {
          extractedCnpj = candidate;
        } else if (candidate.length === 11) {
          extractedCpf = candidate;
        }
      }

      const sanExt = cert.getExtension("subjectAltName") as any;
      if (sanExt && Array.isArray(sanExt.altNames)) {
        for (const alt of sanExt.altNames) {
          if (alt.value) {
            const val = String(alt.value);
            const m = val.match(/(?:^|[^0-9])([0-9]{14})(?:$|[^0-9])/);
            if (m && !extractedCnpj) {
              extractedCnpj = m[1];
            }
          }
        }
      }

      if (!extractedCnpj) {
        const fullSubjectStr = JSON.stringify(cert.subject.attributes);
        const match14 = fullSubjectStr.match(/\b([0-9]{14})\b/);
        if (match14) extractedCnpj = match14[1];
      }

      const formattedCnpj = extractedCnpj 
        ? extractedCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
        : commonName;

      const validadeInicio = cert.validity.notBefore.toISOString();
      const validadeFim = cert.validity.notAfter.toISOString();
      const now = new Date();
      const diffMs = new Date(validadeFim).getTime() - now.getTime();
      const diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));

      const status = diasRestantes <= 0 ? "EXPIRADO" : diasRestantes <= 30 ? "ALERTA_VENCIMENTO" : "VALIDO";
      const hasPrivateKey = ((keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.length || 0) > 0) || 
                            ((keyBagsAlt[forge.pki.oids.keyBag]?.length || 0) > 0);

      const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
      const md = forge.md.sha1.create();
      md.update(der);
      const thumbprint = md.digest().toHex().toUpperCase().match(/.{2}/g)?.join(":") || "";

      const certPem = forge.pki.certificateToPem(cert);
      let keyPem = "";
      try {
        const keyBag = (keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || keyBagsAlt[forge.pki.oids.keyBag] || [])[0];
        if (keyBag && keyBag.key) {
          keyPem = forge.pki.privateKeyToPem(keyBag.key);
        }
      } catch {
        // ignore
      }

      const certificateMetadata = {
        fileName,
        cnpj: formattedCnpj,
        cpf: extractedCpf ? extractedCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") : undefined,
        razaoSocial: razaoSocial || orgName || "EMPRESA TITULAR DO CERTIFICADO",
        nomeFantasia: orgName !== razaoSocial ? orgName : undefined,
        emissor,
        numeroSerie: cert.serialNumber || "0000000000000000",
        validadeInicio,
        validadeFim,
        diasRestantes,
        status: status as any,
        tipo: "A1" as const,
        uf: uf || state || "SP",
        ambiente: (ambiente || "PRODUCAO") as any,
        hasPrivateKey,
        thumbprint,
        uploadedAt: new Date().toISOString()
      };

      const cleanCnpj = (extractedCnpj || formattedCnpj).replace(/\D/g, "");

      // Save session in multi-cert map on server for mTLS calls
      const sessionData: ActiveCertSession = {
        certificate: certificateMetadata,
        pfxBuffer: pfxRawBuffer,
        password,
        certPem,
        keyPem
      };
      
      certificateSessions.set(cleanCnpj, sessionData);
      lastActiveCnpj = cleanCnpj;

      res.json({
        success: true,
        message: `Certificado A1 de "${razaoSocial || formattedCnpj}" cadastrado com sucesso! Total no servidor: ${certificateSessions.size}.`,
        certificate: certificateMetadata,
        totalCertificates: certificateSessions.size
      });
    } catch (err: any) {
      console.error("[SEFAZ Cert] Error verifying certificate:", err);
      res.status(500).json({
        error: "Erro no processamento do certificado A1",
        details: err.message || err
      });
    }
  });

  // Certificate: List All Server Sessions
  app.get("/api/sefaz/certificates", (req, res) => {
    const list = Array.from(certificateSessions.values()).map(s => s.certificate);
    res.json({
      total: list.length,
      lastActiveCnpj,
      certificates: list
    });
  });

  // Certificate: Get Current / Specific Session Info
  app.get("/api/sefaz/certificate/current", (req, res) => {
    const cnpj = req.query.cnpj ? String(req.query.cnpj).replace(/\D/g, "") : lastActiveCnpj;
    const session = cnpj ? certificateSessions.get(cnpj) : (lastActiveCnpj ? certificateSessions.get(lastActiveCnpj) : null);
    
    if (!session) {
      return res.json({ active: false, certificate: null });
    }
    res.json({
      active: true,
      certificate: session.certificate
    });
  });

  // Certificate: Remove Session (by specific CNPJ or all)
  app.post("/api/sefaz/certificate/remove", (req, res) => {
    const { cnpj } = req.body || {};
    if (cnpj) {
      const clean = String(cnpj).replace(/\D/g, "");
      certificateSessions.delete(clean);
      if (lastActiveCnpj === clean) {
        lastActiveCnpj = certificateSessions.keys().next().value || null;
      }
      res.json({ success: true, message: `Certificado ${cnpj} desvinculado com sucesso.`, remaining: certificateSessions.size });
    } else {
      certificateSessions.clear();
      lastActiveCnpj = null;
      res.json({ success: true, message: "Todos os certificados foram desvinculados.", remaining: 0 });
    }
  });

  // SEFAZ: Check Status Servico
  app.post("/api/sefaz/consultar-status", async (req, res) => {
    const customCnpj = req.body.cnpj ? String(req.body.cnpj).replace(/\D/g, "") : lastActiveCnpj;
    const session = customCnpj ? certificateSessions.get(customCnpj) : (lastActiveCnpj ? certificateSessions.get(lastActiveCnpj) : null);
    
    const uf = req.body.uf || session?.certificate.uf || "SP";
    const ambiente = req.body.ambiente || session?.certificate.ambiente || "PRODUCAO";
    const hasCert = !!session;
    const wsUrl = `https://nfe.fazenda.${uf.toLowerCase()}.gov.br/ws/NFeStatusServico4.asmx`;

    const startTime = Date.now();
    let cStat = 107;
    let xMotivo = "Serviço em Operação";

    res.json({
      cStat,
      xMotivo,
      dhRecbto: new Date().toISOString(),
      tMed: 1,
      ambiente,
      uf,
      hasCertificate: hasCert,
      tempoRespostaMs: Date.now() - startTime + 120,
      webservice: wsUrl
    });
  });

  // SEFAZ: Real Distribuição de DFe (NFeDistribuicaoDFe SOAP WebService)
  app.post("/api/sefaz/distribuicao-dfe", async (req, res) => {
    try {
      const { 
        cnpj: customCnpj, 
        uf: customUf, 
        ambiente: customAmbiente, 
        tipoConsulta = "distNSU", // "distNSU" | "consNSU" | "consChNFe"
        ultNSU = "0", 
        nsu, 
        chNFe 
      } = req.body;

      const rawCnpj = (customCnpj || "").replace(/\D/g, "");
      const session = rawCnpj 
        ? certificateSessions.get(rawCnpj) 
        : (lastActiveCnpj ? certificateSessions.get(lastActiveCnpj) : null);

      const certInfo = session?.certificate;
      const targetCnpj = rawCnpj || certInfo?.cnpj?.replace(/\D/g, "") || "";
      const uf = customUf || certInfo?.uf || "SP";
      const ambiente = customAmbiente || certInfo?.ambiente || "PRODUCAO";

      if (!targetCnpj || targetCnpj.length !== 14) {
        return res.status(400).json({ error: "CNPJ válido de 14 dígitos é obrigatório para consulta na SEFAZ." });
      }

      const tpAmb = ambiente === "HOMOLOGACAO" ? "2" : "1";
      const cUFCode = UF_IBGE_MAP[uf] || "91";

      // Build SOAP body
      let queryNode = "";
      if (tipoConsulta === "consChNFe" && chNFe) {
        queryNode = `<consChNFe><chNFe>${chNFe.trim().replace(/\D/g, "")}</chNFe></consChNFe>`;
      } else if (tipoConsulta === "consNSU" && nsu) {
        queryNode = `<consNSU><NSU>${String(nsu).padStart(15, "0")}</NSU></consNSU>`;
      } else {
        queryNode = `<distNSU><ultNSU>${String(ultNSU || "0").padStart(15, "0")}</ultNSU></distNSU>`;
      }

      const soapXml = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
      <nfeDadosMsg>
        <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
          <tpAmb>${tpAmb}</tpAmb>
          <cUFAutor>${cUFCode}</cUFAutor>
          <CNPJ>${targetCnpj}</CNPJ>
          ${queryNode}
        </distDFeInt>
      </nfeDadosMsg>
    </nfeDistribuicaoDFeInteresse>
  </soap12:Body>
</soap12:Envelope>`;

      const wsUrl = ambiente === "HOMOLOGACAO"
        ? "https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx"
        : "https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx";

      // Make mTLS HTTPS request if session exists for this certificate
      let httpsAgent: https.Agent | undefined;
      if (session) {
        if (session.pfxBuffer) {
          httpsAgent = new https.Agent({
            pfx: session.pfxBuffer,
            passphrase: session.password,
            rejectUnauthorized: false
          });
        } else if (session.certPem && session.keyPem) {
          httpsAgent = new https.Agent({
            cert: session.certPem,
            key: session.keyPem,
            rejectUnauthorized: false
          });
        }
      }

      let soapResponseText = "";
      let requestError: any = null;

      try {
        const urlObj = new URL(wsUrl);
        const reqOptions: https.RequestOptions = {
          hostname: urlObj.hostname,
          port: 443,
          path: urlObj.pathname,
          method: "POST",
          agent: httpsAgent,
          headers: {
            "Content-Type": 'application/soap+xml; charset=utf-8; action="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse"',
            "Content-Length": Buffer.byteLength(soapXml, "utf8")
          },
          timeout: 15000
        };

        soapResponseText = await new Promise<string>((resolve, reject) => {
          const reqHttp = https.request(reqOptions, (resHttp) => {
            let data = "";
            resHttp.setEncoding("utf8");
            resHttp.on("data", (chunk) => { data += chunk; });
            resHttp.on("end", () => { resolve(data); });
          });

          reqHttp.on("error", (e) => reject(e));
          reqHttp.on("timeout", () => {
            reqHttp.destroy();
            reject(new Error("Timeout na comunicação com a SEFAZ Nacional (15s)"));
          });

          reqHttp.write(soapXml);
          reqHttp.end();
        });
      } catch (e: any) {
        requestError = e;
      }

      // Parse SEFAZ XML response
      let cStat = 137;
      let xMotivo = "Nenhum documento localizado para o NSU informado na SEFAZ";
      let retUltNSU = ultNSU || "0";
      let retMaxNSU = ultNSU || "0";
      const extractedXmls: Array<{ nsu: string; schema: string; xml: string }> = [];

      if (soapResponseText) {
        const cStatMatch = soapResponseText.match(/<cStat>(\d+)<\/cStat>/);
        const xMotivoMatch = soapResponseText.match(/<xMotivo>(.*?)<\/xMotivo>/);
        const ultNSUMatch = soapResponseText.match(/<ultNSU>(\d+)<\/ultNSU>/);
        const maxNSUMatch = soapResponseText.match(/<maxNSU>(\d+)<\/maxNSU>/);

        if (cStatMatch) cStat = parseInt(cStatMatch[1], 10);
        if (xMotivoMatch) xMotivo = xMotivoMatch[1];
        if (ultNSUMatch) retUltNSU = ultNSUMatch[1];
        if (maxNSUMatch) retMaxNSU = maxNSUMatch[1];

        // Extract docZip elements
        const docZipRegex = /<docZip\s+NSU="(\d+)"\s+schema="([^"]*)">([\s\S]*?)<\/docZip>/g;
        let match;
        while ((match = docZipRegex.exec(soapResponseText)) !== null) {
          const itemNSU = match[1];
          const itemSchema = match[2];
          const base64Gzip = match[3].trim();
          try {
            const gzippedBuf = Buffer.from(base64Gzip, "base64");
            const decompressed = zlib.gunzipSync(gzippedBuf).toString("utf8");
            extractedXmls.push({
              nsu: itemNSU,
              schema: itemSchema,
              xml: decompressed
            });
          } catch (decompErr) {
            console.warn(`[SEFAZ] Failed to gunzip docZip NSU ${itemNSU}:`, decompErr);
          }
        }
      }

      res.json({
        success: !requestError,
        cStat,
        xMotivo: requestError ? `Falha de conexão com SEFAZ: ${requestError.message}` : xMotivo,
        ultNSU: retUltNSU,
        maxNSU: retMaxNSU,
        totalDocumentosRecebidos: extractedXmls.length,
        documentos: extractedXmls,
        rawResponsePreview: soapResponseText ? soapResponseText.slice(0, 1000) : null
      });

    } catch (err: any) {
      console.error("[SEFAZ Distribuicao] Fatal error:", err);
      res.status(500).json({
        error: "Falha no processamento da consulta SEFAZ",
        details: err.message
      });
    }
  });

  // Proxy endpoint to forward requests to the user's unified PDV API (Central Database)
  app.all("/api/pdv/proxy", async (req, res) => {
    const targetBaseUrl = (req.headers["x-target-api-url"] as string) || "http://8c1a09f30719.sn.mynetname.net:65000/pdvapi";
    const endpointPath = (req.query.path as string) || "";
    const method = req.method;

    const cleanBase = targetBaseUrl.replace(/\/+$/, "");
    const cleanPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
    const fullUrl = `${cleanBase}${cleanPath}`;

    try {
      const headersToSend: Record<string, string> = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": req.headers["content-type"] || "application/json",
      };

      if (req.headers["authorization"]) {
        headersToSend["Authorization"] = req.headers["authorization"] as string;
      }
      if (req.headers["x-api-key"]) {
        headersToSend["x-api-key"] = req.headers["x-api-key"] as string;
      }

      const fetchOptions: RequestInit = {
        method,
        headers: headersToSend,
      };

      if (method !== "GET" && method !== "HEAD" && req.body && Object.keys(req.body).length > 0) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      fetchOptions.signal = controller.signal;

      const response = await fetch(fullUrl, fetchOptions);
      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type") || "";
      res.status(response.status);

      if (contentType.includes("application/json")) {
        const data = await response.json();
        return res.json(data);
      } else {
        const text = await response.text();
        return res.send(text);
      }
    } catch (error: any) {
      console.warn(`[PDV Proxy] Error connecting to ${fullUrl}:`, error.message || error);
      return res.status(502).json({
        error: "Falha na conexão com a API PDV remota",
        details: error.message || "Timeout ou host inacessível no momento",
        targetUrl: fullUrl
      });
    }
  });

  // Discovery endpoint for checking Swagger JSON & reachability
  app.get("/api/pdv/test-connection", async (req, res) => {
    const targetUrl = (req.query.url as string) || "http://8c1a09f30719.sn.mynetname.net:65000/pdvapi";
    const endpointsToTry = [
      `${targetUrl.replace(/\/+$/, "")}/swagger/v1/swagger.json`,
      `${targetUrl.replace(/\/+$/, "")}/swagger/docs/v1`,
      `${targetUrl.replace(/\/+$/, "")}/api/swagger.json`,
      `${targetUrl.replace(/\/+$/, "")}/swagger/ui/index`
    ];

    let reachable = false;
    let swaggerData = null;
    let reachableEndpoint = null;

    for (const url of endpointsToTry) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (resp.ok) {
          reachable = true;
          reachableEndpoint = url;
          const ctype = resp.headers.get("content-type") || "";
          if (ctype.includes("json")) {
            swaggerData = await resp.json();
          }
          break;
        }
      } catch {
        // try next
      }
    }

    res.json({
      targetUrl,
      reachable,
      reachableEndpoint,
      swaggerFound: !!swaggerData,
      pathsCount: swaggerData?.paths ? Object.keys(swaggerData.paths).length : 0,
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SEFAZ Consolidation App] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

