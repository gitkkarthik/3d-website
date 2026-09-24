import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';

export const HeroIntro: React.FC = () => {
  const handleScrollDown = () => {
    const target = document.getElementById('cinematic-hero');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-intro-section">
      <div className="hero-background-gradient" />
      <div className="hero-content">
        <div className="editorial-meta-badge">
          <Sparkles size={14} className="gold-icon" />
          <span>AUTUMN / WINTER HAUTE COUTURE 2026</span>
        </div>

        <h1 className="hero-headline">
          THE ART OF FABRIC
        </h1>

        <p className="hero-subhead">
          "CRAFTED TO MOVE."
        </p>

        <p className="hero-caption">
          An architectural study in hand-painted botanical watercolor silk crepe. 
          As you scroll, experience the garment unfold frame-by-frame.
        </p>

        <div className="scroll-indicator-container" onClick={handleScrollDown}>
          <span className="scroll-text">SCROLL TO DISCOVER</span>
          <div className="scroll-icon-wrapper">
            <ArrowDown className="animate-bounce" size={16} />
          </div>
        </div>
      </div>
    </section>
  );
};
