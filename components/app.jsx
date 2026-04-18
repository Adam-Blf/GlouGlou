// GlouGlou! - Main App with full screens flow

const { useState, useEffect, useRef, useMemo } = React;

function genRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function uid() { return Math.random().toString(36).slice(2, 9); }

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "neon",
  "boardSize": 1,
  "turnIntro": true
}/*EDITMODE-END*/;

const PALETTES = {
  neon:   { "--neon": "#ff2e9a", "--neon-2": "#c4ff4d", "--neon-3": "#8b5cff" },
  sunset: { "--neon": "#ff6e6e", "--neon-2": "#ffb347", "--neon-3": "#ff2e9a" },
  cool:   { "--neon": "#5aeaff", "--neon-2": "#9ec9ff", "--neon-3": "#8b5cff" },
  retro:  { "--neon": "#f5d67a", "--neon-2": "#c4ff4d", "--neon-3": "#ffb347" },
};

function useTweaks() {
  const [t, setT] = useState(TWEAK_DEFAULTS);
  useEffect(() => {
    const p = PALETTES[t.palette] || PALETTES.neon;
    Object.entries(p).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  }, [t.palette]);
  return [t, setT];
}

function App() {
  // screens: home | hostSetup | pickChar | lobby | rules | game | end
  const [screen, setScreen] = useState("home");
  const [roomCode, setRoomCode] = useState(null);
  const [gameConfig, setGameConfig] = useState({ intensity: "normale", variant: "classique", maxPlayers: 10 });
  const [tweaks, setTweaks] = useTweaks();
  const [editMode, setEditMode] = useState(false);
  const [showRulesFirst, setShowRulesFirst] = useState(false);

  const [me, setMe] = useState(() => ({
    id: uid(), name: "Toi", characterId: null, tags: [],
    position: 0, jokers: 0, isHost: true,
  }));
  const [players, setPlayers] = useState([]);

  const [turnIdx, setTurnIdx] = useState(0);
  const [dice, setDice] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [activeCaseModal, setActiveCaseModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const [inspectCase, setInspectCase] = useState(null);
  const [winner, setWinner] = useState(null);
  const [history, setHistory] = useState({ sips: {} });

  // Sub-flows
  const [showTurnIntro, setShowTurnIntro] = useState(false);
  const [cupidonOpen, setCupidonOpen] = useState(null); // {playerId}
  const [giveModal, setGiveModal] = useState(null); // {playerId, total}
  const [shotSplash, setShotSplash] = useState(null); // {label}
  const [pauseOpen, setPauseOpen] = useState(false);
  const [cupidLinks, setCupidLinks] = useState([]); // [{a,b}]
  const [activeRoles, setActiveRoles] = useState([]); // [{role, playerId}]

  useEffect(() => {
    function onMsg(ev) {
      const m = ev.data;
      if (!m || typeof m !== "object") return;
      if (m.type === "__activate_edit_mode") setEditMode(true);
      else if (m.type === "__deactivate_edit_mode") setEditMode(false);
    }
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  function setTweakKey(k, v) {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { [k]: v } }, "*");
  }

  function showToast(text) { setToast({ text, id: Date.now() }); }

  function addSips(playerId, n) {
    setHistory(h => ({ ...h, sips: { ...h.sips, [playerId]: (h.sips[playerId] || 0) + n } }));
  }

  function createRoom() {
    setScreen("hostSetup");
  }
  function onHostSetupConfirm(cfg) {
    setGameConfig(cfg);
    const code = genRoomCode();
    setRoomCode(code);
    const bots = [
      { id: uid(), name: "Léa",     characterId: "rose",    tags: ["peach"],  position: 0, jokers: 0, isBot: true },
      { id: uid(), name: "Mathias", characterId: "gin",     tags: ["banana"], position: 0, jokers: 0, isBot: true },
      { id: uid(), name: "Sofia",   characterId: "tequila", tags: ["peach"],  position: 0, jokers: 0, isBot: true },
      { id: uid(), name: "Karim",   characterId: "cerf",    tags: ["banana"], position: 0, jokers: 0, isBot: true },
    ];
    setPlayers([{ ...me }, ...bots]);
    setScreen("pickChar");
  }
  function joinRoom(code) {
    setRoomCode(code);
    const others = [
      { id: uid(), name: "Hôte",  characterId: "champagne", tags: ["peach"],  position: 0, jokers: 0, isBot: true, isHost: true },
      { id: uid(), name: "Timo",  characterId: "beer",      tags: ["banana"], position: 0, jokers: 0, isBot: true },
      { id: uid(), name: "Alix",  characterId: "vodka",     tags: [],         position: 0, jokers: 0, isBot: true },
    ];
    setPlayers([{ ...me, isHost: false }, ...others]);
    setMe(m => ({ ...m, isHost: false }));
    setScreen("pickChar");
  }
  function onConfirmChar({ characterId, tags, name }) {
    const updatedMe = { ...me, characterId, tags, name };
    setMe(updatedMe);
    setPlayers(ps => ps.map(p => p.id === me.id ? updatedMe : p));
    setScreen("lobby");
  }

  function startGame() {
    setTurnIdx(0);
    setDice(null);
    setWinner(null);
    setCupidLinks([]);
    setActiveRoles([]);
    setHistory({ sips: {} });
    setShowRulesFirst(true);
    setScreen("rules");
  }
  function rulesDone() {
    setShowRulesFirst(false);
    setScreen("game");
    if (tweaks.turnIntro) setShowTurnIntro(true);
  }

  function rollDice() {
    if (rolling || activeCaseModal || winner || shotSplash || showTurnIntro || cupidonOpen || giveModal || pauseOpen) return;
    setRolling(true);
    const target = 1 + Math.floor(Math.random() * 6);
    setTimeout(() => {
      setDice(target);
      setRolling(false);
      advanceCurrentPlayer(target);
    }, 900);
  }

  function movePlayer(playerId, newPos) {
    setPlayers(ps => ps.map(p => p.id === playerId ? { ...p, position: newPos } : p));
  }

  function advanceCurrentPlayer(steps) {
    const current = players[turnIdx];
    const newPos = Math.min(60, current.position + steps);
    let pos = current.position;
    const step = () => {
      pos += 1;
      movePlayer(current.id, pos);
      if (pos < newPos) setTimeout(step, 140);
      else setTimeout(() => triggerCase(current.id, newPos), 300);
    };
    if (pos < newPos) setTimeout(step, 140);
    else triggerCase(current.id, newPos);
  }

  function triggerCase(playerId, caseNum) {
    const c = window.CASES[caseNum];
    if (!c) return;
    if (caseNum === 60) {
      setWinner(players.find(p => p.id === playerId));
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1400);
      setActiveCaseModal({ caseNum, playerId });
      return;
    }
    if (caseNum === 2) {
      setPlayers(ps => ps.map(p => p.id === playerId ? { ...p, jokers: p.jokers + 1 } : p));
    }
    // Shot splashes for dramatic cases
    if ([6, 21, 33, 45, 58].includes(caseNum)) {
      setShotSplash({ label: caseNum === 58 ? "DOUBLE SHOT !" : "SHOT !" });
    } else if (caseNum === 13 || caseNum === 59) {
      setShotSplash({ label: "CUL SEC !" });
    } else if (caseNum === 37) {
      setShotSplash({ label: "PINTE DU ROI" });
    }

    // Role tracking
    if (caseNum === 24 || caseNum === 42) {
      setActiveRoles(rs => replaceOrAdd(rs, "Roi des questions", playerId));
    } else if (caseNum === 25 || caseNum === 40) {
      setActiveRoles(rs => replaceOrAdd(rs, "Reine des p***s", playerId));
    } else if (caseNum === 26 || caseNum === 41) {
      setActiveRoles(rs => replaceOrAdd(rs, "Valet des pouces", playerId));
    }

    setActiveCaseModal({ caseNum, playerId });
  }

  function replaceOrAdd(rs, role, playerId) {
    const filtered = rs.filter(r => r.role !== role);
    return [...filtered, { role, playerId }];
  }

  function closeModalAndNext() {
    const meta = activeCaseModal;
    setActiveCaseModal(null);
    if (!meta) { nextTurn(); return; }
    const { caseNum, playerId } = meta;

    // Give/take sip tracking
    const c = window.CASES[caseNum];
    if (c.cat === "drink") addSips(playerId, 3);
    if (caseNum === 8) addSips(playerId, 5);
    if (caseNum === 16) addSips(playerId, 6);
    if (caseNum === 31 || caseNum === 43) addSips(playerId, 5);

    // Sub-modals
    if (caseNum === 4) {
      setCupidonOpen({ playerId });
      return;
    }
    if ([7, 15, 30, 49].includes(caseNum)) {
      const others = players.filter(p => p.id !== playerId);
      setGiveModal({ playerId, total: 5, others });
      return;
    }

    // Chained effects
    if (caseNum === 3) {
      const p = getPlayer(playerId);
      const newPos = Math.min(60, (p?.position || 0) + 3);
      movePlayer(playerId, newPos);
      setTimeout(() => triggerCase(playerId, newPos), 500);
      return;
    }
    if (caseNum === 39) {
      movePlayer(playerId, 33);
      setTimeout(() => triggerCase(playerId, 33), 500);
      return;
    }
    if (caseNum === 50) {
      const p = getPlayer(playerId);
      const newPos = Math.max(1, (p?.position || 1) - 1);
      movePlayer(playerId, newPos);
      setTimeout(() => triggerCase(playerId, newPos), 500);
      return;
    }
    if (caseNum === 53) {
      const p = getPlayer(playerId);
      const newPos = Math.max(1, (p?.position || 1) - 3);
      movePlayer(playerId, newPos);
      setTimeout(() => triggerCase(playerId, newPos), 500);
      return;
    }
    if (caseNum === 56) {
      const p = getPlayer(playerId);
      const cur = p?.position || 1;
      const newPos = 1 + Math.floor(Math.random() * Math.max(1, cur - 1));
      movePlayer(playerId, newPos);
      setTimeout(() => triggerCase(playerId, newPos), 500);
      return;
    }
    if (caseNum === 57) {
      const others = players.filter(p => p.id !== playerId);
      const victim = others[Math.floor(Math.random() * others.length)];
      if (victim) {
        let target = 1 + Math.floor(Math.random() * 59);
        if (target === 57) target = 58;
        movePlayer(victim.id, target);
        showToast(`${victim.name} téléporté(e) case ${target} !`);
      }
      nextTurn();
      return;
    }
    if (caseNum === 60) return;
    nextTurn();
  }

  function onCupidChoose(partnerId) {
    const pid = cupidonOpen.playerId;
    setCupidLinks(l => [...l, { a: pid, b: partnerId }]);
    showToast(`💘 Lien scellé !`);
    setCupidonOpen(null);
    nextTurn();
  }

  function onGiveDone(dist) {
    Object.entries(dist).forEach(([pid, n]) => addSips(pid, n));
    setGiveModal(null);
    nextTurn();
  }

  function getPlayer(id) { return players.find(p => p.id === id); }

  function nextTurn() {
    if (winner) return;
    setTurnIdx(idx => {
      const next = (idx + 1) % players.length;
      if (tweaks.turnIntro) setShowTurnIntro(true);
      return next;
    });
    setDice(null);
  }

  useEffect(() => {
    if (screen !== "game") return;
    if (winner || activeCaseModal || rolling || shotSplash || showTurnIntro || cupidonOpen || giveModal || pauseOpen) return;
    const cur = players[turnIdx];
    if (!cur || !cur.isBot) return;
    const id = setTimeout(() => rollDice(), 900);
    return () => clearTimeout(id);
  }, [screen, turnIdx, activeCaseModal, rolling, winner, shotSplash, showTurnIntro, cupidonOpen, giveModal, pauseOpen]);

  const currentPlayer = players[turnIdx];
  const currentChar = currentPlayer && window.CHARACTERS.find(c => c.id === currentPlayer.characterId);

  // Transition to end screen
  useEffect(() => {
    if (winner && !activeCaseModal) {
      const id = setTimeout(() => setScreen("end"), 800);
      return () => clearTimeout(id);
    }
  }, [winner, activeCaseModal]);

  return (
    <div className="app">
      <div className="bg-grid" />
      <div className="bg-blobs" />

      {screen === "home" && <HomeScreen onCreate={createRoom} onJoin={joinRoom} />}
      {screen === "hostSetup" && <HostSetupScreen onConfirm={onHostSetupConfirm} onBack={() => setScreen("home")} />}
      {screen === "pickChar" && (
        <CharacterPickScreen me={me} players={players}
          onConfirm={onConfirmChar} onBack={() => setScreen(roomCode ? "lobby" : "home")} />
      )}
      {screen === "lobby" && (
        <LobbyScreen roomCode={roomCode} players={players} me={me}
          onLeave={() => setScreen("home")}
          onStart={startGame}
          onEditMe={() => setScreen("pickChar")} />
      )}
      {screen === "rules" && <RulesScreen onDone={rulesDone} />}
      {screen === "end" && (
        <EndStatsScreen winner={winner} players={players} history={history}
          onReplay={() => { setScreen("lobby"); setPlayers(ps => ps.map(p => ({ ...p, position: 0, jokers: 0 }))); setWinner(null); setActiveRoles([]); setCupidLinks([]); }}
          onHome={() => { setScreen("home"); setPlayers([]); setRoomCode(null); setWinner(null); }} />
      )}

      {screen === "game" && (
        <div className="game-stage">
          <Board
            players={players}
            currentPlayerId={currentPlayer?.id}
            onCellClick={(n) => setInspectCase(n)}
            highlightCell={currentPlayer?.position}
          />
          <div className="side">
            {activeRoles.length > 0 && <ActiveRolesBar roles={activeRoles} players={players} />}

            <div className="panel">
              <div className="panel-title" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tour en cours</span>
                <button onClick={() => setPauseOpen(true)} style={{ fontSize: 16, opacity: 0.6 }}>⏸</button>
              </div>
              <div className="current-player">
                <Avatar character={currentChar} size={64} withGlow />
                <div>
                  <div className="who">{currentPlayer?.name}</div>
                  <div className="what">{currentChar?.family} • Case {currentPlayer?.position}</div>
                </div>
              </div>
            </div>

            <div className="panel" style={{ padding: 0 }}>
              <Dice value={dice} rolling={rolling} onRoll={rollDice}
                disabled={currentPlayer?.isBot || !!activeCaseModal || !!winner}
                cta={currentPlayer?.isBot ? `${currentPlayer.name} réfléchit…` : `Lancer le dé`} />
            </div>

            <div className="panel">
              <div className="panel-title">Joueurs ({players.length})</div>
              <div className="mini-players">
                {players.map((p, i) => {
                  const ch = window.CHARACTERS.find(c => c.id === p.characterId);
                  return (
                    <div key={p.id} className={"mini-player" + (i === turnIdx ? " is-turn" : "")}>
                      <Avatar character={ch} size={32} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.name}{p.id === me.id && <span className="mono muted" style={{ marginLeft: 4 }}>(toi)</span>}</div>
                        <div className="mono muted" style={{ fontSize: 10 }}>{ch?.family} • {(history.sips[p.id] || 0)} 🍺</div>
                      </div>
                      {p.jokers > 0 && <span className="joker-badge">🃏×{p.jokers}</span>}
                      <div className="pos">#{p.position}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {cupidLinks.length > 0 && (
              <div className="panel">
                <div className="panel-title">Liens Cupidon 💘</div>
                <div className="col" style={{ gap: 4, fontSize: 12 }}>
                  {cupidLinks.map((l, i) => {
                    const a = getPlayer(l.a), b = getPlayer(l.b);
                    return <div key={i}>{a?.name} ↔ {b?.name}</div>;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showTurnIntro && currentPlayer && screen === "game" && (
        <TurnIntro player={currentPlayer} character={currentChar} onGo={() => setShowTurnIntro(false)} />
      )}

      {shotSplash && <ShotSplash label={shotSplash.label} onDone={() => setShotSplash(null)} />}

      {cupidonOpen && (
        <CupidonModal me={getPlayer(cupidonOpen.playerId)}
          others={players.filter(p => p.id !== cupidonOpen.playerId)}
          onChoose={onCupidChoose}
          onCancel={() => { setCupidonOpen(null); nextTurn(); }} />
      )}

      {giveModal && (
        <GiveSipsModal total={giveModal.total} others={giveModal.others} onDone={onGiveDone} />
      )}

      {pauseOpen && (
        <PauseMenu onResume={() => setPauseOpen(false)}
          onHome={() => { setPauseOpen(false); setScreen("home"); setPlayers([]); }}
          onRules={() => { setPauseOpen(false); setScreen("rules"); }} />
      )}

      {activeCaseModal && (
        <CaseModal caseData={window.CASES[activeCaseModal.caseNum]}
          player={getPlayer(activeCaseModal.playerId)}
          onClose={closeModalAndNext} isWin={activeCaseModal.caseNum === 60} />
      )}

      {inspectCase != null && !activeCaseModal && (
        <CaseModal caseData={window.CASES[inspectCase]} onClose={() => setInspectCase(null)} inspectOnly />
      )}

      {toast && <Toast key={toast.id} onDone={() => setToast(null)}>{toast.text}</Toast>}
      {confetti && <Confetti active />}

      {editMode && (
        <div className="tweaks">
          <div className="panel-title" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Tweaks</span>
            <button className="mono" style={{ fontSize: 10 }} onClick={() => setEditMode(false)}>×</button>
          </div>
          <div className="tweak-row">
            <label>Palette</label>
            <div className="swatches">
              {Object.keys(PALETTES).map(k => {
                const p = PALETTES[k];
                return (
                  <div key={k} className={"swatch" + (tweaks.palette === k ? " active" : "")}
                    style={{ background: `linear-gradient(135deg, ${p["--neon"]}, ${p["--neon-3"]})` }}
                    onClick={() => setTweakKey("palette", k)} title={k} />
                );
              })}
            </div>
          </div>
          <div className="tweak-row">
            <label>Intro de tour</label>
            <input type="checkbox" checked={!!tweaks.turnIntro}
              onChange={(e) => setTweakKey("turnIntro", e.target.checked)} />
          </div>
          <div className="tweak-row">
            <label>Reset</label>
            <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }}
              onClick={() => { setScreen("home"); setPlayers([]); setWinner(null); setDice(null); setTurnIdx(0); }}>
              ⟲ Accueil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CaseModal({ caseData, player, onClose, isWin, inspectOnly }) {
  if (!caseData) return null;
  const c = caseData;
  const character = player && window.CHARACTERS.find(x => x.id === player.characterId);
  return (
    <div className="backdrop" onClick={inspectOnly ? onClose : undefined}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{
          background: `linear-gradient(180deg, var(--cat-${c.cat === 'start' ? 'water' : c.cat}, rgba(255,255,255,0.1)) 0%, transparent 100%)`,
        }}>
          <div className="icon-splash">{c.icon}</div>
          <div className="modal-cat">{categoryLabel(c.cat)}</div>
          <div className="modal-num">{c.n === 0 ? "Départ" : c.n === 60 ? "Arrivée" : `Case ${c.n}`}</div>
          <div className="modal-title">{c.title}</div>
        </div>
        <div className="modal-body">
          {!inspectOnly && player && (
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Avatar character={character} size={36} />
              <div className="mono">{player.name} s'y colle</div>
            </div>
          )}
          <div>{c.desc}</div>
          {isWin && (
            <div style={{
              marginTop: 16, padding: 14, borderRadius: 12,
              background: "linear-gradient(90deg, var(--neon-4), var(--neon))",
              color: "#fff", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22
            }}>🏆 {player?.name} a gagné GlouGlou!</div>
          )}
        </div>
        <div className="modal-actions">
          {inspectOnly ? (
            <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>
              {isWin ? "Célébrer 🎉" : "C'est bon, au suivant"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function categoryLabel(cat) {
  return ({
    drink: "BOIRE", give: "DONNER / PRENDRE", role: "RÔLE", action: "ACTION",
    water: "RÉPIT", special: "SPÉCIAL", party: "TOURNÉE", target: "CIBLÉ",
    start: "DÉPART", finish: "ARRIVÉE",
  })[cat] || cat.toUpperCase();
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
