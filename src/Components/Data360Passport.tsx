import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
import ABI from "../abi/Hashmark.json";
import { createData360Passport, verifyData360Passport, getInfo, verifyHash, type Data360Passport, type Data360VerifyResponse, type Data360VerifyOptions, type VerifyResult } from "../api";
import { useWallet } from "../hooks/useWallet";
import { buildChartDataUrl, buildChartSvg, buildFactDNA, buildSummary, normalizeSeries, type FactDNA } from "../utils/demoPassport";

const _raw_addr = (import.meta.env.VITE_CONTRACT_ADDRESS as string) || "";
const ENV_CONTRACT_ADDRESS = (_raw_addr.match(/0x[0-9a-fA-F]{40}/) || [""])[0];

type Stage = "idle" | "generating" | "verifying" | "anchoring" | "done" | "error";


const AGENT_IDENTITY = "Hashmark Insight Engine v1";

const QUESTION_ROUTES = [
  {
    indicator: "WB_WDI_SL_UEM_1524_NE_ZS",
    category: "Youth unemployment",
    keywords: ["youth unemployment", "young unemployment", "youth jobless", "ages 15-24", "youth labor"],
  },
  {
    indicator: "WB_WDI_SL_UEM_TOTL_ZS",
    category: "Unemployment",
    keywords: ["unemployment", "jobless", "employment rate", "labor market"],
  },
  {
    indicator: "WB_WDI_SI_POV_DDAY",
    category: "Extreme poverty",
    keywords: ["poverty", "extreme poverty", "poverty rate", "income poverty"],
  },
  {
    indicator: "WB_WDI_SG_GEN_PARL_ZS",
    category: "Gender equality",
    keywords: ["gender equality", "women in parliament", "gender parity", "women representation"],
  },
  {
    indicator: "WB_WDI_SL_TLF_CACT_FE_ZS",
    category: "Female labor participation",
    keywords: ["female labor participation", "women workforce", "female workforce", "women labor"],
  },
  {
    indicator: "WB_WDI_EN_ATM_CO2E_PC",
    category: "Climate emissions",
    keywords: ["climate", "co2", "carbon", "emissions", "greenhouse"],
  },
  {
    indicator: "WB_WDI_SH_XPD_CHEX_GD_ZS",
    category: "Healthcare spending",
    keywords: ["healthcare spending", "health expenditure", "health spending"],
  },
  {
    indicator: "WB_WDI_SE_SEC_ENRR",
    category: "Education access",
    keywords: ["education", "school enrollment", "secondary education", "student enrollment"],
  },
  {
    indicator: "WB_WDI_EG_ELC_ACCS_ZS",
    category: "Infrastructure access",
    keywords: ["electricity", "power access", "energy access", "infrastructure"],
  },
  {
    indicator: "WB_WDI_SH_H2O_BASW_ZS",
    category: "Clean water access",
    keywords: ["clean water", "drinking water", "water access"],
  },
  {
    indicator: "WB_WDI_NY_GDP_PCAP_CD",
    category: "Economic output",
    keywords: ["gdp per capita", "income per person", "economic output", "gdp"],
  },
  {
    indicator: "WB_WDI_SP_DYN_LE00_IN",
    category: "Healthcare outcomes",
    keywords: ["life expectancy", "healthcare outcomes", "health outcomes"],
  },
];

const resolveQuestionRoute = (input: string) => {
  const normalized = input.toLowerCase();
  return QUESTION_ROUTES.find((route) =>
    route.keywords.some((keyword) => normalized.includes(keyword)),
  );
};

const extractDateRange = (input: string) => {
  const years = Array.from(input.matchAll(/\b(19|20)\d{2}\b/g))
    .map((match) => Number(match[0]))
    .filter((year) => Number.isFinite(year));
  if (!years.length) {
    const normalized = input.toLowerCase();
    const currentYear = new Date().getFullYear();
    if (normalized.includes("last decade")) return `${currentYear - 10}:${currentYear}`;
    if (normalized.includes("last 5 years")) return `${currentYear - 5}:${currentYear}`;
    return undefined;
  }
  const sorted = Array.from(new Set(years)).sort((a, b) => a - b);
  if (sorted.length === 1) return `${sorted[0]}`;
  return `${sorted[0]}:${sorted[sorted.length - 1]}`;
};

export default function Data360Passport() {
  const [searchParams] = useSearchParams();
  const wallet = useWallet();

  const [contractAddress, setContractAddress] = useState(ENV_CONTRACT_ADDRESS);
  const [question, setQuestion] = useState("");
  const [questionCategory, setQuestionCategory] = useState("");
  const [indicator, setIndicator] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState("");
  const [limit, setLimit] = useState(10);

  const [hashInput, setHashInput] = useState(searchParams.get("hash") ?? "");
  const [passport, setPassport] = useState<Data360Passport | null>(null);
  const [verifyResult, setVerifyResult] = useState<Data360VerifyResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [chartDataUrl, setChartDataUrl] = useState<string>("");
  const [factHash, setFactHash] = useState<string | null>(null);
  const [factPayload, setFactPayload] = useState<FactDNA | null>(null);
  const [factProof, setFactProof] = useState<VerifyResult | null>(null);
  const [tamperResult, setTamperResult] = useState<{ status: "idle" | "match" | "mismatch" | "error"; message?: string }>(
    { status: "idle" },
  );
  const [anchorTx, setAnchorTx] = useState<{
    txHash: string;
    blockNumber: number;
    timestamp: number;
    chainName: string;
    chainId: number;
  } | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (contractAddress) return;
    getInfo().then(info => {
      if (info.contractAddress) setContractAddress(info.contractAddress);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetStatus = () => {
    setError("");
    setStage("idle");
    setVerifyResult(null);
    setAnchorTx(null);
    setSummary("");
    setChartDataUrl("");
    setFactHash(null);
    setFactPayload(null);
    setFactProof(null);
    setTamperResult({ status: "idle" });
  };

  const formatError = (err: unknown) => {
    const message = (err as Error)?.message || "Unexpected error.";
    if (message.includes("Failed to fetch")) {
      return "Backend not reachable. Start the Hashmark backend on http://localhost:4000.";
    }
    return message;
  };

  const loadFactProof = useCallback(async (hash: string) => {
    try {
      const proof = await verifyHash(hash);
      setFactProof(proof);
    } catch {
      setFactProof(null);
    }
  }, []);

  const buildDemoAssets = useCallback(async (passport: Data360Passport, request?: { question?: string; category?: string }) => {
    const normalized = normalizeSeries(passport.data360.series, passport.data360.indicator.unit);
    const countryLabel = passport.data360.country.name || passport.data360.country.id;
    const indicatorLabel = passport.data360.indicator.name || passport.data360.indicator.id || passport.data360.query.indicator;
    const unitLabel = passport.data360.indicator.unit || normalized[0]?.unit;
    const summaryText = buildSummary(normalized, {
      countryLabel,
      indicatorLabel,
      unitLabel,
      sourceLabel: "World Bank Data360",
    });
    const chartTitle = `${indicatorLabel} · ${countryLabel}`;
    const chartSvgMarkup = buildChartSvg(normalized, chartTitle, unitLabel);
    const chartUrl = buildChartDataUrl(chartSvgMarkup);
    const requestQuestion = request?.question?.trim() || `Show ${indicatorLabel} in ${countryLabel}.`;
    const requestCategory = request?.category || indicatorLabel || "Development indicator";
    const { payload, hash } = await buildFactDNA({
      issuedAt: passport.issuedAt,
      dataHash: passport.hash,
      query: passport.data360.query,
      request: { question: requestQuestion, category: requestCategory },
      source: {
        authority: "World Bank Data360",
        issuer: passport.issuer,
        apiBaseUrl: passport.data360.apiBaseUrl,
        dataUrl: passport.data360.dataUrl,
        indicator: {
          id: passport.data360.indicator.id,
          name: indicatorLabel,
          unit: passport.data360.indicator.unit,
        },
        country: {
          id: passport.data360.country.id,
          name: countryLabel,
          iso3: passport.data360.country.iso3,
        },
        period: passport.data360.query.date ?? null,
      },
      creator: wallet.address ?? "Anonymous researcher",
      agent: AGENT_IDENTITY,
      summary: summaryText,
      chartDataUrl: chartUrl,
    });

    setSummary(summaryText);
    setChartDataUrl(chartUrl);
    setFactPayload(payload);
    setFactHash(hash);
    await loadFactProof(hash);
  }, [loadFactProof, wallet.address]);

  const handleAskQuestion = () => {
    const route = resolveQuestionRoute(question);
    const derivedIndicator = route?.indicator ?? indicator.trim();
    const derivedCategory = route?.category ?? "Development indicator";
    const derivedDate = extractDateRange(question) ?? date.trim();
    const derivedCountry = country.trim();
    
    if (!derivedIndicator) {
      setError("Please enter a question or specify an indicator.");
      return;
    }
    if (!derivedCountry) {
      setError("Please enter a country.");
      return;
    }
    
    setQuestionCategory(derivedCategory);
    handleGenerate({
      indicator: derivedIndicator,
      country: derivedCountry,
      date: derivedDate,
      limit: limit,
      request: { question, category: derivedCategory },
    });
  };

  const handleGenerate = async (override?: {
    indicator: string;
    country: string;
    date?: string;
    limit?: number;
    request?: { question?: string; category?: string };
  }) => {
    resetStatus();
    setStage("generating");
    try {
      const nextIndicator = override?.indicator ?? indicator.trim();
      const nextCountry = override?.country ?? country.trim();
      const nextDate = override?.date ?? date.trim();
      const nextLimit = override?.limit ?? limit;
      if (override) {
        setIndicator(nextIndicator);
        setCountry(nextCountry);
        setDate(nextDate);
        setLimit(nextLimit);
      }
      const response = await createData360Passport({
        indicator: nextIndicator,
        country: nextCountry,
        date: nextDate || undefined,
        limit: Number.isFinite(Number(nextLimit)) ? Number(nextLimit) : undefined,
      });
      const verified = await verifyData360Passport(response.hash);
      setPassport(verified.passport ?? response.passport);
      setHashInput(verified.hash);
      setQrDataUrl(verified.qrDataUrl);
      setVerifyUrl(verified.verifyUrl);
      setVerifyResult(verified);
      await buildDemoAssets(verified.passport ?? response.passport, override?.request);
      setStage("done");
    } catch (err: unknown) {
      setError(formatError(err));
      setStage("error");
    }
  };

  const handleVerify = useCallback(async (hash?: string, options?: Data360VerifyOptions) => {
    const target = (hash ?? hashInput).trim();
    if (!target) return;
    resetStatus();
    setStage("verifying");
    try {
      const result = await verifyData360Passport(target, options);
      let requestContext: { question?: string; category?: string } | undefined;
      setPassport(result.passport);
      setVerifyResult(result);
      setQrDataUrl(result.qrDataUrl);
      setVerifyUrl(result.verifyUrl);
      if (result.passport?.data360?.query) {
        setIndicator(result.passport.data360.query.indicator);
        setCountry(result.passport.data360.country.name || result.passport.data360.query.country);
        setDate(result.passport.data360.query.date ?? "");
        setLimit(result.passport.data360.query.limit);
        const indicatorName = result.passport.data360.indicator.name || result.passport.data360.query.indicator;
        const countryLabel = result.passport.data360.country.name || result.passport.data360.query.country;
        const generatedQuestion = `Show ${indicatorName} in ${countryLabel}.`;
        setQuestion(generatedQuestion);
        setQuestionCategory(indicatorName);
        requestContext = { question: generatedQuestion, category: indicatorName };
      }
      await buildDemoAssets(result.passport, requestContext);
      setStage("done");
    } catch (err: unknown) {
      setError(formatError(err));
      setStage("error");
    }
  }, [hashInput, buildDemoAssets]);

  useEffect(() => {
    const paramHash = searchParams.get("hash");
    if (!paramHash) return;
    const paramIndicator = searchParams.get("indicator");
    const paramCountry = searchParams.get("country");
    const paramDate = searchParams.get("date");
    const paramDatabase = searchParams.get("database");
    const paramIssuedAt = searchParams.get("issuedAt");
    const limitRaw = searchParams.get("limit");
    const parsedLimit = limitRaw ? Number(limitRaw) : undefined;
    const verifyOptions: Data360VerifyOptions | undefined = (paramIndicator && paramCountry)
      ? {
          indicator: paramIndicator,
          country: paramCountry,
          date: paramDate || undefined,
          database: paramDatabase || undefined,
          issuedAt: paramIssuedAt || undefined,
          limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
        }
      : undefined;
    setHashInput(paramHash);
    setTimeout(() => {
      handleVerify(paramHash, verifyOptions);
    }, 120);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnchor = async () => {
    if (!passport || !factHash) return;
    if (!wallet.signer) {
      setError("Connect your MetaMask wallet to publish this fact on-chain.");
      setStage("error");
      return;
    }
    if (!contractAddress) {
      setError("Contract address not configured. Check your backend CONTRACT_ADDRESS environment variable.");
      setStage("error");
      return;
    }

    resetStatus();
    setStage("anchoring");
    try {
      const contract = new ethers.Contract(contractAddress, ABI, wallet.signer);
      const tx = await contract.authenticateVideo(factHash);
      const receipt = await tx.wait();
      const block = await wallet.provider!.getBlock(receipt.blockNumber);
      const timestamp = block?.timestamp ?? Math.floor(Date.now() / 1000);
      setAnchorTx({
        txHash: receipt.hash,
        blockNumber: Number(receipt.blockNumber),
        timestamp,
        chainName: wallet.chainName,
        chainId: wallet.chainId ?? 0,
      });
      await loadFactProof(factHash);
      setStage("done");
    } catch (err: unknown) {
      const msg = (err as { reason?: string; message?: string }).reason
        || (err as Error).message;
      if (msg?.includes("Already authenticated")) {
        setError("This fact hash is already anchored on-chain.");
      } else if ((err as { code?: number }).code === 4001 || msg?.includes("user rejected")) {
        setError("Transaction rejected in MetaMask.");
      } else {
        setError(msg ?? "On-chain anchoring failed.");
      }
      setStage("error");
    }
  };

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });

  const handleTamperUpload = async (file: File | null) => {
    if (!file || !factPayload || !factHash) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const { hash } = await buildFactDNA({
        issuedAt: factPayload.issuedAt,
        dataHash: factPayload.dataHash,
        query: factPayload.query,
        request: factPayload.request,
        source: factPayload.source,
        creator: factPayload.provenance.creator,
        agent: factPayload.provenance.agent,
        generatedAt: factPayload.provenance.generatedAt,
        summary: factPayload.insight.summary,
        chartDataUrl: dataUrl,
      });
      setTamperResult({
        status: hash === factHash ? "match" : "mismatch",
        message: hash === factHash ? "PROVENANCE INTACT" : "PROVENANCE BROKEN",
      });
    } catch (err: unknown) {
      setTamperResult({
        status: "error",
        message: (err as Error).message || "Tamper check failed.",
      });
    }
  };

  const busy = stage === "generating" || stage === "verifying" || stage === "anchoring";
  const indicatorLabel = passport?.data360?.indicator?.name || passport?.data360?.indicator?.id || passport?.data360?.query?.indicator || "";
  const countryLabel = passport?.data360?.country?.name || passport?.data360?.country?.id || country;
  const issuedLabel = passport?.issuedAt ? new Date(passport.issuedAt).toLocaleString() : "";

  return (
    <div className="section" style={{ minHeight: "100vh" }}>
      <div className="section-inner" style={{ maxWidth: 920 }}>
        <Link to="/" style={{ fontSize: 13, opacity: 0.55, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32, textDecoration: "none" }}>
          ← Back to Home
        </Link>

        <div className="section-header">
          <p className="section-label">Hashmark — Truth Engine</p>
          <h2 className="section-title">Verified Intelligence Object</h2>
          <p className="section-desc">
            Every development fact receives a cryptographic identity, provenance record, and verification passport.
          </p>
        </div>

        <div className="tech-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12, fontSize: 15 }}>1 · Intelligence request</h3>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, opacity: 0.6 }}>Question</span>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Show youth unemployment trends in Kenya."
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            <span style={{ fontSize: 11, opacity: 0.6 }}>Country (name or ISO3)</span>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Kenya"
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
            />
          </label>
          <button className="btn btn-primary" style={{ marginTop: 16, width: "100%" }} onClick={handleAskQuestion} disabled={busy}>
            {stage === "generating" ? "Fetching evidence…" : "Fetch official evidence"}
          </button>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
            Mapped to World Bank Data360 · Topic {questionCategory} · Indicator {indicator} · {country} · {date || "latest"}
          </p>
        </div>

        {passport && (
          <div className="tech-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>2 · Data360 evidence + intelligence synthesis</h3>
            {chartDataUrl && (
              <div style={{ background: "#0f1117", borderRadius: 16, padding: 12 }}>
                <img src={chartDataUrl} alt={`${indicatorLabel || "Indicator"} chart`} style={{ width: "100%", borderRadius: 12 }} />
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Verifiable development narrative</p>
              <p style={{ fontSize: 14 }}>{summary || "Generating summary..."}</p>
            </div>
            <div style={{ marginTop: 14, display: "grid", gap: 8, fontSize: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
                <span style={{ opacity: 0.6 }}>Evidence hash</span>
                <code style={{ fontSize: 11, wordBreak: "break-all" }}>{passport.hash}</code>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
                <span style={{ opacity: 0.6 }}>Issued at</span>
                <span>{issuedLabel || "—"}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
                <span style={{ opacity: 0.6 }}>Indicator</span>
                <span>{indicatorLabel}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
                <span style={{ opacity: 0.6 }}>Country</span>
                <span>{countryLabel}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
                <span style={{ opacity: 0.6 }}>Reporting period</span>
                <span>{passport.data360.query.date ?? "Latest available"}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
                <span style={{ opacity: 0.6 }}>Source authority</span>
                <a href={passport.data360.dataUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                  World Bank Data360
                </a>
              </div>
            </div>
          </div>
        )}

        {passport && (
          <div className="tech-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>3 · Fact DNA + provenance registration</h3>
            <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
              The dataset, chart, summary, provenance metadata, timestamp, and identities fuse into a single Fact DNA fingerprint.
            </p>
            {factHash && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Fact DNA</p>
                <code style={{ fontSize: 11, wordBreak: "break-all" }}>{factHash}</code>
              </div>
            )}
            {factPayload && (
              <div style={{ marginBottom: 12, fontSize: 12, opacity: 0.7 }}>
                Creator: {factPayload.provenance.creator} · Agent: {factPayload.provenance.agent}
              </div>
            )}
            {!wallet.address ? (
              <button className="btn btn-secondary" onClick={wallet.connect} disabled={wallet.connecting}>
                {wallet.connecting ? "Connecting…" : "Connect MetaMask"}
              </button>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <button className="btn btn-primary" onClick={handleAnchor} disabled={busy || !factHash}>
                  {stage === "anchoring" ? "Publishing…" : "Register provenance"}
                </button>
                <span style={{ fontSize: 12, opacity: 0.6 }}>{wallet.chainName}</span>
              </div>
            )}
            {anchorTx && (
              <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
                Timestamped in block {anchorTx.blockNumber} · Tx {anchorTx.txHash.slice(0, 10)}…{anchorTx.txHash.slice(-8)}
              </div>
            )}

            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: verifyResult?.valid ? "#4ade80" : "#f87171" }}>
                {verifyResult
                  ? (verifyResult.valid ? "✅ Fact DNA sealed" : "⚠️ Integrity mismatch")
                  : "—"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>✅ Source: World Bank Data360</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {factProof?.authenticated
                  ? `✅ Provenance registered${factProof.timestamp ? ` at ${new Date(factProof.timestamp * 1000).toLocaleString()}` : ""}`
                  : "⏳ Provenance registration pending"}
              </div>
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
              <div>
                <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Verify Link</p>
                {verifyUrl ? (
                  <a href={verifyUrl} style={{ fontSize: 12, wordBreak: "break-all", color: "var(--accent)" }}>
                    {verifyUrl}
                  </a>
                ) : (
                  <span style={{ fontSize: 12, opacity: 0.5 }}>—</span>
                )}
              </div>
              {qrDataUrl && (
                <div>
                  <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Verification QR</p>
                  <div style={{ width: 140, height: 140, background: "#fff", borderRadius: 12, overflow: "hidden" }}>
                    <img src={qrDataUrl} alt="Verification QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(verifyResult || factHash) && (
          <div className="tech-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>4 · Public verification passport</h3>
            <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
              The passport is portable and scannable: it reconstructs the evidence, lineage, and integrity status anywhere it appears.
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: verifyResult?.valid ? "#4ade80" : "#f87171" }}>
                {verifyResult
                  ? (verifyResult.valid ? "✅ Passport authentic" : "⚠️ Passport hash mismatch")
                  : "—"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {factProof?.authenticated
                  ? `✅ Blockchain proof found${factProof.timestamp ? ` at ${new Date(factProof.timestamp * 1000).toLocaleString()}` : ""}`
                  : "⏳ Blockchain proof pending"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Data source: World Bank Data360</div>
            </div>
          </div>
        )}

        {factHash && (
          <div className="tech-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>5 · Misinformation stress test</h3>
            <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
              Alter the chart (crop attribution, edit values, manipulate percentages) and upload it to see provenance break instantly.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleTamperUpload(e.target.files?.[0] ?? null)}
              style={{ fontSize: 12 }}
            />
            {tamperResult.status !== "idle" && (
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: tamperResult.status === "match" ? "#4ade80" : "#f87171" }}>
                {tamperResult.message}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, color: "#f87171", fontSize: 13 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
