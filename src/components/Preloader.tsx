import React, { useEffect, useState } from 'react';
import { FrameLoader } from '../utils/FrameLoader';

interface PreloaderProps {
  onComplete: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const frameLoader = FrameLoader.getInstance();
    frameLoader.preloadAll((pct) => {
      setProgress(pct);
    }).then(() => {
      setIsReady(true);
    });
  }, []);

  const handleStart = () => {
    setFadeOut(true);
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  return (
    <div className={`preloader-overlay ${fadeOut ? 'preloader-fade-out' : ''}`}>
      <div className="preloader-content">
        <div className="brand-monogram">L'AURA</div>
        <div className="editorial-subtitle">HAUTE COUTURE AUTOMNE</div>

        <div className="preloader-counter">
          <span className="counter-number">{progress}</span>
          <span className="counter-percent">%</span>
        </div>

        <div className="preloader-bar-bg">
          <div
            className="preloader-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="preloader-status-text">
          {!isReady ? (
            <span>PREPARING THE COLLECTION — 174 CINEMATIC FRAMES</span>
          ) : (
            <button className="preloader-enter-btn" onClick={handleStart}>
              EXPLORE THE COLLECTION ↓
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
