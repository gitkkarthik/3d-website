import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

export const RunwayFinale: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

  return (
    <div className="runway-panel finale-panel">
      <div className="finale-content">
        <span className="finale-eyebrow">THE FINALE</span>
        <h2 className="finale-title">"MADE TO BE REMEMBERED."</h2>
        <p className="finale-desc">
          Join the L'Aura D'Art Private Registry for exclusive couture previews and bespoke commissions.
        </p>

        {!subscribed ? (
          <form onSubmit={handleSubmit} className="finale-newsletter-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="finale-input"
            />
            <button type="submit" className="finale-btn">
              <span>REGISTER</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <div className="finale-success">
            <Check size={18} />
            <span>CONFIRMED — PRIVATE REGISTRY ACCESS GRANTED</span>
          </div>
        )}

        <div className="finale-links-row">
          <div className="f-col">
            <h4>BOUTIQUES</h4>
            <p>PARIS — Rue Saint-Honoré</p>
            <p>MUMBAI — Kala Ghoda</p>
            <p>NEW YORK — Fifth Avenue</p>
          </div>
          <div className="f-col">
            <h4>SERVICES</h4>
            <p>Bespoke Tailoring</p>
            <p>Private Atelier Fitting</p>
            <p>Care & Preservation</p>
          </div>
          <div className="f-col">
            <h4>ATELIER</h4>
            <p>© 2026 L'AURA D'ART</p>
            <p>ALL RIGHTS RESERVED</p>
          </div>
        </div>
      </div>
    </div>
  );
};
