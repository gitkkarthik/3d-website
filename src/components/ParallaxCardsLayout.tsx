import React, { useState } from 'react';
import { Sparkles, ArrowDown, ShoppingBag, Check, Shield, Truck, Eye, X, ZoomIn, ArrowRight } from 'lucide-react';

interface ParallaxCardsLayoutProps {
  onOpenShop: () => void;
}

export const ParallaxCardsLayout: React.FC<ParallaxCardsLayoutProps> = ({ onOpenShop }) => {
  const [selectedSize, setSelectedSize] = useState('S');
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeCraftTab, setActiveCraftTab] = useState<'dye' | 'weave' | 'cut'>('dye');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [activeLookbookImg, setActiveLookbookImg] = useState('/frames/ezgif-frame-001.jpg');

  const lookbookThumbs = [
    '/frames/ezgif-frame-001.jpg',
    '/frames/ezgif-frame-045.jpg',
    '/frames/ezgif-frame-090.jpg',
    '/frames/ezgif-frame-140.jpg',
    '/frames/ezgif-frame-174.jpg',
  ];

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      onOpenShop();
    }, 1000);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

  return (
    <div className="parallax-cards-container">
      {/* ----------------------------------------------------
          CARD 01: HERO OPENING
          ---------------------------------------------------- */}
      <section className="glass-card-section hero-card-section">
        <div className="glass-card hero-glass-card">
          <div className="card-badge">
            <Sparkles size={14} className="gold-icon" />
            <span>AUTUMN / WINTER HAUTE COUTURE</span>
          </div>

          <h1 className="hero-serif-title">
            THE ART OF FABRIC
          </h1>

          <p className="hero-serif-subtitle">
            "CRAFTED TO MOVE."
          </p>

          <p className="hero-body-text">
            An architectural study in hand-painted botanical watercolor silk crepe.
            Experience the 174-frame cinematic sequence flowing continuously behind.
          </p>

          <div className="hero-scroll-prompt">
            <span>SCROLL TO DISCOVER COLLECTION</span>
            <div className="scroll-icon-ring">
              <ArrowDown size={16} className="animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          CARD 02: FORM & KINETIC SILHOUETTE
          ---------------------------------------------------- */}
      <section className="glass-card-section">
        <div className="glass-card left-aligned">
          <span className="card-chapter">CHAPTER 01 / SILHOUETTE</span>
          <h2 className="card-title">KINETIC FORM & BOTANICAL ART</h2>
          <p className="card-description">
            Originating from a single bolt of hand-loomed mulberry silk crepe, each dress is colored using natural botanical pigments—indigo leaf, turmeric, and madder root. The fluid print mimics impressionistic oil paint suspended in water.
          </p>

          <div className="stats-inline-grid">
            <div className="stat-box">
              <span className="stat-num">100%</span>
              <span className="stat-lbl">Mulberry Silk</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">72 HRS</span>
              <span className="stat-lbl">Hand-Dyeing</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">N° 04</span>
              <span className="stat-lbl">Edition Cut</span>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          CARD 03: SAVOIR-FAIRE & CRAFTSMANSHIP
          ---------------------------------------------------- */}
      <section className="glass-card-section">
        <div className="glass-card right-aligned">
          <span className="card-chapter">CHAPTER 02 / SAVOIR-FAIRE</span>
          <h2 className="card-title">CRAFT & ARCHITECTURAL CUT</h2>

          <div className="craft-tab-pills">
            <button
              className={`craft-pill ${activeCraftTab === 'dye' ? 'active' : ''}`}
              onClick={() => setActiveCraftTab('dye')}
            >
              BOTANICAL DYE
            </button>
            <button
              className={`craft-pill ${activeCraftTab === 'weave' ? 'active' : ''}`}
              onClick={() => setActiveCraftTab('weave')}
            >
              19-MOMME SILK
            </button>
            <button
              className={`craft-pill ${activeCraftTab === 'cut' ? 'active' : ''}`}
              onClick={() => setActiveCraftTab('cut')}
            >
              45° BIAS CUT
            </button>
          </div>

          <div className="craft-tab-content fade-in">
            {activeCraftTab === 'dye' && (
              <p>
                Natural organic botanical pigments painted onto wet silk yarns. No two garments share the exact same chromatic flow, ensuring every creation is an unrepeatable masterpiece.
              </p>
            )}
            {activeCraftTab === 'weave' && (
              <p>
                High-density 19-momme Silk Crepe de Chine selected for its weightless drape, subtle matte luster, and light-diffusing twisted yarn texture.
              </p>
            )}
            {activeCraftTab === 'cut' && (
              <p>
                Cut on a 45-degree diagonal grain line, allowing the floor-skimming maxi skirt to contour effortlessly without rigid boning or constricting seams.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          CARD 04: ATELIER PRODUCT SHOWCASE
          ---------------------------------------------------- */}
      <section className="glass-card-section">
        <div className="glass-card product-glass-card">
          <div className="product-card-grid">
            <div className="product-card-media">
              <img src={activeLookbookImg} alt="Aquarelle Silk Maxi" className="product-card-img" />
              <div className="card-edition-tag">EDITION 12 / 50</div>

              <div className="lookbook-thumb-row">
                {lookbookThumbs.map((thumb, idx) => (
                  <button
                    key={idx}
                    className={`lookbook-thumb-btn ${activeLookbookImg === thumb ? 'active' : ''}`}
                    onClick={() => setActiveLookbookImg(thumb)}
                  >
                    <img src={thumb} alt={`Thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="product-card-info">
              <span className="card-chapter">CHAPTER 03 / THE COLLECTION</span>
              <h2 className="product-card-name">NO. 04 AQUARELLE SILK MAXI</h2>
              <div className="product-card-price">$1,850 USD</div>

              <p className="product-card-text">
                Floor-length bias-cut silk dress adorned with hand-washed botanical watercolor artwork. Features 3/4 sleeves and continuous fluid drape.
              </p>

              <div className="size-selector-block">
                <span className="size-label">SELECT ATELIER SIZE</span>
                <div className="size-buttons-row">
                  {['XS', 'S', 'M', 'L', 'XL'].map((sz) => (
                    <button
                      key={sz}
                      className={`size-square-btn ${selectedSize === sz ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(sz)}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className={`primary-cta-btn large full-width ${addedToCart ? 'added' : ''}`}
                onClick={handleAddToCart}
              >
                {addedToCart ? (
                  <>
                    <Check size={18} />
                    <span>ADDED TO BAG</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>ACQUIRE — $1,850 USD</span>
                  </>
                )}
              </button>

              <div className="guarantees-row">
                <div className="guarantee-chip">
                  <Truck size={14} />
                  <span>Complimentary Express Delivery</span>
                </div>
                <div className="guarantee-chip">
                  <Shield size={14} />
                  <span>Numbered Certificate of Authenticity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          CARD 05: FINALE & PRIVATE REGISTRY
          ---------------------------------------------------- */}
      <section className="glass-card-section finale-section">
        <div className="glass-card finale-glass-card">
          <span className="card-chapter">FINALE</span>
          <h2 className="finale-statement">"MADE TO BE REMEMBERED."</h2>
          <p className="finale-subtext">
            Join the L'Aura D'Art Private Registry for exclusive couture previews and bespoke commissions.
          </p>

          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="registry-form">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="registry-input"
              />
              <button type="submit" className="registry-btn">
                <span>REGISTER</span>
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <div className="registry-success">
              <Check size={18} />
              <span>CONFIRMED — PRIVATE REGISTRY ACCESS GRANTED</span>
            </div>
          )}

          <div className="footer-directory">
            <div className="dir-col">
              <h4>FLAGSHIP BOUTIQUES</h4>
              <p>PARIS — Rue Saint-Honoré</p>
              <p>MUMBAI — Kala Ghoda</p>
              <p>NEW YORK — Fifth Avenue</p>
            </div>
            <div className="dir-col">
              <h4>CLIENT SERVICES</h4>
              <p>Bespoke Tailoring</p>
              <p>Private Atelier Fitting</p>
              <p>Care & Preservation</p>
            </div>
            <div className="dir-col">
              <h4>ATELIER</h4>
              <p>© 2026 L'AURA D'ART PARIS S.A.</p>
              <p>ALL RIGHTS RESERVED</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
