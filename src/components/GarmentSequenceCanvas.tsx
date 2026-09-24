import React, { useEffect, useRef, useState } from 'react';
import { FrameLoader, TOTAL_FRAMES } from '../utils/FrameLoader';
import { TIMELINE_BEATS, lerp, clamp } from '../utils/Timeline';
import { Sparkles, Layers, Eye } from 'lucide-react';

interface GarmentSequenceCanvasProps {
  onProgressUpdate?: (progress: number) => void;
}

export const GarmentSequenceCanvas: React.FC<GarmentSequenceCanvasProps> = ({ onProgressUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeBeat, setActiveBeat] = useState<typeof TIMELINE_BEATS[0] | null>(null);

  // Smooth lerp state refs
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
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

      const frameIdx = Math.floor(currentProgressRef.current * (TOTAL_FRAMES - 1));
      frameLoader.drawFrameToCanvas(ctx, canvas, frameIdx);
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

    // Render loop with ultra-smooth lerp smoothing (0.07 smoothing factor)
    const renderLoop = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0001) {
        currentProgressRef.current = lerp(currentProgressRef.current, targetProgressRef.current, 0.07);
      } else {
        currentProgressRef.current = targetProgressRef.current;
      }

      const normProgress = currentProgressRef.current;
      const frameIdx = clamp(Math.round(normProgress * (TOTAL_FRAMES - 1)), 0, TOTAL_FRAMES - 1);

      // Draw high-DPI canvas frame with subtle zoom depth
      const subtleZoom = 1.0 + (normProgress * 0.035);
      frameLoader.drawFrameToCanvas(ctx, canvas, frameIdx, subtleZoom);

      setCurrentFrameIndex(frameIdx);
      setScrollProgress(normProgress);

      // Match timeline beat
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

  // Click handler to jump directly to a timeline beat moment
  const jumpToBeat = (startProgress: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const containerTop = window.scrollY + rect.top;
    const totalScrollableHeight = rect.height - window.innerHeight;
    const targetScrollY = containerTop + (startProgress * totalScrollableHeight);
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  };

  return (
    <div ref={containerRef} id="cinematic-hero" className="sticky-sequence-container">
      <div className="sticky-viewport">
        {/* Dynamic Dual-Tone Atmospheric Backlight Aura */}
        <div className="aura-glow-effect primary-aura" />
        <div className="aura-glow-effect secondary-aura" />

        {/* High-Performance Canvas Rendering Viewport */}
        <canvas ref={canvasRef} className="garment-canvas" />

        {/* Live HUD Metadata Overlays */}
        <div className="sequence-hud top-left">
          <span className="hud-label">CAMPAIGN TIMELINE</span>
          <span className="hud-val">
            FRAME {String(currentFrameIndex + 1).padStart(3, '0')} / {TOTAL_FRAMES}
          </span>
        </div>

        <div className="sequence-hud top-right">
          <span className="hud-label">CINEMATIC RESOLUTION</span>
          <span className="hud-val">720 × 1280 • 9:16 SILK</span>
        </div>

        {/* Dynamic Glassmorphic Typography Beat Card */}
        {activeBeat && (
          <div className={`beat-overlay-card alignment-${activeBeat.alignment} fade-in-up`}>
            <div className="beat-header">
              <Sparkles size={14} className="gold-icon" />
              <span className="beat-label">{activeBeat.label}</span>
            </div>
            <h2 className="beat-title">{activeBeat.sublabel}</h2>
            <p className="beat-desc">{activeBeat.description}</p>
          </div>
        )}

        {/* Interactive Timeline Progress Bar */}
        <div className="timeline-indicator-bar">
          <div className="timeline-track">
            <div
              className="timeline-progress"
              style={{ width: `${(currentFrameIndex / (TOTAL_FRAMES - 1)) * 100}%` }}
            />
          </div>
          <div className="timeline-markers">
            {TIMELINE_BEATS.map((beat) => (
              <div
                key={beat.id}
                className={`timeline-marker ${
                  scrollProgress >= beat.start && scrollProgress <= beat.end ? 'active' : ''
                }`}
                style={{ left: `${beat.start * 100}%` }}
                onClick={() => jumpToBeat(beat.start)}
                title={`Jump to ${beat.label}`}
              >
                <span className="marker-dot" />
                <span className="marker-text">{beat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Instruction Overlay */}
        {scrollProgress < 0.05 && (
          <div className="sequence-scroll-hint animate-fade-pulse">
            <span>SCROLL TO PROGRESS MOTION SEQUENCE</span>
          </div>
        )}
      </div>
    </div>
  );
};
