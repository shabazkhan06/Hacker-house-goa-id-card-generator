import { useEffect, useRef, useState } from "react";
import PixelBreathingBackground from "../components/PixelBreathingBackground";
import beachImg from "../assets/Beach-pixel.png";
import goldenIdCard from "../assets/1.png";
import "../styles/landing.css";

export default function LoadoutPage() {
  const canvasRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const animationRef = useRef(null);

  const COLORS = [
    "#FFD700", "#FFC200", "#FFE066", "#B8860B",
    "#FFAA00", "#2d4a1e", "#4CAF50", "#ffffff", "#ffe599",
  ];

  const launchConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = "block";

    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height * 0.3,
      size: Math.floor(Math.random() * 7 + 3),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speedY: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * 2.5,
      opacity: 1,
    }));

    const start = performance.now();
    const DURATION = 2000;

    const animate = (now) => {
      const elapsed = now - start;
      if (elapsed > DURATION) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = "none";
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fade = 1 - Math.max(0, (elapsed - 1400) / 600);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleReveal = () => {
    if (revealed) return;
    setRevealed(true);
    setTimeout(launchConfetti, 80);
  };

  const handleShareX = () => {
    const caption = encodeURIComponent(
      "I just got my Builder Pass for Hacker गोवा House 2026 🌴 See you in Goa. #FrameInGoa"
    );
    // Direct image attach isn't possible via the web intent (X doesn't allow
    // pre-attached media through a URL), so this opens a pre-filled tweet.
    // If goldenIdCard is hosted at a public URL, swap this for that link so
    // the tweet's card preview shows the actual ID image.
    window.open(`https://twitter.com/intent/tweet?text=${caption}`, "_blank");
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <main className="final-page-wrapper">
      {/* Existing pixel beach background */}
      <div className="final-page-bg">
        <PixelBreathingBackground src={beachImg} />
      </div>

      {/* Confetti canvas — sits above everything */}
      <canvas
        ref={canvasRef}
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 9999,
          imageRendering: "pixelated",
        }}
      />

      {/* Foreground content */}
      <div className="loadout-content">
        {!revealed ? (
          /* ── Reveal Button ── */
          <button className="pixel-pill pixel-frame" onClick={handleReveal}>
            <span className="pixel-pill-text">▶ &nbsp;REVEAL YOUR ID CARD</span>
          </button>
        ) : (
          <>
            {/* ── Pixelated pill header ── */}
            <div className="pixel-pill pixel-frame">
              <span className="pixel-pill-text">
                CONGRATULATIONS, HERE IS YOUR ID-CARD
              </span>
            </div>

            {/* ── Golden ID Card ── */}
            <div className="id-card-wrapper">
              <img
                src={goldenIdCard}
                alt="Golden Hacker House Goa 2026 ID Card"
                className="golden-id-card"
              />
            </div>

            {/* ── Share to X ── */}
            <button className="pixel-pill pixel-frame share-x-btn" onClick={handleShareX}>
              <span className="pixel-pill-text">𝕏 &nbsp;SHARE AS X POST</span>
            </button>
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap');

        /* ── Layout ── */
        .loadout-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          min-height: 100vh;
          padding: 2rem 1rem;
          font-family: 'Pixelify Sans', monospace;
        }

        /*
          ── TRUE PIXEL FRAME ──
          Stair-step (square notch) corners instead of diagonal cuts.
          Diagonal clip-path corners render as a smooth bevel/octagon —
          real pixel-art UI uses right-angle steps. This clip-path carves
          two square notches out of each corner, so the silhouette reads
          as blocky/pixelated at any size, especially combined with the
          hard (non-blurred) box-shadow outline below.
        */
        .pixel-frame {
          --px: 6px; /* size of one "pixel" step — bump to 8-10px for a chunkier look */
          position: relative;
          clip-path: polygon(
            0px calc(var(--px) * 2),
            var(--px) calc(var(--px) * 2),
            var(--px) var(--px),
            calc(var(--px) * 2) var(--px),
            calc(var(--px) * 2) 0px,
            calc(100% - (var(--px) * 2)) 0px,
            calc(100% - (var(--px) * 2)) var(--px),
            calc(100% - var(--px)) var(--px),
            calc(100% - var(--px)) calc(var(--px) * 2),
            100% calc(var(--px) * 2),
            100% calc(100% - (var(--px) * 2)),
            calc(100% - var(--px)) calc(100% - (var(--px) * 2)),
            calc(100% - var(--px)) calc(100% - var(--px)),
            calc(100% - (var(--px) * 2)) calc(100% - var(--px)),
            calc(100% - (var(--px) * 2)) 100%,
            calc(var(--px) * 2) 100%,
            calc(var(--px) * 2) calc(100% - var(--px)),
            var(--px) calc(100% - var(--px)),
            var(--px) calc(100% - (var(--px) * 2)),
            0px calc(100% - (var(--px) * 2))
          );
          image-rendering: pixelated;
        }

        /*
          Hard-edged layered "pixel border" — stacked box-shadows with zero
          blur create crisp 1-step outlines (dark outline, then gold bevel,
          then dark outline again) that trace the stair-step silhouette
          above, instead of one soft drop shadow.
        */
        .pixel-frame::after {
          content: "";
          position: absolute;
          inset: 0;
          clip-path: inherit;
          box-shadow:
            inset 0 0 0 3px #000,
            inset 0 0 0 6px #B8860B,
            inset 0 0 0 9px #000;
          pointer-events: none;
        }

        /*
          ── Pixel Pill (matches reference: pink fill, offset yellow
          "shadow" panel peeking out bottom-right, hard black outline,
          dark-teal drop-shadowed label text) ──
          The yellow layer is a second pixel-frame element sitting behind
          the pink one, nudged down-right — that's what reads as a solid
          pixel drop shadow instead of a soft blurred box-shadow.
        */
        .pixel-pill {
          position: relative;
          background: #FF3E9A;
          padding: 0.85rem 2.2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          max-width: 90vw;
          border: none;
          cursor: pointer;
          font: inherit;
          box-shadow: none;
          animation: pillPop 0.25s steps(3, end) forwards;
        }
        /* yellow offset shadow panel, behind + down-right of the pink pill */
        .pixel-pill::before {
          content: "";
          position: absolute;
          inset: 0;
          clip-path: inherit;
          background: #FFD700;
          transform: translate(6px, 6px);
          z-index: -2;
        }
        /* hard black outline traced around the pink pill's own silhouette
           (overrides .pixel-frame::after's gold-ring version below) */
        .pixel-pill.pixel-frame::after {
          content: "";
          position: absolute;
          inset: 0;
          clip-path: inherit;
          box-shadow: inset 0 0 0 3px #000;
          pointer-events: none;
          z-index: 1;
        }

        .pixel-pill-text {
          position: relative;
          z-index: 2;
          font-family: 'Pixelify Sans', monospace;
          font-size: clamp(0.8rem, 2.4vw, 1.25rem);
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          line-height: 1.5;
          display: block;
          color: #0F3D2E;
          text-shadow: 2px 2px 0 rgba(0,0,0,0.15);
          white-space: nowrap;
        }

        /* Reveal + Share buttons reuse .pixel-pill but need button resets
           and a press interaction */
        button.pixel-pill {
          transition: transform 0.08s steps(2, end);
        }
        button.pixel-pill:hover {
          transform: translate(-2px, -2px);
        }
        button.pixel-pill:active {
          transform: translate(3px, 3px);
        }
        button.pixel-pill:active::before {
          transform: translate(3px, 3px);
        }

        .share-x-btn {
          margin-top: 0.5rem;
          background: #FFD700;
        }
        .share-x-btn::before {
          background: #0F3D2E;
        }
        .share-x-btn .pixel-pill-text {
        color: #FF3E9A;}

        @keyframes pillPop {
          0%   { transform: scale(0.85); opacity: 0; }
          50%  { transform: scale(1.04); opacity: 0.7; }
          100% { transform: scale(1);   opacity: 1; }
        }

        /* ── ID Card ── */
        .id-card-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          animation: cardDrop 0.35s steps(5, end) forwards;
        }

        .golden-id-card {
          display: block;
          width: clamp(240px, 38vw, 420px);
          height: auto;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
          filter:
            drop-shadow(4px 4px 0px #000)
            drop-shadow(0px 0px 12px #FFD70055);
        }

        @keyframes cardDrop {
          0%   { opacity: 0; transform: translateY(24px) scale(0.96); }
          40%  { opacity: 0.5; transform: translateY(8px) scale(0.98); }
          80%  { opacity: 0.9; transform: translateY(-2px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .pixel-frame     { --px: 4px; }
          .golden-id-card  { width: clamp(200px, 78vw, 320px); }
          .pixel-pill      { padding: 0.7rem 1.3rem; }
        }
        @media (min-width: 1200px) {
          .golden-id-card  { width: clamp(380px, 26vw, 460px); }
        }
      `}</style>
    </main>
  );
}