'use client';

import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Fingerprint, Network, Scale, Cpu, Hash, LockKeyhole, GlobeLock,
  ShieldAlert, Newspaper, BookOpenCheck, Microscope,
  Zap, ArrowRight, CheckCircle2, Loader2
} from 'lucide-react';
import Footer from './Footer';
import HashmarkLogo from './HashmarkLogo';
import { useTheme } from '../context/ThemeContext';

const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Rajdhani:wght@500;600;700&display=swap');
  @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
  @keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 20px hsl(var(--primary) / 0.3); } 50% { box-shadow: 0 0 40px hsl(var(--primary) / 0.6); } }
  @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
  @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(212, 168, 67, 0.4); } 70% { box-shadow: 0 0 0 20px rgba(212, 168, 67, 0); } 100% { box-shadow: 0 0 0 0 rgba(212, 168, 67, 0); } }
  @keyframes rotate-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes blur-in { from { opacity: 0; filter: blur(10px); } to { opacity: 1; filter: blur(0px); } }
  @keyframes gradient-shift { 0%, 100% { background-position: 0% center; } 50% { background-position: 100% center; } }
  @keyframes aurora { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: var(--font-body); background-color: hsl(var(--background)); color: hsl(var(--foreground)); overflow-x: hidden; background-image: radial-gradient(circle at 15% 50%, rgba(212, 168, 67, 0.03), transparent 25%), radial-gradient(circle at 85% 30%, rgba(212, 168, 67, 0.04), transparent 25%); background-attachment: fixed; transition: background-color 0.3s, color 0.3s; }
  h1, h2, h3, h4, h5, h6 { font-family: var(--font-display); letter-spacing: 0.05em; }
  .glass-panel { background: hsl(var(--card) / 0.3); backdrop-filter: blur(40px); border: 1px solid hsl(var(--foreground) / 0.05); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
  .neon-text { text-shadow: 0 0 15px hsl(var(--primary) / 0.5), 0 0 30px hsl(var(--primary) / 0.3); animation: glow-pulse 3s ease-in-out infinite; }
  .text-gradient { background: linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent))); background-size: 200% center; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: gradient-shift 8s ease infinite; }
  .pulse-ring-animation { animation: pulse-ring 2s infinite; }
  .rotate-animation { animation: rotate-slow 20s linear infinite; }
  .shimmer-animation { background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent); background-size: 200% 100%; animation: shimmer 3s infinite; }
  .aurora-animation { animation: aurora 4s ease-in-out infinite; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: hsl(var(--background)); }
  ::-webkit-scrollbar-thumb { background: hsl(var(--primary) / 0.4); border-radius: 4px; }
`;

function getThemeVars(dark: boolean) {
  return `
    :root {
      --font-display: 'Rajdhani', sans-serif;
      --font-body: 'DM Sans', sans-serif;
      --primary: 42 61% 55%;
      --accent: 38 70% 42%;
      ${dark ? `
      --background: 240 10% 2%;
      --foreground: 0 0% 98%;
      --muted: 240 10% 12%;
      --muted-foreground: 240 5% 65%;
      --card: 240 10% 6%;
      ` : `
      --background: 0 0% 97%;
      --foreground: 240 10% 5%;
      --muted: 240 5% 88%;
      --muted-foreground: 240 5% 25%;
      --card: 0 0% 100%;
      `}
    }
  `;
}


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const revealVariants = {
  hidden: { opacity: 0, y: 50, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, type: 'spring' as const, damping: 25 } },
};

function GlowBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -10, backgroundColor: `hsl(var(--background))` }}>
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'hsl(var(--primary) / 0.2)', filter: 'blur(150px)' }} />
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }} style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'hsl(var(--accent) / 0.2)', filter: 'blur(150px)' }} />
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, align = 'left' }: { eyebrow: string; title: string; description?: string; align?: string }) {
  const isCenter = align === 'center';
  return (
    <div style={{ marginBottom: '4rem', maxWidth: '48rem', ...(isCenter && { margin: '0 auto 4rem', textAlign: 'center' }) }}>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.5 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.2em', color: `hsl(var(--primary))`, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
          <span style={{ width: '2rem', height: '1px', backgroundColor: `hsl(var(--primary))` }}></span>
          {eyebrow}
          {isCenter && <span style={{ width: '2rem', height: '1px', backgroundColor: `hsl(var(--primary))` }}></span>}
        </div>
        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 'bold', fontFamily: 'var(--font-display)', marginBottom: '1.5rem', color: `hsl(var(--foreground))` }}>{title}</h2>
        {description && <p style={{ fontSize: '1.125rem', color: `hsl(var(--muted-foreground))`, fontFamily: 'var(--font-body)', lineHeight: 1.75 }}>{description}</p>}
      </motion.div>
    </div>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsPending(true);
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setIsSuccess(true);
        setEmail('');
      } else {
        alert('Failed to join waitlist. Please try again.');
      }
    } catch {
      alert('Error: Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }} className="glass-panel" style={{ borderRadius: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', maxWidth: '28rem', width: '100%', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
        <motion.div style={{ position: 'absolute', inset: 0, borderRadius: '1rem', backgroundImage: `linear-gradient(to right, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.2))` }} initial={{ opacity: 0 }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} />
        <motion.div style={{ height: '3.5rem', width: '3.5rem', borderRadius: '9999px', backgroundColor: `hsl(var(--primary) / 0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', position: 'relative', zIndex: 10 }} className="pulse-ring-animation" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2 }}><CheckCircle2 style={{ width: '2rem', height: '2rem', color: `hsl(var(--primary))` }} /></motion.div>
        </motion.div>
        <motion.h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: `hsl(var(--foreground))`, position: 'relative', zIndex: 10 }} animate={{ color: [`hsl(var(--foreground))`, `hsl(var(--primary))`, `hsl(var(--foreground))`] }} transition={{ duration: 3, repeat: Infinity }}>Protocol Bound</motion.h3>
        <p style={{ color: `hsl(var(--muted-foreground))`, textAlign: 'center', fontSize: '0.875rem', position: 'relative', zIndex: 10 }}>Your identity has been anchored to the Hashmark ledger.</p>
      </motion.div>
    );
  }

  return (
    <motion.form onSubmit={handleSubmit} style={{ position: 'relative', maxWidth: '28rem', width: '100%', margin: '0 auto' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <motion.div style={{ position: 'absolute', inset: '-4px', borderRadius: '1rem', backgroundImage: `linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))`, filter: 'blur(8px)', opacity: 0.25, zIndex: 0 }} animate={{ opacity: [0.25, 0.4, 0.25] }} transition={{ duration: 3, repeat: Infinity }} />
      <motion.div className="glass-panel" style={{ position: 'relative', display: 'flex', alignItems: 'center', borderRadius: '1rem', padding: '0.25rem', overflow: 'hidden', zIndex: 1 }} whileHover={{ scale: 1.02 }}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" required disabled={isPending} style={{ width: '100%', backgroundColor: 'transparent', paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem', color: `hsl(var(--foreground))`, fontFamily: 'var(--font-body)', fontSize: '1.125rem', border: 'none', outline: 'none', position: 'relative', zIndex: 10, opacity: isPending ? 0.5 : 1 }} />
        <motion.button type="submit" disabled={isPending || !email} style={{ marginRight: '0.25rem', backgroundColor: 'white', color: `hsl(var(--primary))`, fontFamily: 'var(--font-display)', fontWeight: 'bold', paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: isPending || !email ? 'not-allowed' : 'pointer', opacity: isPending || !email ? 0.5 : 1, position: 'relative', zIndex: 10, flexShrink: 0 }} whileHover={{ scale: isPending || !email ? 1 : 1.05 }} whileTap={{ scale: isPending || !email ? 1 : 0.95 }}>
          {isPending ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}><Loader2 style={{ width: '1.25rem', height: '1.25rem' }} /></motion.div> : <motion.div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} whileHover={{ x: 5 }}><span>JOIN</span><motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity }}><ArrowRight style={{ width: '1rem', height: '1rem' }} /></motion.div></motion.div>}
        </motion.button>
      </motion.div>
    </motion.form>
  );
}

export default function HashmarkLanding() {
  const { dark, toggleDark } = useTheme();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 250]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const headlineText = 'A LEDGER FOR';
  const highlightText = 'REALITY';

  return (
    <>
      <style>{getThemeVars(dark) + baseStyles}</style>
      <main style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
        <GlowBackground />
        
        <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: `1px solid hsl(var(--foreground) / 0.05)`, paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '1rem', paddingBottom: '1rem', backdropFilter: 'blur(40px)' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <motion.div style={{ cursor: 'pointer' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <HashmarkLogo color={dark ? '#ffffff' : '#0a0a0a'} />
            </motion.div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={toggleDark} aria-label="Toggle theme" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 99, cursor: 'pointer', border: dark ? '1.5px solid rgba(212,168,67,0.6)' : '1.5px solid rgba(0,0,0,0.2)', background: dark ? 'rgba(212,168,67,0.12)' : 'rgba(0,0,0,0.06)', transition: 'background 0.3s, border-color 0.3s' }}>
                {dark ? '☀️' : '🌙'}<span style={{ fontSize: 11, fontWeight: 600, color: dark ? '#D4A843' : '#334155' }}>{dark ? 'Light' : 'Dark'}</span>
              </button>
              <motion.button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ fontSize: '0.875rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em', color: `hsl(var(--muted-foreground))`, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} whileHover={{ scale: 1.05, color: `hsl(var(--primary))` }} whileTap={{ scale: 0.95 }}>
                <span>Access Waitlist</span><ArrowRight style={{ width: '1rem', height: '1rem' }} />
              </motion.button>
            </div>
          </div>
        </motion.nav>

        <section style={{ position: 'relative', paddingTop: '10rem', paddingBottom: '5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
          <motion.div style={{ y, opacity, scale }} className="w-full">
            <div style={{ maxWidth: '80rem', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
              <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, type: 'spring', bounce: 0.5 }} style={{ display: 'inline-block', marginBottom: '1.5rem', paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.375rem', paddingBottom: '0.375rem', borderRadius: '9999px', border: `1px solid hsl(var(--primary) / 0.5)`, backgroundColor: `hsl(var(--primary) / 0.1)`, backdropFilter: 'blur(16px)' }} whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(212, 168, 67, 0.4)' }}>
                <motion.span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-display)', letterSpacing: '0.05em', color: `hsl(var(--primary))`, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }} animate={{ opacity: [0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Zap style={{ width: '0.75rem', height: '0.75rem' }} />Protocol v1.0 Launching Soon
                </motion.span>
              </motion.div>
              
              <div style={{ marginBottom: '2rem' }}>
                <motion.div style={{ fontSize: 'clamp(2.25rem, 12vw, 5.5rem)', fontWeight: 'bold', fontFamily: 'var(--font-display)', lineHeight: 0.9 }} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}>
                  {headlineText.split('').map((char, idx) => (
                    <motion.span key={idx} initial={{ opacity: 0, y: 20, rotate: -5 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.5, delay: 0.2 + idx * 0.05, type: 'spring' }} style={{ display: 'inline-block' }}>
                      {char === ' ' ? '\u00A0' : char}
                    </motion.span>
                  ))}
                  <br />
                  <motion.span className="text-gradient neon-text" style={{ backgroundImage: `linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))`, backgroundSize: '200% center', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.6, type: 'spring' }}>
                    {highlightText.split('').map((char, idx) => (
                      <motion.span key={`h-${idx}`} initial={{ opacity: 0, rotate: 10 }} animate={{ opacity: 1, rotate: 0 }} transition={{ duration: 0.6, delay: 0.7 + idx * 0.05 }} style={{ display: 'inline-block' }}>
                        {char}
                      </motion.span>
                    ))}
                  </motion.span>
                </motion.div>
              </div>
              
              <motion.p initial={{ opacity: 0, filter: 'blur(10px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.8, delay: 1.2 }} style={{ fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', color: `hsl(var(--muted-foreground))`, maxWidth: '42rem', margin: '0 auto 3rem', fontFamily: 'var(--font-body)', lineHeight: 1.75 }}>
                Hashmark doesn't chase deepfakes. It proves reality. Bind digital content to verified devices and decentralized identities at the moment of creation.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 1.4, type: 'spring' }}>
                <WaitlistForm />
              </motion.div>
            </div>
          </motion.div>

          <motion.div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', borderRadius: '50%', border: `1px solid hsl(var(--foreground) / 0.05)`, pointerEvents: 'none' }} animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} />
          <motion.div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '1200px', height: '1200px', borderRadius: '50%', border: `1px solid hsl(var(--foreground) / 0.05)`, pointerEvents: 'none' }} animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, delay: 1 }} />
        </section>

        <section style={{ paddingTop: '6rem', paddingBottom: '6rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', borderTop: `1px solid hsl(var(--foreground) / 0.05)`, borderBottom: `1px solid hsl(var(--foreground) / 0.05)`, backgroundColor: `hsl(var(--background) / 0.4)`, backdropFilter: 'blur(8px)', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem', alignItems: 'center' }}>
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                <SectionHeading eyebrow="The Crisis" title="The Epistemic Arms Race is Unwinnable." description="AI generative media is advancing faster than detection algorithms. The only solution is cryptographic proof of origin at the hardware level." />
                <motion.ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  {[{ icon: ShieldAlert, text: 'Detection algorithms have a built-in half-life' }, { icon: Cpu, text: 'Generative AI creates pixel-perfect fabrications' }, { icon: GlobeLock, text: 'Trust in digital media is approaching zero' }].map((item, i) => (
                    <motion.li key={i} variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.125rem', color: `hsl(var(--muted-foreground))`, cursor: 'default' }} whileHover={{ x: 10 }}>
                      <motion.div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: `hsl(239 89% 40% / 0.1)`, border: `1px solid hsl(0 0% 0% / 0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} whileHover={{ scale: 1.2, rotate: 5 }}>
                        <item.icon style={{ width: '1.25rem', height: '1.25rem', color: 'hsl(0 89% 60%)' }} />
                      </motion.div>
                      {item.text}
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
              
              <motion.div style={{ position: 'relative' }} initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                <motion.div className="glass-panel shimmer-animation" style={{ padding: '2rem', borderRadius: '1rem', position: 'relative', overflow: 'hidden' }} whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(0, 240, 255, 0.2)' }}>
                  <pre style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: `hsl(var(--muted-foreground) / 0.5)`, overflow: 'hidden', userSelect: 'none' }}>
{`// TRADITIONAL DETECTION (FAILING)
function analyzeMedia(file) {
  const aiSignature = detectAI(file);
  return 'UNKNOWN';
}

// HASHMARK PROTOCOL (DETERMINISTIC)
function verifyReality(contentHash) {
  const anchor = getBaseAnchor(contentHash);
  const device = Registry.get(anchor.pubKey);
  return device.isTEE ? 'PROVEN' : 'REJECTED';
}`}
                  </pre>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        <section style={{ paddingTop: '8rem', paddingBottom: '8rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <SectionHeading eyebrow="The Pipeline" title="Cryptographic Chain of Custody" align="center" description="From the moment light hits the sensor to the eternal ledger on Polkadot." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', position: 'relative', marginTop: '5rem' }}>
              {[{ title: 'Capture', desc: 'Hardware TEE signs sensor data instantly', icon: Microscope, color: `hsl(var(--primary))` }, { title: 'Hash', desc: 'Content generates a unique cryptographic CID', icon: Hash, color: `hsl(var(--accent))` }, { title: 'Bind', desc: 'Tied to decentralized identity (DID)', icon: Fingerprint, color: `hsl(var(--primary))` }, { title: 'Anchor', desc: 'State permanently written to Polkadot', icon: Network, color: `hsl(var(--accent))` }].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.6, delay: i * 0.15 }} onHoverStart={() => setHoveredCard(i)} onHoverEnd={() => setHoveredCard(null)} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <motion.div className="glass-panel" style={{ width: '6rem', height: '6rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative', zIndex: 10, boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)' }} whileHover={{ scale: 1.15, boxShadow: '0 0 60px rgba(212, 168, 67, 0.4)' }} animate={hoveredCard === i ? { y: -10 } : { y: 0 }}>
                    <motion.div animate={hoveredCard === i ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 1 }}>
                      <step.icon style={{ width: '2.5rem', height: '2.5rem', color: step.color }} />
                    </motion.div>
                  </motion.div>
                  <motion.h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '0.5rem' }} animate={hoveredCard === i ? { color: step.color } : { color: `hsl(var(--foreground))` }}>
                    {step.title}
                  </motion.h3>
                  <motion.p style={{ color: `hsl(var(--muted-foreground))`, fontFamily: 'var(--font-body)', fontSize: '0.875rem', paddingLeft: '1rem', paddingRight: '1rem' }} animate={hoveredCard === i ? { opacity: 1 } : { opacity: 0.7 }}>
                    {step.desc}
                  </motion.p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ paddingTop: '8rem', paddingBottom: '8rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', backgroundColor: `hsl(var(--background) / 0.4)`, borderTop: `1px solid hsl(var(--foreground) / 0.05)`, borderBottom: `1px solid hsl(var(--foreground) / 0.05)`, backdropFilter: 'blur(8px)', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <SectionHeading eyebrow="Architecture" title="Built on Polkadot" />
            <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }} variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {[{ icon: Fingerprint, title: 'Identity Registry', desc: 'Maps public keys to verified hardware enclaves and human identities.' }, { icon: LockKeyhole, title: 'Content Registry', desc: 'Immutable ledger mapping CIDs to capture metadata, timestamps, and geospatial data.' }, { icon: Scale, title: 'Context Court', desc: 'Decentralized dispute resolution for challenging metadata anomalies.' }].map((card, i) => (
                <motion.div key={i} variants={revealVariants} className="glass-panel" style={{ borderRadius: '1.5rem', padding: '2rem', position: 'relative', overflow: 'hidden', cursor: 'default' }} whileHover={{ y: -8 }}>
                  <motion.div style={{ position: 'absolute', right: '-5rem', top: '-5rem', width: '10rem', height: '10rem', backgroundColor: `hsl(var(--primary) / 0.1)`, borderRadius: '50%', filter: 'blur(50px)' }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }} />
                  <motion.div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem', backgroundColor: `hsl(var(--foreground) / 0.05)`, border: `1px solid hsl(var(--foreground) / 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }} whileHover={{ scale: 1.2, rotate: 10, backgroundColor: `hsl(var(--primary) / 0.1)` }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
                      <card.icon style={{ width: '1.5rem', height: '1.5rem', color: `hsl(var(--foreground))` }} />
                    </motion.div>
                  </motion.div>
                  <motion.h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', marginBottom: '1rem', color: `hsl(var(--foreground))` }} animate={{ color: [`hsl(var(--foreground))`, `hsl(var(--primary))`, `hsl(var(--foreground))`] }} transition={{ duration: 6, repeat: Infinity }}>
                    {card.title}
                  </motion.h3>
                  <p style={{ color: `hsl(var(--muted-foreground))`, lineHeight: 1.75 }}>{card.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <div style={{ '--bg': dark ? 'hsl(240,10%,2%)' : '#f8fafc' } as React.CSSProperties}>
          <Footer />
        </div>

        <section style={{ paddingTop: '8rem', paddingBottom: '8rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <SectionHeading eyebrow="Applications" title="Who Needs Reality?" align="center" />
            <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '4rem', maxWidth: '80rem', margin: '4rem auto 0' }} variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {[{ icon: Newspaper, title: 'Verified Journalism', desc: 'Field reporters cryptographically sign images at capture, proving location and untouched reality.' }, { icon: BookOpenCheck, title: 'Legal & Insurance', desc: 'Accident and evidence photos that hold up in court because tampering is mathematically impossible.' }, { icon: ShieldAlert, title: 'Creator Trust', desc: 'Artists prove their work is human-made and original, establishing provenance before AI scraping.' }, { icon: Microscope, title: 'Scientific Data', desc: 'Raw sensor outputs anchored immediately, preventing post-capture data manipulation in research.' }].map((useCase, i) => (
                <motion.div key={i} variants={itemVariants} style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'transparent', border: `1px solid transparent`, cursor: 'default', transition: 'all 0.3s ease' }} whileHover={{ x: 8, backgroundColor: `hsl(var(--foreground) / 0.05)`, borderColor: `hsl(var(--foreground) / 0.05)` }}>
                  <motion.div style={{ marginTop: '0.25rem' }} whileHover={{ scale: 1.3, rotate: 10 }}>
                    <useCase.icon style={{ width: '2rem', height: '2rem', color: `hsl(var(--primary))` }} />
                  </motion.div>
                  <div>
                    <motion.h4 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 'bold', marginBottom: '0.5rem', color: `hsl(var(--foreground))` }} whileHover={{ x: 5, color: `hsl(var(--primary))` }}>
                      {useCase.title}
                    </motion.h4>
                    <p style={{ color: `hsl(var(--muted-foreground))`, fontSize: '0.875rem', lineHeight: 1.75 }}>{useCase.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <motion.footer style={{ paddingTop: '3rem', paddingBottom: '3rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', borderTop: `1px solid hsl(var(--foreground) / 0.05)`, position: 'relative', zIndex: 10, backgroundColor: `hsl(var(--background) / 0.6)`, backdropFilter: 'blur(40px)', textAlign: 'center' }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <motion.div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }} whileHover={{ scale: 1.06 }}>
            <HashmarkLogo />
          </motion.div>
          <motion.p style={{ color: `hsl(var(--muted-foreground))`, fontSize: '0.875rem', fontFamily: 'var(--font-display)', letterSpacing: '0.05em', textTransform: 'uppercase' }} animate={{ opacity: [0.6, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            Proving reality on Polkadot.
          </motion.p>
          <motion.div style={{ marginTop: '3rem', fontSize: '0.75rem', color: `hsl(var(--muted-foreground) / 0.5)` }} whileHover={{ opacity: 1 }}>
            © {new Date().getFullYear()} Hashmark Protocol. All rights reserved.
          </motion.div>
        </motion.footer>
      </main>
    </>
  );
}
