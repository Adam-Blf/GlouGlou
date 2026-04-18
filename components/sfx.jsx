// GlouGlou! - Effets sonores synthétisés (zéro asset) + vibrations

let audioCtx = null;
function ctx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return null; }
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

function tone(freq, duration, type = "sine", gain = 0.2, delay = 0) {
  const c = ctx(); if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.frequency.value = freq;
  osc.type = type;
  osc.connect(g); g.connect(c.destination);
  const now = c.currentTime + delay;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function noiseBurst(duration, gain = 0.15, delay = 0) {
  const c = ctx(); if (!c) return;
  const len = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(g); g.connect(c.destination);
  src.start(c.currentTime + delay);
}

function vibrate(pattern) {
  try { navigator.vibrate && navigator.vibrate(pattern); } catch (_) {}
}

let muted = false;
function isMuted() { return muted; }
function setMuted(v) { muted = !!v; try { localStorage.setItem("glouglou-muted", muted ? "1" : "0"); } catch (_) {} }
try { muted = localStorage.getItem("glouglou-muted") === "1"; } catch (_) {}

const SFX = {
  isMuted, setMuted,
  unlock() { ctx(); }, // call on first user gesture
  diceRolling() {
    if (muted) { vibrate([20, 30, 20, 30, 20]); return; }
    for (let i = 0; i < 6; i++) noiseBurst(0.05, 0.09, i * 0.08);
    vibrate([20, 30, 20, 30, 20, 30]);
  },
  diceLand(n) {
    if (!muted) {
      tone(300 + n * 35, 0.08, "square", 0.18);
      tone(600 + n * 40, 0.15, "square", 0.14, 0.05);
    }
    vibrate(80);
  },
  shot() {
    if (!muted) {
      tone(120, 0.18, "sawtooth", 0.3);
      tone(80, 0.35, "sawtooth", 0.22, 0.15);
      noiseBurst(0.2, 0.18, 0.02);
    }
    vibrate([120, 60, 200]);
  },
  caseDing() {
    if (muted) return;
    tone(880, 0.1, "triangle", 0.16);
    tone(1320, 0.18, "triangle", 0.12, 0.06);
  },
  turnIntro() {
    if (!muted) {
      tone(440, 0.1, "sine", 0.15);
      tone(660, 0.15, "sine", 0.15, 0.08);
    }
    vibrate(40);
  },
  win() {
    if (!muted) {
      [523, 659, 784, 880, 1047].forEach((f, i) => tone(f, 0.28, "triangle", 0.22, i * 0.11));
    }
    vibrate([200, 100, 200, 100, 400]);
  },
  join() {
    if (muted) return;
    tone(523, 0.08, "triangle", 0.12);
    tone(784, 0.1, "triangle", 0.12, 0.06);
  },
  error() {
    if (!muted) tone(220, 0.18, "sawtooth", 0.14);
    vibrate([60, 30, 60]);
  },
};

window.SFX = SFX;
