import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Footer from "./Footer";
import { getStats, type StatsResult } from "../api";

const technology = [
  {
    icon: "🆔",
    title: "Identity Registry",
    description:
      "Manage decentralized identifiers (DIDs) with granular rights: Update, Impersonate, and Dispute. Register devices for hardware-rooted trust.",
    features: ["DIDs", "Rights System", "Device Binding", "Temporal Permissions"],
  },
  {
    icon: "📄",
    title: "Content Registry",
    description:
      "Store immutable cryptographic proofs of content authenticity. Blake2-256 hashes bind media to DIDs and verified devices.",
    features: ["Blake2-256", "Proof Storage", "DID Binding", "Tamper Detection"],
  },
  {
    icon: "⚖️",
    title: "Context Court",
    description:
      "Decentralized jury system for dispute resolution. Staking, voting, and escalation ensure honest human verification of content context.",
    features: ["Jury Selection", "Staking", "Escalation", "Batch Rewards"],
  },
];

const solutions = [
  {
    icon: "📰",
    title: "Verified Journalism",
    description:
      "News organizations can require proof-backed media to defend against impersonation, claim spoofing, and AI-generated misinformation.",
  },
  {
    icon: "⚖️",
    title: "Legal & Insurance",
    description:
      "Create immutable evidence trails with DID-bound devices and timestamps. Prove authenticity in courts and claims processing.",
  },
  {
    icon: "🎨",
    title: "Creator Authenticity",
    description:
      "Marketplaces and platforms can badge listings with \"Verified by Era\" signatures to prevent counterfeit digital goods.",
  },
  {
    icon: "🔬",
    title: "Scientific Integrity",
    description:
      "Hash-and-prove research datasets at collection time. Ensure reproducibility and prevent data manipulation in studies.",
  },
];

const roadmap = [
  {
    status: "design",
    title: "Mobile Capture App",
    description: "Secure Enclave / TEE integration for hardware-rooted signing at capture.",
  },
  {
    status: "planned",
    title: "IPFS Integration",
    description: "Pin verified media off-chain while anchoring integrity proofs on-chain.",
  },
  {
    status: "planned",
    title: "API & SDK",
    description: "Expose verification, content lookup, and DID permissioning to third-party apps.",
  },
  {
    status: "research",
    title: "Cross-chain via XCM",
    description: "Let parachains and external chains attest to Era proofs trustlessly.",
  },
  {
    status: "research",
    title: "Juror Reputation",
    description: "Score juror performance to harden the Context Court against collusion.",
  },
  {
    status: "research",
    title: "Firmware Integration",
    description: "Embed signing at the OS or firmware level for born-authentic media.",
  },
];

const explore = [
  { title: "Whitepaper", description: "Deep dive into protocol design", href: "/whitepaper" },
  { title: "GitHub", description: "Explore the open-source code", href: "https://github.com" },
  { title: "Substrate Docs", description: "Learn the underlying framework", href: "https://docs.substrate.io" },
  { title: "Polkadot SDK", description: "Build parachains with Polkadot", href: "https://paritytech.github.io/polkadot-sdk" },
];

export default function Home() {
  const [stats, setStats] = useState<StatsResult | null>(null);

  // Poll live chain stats every 15 seconds
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getStats();
        if (!cancelled) setStats(data);
      } catch { /* backend offline — keep null */ }
    };
    load();
    const id = setInterval(load, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">The Ledger of Reality</div>
        <h1>
          Prove what is <span className="gradient">real</span> at the moment of creation
        </h1>
        <p className="hero-sub">
          Era is a Substrate-based AppChain that binds digital content to verified devices and
          decentralized identities. Hardware-secured signatures, immutable proofs, and human
          context resolution form a permanent ledger of authenticity.
        </p>
        <div className="hero-buttons">
          <Link to="/whitepaper" className="btn btn-primary">
            Read the Whitepaper
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link to="#technology" className="btn btn-secondary">
            Explore Technology
          </Link>
        </div>
      </section>

      {/* Trusted By — infinite horizontal marquee */}
      <section className="trusted">
        <p className="trusted-label">Built with battle-tested technology</p>
        <div className="trusted-marquee-outer">
          <div className="trusted-marquee-inner">
            {[0, 1].map((copy) => (
              <div className="trusted-track" key={copy} aria-hidden={copy === 1}>

                {/* Substrate */}
                <div className="trusted-logo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="5"  cy="5"  r="2.5" fill="currentColor"/>
                    <circle cx="12" cy="5"  r="2.5" fill="currentColor"/>
                    <circle cx="19" cy="5"  r="2.5" fill="currentColor"/>
                    <circle cx="5"  cy="12" r="2.5" fill="currentColor"/>
                    <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
                    <circle cx="19" cy="12" r="2.5" fill="currentColor"/>
                    <circle cx="5"  cy="19" r="2.5" fill="currentColor"/>
                    <circle cx="12" cy="19" r="2.5" fill="currentColor"/>
                    <circle cx="19" cy="19" r="2.5" fill="currentColor"/>
                  </svg>
                  <span>Substrate</span>
                </div>

                {/* Polkadot — official 8-outer + 4-inner + centre star */}
                <div className="trusted-logo">
                  <svg width="20" height="20" viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="3.2"/>
                    <circle cx="20" cy="6"  r="2.2"/>
                    <circle cx="20" cy="34" r="2.2"/>
                    <circle cx="6"  cy="20" r="2.2"/>
                    <circle cx="34" cy="20" r="2.2"/>
                    <circle cx="9"  cy="9"  r="1.7"/>
                    <circle cx="31" cy="9"  r="1.7"/>
                    <circle cx="9"  cy="31" r="1.7"/>
                    <circle cx="31" cy="31" r="1.7"/>
                    <circle cx="20" cy="12" r="1.4"/>
                    <circle cx="20" cy="28" r="1.4"/>
                    <circle cx="12" cy="20" r="1.4"/>
                    <circle cx="28" cy="20" r="1.4"/>
                  </svg>
                  <span>Polkadot</span>
                </div>

                {/* Rust — gear cog */}
                <div className="trusted-logo">
                  <svg width="20" height="20" viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4l2 4h4l-2 3.5 2.5 3.5H23l-1 4-2-2-2 2-1-4h-3.5L16 11.5 14 8h4l2-4z" opacity="0.9"/>
                    <circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" strokeWidth="2.5"/>
                    <circle cx="20" cy="20" r="4"/>
                    <rect x="19" y="2"  width="2" height="5" rx="1"/>
                    <rect x="19" y="33" width="2" height="5" rx="1"/>
                    <rect x="2"  y="19" width="5" height="2" rx="1"/>
                    <rect x="33" y="19" width="5" height="2" rx="1"/>
                    <rect x="7.5"  y="6"   width="2" height="4" rx="1" transform="rotate(-45 8.5 8)"/>
                    <rect x="28.5" y="6"   width="2" height="4" rx="1" transform="rotate(45 29.5 8)"/>
                    <rect x="7.5"  y="29"  width="2" height="4" rx="1" transform="rotate(45 8.5 31)"/>
                    <rect x="28.5" y="29"  width="2" height="4" rx="1" transform="rotate(-45 29.5 31)"/>
                  </svg>
                  <span>Rust</span>
                </div>

                {/* Ada ₳ — styled coin */}
                <div className="trusted-logo">
                  <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5"/>
                    <path d="M14 28l6-16 6 16M16.5 23h7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <span>Ada</span>
                </div>

                {/* Lovelace — elegant "lovelace token" mark */}
                <div className="trusted-logo">
                  <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5"/>
                    <path d="M14 10v16h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Lovelace</span>
                </div>

                {/* JavaScript */}
                <div className="trusted-logo">
                  <svg width="20" height="20" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="40" rx="5" fill="#F0DB4F"/>
                    <path d="M10 28c0 2.5 1.5 4 3.8 4 2.4 0 3.7-1.3 3.7-3.3V16h-3v12.4c0 .8-.4 1.3-1.1 1.3-.7 0-1.1-.5-1.4-1.1L10 28zm10.5-.4c.5 2.7 2.5 4.4 5.5 4.4 3.1 0 5.2-1.6 5.2-4.2 0-2.2-1.2-3.4-3.9-4.3l-1.2-.4c-1.4-.5-2-1-2-1.9 0-.9.7-1.6 1.8-1.6 1 0 1.8.5 2.1 1.6l2.7-1c-.6-2.3-2.3-3.4-4.8-3.4-2.9 0-4.9 1.7-4.9 4.1 0 2.1 1.2 3.3 3.6 4.1l1.2.4c1.5.5 2.2 1.1 2.2 2.1 0 1-.9 1.7-2.2 1.7-1.4 0-2.3-.8-2.7-2.1l-2.6 1z" fill="#323330"/>
                  </svg>
                  <span>JavaScript</span>
                </div>

                {/* Blake2 — hash bars */}
                <div className="trusted-logo">
                  <svg width="20" height="20" viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2"  y="8"  width="7" height="24" rx="2"/>
                    <rect x="13" y="14" width="7" height="18" rx="2"/>
                    <rect x="24" y="20" width="7" height="12" rx="2"/>
                    <rect x="24" y="8"  width="7" height="6"  rx="2"/>
                    <rect x="35" y="4"  width="3" height="32" rx="1.5" opacity="0.4"/>
                  </svg>
                  <span>Blake2</span>
                </div>

                {/* FRAME */}
                <div className="trusted-logo">
                  <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2"  y="2"  width="36" height="36" rx="5" stroke="currentColor" strokeWidth="2.5"/>
                    <rect x="9"  y="9"  width="22" height="22" rx="3" stroke="currentColor" strokeWidth="2"/>
                    <rect x="15" y="15" width="10" height="10" rx="2" fill="currentColor"/>
                  </svg>
                  <span>FRAME</span>
                </div>

                <span className="trusted-sep" aria-hidden="true">·</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="section">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-label">Technology</p>
            <h2 className="section-title">The Era Protocol Stack</h2>
            <p className="section-desc">
              Three modular pallets work together to provide end-to-end content verification—from
              identity management to dispute resolution.
            </p>
          </div>
          <div className="tech-grid">
            {technology.map((item) => (
              <div className="tech-card" key={item.title}>
                <div className="tech-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="tech-features">
                  {item.features.map((f) => (
                    <span className="tech-feature" key={f}>{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="section arch">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-label">How It Works</p>
            <h2 className="section-title">Architecture at a Glance</h2>
            <p className="section-desc">
              From capture to verification, Era creates an unbroken chain of trust anchored in hardware security.
            </p>
          </div>
          <div className="arch-flow">
            <div className="arch-step">
              <div className="arch-step-num">1</div>
              <h4>Capture</h4>
              <p>Media hashed and signed inside Secure Enclave or Android TEE</p>
            </div>
            <span className="arch-arrow">→</span>
            <div className="arch-step">
              <div className="arch-step-num">2</div>
              <h4>Register</h4>
              <p>Proof broadcast to Era chain with DID and device signature</p>
            </div>
            <span className="arch-arrow">→</span>
            <div className="arch-step">
              <div className="arch-step-num">3</div>
              <h4>Verify</h4>
              <p>Anyone can check proof integrity and identity on-chain</p>
            </div>
            <span className="arch-arrow">→</span>
            <div className="arch-step">
              <div className="arch-step-num">4</div>
              <h4>Dispute</h4>
              <p>Context Court resolves contextual disputes via jury voting</p>
            </div>
          </div>
          <div className="arch-cards">
            <div className="arch-card">
              <h4><span>📱</span> Capture Layer</h4>
              <ul>
                <li>Media hashed on-device immediately after creation</li>
                <li>Hardware security module signs with device-bound key</li>
                <li>Media stored off-chain (IPFS planned), hash on-chain</li>
                <li>DID permissions enforced via Identity Registry rights</li>
              </ul>
            </div>
            <div className="arch-card">
              <h4><span>⛓️</span> On-chain Layer</h4>
              <ul>
                <li>Content Registry stores immutable proofs: hash, DID, device, block</li>
                <li>Context Court summons jurors and manages dispute lifecycle</li>
                <li>Economic incentives: staking, rewards, and slashing</li>
                <li>Events enable downstream indexing and verification APIs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="section">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-label">Solutions</p>
            <h2 className="section-title">What You Can Build</h2>
            <p className="section-desc">
              Era provides the infrastructure for a more truthful digital age. Here are some
              applications enabled by proof-of-reality.
            </p>
          </div>
          <div className="solutions-grid">
            {solutions.map((item) => (
              <div className="solution-card" key={item.title}>
                <div className="solution-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="section roadmap-section">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-label">Roadmap</p>
            <h2 className="section-title">What&apos;s Next for Era</h2>
            <p className="section-desc">
              Building the ledger was step one. The future is about making it the universal
              standard for digital truth.
            </p>
          </div>
          <div className="roadmap-timeline">
            {roadmap.map((item) => (
              <div className="roadmap-item" key={item.title}>
                <span className={`roadmap-status ${item.status}`}>{item.status}</span>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="section">
        <div className="section-inner">
          <div className="about-content">
            <div className="about-text">
              <h2>We&apos;re building the ledger of reality</h2>
              <p>
                In an age of AI-generated content and deepfakes, detection is a losing game. Era
                flips the problem: instead of proving what&apos;s fake, we prove what&apos;s real.
              </p>
              <p>
                Our protocol creates cryptographic proofs at the moment of content creation,
                binds them to physical devices through hardware security, and stores immutable
                records on-chain. For contextual disputes, a decentralized human oracle—the
                Context Court—delivers final verdicts.
              </p>
              <p>
                Era is more than a blockchain. It&apos;s infrastructure for a more truthful digital
                age—a permanent, decentralized anchor for reality.
              </p>
            </div>
            <div className="about-stats">
              <div className="stat">
                <div className="stat-value">3</div>
                <div className="stat-label">Core Pallets</div>
              </div>
              <div className="stat">
                <div className="stat-value">100%</div>
                <div className="stat-label">Open Source</div>
              </div>
              <div className="stat">
                <div className="stat-value" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {stats ? stats.totalProofs.toLocaleString() : "—"}
                </div>
                <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {stats && !stats.offline && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80", display: "inline-block", flexShrink: 0 }} />
                  )}
                  Immutable Proofs
                </div>
              </div>
              <div className="stat">
                <div className="stat-value" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {stats && stats.blockNumber > 0 ? `#${stats.blockNumber.toLocaleString()}` : "—"}
                </div>
                <div className="stat-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {stats && !stats.offline && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80", display: "inline-block", flexShrink: 0 }} />
                  )}
                  Current Block
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent On-Chain Proofs */}
      <section id="live" className="section">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {stats && !stats.offline ? (
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80", display: "inline-block" }} />
              ) : (
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "inline-block" }} />
              )}
              Live Chain
            </p>
            <h2 className="section-title">Recent Authentications</h2>
            <p className="section-desc">
              The latest video proofs registered on-chain, pulled directly from the Hashmark smart contract.
            </p>
          </div>

          {!stats ? (
            <div style={{ textAlign: "center", padding: "32px 0", opacity: 0.4 }}>Connecting to chain…</div>
          ) : stats.offline ? (
            <div style={{ textAlign: "center", padding: "32px 0", opacity: 0.4 }}>Node offline — start your local node or configure RPC_URL in the backend.</div>
          ) : stats.recentProofs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", opacity: 0.4 }}>
              No proofs on-chain yet.{" "}
              <Link to="/verify" style={{ color: "var(--accent)" }}>Authenticate the first video →</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stats.recentProofs.map((proof) => (
                <div key={proof.txHash} className="tech-card" style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <code style={{ fontSize: 13, wordBreak: "break-all", flex: 1, color: "var(--accent)" }}>{proof.videoHash}</code>
                    <Link
                      to={`/verify?hash=${encodeURIComponent(proof.videoHash)}`}
                      style={{ fontSize: 12, color: "var(--accent)", opacity: 0.8, whiteSpace: "nowrap", textDecoration: "none" }}
                    >
                      Verify →
                    </Link>
                  </div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 12, opacity: 0.6 }}>
                    <span>Block {proof.blockNumber.toLocaleString()}</span>
                    <span>{new Date(proof.timestamp * 1000).toLocaleString()}</span>
                    <span>{proof.creator.slice(0, 6)}…{proof.creator.slice(-4)}</span>
                  </div>
                </div>
              ))}
              <div style={{ textAlign: "center", paddingTop: 8 }}>
                <Link to="/verify" className="btn btn-secondary" style={{ fontSize: 13 }}>
                  Authenticate a new video →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Explore */}
      <section id="explore" className="section">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-label">Explore</p>
            <h2 className="section-title">Dive Deeper</h2>
            <p className="section-desc">
              Learn more about Era&apos;s protocol, explore the codebase, and discover how to integrate.
            </p>
          </div>
          <div className="explore-grid">
            {explore.map((item) => (
              <Link to={item.href} className="explore-card" key={item.title} target={item.href.startsWith("http") ? "_blank" : undefined}>
                <h4>{item.title} →</h4>
                <p>{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta">
        <div className="section-inner">
          <div className="cta-box">
            <h2>Ready to build on proof-of-reality?</h2>
            <p>
              Era is open to contributors, integration partners, and early adopters capturing proofs.
              Start with the whitepaper and reach out to embed authenticity in your product.
            </p>
            <div className="cta-buttons">
              <Link to="/whitepaper" className="btn btn-primary">
                Read the Whitepaper
              </Link>
              <a href="/api/whitepaper" download="hashmark-protocol-whitepaper.pdf" className="btn btn-secondary">
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
