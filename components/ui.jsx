// GlouGlou! - Petits composants partagés

const { useState, useEffect, useRef, useMemo } = React;

// --- Dice (animated) ---
function Dice({ value, rolling, onRoll, disabled, cta = "Lancer le dé" }) {
  // Dot positions for 1..6
  const dotMap = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  const [displayedValue, setDisplayedValue] = useState(value || 1);

  useEffect(() => {
    if (!rolling) { setDisplayedValue(value || 1); return; }
    const id = setInterval(() => {
      setDisplayedValue(1 + Math.floor(Math.random() * 6));
    }, 80);
    return () => clearInterval(id);
  }, [rolling, value]);

  const dots = dotMap[displayedValue] || [];
  return (
    <div className="dice-area">
      <div className={"dice" + (rolling ? " rolling" : "")}
           onClick={!rolling && !disabled ? onRoll : undefined}>
        <div className="dice-dots">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="dice-dot" style={{ opacity: dots.includes(i) ? 1 : 0 }} />
          ))}
        </div>
      </div>
      <button className="btn btn-primary" onClick={onRoll} disabled={rolling || disabled}>
        {rolling ? "…" : cta}
      </button>
    </div>
  );
}

// --- Player avatar circle ---
function Avatar({ character, size = 40, withGlow = false }) {
  const p = character?.palette || { bg: "#444", accent: "#fff" };
  return (
    <div className="avatar" style={{
      width: size, height: size,
      background: `radial-gradient(circle at 30% 30%, ${p.accent}, ${p.bg})`,
      color: p.accent,
      boxShadow: withGlow ? `0 0 0 2px rgba(255,255,255,0.25), 0 0 18px ${p.accent}80` : null,
      fontSize: size * 0.5,
    }}>
      {character?.emoji || "?"}
    </div>
  );
}

// --- Toast ---
function Toast({ children, onDone, duration = 2400 }) {
  useEffect(() => {
    const id = setTimeout(onDone, duration);
    return () => clearTimeout(id);
  }, [onDone, duration]);
  return <div className="toast">{children}</div>;
}

// --- Confetti burst ---
function Confetti({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 30 });
  const colors = ["#ff2e9a", "#c4ff4d", "#8b5cff", "#5aeaff", "#ffb347"];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 200 }}>
      {pieces.map((_, i) => {
        const angle = (Math.PI * 2 * i) / pieces.length;
        const dist = 100 + Math.random() * 120;
        return (
          <div key={i} className="confetti-piece" style={{
            background: colors[i % colors.length],
            ["--dx"]: `calc(-50% + ${Math.cos(angle) * dist}px)`,
            ["--dy"]: `calc(-50% + ${Math.sin(angle) * dist}px)`,
            animationDelay: `${i * 0.01}s`,
          }} />
        );
      })}
    </div>
  );
}

// --- Gender selector (homme / femme) ---
function GenderSelector({ value, onChange }) {
  const opts = [
    { id: "homme", label: "🍌 Homme" },
    { id: "femme", label: "🍑 Femme" },
  ];
  return (
    <div className="tag-group">
      {opts.map(o => (
        <button key={o.id}
          className={"tag" + (value === o.id ? " active" : "")}
          onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function genderIcon(g) { return g === "homme" ? "🍌" : g === "femme" ? "🍑" : ""; }

Object.assign(window, { Dice, Avatar, Toast, Confetti, GenderSelector, genderIcon });
