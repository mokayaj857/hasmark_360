import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
/* ═══════════════════════════════════════════════════════════
   HASHMARK — MVP Demo
   A single-file React/TSX demo simulating the capture →
   hash → sign → anchor → verify flow of the Hashmark ledger.
   Dark cinematic aesthetic. Emerald accents. No external deps
   beyond react, framer-motion, and Tailwind.
   ═══════════════════════════════════════════════════════════ */
type Step = "idle" | "capturing" | "hashing" | "signing" | "anchoring" | "anchored";
interface Proof {
  id: string;
  contentHash: string;
  did: string;
  deviceId: string;
  block: number;
  timestamp: string;
  signer: string;
  label: string;
  trust: number;
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  s: Math.random() * 2 + 1,
  d: Math.random() * 12 + 8,
  delay: Math.random() * 4,
}));
/* ── Animated grid bg ── */
function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.06] pointer-events-none">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="hsl(160,50%,55%)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>
      <motion.div
        className="absolute inset-x-0 h-[40%] bg-gradient-to-b from-transparent via-[hsl(160,50%,40%)] to-transparent opacity-30"
        animate={{ y: ["-50%", "150%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
/* ── Particle field ── */
function Particles() {
  const ps = PARTICLES;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {ps.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[hsl(160,50%,55%)]"
          style={{ width: p.s, height: p.s, left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [0, -80, 0], opacity: [0, 0.5, 0] }}
          transition={{ duration: p.d, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
/* ── Random hex generator ── */
const hex = (n: number) =>
  Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
/* ── Animated hash reveal ── */
function HashReveal({ value }: { value: string }) {
  return (
    <div className="font-mono text-[10px] sm:text-xs break-all leading-relaxed">
      {value.split("").map((c, i) => (
        <motion.span
          key={i + value}
          initial={{ opacity: 0, color: "hsl(160,50%,55%)" }}
          animate={{ opacity: 1, color: "hsl(210,15%,70%)" }}
          transition={{ delay: i * 0.008, duration: 0.4 }}
        >
          {c}
        </motion.span>
      ))}
    </div>
  );
}
/* ── Pipeline indicator ── */
function PipelineDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div className="relative w-3 h-3">
      <div
        className={`absolute inset-0 rounded-full border ${
          done
            ? "bg-[hsl(160,50%,55%)] border-[hsl(160,50%,55%)]"
            : active
            ? "border-[hsl(160,50%,55%)]"
            : "border-[hsl(210,10%,20%)]"
        }`}
      />
      {active && !done && (
        <motion.div
          className="absolute inset-0 rounded-full border border-[hsl(160,50%,55%)]"
          animate={{ scale: [1, 2], opacity: [0.6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}
    </div>
  );
}
/* ── Stat ── */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-lg sm:text-xl font-bold text-[hsl(160,50%,55%)] font-mono">{value}</p>
      <p className="text-[9px] uppercase tracking-[0.25em] text-[hsl(210,10%,40%)] mt-1">{label}</p>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════ */
export default function HashmarkDemo() {
  const [step, setStep] = useState<Step>("idle");
  const [currentHash, setCurrentHash] = useState("");
  const [proofs, setProofs] = useState<Proof[]>([
    {
      id: "p_genesis",
      contentHash: hex(64),
      did: "did:era:0x" + hex(8),
      deviceId: "dvc_" + hex(6),
      block: 1_482_991,
      timestamp: "2026-05-26 14:02:11 UTC",
      signer: "0x" + hex(40),
      label: "Field report — protest, Berlin",
      trust: 982,
    },
    {
      id: "p_002",
      contentHash: hex(64),
      did: "did:era:0x" + hex(8),
      deviceId: "dvc_" + hex(6),
      block: 1_482_854,
      timestamp: "2026-05-26 11:47:03 UTC",
      signer: "0x" + hex(40),
      label: "Lab dataset — sample 0427",
      trust: 911,
    },
  ]);
  const [selected, setSelected] = useState<Proof | null>(null);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<null | { ok: boolean; proof?: Proof }>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  /* simulate capture pipeline */
  useEffect(() => {
    if (step === "idle" || step === "anchored") return;
    const timings: Record<Exclude<Step, "idle" | "anchored">, Step> = {
      capturing: "hashing",
      hashing: "signing",
      signing: "anchoring",
      anchoring: "anchored",
    };
    const next = timings[step as keyof typeof timings];
    const t = setTimeout(() => {
      if (step === "hashing") setCurrentHash(hex(64));
      if (step === "anchoring") {
        const newProof: Proof = {
          id: "p_" + hex(6),
          contentHash: currentHash || hex(64),
          did: "did:era:0x" + hex(8),
          deviceId: "dvc_" + hex(6),
          block: 1_483_000 + Math.floor(Math.random() * 50),
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
          signer: "0x" + hex(40),
          label: "Trusted capture — live",
          trust: 950 + Math.floor(Math.random() * 50),
        };
        setProofs((p) => [newProof, ...p]);
        setSelected(newProof);
      }
      setStep(next);
    }, step === "capturing" ? 1400 : 900);
    return () => clearTimeout(t);
  }, [step, currentHash]);
  const progressMap: Record<Step, number> = {
    idle: 0,
    capturing: 25,
    hashing: 50,
    signing: 75,
    anchoring: 95,
    anchored: 100,
  };
  const progress = progressMap[step];
  const startCapture = () => {
    setStep("capturing");
    setCurrentHash("");
  };
  const reset = () => {
    setStep("idle");
    setCurrentHash("");
  };
  const runVerify = () => {
    const match = proofs.find(
      (p) => p.contentHash.startsWith(verifyInput.trim().toLowerCase()) && verifyInput.length >= 6
    );
    setVerifyResult({ ok: !!match, proof: match });
  };
  const stepIndex = ["capturing", "hashing", "signing", "anchoring", "anchored"].indexOf(step);
  return (
    <div className="min-h-screen bg-[hsl(220,14%,4%)] text-[hsl(210,20%,92%)] selection:bg-[hsl(160,60%,40%)/0.3]">
      {/* ───── NAV ───── */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[hsl(210,10%,10%)]">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-6 h-6 border border-[hsl(160,50%,55%)] rotate-45"
            animate={{ rotate: [45, 405] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <span className="font-bold tracking-[0.2em] text-sm">HASHMARK</span>
          <span className="hidden sm:inline text-[10px] font-mono text-[hsl(160,50%,55%)] tracking-[0.3em]">
            / MVP
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-[hsl(160,50%,55%)]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[hsl(210,10%,50%)] uppercase tracking-[0.25em]">
            Testnet · Block {(1_483_050).toLocaleString()}
          </span>
        </div>
      </nav>
      {/* ───── HEADER ───── */}
      <header className="relative px-6 sm:px-10 py-12 sm:py-16 overflow-hidden">
        <AnimatedGrid />
        <Particles />
        <div className="relative z-10 max-w-5xl">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[hsl(160,50%,55%)] font-mono mb-4">
            Know Your Capture · Ledger of Reality
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-[-0.02em] leading-[1.05] max-w-3xl">
            Prove what is real.
            <br />
            <span className="text-[hsl(160,50%,55%)]">At the moment of creation.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm sm:text-base text-[hsl(210,10%,50%)] leading-relaxed">
            A live MVP simulating Hashmark's capture → hash → sign → anchor pipeline.
            Hardware-rooted identity, on-chain proofs, and a verification layer in one demo.
          </p>
        </div>
      </header>
      {/* ───── STATS ───── */}
      <div className="border-y border-[hsl(210,10%,10%)] bg-[hsl(220,14%,5%)] grid grid-cols-2 sm:grid-cols-4 divide-x divide-[hsl(210,10%,10%)]">
        <Stat label="Proofs Anchored" value={proofs.length.toString().padStart(3, "0")} />
        <Stat label="Active Devices" value="1,284" />
        <Stat label="Avg. Anchor Time" value="0.9s" />
        <Stat label="Trust Index" value="99.7%" />
      </div>
      {/* ───── MAIN GRID ───── */}
      <main className="px-6 sm:px-10 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── CAPTURE PANEL ── */}
        <section className="lg:col-span-2 border border-[hsl(210,10%,10%)] bg-[hsl(220,14%,5%)] rounded-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[hsl(210,10%,10%)]">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[hsl(210,10%,50%)] font-mono">
              01 · Trusted Capture
            </span>
            <span className="text-[10px] font-mono text-[hsl(160,50%,55%)]">
              {step === "idle" ? "READY" : step.toUpperCase()}
            </span>
          </div>
          {/* viewport */}
          <div
            ref={videoRef}
            className="relative aspect-video bg-[hsl(220,14%,3%)] overflow-hidden border-b border-[hsl(210,10%,10%)]"
          >
            <AnimatedGrid />
            {/* fake camera viewfinder corners */}
            {["top-4 left-4 border-l border-t", "top-4 right-4 border-r border-t", "bottom-4 left-4 border-l border-b", "bottom-4 right-4 border-r border-b"].map((c) => (
              <div key={c} className={`absolute w-6 h-6 border-[hsl(160,50%,55%)] ${c}`} />
            ))}
            {/* center indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {step === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <motion.div
                      className="w-20 h-20 mx-auto rounded-full border-2 border-[hsl(160,50%,55%)] flex items-center justify-center"
                      animate={{ boxShadow: ["0 0 0 hsl(160,50%,55%)", "0 0 30px hsl(160,50%,55%)", "0 0 0 hsl(160,50%,55%)"] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    >
                      <div className="w-14 h-14 rounded-full bg-[hsl(160,50%,55%)/0.2]" />
                    </motion.div>
                    <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-[hsl(210,10%,45%)] font-mono">
                      Tap capture to begin
                    </p>
                  </motion.div>
                )}
                {step === "capturing" && (
                  <motion.div
                    key="capturing"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <div className="flex gap-1 justify-center mb-3">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 h-12 bg-[hsl(160,50%,55%)]"
                          animate={{ scaleY: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[hsl(160,50%,55%)] font-mono">
                      Recording from sensor
                    </p>
                  </motion.div>
                )}
                {(step === "hashing" || step === "signing" || step === "anchoring") && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center px-6"
                  >
                    <motion.div
                      className="w-16 h-16 mx-auto border-2 border-[hsl(160,50%,55%)]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="w-full h-full border border-[hsl(160,50%,55%)/0.4] scale-50 rotate-45" />
                    </motion.div>
                    <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-[hsl(160,50%,55%)] font-mono">
                      {step === "hashing" && "Blake2-256 · Hashing on-device"}
                      {step === "signing" && "Secure Enclave · Signing"}
                      {step === "anchoring" && "Broadcasting to AppChain"}
                    </p>
                  </motion.div>
                )}
                {step === "anchored" && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <motion.div
                      className="w-20 h-20 mx-auto rounded-full bg-[hsl(160,50%,55%)/0.15] border-2 border-[hsl(160,50%,55%)] flex items-center justify-center"
                      animate={{ boxShadow: ["0 0 0 hsl(160,50%,55%)", "0 0 40px hsl(160,50%,55%)"] }}
                      transition={{ duration: 1 }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(160,50%,55%)" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                    <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-[hsl(160,50%,55%)] font-mono">
                      Anchored · Proof finalized
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {/* pipeline */}
          <div className="px-5 py-5 border-b border-[hsl(210,10%,10%)]">
            <div className="flex items-center justify-between mb-3">
              {["Capture", "Hash", "Sign", "Anchor"].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <PipelineDot active={stepIndex === i} done={stepIndex > i || step === "anchored"} />
                  <span
                    className={`text-[10px] uppercase tracking-[0.2em] font-mono ${
                      stepIndex >= i || step === "anchored"
                        ? "text-[hsl(210,20%,80%)]"
                        : "text-[hsl(210,10%,30%)]"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-px bg-[hsl(210,10%,12%)] relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-[hsl(160,50%,55%)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
          {/* actions + live hash */}
          <div className="p-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[hsl(210,10%,40%)] font-mono mb-2">
                Content Hash
              </p>
              <div className="min-h-[3rem] p-3 border border-[hsl(210,10%,12%)] bg-[hsl(220,14%,3%)] rounded-sm">
                {currentHash ? (
                  <HashReveal value={currentHash} />
                ) : (
                  <span className="text-[10px] font-mono text-[hsl(210,10%,25%)]">
                    awaiting capture…
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={startCapture}
                disabled={step !== "idle" && step !== "anchored"}
                className="px-5 py-3 text-[10px] uppercase tracking-[0.25em] font-mono bg-[hsl(160,50%,55%)] text-[hsl(220,14%,4%)] font-bold hover:bg-[hsl(160,60%,60%)] transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {step === "anchored" ? "Capture again" : "● Capture"}
              </button>
              {step === "anchored" && (
                <button
                  onClick={reset}
                  className="px-4 py-3 text-[10px] uppercase tracking-[0.25em] font-mono border border-[hsl(210,10%,15%)] hover:border-[hsl(160,50%,55%)] transition"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </section>
        {/* ── LEDGER PANEL ── */}
        <section className="border border-[hsl(210,10%,10%)] bg-[hsl(220,14%,5%)] rounded-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[hsl(210,10%,10%)]">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[hsl(210,10%,50%)] font-mono">
              02 · On-Chain Ledger
            </span>
            <motion.span
              className="text-[10px] font-mono text-[hsl(160,50%,55%)]"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ● LIVE
            </motion.span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[520px] divide-y divide-[hsl(210,10%,10%)]">
            <AnimatePresence initial={false}>
              {proofs.map((p) => (
                <motion.button
                  key={p.id}
                  layout
                  initial={{ opacity: 0, x: 20, backgroundColor: "hsla(160,50%,55%,0.15)" }}
                  animate={{ opacity: 1, x: 0, backgroundColor: "hsla(160,50%,55%,0)" }}
                  transition={{ duration: 0.5 }}
                  onClick={() => setSelected(p)}
                  className={`w-full text-left px-5 py-4 hover:bg-[hsl(220,14%,7%)] transition ${
                    selected?.id === p.id ? "bg-[hsl(220,14%,7%)] border-l-2 border-[hsl(160,50%,55%)]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-[hsl(160,50%,55%)]">
                      #{p.block.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-mono text-[hsl(210,10%,40%)] uppercase tracking-[0.2em]">
                      trust {p.trust}
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(210,20%,85%)] truncate">{p.label}</p>
                  <p className="text-[10px] font-mono text-[hsl(210,10%,35%)] truncate mt-1">
                    {p.contentHash.slice(0, 32)}…
                  </p>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </section>
        {/* ── PROOF DETAIL ── */}
        <section className="lg:col-span-2 border border-[hsl(210,10%,10%)] bg-[hsl(220,14%,5%)] rounded-sm">
          <div className="px-5 py-3 border-b border-[hsl(210,10%,10%)] flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[hsl(210,10%,50%)] font-mono">
              03 · Proof Detail
            </span>
            {selected && (
              <span className="text-[10px] font-mono text-[hsl(160,50%,55%)] flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                </svg>
                VERIFIED BY HASHMARK
              </span>
            )}
          </div>
          {selected ? (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {[
                ["Label", selected.label],
                ["DID", selected.did],
                ["Device ID", selected.deviceId],
                ["Block", "#" + selected.block.toLocaleString()],
                ["Timestamp", selected.timestamp],
                ["Trust Score", `${selected.trust} / 1000`],
                ["Signer", selected.signer],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[hsl(210,10%,40%)] font-mono mb-1.5">
                    {k}
                  </p>
                  <p className="text-xs font-mono text-[hsl(210,15%,80%)] break-all">{v}</p>
                </div>
              ))}
              <div className="sm:col-span-2">
                <p className="text-[9px] uppercase tracking-[0.3em] text-[hsl(210,10%,40%)] font-mono mb-1.5">
                  Content Hash · Blake2-256
                </p>
                <div className="p-3 border border-[hsl(210,10%,12%)] bg-[hsl(220,14%,3%)] rounded-sm">
                  <HashReveal value={selected.contentHash} />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-xs font-mono text-[hsl(210,10%,30%)] uppercase tracking-[0.25em]">
              Select a proof from the ledger
            </div>
          )}
        </section>
        {/* ── VERIFY ── */}
        <section className="border border-[hsl(210,10%,10%)] bg-[hsl(220,14%,5%)] rounded-sm">
          <div className="px-5 py-3 border-b border-[hsl(210,10%,10%)]">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[hsl(210,10%,50%)] font-mono">
              04 · Verify
            </span>
          </div>
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[hsl(210,10%,40%)] font-mono mb-2">
              Paste content hash prefix
            </p>
            <input
              value={verifyInput}
              onChange={(e) => {
                setVerifyInput(e.target.value);
                setVerifyResult(null);
              }}
              placeholder={proofs[0]?.contentHash.slice(0, 12) + "…"}
              className="w-full px-3 py-2.5 bg-[hsl(220,14%,3%)] border border-[hsl(210,10%,12%)] rounded-sm font-mono text-xs text-[hsl(210,20%,85%)] placeholder:text-[hsl(210,10%,25%)] focus:outline-none focus:border-[hsl(160,50%,55%)]"
            />
            <button
              onClick={runVerify}
              disabled={verifyInput.length < 6}
              className="mt-3 w-full px-4 py-2.5 text-[10px] uppercase tracking-[0.25em] font-mono border border-[hsl(160,50%,55%)] text-[hsl(160,50%,55%)] hover:bg-[hsl(160,50%,55%)] hover:text-[hsl(220,14%,4%)] transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Run Verification
            </button>
            <AnimatePresence>
              {verifyResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-4 p-3 border rounded-sm ${
                    verifyResult.ok
                      ? "border-[hsl(160,50%,55%)/0.4] bg-[hsl(160,50%,55%)/0.05]"
                      : "border-[hsl(0,60%,55%)/0.4] bg-[hsl(0,60%,55%)/0.05]"
                  }`}
                >
                  <p
                    className={`text-[10px] font-mono uppercase tracking-[0.25em] ${
                      verifyResult.ok ? "text-[hsl(160,50%,55%)]" : "text-[hsl(0,60%,55%)]"
                    }`}
                  >
                    {verifyResult.ok ? "✓ Authentic" : "✗ No proof found"}
                  </p>
                  {verifyResult.proof && (
                    <p className="mt-1 text-xs text-[hsl(210,15%,75%)] leading-snug">
                      {verifyResult.proof.label} · block #
                      {verifyResult.proof.block.toLocaleString()}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
      {/* ───── FOOTER ───── */}
      <footer className="px-6 sm:px-10 py-10 border-t border-[hsl(210,10%,10%)] mt-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[hsl(210,10%,30%)] font-mono">
            Hashmark · If it matters, it's on the ledger.
          </p>
          <p className="text-[10px] font-mono text-[hsl(210,10%,30%)]">
            Substrate AppChain · DID · Blake2-256 · Context Court
          </p>
        </div>
      </footer>
    </div>
  );
}
