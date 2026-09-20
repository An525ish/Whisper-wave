import { useEffect, useRef } from 'react';

/**
 * "The Whisper Wave orb" — the hero's centerpiece. A luminous sphere built
 * entirely from oscillating waveform rings: the literal Whisper *Wave*, and a
 * face-less stand-in for countless anonymous voices carried at once. Each
 * latitude ring is a circle whose radius is perturbed by a travelling sine
 * wave, so the surface ripples and breathes like a living signal. It has no
 * identity — just wave — which is the point.
 *
 * Interaction: the sphere tilts toward the pointer, and a click/hover sends a
 * decaying ripple pulse across the surface (a "you reached in and it answered"
 * feel). Colour codes the brand — violet dominates (the stranger/anonymity),
 * teal rides the crests (the live line); the spark green is withheld so it
 * lands harder at the connect moment later.
 *
 * Hand-rolled on a 2D canvas (no libs). Under `prefers-reduced-motion` a
 * single calm sphere is drawn once with no loop or listeners. Decorative →
 * aria-hidden; the hero's real heading lives in the DOM alongside it.
 */

const BANDS = 46; // latitude rings
const SEG = 120; // points per ring

type Props = { className?: string };

const WaveOrb = ({ className }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement!;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let radius = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w * 0.5;
      cy = h * 0.5;
      radius = Math.min(w, h) * 0.4;
    };
    resize();

    // pointer → eased tilt + ripple pulse
    let tiltTX = 0;
    let tiltTY = 0;
    let tiltX = 0;
    let tiltY = 0;
    let ripple = 0; // 0..1 decaying pulse

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      tiltTX = px * 0.6;
      tiltTY = py * 0.6;
    };
    const onLeave = () => {
      tiltTX = 0;
      tiltTY = 0;
    };
    const onDown = () => {
      ripple = 1;
    };

    /**
     * Draw the sphere for a given time. `spin` rotates the wave phase around
     * the vertical axis; `breathe` scales the whole orb; tilt skews the
     * latitude bands to fake 3D rotation toward the pointer.
     */
    const drawSphere = (phase: number, breathe: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 1.1;

      const R = radius * breathe;

      // faint core glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      glow.addColorStop(0, 'rgba(139,107,255,0.22)');
      glow.addColorStop(0.6, 'rgba(90,63,214,0.08)');
      glow.addColorStop(1, 'rgba(90,63,214,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2);
      ctx.fill();

      for (let b = 0; b < BANDS; b += 1) {
        // latitude from -PI/2 (bottom) to +PI/2 (top)
        const lat = (b / (BANDS - 1) - 0.5) * Math.PI;
        const bandR = Math.cos(lat) * R; // ring radius at this latitude
        const bandY = Math.sin(lat) * R * (1 - tiltTY * 0.0); // base y

        // colour: violet body, teal toward the equator crests
        const equator = 1 - Math.abs(b / (BANDS - 1) - 0.5) * 2; // 0..1
        const teal = Math.pow(equator, 2.2);
        const rr = Math.round(139 + (134 - 139) * teal);
        const gg = Math.round(107 + (242 - 107) * teal);
        const bb = Math.round(255 + (228 - 255) * teal);

        ctx.beginPath();
        for (let s = 0; s <= SEG; s += 1) {
          const a = (s / SEG) * Math.PI * 2;
          // travelling wave along the ring + latitude ripple + click pulse
          const wave =
            Math.sin(a * 3 + phase + lat * 2) * 0.055 +
            Math.sin(a * 6 - phase * 1.4) * 0.03 +
            ripple * Math.sin(a * 8 - phase * 3) * 0.12;
          const r = bandR * (1 + wave);

          // project with tilt (skew x by latitude, y by longitude)
          let x = Math.cos(a) * r;
          let y = bandY + Math.sin(a) * r * 0.32; // flatten rings → sphere read
          // apply pointer tilt
          x += tiltX * bandY;
          y += tiltY * Math.cos(a) * r * 0.5;

          const sx = cx + x;
          const sy = cy + y;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        // depth cue: rings nearer the equator read brighter
        const alpha = 0.18 + equator * 0.5;
        ctx.strokeStyle = `rgba(${rr},${gg},${bb},${alpha})`;
        ctx.stroke();
      }
    };

    /* ── reduced motion: one calm sphere, no loop, no listeners ── */
    if (prefersReduced) {
      drawSphere(0, 1);
      const ro = new ResizeObserver(() => {
        resize();
        drawSphere(0, 1);
      });
      ro.observe(parent);
      return () => ro.disconnect();
    }

    /* ── animated loop ── */
    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      const t = (now - start) * 0.001;
      tiltX += (tiltTX - tiltX) * 0.06;
      tiltY += (tiltTY - tiltY) * 0.06;
      ripple *= 0.94; // decay
      const breathe = 1 + Math.sin(t * 0.9) * 0.02;
      drawSphere(t * 1.1, breathe);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    window.addEventListener('pointermove', onMove, { passive: true });
    parent.addEventListener('pointerleave', onLeave);
    parent.addEventListener('pointerdown', onDown);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      parent.removeEventListener('pointerleave', onLeave);
      parent.removeEventListener('pointerdown', onDown);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
};

export default WaveOrb;
