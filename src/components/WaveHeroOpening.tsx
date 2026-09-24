import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';

export const WaveHeroOpening: React.FC = () => {
  const handleScrollDown = () => {
    const elem = document.getElementById('cinematic-hero');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="wave-hero-section">
      <div className="wave-ambient-glow" />
      
      <div className="wave-hero-content">
        <div className="hero-badge">
          <Sparkles size={14} className="gold-icon" />
          <span>AUTUMN / WINTER HAUTE COUTURE</span>
        </div>

        <h1 className="hero-main-heading">
          THE ART OF FABRIC
        </h1>

        <p className="hero-sub-heading">
          "CRAFTED TO MOVE."
        </p>

        <p className="hero-description">
          An architectural study in hand-painted botanical watercolor silk crepe. 
          Simply scroll down to ripple the 174-frame liquid silk animation.
        </p>

        <div className="hero-scroll-btn" onClick={handleScrollDown}>
          <span>SCROLL TO DISCOVER</span>
          <div className="scroll-arrow-ring">
            <ArrowDown size={16} className="animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};
