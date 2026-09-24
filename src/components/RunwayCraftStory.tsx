import React from 'react';
import { Feather, ShieldCheck, Sparkles } from 'lucide-react';

export const RunwayCraftStory: React.FC = () => {
  return (
    <div className="runway-panel craft-panel">
      <div className="panel-header">
        <span className="panel-num">PANEL 04</span>
        <h2 className="panel-title">EDITORIAL & SAVOIR-FAIRE</h2>
        <p className="panel-subtitle">Handmade in Paris & Mumbai with organic botanicals</p>
      </div>

      <div className="editorial-magazine-spread">
        <div className="magazine-col-quote">
          <blockquote className="runway-big-quote">
            "A SILK COUTURE SILHOUETTE IS NOT MERELY WORN; IT IS AN ARCHITECTURE OF FLUID MOTION."
          </blockquote>
          <span className="quote-author">— ATELIER DESIGN DIRECTOR</span>
        </div>

        <div className="magazine-col-text">
          <p className="dropcap-text">
            Each <em>Aquarelle Silk Midi</em> requires over 72 hours of meticulous hand-dyeing and precision 45° bias tailoring. Organic mulberry silk crepe is treated with natural botanical pigments—extracts of indigo leaf, turmeric root, and madder plant.
          </p>

          <p>
            When illuminated under runway spotlighting, the twisted silk yarn subtly diffuses glare, creating an impressionistic glow that follows every stride.
          </p>

          <div className="craft-metrics-grid">
            <div className="metric-card">
              <span className="metric-val">100%</span>
              <span className="metric-lbl">Mulberry Silk Crepe</span>
            </div>
            <div className="metric-card">
              <span className="metric-val">72 HRS</span>
              <span className="metric-lbl">Artisan Hand-Dye</span>
            </div>
            <div className="metric-card">
              <span className="metric-val">N° 04</span>
              <span className="metric-lbl">Runway Edition</span>
            </div>
          </div>
        </div>

        <div className="magazine-col-visual">
          <img src="/frames/ezgif-frame-120.jpg" alt="Craft Visual Spread" className="magazine-visual-img" />
          <div className="visual-caption">RUNWAY AUTUMN 2026 — LOOK N° 04</div>
        </div>
      </div>
    </div>
  );
};
