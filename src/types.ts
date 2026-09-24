export interface TimelineBeat {
  id: string;
  start: number; // Normalized scroll progress 0 - 1
  end: number;
  label: string;
  sublabel: string;
  description: string;
  alignment: 'left' | 'center' | 'right';
}

export interface ProductDetails {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  material: string;
  composition: string;
  origin: string;
  sizes: string[];
  description: string;
  details: string[];
}
