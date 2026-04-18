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
// Returns { status, error, broadcast(msg), sendToHost(msg), clearError, retry }
function useMultiplayer({ mode, code, onStateReceived, onJoinRequested, onActionReceived, onConnectionStatus }) {
  const [status, setStatus] = useStateNet("idle");
  const [error, setError] = useStateNet(null);
  const [retryKey, setRetryKey] = useStateNet(0);
  const peerRef = useRefNet(null);
  const connsRef = useRefNet(new Map());
  const hostConnRef = useRefNet(null);
  const retryCountRef = useRefNet(0);
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
      const peer = new window.Peer(peerIdFor(code), {
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ]
        }
      });
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
      const peer = new window.Peer(undefined, {
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ]
        }
      });
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
          setStatus("reconnecting");
          setError("Connexion perdue · retente…");
          // Auto-retry with exponential backoff, up to 8 attempts
          if (retryCountRef.current < 8) {
            retryCountRef.current += 1;
            const delay = Math.min(8000, 600 * Math.pow(1.6, retryCountRef.current));
            setTimeout(() => { if (!destroyed) setRetryKey((k) => k + 1); }, delay);
          } else {
            setStatus("error");
            setError("Reconnexion impossible · l'hôte a quitté ?");
          }
        });
        conn.on("error", () => {});
      });
      peer.on("error", (e) => {
        if (destroyed) return;
        const type = e && e.type;
        if (type === "peer-unavailable") {
          // Host not (yet) online. For reconnect, retry silently up to 8x.
          if (retryCountRef.current < 8) {
            retryCountRef.current += 1;
            setStatus("reconnecting");
            setError("Hôte introuvable · retente…");
            const delay = Math.min(8000, 600 * Math.pow(1.6, retryCountRef.current));
            setTimeout(() => { if (!destroyed) setRetryKey((k) => k + 1); }, delay);
          } else {
            setError("Partie introuvable · vérifie le code");
            setStatus("error");
          }
          return;
        }
        if (type === "network") setError("Broker indisponible · réessaie");
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
    };
  }, [mode, code, retryKey]);

  // Reset retry counter when mode/code change (fresh session)
  useEffectNet(() => { retryCountRef.current = 0; }, [mode, code]);

  // Successful connect clears retry counter
  useEffectNet(() => { if (status === "ready") retryCountRef.current = 0; }, [status]);

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
