import { useState, useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
import jsPDF from "jspdf";
import { hashFile, verifyHash, getQrCode, getInfo, type VerifyResult } from "../api";
import { useWallet } from "../hooks/useWallet";
import ABI from "../abi/Hashmark.json";

const _raw_addr = (import.meta.env.VITE_CONTRACT_ADDRESS as string) || "";
const ENV_CONTRACT_ADDRESS = (_raw_addr.match(/0x[0-9a-fA-F]{40}/) || [""])[0];

/* ─── types ─── */
interface AuthResult {
  txHash:      string;
  blockNumber: number;
  creator:     string;
  timestamp:   number;
  chainId:     number;
  chainName:   string;
  hash:        string;
  filename?:   string;
}

type Stage = "idle" | "hashing" | "authenticating" | "verifying" | "done" | "error";

/* ─── certificate generator ─── */
async function downloadCertificate(proof: AuthResult, qrDataUrl: string | null, verifyUrl: string | null) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;

  // Background
  doc.setFillColor(8, 8, 8);
  doc.rect(0, 0, W, H, "F");

  // Gold top bar
  doc.setFillColor(212, 168, 67);
  doc.rect(0, 0, W, 10, "F");

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(212, 168, 67);
  doc.text("HASHMARK PROTOCOL", W / 2, 26, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(240, 240, 240);
  doc.text("Certificate of Authenticity", W / 2, 35, { align: "center" });

  // Divider
  doc.setDrawColor(212, 168, 67);
  doc.setLineWidth(0.4);
  doc.line(20, 41, W - 20, 41);

  // Intro text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text(
    "This certifies that the following digital content has been permanently\nauthenticated on the Hashmark blockchain.",
    W / 2, 50, { align: "center" }
  );

  // Video hash (left column)
  const printField = (label: string, value: string, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(212, 168, 67);
    doc.text(label, 20, y);
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(230, 230, 230);
    // wrap long strings
    const lines = doc.splitTextToSize(value, 115);
    doc.text(lines, 20, y + 5);
    return y + 5 + lines.length * 4;
  };

  let y = 66;
  y = printField("VIDEO HASH (SHA-256)", proof.hash, y) + 4;
  y = printField("CREATOR WALLET ADDRESS", proof.creator, y) + 4;
  y = printField("TRANSACTION HASH", proof.txHash, y) + 4;
  y = printField("BLOCK NUMBER", String(proof.blockNumber), y) + 4;
  y = printField("TIMESTAMP", new Date(proof.timestamp * 1000).toLocaleString(), y) + 4;
  y = printField("NETWORK", `${proof.chainName} (Chain ID: ${proof.chainId})`, y) + 4;
  if (proof.filename) {
    y = printField("ORIGINAL FILENAME", proof.filename, y) + 4;
  }
  if (verifyUrl) {
    y = printField("VERIFY URL", verifyUrl, y) + 4;
  }

  // QR code (right column)
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", W - 72, 60, 52, 52);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text("Scan to verify on-chain", W - 46, 116, { align: "center" });
  }

  // Divider
  doc.setDrawColor(212, 168, 67);
  doc.line(20, Math.max(y + 6, 130), W - 20, Math.max(y + 6, 130));

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Powered by Hashmark Protocol — The Ledger of Reality", W / 2, Math.max(y + 14, 140), { align: "center" });
  doc.text("If it matters, it is on Hashmark.", W / 2, Math.max(y + 20, 147), { align: "center" });

  // Gold bottom bar
  doc.setFillColor(212, 168, 67);
  doc.rect(0, H - 10, W, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(8, 8, 8);
  doc.text("hashmark.protocol", W / 2, H - 3.5, { align: "center" });

  const safeName = proof.filename
    ? proof.filename.replace(/[^a-z0-9]/gi, "-").slice(0, 30)
    : proof.hash.slice(0, 16);
  doc.save(`hashmark-certificate-${safeName}.pdf`);
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Verify() {
  const [searchParams]  = useSearchParams();
  const wallet          = useWallet();

  const [contractAddress, setContractAddress] = useState(ENV_CONTRACT_ADDRESS);

  // Fetch contract address from backend when not set via env var
  useEffect(() => {
    if (contractAddress) return;
    getInfo().then(info => { if (info.contractAddress) setContractAddress(info.contractAddress); }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [file, setFile]           = useState<File | null>(null);
  const [hash, setHash]           = useState("");
  const [manualHash, setManualHash] = useState(searchParams.get("hash") ?? "");
  const [stage, setStage]         = useState<Stage>("idle");
  const [error, setError]         = useState("");
  const [authResult, setAuthResult]     = useState<AuthResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [qrDataUrl, setQrDataUrl]   = useState<string | null>(null);
  const [qrVerifyUrl, setQrVerifyUrl] = useState<string | null>(null);
  const [certReady, setCertReady]   = useState(false);

  const reset = () => {
    setStage("idle"); setError("");
    setAuthResult(null); setVerifyResult(null);
    setQrDataUrl(null); setQrVerifyUrl(null);
    setCertReady(false);
  };

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f); reset(); setHash("");
  }, []);

  /* ── auto-verify when ?hash= is in URL ── */
  useEffect(() => {
    const paramHash = searchParams.get("hash");
    if (!paramHash) return;
    setManualHash(paramHash);
    setTimeout(async () => {
      setStage("verifying");
      try {
        const result = await verifyHash(paramHash);
        setVerifyResult(result);
        if (result.authenticated) {
          const qr = await getQrCode(paramHash);
          setQrDataUrl(qr.qrDataUrl);
          setQrVerifyUrl(qr.verifyUrl);
          setCertReady(false); // can't download cert without tx data from URL
        }
        setStage("done");
      } catch (err: unknown) { setError((err as Error).message); setStage("error"); }
    }, 120);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Step 1: hash file via backend ── */
  const handleHash = async () => {
    if (!file) return;
    reset(); setStage("hashing");
    try {
      const r = await hashFile(file);
      setHash(r.hash); setStage("idle");
    } catch (err: unknown) { setError((err as Error).message); setStage("error"); }
  };

  /* ── Step 2a: authenticate via MetaMask → contract ── */
  const handleAuthenticate = async () => {
    const h = (hash || manualHash).trim();
    if (!h) return;
    if (!wallet.signer) { setError("Connect your MetaMask wallet first."); setStage("error"); return; }
    if (!contractAddress) { setError("Contract address not configured. Check your backend CONTRACT_ADDRESS environment variable."); setStage("error"); return; }

    reset(); setStage("authenticating");
    try {
      const contract = new ethers.Contract(contractAddress, ABI, wallet.signer);
      const tx       = await contract.authenticateVideo(h);
      const receipt  = await tx.wait();

      const block     = await wallet.provider!.getBlock(receipt.blockNumber);
      const timestamp = block?.timestamp ?? Math.floor(Date.now() / 1000);

      const result: AuthResult = {
        txHash:      receipt.hash,
        blockNumber: Number(receipt.blockNumber),
        creator:     wallet.address!,
        timestamp,
        chainId:     wallet.chainId!,
        chainName:   wallet.chainName,
        hash:        h,
        filename:    file?.name,
      };
      setAuthResult(result);

      // Fetch QR code
      const qr = await getQrCode(h);
      setQrDataUrl(qr.qrDataUrl);
      setQrVerifyUrl(qr.verifyUrl);
      setCertReady(true);
      setStage("done");
    } catch (err: unknown) {
      const msg = (err as { reason?: string; message?: string }).reason
        || (err as Error).message;
      if (msg?.includes("Already authenticated")) {
        setError("This hash is already authenticated on-chain. Use Verify to check it.");
      } else if ((err as { code?: number }).code === 4001 || msg?.includes("user rejected")) {
        setError("Transaction rejected in MetaMask.");
      } else {
        setError(msg ?? "Transaction failed.");
      }
      setStage("error");
    }
  };

  /* ── Step 2b: verify (read-only via backend) ── */
  const handleVerify = async () => {
    const h = (hash || manualHash).trim();
    if (!h) return;
    reset(); setStage("verifying");
    try {
      const result = await verifyHash(h);
      setVerifyResult(result);
      if (result.authenticated) {
        const qr = await getQrCode(h);
        setQrDataUrl(qr.qrDataUrl);
        setQrVerifyUrl(qr.verifyUrl);
      }
      setStage("done");
    } catch (err: unknown) { setError((err as Error).message); setStage("error"); }
  };

  const activeHash = hash || manualHash;
  const busy = stage === "hashing" || stage === "authenticating" || stage === "verifying";

  return (
    <div className="section" style={{ minHeight: "100vh" }}>
      <div className="section-inner" style={{ maxWidth: 760 }}>
        <Link to="/" style={{ fontSize: 13, opacity: 0.55, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32, textDecoration: "none" }}>
          ← Back to Home
        </Link>

        <div className="section-header">
          <p className="section-label">On-chain Proof</p>
          <h2 className="section-title">Authenticate &amp; Verify</h2>
          <p className="section-desc">
            Hash your video, sign with your wallet, and store an immutable proof on the Hashmark contract.
            Download a verifiable PDF certificate after authentication.
          </p>
        </div>

        {/* ══ 0. WALLET PANEL ══ */}
        <div className="tech-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>0 · Connect Wallet</h3>

          {!wallet.installed ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, opacity: 0.6 }}>MetaMask not detected.</span>
              <a href="https://metamask.io/download/" target="_blank" rel="noreferrer"
                className="btn btn-primary" style={{ fontSize: 12, padding: "7px 16px" }}>
                Install MetaMask
              </a>
            </div>
          ) : wallet.address ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80", display: "inline-block" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#4ade80" }}>Connected</span>
                </div>
                <code style={{ fontSize: 13 }}>{wallet.address}</code>
                <div style={{ fontSize: 12, opacity: 0.55, display: "flex", gap: 16 }}>
                  <span>{wallet.chainName}</span>
                  <span>{wallet.balance} ETH</span>
                </div>
              </div>
              <button onClick={wallet.disconnect} className="btn btn-secondary" style={{ fontSize: 12, padding: "7px 14px" }}>
                Disconnect
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={wallet.connect}
                disabled={wallet.connecting}
                className="btn btn-primary"
                style={{ alignSelf: "flex-start" }}
              >
                {wallet.connecting ? "Connecting…" : "Connect MetaMask"}
              </button>
              {wallet.error && <p style={{ fontSize: 13, color: "#DB4A4A" }}>{wallet.error}</p>}
              <p style={{ fontSize: 12, opacity: 0.5 }}>
                You need a wallet to authenticate videos on-chain.
                Verification is available without a wallet.
              </p>
            </div>
          )}

          {/* Contract info */}
          {contractAddress ? (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 11, opacity: 0.5, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span>Contract: <code>{contractAddress.slice(0,6)}…{contractAddress.slice(-4)}</code></span>
            </div>
          ) : (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", background: "rgba(212,168,67,0.06)", borderRadius: 6, padding: "10px 12px" }}>
              <p style={{ fontSize: 12, color: "#D4A843" }}>⚠️ Contract address not configured. Set CONTRACT_ADDRESS in back/.env and restart the server.</p>
              <code style={{ fontSize: 11, display: "block", marginTop: 6, opacity: 0.8 }}>
                cd back &amp;&amp; npm run deploy:local
              </code>
            </div>
          )}
        </div>

        {/* ══ 1. HASH ══ */}
        <div className="tech-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>1 · Hash Your Video</h3>
          <label htmlFor="video-upload" style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            border: "2px dashed var(--border)", borderRadius: 12, padding: "28px 16px",
            cursor: "pointer", gap: 8, background: file ? "rgba(74,158,219,0.05)" : undefined,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 36, height: 36, opacity: 0.4 }}>
              <path d="M15 10l-4 4-4-4m4 4V3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ opacity: 0.65, fontSize: 14 }}>{file ? file.name : "Click to choose a video file"}</span>
            {file && <span style={{ fontSize: 11, opacity: 0.45 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}</span>}
            <input id="video-upload" type="file" accept="video/*,audio/*" onChange={onFileChange} style={{ display: "none" }} />
          </label>

          <button className="btn btn-primary" style={{ marginTop: 12, width: "100%" }}
            onClick={handleHash} disabled={!file || busy}>
            {stage === "hashing" ? "Computing SHA-256…" : "Compute Hash"}
          </button>

          {hash && (
            <div style={{ marginTop: 14, background: "rgba(62,201,122,0.07)", border: "1px solid rgba(62,201,122,0.3)", borderRadius: 8, padding: "12px 16px" }}>
              <p style={{ fontSize: 11, opacity: 0.55, marginBottom: 4 }}>SHA-256 fingerprint</p>
              <code style={{ fontSize: 12, wordBreak: "break-all" }}>{hash}</code>
            </div>
          )}
        </div>

        {/* ══ OR paste hash ══ */}
        <div className="tech-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12, fontSize: 15 }}>— or paste an existing hash</h3>
          <input type="text" placeholder="e.g. a1b2c3d4…"
            value={manualHash}
            onChange={e => { setManualHash(e.target.value); reset(); }}
            style={{ width: "100%", padding: "10px 14px", background: "var(--surface)",
              border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)",
              fontSize: 13, boxSizing: "border-box" }} />
        </div>

        {/* ══ 2. ACTIONS ══ */}
        {activeHash && (
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <button className="btn btn-primary" style={{ flex: 1 }}
              onClick={handleAuthenticate} disabled={busy || !wallet.address}>
              {stage === "authenticating" ? "Waiting for MetaMask…" : "Authenticate on-chain"}
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }}
              onClick={handleVerify} disabled={busy}>
              {stage === "verifying" ? "Verifying…" : "Verify on-chain"}
            </button>
          </div>
        )}
        {activeHash && !wallet.address && (
          <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 20, textAlign: "center" }}>
            Connect wallet to authenticate · Verification works without wallet
          </p>
        )}

        {/* ══ RESULTS ══ */}
        {stage === "error" && (
          <div style={{ background: "rgba(219,74,74,0.08)", border: "1px solid rgba(219,74,74,0.4)", borderRadius: 8, padding: "14px 18px", marginBottom: 16 }}>
            <strong style={{ color: "#DB4A4A" }}>Error</strong>
            <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        {/* Auth success */}
        {authResult && stage === "done" && (
          <div style={{ background: "rgba(62,201,122,0.07)", border: "1px solid rgba(62,201,122,0.3)", borderRadius: 8, padding: "18px 20px", marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#4ade80" }}>✅ Authenticated on-chain</p>
            <ProofRow label="Video Hash"   value={authResult.hash} />
            <ProofRow label="Creator"      value={authResult.creator} />
            <ProofRow label="Tx Hash"      value={authResult.txHash} link={explorerTxLink(authResult.chainId, authResult.txHash)} />
            <ProofRow label="Block"        value={`#${authResult.blockNumber.toLocaleString()}`} />
            <ProofRow label="Timestamp"    value={new Date(authResult.timestamp * 1000).toLocaleString()} />
            <ProofRow label="Network"      value={`${authResult.chainName} (${authResult.chainId})`} />
            {authResult.filename && <ProofRow label="File" value={authResult.filename} />}

            {qrDataUrl && <QrCard dataUrl={qrDataUrl} verifyUrl={qrVerifyUrl!} />}

            {certReady && (
              <button
                className="btn btn-primary"
                style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}
                onClick={() => downloadCertificate(authResult, qrDataUrl, qrVerifyUrl)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                  <path d="M12 10v6m-3-3l3 3 3-3M5 20h14M9 4h6v6H9z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download Certificate (PDF)
              </button>
            )}
          </div>
        )}

        {/* Verify result */}
        {verifyResult && stage === "done" && (
          verifyResult.authenticated ? (
            <div style={{ background: "rgba(62,201,122,0.07)", border: "1px solid rgba(62,201,122,0.3)", borderRadius: 8, padding: "18px 20px" }}>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#4ade80" }}>✅ Hash is authenticated</p>
              <ProofRow label="Video Hash" value={verifyResult.hash} />
              <ProofRow label="Creator"    value={verifyResult.creator!} />
              <ProofRow label="Timestamp"  value={new Date(verifyResult.timestamp! * 1000).toLocaleString()} />
              {qrDataUrl && <QrCard dataUrl={qrDataUrl} verifyUrl={qrVerifyUrl!} />}
            </div>
          ) : (
            <div style={{ background: "rgba(212,168,67,0.07)", border: "1px solid rgba(212,168,67,0.35)", borderRadius: 8, padding: "18px 20px" }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#D4A843" }}>⚠️ Not found on-chain</p>
              <p style={{ marginTop: 8, opacity: 0.65, fontSize: 13 }}>
                No proof exists for <code style={{ fontSize: 12 }}>{verifyResult.hash}</code>.
                Authenticate it first.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ── QR Code card ── */
function QrCard({ dataUrl, verifyUrl }: { dataUrl: string; verifyUrl: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(62,201,122,0.2)", display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
      <img src={dataUrl} alt="QR code to verify" style={{ width: 160, height: 160, borderRadius: 8, background: "#fff", padding: 4 }} />
      <div style={{ flex: 1, minWidth: 180 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>🔗 Shareable Proof</p>
        <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 10, lineHeight: 1.5 }}>
          Scan the QR code or share this link. Anyone can verify this hash on-chain — no wallet needed.
        </p>
        <code style={{ fontSize: 10, wordBreak: "break-all", display: "block", marginBottom: 10, opacity: 0.65 }}>{verifyUrl}</code>
        <button
          onClick={async () => { await navigator.clipboard.writeText(verifyUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 14px" }}
        >
          {copied ? "✓ Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

/* ── single proof row ── */
function ProofRow({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 12, alignItems: "flex-start" }}>
      <span style={{ opacity: 0.5, minWidth: 100, flexShrink: 0 }}>{label}</span>
      {link
        ? <a href={link} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all", flex: 1, color: "var(--accent)" }}>{value}</a>
        : <code style={{ wordBreak: "break-all", flex: 1 }}>{value}</code>
      }
    </div>
  );
}

/* ── explorer link helper ── */
function explorerTxLink(chainId: number, txHash: string): string | undefined {
  const explorers: Record<number, string> = {
    1:        "https://etherscan.io/tx/",
    11155111: "https://sepolia.etherscan.io/tx/",
    137:      "https://polygonscan.com/tx/",
  };
  return explorers[chainId] ? explorers[chainId] + txHash : undefined;
}
