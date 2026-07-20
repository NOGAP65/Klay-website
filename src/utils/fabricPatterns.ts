import type { CSSProperties } from 'react';
import type { ProductType } from '../components/ProductVisual';

export function getFabricStyle(type: ProductType): CSSProperties {
  switch (type) {
    case 'blockout':
      return {
        backgroundColor: '#E8E4DE',
        backgroundImage:
          'repeating-linear-gradient(180deg, transparent 0px, transparent 8px, rgba(0,0,0,0.04) 8px, rgba(0,0,0,0.04) 9px)',
      };
    case 'sunscreen':
      return {
        backgroundColor: 'rgba(235,230,220,0.3)',
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(235,230,220,0.6) 0px, rgba(235,230,220,0.6) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(235,230,220,0.6) 0px, rgba(235,230,220,0.6) 1px, transparent 1px, transparent 4px)',
      };
    case 'dual':
      return {
        backgroundColor: 'rgba(220,215,205,0.8)',
        backgroundImage:
          'repeating-linear-gradient(180deg, #E8E4DE 0px, #E8E4DE 8px, rgba(0,0,0,0.04) 8px, rgba(0,0,0,0.04) 9px)',
      };
    case 'sheer':
      return {
        background:
          'repeating-linear-gradient(90deg, rgba(233,224,205,0.85) 0px, rgba(233,224,205,0.85) 6px, rgba(190,178,150,0.7) 14px, rgba(233,224,205,0.85) 22px)',
      };
    case 'shutter':
      return {
        background: 'repeating-linear-gradient(180deg, #fbf6ec 0px, #fbf6ec 10px, #b8a988 10px, #b8a988 14px)',
      };
    case 'outdoor':
    default:
      return {
        backgroundColor: 'rgba(58,50,34,0.85)',
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 2px, transparent 2px, transparent 6px), repeating-linear-gradient(90deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 2px, transparent 2px, transparent 6px)',
      };
  }
}
