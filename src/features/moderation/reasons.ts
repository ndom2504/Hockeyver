import type { ReportReason } from '@/types/social';

export const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: 'spam', label: 'Spam' },
  { id: 'offensive', label: 'Contenu offensant' },
  { id: 'harassment', label: 'Harcèlement' },
  { id: 'offtopic', label: 'Contenu hors sujet' },
  { id: 'other', label: 'Autre' },
];
