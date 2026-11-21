import React, { useEffect, useRef } from 'react';

interface ConfettiPopperProps {
  active: boolean;
  variant?: 'celebration' | 'busted';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vr: number;
  life: number;
  maxLife: number;
  shape: 'rect' | 'circle';
}

const CELEBRATION_COLORS = ['#D9A441', '#F6EFE0', '#3A7D6B', '#E4B354', '#C95D63', '#6EA8D6'];
const BUSTED_COLORS = ['#9E2A2B', '#6E7891', '#4A5568', '#C56B6B'];

export const ConfettiPopper: React.FC<ConfettiPopperProps> = ({
  active,
  variant = 'celebration',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (variant === 'celebration') {
      const colors = CELEBRATION_COLORS;
      for (let i = 0; i < 56; i++) {
        const fromLeft = i % 2 === 0;
        const originX = fromLeft ? w * 0.14 : w * 0.86;
        const originY = h * 0.68;
        const angle = fromLeft
          ? -Math.PI * 0.35 + (Math.random() - 0.5) * 0.65
          : -Math.PI * 0.65 + (Math.random() - 0.5) * 0.65;
        const speed = 7 + Math.random() * 9;

        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 5 + Math.random() * 5,
          color: colors[i % colors.length],
          rotation: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.22,
          life: 0,
          maxLife: 80 + Math.random() * 30,
          shape: i % 3 === 0 ? 'circle' : 'rect',
        });
      }
    } else {
      const colors = BUSTED_COLORS;
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: Math.random() * w,
          y: -20 - Math.random() * h * 0.35,
          vx: (Math.random() - 0.5) * 0.6,
          vy: 2.2 + Math.random() * 2.5,
          size: 4 + Math.random() * 4,
          color: colors[i % colors.length],
          rotation: 0,
          vr: 0.04,
          life: 0,
          maxLife: 130 + Math.random() * 40,
          shape: 'circle',
        });
      }
    }

    let rafId = 0;
    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let aliveCount = 0;

      for (const p of particles) {
        p.life += 1;
        if (p.life > p.maxLife) continue;
        aliveCount++;

        p.x += p.vx;
        p.y += p.vy;
        if (variant === 'celebration') {
          p.vy += 0.26; // gravity
          p.vx *= 0.985;
        }
        p.rotation += p.vr;

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size * 0.32, p.size, p.size * 0.64);
        }
        ctx.restore();
      }

      if (aliveCount > 0) {
        rafId = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [active, variant]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 w-full h-full"
    />
  );
};
