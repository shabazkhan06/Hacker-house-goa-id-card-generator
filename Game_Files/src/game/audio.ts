// Tiny 8-bit style SFX engine using WebAudio (no assets).
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  getCtx();
}

function blip(
  type: OscillatorType,
  from: number,
  to: number,
  dur: number,
  gain: number,
  delay = 0,
) {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur: number, gain: number, hp: number, delay = 0) {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime + delay;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  // quantized (crunchy / lo-fi) noise
  let hold = 0;
  for (let i = 0; i < len; i++) {
    if (i % 3 === 0) hold = Math.round((Math.random() * 2 - 1) * 4) / 4;
    data[i] = hold * (1 - i / len);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t);
}

export function sfxFire() {
  blip("square", 880, 220, 0.14, 0.09);
  noise(0.12, 0.05, 1400);
}

export function sfxBreak() {
  blip("square", 320, 60, 0.22, 0.1);
  noise(0.26, 0.11, 700);
  blip("triangle", 180, 40, 0.3, 0.07, 0.03);
}

export function sfxGolden() {
  const notes = [523, 659, 784, 1046, 1318];
  notes.forEach((n, i) => blip("square", n, n, 0.16, 0.08, i * 0.09));
}

export function sfxWin() {
  const notes = [392, 523, 659, 784];
  notes.forEach((n, i) => blip("triangle", n, n, 0.22, 0.09, i * 0.13));
}