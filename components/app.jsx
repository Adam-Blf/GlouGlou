// GlouGlou! - App avec multijoueur pair-à-pair (PeerJS)

const { useState, useEffect, useRef, useMemo } = React;

function genRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function uid() { return Math.random().toString(36).slice(2, 9); }

const TWEAK_DEFAULTS = { palette: "neon", boardSize: 1, turnIntro: true };
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

function replaceOrAdd(rs, role, playerId) {
  return [...rs.filter((r) => r.role !== role), { role, playerId }];
}
function categoryLabel(cat) {
  return ({
    drink: "BOIRE", give: "DONNER / PRENDRE", role: "RÔLE", action: "ACTION",
    water: "RÉPIT", special: "SPÉCIAL", party: "TOURNÉE", target: "CIBLÉ",
    start: "DÉPART", finish: "ARRIVÉE",
  })[cat] || cat.toUpperCase();
}

// Compute auto-targeted players for a given case (targets who has to drink)
function computeTargets(caseNum, players, currentPlayerId) {
  const cur = players.find((p) => p.id === currentPlayerId);
  const others = players.filter((p) => p.id !== currentPlayerId);
  switch (caseNum) {
    case 5:  return { label: "Tout le monde boit 2 🍻",       list: players };
    case 23: return { label: "Tout le monde prend 2 🍻",      list: players };
    case 52: return { label: "Eau pour tous 💧",              list: players };
    case 19: return { label: "Les hommes 🍌 boivent 2",        list: players.filter((p) => p.gender === "homme") };
    case 44: return { label: "Les hommes 🍌 boivent 3",        list: players.filter((p) => p.gender === "homme") };
    case 29: return { label: "Les femmes 🍑 boivent 2",        list: players.filter((p) => p.gender === "femme") };
    case 46: return { label: "Les femmes 🍑 boivent 3",        list: players.filter((p) => p.gender === "femme") };
    case 17:
    case 35: return { label: "Les joueurs derrière boivent 2 ⬇️", list: cur ? others.filter((p) => p.position < cur.position) : [] };
    default: return null;
  }
}

// Session persistence for reconnect
const SESSION_KEY = "glouglou-session-v1";
function saveSession(data) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (_) {} }
function loadSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch (_) { return null; } }
function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (_) {} }

function App() {
  // Multiplayer mode
  const [mpMode, setMpMode] = useState("off");        // "off" | "host" | "guest"
  const [pendingJoinCode, setPendingJoinCode] = useState(null);

  // Local UI state (not replicated)
  const [screen, setScreen] = useState("home");       // home | hostSetup | pickChar | lobby | rules | game | end
  const [tweaks, setTweaks] = useTweaks();
  const [toast, setToast] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const [inspectCase, setInspectCase] = useState(null);
  const [pauseOpen, setPauseOpen] = useState(false);

  // Me (local identity) · try to restore stable id from previous session
  const [savedSession, setSavedSession] = useState(() => loadSession());
  const meIdRef = useRef(savedSession?.id || uid());
  const [me, setMe] = useState(() => ({
    id: meIdRef.current,
    name: savedSession?.name || "Toi",
    characterId: savedSession?.characterId || null,
    gender: savedSession?.gender || null,
    position: 0, jokers: 0, isHost: false,
  }));

  // Game state (replicated host → guests)
  const [roomCode, setRoomCode] = useState(null);
  const [gameConfig, setGameConfig] = useState({ intensity: "normale", variant: "classique", maxPlayers: 10 });
  const [players, setPlayers] = useState([]);
  const [turnIdx, setTurnIdx] = useState(0);
  const [dice, setDice] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [activeCaseModal, setActiveCaseModal] = useState(null);
  const [winner, setWinner] = useState(null);
  const [history, setHistory] = useState({ sips: {} });
  const [showTurnIntro, setShowTurnIntro] = useState(false);
  const [cupidonOpen, setCupidonOpen] = useState(null);
  const [giveModal, setGiveModal] = useState(null);
  const [shotSplash, setShotSplash] = useState(null);
  const [cupidLinks, setCupidLinks] = useState([]);
  const [activeRoles, setActiveRoles] = useState([]);

  // Toast bridge for net.jsx
  useEffect(() => {
    window.__glouglouToast = (text) => setToast({ text, id: Date.now() });
    return () => { window.__glouglouToast = null; };
  }, []);

  function showToast(text) { setToast({ text, id: Date.now() }); }

  // ---- Multiplayer wiring -----------------------------------------
  const mp = window.useMultiplayer({
    mode: mpMode, code: roomCode,
    onStateReceived: (s) => {
      // Guest overwrite. Use `phase` (lobby/rules/game/end) to avoid yanking guest out of pickChar.
      if (s.phase && s.phase !== screen) setScreen(s.phase);
      if (s.players !== undefined) setPlayers(s.players);
      if (s.turnIdx !== undefined) setTurnIdx(s.turnIdx);
      if (s.dice !== undefined) setDice(s.dice);
      if (s.rolling !== undefined) setRolling(s.rolling);
      if (s.activeCaseModal !== undefined) setActiveCaseModal(s.activeCaseModal);
      if (s.showTurnIntro !== undefined) setShowTurnIntro(s.showTurnIntro);
      if (s.cupidonOpen !== undefined) setCupidonOpen(s.cupidonOpen);
      if (s.giveModal !== undefined) setGiveModal(s.giveModal);
      if (s.shotSplash !== undefined) setShotSplash(s.shotSplash);
      if (s.cupidLinks !== undefined) setCupidLinks(s.cupidLinks);
      if (s.activeRoles !== undefined) setActiveRoles(s.activeRoles);
      if (s.history !== undefined) setHistory(s.history);
      if (s.winner !== undefined) setWinner(s.winner);
      if (s.gameConfig !== undefined) setGameConfig(s.gameConfig);
      // Update my own copy if host sent it back
      if (s.players) {
        const mine = s.players.find((p) => p.id === meIdRef.current);
        if (mine) setMe((prev) => ({ ...prev, ...mine }));
      }
    },
    onJoinRequested: (peerId, incomingMe) => {
      if (!incomingMe) return;
      setPlayers((prev) => {
        const exists = prev.find((p) => p.id === incomingMe.id);
        if (exists) {
          return prev.map((p) => p.id === incomingMe.id ? { ...p, name: incomingMe.name, characterId: incomingMe.characterId, gender: incomingMe.gender } : p);
        }
        window.SFX?.join();
        showToast(`${incomingMe.name || "Un joueur"} a rejoint`);
        return [...prev, { ...incomingMe, position: 0, jokers: 0, isHost: false }];
      });
    },
    onActionReceived: (peerId, action) => {
      if (!action || typeof action !== "object") return;
      handleAction(action);
    },
  });

  // Host state snapshot for broadcast. `phase` = lobby/rules/game/end (filtered from screen).
  const phase = ["lobby", "rules", "game", "end"].includes(screen) ? screen : null;
  const stateSnapshot = useMemo(() => ({
    phase, players, turnIdx, dice, rolling,
    activeCaseModal, showTurnIntro, cupidonOpen, giveModal, shotSplash,
    cupidLinks, activeRoles, history, winner, gameConfig,
  }), [phase, players, turnIdx, dice, rolling, activeCaseModal, showTurnIntro, cupidonOpen, giveModal, shotSplash, cupidLinks, activeRoles, history, winner, gameConfig]);

  useEffect(() => {
    if (mpMode !== "host") return;
    if (mp.status !== "ready") return;
    mp.broadcast({ type: "state", payload: stateSnapshot });
  }, [mpMode, mp.status, stateSnapshot]);

  // When connection opens as guest, send my identity
  useEffect(() => {
    if (mpMode !== "guest" || mp.status !== "ready") return;
    mp.sendToHost({ type: "join", me: { id: meIdRef.current, name: me.name, characterId: me.characterId, gender: me.gender } });
  }, [mpMode, mp.status, me.characterId, me.gender, me.name]);

  // Guest-visible MP error → bring back to home
  useEffect(() => {
    if (mp.error) showToast(mp.error);
  }, [mp.error]);

  // ---- Action router ---------------------------------------------
  // Actions are things that can change replicated state. In guest mode they get sent to host.
  // In host/local mode they execute directly.
  function dispatch(type, args) {
    if (mpMode === "guest") {
      mp.sendToHost({ type: "action", action: { type, args } });
      return;
    }
    handleAction({ type, args });
  }

  function handleAction({ type, args }) {
    switch (type) {
      case "updatePlayer": {
        const { id, patch } = args;
        setPlayers((ps) => ps.map((p) => p.id === id ? { ...p, ...patch } : p));
        break;
      }
      case "addPlayer": {
        setPlayers((ps) => ps.find((p) => p.id === args.player.id) ? ps : [...ps, args.player]);
        break;
      }
      case "removePlayer": {
        setPlayers((ps) => ps.filter((p) => p.id !== args.id));
        break;
      }
      case "setScreen":       setScreen(args.screen); break;
      case "setGameConfig":   setGameConfig(args.config); break;
      case "startGame":       startGame(); break;
      case "rollDice":        rollDice(args?.playerId); break;
      case "closeModal":      closeModalAndNext(); break;
      case "pickCupidon":     onCupidChoose(args.partnerId); break;
      case "giveSips":        onGiveDone(args.dist); break;
      default: break;
    }
  }

  // ---- Screen transitions / setup -------------------------------
  function createRoom() {
    window.SFX?.unlock();
    const code = genRoomCode();
    setRoomCode(code);
    setMpMode("host");
    setMe((m) => ({ ...m, isHost: true }));
    setPlayers([{ ...me, isHost: true }]);
    saveSession({ role: "host", code, id: meIdRef.current, name: me.name, characterId: me.characterId, gender: me.gender });
    setScreen("hostSetup");
  }

  function onHostSetupConfirm(cfg) {
    setGameConfig(cfg);
    setScreen("pickChar");
  }

  function joinRoom(code) {
    if (!code || code.length < 4) return;
    window.SFX?.unlock();
    const up = code.toUpperCase();
    setRoomCode(up);
    setMpMode("guest");
    setMe((m) => ({ ...m, isHost: false }));
    saveSession({ role: "guest", code: up, id: meIdRef.current, name: me.name, characterId: me.characterId, gender: me.gender });
    setScreen(me.characterId && me.gender ? "lobby" : "pickChar");
  }

  function resumeSession() {
    const s = loadSession();
    if (!s) return;
    window.SFX?.unlock();
    setRoomCode(s.code);
    setMpMode(s.role === "host" ? "host" : "guest");
    setMe((m) => ({ ...m, name: s.name || m.name, characterId: s.characterId || null, gender: s.gender || null, isHost: s.role === "host" }));
    if (s.role === "host") setPlayers([{ id: meIdRef.current, name: s.name, characterId: s.characterId, gender: s.gender, position: 0, jokers: 0, isHost: true }]);
    setSavedSession(null);
    setScreen(s.characterId && s.gender ? "lobby" : "pickChar");
  }

  function onConfirmChar({ characterId, gender, name }) {
    const updated = { ...me, characterId, gender, name };
    setMe(updated);
    saveSession({ role: mpMode === "host" ? "host" : "guest", code: roomCode, id: meIdRef.current, name, characterId, gender });
    if (mpMode === "guest") {
      mp.sendToHost({ type: "join", me: { id: meIdRef.current, name, characterId, gender } });
    } else {
      setPlayers((ps) => {
        const exists = ps.find((p) => p.id === meIdRef.current);
        if (exists) return ps.map((p) => p.id === meIdRef.current ? { ...p, name, characterId, gender } : p);
        return [...ps, { ...updated, position: 0, jokers: 0, isHost: true }];
      });
    }
    setScreen("lobby");
  }

  function leaveRoom(opts) {
    // Ask for confirmation if leaving mid-game (except when explicitly bypassed, e.g. after win)
    if (!opts?.confirmed && ["game", "rules"].includes(screen) && !winner) {
      if (!window.confirm("Quitter la partie en cours ? Ta progression sera perdue.")) return;
    }
    clearSession();
    setSavedSession(null);
    setMpMode("off");
    setPlayers([]);
    setRoomCode(null);
    setWinner(null);
    setDice(null);
    setTurnIdx(0);
    setActiveCaseModal(null);
    setShotSplash(null);
    setCupidonOpen(null);
    setGiveModal(null);
    setCupidLinks([]);
    setActiveRoles([]);
    setHistory({ sips: {} });
    setScreen("home");
  }

  // ---- Game lifecycle (host only; guests get state replicated) --
  function startGame() {
    setTurnIdx(0);
    setDice(null);
    setWinner(null);
    setCupidLinks([]);
    setActiveRoles([]);
    setHistory({ sips: {} });
    setPlayers((ps) => ps.map((p) => ({ ...p, position: 0, jokers: 0 })));
    setScreen("rules");
  }

  function rulesDone() {
    if (mpMode === "guest") { mp.sendToHost({ type: "action", action: { type: "setScreen", args: { screen: "game" } } }); return; }
    setScreen("game");
    if (tweaks.turnIntro) setShowTurnIntro(true);
  }

  function rollDice(playerIdArg) {
    if (rolling || activeCaseModal || winner || shotSplash || showTurnIntro || cupidonOpen || giveModal || pauseOpen) return;
    window.SFX?.diceRolling();
    setRolling(true);
    const target = 1 + Math.floor(Math.random() * 6);
    setTimeout(() => {
      window.SFX?.diceLand(target);
      setDice(target);
      setRolling(false);
      const pid = playerIdArg || players[turnIdx]?.id;
      if (pid) advancePlayer(pid, target);
    }, 900);
  }

  function movePlayer(playerId, newPos) {
    setPlayers((ps) => ps.map((p) => p.id === playerId ? { ...p, position: newPos } : p));
  }

  function advancePlayer(playerId, steps) {
    const current = players.find((p) => p.id === playerId);
    if (!current) return;
    const target = Math.min(60, current.position + steps);
    let pos = current.position;
    const step = () => {
      pos += 1;
      movePlayer(playerId, pos);
      if (pos < target) setTimeout(step, 140);
      else setTimeout(() => triggerCase(playerId, target), 300);
    };
    if (pos < target) setTimeout(step, 140);
    else triggerCase(playerId, target);
  }

  function triggerCase(playerId, caseNum) {
    const c = window.CASES[caseNum];
    if (!c) return;
    if (caseNum === 60) {
      window.SFX?.win();
      setWinner(players.find((p) => p.id === playerId));
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1400);
      setActiveCaseModal({ caseNum, playerId });
      return;
    }
    if (caseNum === 2) {
      setPlayers((ps) => ps.map((p) => p.id === playerId ? { ...p, jokers: p.jokers + 1 } : p));
    }
    if ([6, 21, 33, 45, 58].includes(caseNum)) {
      window.SFX?.shot();
      setShotSplash({ label: caseNum === 58 ? "DOUBLE SHOT !" : "SHOT !" });
    } else if (caseNum === 13 || caseNum === 59) {
      window.SFX?.shot();
      setShotSplash({ label: "CUL SEC !" });
    } else if (caseNum === 37) {
      window.SFX?.shot();
      setShotSplash({ label: "PINTE DU ROI" });
    } else {
      window.SFX?.caseDing();
    }
    if (caseNum === 24 || caseNum === 42) setActiveRoles((rs) => replaceOrAdd(rs, "Roi des questions", playerId));
    else if (caseNum === 25 || caseNum === 40) setActiveRoles((rs) => replaceOrAdd(rs, "Reine des p***s", playerId));
    else if (caseNum === 26 || caseNum === 41) setActiveRoles((rs) => replaceOrAdd(rs, "Valet des pouces", playerId));
    setActiveCaseModal({ caseNum, playerId });
  }

  function addSips(playerId, n) {
    setHistory((h) => ({ ...h, sips: { ...h.sips, [playerId]: (h.sips[playerId] || 0) + n } }));
  }

  function closeModalAndNext() {
    const meta = activeCaseModal;
    setActiveCaseModal(null);
    if (!meta) { nextTurn(); return; }
    const { caseNum, playerId } = meta;
    const c = window.CASES[caseNum];
    if (c.cat === "drink") addSips(playerId, 3);
    if (caseNum === 8) addSips(playerId, 5);
    if (caseNum === 16) addSips(playerId, 6);
    if (caseNum === 31 || caseNum === 43) addSips(playerId, 5);

    if (caseNum === 4) { setCupidonOpen({ playerId }); return; }
    if ([7, 15, 30, 49].includes(caseNum)) {
      const others = players.filter((p) => p.id !== playerId);
      setGiveModal({ playerId, total: 5, others });
      return;
    }
    if (caseNum === 3) {
      const p = players.find((x) => x.id === playerId);
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
      const p = players.find((x) => x.id === playerId);
      const newPos = Math.max(1, (p?.position || 1) - 1);
      movePlayer(playerId, newPos);
      setTimeout(() => triggerCase(playerId, newPos), 500);
      return;
    }
    if (caseNum === 53) {
      const p = players.find((x) => x.id === playerId);
      const newPos = Math.max(1, (p?.position || 1) - 3);
      movePlayer(playerId, newPos);
      setTimeout(() => triggerCase(playerId, newPos), 500);
      return;
    }
    if (caseNum === 56) {
      const p = players.find((x) => x.id === playerId);
      const cur = p?.position || 1;
      const newPos = 1 + Math.floor(Math.random() * Math.max(1, cur - 1));
      movePlayer(playerId, newPos);
      setTimeout(() => triggerCase(playerId, newPos), 500);
      return;
    }
    if (caseNum === 57) {
      const others = players.filter((p) => p.id !== playerId);
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
    const pid = cupidonOpen?.playerId;
    if (!pid) return;
    setCupidLinks((l) => [...l, { a: pid, b: partnerId }]);
    showToast("💘 Lien scellé !");
    setCupidonOpen(null);
    nextTurn();
  }

  function onGiveDone(dist) {
    Object.entries(dist).forEach(([pid, n]) => addSips(pid, n));
    setGiveModal(null);
    nextTurn();
  }

  function nextTurn() {
    if (winner) return;
    setTurnIdx((idx) => (idx + 1) % Math.max(1, players.length));
    setDice(null);
    if (tweaks.turnIntro) { window.SFX?.turnIntro(); setShowTurnIntro(true); }
  }

  // Transition to end screen (host)
  useEffect(() => {
    if (mpMode === "guest") return;
    if (winner && !activeCaseModal) {
      const id = setTimeout(() => setScreen("end"), 800);
      return () => clearTimeout(id);
    }
  }, [winner, activeCaseModal, mpMode]);

  // ---- Derived ---------------------------------------------------
  const currentPlayer = players[turnIdx];
  const currentChar = currentPlayer && window.CHARACTERS.find((c) => c.id === currentPlayer.characterId);
  const amCurrent = currentPlayer?.id === meIdRef.current;
  const canAct = mpMode !== "guest" ? true : amCurrent;

  // ---- Render ----------------------------------------------------
  return (
    <div className="app">
      <div className="bg-grid" />
      <div className="bg-blobs" />

      {screen === "home" && (
        <HomeScreen onCreate={createRoom} onJoin={joinRoom} onResume={resumeSession} savedSession={savedSession} />
      )}
      {screen === "hostSetup" && (
        <HostSetupScreen onConfirm={onHostSetupConfirm} onBack={() => { leaveRoom(); }} />
      )}
      {screen === "pickChar" && (
        <CharacterPickScreen me={me} players={players}
          onConfirm={onConfirmChar}
          onBack={() => setScreen(roomCode ? "lobby" : "home")} />
      )}
      {screen === "lobby" && (
        <LobbyScreen roomCode={roomCode} players={players} me={me}
          mpStatus={mp.status} mpMode={mpMode}
          onLeave={leaveRoom}
          onStart={() => { if (mpMode === "guest") mp.sendToHost({ type: "action", action: { type: "startGame" } }); else startGame(); }}
          onEditMe={() => setScreen("pickChar")} />
      )}
      {screen === "rules" && <RulesScreen onDone={rulesDone} />}
      {screen === "end" && (
        <EndStatsScreen winner={winner} players={players} history={history}
          onReplay={() => { setScreen("lobby"); setPlayers((ps) => ps.map((p) => ({ ...p, position: 0, jokers: 0 }))); setWinner(null); setActiveRoles([]); setCupidLinks([]); setHistory({ sips: {} }); }}
          onHome={() => leaveRoom({ confirmed: true })} />
      )}

      {screen === "game" && (
        <div className="game-stage">
          <Board
            players={players}
            currentPlayerId={currentPlayer?.id}
            onCellClick={(n) => setInspectCase(n)}
            highlightCell={currentPlayer?.position} />
          <div className="side">
            {activeRoles.length > 0 && <ActiveRolesBar roles={activeRoles} players={players} />}
            <div className="panel">
              <div className="panel-title" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tour en cours</span>
                <button onClick={() => setPauseOpen(true)} aria-label="Pause" title="Pause" style={{ fontSize: 16, opacity: 0.6, minWidth: 32, minHeight: 32 }}>⏸</button>
              </div>
              <div className="current-player">
                <Avatar character={currentChar} size={64} withGlow />
                <div>
                  <div className="who">{currentPlayer?.name}</div>
                  <div className="what">{currentChar?.family} · Case {currentPlayer?.position}</div>
                </div>
              </div>
            </div>

            <div className="panel" style={{ padding: 0 }}>
              <Dice value={dice} rolling={rolling}
                onRoll={() => { if (mpMode === "guest") mp.sendToHost({ type: "action", action: { type: "rollDice", args: { playerId: currentPlayer?.id } } }); else rollDice(); }}
                disabled={!canAct || !!activeCaseModal || !!winner}
                cta={!canAct ? `${currentPlayer?.name || "…"} joue…` : "Lancer le dé"} />
            </div>

            <div className="panel">
              <div className="panel-title">Joueurs ({players.length})</div>
              <div className="mini-players">
                {players.map((p, i) => {
                  const ch = window.CHARACTERS.find((c) => c.id === p.characterId);
                  return (
                    <div key={p.id} className={"mini-player" + (i === turnIdx ? " is-turn" : "")}>
                      <Avatar character={ch} size={32} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.name} {genderIcon(p.gender)}{p.id === meIdRef.current && <span className="mono muted" style={{ marginLeft: 4 }}>(toi)</span>}</div>
                        <div className="mono muted" style={{ fontSize: 10 }}>{ch?.family} · {(history.sips[p.id] || 0)} 🍺</div>
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
                    const a = players.find((p) => p.id === l.a);
                    const b = players.find((p) => p.id === l.b);
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

      {shotSplash && <ShotSplash label={shotSplash.label} onDone={() => { if (mpMode !== "guest") setShotSplash(null); }} />}

      {cupidonOpen && cupidonOpen.playerId === meIdRef.current && (
        <CupidonModal me={players.find((p) => p.id === cupidonOpen.playerId)}
          others={players.filter((p) => p.id !== cupidonOpen.playerId)}
          onChoose={(partnerId) => { if (mpMode === "guest") mp.sendToHost({ type: "action", action: { type: "pickCupidon", args: { partnerId } } }); else onCupidChoose(partnerId); }}
          onCancel={() => { if (mpMode === "guest") mp.sendToHost({ type: "action", action: { type: "pickCupidon", args: { partnerId: null } } }); else { setCupidonOpen(null); nextTurn(); } }} />
      )}

      {giveModal && giveModal.playerId === meIdRef.current && (
        <GiveSipsModal total={giveModal.total} others={giveModal.others}
          onDone={(dist) => { if (mpMode === "guest") mp.sendToHost({ type: "action", action: { type: "giveSips", args: { dist } } }); else onGiveDone(dist); }} />
      )}

      {pauseOpen && (
        <PauseMenu onResume={() => setPauseOpen(false)}
          onHome={() => { setPauseOpen(false); leaveRoom(); }}
          onRules={() => { setPauseOpen(false); setScreen("rules"); }} />
      )}

      {activeCaseModal && (
        <CaseModal caseData={window.CASES[activeCaseModal.caseNum]}
          player={players.find((p) => p.id === activeCaseModal.playerId)}
          allPlayers={players}
          targets={computeTargets(activeCaseModal.caseNum, players, activeCaseModal.playerId)}
          onClose={() => { if (mpMode === "guest" && activeCaseModal.playerId !== meIdRef.current) return; if (mpMode === "guest") mp.sendToHost({ type: "action", action: { type: "closeModal" } }); else closeModalAndNext(); }}
          isWin={activeCaseModal.caseNum === 60}
          readOnly={mpMode === "guest" && activeCaseModal.playerId !== meIdRef.current} />
      )}

      {inspectCase != null && !activeCaseModal && (
        <CaseModal caseData={window.CASES[inspectCase]} onClose={() => setInspectCase(null)} inspectOnly />
      )}

      {toast && <Toast key={toast.id} onDone={() => setToast(null)}>{toast.text}</Toast>}
      {confetti && <Confetti active />}

      {mp.status === "connecting" && screen !== "home" && (
        <div className="toast" style={{ top: "auto", bottom: 16, borderColor: "var(--neon-5)" }}>Connexion…</div>
      )}
    </div>
  );
}

function CaseModal({ caseData, player, allPlayers, targets, onClose, isWin, inspectOnly, readOnly }) {
  if (!caseData) return null;
  const c = caseData;
  const character = player && window.CHARACTERS.find((x) => x.id === player.characterId);
  return (
    <div className="backdrop" onClick={inspectOnly ? onClose : undefined}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{
          background: `linear-gradient(180deg, var(--cat-${c.cat === "start" ? "water" : c.cat}, rgba(255,255,255,0.1)) 0%, transparent 100%)`,
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
          {!inspectOnly && targets && (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid var(--line)" }}>
              <div className="mono muted" style={{ fontSize: 10, marginBottom: 8 }}>{targets.label}</div>
              {targets.list.length === 0 ? (
                <div className="mono muted">Personne ce coup-ci</div>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {targets.list.map((p) => {
                    const ch = window.CHARACTERS.find((x) => x.id === p.characterId);
                    return (
                      <div key={p.id} className="role-chip" style={{ background: "rgba(0,0,0,0.25)" }}>
                        <Avatar character={ch} size={24} />
                        <span style={{ fontWeight: 700, fontSize: 12 }}>{p.name} {genderIcon(p.gender)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {isWin && (
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12,
              background: "linear-gradient(90deg, var(--neon-4), var(--neon))",
              color: "#fff", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22 }}>
              🏆 {player?.name} a gagné GlouGlou!
            </div>
          )}
        </div>
        <div className="modal-actions">
          {inspectOnly ? (
            <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
          ) : readOnly ? (
            <div className="mono muted">En attente du joueur…</div>
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

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
