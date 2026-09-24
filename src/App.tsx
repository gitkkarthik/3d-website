import React, { useState } from 'react';
import { Preloader } from './components/Preloader';
import { Navbar } from './components/Navbar';
import { HeroIntro } from './components/HeroIntro';
import { GarmentSequenceCanvas } from './components/GarmentSequenceCanvas';
import { EditorialStory } from './components/EditorialStory';
import { Craftsmanship } from './components/Craftsmanship';
import { ProductShowcase } from './components/ProductShowcase';
import { ClosingEditorial } from './components/ClosingEditorial';
import { AtelierDrawer } from './components/AtelierDrawer';

export function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [sequenceProgress, setSequenceProgress] = useState(0);
  const [isShopOpen, setIsShopOpen] = useState(false);

  return (
    <div className="app-root v1-cinematic-mode">
      {isLoading ? (
        <Preloader onComplete={() => setIsLoading(false)} />
      ) : (
        <>
          <Navbar
            scrollProgress={sequenceProgress}
            onOpenShop={() => setIsShopOpen(true)}
          />

          <main className="main-content">
            {/* Section 01 — Opening Hero */}
            <HeroIntro />

            {/* Section 02 — Pinned Cinematic Garment Reveal (174 Frames Sticky Viewport) */}
            <GarmentSequenceCanvas onProgressUpdate={setSequenceProgress} />

            {/* Section 03 — Product Story */}
            <EditorialStory />

            {/* Section 04 — Fabric & Craftsmanship */}
            <Craftsmanship />

            {/* Section 05 — Product Lookbook Showcase */}
            <ProductShowcase onOpenShop={() => setIsShopOpen(true)} />

            {/* Section 06 — Closing & Luxury Footer */}
            <ClosingEditorial />
          </main>

          {/* Atelier Shopping Bag Drawer */}
          <AtelierDrawer isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
        </>
      )}
    </div>
  );
}

export default App;
