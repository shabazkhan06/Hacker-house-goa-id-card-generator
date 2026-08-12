import { useEffect, useRef } from "react";

/**
 * Living pixel-art beach background.
 * Pass your imported/public image URL into `src`.
 *
 * Example:
 * import beach from "./assets/Beach-pixel.png";
 * <PixelBreathingBackground src={beach} />
 */
export default function PixelBreathingBackground({
  src,
  className = "",
  style = {},
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    const source = document.createElement("canvas");
    const staticLayer = document.createElement("canvas");
    const sourceCtx = source.getContext("2d", { willReadFrequently: true });
    const staticCtx = staticLayer.getContext("2d");
    let frameId;
    let observer;
    let cancelled = false;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Coordinates are normalized against the supplied 1536 × 1024 artwork.
    const zones = {
      // All visible water, including the extreme left edge.
      ocean: { x: 0, y: 0.63, w: 0.72, h: 0.34 },

      // Shore foam, split into strips so the tide does not move as one layer.
      foam: [
        { x: 0.0, y: 0.655, w: 0.57, h: 0.035 },
        { x: 0.0, y: 0.704, w: 0.64, h: 0.04 },
        { x: 0.0, y: 0.755, w: 0.68, h: 0.045 },
        { x: 0.0, y: 0.81, w: 0.56, h: 0.05 },
      ],

      // Only sky cloud groups. The sun is intentionally excluded.
      clouds: [
        { x: 0.36, y: 0.42, w: 0.24, h: 0.19, phase: 0.0 },
        { x: 0.56, y: 0.47, w: 0.15, h: 0.12, phase: 1.7 },
        { x: 0.0, y: 0.52, w: 0.18, h: 0.11, phase: 3.4 },
      ],

      // Palm crowns / moving leaf areas only. Trunks, huts, sand and land stay static.
      palms: [
        { x: 0.62, y: 0.0, w: 0.37, h: 0.31, phase: 0.0 },
        { x: 0.51, y: 0.2, w: 0.22, h: 0.29, phase: 1.6 },
        { x: 0.72, y: 0.19, w: 0.28, h: 0.28, phase: 3.1 },
        { x: 0.72, y: 0.3, w: 0.18, h: 0.19, phase: 4.2 },
      ],

      // Small foreground plants at the lower-right.
      foliage: [
        { x: 0.59, y: 0.79, w: 0.22, h: 0.19, phase: 0.8 },
        { x: 0.78, y: 0.79, w: 0.22, h: 0.2, phase: 2.4 },
      ],
    };

    const image = new Image();
    image.decoding = "async";

    const px = (value, size) => Math.round(value * size);

    function resize() {
      const parent = canvas.parentElement;
      width = Math.max(1, parent?.clientWidth || window.innerWidth);
      height = Math.max(1, parent?.clientHeight || window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.imageSmoothingEnabled = false;
    }

    function coverDimensions() {
      const canvasRatio = width / height;
      const imageRatio = source.width / source.height;

      if (canvasRatio > imageRatio) {
        const drawWidth = width;
        return {
          x: 0,
          y: (height - drawWidth / imageRatio) / 2,
          w: drawWidth,
          h: drawWidth / imageRatio,
        };
      }

      const drawHeight = height;
      return {
        x: (width - drawHeight * imageRatio) / 2,
        y: 0,
        w: drawHeight * imageRatio,
        h: drawHeight,
      };
    }

    function drawSource(target, sourceCanvas) {
      const { x, y, w, h } = coverDimensions();
      target.imageSmoothingEnabled = false;
      target.drawImage(sourceCanvas, x * dpr, y * dpr, w * dpr, h * dpr);
    }

    // The supplied image has birds around these two areas.
    // This is the sole artwork edit: sky patches replace those bird pixels.
    function removeBirds() {
      sourceCtx.drawImage(image, 0, 0);

      // Patch source areas are selected from nearby clean sky.
      sourceCtx.drawImage(source, 335, 121, 95, 48, 335, 174, 95, 48);
      sourceCtx.drawImage(source, 468, 235, 65, 33, 468, 277, 65, 33);
    }

    function renderStaticLayer() {
      staticLayer.width = Math.round(width * dpr);
      staticLayer.height = Math.round(height * dpr);
      staticCtx.imageSmoothingEnabled = false;
      staticCtx.clearRect(0, 0, staticLayer.width, staticLayer.height);
      drawSource(staticCtx, source);
    }

    function withZoneMask(zone, callback) {
      const { x, y, w, h } = coverDimensions();
      const maskX = (x + zone.x * w) * dpr;
      const maskY = (y + zone.y * h) * dpr;
      const maskW = zone.w * w * dpr;
      const maskH = zone.h * h * dpr;

      ctx.save();
      ctx.beginPath();
      ctx.rect(maskX, maskY, maskW, maskH);
      ctx.clip();
      callback(x * dpr, y * dpr, w * dpr, h * dpr);
      ctx.restore();
    }

    function drawShiftedArtwork(offsetX, offsetY) {
      const { x, y, w, h } = coverDimensions();
      ctx.drawImage(
        source,
        x * dpr + offsetX,
        y * dpr + offsetY,
        w * dpr,
        h * dpr,
      );
    }

    function animate(now) {
      if (cancelled) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(staticLayer, 0, 0);

      if (!reducedMotion) {
        const seconds = now / 1000;
        const scale = Math.min(width, height) / 900;

        // Ocean: slow localized horizontal bands. The static base keeps all
        // rocks, coast, beach and land firmly anchored.
        const oceanBands = [
          { y: 0.63, h: 0.06, speed: 0.88, phase: 0.2, amp: 2.0 },
          { y: 0.69, h: 0.07, speed: 0.72, phase: 1.8, amp: 2.8 },
          { y: 0.76, h: 0.08, speed: 0.96, phase: 3.1, amp: 3.4 },
          { y: 0.84, h: 0.12, speed: 0.65, phase: 4.4, amp: 2.6 },
        ];

        oceanBands.forEach((band, index) => {
          const waveX =
            Math.sin(seconds * band.speed + band.phase) * band.amp * scale;
          const waveY =
            Math.cos(seconds * (band.speed * 0.7) + index) * 0.7 * scale;

          withZoneMask(
            { x: 0, y: band.y, w: zones.ocean.w, h: band.h },
            () => drawShiftedArtwork(waveX * dpr, waveY * dpr),
          );
        });

        // Foam moves slightly more than water, with a gentle forward/back tide.
        zones.foam.forEach((foam, index) => {
          const tide =
            Math.sin(seconds * (1.05 + index * 0.09) + index * 1.3) *
            (1.2 + index * 0.25) *
            scale;

          withZoneMask(foam, () => drawShiftedArtwork(tide * dpr, tide * dpr));
        });

        // Clouds drift at an intentionally almost imperceptible rate.
        zones.clouds.forEach((cloud) => {
          const drift =
            Math.sin(seconds * 0.18 + cloud.phase) * 1.35 * scale;

          withZoneMask(cloud, () => drawShiftedArtwork(drift * dpr, 0));
        });

        // Palm crowns and foliage get tiny independent pixel-cluster sways.
        zones.palms.forEach((palm) => {
          const swayX =
            Math.sin(seconds * 0.95 + palm.phase) * 1.45 * scale;
          const swayY =
            Math.cos(seconds * 0.75 + palm.phase) * 0.55 * scale;

          withZoneMask(palm, () =>
            drawShiftedArtwork(swayX * dpr, swayY * dpr),
          );
        });

        zones.foliage.forEach((plant) => {
          const flutterX =
            Math.sin(seconds * 1.2 + plant.phase) * 1.05 * scale;
          const flutterY =
            Math.cos(seconds * 0.9 + plant.phase) * 0.45 * scale;

          withZoneMask(plant, () =>
            drawShiftedArtwork(flutterX * dpr, flutterY * dpr),
          );
        });
      }

      frameId = requestAnimationFrame(animate);
    }

    function setup() {
      source.width = image.naturalWidth;
      source.height = image.naturalHeight;

      removeBirds();
      resize();
      renderStaticLayer();
      frameId = requestAnimationFrame(animate);
    }

    image.onload = setup;
    image.src = src;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (event) => {
      reducedMotion = event.matches;
    };

    motionQuery.addEventListener?.("change", handleMotionChange);

    observer = new ResizeObserver(() => {
      resize();
      renderStaticLayer();
    });
    observer.observe(canvas.parentElement || canvas);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      observer?.disconnect();
      motionQuery.removeEventListener?.("change", handleMotionChange);
    };
  }, [src]);

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#08723e",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}