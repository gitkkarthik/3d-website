import React, { useEffect, useRef, useState } from 'react';
import { FrameLoader, TOTAL_FRAMES } from '../utils/FrameLoader';
import { TIMELINE_BEATS, lerp, clamp } from '../utils/Timeline';
import { Sparkles } from 'lucide-react';

interface WaveGarmentCanvasProps {
  onProgressUpdate?: (progress: number) => void;
}

export const WaveGarmentCanvas: React.FC<WaveGarmentCanvasProps> = ({ onProgressUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeBeat, setActiveBeat] = useState<typeof TIMELINE_BEATS[0] | null>(null);
  const [waveAmplitude, setWaveAmplitude] = useState(0);

  // Smooth lerp state & velocity calculations
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const lastProgressRef = useRef(0);
  const velocityRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const frameLoader = FrameLoader.getInstance();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalScrollableHeight = rect.height - window.innerHeight;

      if (totalScrollableHeight <= 0) return;

      const progress = clamp(-rect.top / totalScrollableHeight, 0, 1);
      targetProgressRef.current = progress;

      if (onProgressUpdate) {
        onProgressUpdate(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    let startTime = performance.now();

    const renderLoop = (timeMs: number) => {
      // Lerp current progress towards target progress
      const prevProg = currentProgressRef.current;
      currentProgressRef.current = lerp(currentProgressRef.current, targetProgressRef.current, 0.08);
      
      // Calculate scroll velocity (speed of scroll motion)
      const deltaProg = currentProgressRef.current - prevProg;
      velocityRef.current = lerp(velocityRef.current, deltaProg * 800, 0.1);

      const normProgress = currentProgressRef.current;
      const frameIdx = clamp(Math.round(normProgress * (TOTAL_FRAMES - 1)), 0, TOTAL_FRAMES - 1);

      // Draw frame to canvas with liquid sine-wave distortion
      const subtleZoom = 1.0 + (normProgress * 0.04);
      frameLoader.drawWavyFrameToCanvas(
        ctx,
        canvas,
        frameIdx,
        velocityRef.current,
        timeMs,
        subtleZoom
      );

      setCurrentFrameIndex(frameIdx);
      setScrollProgress(normProgress);
      setWaveAmplitude(Math.abs(velocityRef.current));

      // Active beat matching
      const matchingBeat = TIMELINE_BEATS.find(
        (b) => normProgress >= b.start && normProgress <= b.end
      );
      setActiveBeat(matchingBeat || null);

      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    rafIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [onProgressUpdate]);

  return (
    <div ref={containerRef} id="cinematic-hero" className="wave-sequence-container">
      <div className="wave-sticky-viewport">
        {/* Background Ambient Fluid Glow */}
        <div className="fluid-ambient-aura" />

        {/* Liquid Sine-Wave Canvas Element */}
        <canvas ref={canvasRef} className="wave-canvas" />

        {/* Organic Wave Background SVG Line Accent */}
        <svg className="svg-background-wave-line" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            fill="none"
            stroke="rgba(212, 175, 55, 0.15)"
            strokeWidth="2"
            d="M0,160 C320,300 420,0 720,160 C1020,320 1120,20 1440,160"
          />
        </svg>

        {/* Live HUD Information */}
        <div className="wave-hud top-left">
          <span className="hud-eyebrow">SILK WAVE MOTION</span>
          <span className="hud-val">FRAME {String(currentFrameIndex + 1).padStart(3, '0')} / {TOTAL_FRAMES}</span>
        </div>

        <div className="wave-hud top-right">
          <span className="hud-eyebrow">LIQUID DISTORTION</span>
          <span className="hud-val">{waveAmplitude > 1 ? `RIPPLE: ${(waveAmplitude * 0.8).toFixed(1)}px` : 'FLOW: AMBIENT'}</span>
        </div>

        {/* Floating Wave Beat Card */}
        {activeBeat && (
          <div className={`wave-beat-card alignment-${activeBeat.alignment} fade-in-up`}>
            <div className="beat-badge">
              <Sparkles size={14} className="gold-icon" />
              <span>{activeBeat.label}</span>
            </div>
            <h2 className="beat-title">{activeBeat.sublabel}</h2>
            <p className="beat-desc">{activeBeat.description}</p>
          </div>
        )}

        {/* Sine Wave Progress Track at Viewport Bottom */}
        <div className="wave-progress-container">
          <div className="wave-progress-track">
            <div
              className="wave-progress-fill"
              style={{ width: `${(currentFrameIndex / (TOTAL_FRAMES - 1)) * 100}%` }}
            />
          </div>
          <div className="wave-track-labels">
            <span>01 PORTRAIT</span>
            <span>02 FORM</span>
            <span>03 SILHOUETTE</span>
            <span>04 HERITAGE</span>
          </div>
        </div>

        {/* Scroll Instruction */}
        {scrollProgress < 0.05 && (
          <div className="wave-scroll-hint animate-fade-pulse">
            <span>SCROLL TO RIPPLE SILK IN MOTION</span>
          </div>
        )}
      </div>
    </div>
  );
};
