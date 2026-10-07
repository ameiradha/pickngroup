import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number; // duration in milliseconds to spawn confetti
}

interface Piece {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const COLORS = [
  '#2563eb', // Blue
  '#3b82f6', // Light Blue
  '#ef4444', // Red
  '#f59e0b', // Yellow/Gold
  '#10b981', // Green
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

export default function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const piecesRef = useRef<Piece[]>([]);
  const isSpawningRef = useRef<boolean>(false);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pieces = piecesRef.current;

      // Update and draw each piece
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        p.x += p.speedX;
        p.y += p.speedY;
        // Gravity
        p.speedY += 0.15;
        // Wind resistance / drag
        p.speedX *= 0.98;
        p.rotation += p.rotationSpeed;
        
        // Fade out as they fall off-screen or age
        if (p.y > canvas.height - 20) {
          p.opacity -= 0.02;
        }

        if (p.opacity <= 0) {
          pieces.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        
        // Draw confetti rectangle/strip
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      // Spawning new pieces if active
      if (isSpawningRef.current && pieces.length < 150) {
        // Spawn from multiple bursts (left, right, top center)
        const spawnPoints = [
          { x: 0, y: canvas.height * 0.8, angle: -Math.PI / 4, spread: 0.4 }, // Left side shooting up-right
          { x: canvas.width, y: canvas.height * 0.8, angle: -3 * Math.PI / 4, spread: 0.4 }, // Right side shooting up-left
          { x: canvas.width / 2, y: canvas.height / 3, angle: -Math.PI / 2, spread: Math.PI } // Center shower
        ];

        // Randomly pick a point to spawn
        const point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        
        for (let k = 0; k < 3; k++) {
          const angle = point.angle + (Math.random() - 0.5) * point.spread;
          const speed = 8 + Math.random() * 14;
          
          pieces.push({
            x: point.x,
            y: point.y,
            size: 6 + Math.random() * 10,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            speedX: Math.cos(angle) * speed,
            speedY: Math.sin(angle) * speed,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            opacity: 1.0
          });
        }
      }

      if (pieces.length > 0 || isSpawningRef.current) {
        animationFrameId.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (active) {
      isSpawningRef.current = true;
      // Start loop if not already running
      if (animationFrameId.current === null) {
        render();
      }

      // Stop spawning after duration
      const timer = setTimeout(() => {
        isSpawningRef.current = false;
      }, duration);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', resizeCanvas);
        if (animationFrameId.current !== null) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
      };
    } else {
      isSpawningRef.current = false;
      piecesRef.current = [];
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [active, duration]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-screen h-screen"
      style={{ display: active ? 'block' : 'none' }}
    />
  );
}
