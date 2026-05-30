import { useEffect, useState } from "react";
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

  if (!hash) {
    return (
      <div className="section" style={{ minHeight: "100vh" }}>
        <div className="section-inner" style={{ maxWidth: 760 }}>
          <Link to="/" style={{ fontSize: 13, opacity: 0.55, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32, textDecoration: "none" }}>
            ← Back to Home
          </Link>
          <div className="section-header">
            <p className="section-label">Playback</p>
            <h2 className="section-title">Video not specified</h2>
            <p className="section-desc">This page requires a hash in the URL.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section" style={{ minHeight: "100vh" }}>
      <div className="section-inner" style={{ maxWidth: 900 }}>
        <Link to="/" style={{ fontSize: 13, opacity: 0.55, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32, textDecoration: "none" }}>
          ← Back to Home
        </Link>

        <div className="section-header" style={{ marginBottom: 28 }}>
          <p className="section-label">Playback</p>
          <h2 className="section-title">Recorded Video</h2>
          <p className="section-desc">Scan a QR code to watch the original recording tied to its on-chain proof.</p>
        </div>

        <div className="tech-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12, fontSize: 15 }}>Video</h3>
          {videoInfo ? (
            <>
              <video
                src={getVideoUrl(hash)}
                controls
                style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)" }}
              />
              <div style={{ marginTop: 12, fontSize: 12, opacity: 0.65, display: "flex", flexWrap: "wrap", gap: 16 }}>
                <span><strong>File</strong>: {videoInfo.filename}</span>
                <span><strong>Type</strong>: {videoInfo.mimetype}</span>
                <span><strong>Size</strong>: {formatBytes(videoInfo.size)}</span>
                <span><strong>Stored</strong>: {new Date(videoInfo.storedAt).toLocaleString()}</span>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, opacity: 0.6, margin: 0 }}>
              {loading ? "Loading video…" : (videoError || "Video not available on this server.")}
            </p>
          )}
        </div>

        <div className="tech-card">
          <h3 style={{ marginBottom: 12, fontSize: 15 }}>On-chain proof</h3>
          {verifyResult ? (
            verifyResult.authenticated ? (
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                <div><strong>Status</strong>: Authenticated ✅</div>
                <div><strong>Creator</strong>: <code>{verifyResult.creator}</code></div>
                <div><strong>Timestamp</strong>: {new Date((verifyResult.timestamp || 0) * 1000).toLocaleString()}</div>
                <div><strong>Hash</strong>: <code>{verifyResult.hash}</code></div>
              </div>
            ) : (
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                <div><strong>Status</strong>: Not found on-chain</div>
                <div><strong>Hash</strong>: <code>{verifyResult.hash}</code></div>
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
