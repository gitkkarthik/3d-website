import React, { useState } from 'react';
import { Sparkles, Layers, Feather } from 'lucide-react';

export const Craftsmanship: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dye' | 'weave' | 'cut'>('dye');

  return (
    <section id="craftsmanship" className="craftsmanship-section">
      <div className="section-container">
        <div className="section-header center">
          <span className="section-chapter">CHAPTER 03 / SAVOIR-FAIRE</span>
          <h2 className="section-title">THE ART OF CRAFTSMANSHIP</h2>
          <p className="section-subtitle">
            An intersection of traditional textile heritage and modern architectural draping.
          </p>
        </div>

        {/* Interactive Craftsmanship Detail Cards */}
        <div className="craft-tabs">
          <button
            className={`craft-tab-btn ${activeTab === 'dye' ? 'active' : ''}`}
            onClick={() => setActiveTab('dye')}
          >
            <Sparkles size={16} />
            <span>BOTANICAL DYEING</span>
          </button>
          
          <button
            className={`craft-tab-btn ${activeTab === 'weave' ? 'active' : ''}`}
            onClick={() => setActiveTab('weave')}
          >
            <Feather size={16} />
            <span>SILK WEAVE</span>
          </button>

          <button
            className={`craft-tab-btn ${activeTab === 'cut' ? 'active' : ''}`}
            onClick={() => setActiveTab('cut')}
          >
            <Layers size={16} />
            <span>BIAS ARCHITECTURE</span>
          </button>
        </div>

        <div className="craft-display-card">
          {activeTab === 'dye' && (
            <div className="craft-detail-grid fade-in">
              <div className="craft-image-frame">
                <img
                  src="/frames/ezgif-frame-035.jpg"
                  alt="Watercolor Botanical Silk Detail"
                  className="craft-preview-img"
                />
                <div className="magnifier-badge">MACRO DETAIL 10X</div>
              </div>
              <div className="craft-info">
                <h3>Aquarelle Pigment Wash</h3>
                <p>
                  Each piece features unique watercolor floral strokes painted directly onto wet silk threads before weaving. No two garments share the exact same chromatic flow, making every piece an exclusive couture artwork.
                </p>
                <ul className="craft-bullet-list">
                  <li>Natural organic plant dyes (Indigo, Turmeric, Rubia Tinctorum)</li>
                  <li>Zero synthetic harsh fixatives</li>
                  <li>Deep chromatic luster with high lightfastness</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'weave' && (
            <div className="craft-detail-grid fade-in">
              <div className="craft-image-frame">
                <img
                  src="/frames/ezgif-frame-080.jpg"
                  alt="Silk Crepe Weave Detail"
                  className="craft-preview-img"
                />
                <div className="magnifier-badge">WEAVE SPEC 19 MOMME</div>
              </div>
              <div className="craft-info">
                <h3>19-Momme Silk Crepe de Chine</h3>
                <p>
                  Selected for its luxurious drape, muted sheen, and incredible tensile resilience. The twisted crepe yarn absorbs ambient light gracefully, preventing harsh glare under camera lenses.
                </p>
                <ul className="craft-bullet-list">
                  <li>Weightless 19-momme density</li>
                  <li>Breathable year-round temperature regulation</li>
                  <li>Hypoallergenic skin touch feel</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'cut' && (
            <div className="craft-detail-grid fade-in">
              <div className="craft-image-frame">
                <img
                  src="/frames/ezgif-frame-150.jpg"
                  alt="Tailored Silhouette Drape Detail"
                  className="craft-preview-img"
                />
                <div className="magnifier-badge">DRAPE ANGLE 45°</div>
              </div>
              <div className="craft-info">
                <h3>Architectural 45° Bias Cut</h3>
                <p>
                  Cut diagonally across the grain of the fabric, allowing the dress to expand and contract naturally around the body without restrictive zip structures or rigid boning.
                </p>
                <ul className="craft-bullet-list">
                  <li>3/4 tailored sleeves with hidden French seams</li>
                  <li>Fluid floor-skimming maxi hemline</li>
                  <li>Effortless slip-on comfort with tailored fit</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
