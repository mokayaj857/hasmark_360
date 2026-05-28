import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { dark, toggleDark } = useTheme();

  return (
    <button
      onClick={toggleDark}
      aria-label="Toggle theme"
      style={{
        background: "none",
        border: "1px solid var(--border, rgba(255,255,255,0.15))",
        borderRadius: 8,
        padding: "6px 10px",
        cursor: "pointer",
        color: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
