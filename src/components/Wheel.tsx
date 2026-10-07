import React, { useEffect, useRef, useState } from 'react';
import { WheelSettings } from '../types';
import { getPaletteColors } from '../themePalettes';
import { playTickSound } from '../audio';
import { Sparkles, HelpCircle } from 'lucide-react';

interface WheelProps {
  names: string[];
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (winnerName: string) => void;
  settings: WheelSettings;
}

export default function Wheel({
  names,
  isSpinning,
  onSpinStart,
  onSpinEnd,
  settings,
}: WheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keep physics values in refs to avoid React re-render overhead at 60fps
  const stateRef = useRef({
    angle: 0,
    angularVelocity: 0,
    lastTickAngle: 0,
    pointerWobble: 0, // deflection of pointer in radians
    lastSliceIndex: -1,
  });

  const [dimensions, setDimensions] = useState({ width: 450, height: 450 });

  // Get active colors
  const activeColors = getPaletteColors(settings.paletteId, settings.customColors);

  // Resize canvas to fit container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const size = Math.min(container.clientWidth, 600);
      setDimensions({ width: size, height: size });
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Animation controller for the spin
  useEffect(() => {
    let animationId: number;
    let startTime: number | null = null;
    const spinDuration = settings.spinTime * 1000; // ms

    // Select random winner target angle when spin starts
    let targetAngleDelta = 0;
    const initialAngle = stateRef.current.angle;

    if (isSpinning && names.length > 0) {
      // Choose a random winning slice
      const winnerIndex = Math.floor(Math.random() * names.length);
      const sliceAngle = (2 * Math.PI) / names.length;
      
      // Calculate final target angle so the winning slice ends up exactly at the pointer (top: -Math.PI / 2)
      // Pointer is at -PI/2 (1.5 * PI).
      // If we want winnerIndex to stop under pointer:
      // finalAngle = (1.5 * PI) - (winnerIndex + 0.5) * sliceAngle
      // To ensure multiple full rotations, add (5 to 8) full spins:
      const fullSpins = 6 + Math.floor(Math.random() * 4);
      const baseSpinsAngle = fullSpins * 2 * Math.PI;
      
      // We want: (pointerAngle - finalAngle) % (2PI) = (winnerIndex + 0.5) * sliceAngle
      // So finalAngle = pointerAngle - (winnerIndex + 0.5) * sliceAngle.
      // Let's add a random factor inside the winning slice so it doesn't land exactly in the middle every time
      const offsetWithinSlice = (0.25 + Math.random() * 0.5) * sliceAngle;
      const targetStopAngle = (1.5 * Math.PI) - (winnerIndex * sliceAngle + offsetWithinSlice);
      
      // Let's keep the rotation positive
      let targetDelta = targetStopAngle - (initialAngle % (2 * Math.PI));
      while (targetDelta < baseSpinsAngle) {
        targetDelta += 2 * Math.PI;
      }
      
      targetAngleDelta = targetDelta;
      startTime = performance.now();
    }

    const drawAndAnimate = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const numSlices = names.length;
      const sliceAngle = numSlices > 0 ? (2 * Math.PI) / numSlices : 0;

      // 1. Update Physics / Rotation Angle
      if (isSpinning && startTime !== null && numSlices > 0) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);

        // Quintic ease out (long, dramatic slow down phase!)
        const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
        const easeVal = easeOutQuint(progress);

        stateRef.current.angle = initialAngle + easeVal * targetAngleDelta;

        // Wobble decay
        stateRef.current.pointerWobble *= 0.82;

        // Trigger Ticks based on boundaries crossed
        // Pointer is at 1.5 * PI (-0.5 * PI)
        const pointerAngle = 1.5 * Math.PI;
        // Slice under the pointer:
        const currentRotation = stateRef.current.angle;
        
        let relativeAngle = (pointerAngle - currentRotation) % (2 * Math.PI);
        if (relativeAngle < 0) relativeAngle += 2 * Math.PI;
        
        const currentSliceIndex = Math.floor(relativeAngle / sliceAngle);

        if (currentSliceIndex !== stateRef.current.lastSliceIndex) {
          // Slice boundary crossed! Play tick and shake pointer
          stateRef.current.lastSliceIndex = currentSliceIndex;
          
          // Play tick, scale volume as it slows down
          const speedFactor = 1 - progress; // drops from 1 to 0
          if (speedFactor > 0.02) {
            playTickSound(settings.spinSound, settings.volume);
            // Deflect pointer in direction of spin (which is positive/clockwise)
            stateRef.current.pointerWobble = 0.45 * Math.max(0.1, speedFactor);
          }
        }

        if (progress >= 1) {
          // Spin complete!
          const finalWinnerIndex = currentSliceIndex % numSlices;
          const winnerName = names[finalWinnerIndex];
          onSpinEnd(winnerName);
          startTime = null;
        }
      } else {
        // Just standard idle rotation decay/wobble decay
        stateRef.current.pointerWobble *= 0.85;
      }

      // 2. Render Canvas
      const dpr = window.devicePixelRatio || 1;
      const width = dimensions.width;
      const height = dimensions.height;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      ctx.scale(dpr, dpr);
      
      const centerX = width / 2;
      const centerY = height / 2;
      const outerRadius = Math.min(width, height) / 2 - 20;
      const innerRadius = outerRadius * 0.22;

      ctx.clearRect(0, 0, width, height);

      // A. Shadow/Glow effect behind wheel
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 6;
      ctx.fill();
      ctx.restore();

      if (numSlices === 0) {
        // Draw elegant empty wheel placeholder
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f3f4f6'; // light gray
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 6;
        ctx.fill();
        ctx.stroke();

        // Draw dotted outer rim
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius - 10, 0, 2 * Math.PI);
        ctx.strokeStyle = '#cbd5e1';
        ctx.setLineDash([4, 12]);
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();

        // Center hub
        drawCenterHub(ctx, centerX, centerY, innerRadius, 'Empty Wheel', '✨', null);
      } else {
        // Draw slices
        for (let i = 0; i < numSlices; i++) {
          const startAngle = stateRef.current.angle + i * sliceAngle;
          const endAngle = startAngle + sliceAngle;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
          ctx.closePath();

          // Coloring
          const colorIndex = i % activeColors.length;
          ctx.fillStyle = activeColors[colorIndex];
          ctx.fill();

          // Delicate slice divider lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.lineWidth = numSlices > 50 ? 0.5 : numSlices > 25 ? 1 : 2;
          ctx.stroke();
          ctx.restore();

          // Draw slice text
          ctx.save();
          // Angle of slice text
          const textAngle = startAngle + sliceAngle / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate(textAngle);

          // Text details
          ctx.fillStyle = getContrastColor(activeColors[colorIndex]);
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';

          // Responsive font sizing based on wheel radius and slice density
          const baseFontSize = outerRadius * 0.095; // default scale
          const denseFactor = Math.min(1, 14 / numSlices); // shrink for more segments
          const fontSize = Math.max(9, baseFontSize * denseFactor);
          ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;

          // Clean truncating
          let nameText = names[i];
          const maxTextLength = outerRadius * 0.65;
          const textMetrics = ctx.measureText(nameText);
          if (textMetrics.width > maxTextLength) {
            // Truncate text elegantly
            while (ctx.measureText(nameText + '...').width > maxTextLength && nameText.length > 2) {
              nameText = nameText.substring(0, nameText.length - 1);
            }
            nameText += '...';
          }

          // If slice is extremely small, we don't draw text to prevent collision
          if (sliceAngle > 0.05 || numSlices <= 100) {
            ctx.fillText(nameText, outerRadius - 12, 0);
          }
          ctx.restore();
        }

        // B. Outer Decorative Ring with flashing lights
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#1e293b'; // deep navy border
        ctx.lineWidth = 6;
        ctx.stroke();

        // Little flashing bulbs/dots
        const numBulbs = Math.min(48, numSlices * 3 || 24);
        const bulbAngleStep = (2 * Math.PI) / numBulbs;
        const blinkPhase = Math.floor(timestamp / 160) % 3; // flashing state

        for (let b = 0; b < numBulbs; b++) {
          const bulbAngle = stateRef.current.angle + b * bulbAngleStep;
          const bulbX = centerX + (outerRadius - 3) * Math.cos(bulbAngle);
          const bulbY = centerY + (outerRadius - 3) * Math.sin(bulbAngle);

          ctx.beginPath();
          ctx.arc(bulbX, bulbY, 3.5, 0, 2 * Math.PI);
          
          // Light pattern alternate
          const lit = (b + blinkPhase) % 3 === 0;
          if (lit && isSpinning) {
            ctx.fillStyle = '#facc15'; // bright glowing gold yellow
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 6;
          } else {
            ctx.fillStyle = '#ffffff'; // off state white
            ctx.shadowBlur = 0;
          }
          ctx.fill();
        }
        ctx.restore();

        // C. Center Hub
        drawCenterHub(
          ctx,
          centerX,
          centerY,
          innerRadius,
          settings.centerText,
          settings.centerEmoji,
          settings.centerImage
        );
      }

      // D. Draw the pointer needle at the top (1.5 * PI)
      ctx.save();
      ctx.translate(centerX, centerY - outerRadius);
      // Wobble rotation
      ctx.rotate(stateRef.current.pointerWobble);

      // Draw pointer shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;

      // Draw custom pointer triangle (pointing down into the wheel)
      ctx.beginPath();
      ctx.moveTo(-16, -26); // top left
      ctx.lineTo(16, -26);  // top right
      ctx.lineTo(0, 10);    // tip
      ctx.closePath();

      ctx.fillStyle = '#ef4444'; // intense energetic red pointer
      ctx.fill();

      // Pointer highlight border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Pin at top of pointer
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, -20, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#475569';
      ctx.fill();

      ctx.restore();

      // Keep animating if spinning
      if (isSpinning || stateRef.current.pointerWobble > 0.001) {
        animationId = requestAnimationFrame(drawAndAnimate);
      }
    };

    animationId = requestAnimationFrame(drawAndAnimate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [names, isSpinning, dimensions, activeColors, settings]);

  // Helper: Draw Center Hub
  const drawCenterHub = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    text: string,
    emoji: string,
    imageUrl: string | null
  ) => {
    ctx.save();
    
    // Draw outer dark border for center
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Draw inner circle hub
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Draw center graphics
    if (imageUrl) {
      // Draw uploaded custom center image
      const img = new Image();
      img.src = imageUrl;
      
      ctx.beginPath();
      ctx.arc(cx, cy, r - 3, 0, 2 * Math.PI);
      ctx.clip();
      
      try {
        ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      } catch (e) {
        // Fallback if image fails to render
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
      }
    } else if (emoji) {
      // Draw customizable emoji (default star)
      ctx.font = `${r * 0.9}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, cx, cy + 1);
    } else if (text) {
      // Draw custom center text
      ctx.fillStyle = '#1e293b';
      ctx.font = `bold ${r * 0.35}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Wrap/truncate text slightly
      let display = text.substring(0, 8);
      if (text.length > 8) display += '..';
      ctx.fillText(display, cx, cy);
    } else {
      // Absolute fallback decoration
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.5, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.restore();
  };

  // Helper: Find high-contrast text color (black or white) for slice background
  const getContrastColor = (hexColor: string): string => {
    // If shorthand, expand it
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // YIQ formula
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 135 ? '#1e293b' : '#ffffff';
  };

  const handleWheelClick = () => {
    if (!isSpinning && names.length > 0) {
      onSpinStart();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center relative select-none w-full max-w-full"
    >
      <div
        className={`relative cursor-pointer transition-transform duration-300 ${
          isSpinning ? 'scale-[1.01]' : 'hover:scale-[1.02]'
        }`}
        onClick={handleWheelClick}
        style={{
          tapHighlightColor: 'transparent',
        }}
        id="spinning-wheel-container"
      >
        <canvas ref={canvasRef} id="wheel-canvas" className="block max-w-full" />
        
        {/* Absolute Center Quick Instruction Pin overlay (only visible when not spinning) */}
        {!isSpinning && names.length > 0 && (
          <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] pointer-events-none">
            <div className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md opacity-0 hover:opacity-100 transition-opacity duration-200">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>SPIN!</span>
            </div>
          </div>
        )}
      </div>

      {/* Under-wheel Spin CTA */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          onClick={handleWheelClick}
          disabled={isSpinning || names.length === 0}
          className={`px-12 py-4 rounded-full font-bold text-lg tracking-wide shadow-lg transition-all duration-300 transform flex items-center gap-2.5 ${
            names.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              : isSpinning
              ? 'bg-blue-100 text-blue-500 cursor-wait'
              : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
          }`}
          id="btn-main-spin"
        >
          <Sparkles className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? 'Spinning...' : 'SPIN THE WHEEL'}</span>
        </button>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 select-none">
          <span>Tip: Click wheel, press button, or press</span>
          <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border text-[10px] font-semibold text-gray-500">
            Ctrl + Enter
          </kbd>
        </p>
      </div>
    </div>
  );
}
