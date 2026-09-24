import React, { useRef, useEffect, useState } from 'react';
import { RunwayHero } from './RunwayHero';
import { RunwayMotionSequence } from './RunwayMotionSequence';
import { RunwayMacroHotspots } from './RunwayMacroHotspots';
import { RunwayCraftStory } from './RunwayCraftStory';
import { RunwayProductCard } from './RunwayProductCard';
import { RunwayFinale } from './RunwayFinale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalRunwayProps {
  onOpenShop: () => void;
}

export const HorizontalRunway: React.FC<HorizontalRunwayProps> = ({ onOpenShop }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Convert vertical mouse wheel into horizontal scroll
    const handleWheel = (e: WheelEvent) => {
      // If user is inside a scrollable modal, let default happen
      if ((e.target as HTMLElement).closest('.macro-modal-content')) return;

      e.preventDefault();
      container.scrollLeft += e.deltaY * 1.2 + e.deltaX * 1.2;
    };

    const handleScroll = () => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll > 0) {
        setScrollProgress(container.scrollLeft / maxScroll);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToNext = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: window.innerWidth * 0.85, behavior: 'smooth' });
    }
  };

  const scrollToPrev = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -window.innerWidth * 0.85, behavior: 'smooth' });
    }
  };

  return (
    <div className="horizontal-runway-wrapper">
      {/* Top Track Progress */}
      <div className="runway-top-progress-track">
        <div
          className="runway-top-progress-fill"
          style={{ width: `${Math.min(100, scrollProgress * 100)}%` }}
        />
      </div>

      {/* Floating Side Arrow Controls */}
      <button className="runway-arrow-btn left" onClick={scrollToPrev} aria-label="Previous Panel">
        <ChevronLeft size={24} />
      </button>

      <button className="runway-arrow-btn right" onClick={scrollToNext} aria-label="Next Panel">
        <ChevronRight size={24} />
      </button>

      {/* Main Horizontal Runway Container */}
      <div ref={containerRef} className="horizontal-runway-container">
        {/* Panel 01 — Cover */}
        <RunwayHero onExplore={scrollToNext} />

        {/* Panel 02 — Motion Canvas Player */}
        <RunwayMotionSequence />

        {/* Panel 03 — Macro Hotspots */}
        <RunwayMacroHotspots />

        {/* Panel 04 — Editorial Magazine Spread */}
        <RunwayCraftStory />

        {/* Panel 05 — Atelier Product Card */}
        <RunwayProductCard onOpenShop={onOpenShop} />

        {/* Panel 06 — Finale Editorial */}
        <RunwayFinale />
      </div>
    </div>
  );
};
