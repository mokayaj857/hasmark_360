'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Database, CheckCircle2, ArrowRight,
  Code2, TrendingUp, BarChart3,
  Key, AlertCircle,
  Fingerprint, Scale, Newspaper
} from 'lucide-react';
import Footer from './Footer';
import HashmarkLogo from './HashmarkLogo';

function getStyles(dark: boolean) {
  return `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Rajdhani:wght@500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }

  body {
    font-family: 'DM Mono', 'DM Sans', sans-serif;
    background-color: ${dark ? 'hsl(240 10% 4%)' : '#f8fafc'};
    color: ${dark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 8%)'};
    overflow-x: hidden;
  }

  h1, h2, h3, h4, h5, h6 { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.05em; }

  @keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 20px rgba(212, 168, 67, 0.3); } 50% { box-shadow: 0 0 40px rgba(212, 168, 67, 0.6); } }
  @keyframes gradient-shift { 0%, 100% { background-position: 0% center; } 50% { background-position: 100% center; } }
  @keyframes aurora { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.5; } }
  @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes float-subtle { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
  @keyframes line-expand { from { scaleX: 0; } to { scaleX: 1; } }

  .glass { background: ${dark ? 'hsl(240 10% 6% / 0.3)' : 'rgba(255,255,255,0.6)'}; backdrop-filter: blur(40px); border: 1px solid ${dark ? 'hsl(0 0% 98% / 0.05)' : 'rgba(0,0,0,0.08)'}; }
  .gradient-text { background: linear-gradient(to right, #D4A843, #c49030); background-size: 200% center; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: gradient-shift 8s ease infinite; }
  
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: ${dark ? 'hsl(240 10% 4%)' : '#e2e8f0'}; }
  ::-webkit-scrollbar-thumb { background: #D4A843; border-radius: 4px; }
`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, type: 'spring' as const, damping: 30, stiffness: 100 }
  }
};

export default function HashmarkSolutionUI() {
  const { dark, toggleDark } = useTheme();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <>
      <style>{getStyles(dark)}</style>

      {/* ── Universal top nav logo ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '1rem 2rem',
        background: dark ? 'rgba(10,10,18,0.7)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: dark ? '1px solid rgba(212,168,67,0.1)' : '1px solid rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <HashmarkLogo color={dark ? '#ffffff' : '#0a0a0a'} />
        <button onClick={toggleDark} aria-label="Toggle theme" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 99, cursor: 'pointer', border: dark ? '1.5px solid rgba(212,168,67,0.6)' : '1.5px solid rgba(0,0,0,0.2)', background: dark ? 'rgba(212,168,67,0.12)' : 'rgba(0,0,0,0.06)', transition: 'background 0.3s, border-color 0.3s' }}>
          {dark ? '☀️' : '🌙'}<span style={{ fontSize: 11, fontWeight: 600, color: dark ? '#D4A843' : '#334155' }}>{dark ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      <div style={{
        background: dark ? 'linear-gradient(135deg, hsl(240 10% 4%) 0%, hsl(240 5% 8%) 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        padding: '8rem 2rem'
      }}>

        {/* Animated Background */}
        <motion.div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 12, repeat: Infinity }}
            style={{
              position: 'absolute',
              top: '5%',
              left: '5%',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(212, 168, 67, 0.15), transparent)',
              borderRadius: '50%',
              filter: 'blur(120px)'
            }}
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 14, repeat: Infinity, delay: 2 }}
            style={{
              position: 'absolute',
              bottom: '5%',
              right: '5%',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(212, 168, 67, 0.1), transparent)',
              borderRadius: '50%',
              filter: 'blur(120px)'
            }}
          />
        </motion.div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '1300px', margin: '0 auto' }}>

          {/* Hero Section */}
          <motion.section style={{ marginBottom: '10rem', textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <h1 style={{
                fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                lineHeight: 1.1
              }} className="gradient-text">
                Stop Detecting.
                <br />
                Start Proving.
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              style={{
                fontSize: '1.3rem',
                color: dark ? 'hsl(240 5% 65%)' : 'hsl(240 5% 25%)',
                maxWidth: '700px',
                margin: '0 auto 3rem',
                lineHeight: 1.8,
                fontWeight: 300
              }}
            >
              Hashmark replaces reactive detection with proactive authenticity. Hardware-rooted cryptographic proof at the moment of creation. Immutable. Verifiable. Forever.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
            >
            <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(212, 168, 67, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/about')}
                style={{
                  padding: '1rem 2.5rem',
                  background: 'linear-gradient(135deg, #D4A843, #c49030)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'hsl(240 10% 4%)',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Learn How It Works <ArrowRight size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(212, 168, 67, 0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/white')}
                style={{
                  padding: '1rem 2.5rem',
                  background: 'transparent',
                  border: '2px solid #D4A843',
                  borderRadius: '8px',
                  color: '#D4A843',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Documentation
              </motion.button>
            </motion.div>
          </motion.section>

          {/* Problem vs Solution */}
          <motion.section style={{ marginBottom: '10rem' }}>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontSize: 'clamp(2rem, 6vw, 2.8rem)',
                textAlign: 'center',
                marginBottom: '4rem',
                fontWeight: 'bold'
              }} className="gradient-text"
            >
              The Fundamental Problem
            </motion.h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '3rem' }}>
              {/* Problem */}
              <motion.div
                initial={{ opacity: 0, x: -80 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="glass"
                style={{
                  padding: '3rem',
                  borderRadius: '12px',
                  background: dark ? 'hsl(240 10% 6% / 0.25)' : 'rgba(0,0,0,0.04)',
                  borderLeft: '3px solid hsl(0 89% 60%)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <motion.div
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 6, repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-10%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, hsl(0 89% 60% / 0.08), transparent)',
                    borderRadius: '50%',
                    filter: 'blur(100px)'
                  }}
                />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ fontWeight: 'bold', color: 'hsl(0 89% 60%)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
                    Traditional Detection
                  </div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem', color: dark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 8%)' }}>
                    An Unwinnable Arms Race
                  </h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {[
                      'Detection algorithms obsolete in weeks',
                      'AI generation outpaces detection',
                      'No verifiable proof, only guesswork',
                      'Metadata easily stripped by platforms',
                      'Reactive, not proactive'
                    ].map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', fontSize: '1rem', color: dark ? 'hsl(240 5% 70%)' : 'hsl(240 5% 25%)', lineHeight: 1.6 }}
                      >
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'hsl(0 89% 60%)', marginTop: '2px', flexShrink: 0 }} />
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Solution */}
              <motion.div
                initial={{ opacity: 0, x: 80 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="glass"
                style={{
                  padding: '3rem',
                  borderRadius: '12px',
                  background: dark ? 'hsl(240 10% 6% / 0.25)' : 'rgba(0,0,0,0.04)',
                  borderLeft: '3px solid #D4A843',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <motion.div
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                  style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-10%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(212, 168, 67, 0.08), transparent)',
                    borderRadius: '50%',
                    filter: 'blur(100px)'
                  }}
                />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ fontWeight: 'bold', color: '#D4A843', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
                    Hashmark Protocol
                  </div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem', color: dark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 8%)' }}>
                    Proof at Moment of Creation
                  </h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {[
                      'Cryptographic proof at capture time',
                      'Hardware-rooted signatures (TEE)',
                      'Immutable on-chain anchoring',
                      'Mathematically verified forever',
                      'Proactive, not reactive'
                    ].map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', fontSize: '1rem', color: dark ? 'hsl(240 5% 70%)' : 'hsl(240 5% 25%)', lineHeight: 1.6 }}
                      >
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#D4A843', marginTop: '2px', flexShrink: 0 }} />
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* The Proof Chain */}
          <motion.section style={{ marginBottom: '10rem' }}>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontSize: 'clamp(2rem, 6vw, 2.8rem)',
                textAlign: 'center',
                marginBottom: '4rem',
                fontWeight: 'bold'
              }} className="gradient-text"
            >
              The Proof Chain
            </motion.h2>

            <div style={{ position: 'relative' }}>
              {/* Steps */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                  { step: 1, title: 'Device Captures', desc: 'Media captured with hardware timestamp', icon: Code2 },
                  { step: 2, title: 'TEE Signs', desc: 'Cryptographic signature in secure enclave', icon: Lock },
                  { step: 3, title: 'DID Binds', desc: 'Identity linked to device with rights', icon: Key },
                  { step: 4, title: 'Polkadot Anchors', desc: 'Immutable record on blockchain', icon: Database }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.6 }}
                    onHoverStart={() => setHoveredCard(i)}
                    onHoverEnd={() => setHoveredCard(null)}
                    className="glass"
                    style={{
                      padding: '2rem',
                      borderRadius: '12px',
                      background: hoveredCard === i ? (dark ? 'hsl(240 10% 6% / 0.4)' : 'rgba(0,0,0,0.07)') : (dark ? 'hsl(240 10% 6% / 0.2)' : 'rgba(0,0,0,0.04)'),
                      border: hoveredCard === i ? '2px solid #D4A843' : (dark ? '1px solid hsl(0 0% 98% / 0.05)' : '1px solid rgba(0,0,0,0.08)'),
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      transform: hoveredCard === i ? 'translateY(-12px)' : 'translateY(0)',
                      position: 'relative'
                    }}
                  >
                    <motion.div
                      animate={{ opacity: hoveredCard === i ? 0.4 : 0.1 }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '250px',
                        height: '250px',
                        background: 'radial-gradient(circle, rgba(212, 168, 67, 0.1), transparent)',
                        borderRadius: '50%',
                        filter: 'blur(80px)'
                      }}
                    />
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={{ color: '#D4A843', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                        Step {item.step}
                      </div>
                      <motion.div
                        style={{ fontSize: '2.5rem', marginBottom: '1rem' }}
                        animate={{ y: hoveredCard === i ? [0, -8, 0] : 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <item.icon size={40} style={{ color: '#D4A843' }} />
                      </motion.div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 'bold', marginBottom: '0.5rem', color: dark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 8%)' }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: dark ? 'hsl(240 5% 65%)' : 'hsl(240 5% 25%)', lineHeight: 1.5 }}>
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Arrow indicators */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={`arrow-${i}`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 + 0.5 }}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: '#D4A843',
                      fontSize: '1.5rem',
                      opacity: 0.6
                    }}
                  >
                    <motion.div animate={{ x: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}>
                      →
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Architecture Pillars */}
          <motion.section style={{ marginBottom: '10rem' }}>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontSize: 'clamp(2rem, 6vw, 2.8rem)',
                textAlign: 'center',
                marginBottom: '4rem',
                fontWeight: 'bold'
              }} className="gradient-text"
            >
              Three Pillars
            </motion.h2>

            <motion.div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem' }}
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              {[
                {
                  icon: Fingerprint,
                  title: 'Identity Registry',
                  items: ['DID Creation & Management', 'Device Registration & Binding', 'Granular Permission Control', 'Public Key Infrastructure'],
                  color: '#D4A843'
                },
                {
                  icon: Database,
                  title: 'Content Registry',
                  items: ['Immutable Content Hashes', 'Metadata & Timestamp Records', 'Geospatial Binding Data', 'Duplicate Prevention'],
                  color: '#c49030'
                },
                {
                  icon: Scale,
                  title: 'Context Court',
                  items: ['Decentralized Dispute System', 'Juror Staking & Selection', 'Economic Security Model', 'Escalation Mechanism'],
                  color: '#D4A843'
                }
              ].map((pillar, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="glass"
                  style={{
                    padding: '2.5rem',
                    borderRadius: '12px',
                    background: dark ? 'hsl(240 10% 6% / 0.25)' : 'rgba(0,0,0,0.04)',
                    border: dark ? '1px solid hsl(0 0% 98% / 0.05)' : '1px solid rgba(0,0,0,0.08)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  whileHover={{ y: -10, border: `2px solid ${pillar.color}` }}
                >
                  <motion.div
                    animate={{ opacity: [0.1, 0.25, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity, delay: i * 1.5 }}
                    style={{
                      position: 'absolute',
                      top: '-40%',
                      right: '-20%',
                      width: '350px',
                      height: '350px',
                      background: `radial-gradient(circle, ${pillar.color} / 0.08, transparent)`,
                      borderRadius: '50%',
                      filter: 'blur(100px)'
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <motion.div
                      style={{
                        width: '56px',
                        height: '56px',
                        background: `${pillar.color}15`,
                        border: `2px solid ${pillar.color}`,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem'
                      }}
                      whileHover={{ scale: 1.15, rotate: 10 }}
                    >
                      <pillar.icon size={28} style={{ color: pillar.color }} />
                    </motion.div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', color: pillar.color }}>
                      {pillar.title}
                    </h3>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                      {pillar.items.map((item, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          viewport={{ once: true }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.95rem',
                            color: dark ? 'hsl(240 5% 65%)' : 'hsl(240 5% 25%)'
                          }}
                        >
                          <motion.div
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: pillar.color,
                              opacity: 0.6
                            }}
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                          />
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          <div style={{ '--bg': dark ? 'hsl(240 10% 4%)' : '#f8fafc' } as React.CSSProperties}>
            <Footer />
          </div>

          {/* Use Cases */}
          <motion.section style={{ marginBottom: '6rem' }}>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontSize: 'clamp(2rem, 6vw, 2.8rem)',
                textAlign: 'center',
                marginBottom: '4rem',
                fontWeight: 'bold'
              }} className="gradient-text"
            >
              Real-World Applications
            </motion.h2>

            <motion.div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
            >
              {[
                { icon: Newspaper, title: 'Journalism & OSINT', desc: 'Prove field media authenticity and location with cryptographic proof.' },
                { icon: Shield, title: 'Legal & Insurance', desc: 'Court-admissible evidence where tampering is mathematically impossible.' },
                { icon: CheckCircle2, title: 'Creator Protection', desc: 'Artists prove human-made work before AI scraping and deepfakes.' },
                { icon: BarChart3, title: 'Scientific Data', desc: 'Datasets anchored at collection for immutable research integrity.' },
                { icon: AlertCircle, title: 'Risk Management', desc: 'Insurance & compliance with cryptographic proof of origin.' },
                { icon: TrendingUp, title: 'Institutional Trust', desc: 'Governments, institutions use Hashmark as authenticity standard.' }
              ].map((useCase, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="glass"
                  style={{
                    padding: '2.2rem',
                    borderRadius: '12px',
                    background: dark ? 'hsl(240 10% 6% / 0.25)' : 'rgba(0,0,0,0.04)',
                    border: dark ? '1px solid hsl(0 0% 98% / 0.05)' : '1px solid rgba(0,0,0,0.08)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  whileHover={{ y: -8, border: '1px solid rgba(212, 168, 67, 0.3)' }}
                >
                  <motion.div
                    animate={{ opacity: [0.08, 0.2, 0.08] }}
                    transition={{ duration: 6, repeat: Infinity, delay: i * 0.4 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '200px',
                      height: '200px',
                      background: 'radial-gradient(circle, rgba(212, 168, 67, 0.08), transparent)',
                      borderRadius: '50%',
                      filter: 'blur(80px)'
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <motion.div style={{ fontSize: '2rem', marginBottom: '1rem' }} whileHover={{ scale: 1.2 }}>
                      <useCase.icon size={32} style={{ color: '#D4A843' }} />
                    </motion.div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 'bold', marginBottom: '0.75rem', color: dark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 8%)' }}>
                      {useCase.title}
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: dark ? 'hsl(240 5% 65%)' : 'hsl(240 5% 25%)', lineHeight: 1.6 }}>
                      {useCase.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

        </div>
      </div>

      {/* ── Footer ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        style={{
          paddingTop: '3rem', paddingBottom: '3rem', paddingLeft: '1.5rem', paddingRight: '1.5rem',
          borderTop: '1px solid rgba(212,168,67,0.1)',
          backgroundColor: dark ? 'rgba(8,8,8,0.8)' : 'rgba(248,250,252,0.9)',
          backdropFilter: 'blur(40px)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <motion.div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }} whileHover={{ scale: 1.06 }}>
          <HashmarkLogo />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: dark ? 'hsl(240 5% 50%)' : 'hsl(240 5% 25%)', marginBottom: '2rem' }}
        >
          Proving reality on Polkadot.
        </motion.p>
        <p style={{ fontSize: '0.72rem', color: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.45)' }}>
          © {new Date().getFullYear()} Hashmark Protocol. All rights reserved.
        </p>
      </motion.footer>
    </>
  );
}
