// GlouGlou! - Extra screens: rules, host setup, turn intro, end stats, shot animation

const { useState: useS2, useEffect: useE2 } = React;

// ---------- Rules / Tutorial ----------
function RulesScreen({ onDone }) {
  const sections = [
    {
      icon: "🎲",
      title: "Le principe",
      body: "Un plateau de 60 cases. À ton tour, tu lances le dé et tu avances. La case où tu tombes déclenche un effet : boire, donner, jouer un rôle, faire une action… Premier à la case 60 gagne."
    },
    {
      icon: "🃏",
      title: "Les jokers",
      body: "Certaines cases donnent un joker. Tu peux l'utiliser à tout moment pour esquiver un effet. Garde-le pour les shots."
    },
    {
      icon: "👑",
      title: "Les rôles",
      body: "Roi, Reine, Valet — ils durent toute la partie et changent les règles pour tout le monde. Tombe dessus et la table t'appartient."
    },
    {
      icon: "🍌🍑",
      title: "Banane & Pêche",
      body: "Quand tu choisis ton perso, tu choisis un symbole. Les cases 'banane' ciblent les bananes, les cases 'pêche' ciblent les pêches. À toi de voir."
    },
    {
      icon: "💧",
      title: "Règle n°1",
      body: "Glouglou avec modération. Un verre d'eau sur deux, pas de shot si tu ne veux pas, et personne ne rentre seul."
    },
  ];
  return (
    <div className="screen">
      <div className="topbar">
        <div className="pill">Les règles</div>
        <button className="btn btn-ghost" onClick={onDone}>Passer →</button>
      </div>
      <div className="rules-grid">
        {sections.map((s, i) => (
          <div key={i} className="rule-card">
            <div className="rule-icon">{s.icon}</div>
            <div className="rule-title">{s.title}</div>
            <div className="rule-body">{s.body}</div>
          </div>
        ))}
      </div>
      <div className="row" style={{ justifyContent: "center", marginTop: 12 }}>
        <button className="btn btn-primary" onClick={onDone}>C'est compris, on joue 🎲</button>
      </div>
    </div>
  );
}

// ---------- Host setup ----------
function HostSetupScreen({ onConfirm, onBack }) {
  const [intensity, setIntensity] = useS2("normale");
  const [variant, setVariant] = useS2("classique");
  const [maxPlayers, setMaxPlayers] = useS2(10);

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn btn-ghost" onClick={onBack}>← Retour</button>
        <div className="pill">Configurer la partie</div>
      </div>

      <div className="panel">
        <div className="panel-title">Intensité</div>
        <div className="tag-group">
          {["soft", "normale", "hardcore"].map(k => (
            <button key={k}
              className={"tag" + (intensity === k ? " active" : "")}
              onClick={() => setIntensity(k)}
            >{k === "soft" ? "😌 Soft" : k === "normale" ? "🍻 Normale" : "🔥 Hardcore"}</button>
          ))}
        </div>
        <div className="mono muted" style={{ fontSize: 10, marginTop: 8 }}>
          {intensity === "soft" && "Gorgées divisées par 2, eau obligatoire, pas de shots."}
          {intensity === "normale" && "Règles de base. Recommandé pour la plupart des soirées."}
          {intensity === "hardcore" && "Shots doublés. À vos risques et périls."}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Variante de plateau</div>
        <div className="tag-group">
          {["classique", "sprint", "marathon"].map(k => (
            <button key={k}
              className={"tag" + (variant === k ? " active" : "")}
              onClick={() => setVariant(k)}
            >{k === "classique" ? "60 cases" : k === "sprint" ? "30 cases (sprint)" : "60 cases + boss final"}</button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Joueurs max : {maxPlayers}</div>
        <input type="range" min="2" max="16" step="1" value={maxPlayers}
               onChange={e => setMaxPlayers(parseInt(e.target.value, 10))}
               style={{ width: "100%" }} />
      </div>

      <div className="row" style={{ justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={() => onConfirm({ intensity, variant, maxPlayers })}>
          Créer la partie →
        </button>
      </div>
    </div>
  );
}

// ---------- Turn intro (plein écran) ----------
function TurnIntro({ player, character, onGo }) {
  useE2(() => {
    const id = setTimeout(onGo, 1500);
    return () => clearTimeout(id);
  }, [player?.id]);
  if (!player) return null;
  return (
    <div className="turn-intro">
      <div className="turn-intro-inner" style={{
        background: `radial-gradient(ellipse at center, ${character?.palette.bg}99 0%, transparent 70%)`,
      }}>
        <div className="mono" style={{ opacity: 0.5 }}>Au tour de</div>
        <div className="turn-intro-avatar" style={{
          background: `radial-gradient(circle at 30% 30%, ${character?.palette.accent}, ${character?.palette.bg})`,
          color: character?.palette.accent,
        }}>{character?.emoji}</div>
        <div className="turn-intro-name">{player.name}</div>
        <div className="turn-intro-family" style={{ color: character?.palette.accent }}>{character?.name}</div>
      </div>
    </div>
  );
}

// ---------- Cupidon: choose partner ----------
function CupidonModal({ me, others, onChoose, onCancel }) {
  return (
    <div className="backdrop">
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header" style={{ background: "linear-gradient(180deg, rgba(255,46,154,0.25), transparent)" }}>
          <div className="icon-splash">💘</div>
          <div className="modal-cat">CUPIDON</div>
          <div className="modal-title">Choisis ton âme-sœur de beuverie</div>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 12 }}>Dès qu'une des deux personnes bois, l'autre bois aussi. Jusqu'à la fin de la partie.</div>
          <div className="players-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
            {others.map(p => {
              const c = window.CHARACTERS.find(x => x.id === p.characterId);
              return (
                <button key={p.id} className="player-card" onClick={() => onChoose(p.id)}
                        style={{ cursor: "pointer", textAlign: "left" }}>
                  <Avatar character={c} size={48} />
                  <div className="name" style={{ fontSize: 14 }}>{p.name}</div>
                  <div className="sub">{c?.family}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Plus tard</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Give sips modal ----------
function GiveSipsModal({ total, others, onDone }) {
  const [dist, setDist] = useS2(() => Object.fromEntries(others.map(o => [o.id, 0])));
  const given = Object.values(dist).reduce((a, b) => a + b, 0);
  const remaining = total - given;

  function set(pid, v) {
    const clamped = Math.max(0, v);
    const nextGiven = given - (dist[pid] || 0) + clamped;
    if (nextGiven > total) return;
    setDist(d => ({ ...d, [pid]: clamped }));
  }

  return (
    <div className="backdrop">
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header" style={{ background: "linear-gradient(180deg, rgba(255,179,71,0.3), transparent)" }}>
          <div className="icon-splash">👉</div>
          <div className="modal-cat">DISTRIBUTION</div>
          <div className="modal-title">Répartis {total} gorgées</div>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 12 }}>
            Restant : <strong style={{ color: remaining === 0 ? "var(--neon-2)" : "var(--neon)" }}>{remaining}</strong>
          </div>
          <div className="col" style={{ gap: 8 }}>
            {others.map(p => {
              const c = window.CHARACTERS.find(x => x.id === p.characterId);
              return (
                <div key={p.id} className="mini-player" style={{ padding: 10 }}>
                  <Avatar character={c} size={32} />
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div className="mono muted" style={{ fontSize: 10 }}>{c?.family}</div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                    <button className="btn btn-ghost" style={{ padding: "2px 10px", fontSize: 14 }} onClick={() => set(p.id, (dist[p.id] || 0) - 1)}>−</button>
                    <div style={{ minWidth: 24, textAlign: "center", fontWeight: 800, fontSize: 18 }}>{dist[p.id] || 0}</div>
                    <button className="btn btn-ghost" style={{ padding: "2px 10px", fontSize: 14 }} onClick={() => set(p.id, (dist[p.id] || 0) + 1)}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={remaining !== 0} onClick={() => onDone(dist)}>
            {remaining === 0 ? "Valider" : `Encore ${remaining} à répartir`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Shot fullscreen animation ----------
function ShotSplash({ onDone, label = "SHOT !" }) {
  useE2(() => {
    const id = setTimeout(onDone, 2200);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="shot-splash">
      <div className="shot-ring" />
      <div className="shot-ring shot-ring-2" />
      <div className="shot-word">{label}</div>
      <div className="shot-emoji">🥃</div>
    </div>
  );
}

// ---------- End stats ----------
function EndStatsScreen({ winner, players, history, onReplay, onHome }) {
  const ranking = [...players].sort((a, b) => b.position - a.position);
  return (
    <div className="screen">
      <div className="topbar">
        <div className="pill">Fin de partie</div>
        <button className="btn btn-ghost" onClick={onHome}>Accueil</button>
      </div>
      <div className="panel" style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 80 }}>🏆</div>
        <div className="mono muted">Vainqueur</div>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 48, lineHeight: 1 }}>
          {winner?.name}
        </div>
        <div className="mono" style={{ marginTop: 6 }}>
          {window.CHARACTERS.find(c => c.id === winner?.characterId)?.name}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Classement</div>
        <div className="col" style={{ gap: 8 }}>
          {ranking.map((p, i) => {
            const c = window.CHARACTERS.find(x => x.id === p.characterId);
            return (
              <div key={p.id} className="mini-player">
                <div style={{ width: 24, textAlign: "center", fontFamily: "var(--font-display)", fontSize: 20, fontStyle: "italic" }}>
                  {i + 1}
                </div>
                <Avatar character={c} size={32} />
                <div>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div className="mono muted" style={{ fontSize: 10 }}>{c?.family} • case {p.position}</div>
                </div>
                <div className="pos">{(history?.sips?.[p.id]) || 0} 🍺</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="row" style={{ justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={onReplay}>🔁 Rejouer</button>
        <button className="btn btn-ghost" onClick={onHome}>Retour accueil</button>
      </div>
    </div>
  );
}

// ---------- Pause menu ----------
function PauseMenu({ onResume, onHome, onRules }) {
  return (
    <div className="backdrop" onClick={onResume}>
      <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="icon-splash">⏸️</div>
          <div className="modal-title">Pause</div>
        </div>
        <div className="modal-body">
          <div className="col" style={{ gap: 8 }}>
            <button className="btn btn-primary" onClick={onResume}>Reprendre</button>
            <button className="btn btn-ghost" onClick={onRules}>📖 Revoir les règles</button>
            <button className="btn btn-ghost" onClick={onHome}>← Retour accueil</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Active roles bar ----------
function ActiveRolesBar({ roles, players }) {
  if (!roles || !roles.length) return null;
  return (
    <div className="roles-bar">
      {roles.map((r, i) => {
        const p = players.find(x => x.id === r.playerId);
        const c = window.CHARACTERS.find(x => x.id === p?.characterId);
        return (
          <div key={i} className="role-chip" title={r.role}>
            <Avatar character={c} size={28} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{p?.name}</div>
              <div className="mono muted" style={{ fontSize: 9 }}>{r.role}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Handoff (local multi: pass the phone) ----------
function HandoffScreen({ player, character, onReady }) {
  if (!player) return null;
  return (
    <div className="handoff-screen">
      <div className="handoff-inner">
        <div className="mono muted" style={{ fontSize: 13 }}>Passe le téléphone à</div>
        <div className="handoff-avatar" style={{
          background: `radial-gradient(circle at 30% 30%, ${character?.palette?.accent ?? "#fff"}, ${character?.palette?.bg ?? "#333"})`,
          color: character?.palette?.accent ?? "#fff",
        }}>{character?.emoji ?? "🎲"}</div>
        <div className="handoff-name">{player.name}</div>
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={onReady}>
          C'est à moi ! →
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  RulesScreen, HostSetupScreen, TurnIntro,
  CupidonModal, GiveSipsModal, ShotSplash,
  EndStatsScreen, PauseMenu, ActiveRolesBar,
  HandoffScreen,
});
