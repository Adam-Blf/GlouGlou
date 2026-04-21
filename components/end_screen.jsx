// GlouGlou! - Écran de fin de partie avec classement partageable

const { useMemo, useRef, useState } = React;

function EndScreen({ players = [], onReplay, onShare }) {
  const ranked = useMemo(
    () => [...players].sort((a, b) => (b.gulps || 0) - (a.gulps || 0)),
    [players]
  );

  const boardRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");

  async function handleShare() {
    if (sharing) return;
    setShareError("");
    setSharing(true);
    try {
      const h2c = window.html2canvas;
      if (!h2c) {
        setShareError("html2canvas non chargé · vérifie index.html");
        return;
      }
      if (!boardRef.current) return;

      const canvas = await h2c(boardRef.current, {
        backgroundColor: "#050510",
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");

      if (onShare) {
        onShare(dataUrl);
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "glouglou-classement.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      setShareError("Impossible de générer l'image · réessaie");
    } finally {
      setSharing(false);
    }
  }

  const confettiPieces = useMemo(() => {
    const palette = ["#FF00FF", "#C4FF4D", "#7B61FF", "#00FFFF", "#E0E0FF"];
    return Array.from({ length: 28 }).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * -12,
      duration: 6 + Math.random() * 6,
      size: 6 + Math.random() * 8,
      color: palette[i % palette.length],
      rot: Math.random() * 360,
      drift: (Math.random() - 0.5) * 40,
    }));
  }, []);

  return (
    <div className="es-root">
      <style>{`
        .es-root{
          position:relative; min-height:100dvh; width:100%;
          background:var(--ink,#050510);
          color:var(--paper,#E0E0FF);
          font-family:var(--font-body,"Space Grotesk",system-ui,sans-serif);
          padding:32px 20px 40px; box-sizing:border-box;
          overflow:hidden; display:flex; flex-direction:column; align-items:center;
        }
        .es-bg{
          position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:0;
        }
        .es-bg::before, .es-bg::after{
          content:""; position:absolute; border-radius:50%; filter:blur(80px); opacity:.45;
        }
        .es-bg::before{
          width:70vw; height:70vw; top:-20vw; left:-20vw;
          background:radial-gradient(circle, #FF00FF 0%, transparent 70%);
        }
        .es-bg::after{
          width:60vw; height:60vw; bottom:-15vw; right:-15vw;
          background:radial-gradient(circle, #7B61FF 0%, transparent 70%);
        }
        .es-confetti{ position:absolute; inset:0; pointer-events:none; z-index:1; }
        .es-confetti i{
          position:absolute; top:-20px; display:block;
          border-radius:2px;
          animation-name: esFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        @keyframes esFall{
          0%  { transform: translate3d(0,-10vh,0) rotate(0deg); opacity:0; }
          10% { opacity:1; }
          100%{ transform: translate3d(var(--dx,0px),110vh,0) rotate(720deg); opacity:.9; }
        }
        .es-inner{
          position:relative; z-index:2; width:100%; max-width:420px;
          display:flex; flex-direction:column; gap:24px; align-items:stretch;
        }
        .es-title{
          font-family:var(--font-display, "Fraunces", serif);
          font-style: italic;
          font-weight: 600;
          font-size: clamp(40px, 11vw, 56px);
          line-height: 1;
          letter-spacing:-0.02em;
          text-align:center; margin:8px 0 0;
          background: linear-gradient(180deg, #fff 0%, #E0E0FF 60%, #B8B8E0 100%);
          -webkit-background-clip:text; background-clip:text; color:transparent;
          text-shadow: 0 0 40px rgba(255,0,255,0.25);
        }
        .es-sub{
          text-align:center; color:var(--paper-dim,#B8B8E0);
          font-size:14px; letter-spacing:0.12em; text-transform:uppercase;
          margin-top:-6px;
        }
        .es-board{
          background:var(--ink-2,#0D0820);
          border:1px solid rgba(224,224,255,0.08);
          border-radius:var(--radius-lg, 28px);
          padding:18px 16px;
          box-shadow: var(--shadow-card, 0 20px 60px rgba(0,0,0,0.5));
          display:flex; flex-direction:column; gap:10px;
        }
        .es-board-head{
          display:flex; justify-content:space-between; align-items:baseline;
          padding:4px 6px 10px; border-bottom:1px dashed rgba(224,224,255,0.12);
          font-family: var(--font-mono, "JetBrains Mono", monospace);
          font-size:11px; letter-spacing:0.18em; text-transform:uppercase;
          color:var(--paper-dim,#B8B8E0);
        }
        .es-row{
          display:grid;
          grid-template-columns: 34px 48px 1fr auto;
          align-items:center; gap:12px;
          padding:10px 10px;
          border-radius:18px;
          background: rgba(224,224,255,0.03);
          transition: transform .2s ease;
        }
        .es-rank{
          font-family: var(--font-mono, "JetBrains Mono", monospace);
          font-size:16px; font-weight:700;
          color: var(--paper-dim,#B8B8E0);
          text-align:center;
        }
        .es-avatar-wrap{
          position:relative; width:48px; height:48px; flex-shrink:0;
          overflow:visible;
        }
        .es-avatar{
          width:48px; height:48px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:24px; font-weight:700;
          background: linear-gradient(135deg, #7B61FF, #00FFFF);
          color: var(--ink, #050510);
          box-shadow: 0 4px 16px rgba(123,97,255,0.35);
          overflow:hidden;
        }
        .es-avatar img{ width:100%; height:100%; object-fit:cover; }
        .es-name{
          font-size:17px; font-weight:600; color:var(--paper,#E0E0FF);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .es-name small{
          display:block; font-weight:500; font-size:11px;
          color:var(--paper-dim,#B8B8E0); letter-spacing:0.1em; text-transform:uppercase;
          margin-top:2px;
        }
        .es-gulps{
          font-family: var(--font-mono, "JetBrains Mono", monospace);
          font-size:20px; font-weight:700;
          color: var(--neon-2, #C4FF4D);
          text-align:right;
          display:flex; flex-direction:column; align-items:flex-end; line-height:1.05;
        }
        .es-gulps span{
          font-size:10px; font-weight:500;
          color:var(--paper-dim,#B8B8E0); letter-spacing:0.14em; text-transform:uppercase;
        }
        .es-row.es-first{
          background: linear-gradient(135deg, rgba(255,0,255,0.18), rgba(123,97,255,0.10));
          border:1px solid rgba(255,0,255,0.45);
          box-shadow:
            var(--shadow-neon, 0 0 24px rgba(255,0,255,0.55)),
            inset 0 0 0 1px rgba(255,0,255,0.2);
          animation: esPulse 2.4s ease-in-out infinite;
          padding:14px 12px;
        }
        @keyframes esPulse{
          0%,100% { box-shadow: 0 0 20px rgba(255,0,255,0.35), inset 0 0 0 1px rgba(255,0,255,0.2); }
          50%     { box-shadow: 0 0 38px rgba(255,0,255,0.75), inset 0 0 0 1px rgba(255,0,255,0.35); }
        }
        .es-first .es-avatar{
          background: linear-gradient(135deg, #FF00FF, #7B61FF);
          box-shadow: 0 0 0 2px rgba(255,0,255,0.6), 0 0 24px rgba(255,0,255,0.6);
        }
        .es-first .es-name{
          font-family: var(--font-display, "Fraunces", serif);
          font-style: italic;
          font-size:20px;
        }
        .es-first .es-gulps{ color: var(--neon-2, #C4FF4D); font-size:24px; }
        .es-crown{
          position:absolute;
          top:-14px; left:50%;
          transform: translateX(-50%) rotate(-10deg);
          background: var(--neon, #FF00FF);
          color: var(--ink, #050510);
          font-size:10px; font-weight:800;
          padding:3px 8px; border-radius:999px;
          letter-spacing:0.08em; white-space:nowrap;
          box-shadow: 0 4px 12px rgba(255,0,255,0.55);
          display:inline-flex; align-items:center; gap:4px;
          z-index:3;
        }
        .es-rank-first{
          color: var(--neon, #FF00FF);
          text-shadow: 0 0 8px rgba(255,0,255,0.8);
        }
        .es-actions{
          display:flex; flex-direction:column; gap:10px; margin-top:4px;
        }
        .es-btn{
          appearance:none; border:0; cursor:pointer;
          padding:16px 20px; border-radius:999px;
          font-family: var(--font-body, "Space Grotesk", system-ui, sans-serif);
          font-size:16px; font-weight:700; letter-spacing:0.02em;
          transition: transform .15s ease, box-shadow .2s ease, opacity .2s ease;
        }
        .es-btn:active{ transform: translateY(1px) scale(0.99); }
        .es-btn[disabled]{ opacity:.6; cursor:progress; }
        .es-btn-primary{
          background: linear-gradient(90deg, #FF00FF, #7B61FF);
          color:#fff;
          box-shadow: var(--shadow-neon, 0 10px 30px rgba(255,0,255,0.5));
        }
        .es-btn-secondary{
          background: transparent;
          color: var(--paper, #E0E0FF);
          border:1px solid rgba(224,224,255,0.25);
        }
        .es-btn-secondary:hover{ border-color: var(--neon-5, #00FFFF); color: var(--neon-5, #00FFFF); }
        .es-share-error{
          text-align:center; font-size:12px; color: var(--neon, #FF00FF);
          margin-top:-4px;
          font-family: var(--font-mono, "JetBrains Mono", monospace);
          letter-spacing:0.04em;
        }
        .es-empty{
          text-align:center; padding:24px 8px;
          color:var(--paper-dim,#B8B8E0);
          font-size:14px;
        }
      `}</style>

      <div className="es-bg" />
      <div className="es-confetti" aria-hidden="true">
        {confettiPieces.map((c, i) => (
          <i
            key={i}
            style={{
              left: c.left + "%",
              width: c.size + "px",
              height: c.size * 1.6 + "px",
              background: c.color,
              animationDuration: c.duration + "s",
              animationDelay: c.delay + "s",
              transform: `rotate(${c.rot}deg)`,
              "--dx": c.drift + "vw",
              boxShadow: `0 0 6px ${c.color}80`,
            }}
          />
        ))}
      </div>

      <div className="es-inner">
        <div>
          <h1 className="es-title">Soirée terminée</h1>
          <div className="es-sub">Classement final</div>
        </div>

        <div className="es-board" ref={boardRef}>
          <div className="es-board-head">
            <span># Joueur</span>
            <span>Gorgées</span>
          </div>

          {ranked.length === 0 && (
            <div className="es-empty">Pas de joueur · la soirée était calme</div>
          )}

          {ranked.map((p, idx) => {
            const isFirst = idx === 0;
            const initial = (p.name || "?").trim().charAt(0).toUpperCase();
            return (
              <div
                key={p.id ?? idx}
                className={"es-row" + (isFirst ? " es-first" : "")}
                style={{ position: "relative" }}
              >
                <div className={"es-rank" + (isFirst ? " es-rank-first" : "")}>
                  {isFirst ? "1" : String(idx + 1)}
                </div>
                <div className="es-avatar-wrap">
                  {isFirst && <span className="es-crown">★ CHAMPION</span>}
                  <div className="es-avatar">
                    {p.avatar ? <img src={p.avatar} alt="" /> : initial}
                  </div>
                </div>
                <div className="es-name">
                  {p.name || "Anonyme"}
                  {isFirst && <small>Roi·Reine de la soirée</small>}
                </div>
                <div className="es-gulps">
                  {p.gulps || 0}
                  <span>gorgées</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="es-actions">
          <button
            type="button"
            className="es-btn es-btn-primary"
            onClick={handleShare}
            disabled={sharing}
            aria-busy={sharing}
          >
            {sharing ? "Génération…" : "Partager sur Insta"}
          </button>
          {shareError && (
            <div className="es-share-error" role="alert">{shareError}</div>
          )}
          <button
            type="button"
            className="es-btn es-btn-secondary"
            onClick={onReplay}
          >
            Rejouer
          </button>
        </div>
      </div>
    </div>
  );
}

window.EndScreen = EndScreen;
