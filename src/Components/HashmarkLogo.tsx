export default function HashmarkLogo({ color = '#ffffff' }: { color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute', width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(212,168,67,0.2)', filter: 'blur(6px)',
        }} />
        <svg width="28" height="28" viewBox="0 0 20 20" fill="none" style={{ position: 'relative' }}>
          <line x1="6"   y1="2"  x2="4"    y2="18" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
          <line x1="13"  y1="2"  x2="11"   y2="18" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
          <line x1="2"   y1="7"  x2="18"   y2="7"  stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
          <line x1="1.5" y1="13" x2="17.5" y2="13" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontSize: 17, letterSpacing: '0.28em', textTransform: 'uppercase',
          color, fontWeight: 700, lineHeight: 1,
        }}>HASHMARK</span>
        <span style={{
          fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: '#D4A843', fontWeight: 500, lineHeight: 1,
        }}>PROTOCOL</span>
      </div>
    </div>
  );
}
