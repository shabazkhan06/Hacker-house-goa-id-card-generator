import { useCallback, useEffect, useRef, useState } from "react";
import { sfxBreak, sfxFire, sfxGolden, sfxWin, unlockAudio } from "@/game/audio";
import { ShareToXButton } from "../routes/ShareButton.tsx";

const W = 1024;
const H = 576;
const SEA_Y = Math.round(H * 0.65); // ocean occupies bottom 35%
const BOAT_W = 64;
const BOAT_H = 32;
const SHOT_SPEED = 12;
const BOAT_SPEED = 4.5;

type TypeDef = { id: string; name: string; color: string; dark: string; pattern: 0 | 1 | 2 | 3 };

const TYPES: TypeDef[] = [
  { id: "kokum", name: "KOKUM", color: "#ff3d9a", dark: "#6b0f3f", pattern: 0 },
  { id: "feni", name: "FENI", color: "#ffe14d", dark: "#7a6206", pattern: 1 },
  { id: "prawn", name: "PRAWN", color: "#33d17a", dark: "#12522f", pattern: 2 },
  { id: "chilli", name: "CHILLI", color: "#8fffb0", dark: "#1a5c2e", pattern: 3 },
];

const GOLD: TypeDef = { id: "gold", name: "GOLD", color: "#ffe14d", dark: "#1a5c2e", pattern: 2 };

type Buoy = {
  type: TypeDef;
  golden: boolean;
  x: number;
  baseY: number;
  vx: number;
  phase: number;
  w: number;
  h: number;
  alive: boolean;
};

type Shot = { x: number; y: number };
type Shard = { x: number; y: number; vx: number; vy: number; life: number; color: string };

type Status = "ready" | "playing" | "won" | "golden";

function spawnBuoy(type: TypeDef): Buoy {
  return {
    type,
    golden: false,
    x: 50 + Math.random() * (W - 100),
    baseY: 46 + Math.random() * (SEA_Y - 80),
    vx: (1 + Math.random() * 1.2) * (Math.random() < 0.5 ? 1 : -1),
    phase: Math.random() * Math.PI * 2,
    w: 30,
    h: 24,
    alive: true,
  };
}

const BUOYS_PER_TYPE = 3;

function makeBuoys(): Buoy[] {
  const list: Buoy[] = [];
  for (const t of TYPES) {
    for (let j = 0; j < BUOYS_PER_TYPE; j++) {
      list.push(spawnBuoy(t));
    }
  }

  list.push({
    type: GOLD,
    golden: true,
    x: W / 2,
    baseY: 24,
    vx: 2.4,
    phase: 0,
    w: 18,
    h: 16,
    alive: true,
  });
  return list;
}

/* ---------- pixel drawing helpers ---------- */

function px(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function lerpHex(a: string, b: string, t: number) {
  const ch = (s: string, i: number) => parseInt(s.slice(i, i + 2), 16) || 0;
  const r = Math.round(ch(a, 1) + (ch(b, 1) - ch(a, 1)) * t);
  const g = Math.round(ch(a, 3) + (ch(b, 3) - ch(a, 3)) * t);
  const bl = Math.round(ch(a, 5) + (ch(b, 5) - ch(a, 5)) * t);
  return `rgb(${r},${g},${bl})`;
}

const SKY_STOPS: Array<[number, string]> = [
  [0, "#12143a"],
  [0.3, "#7a1a6a"],
  [0.55, "#ff3d9a"],
  [0.78, "#ff8f5e"],
  [1, "#ffe14d"],
];

function skyColor(t: number) {
  for (let i = 1; i < SKY_STOPS.length; i++) {
    const cur = SKY_STOPS[i]!;
    const prev = SKY_STOPS[i - 1]!;
    if (t <= cur[0]) return lerpHex(prev[1], cur[1], (t - prev[0]) / (cur[0] - prev[0]));
  }
  return SKY_STOPS[SKY_STOPS.length - 1]![1];
}

function drawSky(c: CanvasRenderingContext2D) {
  const band = 5;
  for (let y = 0; y < SEA_Y; y += band) {
    px(c, 0, y, W, band, skyColor(y / SEA_Y));
  }
}

function drawSun(c: CanvasRenderingContext2D, t: number) {
  const cx = W / 2;
  const cy = SEA_Y - 26;
  const r = 46;
  for (let y = -r; y <= r; y += 2) {
    const dx = Math.sqrt(Math.max(0, r * r - y * y));
    const yy = cy + y;
    if (yy > SEA_Y) break;
    if (y > -6 && Math.floor((y + 100) / 2) % 3 === 0) continue;
    const grad = (y + r) / (2 * r);
    px(c, cx - dx, yy, dx * 2, 2, lerpHex("#ffe14d", "#ff3d9a", grad));
  }
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + t * 0.0006;
    px(c, cx + Math.cos(a) * (r + 8), cy + Math.sin(a) * (r + 8) * 0.7, 2, 2, "#ffe14d");
  }
}

const SHORE_DARK = "#123a20";
const SHORE_MID = "#1a5c2e";

const SAND_LIGHT = "#ffe9a8";
const SAND_MID = "#f0cd7a";
const SAND_DARK = "#c9a256";
const SAND_WET = "#b7d9a4";
const BEACH_H = 16;
const BEACH_TOP = SEA_Y - BEACH_H;

function drawBeach(c: CanvasRenderingContext2D, t: number) {
  for (let y = BEACH_TOP; y < SEA_Y; y++) {
    const k = (y - BEACH_TOP) / BEACH_H;
    px(c, 0, y, W, 1, k < 0.35 ? SAND_LIGHT : k < 0.7 ? SAND_MID : SAND_DARK);
  }
  for (let x = 0; x < W; x += 7) {
    const y = BEACH_TOP + 2 + ((x * 7) % (BEACH_H - 4));
    px(c, x + ((x / 7) % 3), y, 1, 1, SAND_DARK);
  }
  for (let x = 0; x < W; x += 2) {
    const w = Math.sin(x * 0.06 + t * 0.0022) * 2 + Math.sin(x * 0.021 - t * 0.0014) * 1.5;
    const y = SEA_Y - 3 + w;
    px(c, x, y, 2, 3, SAND_WET);
    px(c, x, y - 1, 2, 1, "#ffffff");
    if (Math.sin(x * 0.11 + t * 0.005) > 0.4) px(c, x, y - 2, 2, 1, "#d8ffe0");
  }
}

const TRUNK_LIGHT = "#c9932f";
const TRUNK_MID = "#a06d1f";
const TRUNK_DARK = "#6e4712";
const LEAF_LIGHT = "#5fe08a";
const LEAF_MID = "#33d17a";
const LEAF_DARK = "#1a8f4a";

function drawPalm(
  c: CanvasRenderingContext2D,
  x: number,
  base: number,
  h: number,
  lean: number,
  t: number,
  seed: number,
) {
  const P = 2;
  const sway = Math.sin(t * 0.0011 + seed) * 1.5;
  const steps = Math.max(6, Math.round(h / P));

  px(c, x - 5, base - 2, 12, 2, TRUNK_DARK);
  px(c, x - 3, base - 4, 8, 2, TRUNK_MID);

  let tx = x;
  for (let i = 0; i < steps; i++) {
    const k = i / steps;
    tx = x + lean * k * k * 8 + sway * k * k;
    const wdt = k < 0.5 ? 3 * P - P : 2 * P - 1;
    const y = base - 3 - i * P;
    px(c, tx, y, wdt, P, i % 2 === 0 ? TRUNK_MID : TRUNK_DARK);
    px(c, tx, y, 1, P, TRUNK_LIGHT);
  }
  const topX = tx + 1;
  const topY = base - 3 - steps * P;

  px(c, topX - 3, topY, 8, 6, TRUNK_MID);
  px(c, topX - 2, topY + 1, 3, 3, "#8a5a1e");
  px(c, topX + 2, topY + 2, 3, 3, "#8a5a1e");
  px(c, topX - 1, topY + 1, 1, 1, TRUNK_LIGHT);

  const dirs = [-1, -1, -1, 1, 1, 1];
  const lift = [-1.15, -0.55, 0.05, -1.15, -0.55, 0.05];
  for (let f = 0; f < 6; f++) {
    const dir = dirs[f]!;
    const up = lift[f]!;
    const len = 7 + (f % 3) * 2;
    const flutter = Math.sin(t * 0.0018 + seed + f) * 0.6;
    for (let i = 0; i < len; i++) {
      const k = i / len;
      const fx = topX + dir * (i * P) + (dir > 0 ? 2 : -2);
      const fy = topY + 2 + up * i * P * 0.62 + k * k * 10 + flutter * k;
      const spread = Math.round((1 - k) * 3) + 1;
      px(c, fx, fy, P, spread, up < -0.8 ? LEAF_MID : LEAF_DARK);
      px(c, fx, fy - 1, P, 1, LEAF_LIGHT);
      if (i % 2 === 0 && i > 1) px(c, fx, fy + spread, P, 1, LEAF_DARK);
    }
  }
  px(c, topX - 4, topY - 1, 10, 3, LEAF_MID);
  px(c, topX - 3, topY - 2, 8, 2, LEAF_LIGHT);
}

function drawHut(c: CanvasRenderingContext2D, x: number, base: number, w: number, t: number, seed: number) {
  const bodyH = 10;
  const roofH = 9;
  const y = base - bodyH;
  px(c, x, y, w, bodyH, SHORE_DARK);
  for (let i = 0; i < roofH; i++) {
    const rw = 2 + Math.round(((i + 1) / roofH) * (w + 6));
    px(c, x + Math.round((w - rw) / 2), y - roofH + i, rw, 1, i % 3 === 0 ? SHORE_MID : SHORE_DARK);
  }
  px(c, x - 3, y - 1, w + 6, 1, "#ffe14d");
  const on = (Math.floor(t / 500) + seed) % 5 !== 0;
  px(c, x + Math.floor(w / 2) - 2, y + 4, 4, 6, on ? "#ffe14d" : "#0d2a19");
  px(c, x + 1, y + 3, 2, 2, on ? "#8fffb0" : "#0d2a19");
}

function drawResort(c: CanvasRenderingContext2D, x: number, base: number, w: number, t: number, seed: number) {
  const lower = 16;
  const upper = 13;
  const y1 = base - lower;
  const y2 = y1 - upper;
  px(c, x, y1, w, lower, SHORE_DARK);
  px(c, x + 4, y2, w - 8, upper, SHORE_DARK);
  for (let i = 0; i < 5; i++) px(c, x - 2 + i, y2 - 5 + i, w + 4 - i * 2, 1, SHORE_MID);
  px(c, x - 2, y1 - 1, w + 4, 1, SHORE_MID);
  for (let i = 0; i < Math.floor(w / 5); i++) {
    const on = (Math.floor(t / 380) + i + seed) % 4 !== 0;
    px(c, x + 2 + i * 5, y1 - 3, 2, 2, on ? "#8fffb0" : "#0d2a19");
  }
  for (let wy = y1 + 4; wy < base - 3; wy += 7) {
    for (let wx = x + 3; wx < x + w - 4; wx += 7) {
      const on = (Math.floor(t / 460) + wx + wy + seed) % 5 !== 0;
      px(c, wx, wy, 3, 3, on ? "#ffe14d" : "#0d2a19");
    }
  }
  for (let wx = x + 7; wx < x + w - 8; wx += 7) {
    const on = (Math.floor(t / 520) + wx + seed) % 4 !== 0;
    px(c, wx, y2 + 4, 3, 3, on ? "#8fffb0" : "#0d2a19");
  }
  const blink = Math.sin(t * 0.005 + seed) > -0.5;
  px(c, x + Math.floor(w / 2) - 1, y2 - 10, 2, 5, SHORE_MID);
  px(c, x + Math.floor(w / 2) - 6, y2 - 13, 12, 3, blink ? "#ff3d9a" : "#6b0f3f");
}

function drawSkyline(c: CanvasRenderingContext2D, t: number) {
  const base = BEACH_TOP + 3;
  px(c, 0, base - 3, W, 3, SHORE_DARK);

  drawResort(c, 8, base, 40, t, 1);
  drawHut(c, 56, base, 16, t, 2);
  drawPalm(c, 78, base, 40, -1, t, 0.4);
  drawHut(c, 92, base, 14, t, 3);
  drawPalm(c, 110, base, 52, 1, t, 1.2);
  drawPalm(c, 128, base, 34, -1, t, 2.1);

  drawPalm(c, 344, base, 36, -1, t, 3.3);
  drawHut(c, 358, base, 15, t, 4);
  drawPalm(c, 380, base, 50, 1, t, 0.9);
  drawHut(c, 396, base, 13, t, 5);
  drawResort(c, 416, base, 44, t, 6);
  drawPalm(c, 466, base, 42, -1, t, 1.7);
}

function waveY(x: number, t: number, row: number) {
  return (
    Math.sin(x * 0.045 + t * 0.0022 + row) * 3 +
    Math.sin(x * 0.017 - t * 0.0013 + row * 1.7) * 2
  );
}

function drawOcean(c: CanvasRenderingContext2D, t: number) {
  const band = 3;
  for (let y = SEA_Y; y < H; y += band) {
    const k = (y - SEA_Y) / (H - SEA_Y);
    px(c, 0, y, W, band, lerpHex("#33d17a", "#062416", Math.pow(k, 0.75)));
  }
  for (let row = 0; row < 9; row++) {
    const baseY = SEA_Y + 3 + row * 10;
    const k = row / 9;
    const color = lerpHex("#d8ffe0", "#1a5c2e", k);
    for (let x = 0; x < W; x += 4) {
      const yy = baseY + waveY(x, t, row);
      const seg = Math.sin(x * 0.09 + t * 0.004 + row * 2) > 0.15 ? 4 : 2;
      px(c, x, yy, seg, 1, color);
    }
  }
  for (let y = SEA_Y; y < H; y += 4) {
    const wob = Math.sin(y * 0.4 + t * 0.005) * 8;
    px(c, W / 2 - 10 + wob, y, 20, 2, "rgba(255,225,77,0.20)");
  }
}

function drawBoat(c: CanvasRenderingContext2D, bx: number, by: number, t: number) {
  const x = Math.round(bx - BOAT_W / 2);
  const y = Math.round(by - BOAT_H);
  const sway = Math.sin(t * 0.003) * 1;
  px(c, x + 6, y + 24, 52, 6, "#123a20");
  px(c, x + 2, y + 22, 60, 2, "#1a5c2e");
  px(c, x + 10, y + 20, 44, 2, "#0d2a19");
  px(c, x + 4, y + 22, 56, 1, "#ffe14d");
  px(c, x, y + 27, 6, 2, "#ffe14d");
  px(c, x + 58, y + 27, 6, 2, "#ffe14d");
  px(c, x + 30, y - 2, 2, 24, "#ffffff");
  for (let i = 0; i < 18; i++) {
    const wdt = Math.round((18 - i) * 1.15) + Math.round(sway);
    px(c, x + 32, y + i + 2, Math.max(2, wdt), 1, i % 5 === 0 ? "#d8ffe0" : "#ffffff");
  }
  px(c, x + 31, y, 1, 22, "#33d17a");
  for (let i = 0; i < 18; i++) {
    const wdt = Math.round((18 - i) * 1.15) + Math.round(sway);
    px(c, x + 32 + Math.max(2, wdt), y + i + 2, 1, 1, "#33d17a");
  }
  px(c, x + 32, y + 20, 22, 1, "#33d17a");
  for (let i = 0; i < 14; i++) px(c, x + 30 - Math.round((14 - i) * 0.8), y + i + 6, Math.round((14 - i) * 0.8), 1, "#f2fff6");
  px(c, x + 32, y - 3, 6, 2, "#ff3d9a");
  px(c, x + 29, y - 4, 4, 3, "#ffe14d");
}

function drawBuoy(c: CanvasRenderingContext2D, b: Buoy, y: number, t: number) {
  const x = Math.round(b.x - b.w / 2);
  const yy = Math.round(y - b.h / 2);
  const { color, dark } = b.type;
  c.fillStyle = color;
  c.globalAlpha = 0.16 + Math.sin(t * 0.006 + b.phase) * 0.06;
  c.fillRect(x - 3, yy - 3, b.w + 6, b.h + 6);
  c.globalAlpha = 1;
  px(c, x, yy, b.w, b.h, "#0d2a19");
  px(c, x + 2, yy + 2, b.w - 4, b.h - 4, dark);
  px(c, x, yy, b.w, 1, color);
  px(c, x, yy + b.h - 1, b.w, 1, color);
  px(c, x, yy, 1, b.h, color);
  px(c, x + b.w - 1, yy, 1, b.h, color);
  px(c, x + 2, yy + b.h - 7, b.w - 4, 5, color);
  const p = b.type.pattern;
  for (let i = 0; i < 4; i++) {
    if (p === 0) px(c, x + 4 + i * 6, yy + 5, 3, 3, color);
    if (p === 1) px(c, x + 4 + i * 6, yy + 4 + (i % 2) * 4, 4, 2, color);
    if (p === 2) px(c, x + 5 + i * 6, yy + 4, 2, 8, color);
    if (p === 3) px(c, x + 4 + i * 6, yy + 5 + Math.abs(1 - (i % 3)) * 3, 3, 3, color);
  }
  px(c, x + 4, yy + b.h, b.w - 8, 2, "#0d2a19");
  px(c, x + 6, yy + b.h + 1, b.w - 12, 1, color);
  if (b.golden) {
    const s = Math.sin(t * 0.012) > 0 ? 1 : 0;
    px(c, x - 4, yy - 4, 2, 2, s ? "#ff3d9a" : color);
    px(c, x + b.w + 2, yy + b.h + 2, 2, 2, s ? color : "#ff3d9a");
  }
}

function drawShot(c: CanvasRenderingContext2D, s: Shot, t: number) {
  const x = Math.round(s.x - 8);
  const y = Math.round(s.y - 8);
  c.globalAlpha = 0.25;
  px(c, x - 2, y - 2, 20, 20, "#33d17a");
  c.globalAlpha = 1;
  const f = Math.floor(t / 60) % 2;
  px(c, x + 4, y, 8, 16, "#d8ffe0");
  px(c, x, y + 4, 16, 8, "#d8ffe0");
  px(c, x + 5, y + 1, 6, 14, "#8fffb0");
  px(c, x + 1, y + 5, 14, 6, "#8fffb0");
  px(c, x + 6, y + 6, 4, 4, "#ffffff");
  px(c, x + (f ? 2 : 12), y + (f ? 12 : 2), 2, 2, "#ffffff");
}

export default function CyberGoaShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("ready");
  const [destroyed, setDestroyed] = useState<Record<string, number>>({});

  const state = useRef({
    boatX: W / 2,
    keys: new Set<string>(),
    shots: [] as Shot[],
    shards: [] as Shard[],
    buoys: makeBuoys(),
    cooldown: 0,
    status: "ready" as Status,
    drag: null as number | null,
    flash: 0,
    destroyedTypes: new Set<string>(),
  });

  const reset = useCallback(() => {
    const s = state.current;
    s.boatX = W / 2;
    s.shots = [];
    s.shards = [];
    s.buoys = makeBuoys();
    s.cooldown = 0;
    s.flash = 0;
    s.status = "playing";
    s.destroyedTypes = new Set();
    setDestroyed({});
    setStatus("playing");
    unlockAudio();
  }, []);

  const fire = useCallback(() => {
    const s = state.current;
    if (s.status !== "playing" || s.cooldown > 0) return;
    s.shots.push({ x: s.boatX + 1, y: SEA_Y + 4 - BOAT_H - 6 });
    s.cooldown = 12;
    sfxFire();
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ([" ", "arrowleft", "arrowright", "a", "d"].includes(k)) e.preventDefault();
      state.current.keys.add(k);
      if (k === " ") {
        if (state.current.status === "playing") fire();
        else reset();
      }
      if (k === "enter" && state.current.status !== "playing") reset();
    };
    const up = (e: KeyboardEvent) => state.current.keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [fire, reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;
    c.imageSmoothingEnabled = false;
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const s = state.current;
      const dt = Math.min(3, (now - last) / 16.6667);
      last = now;

      if (s.status === "playing") {
        if (s.drag !== null) {
          s.boatX += Math.max(-4, Math.min(4, s.drag - s.boatX));
        } else {
          if (s.keys.has("arrowleft") || s.keys.has("a")) s.boatX -= BOAT_SPEED * dt;
          if (s.keys.has("arrowright") || s.keys.has("d")) s.boatX += BOAT_SPEED * dt;
        }
        s.boatX = Math.max(BOAT_W / 2, Math.min(W - BOAT_W / 2, s.boatX));
        if (s.cooldown > 0) s.cooldown -= dt;

        for (const b of s.buoys) {
          if (!b.alive) continue;
          b.x += b.vx * dt;
          if (b.x - b.w / 2 <= 2) { b.x = 2 + b.w / 2; b.vx = Math.abs(b.vx); }
          if (b.x + b.w / 2 >= W - 2) { b.x = W - 2 - b.w / 2; b.vx = -Math.abs(b.vx); }
        }

        s.shots = s.shots.filter((sh) => {
          sh.y -= SHOT_SPEED * dt;
          return sh.y > -20;
        });

        for (let si = s.shots.length - 1; si >= 0; si--) {
          const sh = s.shots[si];
          if (!sh) continue;

          let hitIndex = -1;
          let hitBy = 0;
          for (let bi = s.buoys.length - 1; bi >= 0; bi--) {
            const b = s.buoys[bi];
            if (!b || !b.alive) continue;
            const by = b.baseY + Math.sin(now * 0.0022 + b.phase) * 12;
            if (
              Math.abs(sh.x - b.x) < b.w / 2 + 6 &&
              Math.abs(sh.y - by) < b.h / 2 + 6
            ) {
              hitIndex = bi;
              hitBy = by;
              break;
            }
          }
          if (hitIndex === -1) continue;

          const b = s.buoys[hitIndex]!;
          s.shots.splice(si, 1);
          s.flash = 10;
          for (let k = 0; k < 22; k++) {
            s.shards.push({
              x: b.x,
              y: hitBy,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.8) * 4,
              life: 30 + Math.random() * 25,
              color: Math.random() < 0.5 ? b.type.color : "#ffffff",
            });
          }
          if (b.golden) {
            b.alive = false;
            sfxGolden();
            s.status = "golden";
            setStatus("golden");
          } else {
            const hitTypeId = b.type.id;
            sfxBreak();
            s.destroyedTypes.add(hitTypeId);
            setDestroyed((d) => ({
              ...d,
              [hitTypeId]: (d[hitTypeId] || 0) + 1,
            }));

            if (s.destroyedTypes.size === TYPES.length) {
              b.alive = false;
              s.status = "won";
              setStatus("won");
              sfxWin();
            } else {
              const newType = TYPES[Math.floor(Math.random() * TYPES.length)]!;
              Object.assign(b, spawnBuoy(newType));
            }
          }
        }
      }

      s.shards = s.shards.filter((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.14 * dt;
        p.life -= dt;
        return p.life > 0;
      });
      if (s.flash > 0) s.flash -= dt;

      drawSky(c);
      drawSun(c, now);
      drawBeach(c, now);
      drawSkyline(c, now);
      drawOcean(c, now);

      for (const b of s.buoys) {
        if (!b.alive) continue;
        drawBuoy(c, b, b.baseY + Math.sin(now * 0.0022 + b.phase) * 12, now);
      }
      for (const sh of s.shots) drawShot(c, sh, now);
      for (const p of s.shards) px(c, p.x, p.y, 2, 2, p.color);

      const bob = Math.sin(now * 0.0035) * 3;
      drawBoat(c, s.boatX, SEA_Y + 6 + bob, now);
      px(c, s.boatX - 18, SEA_Y + 8 + bob, 36, 1, "rgba(216,255,224,0.65)");

      if (s.flash > 0) {
        c.globalAlpha = Math.min(0.35, s.flash / 30);
        px(c, 0, 0, W, H, "#ffffff");
        c.globalAlpha = 1;
      }
      c.globalAlpha = 0.08;
      for (let y = 0; y < H; y += 3) px(c, 0, y, W, 1, "#000000");
      c.globalAlpha = 1;

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toGameX = (clientX: number) => {
    const el = canvasRef.current;
    if (!el) return W / 2;
    const r = el.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * W;
  };

  return (
    <div className="flex w-full max-w-[1280px] flex-col gap-3 lg:flex-row lg:items-start">
      {/* Playable area */}
      <div className="relative w-full overflow-hidden rounded-lg border-4 border-primary-foreground shadow-pop-pink lg:max-w-[880px]">
        {/* Top-Right Share Button */}
        <div className="absolute top-3 right-3 z-10">
          <ShareToXButton canvasRef={canvasRef} />
        </div>

        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-full touch-none select-none [image-rendering:pixelated]"
          style={{ aspectRatio: `${W} / ${H}` }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            unlockAudio();
            if (state.current.status !== "playing") {
              reset();
              return;
            }
            state.current.drag = toGameX(e.clientX);
            fire();
          }}
          onPointerMove={(e) => {
            if (state.current.drag !== null) state.current.drag = toGameX(e.clientX);
          }}
          onPointerUp={() => (state.current.drag = null)}
          onPointerCancel={() => (state.current.drag = null)}
        />

        {status !== "playing" && (
          <div className="absolute inset-0 grid place-items-center bg-[rgba(20,60,30,0.6)] px-4 text-center">
            <div className="max-w-md">
              {status === "ready" && (
                <>
                  <h2 className="font-pixel text-sm sm:text-xl text-primary" style={{ textShadow: "3px 3px 0 #ff3d9a" }}>
                    SUNSET RUNNER
                  </h2>
                  <p className="font-pixel mt-4 text-[8px] leading-5 sm:text-[10px] sm:leading-6 text-accent">
                    BREAK ONE CRATE OF EACH<br />OF THE FOUR TYPES
                  </p>
                  <p className="font-pixel mt-3 text-[7px] leading-5 sm:text-[9px] text-muted-foreground">
                    ←→ / A-D MOVE &middot; SPACE FIRE<br />DRAG &amp; TAP ON TOUCH
                  </p>
                </>
              )}
              {status === "won" && (
                <>
                  <h2 className="font-pixel text-sm sm:text-xl text-secondary" style={{ textShadow: "3px 3px 0 #1a5c2e" }}>
                    GAME COMPLETE
                  </h2>
                  <p className="font-pixel mt-4 text-[8px] leading-5 sm:text-[10px] sm:leading-6 text-foreground">
                    ALL FOUR CRATE TYPES<br />SPLASHED. THE BAY IS YOURS.
                  </p>
                </>
              )}
              {status === "golden" && (
                <>
                  <h2 className="font-pixel text-sm sm:text-xl" style={{ color: "#ffe14d", textShadow: "3px 3px 0 #ff3d9a" }}>
                    ★ GOLDEN STRIKE ★
                  </h2>
                  <p className="font-pixel mt-4 text-[8px] leading-5 sm:text-[10px] sm:leading-6 text-foreground">
                    YOU HIT THE RARE GOLD BUOY.<br />SPECIAL REWARD UNLOCKED:<br />
                    <span style={{ color: "#ff3d9a" }}>SUNSET FENI CROWN</span>
                  </p>
                </>
              )}
              <button
                onClick={reset}
                className="font-pixel pill-yellow mt-6 rounded-sm px-4 py-2 text-[9px] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] sm:text-[11px]"
              >
                {status === "ready" ? "START" : "PLAY AGAIN"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real-Time ID Generation HUD (The "Mannequin") */}
      <div
        className="
          flex w-full flex-col items-center gap-3
          rounded-lg border-4 border-primary-foreground
          p-4 sm:p-5
          lg:w-[340px] lg:shrink-0
        "
        style={{ background: "#0d2a19" }}
      >
        <h3
          className="
            font-pixel
            text-center
            text-[11px]
            tracking-wide
            text-primary
            sm:text-[14px]
          "
          style={{ textShadow: "3px 3px 0 #ff3d9a" }}
        >
          LIVE ID PREVIEW
        </h3>

        {/* ================= ID CARD ================= */}
        <div
          className="
            relative
            flex w-full max-w-[280px]
            flex-col items-center
            overflow-hidden
            rounded-xl
            border-4 border-dashed border-[#E5C887]
            bg-[#032014]
            px-3
            pb-5
            pt-4
            shadow-xl
          "
        >
          {/* ================= CARD BACKGROUND ================= */}
          {destroyed["chilli"] > 0 ? (
            <img
              key={`chilli-bg-${destroyed["chilli"]}`}
              src={`/assets/bg${destroyed["chilli"]}.png`}
              alt={`Card Background ${destroyed["chilli"]}`}
              className="
                absolute inset-0
                z-0
                h-full w-full
                object-cover
                [image-rendering:pixelated]
              "
            />
          ) : (
            <div className="absolute inset-0 z-0 bg-[#032014]" />
          )}

          {/* ================= CARD CONTENT ================= */}
          <div className="relative z-10 flex w-full flex-col items-center">

            {/* ================= LANYARD HOLE ================= */}
            <div
              className="
                absolute
                -top-1 left-1/2
                z-20
                h-4 w-12
                -translate-x-1/2
                rounded-full
                border-4 border-[#E5C887]
                bg-[#0d2a19]
              "
            />

            {/* ================= AVATAR ================= */}
            <div className="mt-2 flex w-full flex-col items-center">
              <div
                className="
                  relative
                  flex w-[120px]
                  items-center justify-center
                "
                style={{ aspectRatio: "3/4" }}
              >
                {destroyed["prawn"] > 0 ? (
                  <>
                    {/* Avatar placeholder */}
                    <div
                      className="
                        absolute inset-0
                        z-0 m-auto
                        flex h-[82%] w-[82%]
                        items-center justify-center
                        rounded-sm
                        bg-[#33d17a]
                        opacity-80
                      "
                    >
                      <span className="font-pixel text-[10px] text-[#0d2a19]">
                        AVATAR
                      </span>
                    </div>

                    {/* Avatar frame */}
                    <img
                      key={`prawn-${destroyed["prawn"]}`}
                      src={`/assets/f${destroyed["prawn"]}.png`}
                      alt={`Photo Frame ${destroyed["prawn"]}`}
                      className="
                        absolute inset-0
                        z-10
                        h-full w-full
                        object-contain
                        [image-rendering:pixelated]
                      "
                    />
                  </>
                ) : (
                  <div
                    className="
                      flex h-full w-full
                      items-center justify-center
                      rounded-md
                      border-2 border-dashed
                      border-[#1a5c2e]
                      bg-[#0d2a19]/80
                    "
                  >
                    <span className="font-pixel text-center text-[10px] text-[#33d17a]">
                      AWAITING
                      <br />
                      FRAME
                    </span>
                  </div>
                )}
              </div>

              {/* ================= NAMEPLATE ================= */}
              <div
                className="
                  relative
                  mt-2
                  flex
                  h-[82px]
                  w-[250px]
                  items-center
                  justify-center
                "
              >
                {destroyed["feni"] > 0 ? (
                  <>
                    {/* Nameplate artwork */}
                    <img
                      key={`feni-${destroyed["feni"]}`}
                      src={`/assets/b${destroyed["feni"]}.png`}
                      alt={`Name Card ${destroyed["feni"]}`}
                      className="
                        absolute inset-0
                        z-0
                        h-full w-full
                        object-contain
                        scale-[1.08]
                        [image-rendering:pixelated]
                      "
                    />

                    {/* Three fields */}
                    <div
                      className="
                        relative z-10
                        flex
                        h-full w-full
                        flex-col
                        items-center
                        justify-center
                        gap-[2px]
                        px-8
                        text-center
                        font-pixel
                      "
                    >
                      <span
                        className="
                          whitespace-nowrap
                          text-[10px]
                          leading-[13px]
                          text-white
                          sm:text-[11px]
                        "
                        style={{ textShadow: "1px 1px 0 #000" }}
                      >
                        PLAYER NAME
                      </span>

                      <span
                        className="
                          whitespace-nowrap
                          text-[9px]
                          leading-[12px]
                          text-[#ffe14d]
                          sm:text-[10px]
                        "
                        style={{ textShadow: "1px 1px 0 #000" }}
                      >
                        RANK
                      </span>

                      <span
                        className="
                          whitespace-nowrap
                          text-[9px]
                          leading-[12px]
                          text-white
                          sm:text-[10px]
                        "
                        style={{ textShadow: "1px 1px 0 #000" }}
                      >
                        TITLE
                      </span>
                    </div>
                  </>
                ) : (
                  <div
                    className="
                      flex h-full w-full
                      items-center justify-center
                      rounded-md
                      border-2 border-dashed
                      border-[#1a5c2e]
                      bg-[#0d2a19]/80
                    "
                  >
                    <span className="font-pixel text-center text-[9px] text-[#33d17a]">
                      AWAITING NAMEPLATE
                    </span>
                  </div>
                )}
              </div>

              {/* ================= BADGE / TITLE ================= */}
              <div
                className="
                  relative
                  mt-1
                  flex
                  h-[58px]
                  w-[190px]
                  items-center
                  justify-center
                "
              >
                {destroyed["kokum"] > 0 ? (
                  <>
                    {/* Badge artwork */}
                    <img
                      key={`kokum-${destroyed["kokum"]}`}
                      src={`/assets/b${destroyed["kokum"]}.png`}
                      alt={`Badge ${destroyed["kokum"]}`}
                      className="
                        absolute inset-0
                        z-0
                        h-full w-full
                        object-contain
                        scale-[1.05]
                        [image-rendering:pixelated]
                      "
                    />

                    {/* Badge text */}
                    <div
                      className="
                        relative z-10
                        flex
                        flex-col
                        items-center
                        justify-center
                        font-pixel
                        text-center
                      "
                    >
                      <span
                        className="
                          whitespace-nowrap
                          text-[8px]
                          leading-[10px]
                          text-[#ffe14d]
                          sm:text-[9px]
                        "
                        style={{ textShadow: "1px 1px 0 #000" }}
                      >
                        RANK
                      </span>

                      <span
                        className="
                          whitespace-nowrap
                          text-[8px]
                          leading-[10px]
                          text-white
                          sm:text-[9px]
                        "
                        style={{ textShadow: "1px 1px 0 #000" }}
                      >
                        TITLE
                      </span>
                    </div>
                  </>
                ) : (
                  <div
                    className="
                      flex h-full w-full
                      items-center justify-center
                      rounded-md
                      border-2 border-dashed
                      border-[#1a5c2e]
                      bg-[#0d2a19]/80
                    "
                  >
                    <span className="font-pixel text-center text-[9px] text-[#33d17a]">
                      AWAITING BADGE
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= INSTRUCTIONS ================= */}
        <div
          className="
            mt-1
            text-center
            font-pixel
            text-[8px]
            leading-4
            text-muted-foreground
            sm:text-[10px]
          "
        >
          HIT CRATES TO DRESS
          <br />
          THE ID CARD!
        </div>
      </div>
    </div>
  );
}
