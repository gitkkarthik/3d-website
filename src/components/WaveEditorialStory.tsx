import React, { useState } from 'react';
import { Sparkles, Feather, Layers } from 'lucide-react';

export const WaveEditorialStory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dye' | 'weave' | 'cut'>('dye');

  return (
    <section id="product-story" className="wave-story-section">
      <div className="section-container">
        {/* Editorial Story Layout */}
        <div className="wave-editorial-grid">
          <div className="wave-col-left">
            <span className="section-chapter">CHAPTER 03 / THE SAVOIR-FAIRE</span>
            <h2 className="wave-big-quote">
              "MADE FROM MATERIALS THAT DESERVE TO MOVE LIKE LIQUID SILK."
            </h2>
          </div>

          <div className="wave-col-right">
            <p className="wave-paragraph dropcap">
              Every garment in the <em>Aquarelle Couture Series</em> originates from a single bolt of hand-loomed mulberry silk crepe. Colored using botanical pigments—indigo, madder root, marigold, and saffron—the fluid print mimics impressionistic oil paint suspended in water.
            </p>

            <p className="wave-paragraph">
              As the wearer moves, the structural 45° bias-cut silhouette captures ambient light, turning static fabric into a living kinetic wave sculpture.
            </p>

            <div className="wave-stats-row">
              <div className="stat-item">
                <span className="stat-number">100%</span>
                <span className="stat-label">Mulberry Silk</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">72 HRS</span>
                <span className="stat-label">Artisan Hand-Dye</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">NO. 04</span>
                <span className="stat-label">Runway Silhouette</span>
              </div>
            </div>
          </div>
        </div>

        {/* Craftsmanship Wave Display */}
        <div id="craftsmanship" className="wave-craft-block">
          <div className="craft-tabs-centered">
            <button
              className={`wave-craft-tab ${activeTab === 'dye' ? 'active' : ''}`}
              onClick={() => setActiveTab('dye')}
            >
              <Sparkles size={16} />
              <span>BOTANICAL DYEING</span>
            </button>

            <button
              className={`wave-craft-tab ${activeTab === 'weave' ? 'active' : ''}`}
              onClick={() => setActiveTab('weave')}
            >
              <Feather size={16} />
              <span>19-MOMME SILK WEAVE</span>
            </button>

            <button
              className={`wave-craft-tab ${activeTab === 'cut' ? 'active' : ''}`}
              onClick={() => setActiveTab('cut')}
            >
              <Layers size={16} />
              <span>45° BIAS ARCHITECTURE</span>
            </button>
          </div>

          <div className="craft-card-viewport">
            {activeTab === 'dye' && (
              <div className="craft-grid-inner fade-in">
                <div className="craft-img-frame">
                  <img src="/frames/ezgif-frame-035.jpg" alt="Botanical Dye" className="craft-img" />
                  <div className="macro-tag">MACRO 10X — PIGMENT BLOOM</div>
                </div>
                <div className="craft-text">
                  <h3>Aquarelle Botanical Wash</h3>
                  <p>
                    Natural indigo, turmeric, and madder root pigments painted directly onto wet silk yarns. The organic dye creates fluid watercolor gradients across the surface that ripple gracefully as the dress moves.
                  </p>
                  <ul>
                    <li>Zero harsh synthetic chemical fixatives</li>
                    <li>Luminous lightfast botanical dyes</li>
                    <li>Unrepeatable handmade chromatic flow</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'weave' && (
              <div className="craft-grid-inner fade-in">
                <div className="craft-img-frame">
                  <img src="/frames/ezgif-frame-080.jpg" alt="19-Momme Silk" className="craft-img" />
                  <div className="macro-tag">WEAVE SPEC — 19 MOMME</div>
                </div>
                <div className="craft-text">
                  <h3>19-Momme Mulberry Silk Crepe</h3>
                  <p>
                    Selected for its weightless drape and muted matte luster. The twisted crepe yarn absorbs ambient light, preventing harsh glare while maintaining resilient strength.
                  </p>
                  <ul>
                    <li>High tensile resilience silk crepe</li>
                    <li>Hypoallergenic natural skin touch</li>
                    <li>Fluid weightless drape under motion</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'cut' && (
              <div className="craft-grid-inner fade-in">
                <div className="craft-img-frame">
                  <img src="/frames/ezgif-frame-150.jpg" alt="45 Degree Bias Cut" className="craft-img" />
                  <div className="macro-tag">CUT ANGLE — 45° BIAS</div>
                </div>
                <div className="craft-text">
                  <h3>Architectural 45° Bias Cut</h3>
                  <p>
                    Patterned diagonally across the fabric grain, allowing the dress to expand and contract naturally around the body without rigid boning or constricting seams.
                  </p>
                  <ul>
                    <li>3/4 tailored sleeves with hidden French seams</li>
                    <li>Floor-skimming maxi hemline</li>
                    <li>Effortless kinetic movement</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
