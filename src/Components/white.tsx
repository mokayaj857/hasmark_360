import { Link } from "react-router-dom";
import Footer from "./Footer";
import { useTheme } from "../context/ThemeContext";

const sections = [
  {
    title: "Abstract",
    content:
      "Hashmark is an authenticity protocol built on the Polkadot blockchain.It binds digital content to verified devices and decentralized identities at the moment of creation  generating cryptographic proof before manipulation can occur. Content hashes are anchored immutably on Polkadot, creating permanent, verifiable provenance.When meaning is contested, a decentralized Context Court delivers economically secured human judgment.Hashmark doesn’t chase deepfakes.It proves reality.",
  },
  {
    title: "Problem Statement",
    content:
      "Detection alone cannot win the arms race against generative media. As AI-generated content becomes indistinguishable from reality, forensic detection approaches collapse under exponential improvement in generation tools. Journalists, courts, marketplaces, governments, and platforms do not need better guesswork. They need verifiable proof.Hashmark replaces reactive detection with proactive authenticity   anchored immutably on Polkadot.",
  },
  {
    title: "Design Principles",
    bullets: [
      "Hardware-rooted trust: signatures live in Secure Enclave / Android TEE, never exported.",
      "Identity-first: DIDs with granular rights (Update, Impersonate, Dispute) and device registration.",
      "Polkadot as the Settlement Layer: Only the content’s hash and metadata go on-chain; the file stays off-chain. Polkadot guarantees immutability, timestamps, and global trust",
      "Human oracle: juror staking, slashing, and escalation to resolve contextual disputes.",
      "Smart Contract Enforcement: Polkadot smart contracts automatically check content hashes, block duplicates, and record proofs immutably on-chain",
    ],
  },
  {
    title: "Core Architecture",
    subsections: [
      {
        name: "Identity Registry",
        bullets: [
          "Creates and manages DIDs.",
          "Registers devices per DID.",
          "Enforces granular rights..",
        ],
      },
      {
        name: "Content Registry",
        bullets: [
          "Accepts submissions from authorized identities.",
          "Prevents duplicate hashes.",
          "Records immutable proof on Polkadot.",
          "Indexes DID-to-content for efficient lookup.",
        ],
      },
      {
        name: "Context Court",
        bullets: [
          "Dispute system for content meaning; requires Dispute right to open cases.",
          "Randomly summons jurors from a staked pool; tracks votes (Yay/Nay/Abstain).",
          "Escalates tied sessions to the full juror set; batches rewards and slashes on finalize.",
          "Emphasizes economic security (deposits, slashing) and randomness (upgradable to VRF).",
        ],
      },
    ],
  },
  {
    title: "How Hashmark Works",
    bullets: [
      "A device captures media",
      "The content is hashed",
      "The hash is signed inside secure hardware (Secure Enclave / Android TEE).",
      "The media is stored off-chain",
      "The hash + identity + metadata are recorded on Polkadot.",
      "At that moment, authenticity becomes permanent.",
     
    ],
  },
  {
    title: "Security Model",
    bullets: [
      "Immutability: proofs are append-only; updates require new content IDs.",
      "Bounded storage: bounded vectors and double-maps limit state growth and weight.",
      "Economic incentives: deposits for DID creation and juror staking; slashing for non-participation or misbehavior.",
      "Randomness: on-chain randomness for juror selection; future VRF upgrade path.",
      "Permission checks: Update, Impersonate, and Dispute rights enforced for all critical actions.",
    ],
  },
  {
    title: "Roadmap",
    bullets: [
      "Mobile capture app with Secure Enclave / TEE integration.",
      "IPFS integration for content pinning.",
      "Public API and SDK for verification and content lookup.",
      "Smart contract modules native to Polkadot",
      "Juror reputation system to weight voting and rewards.",
      
    ],
  },
  {
    title: "Use Cases",
    bullets: [
      "Verified journalism and OSINT: authenticity guarantees for field media.",
      "Legal and insurance: evidentiary trails bound to DIDs and devices.",
      'Creator and marketplace trust: authenticity badges ("Verified by Hashmark").',
      "Scientific data integrity: hash-and-prove datasets at collection time.",
      "Cross-chain truth: other parachains and L1s read Hashmark proofs without new trust assumptions.",
    ],
  },
  {
    title: "Conclusion",
    content:
      "Hashmark is not a detection tool.It is a foundational authenticity protocol. Built on Polkadot, Hashmark turns the blockchain into a permanent ledger of reality where digital content can be proven, not debated. In a world where synthetic media erodes trust, Hashmark restores it. If reality matters, it should be provable.Hashmark makes it provable.",
  },
];

export default function WhitepaperPage() {
  const { dark, toggleDark } = useTheme();

  /* ── Design tokens matching Home.tsx ── */
  const T = {
    bg:        dark ? "#050505"                   : "#f5f3ef",
    headerBg:  dark ? "#0d0d0d"                   : "#ffffff",
    border:    dark ? "rgba(255,255,255,0.10)"    : "rgba(0,0,0,0.12)",
    surface:   dark ? "rgba(255,255,255,0.04)"   : "rgba(0,0,0,0.04)",
    text:      dark ? "rgba(255,255,255,0.88)"   : "#0a0a0a",
    muted:     dark ? "rgba(255,255,255,0.55)"   : "rgba(0,0,0,0.55)",
    accent:    "#D4A843",
    accentRgb: "212,168,67",
  };

  const navLinks = [ "Solutions", "About"];

  return (
    <>
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Mono', 'Segoe UI', system-ui, sans-serif", transition: "background 0.35s ease, color 0.35s ease" }}>

      {/* ── Navigation ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: T.headerBg, borderBottom: `1px solid ${T.border}`, backdropFilter: "blur(16px)", transition: "background 0.35s ease, border-color 0.35s ease" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Brand */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", width: 34, height: 34, borderRadius: "50%", background: "rgba(212,168,67,0.2)", filter: "blur(6px)" }} />
              <svg width="28" height="28" viewBox="0 0 20 20" fill="none" style={{ position: "relative" }}>
                <line x1="6" y1="2" x2="4" y2="18" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
                <line x1="13" y1="2" x2="11" y2="18" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
                <line x1="2" y1="7" x2="18" y2="7" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
                <line x1="1.5" y1="13" x2="17.5" y2="13" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 17, letterSpacing: "0.28em", textTransform: "uppercase", color: T.text, fontWeight: 700, lineHeight: 1, transition: "color 0.35s" }}>HASHMARK</span>
              <span style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#D4A843", fontWeight: 500, lineHeight: 1 }}>PROTOCOL</span>
            </div>
          </Link>

          {/* Right side: nav links + theme toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {navLinks.map((item) => (
              <Link key={item} to={item === "About" ? "/about" : item === "Solutions" ? "/solution" : `/#${item.toLowerCase()}`}
                style={{ color: T.muted, textDecoration: "none", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 8, transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
              >{item}</Link>
            ))}

            <Link to="/whitepaper" style={{ color: "#D4A843", textDecoration: "none", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(212,168,67,0.5)", marginLeft: 4 }}>
              Whitepaper
            </Link>

            {/* Theme toggle — identical style to Home.tsx */}
            <button
              onClick={toggleDark}
              aria-label="Toggle theme"
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 99, cursor: "pointer", border: dark ? "1.5px solid rgba(212,168,67,0.6)" : "1.5px solid rgba(0,0,0,0.2)", background: dark ? "rgba(212,168,67,0.12)" : "rgba(0,0,0,0.06)", transition: "background 0.3s, border-color 0.3s, transform 0.2s", marginLeft: 8 }}
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
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ textAlign: "center", padding: "96px 24px 72px", background: dark ? `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${T.accentRgb},0.07) 0%, transparent 70%)` : `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${T.accentRgb},0.10) 0%, transparent 70%)` }}>
        <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#D4A843", background: `rgba(${T.accentRgb},0.1)`, border: `1px solid rgba(${T.accentRgb},0.3)`, borderRadius: 100, padding: "5px 18px", marginBottom: 24 }}>
          Hashmark Whitepaper
        </div>
        <h1 style={{ fontFamily: "'Orbitron', system-ui, sans-serif", fontSize: "clamp(30px, 5.5vw, 52px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 auto 20px", maxWidth: 760, color: T.text, lineHeight: 1.15 }}>
          Proof-of-Reality for a<br />Post-Deepfake Internet
        </h1>
        <p style={{ color: T.muted, fontSize: 17, lineHeight: 1.7, maxWidth: 620, margin: "0 auto 36px" }}>
          How we bind content to devices, enforce identity rights, and use a human oracle to resolve context disputes.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/api/whitepaper" download="hashmark-protocol-whitepaper.pdf"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 26px", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", background: "linear-gradient(135deg, #D4A843 0%, #f0cc6e 50%, #D4A843 100%)", backgroundSize: "200% auto", color: "#050505", boxShadow: "0 2px 20px rgba(212,168,67,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            Download PDF
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 15, height: 15 }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </a>
          <Link to="/"
            style={{ display: "inline-flex", alignItems: "center", padding: "12px 26px", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none", color: T.muted, border: `1px solid ${T.border}`, letterSpacing: "0.08em", textTransform: "uppercase", transition: "border-color 0.2s, color 0.2s" }}
          >
            ← Back to Home
          </Link>
        </div>
      </section>

      {/* ── Content ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 96px" }}>
        {sections.map((section) => (
          <section key={section.title} style={{ marginBottom: 20, padding: "32px 36px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, transition: "background 0.35s ease, border-color 0.35s ease" }}>
            <h2 style={{ fontFamily: "'Orbitron', system-ui, sans-serif", fontSize: 16, fontWeight: 700, color: "#D4A843", margin: "0 0 16px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {section.title}
            </h2>
            {"content" in section && section.content && (
              <p style={{ color: T.muted, lineHeight: 1.9, margin: 0, fontSize: 15 }}>{section.content}</p>
            )}
            {"bullets" in section && section.bullets && (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {section.bullets.map((item) => (
                  <li key={item} style={{ color: T.muted, lineHeight: 1.9, marginBottom: 6, fontSize: 14 }}>{item}</li>
                ))}
              </ul>
            )}
            {"subsections" in section && section.subsections &&
              section.subsections.map((sub) => (
                <div key={sub.name} style={{ marginTop: 28 }}>
                  <h3 style={{ fontFamily: "'Orbitron', system-ui, sans-serif", fontSize: 12, fontWeight: 700, color: T.text, margin: "0 0 10px", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.75 }}>
                    {sub.name}
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {sub.bullets.map((item) => (
                      <li key={item} style={{ color: T.muted, lineHeight: 1.9, marginBottom: 6, fontSize: 14 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </section>
        ))}
      </div>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${T.border}`, background: T.headerBg, transition: "background 0.35s ease, border-color 0.35s ease" }}>
        <Footer />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ color: T.muted, fontSize: 11, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            If something matters, it deserves proof. — © {new Date().getFullYear()} Hashmark Protocol
          </p>
          <div style={{ display: "flex", gap: 14 }}>
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" style={{ color: T.muted, transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#D4A843")}
              onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" style={{ color: T.muted, transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#D4A843")}
              onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
