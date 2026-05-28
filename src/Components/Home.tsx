import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import { getStats } from "../api";
import { useTheme } from "../context/ThemeContext";

/* ─────────────────────────────────────────────────────────────────────────────
   PANEL DATA
   Replace `videos` arrays with your real video file paths.
   Each panel holds a playlist — they auto-advance on loop.
───────────────────────────────────────────────────────────────────────────── */
const PANELS = [
  {
    id: 0,
    label: "Verified Truth",
    sub: "001",
    accent: "#D4A843",
    rgb: "212,168,67",
    // Add your real video paths here: ["/Videos/clip1.mp4", "/Videos/clip2.mp4"]
    videos: [
      "/Videos/run.mp4",
      "/Videos/ofice.mp4",
      "/Videos/think.mp4",
    ],
  },
  {
    id: 1,
    label: "Immutable Record",
    sub: "002",
    accent: "#4A9EDB",
    rgb: "74,158,219",
    videos: [
      "/Videos/truth.mp4",
      "/Videos/ofice.mp4",
      "/Videos/think.mp4",
    ],
  },
  {
    id: 2,
    label: "Zero Erasure",
    sub: "003",
    accent: "#3EC97A",
    rgb: "62,201,122",
    videos: [
      "/Videos/cycle.mp4",
      "/Videos/from.mp4",
      "/Videos/run.mp4",
    ],
  },
  {
    id: 3,
    label: "Origin Proof",
    sub: "004",
    accent: "#DB4A8A",
    rgb: "219,74,138",
    videos: [
      "/Videos/anime.mp4",
      "/Videos/cycle.mp4",
      "/Videos/think.mp4",
    ],
  },
  {
    id: 4,
    label: "Ledger of Reality",
    sub: "005",
    accent: "#9B59E8",
    rgb: "155,89,232",
    videos: [
      "/Videos/cycle.mp4",
      "/Videos/ofice.mp4",
      "/Videos/run.mp4",
    ],
  },
];

const NAV = ["Solutions", "Passport", "About", "Whitepaper"];
const NAV_ROUTES: Record<string, string> = {
  Whitepaper: "/white",
  Solutions: "/solution",
  Passport: "/passport",
  About: "/about",
};

/* ─── Auto-cycling video + mock colour wave when no src ─── */
function PanelVideo({
  videos,
  rgb,
  isHovered,
  autoPlay,
}: {
  videos: string[];
  rgb: string;
  isHovered: boolean;
  autoPlay: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const hasSrc = videos.some((v) => v.length > 0);
  const shouldPlay = isHovered || autoPlay;
  // Keep a ref so the onLoadedData callback always sees the latest value
  const shouldPlayRef = useRef(shouldPlay);
  useEffect(() => {
    shouldPlayRef.current = shouldPlay;
  }, [shouldPlay]);

  /* advance playlist */
  const advance = useCallback(() => {
    setLoaded(false);
    setIdx((i) => (i + 1) % videos.length);
  }, [videos.length]);

  /* play / pause based on hover or autoPlay */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !hasSrc) return;
    if (shouldPlay) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [shouldPlay, hasSrc, idx]);

  const currentSrc = videos[idx];

  return (
    <>
      {/* Real video */}
      {hasSrc && (
        <video
          ref={videoRef}
          key={idx}
          src={currentSrc}
          muted
          playsInline
          preload="auto"
          autoPlay={shouldPlay}
          onCanPlay={() => {
            setLoaded(true);
            if (shouldPlayRef.current) {
              videoRef.current?.play().catch(() => {});
            }
          }}
          onLoadedData={() => {
            setLoaded(true);
            if (shouldPlayRef.current) {
              videoRef.current?.play().catch(() => {});
            }
          }}
          onEnded={advance}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 2,
            opacity: loaded ? 1 : 0,
            transform: isHovered ? "scale(1.0)" : "scale(1.08)",
            transition:
              "opacity 0.9s cubic-bezier(0.4,0,0.2,1), transform 1.6s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      )}

      {/* Animated colour placeholder when no src (remove when you add videos) */}
      {!hasSrc && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-50%",
              background: `conic-gradient(from 0deg at 50% 60%, rgba(${rgb},0.0), rgba(${rgb},0.35), rgba(${rgb},0.0))`,
              animation: "spin 8s linear infinite",
              opacity: isHovered ? 1 : 0.4,
              transition: "opacity 0.8s ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse at 50% 80%, rgba(${rgb},0.22) 0%, transparent 70%)`,
              animation: "breathe 4s ease-in-out infinite",
            }}
          />
        </div>
      )}
    </>
  );
}

/* ─── Individual accordion panel ─── */
function Panel({
  panel,
  index,
  isHovered,
  anyHovered,
  autoActive,
  onEnter,
  onLeave,
  isMobile,
}: {
  panel: (typeof PANELS)[0];
  index: number;
  isHovered: boolean;
  anyHovered: boolean;
  autoActive: boolean;
  onEnter: () => void;
  onLeave: () => void;
  isMobile: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const active = isHovered || (!anyHovered && autoActive);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), index * 140 + 60);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        /* Sizing */
        ...(isMobile
          ? {
              width: "100%",
              height: active ? "clamp(200px, 52vh, 420px)" : "clamp(56px, 8vh, 72px)",
              transition: "height 0.7s cubic-bezier(0.4,0,0.2,1)",
            }
          : {
              flexGrow: active ? 5 : anyHovered ? 0.45 : 1,
              flexShrink: 0,
              flexBasis: "0%",
              height: "100%",
              transition:
                "flex-grow 0.72s cubic-bezier(0.4,0,0.2,1), box-shadow 0.5s ease, transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease",
            }),
        /* Base */
        position: "relative",
        overflow: "hidden",
        borderRadius: isMobile ? 14 : 20,
        cursor: "pointer",
        background: "#080808",
        /* Entrance */
        opacity: mounted ? (anyHovered && !isHovered && !autoActive ? 0.55 : 1) : 0,
        transform: mounted
          ? active && !isMobile
            ? "translateY(-10px) scale(1.016)"
            : anyHovered && !isMobile
            ? "translateY(5px) scale(0.984)"
            : "none"
          : isMobile
          ? "translateX(-30px)"
          : "translateY(60px) scale(0.9)",
        boxShadow: active
          ? `0 40px 100px rgba(0,0,0,0.7), 0 0 0 1.5px rgba(${panel.rgb},0.4), 0 0 60px rgba(${panel.rgb},0.1)`
          : "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* ── Gradient base ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: `radial-gradient(ellipse at 50% 130%, rgba(${panel.rgb},0.2) 0%, #050505 68%)`,
        }}
      />

      {/* ── Dot grid ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          opacity: active ? 0 : 1,
          transition: "opacity 0.8s ease",
        }}
      />

      {/* ── Video / placeholder ── */}
      <PanelVideo
        videos={panel.videos}
        rgb={panel.rgb}
        isHovered={isHovered}
        autoPlay={autoActive && !anyHovered}
      />

      {/* ── Top vignette ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 4,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 32%)",
        }}
      />

      {/* ── Bottom colour vignette ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 4,
          background: `linear-gradient(to top, rgba(${panel.rgb},0.55) 0%, rgba(4,4,4,0.3) 48%, transparent 100%)`,
          opacity: active ? 1 : 0.5,
          transition: "opacity 0.6s ease",
        }}
      />

      {/* ── Scan beam ── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 1.5,
          zIndex: 14,
          background: `linear-gradient(90deg, transparent, rgba(${panel.rgb},0.9) 40%, ${panel.accent} 50%, rgba(${panel.rgb},0.9) 60%, transparent)`,
          boxShadow: `0 0 14px ${panel.accent}, 0 0 4px ${panel.accent}`,
          animation: active ? "scan 2.8s linear infinite" : "none",
          pointerEvents: "none",
        }}
      />

      {/* ── Top row: verified + index ── */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          right: 14,
          zIndex: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 9px",
            borderRadius: 99,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(16px)",
            border: `1px solid rgba(${panel.rgb},0.3)`,
            fontFamily: "'DM Mono', monospace",
            fontSize: 8,
            letterSpacing: "0.18em",
            color: panel.accent,
            opacity: active ? 1 : 0,
            transform: active ? "translateY(0)" : "translateY(-12px)",
            transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          VERIFIED
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: panel.accent,
              boxShadow: active ? `0 0 12px ${panel.accent}` : "none",
              animation: active ? "blink 1.8s ease-in-out infinite" : "none",
              transition: "box-shadow 0.4s ease",
            }}
          />
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.24em",
              color: active ? panel.accent : "rgba(255,255,255,0.22)",
              transition: "color 0.4s ease",
            }}
          >
            {panel.sub}
          </span>
        </div>
      </div>

      {/* ── Idle vertical / horizontal label ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: active ? 0 : anyHovered ? 0.25 : 0.65,
          transition: "opacity 0.45s ease",
          writingMode: isMobile ? "horizontal-tb" : "vertical-rl",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: isMobile ? 11 : 9,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: panel.accent,
          }}
        >
          {panel.label}
        </span>
      </div>

      {/* ── Expanded bottom content ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 22,
          padding: isMobile ? "60px 20px 22px" : "80px 26px 28px",
          background: `linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)`,
          opacity: active ? 1 : 0,
          transform: active ? "translateY(0)" : "translateY(28px)",
          transition: "opacity 0.6s cubic-bezier(0.4,0,0.2,1) 0.05s, transform 0.6s cubic-bezier(0.4,0,0.2,1) 0.05s",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: `rgba(${panel.rgb},0.6)`,
            marginBottom: 7,
          }}
        >
          HASHMARK / {panel.sub}
        </div>
        <div
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: isMobile ? 24 : 28,
            fontWeight: 300,
            color: "#fff",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: 10,
          }}
        >
          {panel.label}
        </div>
        <div style={{ height: 1, width: 40, background: `linear-gradient(90deg, ${panel.accent}, transparent)`, opacity: 0.7 }} />
      </div>

      {/* ── Play placeholder ── */}
      {!panel.videos.some((v) => v) && active && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px)",
              border: `1.5px solid rgba(${panel.rgb},0.35)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "popIn 0.45s cubic-bezier(0.4,0,0.2,1) both",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={panel.accent} style={{ marginLeft: 4 }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Inner glow border ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: isMobile ? 12 : 20,
          zIndex: 30,
          pointerEvents: "none",
          boxShadow: active
            ? `inset 0 0 0 1.5px rgba(${panel.rgb},0.45)`
            : "inset 0 0 0 1px rgba(255,255,255,0.04)",
          transition: "box-shadow 0.5s ease",
        }}
      />
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function HashmarkPage() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [autoIndex, setAutoIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { dark, toggleDark } = useTheme();
  const [totalProofs, setTotalProofs] = useState<number | null>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Responsive */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* Fetch live proof count every 20 s */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getStats();
        if (!cancelled) setTotalProofs(data.totalProofs);
      } catch { /* offline — keep null */ }
    };
    load();
    const id = setInterval(load, 20_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  /* Auto-rotate active panel every 5 s when not hovered */
  useEffect(() => {
    if (hovered !== null) {
      if (autoRef.current) clearInterval(autoRef.current);
      return;
    }
    autoRef.current = setInterval(() => {
      setAutoIndex((i) => (i + 1) % PANELS.length);
    }, 5000);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [hovered]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body, #root, #__next {
          width: 100%;
          height: 100%;
          min-height: 100%;
          background: #050505;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }

        @keyframes scan {
          0%   { top: -2px; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.8); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.06); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <div
        style={{
          width: "100vw",
          height: "100dvh",
          background: dark ? "#050505" : "#f5f3ef",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "'DM Mono', monospace",
          transition: "background 0.4s ease",
        }}
      >
        {/* ══════════════════════════════════════════════
            HEADER
        ══════════════════════════════════════════════ */}
        <header
          style={{
            position: "relative",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "0 20px" : "0 clamp(32px, 4vw, 64px)",
            height: isMobile ? 64 : 70,
            flexShrink: 0,
            animation: "slideDown 0.9s cubic-bezier(0.4,0,0.2,1) both 0.1s",
            background: dark ? "#0d0d0d" : "#ffffff",
            borderBottom: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.12)",
            transition: "background 0.35s ease, border-color 0.35s ease",
          }}
        >
          {/* ── Brand ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                position: "absolute", width: 34, height: 34, borderRadius: "50%",
                background: "rgba(212,168,67,0.2)", filter: "blur(6px)",
              }} />
              <svg width="28" height="28" viewBox="0 0 20 20" fill="none" style={{ position: "relative" }}>
                <line x1="6" y1="2" x2="4" y2="18" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
                <line x1="13" y1="2" x2="11" y2="18" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
                <line x1="2" y1="7" x2="18" y2="7" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
                <line x1="1.5" y1="13" x2="17.5" y2="13" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{
                fontSize: isMobile ? 15 : 17,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: dark ? "#ffffff" : "#0a0a0a",
                fontWeight: 700,
                lineHeight: 1,
                transition: "color 0.35s",
              }}>HASHMARK</span>
              <span style={{
                fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase",
                color: "#D4A843", fontWeight: 500, lineHeight: 1,
              }}>PROTOCOL</span>
            </div>
          </div>

          {/* ── Desktop nav ── */}
          {!isMobile && (
            <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>

              {/* Nav links */}
              {NAV.map((item) => {
                const to = NAV_ROUTES[item];
                const sharedStyle = {
                  fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" as const,
                  textDecoration: "none", fontWeight: 600,
                  color: dark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)",
                  padding: "7px 14px", borderRadius: 7,
                  transition: "color 0.2s, background 0.2s",
                  fontFamily: "'DM Mono', monospace",
                };
                const handlers = {
                  onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.color = dark ? "#fff" : "#000";
                    e.currentTarget.style.background = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
                  },
                  onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.color = dark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)";
                    e.currentTarget.style.background = "transparent";
                  },
                };
                return to
                  ? <Link key={item} to={to} style={sharedStyle} {...handlers}>{item}</Link>
                  : <a key={item} href="#" style={sharedStyle} {...handlers}>{item}</a>;
              })}

              {/* Separator */}
              <div style={{ width: 1, height: 22, background: dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)", margin: "0 8px" }} />

              {/* Ledger Live pill */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 99,
                border: "1px solid rgba(74,222,128,0.4)",
                background: dark ? "rgba(74,222,128,0.1)" : "rgba(74,222,128,0.12)",
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#4ade80", boxShadow: "0 0 8px #4ade80",
                  animation: "blink 2s ease-in-out infinite",
                }} />
                <span style={{ fontSize: 11, color: "#22c55e", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
                  Live
                </span>
              </div>

              {/* Separator */}
              <div style={{ width: 1, height: 22, background: dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)", margin: "0 8px" }} />

              {/* ── Theme toggle pill ── */}
              <button
                onClick={toggleDark}
                aria-label="Toggle theme"
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "7px 14px", borderRadius: 99, cursor: "pointer",
                  border: dark ? "1.5px solid rgba(212,168,67,0.6)" : "1.5px solid rgba(0,0,0,0.2)",
                  background: dark ? "rgba(212,168,67,0.12)" : "rgba(0,0,0,0.06)",
                  transition: "background 0.3s, border-color 0.3s, transform 0.2s",
                  flexShrink: 0,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.06)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              >
                {dark ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="2.2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="5" fill="rgba(212,168,67,0.25)" />
                      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#D4A843", textTransform: "uppercase" }}>Light</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(30,30,60,0.3)" stroke="#334" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#334155", textTransform: "uppercase" }}>Dark</span>
                  </>
                )}
              </button>

              {/* Separator */}
              <div style={{ width: 1, height: 22, background: dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)", margin: "0 4px" }} />

              {/* Get Started CTA */}
              <a href="/nav"
                style={{
                  marginLeft: 4, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
                  textDecoration: "none", fontWeight: 700, fontFamily: "'DM Mono', monospace",
                  color: "#0a0a0a",
                  background: "linear-gradient(135deg, #D4A843 0%, #f0cc6e 50%, #D4A843 100%)",
                  backgroundSize: "200% auto",
                  padding: "9px 20px", borderRadius: 8,
                  boxShadow: "0 2px 16px rgba(212,168,67,0.45)",
                  transition: "box-shadow 0.2s, transform 0.15s, background-position 0.4s",
                  whiteSpace: "nowrap" as const,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.boxShadow = "0 4px 28px rgba(212,168,67,0.65)";
                  el.style.transform = "translateY(-2px)";
                  el.style.backgroundPosition = "right center";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.boxShadow = "0 2px 16px rgba(212,168,67,0.45)";
                  el.style.transform = "translateY(0)";
                  el.style.backgroundPosition = "left center";
                }}
              >Get Started</a>
            </nav>
          )}

          {/* ── Mobile right side ── */}
          {isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={toggleDark}
                aria-label="Toggle theme"
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 11px", borderRadius: 99, cursor: "pointer",
                  border: dark ? "1.5px solid rgba(212,168,67,0.6)" : "1.5px solid rgba(0,0,0,0.2)",
                  background: dark ? "rgba(212,168,67,0.12)" : "rgba(0,0,0,0.06)",
                }}
              >
                {dark ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="5" fill="rgba(212,168,67,0.25)" />
                    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(30,30,60,0.3)" stroke="#334" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
                <span style={{ fontSize: 10, fontWeight: 600, color: dark ? "#D4A843" : "#334155" }}>
                  {dark ? "Light" : "Dark"}
                </span>
              </button>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 5 }}
                aria-label="Menu"
              >
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: i === 1 ? 20 : 28, height: 2,
                    background: dark ? "#D4A843" : "#333", borderRadius: 2,
                    transition: "width 0.3s ease",
                  }} />
                ))}
              </button>
            </div>
          )}
        </header>

        {/* Mobile menu dropdown */}
        {isMobile && menuOpen && (
          <div
            style={{
              position: "absolute",
              top: 62,
              left: 0,
              right: 0,
              zIndex: 200,
              background: dark ? "rgba(6,6,6,0.97)" : "rgba(245,243,239,0.97)",
              backdropFilter: "blur(24px)",
              borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)",
              padding: "8px 20px 20px",
              animation: "slideDown 0.3s ease both",
            }}
          >
            {NAV.map((item) => {
              const to = NAV_ROUTES[item];
              const mobileStyle = {
                display: "flex", alignItems: "center",
                fontFamily: "'DM Mono', monospace", fontSize: 13,
                letterSpacing: "0.1em", textTransform: "uppercase" as const,
                textDecoration: "none", fontWeight: 500,
                color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                padding: "14px 0",
                borderBottom: dark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)",
                transition: "color 0.2s",
              };
              return to
                ? <Link key={item} to={to} onClick={() => setMenuOpen(false)} style={mobileStyle}>{item}</Link>
                : <a key={item} href="#" onClick={() => setMenuOpen(false)} style={mobileStyle}>{item}</a>;
            })}
            <a
              href="#"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                marginTop: 16,
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                fontWeight: 700,
                color: "#050505",
                background: "linear-gradient(135deg, #D4A843, #e8c46a)",
                padding: "13px 0",
                borderRadius: 8,
                textAlign: "center",
                boxShadow: "0 0 24px rgba(212,168,67,0.3)",
              }}
            >
              Get Started
            </a>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            PANEL STRIP — fills remaining height
        ══════════════════════════════════════════════ */}
        <main
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 10 : "clamp(8px, 1vw, 16px)",
            padding: isMobile
              ? "8px 16px 16px"
              : "clamp(8px, 1.2vh, 20px) clamp(32px, 4vw, 72px) clamp(16px, 2vh, 36px)",
            overflow: isMobile ? "auto" : "hidden",
            animation: "fadeIn 0.6s ease both 0.3s",
          }}
        >
          {PANELS.map((panel, i) => (
            <Panel
              key={panel.id}
              panel={panel}
              index={i}
              isHovered={hovered === panel.id}
              anyHovered={hovered !== null}
              autoActive={autoIndex === i}
              onEnter={() => setHovered(panel.id)}
              onLeave={() => setHovered(null)}
              isMobile={isMobile}
            />
          ))}
        </main>

        {/* ══════════════════════════════════════════════
            FOOTER BAR
        ══════════════════════════════════════════════ */}
        <footer
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "10px 20px" : "clamp(10px, 1.4vh, 18px) clamp(32px, 4vw, 72px)",
            animation: "slideUp 0.9s cubic-bezier(0.4,0,0.2,1) both 0.5s",
          }}
        >
          {/* Auto-advance progress indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {PANELS.map((p, i) => (
              <button
                key={i}
                onClick={() => { setAutoIndex(i); setHovered(null); }}
                aria-label={p.label}
                style={{
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  position: "relative",
                  height: 2,
                  width: isMobile ? 20 : 28,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.07)",
                  overflow: "hidden",
                }}
              >
                {i === autoIndex && hovered === null && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "100%",
                      background: PANELS[autoIndex].accent,
                      borderRadius: 2,
                      animation: "progressBar 5s linear both",
                    }}
                  />
                )}
                {i !== autoIndex && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: i < autoIndex ? PANELS[i].accent : "rgba(255,255,255,0.07)",
                      opacity: i < autoIndex ? 0.4 : 1,
                      borderRadius: 2,
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tagline */}
          {!isMobile && (
            <span
              style={{
                fontSize: 8,
                fontStyle: "italic",
                color: "#1c1c1c",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              If something matters, it deserves proof. — © {new Date().getFullYear()} Hashmark Protocol
            </span>
          )}

          {/* Live proof count */}
          {!isMobile && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {totalProofs !== null && (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80", display: "inline-block" }} />
                  {totalProofs.toLocaleString()} proof{totalProofs !== 1 ? "s" : ""} on-chain
                </>
              )}
            </span>
          )}

          {/* Contact */}
          {!isMobile && (
            <span style={{ fontSize: 9, color: "#222", letterSpacing: "0.1em" }}>
              @ hashmark.protocol
            </span>
          )}
        </footer>
      </div>
      <Footer />
    </>
  );
}
