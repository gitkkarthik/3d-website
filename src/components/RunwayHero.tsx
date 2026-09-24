import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface RunwayHeroProps {
  onExplore: () => void;
}

export const RunwayHero: React.FC<RunwayHeroProps> = ({ onExplore }) => {
  return (
    <div className="runway-panel hero-panel">
      <div className="hero-editorial-badge">
        <Sparkles size={14} className="gold-icon" />
        <span>HAUTE COUTURE ISSUE N° 04</span>
      </div>

      <div className="hero-main-title">
        <span className="eyebrow">THE RUNWAY COLLECTION</span>
        <h1 className="title-serif">L'AURA D'ART</h1>
        <p className="subtitle-italic">"AQUARELLE SILK IN MOTION"</p>
      </div>

      {/* Featured Cover Frame */}
      <div className="hero-cover-frame">
        <img
          src="/frames/ezgif-frame-001.jpg"
          alt="L'Aura D'Art Garment Cover"
          className="cover-img"
        />
        <div className="cover-glass-tag">
          <span>PARIS / MUMBAI</span>
          <span className="dot">•</span>
          <span>174 CINEMATIC FRAMES</span>
        </div>
      </div>

      <div className="hero-footer-hint" onClick={onExplore}>
        <span>SCROLL OR DRAG HORIZONTALLY TO EXPLORE</span>
        <ArrowRight size={16} className="hint-arrow" />
      </div>
    </div>
  );
};
