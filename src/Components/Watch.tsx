import { useEffect, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getVideoInfo, getVideoUrl, verifyHash, type VerifyResult, type VideoInfo } from "../api";

export default function Watch() {
  const [searchParams] = useSearchParams();
  const hash = (searchParams.get("hash") || "").trim();
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hash) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setVideoInfo(null);
      setVideoError(null);
      setVerifyResult(null);
      setVerifyError(null);
      try {
        const info = await getVideoInfo(hash);
        if (!cancelled) setVideoInfo(info);
      } catch (err: unknown) {
        if (!cancelled) setVideoError((err as Error).message || "Video not found.");
      }

      try {
        const result = await verifyHash(hash);
        if (!cancelled) setVerifyResult(result);
      } catch (err: unknown) {
        if (!cancelled) setVerifyError((err as Error).message || "Verification failed.");
      }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [hash]);

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background: "#060610",
    color: "#fff",
    padding: "24px 16px 48px",
  };

  const cardStyle: CSSProperties = {
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    padding: 20,
    marginBottom: 20,
  };

  if (!hash) {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Link to="/nav" style={{ fontSize: 13, opacity: 0.55, display: "inline-flex", marginBottom: 32, textDecoration: "none", color: "#D4A843" }}>
            ← Back to Record
          </Link>
          <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, fontSize: 32, marginBottom: 12 }}>Video not specified</h1>
          <p style={{ opacity: 0.6, lineHeight: 1.7 }}>This page requires a hash in the URL, e.g. /watch?hash=…</p>
        </div>
      </div>
    );
  }

  const videoSrc = getVideoUrl(hash);

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link to="/nav" style={{ fontSize: 13, opacity: 0.55, display: "inline-flex", marginBottom: 32, textDecoration: "none", color: "#D4A843" }}>
          ← Back to Record
        </Link>

        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#D4A843", marginBottom: 8 }}>Playback</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 300, fontSize: 32, marginBottom: 8 }}>Recorded Video</h1>
          <p style={{ opacity: 0.55, lineHeight: 1.7 }}>Original recording linked to its on-chain SHA-256 fingerprint.</p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginBottom: 16, fontSize: 15, fontWeight: 500 }}>Video</h2>
          {videoInfo ? (
            <>
              <video
                key={hash}
                src={videoSrc}
                controls
                autoPlay
                playsInline
                preload="metadata"
                style={{ width: "100%", maxHeight: "70vh", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "#000", display: "block" }}
              >
                <source src={videoSrc} type={videoInfo.mimetype || "video/webm"} />
              </video>
              <div style={{ marginTop: 12, fontSize: 12, opacity: 0.65, display: "flex", flexWrap: "wrap", gap: 16 }}>
                <span><strong>File</strong>: {videoInfo.filename}</span>
                <span><strong>Type</strong>: {videoInfo.mimetype}</span>
                <span><strong>Size</strong>: {formatBytes(videoInfo.size)}</span>
                <span><strong>Stored</strong>: {new Date(videoInfo.storedAt).toLocaleString()}</span>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, opacity: 0.6, margin: 0, lineHeight: 1.7 }}>
              {loading ? "Loading video…" : (videoError || "Video not available on this server.")}
            </p>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginBottom: 16, fontSize: 15, fontWeight: 500 }}>On-chain proof</h2>
          {verifyResult ? (
            verifyResult.authenticated ? (
              <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                <div><strong>Status</strong>: Authenticated</div>
                <div><strong>Creator</strong>: <code style={{ wordBreak: "break-all" }}>{verifyResult.creator}</code></div>
                <div><strong>Timestamp</strong>: {new Date((verifyResult.timestamp || 0) * 1000).toLocaleString()}</div>
                <div><strong>Hash</strong>: <code style={{ wordBreak: "break-all" }}>{verifyResult.hash}</code></div>
              </div>
            ) : (
              <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.8 }}>
                <div><strong>Status</strong>: Not found on-chain</div>
                <div><strong>Hash</strong>: <code style={{ wordBreak: "break-all" }}>{verifyResult.hash}</code></div>
              </div>
            )
          ) : (
            <p style={{ fontSize: 13, opacity: 0.6, margin: 0 }}>
              {loading ? "Checking proof…" : (verifyError || "Proof unavailable.")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value < 10 && idx > 0 ? 2 : 0)} ${units[idx]}`;
}
