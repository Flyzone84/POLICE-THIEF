import { Language } from '../shared/types';
import { EN_COPY, type AppCopy } from './en';
import { ML_COPY } from './ml';

export function getCopy(lang: Language): AppCopy {
  return lang === 'ml' ? ML_COPY : EN_COPY;
}

export { EN_COPY, ML_COPY };
export type { AppCopy };
