import { useEffect, useRef } from 'react';

/**
 * "The face that won't hold still" — the hero's signature. Thousands of
 * particles are sprung between several stylized face point-clouds, but the
 * morph cadence is deliberately faster than the particles can fully arrive, so
 * the portrait is *perpetually mid-morph*: you sense a face, never a person.
 * That is the anonymity, made literal — everyone and no-one.
 *
 * Interaction: the cloud parallaxes toward the pointer and particles scatter
 * away from it (a "you can't quite touch them" feel). Colour codes the brand —
 * violet is the stranger, teal accents are the live line; the spark green is
 * withheld here so it lands harder at the connect moment later.
 *
 * Everything is hand-rolled on a 2D canvas (no libs). Under
 * `prefers-reduced-motion` a single static face is drawn once with no loop or
 * listeners. The canvas is decorative → aria-hidden; the hero's real heading
 * lives in the DOM alongside it.
 */

/* ── seeded RNG (mulberry32) so faces are varied but stable across reloads ── */
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const FACE_SRC = 360; // offscreen sampling resolution (square)

/** Draw one stylized line-art face into a 2D context, seeded for variety. */
const drawFace = (ctx: CanvasRenderingContext2D, seed: number) => {
  const r = rng(seed);
  const cx = FACE_SRC / 2;
  const cy = FACE_SRC / 2;
  const headW = 96 + r() * 34;
  const headH = 128 + r() * 30;
  const jaw = 0.62 + r() * 0.22;
  const eyeY = cy - 6 + r() * 14;
  const eyeGap = 34 + r() * 16;
  const eyeR = 6 + r() * 4;
  const browLift = 6 + r() * 10;
  const noseLen = 20 + r() * 18;
  const mouthY = cy + 46 + r() * 18;
  const mouthW = 26 + r() * 20;
  const mouthCurve = -6 + r() * 20;
  const hasHair = r() > 0.35;

  ctx.clearRect(0, 0, FACE_SRC, FACE_SRC);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // head + jaw
  ctx.beginPath();
  ctx.moveTo(cx - headW, cy - headH * 0.35);
  ctx.bezierCurveTo(cx - headW, cy - headH, cx + headW, cy - headH, cx + headW, cy - headH * 0.35);
  ctx.bezierCurveTo(
    cx + headW,
    cy + headH * 0.45,
    cx + headW * jaw,
    cy + headH * 0.95,
    cx,
    cy + headH,
  );
  ctx.bezierCurveTo(
    cx - headW * jaw,
    cy + headH * 0.95,
    cx - headW,
    cy + headH * 0.45,
    cx - headW,
    cy - headH * 0.35,
  );
  ctx.stroke();

  // eyes
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + s * eyeGap, eyeY, eyeR * 1.5, eyeR, 0, 0, Math.PI * 2);
    ctx.stroke();
    // brow
    ctx.beginPath();
    ctx.moveTo(cx + s * (eyeGap + eyeR * 1.6), eyeY - browLift);
    ctx.quadraticCurveTo(cx + s * eyeGap, eyeY - browLift - 6, cx + s * (eyeGap - eyeR * 1.6), eyeY - browLift + 1);
    ctx.stroke();
  }

  // nose
  ctx.beginPath();
  ctx.moveTo(cx, eyeY + 6);
  ctx.lineTo(cx - 6, eyeY + noseLen);
  ctx.quadraticCurveTo(cx, eyeY + noseLen + 6, cx + 6, eyeY + noseLen);
  ctx.stroke();

  // mouth
  ctx.beginPath();
  ctx.moveTo(cx - mouthW, mouthY);
  ctx.quadraticCurveTo(cx, mouthY + mouthCurve, cx + mouthW, mouthY);
  ctx.stroke();

  // hairline (optional)
  if (hasHair) {
    ctx.beginPath();
    ctx.moveTo(cx - headW * 0.86, cy - headH * 0.55);
    ctx.quadraticCurveTo(cx, cy - headH * 1.02, cx + headW * 0.86, cy - headH * 0.55);
    ctx.stroke();
  }
};

/** Sample opaque pixels from the drawn face → N normalized [-0.5,0.5] points. */
const sampleFace = (seed: number, count: number): Float32Array => {
  const c = document.createElement('canvas');
  c.width = FACE_SRC;
  c.height = FACE_SRC;
  const ctx = c.getContext('2d')!;
  drawFace(ctx, seed);
  const { data } = ctx.getImageData(0, 0, FACE_SRC, FACE_SRC);

  const pts: number[] = [];
  for (let y = 0; y < FACE_SRC; y += 2) {
    for (let x = 0; x < FACE_SRC; x += 2) {
      if (data[(y * FACE_SRC + x) * 4 + 3] > 128) {
        pts.push(x, y);
      }
    }
  }
  // shuffle pixel pairs
  const pairs = pts.length / 2;
  for (let i = pairs - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    for (let k = 0; k < 2; k += 1) {
      const a = i * 2 + k;
      const b = j * 2 + k;
      const tmp = pts[a];
      pts[a] = pts[b];
      pts[b] = tmp;
    }
  }

  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i += 1) {
    const src = (i % pairs) * 2;
    out[i * 2] = pts[src] / FACE_SRC - 0.5;
    out[i * 2 + 1] = pts[src + 1] / FACE_SRC - 0.5;
  }
  return out;
};

const FACE_SEEDS = [7, 21, 44, 68, 91, 130];
const MORPH_MS = 3600;

type Props = { className?: string };

const ParticleFace = ({ className }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement!;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // particle budget scales with viewport (perf)
    const N = Math.min(3400, Math.max(1400, Math.floor(window.innerWidth * 2.2)));

    const faces = FACE_SEEDS.map((s) => sampleFace(s, N));

    // per-particle state
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const vx = new Float32Array(N);
    const vy = new Float32Array(N);
    const seed = new Float32Array(N); // for flow noise + colour mix
    for (let i = 0; i < N; i += 1) seed[i] = Math.random();

    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let scale = 0;
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
      scale = Math.min(w, h) * 1.5;
    };
    resize();

    // seed particle positions at the first face so it assembles from frame 1
    for (let i = 0; i < N; i += 1) {
      px[i] = cx + faces[0][i * 2] * scale + (Math.random() - 0.5) * 60;
      py[i] = cy + faces[0][i * 2 + 1] * scale + (Math.random() - 0.5) * 60;
    }

    // pointer (screen-space, relative to canvas)
    let pointerX = -9999;
    let pointerY = -9999;
    let targetParX = 0;
    let targetParY = 0;
    let parX = 0;
    let parY = 0;

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = e.clientX - rect.left;
      pointerY = e.clientY - rect.top;
      targetParX = ((pointerX - cx) / w) * 46;
      targetParY = ((pointerY - cy) / h) * 46;
    };
    const onLeave = () => {
      pointerX = -9999;
      pointerY = -9999;
      targetParX = 0;
      targetParY = 0;
    };

    /* ── reduced motion: draw one static face, no loop, no listeners ── */
    if (prefersReduced) {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < N; i += 1) {
        const tx = cx + faces[0][i * 2] * scale;
        const ty = cy + faces[0][i * 2 + 1] * scale;
        const teal = seed[i] > 0.8;
        ctx.fillStyle = teal ? 'rgba(53,224,200,0.5)' : 'rgba(139,107,255,0.5)';
        ctx.fillRect(tx, ty, 1.6, 1.6);
      }
      const ro = new ResizeObserver(() => {
        resize();
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < N; i += 1) {
          const tx = cx + faces[0][i * 2] * scale;
          const ty = cy + faces[0][i * 2 + 1] * scale;
          ctx.fillStyle = seed[i] > 0.8 ? 'rgba(53,224,200,0.5)' : 'rgba(139,107,255,0.5)';
          ctx.fillRect(tx, ty, 1.6, 1.6);
        }
      });
      ro.observe(parent);
      return () => ro.disconnect();
    }

    /* ── animated loop ── */
    let cur = 0;
    let nextAt = performance.now() + MORPH_MS;
    let raf = 0;
    const REPEL = 92;
    const REPEL_R2 = REPEL * REPEL;

    const frame = (now: number) => {
      if (now >= nextAt) {
        cur = (cur + 1) % faces.length;
        nextAt = now + MORPH_MS;
      }
      const face = faces[cur];
      const t = now * 0.001;

      // ease parallax
      parX += (targetParX - parX) * 0.06;
      parY += (targetParY - parY) * 0.06;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < N; i += 1) {
        // target = face point + gentle flow noise (never perfectly still)
        const fx = cx + face[i * 2] * scale + parX;
        const fy = cy + face[i * 2 + 1] * scale + parY;
        const nx = Math.sin(t * 0.9 + seed[i] * 12.6) * 2.2;
        const ny = Math.cos(t * 1.1 + seed[i] * 9.3) * 2.2;

        // spring toward target (deliberately soft → perpetual mid-morph)
        vx[i] += (fx + nx - px[i]) * 0.026;
        vy[i] += (fy + ny - py[i]) * 0.026;

        // pointer repel
        const dx = px[i] - pointerX;
        const dy = py[i] - pointerY;
        const d2 = dx * dx + dy * dy;
        if (d2 < REPEL_R2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const push = ((REPEL - d) / REPEL) * 3.4;
          vx[i] += (dx / d) * push;
          vy[i] += (dy / d) * push;
        }

        vx[i] *= 0.82;
        vy[i] *= 0.82;
        px[i] += vx[i];
        py[i] += vy[i];

        // draw — violet by default, teal on a minority, brighter when moving.
        // Slightly hotter alpha + a soft breathing pulse reads as a live
        // holographic projection rather than a flat particle cloud.
        const speed = Math.min(1, (Math.abs(vx[i]) + Math.abs(vy[i])) * 0.14);
        const pulse = 0.06 * Math.sin(t * 1.6 + seed[i] * 6.283);
        const a = 0.4 + speed * 0.5 + pulse;
        if (seed[i] > 0.8) {
          ctx.fillStyle = `rgba(134,242,228,${a})`;
        } else if (seed[i] > 0.66) {
          ctx.fillStyle = `rgba(182,164,255,${a})`;
        } else {
          ctx.fillStyle = `rgba(139,107,255,${a})`;
        }
        const size = 1.5 + speed * 1.5;
        ctx.fillRect(px[i], py[i], size, size);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    window.addEventListener('pointermove', onMove, { passive: true });
    parent.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      parent.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
};

export default ParticleFace;
