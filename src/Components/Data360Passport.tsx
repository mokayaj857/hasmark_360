import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
import ABI from "../abi/Hashmark.json";
import { createData360Passport, verifyData360Passport, getInfo, verifyHash, type Data360Passport, type Data360VerifyResponse, type Data360VerifyOptions, type VerifyResult } from "../api";
import { useWallet } from "../hooks/useWallet";
import { buildChartDataUrl, buildChartSvg, buildFactHash, buildSummary, normalizeSeries, type FactPayload } from "../utils/demoPassport";

const _raw_addr = (import.meta.env.VITE_CONTRACT_ADDRESS as string) || "";
const ENV_CONTRACT_ADDRESS = (_raw_addr.match(/0x[0-9a-fA-F]{40}/) || [""])[0];

type Stage = "idle" | "generating" | "verifying" | "anchoring" | "done" | "error";

const DEMO = {
  question: "Show youth unemployment trends in Kenya.",
  indicator: "WB_WDI_SL_UEM_1524_NE_ZS",
  country: "Kenya",
  date: "2012:2022",
  limit: 12,
};

export default function Data360Passport() {
  const [searchParams] = useSearchParams();
  const wallet = useWallet();

  const [contractAddress, setContractAddress] = useState(ENV_CONTRACT_ADDRESS);
  const [question, setQuestion] = useState(DEMO.question);
  const [indicator, setIndicator] = useState(DEMO.indicator);
  const [country, setCountry] = useState(DEMO.country);
  const [date, setDate] = useState(DEMO.date);
  const [limit, setLimit] = useState(DEMO.limit);

  const [hashInput, setHashInput] = useState(searchParams.get("hash") ?? "");
  const [passport, setPassport] = useState<Data360Passport | null>(null);
  const [verifyResult, setVerifyResult] = useState<Data360VerifyResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [chartDataUrl, setChartDataUrl] = useState<string>("");
  const [factHash, setFactHash] = useState<string | null>(null);
  const [factPayload, setFactPayload] = useState<FactPayload | null>(null);
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

  const buildDemoAssets = useCallback(async (passport: Data360Passport) => {
    const normalized = normalizeSeries(passport.data360.series);
    const countryLabel = passport.data360.country.name || passport.data360.country.id;
    const summaryText = buildSummary(normalized, countryLabel);
    const chartTitle = `Youth unemployment in ${countryLabel} (ages 15-24)`;
    const chartSvgMarkup = buildChartSvg(normalized, chartTitle);
    const chartUrl = buildChartDataUrl(chartSvgMarkup);
    const { payload, hash } = await buildFactHash({
      issuedAt: passport.issuedAt,
      dataHash: passport.hash,
      query: passport.data360.query,
      summary: summaryText,
      chartDataUrl: chartUrl,
    });

    setSummary(summaryText);
    setChartDataUrl(chartUrl);
    setFactPayload(payload);
    setFactHash(hash);
    await loadFactProof(hash);
  }, [loadFactProof]);

  const handleAskQuestion = () => {
    handleGenerate({
      indicator: DEMO.indicator,
      country: DEMO.country,
      date: DEMO.date,
      limit: DEMO.limit,
    });
  };

  const handleGenerate = async (override?: { indicator: string; country: string; date?: string; limit?: number }) => {
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
      setPassport(response.passport);
      setHashInput(response.hash);
      setQrDataUrl(response.qrDataUrl);
      setVerifyUrl(response.verifyUrl);
      setVerifyResult({
        hash: response.hash,
        valid: true,
        passport: response.passport,
        chain: null,
        verifyUrl: response.verifyUrl,
        qrDataUrl: response.qrDataUrl,
      });
      await buildDemoAssets(response.passport);
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
      setPassport(result.passport);
      setVerifyResult(result);
      setQrDataUrl(result.qrDataUrl);
      setVerifyUrl(result.verifyUrl);
      if (result.passport?.data360?.query) {
        setIndicator(result.passport.data360.query.indicator);
        setCountry(result.passport.data360.country.name || result.passport.data360.query.country);
        setDate(result.passport.data360.query.date ?? "");
        setLimit(result.passport.data360.query.limit);
      }
      await buildDemoAssets(result.passport);
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
      const { hash } = await buildFactHash({
        issuedAt: factPayload.issuedAt,
        dataHash: factPayload.dataHash,
        query: factPayload.query,
        summary: factPayload.summary,
        chartDataUrl: dataUrl,
      });
      setTamperResult({
        status: hash === factHash ? "match" : "mismatch",
        message: hash === factHash ? "CONTENT MATCHED" : "CONTENT TAMPERED",
      });
    } catch (err: unknown) {
      setTamperResult({
        status: "error",
        message: (err as Error).message || "Tamper check failed.",
      });
    }
  };

  const busy = stage === "generating" || stage === "verifying" || stage === "anchoring";

  return (
    <div className="section" style={{ minHeight: "100vh" }}>
      <div className="section-inner" style={{ maxWidth: 920 }}>
        <Link to="/" style={{ fontSize: 13, opacity: 0.55, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32, textDecoration: "none" }}>
          ← Back to Home
        </Link>

        <div className="section-header">
          <p className="section-label">Hashmark Demo</p>
          <h2 className="section-title">Verified Data360 Insight</h2>
          <p className="section-desc">
            How do we know this chart and AI-generated report were not manipulated?
          </p>
        </div>

        <div className="tech-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12, fontSize: 15 }}>1 · Ask a question</h3>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, opacity: 0.6 }}>Question</span>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={DEMO.question}
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
            {stage === "generating" ? "Fetching data…" : "Fetch official data"}
          </button>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
            Using World Bank Data360 · Indicator {indicator} · {country} · {date}
          </p>
        </div>

        {passport && (
          <div className="tech-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>2 · Official data + AI summary</h3>
            {chartDataUrl && (
              <div style={{ background: "#0f1117", borderRadius: 16, padding: 12 }}>
                <img src={chartDataUrl} alt="Youth unemployment chart" style={{ width: "100%", borderRadius: 12 }} />
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>AI summary</p>
              <p style={{ fontSize: 14 }}>{summary || "Generating summary..."}</p>
            </div>
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: 12 }}>
              Source:{" "}
              <a href={passport.data360.dataUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                World Bank Data360
              </a>
            </p>
          </div>
        )}

        {passport && (
          <div className="tech-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>3 · Verify & Publish</h3>
            <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
              Hash the chart + summary, anchor the proof on-chain, and generate a public verification passport.
            </p>
            {factHash && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Fact hash</p>
                <code style={{ fontSize: 11, wordBreak: "break-all" }}>{factHash}</code>
              </div>
            )}
            {!wallet.address ? (
              <button className="btn btn-secondary" onClick={wallet.connect} disabled={wallet.connecting}>
                {wallet.connecting ? "Connecting…" : "Connect MetaMask"}
              </button>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <button className="btn btn-primary" onClick={handleAnchor} disabled={busy || !factHash}>
                  {stage === "anchoring" ? "Publishing…" : "Verify & Publish"}
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
                  ? (verifyResult.valid ? "✅ Verified by Hashmark" : "⚠️ Hash mismatch")
                  : "—"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>✅ Source: World Bank Data360</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {factProof?.authenticated
                  ? `✅ Timestamped on-chain${factProof.timestamp ? ` at ${new Date(factProof.timestamp * 1000).toLocaleString()}` : ""}`
                  : "⏳ Not yet anchored on-chain"}
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
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>4 · Public verification</h3>
            <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
              Verification page shows the original chart, source dataset, blockchain proof, and status.
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: verifyResult?.valid ? "#4ade80" : "#f87171" }}>
                {verifyResult
                  ? (verifyResult.valid ? "✅ Passport verified" : "⚠️ Passport hash mismatch")
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
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>5 · Tampering demo</h3>
            <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
              Modify the chart (e.g. change 12% → 4%), then upload it here to prove tampering.
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
