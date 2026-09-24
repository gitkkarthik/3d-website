import React from 'react';
import { X, ArrowRight, ShieldCheck, Lock } from 'lucide-react';

interface AtelierDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AtelierDrawer: React.FC<AtelierDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="drawer-overlay">
      <div className="drawer-content fade-in-right">
        <div className="drawer-header">
          <div>
            <h3>YOUR ATELIER BAG</h3>
            <span className="drawer-sub font-mono">1 ITEM SELECTED</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="drawer-item-card">
          <img src="/frames/ezgif-frame-001.jpg" alt="Item Preview" className="drawer-item-img" />
          <div className="drawer-item-info">
            <h4>NO. 04 AQUARELLE SILK MAXI</h4>
            <p className="item-specs">SIZE: SMALL | BOTANICAL COUTURE</p>
            <p className="item-specs">100% ORGANIC MULBERRY SILK</p>
            <div className="item-price">$1,850 USD</div>
          </div>
        </div>

        <div className="drawer-summary">
          <div className="summary-row">
            <span>SUBTOTAL</span>
            <span>$1,850 USD</span>
          </div>
          <div className="summary-row">
            <span>INSURED ATELIER SHIPPING</span>
            <span className="gold-text">COMPLIMENTARY</span>
          </div>
          <div className="summary-row total">
            <span>TOTAL ESTIMATE</span>
            <span>$1,850 USD</span>
          </div>

          <div className="security-note">
            <Lock size={14} />
            <span>256-Bit Encrypted Atelier Checkout</span>
          </div>

          <button className="primary-cta-btn large full-width" onClick={() => alert('Proceeding to Bespoke Atelier Checkout...')}>
            <span>PROCEED TO SECURE CHECKOUT</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
