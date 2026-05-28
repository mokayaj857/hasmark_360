import { Link } from "react-router-dom";
import Footer from "./Footer";


const sections = [
  {
    title: "Abstract",
    content:
      "Era is a Substrate AppChain that anchors digital content to verified devices and decentralized identities (DIDs). It creates cryptographic proofs at capture-time, stores immutable hashes on-chain, and uses a jury-based Context Court to attach human-verified meaning. The result is a ledger of reality that proves what is real without chasing fakes.",
  },
  {
    title: "Problem Statement",
    content:
      "Detection alone cannot win the arms race against generative media. As generative capability grows faster than detection capability, the probability of reliably spotting fakes trends toward zero. Users, journalists, courts, and platforms need a way to prove authenticity instead of guessing at forgery.",
  },
  {
    title: "Design Principles",
    bullets: [
      "Hardware-rooted trust: signatures live in Secure Enclave / Android TEE, never exported.",
      "Identity-first: DIDs with granular rights (Update, Impersonate, Dispute) and device registration.",
      "Immutable proofs: Blake2-256 content IDs plus device ID, block height, signer, and metadata.",
      "Human oracle: juror staking, slashing, and escalation to resolve contextual disputes.",
      "Composable primitives: pallets expose traits so runtimes and other chains can integrate cleanly.",
    ],
  },
  {
    title: "Core Architecture",
    subsections: [
      {
        name: "Identity Registry Pallet",
        bullets: [
          "Creates DIDs and manages signatories with permanent or time-bound rights.",
          "Registers devices per DID; enforces permissions for downstream calls.",
          "Implements DidManager trait for loose coupling with other pallets.",
        ],
      },
      {
        name: "Content Registry Pallet",
        bullets: [
          "Accepts content from accounts holding Impersonate rights for a DID.",
          "Hashes content (Blake2-256) to create ContentId; prevents duplicates.",
          "Records proof: content hash, DID, device ID, block number, metadata, signer.",
          "Stores DID-to-content indexes for efficient lookup.",
        ],
      },
      {
        name: "Context Court Pallet",
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
    title: "Data Flows",
    bullets: [
      "Capture: Device hashes media and signs inside secure silicon. Client uploads media to IPFS (planned) and broadcasts hash + DID + signature + metadata.",
      "Registration: Identity Registry checks rights and device membership. Content Registry prevents duplicates and records immutable proof.",
      "Context Disputes: Accounts with Dispute rights open a case for a ContentId. Context Court summons jurors, records votes, escalates ties, and processes rewards/slashes.",
      "Verification: Verifiers recompute hashes, read on-chain proofs, and reference court outcomes to display trust badges.",
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
      "Cross-chain verification via XCM.",
      "Juror reputation system to weight voting and rewards.",
      "Firmware-level integrations with device manufacturers.",
    ],
  },
  {
    title: "Use Cases",
    bullets: [
      "Verified journalism and OSINT: authenticity guarantees for field media.",
      "Legal and insurance: evidentiary trails bound to DIDs and devices.",
      "Creator and marketplace trust: authenticity badges (\"Verified by Era\").",
      "Scientific data integrity: hash-and-prove datasets at collection time.",
      "Cross-chain truth: other parachains and L1s read Era proofs without new trust assumptions.",
    ],
  },
  {
    title: "Conclusion",
    content:
      "Era is open to contributors, integrators, and early capture partners. Fork the pallets, wire the DidManager trait into your runtime, or build verification badges on top of the on-chain events. If it matters, it is on Era.",
  },
];

export default function WhitepaperPage() {
  return (
    <>
      {/* Hero */}
      <section className="section" style={{ textAlign: "center" }}>
        <div className="section-inner">
          <div className="hero-badge">Era Whitepaper</div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "16px auto", maxWidth: 760 }}>
            Proof-of-Reality for a Post-Deepfake Internet
          </h1>
          <p className="hero-sub" style={{ maxWidth: 640, margin: "0 auto 32px" }}>
            This document describes the Era protocol: how we bind content to devices, enforce
            identity rights, and use a human oracle to resolve context disputes.
          </p>
          <div className="hero-buttons">
            <a href="/api/whitepaper" download="hashmark-protocol-whitepaper.pdf" className="btn btn-primary">
              Download Whitepaper
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            </a>
            <Link to="/" className="btn btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section">
        <div className="section-inner">
          {sections.map((section) => (
            <div className="wp-section" key={section.title}>
              <h2>{section.title}</h2>
              {section.content && <p>{section.content}</p>}
              {section.bullets && (
                <ul>
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.subsections &&
                section.subsections.map((sub) => (
                  <div key={sub.name} style={{ marginTop: 32 }}>
                    <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 600, marginBottom: 12, color: "var(--accent)" }}>
                      {sub.name}
                    </h3>
                    <ul>
                      {sub.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}

