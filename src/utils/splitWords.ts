import type { Word } from '../components/RevealWords';

export function splitWords(text: string): Word[] {
  return text.split(' ').map((word) => ({ text: word }));
}
