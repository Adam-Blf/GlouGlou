// GlouGlou! - Multijoueur pair-à-pair via PeerJS (broker public)

const { useState: useStateNet, useEffect: useEffectNet, useRef: useRefNet, useCallback: useCallbackNet } = React;

const PEER_PREFIX = "glouglou-room-v1-";

function peerIdFor(code) {
  const clean = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return PEER_PREFIX + clean;
}

// useMultiplayer
//   mode: "off" | "host" | "guest"
//   code: room code string
//   onStateReceived(state)        // guest only
//   onJoinRequested(peerId, me)   // host only
//   onActionReceived(peerId, act) // host only
//   onConnectionStatus(status)    // both
// Returns { status, error, broadcast(msg), sendToHost(msg), clearError }
function useMultiplayer({ mode, code, onStateReceived, onJoinRequested, onActionReceived, onConnectionStatus }) {
  const [status, setStatus] = useStateNet("idle");
  const [error, setError] = useStateNet(null);
  const peerRef = useRefNet(null);
  const connsRef = useRefNet(new Map());
  const hostConnRef = useRefNet(null);
  const cbRef = useRefNet({});
  cbRef.current = { onStateReceived, onJoinRequested, onActionReceived, onConnectionStatus };

  useEffectNet(() => {
    if (mode === "off" || !code) {
      setStatus("idle");
      return;
    }
    if (!window.Peer) {
      setError("PeerJS non chargé");
      setStatus("error");
      return;
    }

    setStatus("connecting");
    setError(null);

    let destroyed = false;

    if (mode === "host") {
      const peer = new window.Peer(peerIdFor(code), { debug: 1 });
      peerRef.current = peer;

      peer.on("open", () => { if (!destroyed) { setStatus("ready"); cbRef.current.onConnectionStatus?.("ready"); } });
      peer.on("error", (e) => {
        if (destroyed) return;
        const type = e && e.type;
        if (type === "unavailable-id") setError("Ce code est déjà pris · choisis-en un autre");
        else if (type === "network") setError("Broker indisponible · retente dans un instant");
        else setError(type || String(e));
        setStatus("error");
      });
      peer.on("connection", (conn) => {
        if (destroyed) return;
        connsRef.current.set(conn.peer, conn);
        conn.on("open", () => {
          try { conn.send({ type: "welcome", hostId: peer.id }); } catch (_) {}
        });
        conn.on("data", (msg) => {
          if (!msg || typeof msg !== "object") return;
          if (msg.type === "join") cbRef.current.onJoinRequested?.(conn.peer, msg.me);
          else if (msg.type === "action") cbRef.current.onActionReceived?.(conn.peer, msg.action);
        });
        conn.on("close", () => connsRef.current.delete(conn.peer));
        conn.on("error", () => connsRef.current.delete(conn.peer));
      });
    } else if (mode === "guest") {
      const peer = new window.Peer(undefined, { debug: 1 });
      peerRef.current = peer;

      peer.on("open", () => {
        if (destroyed) return;
        const conn = peer.connect(peerIdFor(code), { reliable: true });
        hostConnRef.current = conn;
        conn.on("open", () => { if (!destroyed) { setStatus("ready"); cbRef.current.onConnectionStatus?.("ready"); } });
        conn.on("data", (msg) => {
          if (!msg || typeof msg !== "object") return;
          if (msg.type === "state") cbRef.current.onStateReceived?.(msg.payload);
          else if (msg.type === "welcome") { /* ack */ }
          else if (msg.type === "toast") window.__glouglouToast && window.__glouglouToast(msg.text);
        });
        conn.on("close", () => {
          if (destroyed) return;
          setStatus("error");
          setError("Connexion à l'hôte perdue");
        });
        conn.on("error", (e) => {
          if (destroyed) return;
          setError(String(e?.type || e));
          setStatus("error");
        });
      });
      peer.on("error", (e) => {
        if (destroyed) return;
        const type = e && e.type;
        if (type === "peer-unavailable") setError("Partie introuvable · vérifie le code");
        else if (type === "network") setError("Broker indisponible · réessaie");
        else setError(type || String(e));
        setStatus("error");
      });
    }

    return () => {
      destroyed = true;
      try { peerRef.current?.destroy(); } catch (_) {}
      peerRef.current = null;
      connsRef.current.clear();
      hostConnRef.current = null;
      setStatus("idle");
    };
  }, [mode, code]);

  const broadcast = useCallbackNet((msg) => {
    connsRef.current.forEach((conn) => {
      try { if (conn.open) conn.send(msg); } catch (_) {}
    });
  }, []);

  const sendToHost = useCallbackNet((msg) => {
    try { if (hostConnRef.current?.open) hostConnRef.current.send(msg); } catch (_) {}
  }, []);

  const clearError = useCallbackNet(() => setError(null), []);

  return { status, error, broadcast, sendToHost, clearError };
}

Object.assign(window, { useMultiplayer, peerIdFor });
