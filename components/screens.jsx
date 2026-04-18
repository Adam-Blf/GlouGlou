// GlouGlou! - Home + Lobby + Character pick

const { useState: useStateH } = React;

function HomeScreen({ onCreate, onCreateLocal, onJoin, onResume, savedSession }) {
  const [mode, setMode] = useStateH("home"); // home | join
  const [code, setCode] = useStateH(["", "", "", "", "", ""]);
  const [muted, setMuted] = useStateH(() => window.SFX ? window.SFX.isMuted() : false);
  function toggleMute() { const v = !muted; setMuted(v); window.SFX?.setMuted(v); }

  function setCodeChar(i, v) {
    const next = [...code];
    next[i] = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 1);
    setCode(next);
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const filled = ["", "", "", "", "", ""].map((_, i) => text[i] || "");
    setCode(filled);
    const focusIdx = Math.min(text.length, 5);
    document.querySelectorAll(".code-box")[focusIdx]?.focus();
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
            🎲 Nouvelle partie en ligne
          </button>
          <button className="btn btn-ghost" onClick={onCreateLocal}>
            🤝 Jouer en local (même appareil)
          </button>
          <button className="btn btn-ghost" onClick={() => setMode("join")}>
            🔑 Rejoindre avec un code
          </button>
          {savedSession && onResume && (
            <button className="btn btn-accent" onClick={onResume} style={{ flexBasis: "100%" }}>
              ↩️ Reprendre {savedSession.code}
            </button>
          )}
          <button className="btn btn-ghost" onClick={toggleMute} style={{ flexBasis: "100%", fontSize: 12, padding: "8px 14px" }}>
            {muted ? "🔇 Son coupé" : "🔊 Son + vibrations actifs"} · clique pour basculer
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
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => {
                  setCodeChar(i, e.target.value);
                  if (e.target.value && i < 5) {
                    document.querySelectorAll(".code-box")[i + 1]?.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !c && i > 0) {
                    document.querySelectorAll(".code-box")[i - 1]?.focus();
                  } else if (e.key === "Enter") {
                    tryJoin();
                  }
                }}
                onPaste={handlePaste}
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

function LobbyScreen({ roomCode, players, me, mpStatus, mpMode, onLeave, onStart, onEditMe, onAddLocalPlayer }) {
  function copyCode() {
    navigator.clipboard?.writeText(roomCode);
  }
  const isHost = mpMode === "host" || mpMode === "local";
  const ready = players.length >= 1 && players.every(p => p.characterId && p.gender);
  const label = mpStatus === "connecting"
    ? "Connexion…"
    : mpStatus === "reconnecting"
    ? "Reconnexion en cours…"
    : mpStatus === "error"
    ? "Connexion perdue"
    : mpMode === "guest"
    ? "Lobby · en attente de l'hôte"
    : mpMode === "local"
    ? "Lobby local · même appareil"
    : "Lobby · partage le code";
  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn btn-ghost" onClick={onLeave}>← Quitter</button>
        <div className="pill">{label}</div>
      </div>

      {mpMode !== "local" && (
        <div className="panel" style={{ textAlign: "center" }}>
          <div className="mono muted">Code de la partie · partage-le</div>
          <div className="room-code" onClick={copyCode} title="Cliquer pour copier">{roomCode}</div>
          <div className="mono muted">{mpMode === "guest" ? "Attends que l'hôte lance" : "Cliquer pour copier"}</div>
        </div>
      )}

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
                  <div className="name">{p.name}{isMe && mpMode !== "local" && <span className="mono muted" style={{ marginLeft: 6 }}>(toi)</span>}</div>
                  <div className="sub">{c ? c.family : "— aucun perso —"}</div>
                </div>
                <div className="tag-group">
                  {p.gender && <span className="tag active" style={{ pointerEvents: "none" }}>{genderIcon(p.gender)}</span>}
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

      <div className="row" style={{ justifyContent: "center", marginTop: 10, flexWrap: "wrap", gap: 10 }}>
        {mpMode === "local" && onAddLocalPlayer && (
          <button className="btn btn-ghost" onClick={onAddLocalPlayer}>
            + Ajouter un joueur
          </button>
        )}
        {isHost ? (
          <button className="btn btn-primary" disabled={!ready} onClick={onStart}>
            🚀 Lancer la partie {!ready && "(choisis un perso et une option)"}
          </button>
        ) : (
          <div className="mono muted">En attente de l'hôte…</div>
        )}
      </div>
    </div>
  );
}

function CharacterPickScreen({ me, players, onConfirm, onBack }) {
  const [charId, setCharId] = useStateH(me.characterId || null);
  const [gender, setGender] = useStateH(me.gender || null);
  const [name, setName] = useStateH(me.name || "Toi");

  const takenIds = new Set(players.filter(p => p.id !== me.id).map(p => p.characterId).filter(Boolean));

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
        <div className="panel-title" style={{ marginTop: 14 }}>Tu es…</div>
        <GenderSelector value={gender} onChange={setGender} />
        <div className="mono muted" style={{ fontSize: 10, marginTop: 6 }}>
          🍌 Homme · cases 19, 44 te ciblent. 🍑 Femme · cases 29, 46 te ciblent.
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
              <div className="char-family">Famille · {c.family}</div>
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
          disabled={!charId || !gender || !name.trim()}
          onClick={() => onConfirm({ characterId: charId, gender, name: name.trim() || "Joueur" })}
        >
          Valider
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, LobbyScreen, CharacterPickScreen });
