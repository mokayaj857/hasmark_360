export default function Footer() {
  return (
    <>
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
    </>
  );
}
