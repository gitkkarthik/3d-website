import React, { useState } from 'react';
import { ShoppingBag, Check, Shield, Truck } from 'lucide-react';

interface WaveProductSectionProps {
  onOpenShop: () => void;
}

export const WaveProductSection: React.FC<WaveProductSectionProps> = ({ onOpenShop }) => {
  const [selectedSize, setSelectedSize] = useState('S');
  const [added, setAdded] = useState(false);
  const [activeThumb, setActiveThumb] = useState('/frames/ezgif-frame-001.jpg');

  const thumbs = [
    '/frames/ezgif-frame-001.jpg',
    '/frames/ezgif-frame-045.jpg',
    '/frames/ezgif-frame-090.jpg',
    '/frames/ezgif-frame-140.jpg',
    '/frames/ezgif-frame-174.jpg',
  ];

  const handleAcquire = () => {
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onOpenShop();
    }, 1000);
  };

  return (
    <section id="atelier-lookbook" className="wave-product-section">
      <div className="section-container">
        <div className="section-header center">
          <span className="section-chapter">CHAPTER 04 / THE COLLECTION</span>
          <h2 className="section-title">THE ATELIER LOOKBOOK</h2>
          <p className="section-subtitle">
            Limited numbered edition of 50 handcrafted pieces worldwide.
          </p>
        </div>

        <div className="wave-product-grid">
          <div className="product-media-column">
            <div className="main-media-frame">
              <img src={activeThumb} alt="Aquarelle Silk Maxi" className="main-product-img" />
              <div className="edition-tag">EDITION 12 / 50</div>
            </div>

            <div className="thumbs-strip">
              {thumbs.map((tb, idx) => (
                <button
                  key={idx}
                  className={`thumb-item ${activeThumb === tb ? 'active' : ''}`}
                  onClick={() => setActiveThumb(tb)}
                >
                  <img src={tb} alt={`View ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="product-info-column">
            <span className="info-eyebrow">AUTUMN 2026 HAUTE COUTURE</span>
            <h1 className="product-name">NO. 04 AQUARELLE SILK MAXI</h1>
            <div className="product-price">$1,850 USD</div>

            <p className="product-description">
              Floor-length 45° bias-cut silk dress adorned with hand-washed botanical watercolor artwork. Features 3/4 sleeves and continuous fluid drape.
            </p>

            <div className="size-selector-box">
              <span className="size-title">SELECT ATELIER SIZE</span>
              <div className="size-pills-row">
                {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                  <button
                    key={size}
                    className={`size-pill-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <button
              className={`primary-cta-btn large full-width ${added ? 'added' : ''}`}
              onClick={handleAcquire}
            >
              {added ? (
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

            <div className="guarantees-column">
              <div className="guarantee-row">
                <Truck size={16} />
                <span>Complimentary Express Worldwide Shipping</span>
              </div>
              <div className="guarantee-row">
                <Shield size={16} />
                <span>Certificate of Authenticity Included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
