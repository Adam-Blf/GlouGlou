// GlouGlou! - Board component

const { useState: useStateB, useMemo: useMemoB, useEffect: useEffectB, useRef: useRefB } = React;

// Snake-serpentine layout: row 0 is 1..10 L->R, row 1 is 11..20 R->L, etc.
// 60 cases => 6 rows of 10.
// Case 0 (Départ) sits before case 1 (top-left), Case 60 (Arrivée) sits after case 59.
// For simplicity we display cases 1..60 in serpentine, and put DÉPART/ARRIVÉE as overlays.

function buildLayout() {
  // Returns Array<{n, row, col}>
  const rows = 6;
  const cols = 10;
  const layout = [];
  for (let i = 1; i <= 60; i++) {
    const idx = i - 1;
    const row = Math.floor(idx / cols);
    const colInRow = idx % cols;
    const col = (row % 2 === 0) ? colInRow : (cols - 1 - colInRow);
    layout.push({ n: i, row, col });
  }
  return { cells: layout, rows, cols };
}

function Board({ players, currentPlayerId, onCellClick, highlightCell }) {
  const { cells, rows, cols } = useMemoB(() => buildLayout(), []);
  const CASES = window.CASES;

  const wrapRef = useRefB(null);

  // Scroll current player into view
  useEffectB(() => {
    if (!wrapRef.current) return;
    const me = players.find(p => p.id === currentPlayerId);
    if (!me) return;
    const el = wrapRef.current.querySelector(`[data-cell="${me.position}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [currentPlayerId, players]);

  // Group players by cell
  const byCell = {};
  players.forEach(p => {
    if (!byCell[p.position]) byCell[p.position] = [];
    byCell[p.position].push(p);
  });

  return (
    <div className="board-wrap">
      <div className="board-header">
        <div className="board-title">Le plateau</div>
        <div className="row" style={{ gap: 8 }}>
          <span className="pill" style={{ background: "rgba(255,46,154,0.12)", borderColor: "rgba(255,46,154,0.4)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--cat-drink)" }} /> Boire
          </span>
          <span className="pill" style={{ background: "rgba(139,92,255,0.12)", borderColor: "rgba(139,92,255,0.4)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--cat-action)" }} /> Action
          </span>
          <span className="pill" style={{ background: "rgba(245,214,122,0.12)", borderColor: "rgba(245,214,122,0.4)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--cat-role)" }} /> Rôle
          </span>
        </div>
      </div>

      <div className="board-canvas-wrap" ref={wrapRef}>
        <div className="board-canvas">
          <div className="cells-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {/* Place cells into CSS grid using row/col */}
            {cells.map(({ n, row, col }) => {
              const c = CASES[n]; // 1..60
              if (!c) return null;
              const tokens = byCell[n] || [];
              const isHighlight = highlightCell === n;
              return (
                <div
                  key={n}
                  data-cell={n}
                  className={"cell c-" + c.cat + (isHighlight ? " is-current" : "")}
                  style={{ gridRow: row + 1, gridColumn: col + 1 }}
                  onClick={() => onCellClick?.(n)}
                  title={c.title}
                >
                  <div className="cell-num">{n}</div>
                  <div className="cell-icon">{c.icon}</div>
                  <div className="cell-title">{c.title}</div>
                  {n === 60 && <div style={{ position: "absolute", inset: 0, boxShadow: "0 0 20px rgba(255,179,71,0.6) inset", pointerEvents: "none" }} />}
                  <div className="cell-tokens">
                    {tokens.map(p => {
                      const ch = window.CHARACTERS.find(x => x.id === p.characterId);
                      return (
                        <div key={p.id} className="token" style={{
                          background: ch?.palette.accent,
                          borderColor: ch?.palette.bg,
                        }} title={p.name}>
                          {p.id === currentPlayerId ? "●" : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mono muted" style={{ textAlign: "center", marginTop: 16, fontSize: 10 }}>
            DÉPART → 1 → 2 → … → 60 ARRIVÉE &nbsp;·&nbsp; parcours en serpentin
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Board });
