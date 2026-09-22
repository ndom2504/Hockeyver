import type { SkaterPosition } from '@/services/nhl/nhl.types';

export const POSITION_LABEL: Record<SkaterPosition, string> = {
  C: 'Centre',
  LW: 'Ailier gauche',
  RW: 'Ailier droit',
  D: 'Défenseur',
  G: 'Gardien',
};

export const POSITION_SHORT: Record<SkaterPosition, string> = {
  C: 'C',
  LW: 'AG',
  RW: 'AD',
  D: 'D',
  G: 'G',
};
