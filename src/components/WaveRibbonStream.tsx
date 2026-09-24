import React from 'react';
import { Sparkles, Eye } from 'lucide-react';

export const WaveRibbonStream: React.FC = () => {
  // Select key frames across the sequence for the cascading ribbon stream
  const waveFrames = [
    { id: 10, frame: '/frames/ezgif-frame-010.jpg', title: '01 / JEWEL COLLAR', offset: 'offset-up' },
    { id: 35, frame: '/frames/ezgif-frame-035.jpg', title: '02 / WATERCOLOR WASH', offset: 'offset-down' },
    { id: 70, frame: '/frames/ezgif-frame-070.jpg', title: '03 / CREPE TEXTURE', offset: 'offset-up' },
    { id: 110, frame: '/frames/ezgif-frame-110.jpg', title: '04 / BIAS SILHOUETTE', offset: 'offset-down' },
    { id: 145, frame: '/frames/ezgif-frame-145.jpg', title: '05 / FLUID MAXI DRAPE', offset: 'offset-up' },
    { id: 170, frame: '/frames/ezgif-frame-170.jpg', title: '06 / KINETIC SWEEP', offset: 'offset-down' },
  ];

  return (
    <section className="wave-ribbon-section">
      {/* Background SVG Sine Wave Path */}
      <svg className="ribbon-svg-wave" viewBox="0 0 1440 400" fill="none" preserveAspectRatio="none">
        <path
          d="M-100,200 C300,50 500,350 900,100 C1200,-50 1500,300 1800,200"
          stroke="url(#goldGradient)"
          strokeWidth="3"
          strokeDasharray="8 8"
        />
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#f5e4a8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      <div className="section-container">
        <div className="section-header center">
          <span className="section-chapter">CHAPTER 02 / THE RIBBON STREAM</span>
          <h2 className="section-title">THE SILK STREAM CASCADE</h2>
          <p className="section-subtitle">
            Frame-by-frame visual chronology cascading along a continuous mathematical wave.
          </p>
        </div>

        {/* Floating Wave Cards Stream */}
        <div className="ribbon-cards-stream">
          {waveFrames.map((item, idx) => (
            <div key={item.id} className={`ribbon-card-item ${item.offset}`}>
              <div className="ribbon-card-frame">
                <img src={item.frame} alt={item.title} className="ribbon-img" />
                <div className="ribbon-card-tag">{item.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
