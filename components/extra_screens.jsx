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
function HostSetupScreen({ onConfirm, onBack, onEditCases }) {
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

      <div className="col" style={{ alignItems: "center", gap: 10 }}>
        {onEditCases && (
          <button className="btn btn-ghost" style={{ width: "100%" }} onClick={onEditCases}>
            ✏️ Personnaliser les cases
          </button>
        )}
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
function EndStatsScreen({ winner, players, history, finishedPlayerIds, onReplay, onHome }) {
  const finishedIds = finishedPlayerIds || [];
  const ranking = [...players].sort((a, b) => {
    const ai = finishedIds.indexOf(a.id);
    const bi = finishedIds.indexOf(b.id);
    if (ai !== -1 && bi !== -1) return ai - bi; // both finished: by finish order
    if (ai !== -1) return -1; // a finished, b didn't: a first
    if (bi !== -1) return 1;  // b finished, a didn't: b first
    return b.position - a.position; // neither finished: by position
  });
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
            const finishPos = (finishedPlayerIds || []).indexOf(p.id);
            const medal = finishPos === 0 ? "🥇" : finishPos === 1 ? "🥈" : finishPos === 2 ? "🥉" : finishPos >= 0 ? `#${finishPos + 1}` : `${i + 1}`;
            return (
              <div key={p.id} className="mini-player">
                <div style={{ width: 28, textAlign: "center", fontFamily: "var(--font-display)", fontSize: 20, fontStyle: "italic" }}>
                  {medal}
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

      <div className="row" style={{ justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
        <button className="btn btn-ghost" style={{ flexBasis: "100%" }} onClick={() => {
          const lines = ranking.map((p, i) => {
            const finishPos = (finishedPlayerIds || []).indexOf(p.id);
            const medal = finishPos === 0 ? "🥇" : finishPos === 1 ? "🥈" : finishPos === 2 ? "🥉" : finishPos >= 0 ? `#${finishPos + 1}` : `${i + 1}.`;
            return `${medal} ${p.name} — ${(history?.sips?.[p.id]) || 0} gorgées 🍺`;
          }).join("\n");
          const text = `🎲 GlouGlou! — Résultats\n\n${lines}\n\nJoue sur glouglou.vercel.app`;
          if (navigator.share) navigator.share({ title: "GlouGlou! Résultats", text });
          else navigator.clipboard?.writeText(text).then(() => alert("Résultats copiés !"));
        }}>
          📤 Partager les résultats
        </button>
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

// ---------- Card draw modal ----------
function CardDrawModal({ card, player, onClose }) {
  const [flipped, setFlipped] = useS2(false);
  const isRed = card.suit === '♥' || card.suit === '♦';

  function getEffect() {
    const v = card.value;
    if (v === 'A') return "Shot cul sec ! 🥃";
    if (v === 'K') return "Tu deviens Roi des questions jusqu'à la fin de la partie.";
    if (v === 'Q') return "Tu deviens Reine des p***s jusqu'à la fin.";
    if (v === 'J') return "Tu deviens Valet des pouces jusqu'à la fin.";
    if (v === '10') return "Tournée générale ! Tout le monde boit 2 gorgées.";
    if (v === '9') return "Bois 3 gorgées.";
    if (v === '8') return "Défense ! Tu ne bois rien pendant ce tour.";
    return `Bois ${v} gorgée${parseInt(v,10) > 1 ? 's' : ''}.`;
  }

  return (
    <div className="backdrop">
      <div className="modal" style={{ maxWidth: 360 }}>
        <div className="modal-header" style={{ background: "linear-gradient(180deg, rgba(255,200,50,0.18), transparent)" }}>
          <div className="icon-splash">🃏</div>
          <div className="modal-cat">PIOCHE UNE CARTE</div>
          <div className="modal-title">{player?.name}</div>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          {!flipped ? (
            <div className="playing-card card-back" onClick={() => setFlipped(true)}>
              <div style={{ fontSize: 44 }}>🎴</div>
              <div className="mono" style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>Tape pour révéler</div>
            </div>
          ) : (
            <>
              <div className="playing-card" style={{ color: isRed ? "#e63946" : "#111" }}>
                <div className="card-corner card-corner-tl">{card.value}<br />{card.suit}</div>
                <div className="card-suit-big">{card.suit}</div>
                <div className="card-corner card-corner-br">{card.value}<br />{card.suit}</div>
              </div>
              <div style={{ textAlign: "center", fontSize: 16, fontWeight: 600, color: "var(--paper)" }}>{getEffect()}</div>
            </>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={!flipped} onClick={onClose}>Continuer</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Case editor ----------
const CATS = ["drink","give","party","action","role","special","target","card"];
const CAT_LABELS = { drink:"Boire", give:"Gorgées", party:"Tout le monde", action:"Action", role:"Rôle", special:"Spéciale", target:"Ciblée", card:"Carte" };

function CaseEditorScreen({ customCases, onSave, onReset, onBack }) {
  const [search, setSearch] = useS2("");
  const [editing, setEditing] = useS2(null); // case number being edited
  const [draft, setDraft] = useS2({});

  const allCases = (window._CASES_ORIG || window.CASES).slice(1); // 1..65, skip n=0
  const filtered = search
    ? allCases.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || String(c.n).includes(search))
    : allCases;

  function startEdit(c) {
    const orig = (window._CASES_ORIG || window.CASES)[c.n] || c;
    const custom = customCases[c.n] || {};
    setDraft({ title: custom.title ?? orig.title, icon: custom.icon ?? orig.icon, short: custom.short ?? orig.short, desc: custom.desc ?? orig.desc, cat: custom.cat ?? orig.cat });
    setEditing(c.n);
  }

  function saveEdit() {
    const orig = (window._CASES_ORIG || window.CASES)[editing];
    const diff = {};
    ['title','icon','short','desc','cat'].forEach(k => { if (draft[k] !== orig[k]) diff[k] = draft[k]; });
    onSave(editing, Object.keys(diff).length ? diff : null);
    setEditing(null);
  }

  const customCount = Object.keys(customCases).length;

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn btn-ghost" onClick={onBack}>← Retour</button>
        <div className="pill">✏️ Cases personnalisées</div>
      </div>

      <div className="row" style={{ gap: 8, padding: "0 4px" }}>
        <input
          className="code-box"
          placeholder="🔍 Rechercher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, height: 40, fontSize: 14, textTransform: "none", textAlign: "left", padding: "0 12px" }}
        />
        {customCount > 0 && (
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "8px 12px", borderColor: "rgba(255,100,100,0.5)", color: "rgba(255,150,150,1)" }}
            onClick={() => { if (window.confirm(`Réinitialiser les ${customCount} case(s) modifiée(s) ?`)) onReset(); }}>
            Réinitialiser ({customCount})
          </button>
        )}
      </div>

      <div className="case-editor-list">
        {filtered.map(origCase => {
          const isCustom = !!customCases[origCase.n];
          const c = isCustom ? { ...origCase, ...customCases[origCase.n] } : origCase;
          return (
            <div key={c.n} className={"case-editor-item c-" + c.cat + (isCustom ? " is-custom" : "")}
              onClick={() => startEdit(origCase)}>
              <div className="case-editor-num">{c.n}</div>
              <div className="case-editor-icon">{c.icon}</div>
              <div className="case-editor-info">
                <div className="case-editor-title">{c.title}{isCustom && <span className="case-editor-badge">✏️</span>}</div>
                <div className="case-editor-short">{c.short}</div>
              </div>
            </div>
          );
        })}
      </div>

      {editing !== null && (
        <div className="backdrop" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-cat">Case {editing}</div>
              <div className="modal-title">Modifier la case</div>
            </div>
            <div className="modal-body col" style={{ gap: 14 }}>
              <div className="row" style={{ gap: 8 }}>
                <div style={{ flex: "0 0 64px" }}>
                  <div className="mono muted" style={{ fontSize: 10, marginBottom: 4 }}>Icône</div>
                  <input className="code-box" value={draft.icon} onChange={e => setDraft(d => ({ ...d, icon: e.target.value }))}
                    style={{ width: 56, height: 56, fontSize: 28, textAlign: "center" }} maxLength={4} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="mono muted" style={{ fontSize: 10, marginBottom: 4 }}>Titre</div>
                  <input className="code-box" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                    style={{ width: "100%", height: 40, fontSize: 15, textTransform: "none", textAlign: "left", padding: "0 10px" }} maxLength={32} />
                </div>
              </div>
              <div>
                <div className="mono muted" style={{ fontSize: 10, marginBottom: 4 }}>Résumé court</div>
                <input className="code-box" value={draft.short} onChange={e => setDraft(d => ({ ...d, short: e.target.value }))}
                  style={{ width: "100%", height: 40, fontSize: 13, textTransform: "none", textAlign: "left", padding: "0 10px" }} maxLength={50} />
              </div>
              <div>
                <div className="mono muted" style={{ fontSize: 10, marginBottom: 4 }}>Description complète</div>
                <textarea value={draft.desc} onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))}
                  rows={3} maxLength={200}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1.5px solid var(--line-strong)", borderRadius: 10, color: "var(--paper)", fontSize: 13, padding: "10px 12px", resize: "vertical", fontFamily: "inherit" }} />
              </div>
              <div>
                <div className="mono muted" style={{ fontSize: 10, marginBottom: 6 }}>Catégorie</div>
                <div className="tag-group" style={{ flexWrap: "wrap" }}>
                  {CATS.map(k => (
                    <button key={k} className={"tag" + (draft.cat === k ? " active" : "")} onClick={() => setDraft(d => ({ ...d, cat: k }))}>{CAT_LABELS[k]}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              {customCases[editing] && (
                <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { onSave(editing, null); setEditing(null); }}>
                  Réinitialiser
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveEdit}>Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  RulesScreen, HostSetupScreen, TurnIntro,
  CupidonModal, GiveSipsModal, ShotSplash,
  EndStatsScreen, PauseMenu, ActiveRolesBar,
  HandoffScreen, CardDrawModal, CaseEditorScreen,
});
