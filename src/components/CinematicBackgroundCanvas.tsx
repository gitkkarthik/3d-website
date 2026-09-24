import React, { useEffect, useRef, useState } from 'react';
import { FrameLoader, TOTAL_FRAMES } from '../utils/FrameLoader';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface CinematicBackgroundCanvasProps {
  scrollY: number;
}

export const CinematicBackgroundCanvas: React.FC<CinematicBackgroundCanvasProps> = ({ scrollY }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const animFrameIdRef = useRef<number | null>(null);

  // Auto-play 174 frames continuously at ~30 FPS
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();
    const fps = 30;
    const interval = 1000 / fps;

    const loop = (currentTime: number) => {
      const delta = currentTime - lastTime;
      if (delta >= interval) {
        setFrameIndex((prev) => (prev + 1) % TOTAL_FRAMES);
        lastTime = currentTime - (delta % interval);
      }
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying]);

  // Draw frame to full-bleed canvas with subtle scroll parallax transform
  useEffect(() => {
    const frameLoader = FrameLoader.getInstance();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    // Calculate subtle vertical parallax offset based on window scrollY
    const parallaxOffset = scrollY * 0.15;
    const zoomScale = 1.05 + (scrollY * 0.0002); // Subtle scale zoom as user scrolls

    frameLoader.drawFrameToCanvas(ctx, canvas, frameIndex, zoomScale, -parallaxOffset);
  }, [frameIndex, scrollY]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="cinematic-bg-container">
      {/* Full-bleed HTML5 Canvas */}
      <canvas ref={canvasRef} className="fullbleed-canvas" />

      {/* Atmospheric Dark Luxury Vignette Overlay */}
      <div className="vignette-overlay" />

      {/* Minimal Floating Motion Player Controls */}
      <div className="motion-controls-pill">
        <button
          className="motion-btn"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause Motion' : 'Play Motion'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          <span className="btn-txt">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        <span className="control-divider" />

        <div className="frame-counter-hud">
          {String(frameIndex + 1).padStart(3, '0')} / {TOTAL_FRAMES}
        </div>

        <span className="control-divider" />

        <button
          className="motion-btn icon-only"
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Unmute Ambient Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Frame Scrubber Bar at Bottom of Screen */}
      <div className="bottom-frame-scrubber">
        <input
          type="range"
          min={0}
          max={TOTAL_FRAMES - 1}
          value={frameIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setFrameIndex(Number(e.target.value));
          }}
          className="scrubber-range"
        />
      </div>
    </div>
  );
};
