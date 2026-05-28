import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
import ABI from "../abi/Hashmark.json";
import { createData360Passport, verifyData360Passport, getInfo, type Data360Passport, type Data360VerifyResponse, type Data360VerifyOptions } from "../api";
import { useWallet } from "../hooks/useWallet";

const _raw_addr = (import.meta.env.VITE_CONTRACT_ADDRESS as string) || "";
const ENV_CONTRACT_ADDRESS = (_raw_addr.match(/0x[0-9a-fA-F]{40}/) || [""])[0];

type Stage = "idle" | "generating" | "verifying" | "anchoring" | "done" | "error";

export default function Data360Passport() {
  const [searchParams] = useSearchParams();
  const wallet = useWallet();

  const [contractAddress, setContractAddress] = useState(ENV_CONTRACT_ADDRESS);
  const [indicator, setIndicator] = useState("WB_HNP_SP_POP_TOTL");
  const [country, setCountry] = useState("WLD");
  const [date, setDate] = useState("2015:2023");
  const [limit, setLimit] = useState(12);

  const [hashInput, setHashInput] = useState(searchParams.get("hash") ?? "");
  const [passport, setPassport] = useState<Data360Passport | null>(null);
  const [verifyResult, setVerifyResult] = useState<Data360VerifyResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
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
  };

  const formatError = (err: unknown) => {
    const message = (err as Error)?.message || "Unexpected error.";
    if (message.includes("Failed to fetch")) {
      return "Backend not reachable. Start the Hashmark backend on http://localhost:4000.";
    }
    return message;
  };

  const handleGenerate = async () => {
    resetStatus();
    setStage("generating");
    try {
      const response = await createData360Passport({
        indicator: indicator.trim(),
        country: country.trim(),
        date: date.trim() || undefined,
        limit: Number.isFinite(Number(limit)) ? Number(limit) : undefined,
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
      setStage("done");
    } catch (err: unknown) {
      setError(formatError(err));
      setStage("error");
    }
  }, [hashInput]);

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
    if (!passport) return;
    if (!wallet.signer) {
      setError("Connect your MetaMask wallet to anchor this passport on-chain.");
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
      const tx = await contract.authenticateVideo(passport.hash);
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
      await handleVerify(passport.hash);
      setStage("done");
    } catch (err: unknown) {
      const msg = (err as { reason?: string; message?: string }).reason
        || (err as Error).message;
      if (msg?.includes("Already authenticated")) {
        setError("This passport hash is already anchored on-chain.");
      } else if ((err as { code?: number }).code === 4001 || msg?.includes("user rejected")) {
        setError("Transaction rejected in MetaMask.");
      } else {
        setError(msg ?? "On-chain anchoring failed.");
      }
      setStage("error");
    }
  };

  const downloadPassport = () => {
    if (!passport) return;
    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data360-passport-${passport.hash.slice(0, 12)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const busy = stage === "generating" || stage === "verifying" || stage === "anchoring";
  const seriesPreview = passport?.data360.series.slice(0, 6) ?? [];

  return (
    <div className="section" style={{ minHeight: "100vh" }}>
      <div className="section-inner" style={{ maxWidth: 920 }}>
        <Link to="/" style={{ fontSize: 13, opacity: 0.55, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32, textDecoration: "none" }}>
          ← Back to Home
        </Link>

        <div className="section-header">
          <p className="section-label">Digital Passport</p>
          <h2 className="section-title">Data360 Facts Passport</h2>
          <p className="section-desc">
            Generate a portable, shareable proof for World Bank Data360 statistics. Every passport
            includes a cryptographic hash, a verification QR, and optional on-chain anchoring.
          </p>
        </div>

        <div className="tech-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12, fontSize: 15 }}>1 · Select Data360 indicator</h3>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, opacity: 0.6 }}>Indicator ID (Data360)</span>
              <input
                type="text"
                value={indicator}
                onChange={e => setIndicator(e.target.value)}
                placeholder="WB_HNP_SP_POP_TOTL"
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, opacity: 0.6 }}>Country / Region</span>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="WLD"
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, opacity: 0.6 }}>Date Range</span>
              <input
                type="text"
                value={date}
                onChange={e => setDate(e.target.value)}
                placeholder="2015:2023"
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, opacity: 0.6 }}>Max points</span>
              <input
                type="number"
                min={1}
                max={100}
                value={limit}
                onChange={e => setLimit(Number(e.target.value))}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
              />
            </label>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16, width: "100%" }} onClick={handleGenerate} disabled={busy}>
            {stage === "generating" ? "Generating passport…" : "Generate Passport"}
          </button>
        </div>

        <div className="tech-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12, fontSize: 15 }}>2 · Verify an existing passport</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              type="text"
              value={hashInput}
              onChange={e => setHashInput(e.target.value)}
              placeholder="Passport hash (sha256)"
              style={{ flex: 1, minWidth: 240, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
            />
            <button className="btn btn-secondary" onClick={() => handleVerify()} disabled={busy}>
              {stage === "verifying" ? "Verifying…" : "Verify Passport"}
            </button>
          </div>
          <p style={{ fontSize: 12, opacity: 0.55, marginTop: 10 }}>
            Share the verification link or QR from the generated passport to validate it anywhere.
          </p>
        </div>

        {(passport || verifyResult) && (
          <div className="tech-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>3 · Passport summary</h3>
            {passport && (
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
                <div>
                  <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Indicator</p>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{passport.data360.indicator.name || passport.data360.indicator.id}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{passport.data360.indicator.id}</div>
                </div>
                <div>
                  <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Country / Region</p>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{passport.data360.country.name || passport.data360.country.id}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{passport.data360.country.iso3 || passport.data360.country.id}</div>
                </div>
                <div>
                  <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Issued</p>
                  <div style={{ fontSize: 13 }}>{new Date(passport.issuedAt).toLocaleString()}</div>
                </div>
              </div>
            )}

            {verifyResult && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: verifyResult.valid ? "#4ade80" : "#f87171" }}>
                  {verifyResult.valid ? "✅ Passport hash verified" : "⚠️ Passport hash mismatch"}
                </div>
                {verifyResult.chain && (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {verifyResult.chain.authenticated
                      ? `On-chain: anchored by ${verifyResult.chain.creator} at ${new Date((verifyResult.chain.timestamp || 0) * 1000).toLocaleString()}`
                      : "On-chain: not yet anchored"}
                  </div>
                )}
              </div>
            )}

            {passport && (
              <div style={{ marginTop: 16, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                <div>
                  <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Passport Hash</p>
                  <code style={{ fontSize: 11, wordBreak: "break-all" }}>{passport.hash}</code>
                  <div style={{ marginTop: 10 }}>
                    <button className="btn btn-secondary" onClick={downloadPassport}>Download JSON</button>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Verify Link</p>
                  {verifyUrl ? (
                    <a href={verifyUrl} style={{ fontSize: 12, wordBreak: "break-all", color: "var(--accent)" }}>
                      {verifyUrl}
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, opacity: 0.5 }}>—</span>
                  )}
                  {qrDataUrl && (
                    <div style={{ marginTop: 12, width: 140, height: 140, background: "#fff", borderRadius: 12, overflow: "hidden" }}>
                      <img src={qrDataUrl} alt="Passport QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {seriesPreview.length > 0 && (
          <div className="tech-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>4 · Data preview</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {seriesPreview.map((point) => (
                <div key={point.date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                  <span>{point.date}</span>
                  <span style={{ fontWeight: 600 }}>
                    {point.value === null ? "—" : point.value.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, opacity: 0.55, marginTop: 12 }}>
              Source: {passport?.data360.dataUrl}
            </p>
          </div>
        )}

        {passport && (
          <div className="tech-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>5 · Anchor on-chain</h3>
            <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
              Anchor the passport hash to the Hashmark contract for a permanent source seal.
            </p>
            {!wallet.address ? (
              <button className="btn btn-secondary" onClick={wallet.connect} disabled={wallet.connecting}>
                {wallet.connecting ? "Connecting…" : "Connect MetaMask"}
              </button>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <button className="btn btn-primary" onClick={handleAnchor} disabled={busy}>
                  {stage === "anchoring" ? "Anchoring…" : "Anchor Passport Hash"}
                </button>
                <span style={{ fontSize: 12, opacity: 0.6 }}>{wallet.chainName}</span>
              </div>
            )}
            {anchorTx && (
              <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
                Anchored in block {anchorTx.blockNumber} · Tx {anchorTx.txHash.slice(0, 10)}…{anchorTx.txHash.slice(-8)}
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
