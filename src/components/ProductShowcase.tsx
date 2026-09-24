import React, { useState } from 'react';
import { ShoppingBag, Check, Shield, Truck, RefreshCw } from 'lucide-react';

interface ProductShowcaseProps {
  onOpenShop: () => void;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({ onOpenShop }) => {
  const [selectedSize, setSelectedSize] = useState('S');
  const [activeImage, setActiveImage] = useState('/frames/ezgif-frame-001.jpg');
  const [addedToCart, setAddedToCart] = useState(false);

  const galleryThumbs = [
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

  return (
    <section id="atelier-lookbook" className="product-showcase-section">
      <div className="section-container">
        <div className="section-header center">
          <span className="section-chapter">CHAPTER 04 / THE COLLECTION</span>
          <h2 className="section-title">THE ATELIER LOOKBOOK</h2>
          <p className="section-subtitle">
            Limited numbered edition of 50 handcrafted pieces worldwide.
          </p>
        </div>

        <div className="product-grid">
          {/* Gallery Viewport */}
          <div className="product-gallery">
            <div className="main-image-viewport">
              <img src={activeImage} alt="Aquarelle Silk Maxi Dress" className="main-prod-img" />
              <div className="edition-badge">EDITION 12 / 50</div>
            </div>

            <div className="thumbs-row">
              {galleryThumbs.map((thumb, idx) => (
                <button
                  key={idx}
                  className={`thumb-btn ${activeImage === thumb ? 'active' : ''}`}
                  onClick={() => setActiveImage(thumb)}
                >
                  <img src={thumb} alt={`View ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details Card */}
          <div className="product-details-card">
            <div className="product-meta">
              <span className="product-category">AUTUMN 2026 HAUTE COUTURE</span>
              <h1 className="product-title">NO. 04 AQUARELLE SILK MAXI</h1>
              <div className="product-price">$1,850 USD</div>
            </div>

            <p className="product-tagline">
              Floor-length bias-cut silk dress adorned with hand-washed botanical watercolor artwork. Features 3/4 sleeves and a continuous fluid drape.
            </p>

            <div className="divider" />

            {/* Size Selector */}
            <div className="size-selector-block">
              <div className="size-header">
                <span>SELECT ATELIER SIZE</span>
                <button className="size-guide-btn">SIZE GUIDE & FITTING</button>
              </div>

              <div className="size-options">
                {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                  <button
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <button
              className={`primary-cta-btn large full-width ${addedToCart ? 'added' : ''}`}
              onClick={handleAddToCart}
            >
              {addedToCart ? (
                <>
                  <Check size={18} />
                  <span>ADDED TO ATELIER BAG</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  <span>ACQUIRE — $1,850 USD</span>
                </>
              )}
            </button>

            {/* Guarantees */}
            <div className="guarantees-grid">
              <div className="guarantee-item">
                <Truck size={16} />
                <span>Complimentary Express Worldwide Shipping</span>
              </div>
              <div className="guarantee-item">
                <Shield size={16} />
                <span>Certificate of Authenticity Included</span>
              </div>
              <div className="guarantee-item">
                <RefreshCw size={16} />
                <span>Private 14-Day Atelier Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
