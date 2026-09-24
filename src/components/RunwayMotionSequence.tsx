import React, { useEffect, useRef, useState } from 'react';
import { FrameLoader, TOTAL_FRAMES } from '../utils/FrameLoader';
import { TIMELINE_BEATS } from '../utils/Timeline';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

export const RunwayMotionSequence: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startFrameRef = useRef(0);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const frameLoader = FrameLoader.getInstance();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      frameLoader.drawFrameToCanvas(ctx, canvas, frameIndex);
    };

    render();
  }, [frameIndex]);

  // Autoplay loop
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();
    const fps = 30 * playbackSpeed;
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
  }, [isPlaying, playbackSpeed]);

  // Drag scrubber handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startFrameRef.current = frameIndex;
    setIsPlaying(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    const sensitivity = 0.5; // Drag sensitivity
    const deltaFrames = Math.round(deltaX * sensitivity);
    let newFrame = (startFrameRef.current + deltaFrames) % TOTAL_FRAMES;
    if (newFrame < 0) newFrame += TOTAL_FRAMES;
    setFrameIndex(newFrame);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const normProgress = frameIndex / (TOTAL_FRAMES - 1);
  const activeBeat = TIMELINE_BEATS.find(
    (b) => normProgress >= b.start && normProgress <= b.end
  );

  return (
    <div className="runway-panel sequence-panel">
      <div className="panel-header">
        <span className="panel-num">PANEL 02</span>
        <h2 className="panel-title">KINEMATIC GARMENT SEQUENCE</h2>
        <p className="panel-subtitle">Drag horizontally or use controls to scrub 174 frames</p>
      </div>

      <div className="canvas-viewport-wrapper">
        <canvas
          ref={canvasRef}
          className="runway-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {/* Drag Hint Overlay */}
        <div className="drag-scrub-hint">↔ DRAG TO SCRUB MOTION</div>

        {/* HUD Frame Counter */}
        <div className="hud-badge top-right">
          FRAME {String(frameIndex + 1).padStart(3, '0')} / {TOTAL_FRAMES}
        </div>

        {/* Timeline Beat Overlay */}
        {activeBeat && (
          <div className="runway-beat-overlay fade-in">
            <div className="beat-hdr">
              <Sparkles size={14} className="gold-icon" />
              <span>{activeBeat.label}</span>
            </div>
            <h3>{activeBeat.sublabel}</h3>
            <p>{activeBeat.description}</p>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="sequence-controls-bar">
        <button
          className="control-btn play-btn"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          <span>{isPlaying ? 'PAUSE' : 'AUTOPLAY'}</span>
        </button>

        <div className="speed-toggle-group">
          {[0.5, 1, 2].map((spd) => (
            <button
              key={spd}
              className={`speed-btn ${playbackSpeed === spd ? 'active' : ''}`}
              onClick={() => setPlaybackSpeed(spd)}
            >
              {spd}X
            </button>
          ))}
        </div>

        <button className="control-btn" onClick={() => setFrameIndex(0)}>
          <RotateCcw size={16} />
          <span>RESET</span>
        </button>

        {/* Interactive Scrubber Slider */}
        <div className="scrubber-slider-wrapper">
          <input
            type="range"
            min={0}
            max={TOTAL_FRAMES - 1}
            value={frameIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setFrameIndex(Number(e.target.value));
            }}
            className="scrubber-input"
          />
        </div>
      </div>
    </div>
  );
};
