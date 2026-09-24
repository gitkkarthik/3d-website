import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, Sparkles } from 'lucide-react';

interface NavbarProps {
  scrollProgress: number;
  onOpenShop: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ scrollProgress, onOpenShop }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className={`navbar-container ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          <div className="nav-left">
            <a href="#" className="brand-logo">
              L'AURA D'ART
            </a>
            <span className="brand-tagline">PARIS / MUMBAI</span>
          </div>

          <nav className="nav-center desktop-only">
            <button onClick={() => scrollToSection('cinematic-hero')} className="nav-link">
              01 / CAMPAIGN
            </button>
            <button onClick={() => scrollToSection('product-story')} className="nav-link">
              02 / THE STORY
            </button>
            <button onClick={() => scrollToSection('craftsmanship')} className="nav-link">
              03 / CRAFT
            </button>
            <button onClick={() => scrollToSection('atelier-lookbook')} className="nav-link">
              04 / ATELIER
            </button>
          </nav>

          <div className="nav-right">
            <button className="bag-btn" onClick={onOpenShop}>
              <ShoppingBag size={18} />
              <span className="bag-text">ATELIER BAG (1)</span>
            </button>
            
            <button
              className="mobile-menu-trigger mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Dynamic Timeline Scroll Progress Bar */}
        <div className="nav-progress-track">
          <div
            className="nav-progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, scrollProgress * 100))}%` }}
          />
        </div>
      </header>

      {/* Mobile Slide-Over Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay">
          <div className="mobile-nav-content">
            <div className="mobile-nav-header">
              <span className="brand-logo">L'AURA D'ART</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="mobile-nav-links">
              <button onClick={() => scrollToSection('cinematic-hero')}>01 — CAMPAIGN REVEAL</button>
              <button onClick={() => scrollToSection('product-story')}>02 — THE STORY</button>
              <button onClick={() => scrollToSection('craftsmanship')}>03 — CRAFT & TEXTURE</button>
              <button onClick={() => scrollToSection('atelier-lookbook')}>04 — ATELIER SHOWCASE</button>
            </div>

            <div className="mobile-nav-footer">
              <p>THE AQUARELLE SILK COLLECTION</p>
              <button className="primary-cta-btn full-width" onClick={() => { setMobileMenuOpen(false); onOpenShop(); }}>
                INQUIRE ATELIER
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
