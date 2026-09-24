import React, { useState } from 'react';
import { Eye, X, ZoomIn } from 'lucide-react';

interface Hotspot {
  id: string;
  x: number; // percentage
  y: number;
  title: string;
  category: string;
  framePath: string;
  description: string;
  specs: string[];
}

export const RunwayMacroHotspots: React.FC = () => {
  const [activeModal, setActiveModal] = useState<Hotspot | null>(null);

  const hotspots: Hotspot[] = [
    {
      id: 'bodice',
      x: 48,
      y: 28,
      title: 'Aquarelle Neckline & Collar',
      category: 'PORTRAIT DETAIL',
      framePath: '/frames/ezgif-frame-015.jpg',
      description: 'Precision jewel-neckline finished with invisible French silk bias binding to contour the collarbone naturally.',
      specs: ['100% Hand-Dyed Silk', 'Seamless Shoulder Darting', 'Soft Matte Finish']
    },
    {
      id: 'waist',
      x: 52,
      y: 45,
      title: 'Botanical Watercolor Wash',
      category: 'PIGMENT DETAIL',
      framePath: '/frames/ezgif-frame-060.jpg',
      description: 'Suspended watercolor pigments blooming in indigo, violet, and saffron gold across textured 19-momme silk crepe.',
      specs: ['Botanical Plant Dyes', 'Unique One-of-a-Kind Motif', 'High Color Depth']
    },
    {
      id: 'hem',
      x: 55,
      y: 78,
      title: 'Floor-Sweeping Bias Hemline',
      category: 'DRAPE DETAIL',
      framePath: '/frames/ezgif-frame-155.jpg',
      description: 'Cut on a 45° diagonal grain for weightless architectural motion as the model steps forward on the runway.',
      specs: ['45° Architectural Bias Cut', 'Fluid Kinetic Drape', 'Hand-Rolled Hem']
    }
  ];

  return (
    <div className="runway-panel hotspots-panel">
      <div className="panel-header">
        <span className="panel-num">PANEL 03</span>
        <h2 className="panel-title">INTERACTIVE MACRO HOTSPOTS</h2>
        <p className="panel-subtitle">Click the golden pins to inspect high-resolution textile details</p>
      </div>

      <div className="hotspots-spread">
        <div className="hotspots-image-container">
          <img
            src="/frames/ezgif-frame-080.jpg"
            alt="Garment Hotspot Interactive Map"
            className="hotspots-base-img"
          />

          {/* Hotspot Pins */}
          {hotspots.map((spot) => (
            <button
              key={spot.id}
              className="hotspot-pin-btn"
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              onClick={() => setActiveModal(spot)}
            >
              <span className="pin-pulse" />
              <span className="pin-core">
                <ZoomIn size={14} />
              </span>
              <span className="pin-label">{spot.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail Modal Popup */}
      {activeModal && (
        <div className="macro-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="macro-modal-content fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
              <X size={20} />
            </button>

            <div className="modal-grid">
              <div className="modal-img-wrapper">
                <img src={activeModal.framePath} alt={activeModal.title} className="modal-img" />
                <div className="zoom-tag">MACRO LENS 10X</div>
              </div>

              <div className="modal-info">
                <span className="modal-category">{activeModal.category}</span>
                <h3 className="modal-title">{activeModal.title}</h3>
                <p className="modal-desc">{activeModal.description}</p>

                <div className="modal-specs">
                  <h4>SPECIFICATIONS</h4>
                  <ul>
                    {activeModal.specs.map((sp, idx) => (
                      <li key={idx}>— {sp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
