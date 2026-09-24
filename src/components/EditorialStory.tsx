import React from 'react';

export const EditorialStory: React.FC = () => {
  return (
    <section id="product-story" className="editorial-story-section">
      <div className="section-container">
        <div className="editorial-grid">
          <div className="editorial-col-left">
            <span className="section-chapter">CHAPTER 02 / THE PHILOSOPHY</span>
            <h2 className="editorial-big-quote">
              "MADE FROM MATERIALS THAT DESERVE TO BE SEEN IN MOTION."
            </h2>
          </div>

          <div className="editorial-col-right">
            <p className="editorial-paragraph dropcap">
              Every garment in the <em>Aquarelle Couture Series</em> originates from a single bolt of hand-loomed mulberry silk crepe. Colored using botanical pigments—indigo, madder root, marigold, and saffron—the fluid print mimics impressionistic oil paint suspended in water.
            </p>

            <p className="editorial-paragraph">
              As the wearer moves, the structural 45° bias-cut silhouette captures ambient light, turning static fabric into a living 3D kinetic sculpture.
            </p>

            <div className="editorial-stats-row">
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
                <span className="stat-label">Edition Silhouette</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
