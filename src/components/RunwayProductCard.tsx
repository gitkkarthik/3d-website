import React, { useState } from 'react';
import { ShoppingBag, Check, Shield, Truck } from 'lucide-react';

interface RunwayProductCardProps {
  onOpenShop: () => void;
}

export const RunwayProductCard: React.FC<RunwayProductCardProps> = ({ onOpenShop }) => {
  const [selectedSize, setSelectedSize] = useState('S');
  const [added, setAdded] = useState(false);
  const [activeThumb, setActiveThumb] = useState('/frames/ezgif-frame-001.jpg');

  const thumbs = [
    '/frames/ezgif-frame-001.jpg',
    '/frames/ezgif-frame-045.jpg',
    '/frames/ezgif-frame-090.jpg',
    '/frames/ezgif-frame-140.jpg',
    '/frames/ezgif-frame-174.jpg'
  ];

  const handleAcquire = () => {
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onOpenShop();
    }, 1000);
  };

  return (
    <div className="runway-panel product-panel">
      <div className="panel-header">
        <span className="panel-num">PANEL 05</span>
        <h2 className="panel-title">ATELIER SHOWCASE</h2>
        <p className="panel-subtitle">Limited numbered edition of 50 handcrafted pieces</p>
      </div>

      <div className="runway-product-card-inner">
        <div className="card-media">
          <img src={activeThumb} alt="Product Look" className="card-hero-img" />
          <div className="card-thumb-bar">
            {thumbs.map((tb, idx) => (
              <button
                key={idx}
                className={`card-tb-btn ${activeThumb === tb ? 'active' : ''}`}
                onClick={() => setActiveThumb(tb)}
              >
                <img src={tb} alt={`Thumb ${idx + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="card-content">
          <span className="card-cat">HAUTE COUTURE 2026</span>
          <h3 className="card-name">NO. 04 AQUARELLE SILK MAXI</h3>
          <div className="card-price">$1,850 USD</div>

          <p className="card-desc">
            Floor-length 45° bias-cut silk dress adorned with hand-washed botanical watercolor artwork. Designed for fluid motion.
          </p>

          <div className="card-size-section">
            <span className="size-lbl">SELECT SIZE</span>
            <div className="size-pills">
              {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                <button
                  key={size}
                  className={`size-pill ${selectedSize === size ? 'active' : ''}`}
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

          <div className="card-features">
            <div className="feat-item">
              <Truck size={14} />
              <span>Complimentary Worldwide Express Delivery</span>
            </div>
            <div className="feat-item">
              <Shield size={14} />
              <span>Numbered Certificate of Authenticity</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
