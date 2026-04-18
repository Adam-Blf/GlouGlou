// GlouGlou! - Home + Lobby + Character pick

const { useState: useStateH } = React;

function HomeScreen({ onCreate, onJoin }) {
  const [mode, setMode] = useStateH("home"); // home | join
  const [code, setCode] = useStateH(["", "", "", "", "", ""]);

  function setCodeChar(i, v) {
    const next = [...code];
    next[i] = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 1);
    setCode(next);
  }

  function tryJoin() {
    const joined = code.join("");
    if (joined.length < 4) return;
    onJoin(joined);
  }

  return (
    <div className="home">
      <div className="install-badge">● PWA ready — installable</div>
      <div>
        <div className="logo">
          GlouGlou<span className="bang">!</span>
        </div>
        <div className="tagline">Le jeu de l'oie qui tombe à l'eau… d'alcool</div>
      </div>

      {mode === "home" && (
        <div className="home-actions">
          <button className="btn btn-primary" onClick={onCreate}>
            🎲 Nouvelle partie
          </button>
          <button className="btn btn-ghost" onClick={() => setMode("join")}>
            🔑 Rejoindre avec un code
          </button>
        </div>
      )}

      {mode === "join" && (
        <div className="col" style={{ alignItems: "center", gap: 16 }}>
          <div className="mono">Code de la partie</div>
          <div className="code-input">
            {code.map((c, i) => (
              <input
                key={i}
                className="code-box"
                value={c}
                maxLength={1}
                onChange={(e) => setCodeChar(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !c && i > 0) {
                    document.querySelectorAll(".code-box")[i - 1]?.focus();
                  } else if (e.key === "Enter") {
                    tryJoin();
                  }
                }}
                autoFocus={i === 0}
              />
            ))}
          </div>
          <div className="row">
            <button className="btn btn-ghost" onClick={() => setMode("home")}>← Retour</button>
            <button className="btn btn-accent" onClick={tryJoin}>Rejoindre</button>
          </div>
        </div>
      )}

      <div className="home-footer">
        <span>v0.1 • April 2026</span>
        <span>Joue avec modération</span>
      </div>
    </div>
  );
}

function LobbyScreen({ roomCode, players, me, onLeave, onStart, onEditMe }) {
  function copyCode() {
    navigator.clipboard?.writeText(roomCode);
  }
  const ready = players.length >= 2 && players.every(p => p.characterId);
  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn btn-ghost" onClick={onLeave}>← Quitter</button>
        <div className="pill">Lobby — en attente</div>
      </div>

      <div className="panel" style={{ textAlign: "center" }}>
        <div className="mono muted">Code de la partie — partage-le</div>
        <div className="room-code" onClick={copyCode} title="Cliquer pour copier">{roomCode}</div>
        <div className="mono muted">Cliquer pour copier</div>
      </div>

      <div className="col">
        <div className="mono muted">Joueurs ({players.length})</div>
        <div className="players-grid">
          {players.map(p => {
            const c = window.CHARACTERS.find(x => x.id === p.characterId);
            const isMe = p.id === me.id;
            return (
              <div key={p.id} className={"player-card" + (isMe ? " me" : "")}>
                <div className="status-dot" />
                <Avatar character={c} size={56} />
                <div>
                  <div className="name">{p.name}{isMe && <span className="mono muted" style={{ marginLeft: 6 }}>(toi)</span>}</div>
                  <div className="sub">{c ? c.family : "— aucun perso —"}</div>
                </div>
                <div className="tag-group">
                  {p.tags.includes("banana") && <span className="tag active" style={{ pointerEvents: "none" }}>🍌</span>}
                  {p.tags.includes("peach")  && <span className="tag active" style={{ pointerEvents: "none" }}>🍑</span>}
                </div>
                {isMe && (
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: "8px 12px" }} onClick={onEditMe}>
                    Modifier
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="row" style={{ justifyContent: "center", marginTop: 10 }}>
        <button className="btn btn-primary" disabled={!ready} onClick={onStart}>
          🚀 Lancer la partie {!ready && "(choisis un perso)"}
        </button>
      </div>
    </div>
  );
}

function CharacterPickScreen({ me, players, onConfirm, onBack }) {
  const [charId, setCharId] = useStateH(me.characterId || null);
  const [tags, setTags] = useStateH(me.tags || []);
  const [name, setName] = useStateH(me.name || "Toi");

  const takenIds = new Set(players.filter(p => p.id !== me.id).map(p => p.characterId).filter(Boolean));
  const selected = window.CHARACTERS.find(c => c.id === charId);

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn btn-ghost" onClick={onBack}>← Retour</button>
        <div className="pill">Choisis ton archétype</div>
      </div>

      <div className="panel">
        <div className="panel-title">Ton pseudo</div>
        <input
          value={name}
          onChange={e => setName(e.target.value.slice(0, 20))}
          className="code-box"
          style={{ width: "100%", height: 44, textTransform: "none", fontSize: 18, textAlign: "left", padding: "0 14px" }}
        />
        <div className="panel-title" style={{ marginTop: 14 }}>Qui bois-tu comme ?</div>
        <div className="tag-group">
          <TagSelector value={tags} onChange={setTags} />
        </div>
        <div className="mono muted" style={{ fontSize: 10, marginTop: 6 }}>
          Cela détermine les cases qui te ciblent (banane = symbole des cases 19, 44 — pêche = symbole des cases 29, 46).
        </div>
      </div>

      <div className="char-grid">
        {window.CHARACTERS.map(c => {
          const taken = takenIds.has(c.id);
          const isSelected = charId === c.id;
          return (
            <div
              key={c.id}
              className={"char-card" + (taken ? " taken" : "") + (isSelected ? " selected" : "")}
              style={{
                background: `linear-gradient(160deg, ${c.palette.bg} 0%, ${c.palette.bg} 60%, ${c.palette.accent}20 100%)`,
                color: c.palette.ink,
              }}
              onClick={() => !taken && setCharId(c.id)}
            >
              <div className="char-emoji">{c.emoji}</div>
              <div className="char-name">{c.name}</div>
              <div className="char-family">Famille : {c.family}</div>
              <div className="char-power-title" style={{ color: c.palette.accent }}>⚡ {c.power}</div>
              <div className="char-power-desc">{c.power_desc}</div>
              <div className="char-flavor">« {c.flavor} »</div>
              {taken && (
                <div style={{ position: "absolute", top: 10, right: 10 }} className="mono">Pris</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="row" style={{ justifyContent: "center" }}>
        <button
          className="btn btn-primary"
          disabled={!charId || !name.trim()}
          onClick={() => onConfirm({ characterId: charId, tags, name: name.trim() || "Joueur" })}
        >
          Valider
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, LobbyScreen, CharacterPickScreen });
