import { TimelineBeat } from '../types';

export const TIMELINE_BEATS: TimelineBeat[] = [
  {
    id: 'portrait',
    start: 0.02,
    end: 0.22,
    label: '01 / PORTRAIT',
    sublabel: 'THE ART OF FABRIC',
    description: 'A striking portrait introduction to hand-dyed organic mulberry silk.',
    alignment: 'left'
  },
  {
    id: 'texture',
    start: 0.25,
    end: 0.48,
    label: '02 / FORM',
    sublabel: 'AQUARELLE FLORAL MOTIF',
    description: 'Layered watercolor pigments washed across textured silk crepe.',
    alignment: 'right'
  },
  {
    id: 'drape',
    start: 0.52,
    end: 0.76,
    label: '03 / SILHOUETTE',
    sublabel: 'SCULPTURAL TAILORING',
    description: 'Precision darting seamlessly contours from bust to fluid skirt.',
    alignment: 'left'
  },
  {
    id: 'motion',
    start: 0.80,
    end: 0.98,
    label: '04 / MOVEMENT',
    sublabel: 'CRAFTED TO BE REMEMBERED',
    description: 'An architectural maxi silhouette designed for weightless motion.',
    alignment: 'center'
  }
];

export function lerp(start: number, end: number, amt: number): number {
  return (1 - amt) * start + amt * end;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
