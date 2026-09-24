import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

export const WaveFinaleFooter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

  return (
    <footer className="wave-footer-section">
      <div className="section-container">
        <div className="finale-banner">
          <span className="finale-eyebrow">THE FINALE</span>
          <h2 className="finale-statement">"MADE TO BE REMEMBERED."</h2>
          <p className="finale-subtext">
            Experience the confluence of fine art, botanical dyes, and fluid architectural fashion.
          </p>
        </div>

        {/* Newsletter Registry Box */}
        <div className="newsletter-card">
          <h3>JOIN THE PRIVATE ATELIER REGISTRY</h3>
          <p>Receive exclusive invitations to future private collection previews.</p>

          {!subscribed ? (
            <form onSubmit={handleSubmit} className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-btn">
                <span>SUBSCRIBE</span>
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <div className="newsletter-success">
              <Check size={18} />
              <span>WELCOME TO L'AURA D'ART PRIVATE REGISTRY</span>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="footer-columns-grid">
          <div className="brand-col">
            <span className="footer-logo">L'AURA D'ART</span>
            <p className="footer-desc">
              A haute-couture fashion house celebrating kinetic movement, botanical watercolor art, and pure mulberry silk.
            </p>
          </div>

          <div className="links-col">
            <h4>COLLECTIONS</h4>
            <ul>
              <li><a href="#cinematic-hero">Autumn Aquarelle 2026</a></li>
              <li><a href="#craftsmanship">Mulberry Silk Crepe</a></li>
              <li><a href="#atelier-lookbook">Lookbook No. 04</a></li>
              <li><a href="#">Archival Masterpieces</a></li>
            </ul>
          </div>

          <div className="links-col">
            <h4>BOUTIQUES</h4>
            <ul>
              <li><a href="#">Paris Flagship — Rue Saint-Honoré</a></li>
              <li><a href="#">Mumbai Atelier — Kala Ghoda</a></li>
              <li><a href="#">New York Salon — Fifth Avenue</a></li>
              <li><a href="#">Private Fitting Appointment</a></li>
            </ul>
          </div>

          <div className="links-col">
            <h4>ATELIER CLIENTELE</h4>
            <ul>
              <li><a href="#">Client Services</a></li>
              <li><a href="#">Shipping & Bespoke Delivery</a></li>
              <li><a href="#">Care Instructions</a></li>
              <li><a href="#">Authentication & Warranty</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-line">
          <p>© 2026 L'AURA D'ART PARIS S.A. ALL RIGHTS RESERVED.</p>
          <div className="legal-links">
            <a href="#">PRIVACY POLICY</a>
            <a href="#">TERMS OF COUTURE</a>
            <a href="#">COOKIES</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
