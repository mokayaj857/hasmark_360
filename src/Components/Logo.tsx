export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ff0080" />
        </linearGradient>
        <linearGradient id="logoGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#00ff88" />
        </linearGradient>
      </defs>
      
      {/* Outer hexagon ring */}
      <path
        d="M24 2L44 14V34L24 46L4 34V14L24 2Z"
        stroke="url(#logoGradient)"
        strokeWidth="2.5"
        fill="none"
      />
      
      {/* Inner geometric shape - represents authenticity/verification */}
      <path
        d="M24 8L38 16V32L24 40L10 32V16L24 8Z"
        fill="url(#logoGradient)"
        fillOpacity="0.2"
      />
      
      {/* Central "E" mark stylized as a verification symbol */}
      <path
        d="M16 18H32M16 24H28M16 30H32"
        stroke="url(#logoGradient2)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Accent dot - represents the "moment of creation" */}
      <circle cx="34" cy="24" r="3" fill="url(#logoGradient)" />
    </svg>
  );
}

export function LogoMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoMarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ff0080" />
        </linearGradient>
        <linearGradient id="logoMarkGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#00ff88" />
        </linearGradient>
      </defs>
      
      {/* Hexagon */}
      <path
        d="M24 4L42 15V33L24 44L6 33V15L24 4Z"
        fill="url(#logoMarkGradient)"
        fillOpacity="0.25"
        stroke="url(#logoMarkGradient)"
        strokeWidth="2.5"
      />
      
      {/* E lines */}
      <path
        d="M14 17H34M14 24H30M14 31H34"
        stroke="url(#logoMarkGradient2)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Verification dot */}
      <circle cx="36" cy="24" r="3.5" fill="url(#logoMarkGradient)" />
    </svg>
  );
}

export function LogoFull({ height = 32, className = "" }: { height?: number; className?: string }) {
  const width = height * 3.5;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoFullGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ff0080" />
        </linearGradient>
        <linearGradient id="logoFullGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#00ff88" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Logo mark */}
      <g transform="translate(0, 0)">
        <path
          d="M20 2L36 11V29L20 38L4 29V11L20 2Z"
          fill="url(#logoFullGradient)"
          fillOpacity="0.25"
          stroke="url(#logoFullGradient)"
          strokeWidth="2"
        />
        <path
          d="M11 14H29M11 20H25M11 26H29"
          stroke="url(#logoFullGradient2)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="31" cy="20" r="2.5" fill="url(#logoFullGradient)" />
      </g>
      
      {/* "Era" text with Orbitron font */}
      <text
        x="48"
        y="28"
        fontFamily="'Orbitron', sans-serif"
        fontSize="24"
        fontWeight="700"
        fill="url(#logoFullGradient)"
        letterSpacing="2"
        filter="url(#glow)"
      >
        ERA
      </text>
    </svg>
  );
}
