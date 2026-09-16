import { blindLabel, sizeLabel } from '@/core/pricing';
import type { QuoteItem } from '@/core/quoteItems';

import { isJoinery, type useVisualiserStore } from './useVisualiserStore';
import { wardrobeModelById, wardrobeHeight, walkInSpecifications, handleFinish } from '@/features/joinery';

type State = ReturnType<typeof useVisualiserStore.getState>;
export type VisualiserQuoteConfig = Pick<State, 'productCategory' | 'windows' | 'wardrobeModel'
  | 'wardrobeWidthMm' | 'wardrobeColour' | 'wardrobeHandleFinish'>;

export function selectQuoteConfig(state: State): VisualiserQuoteConfig {
  return {
    productCategory: state.productCategory, windows: state.windows,
    wardrobeModel: state.wardrobeModel, wardrobeWidthMm: state.wardrobeWidthMm,
    wardrobeColour: state.wardrobeColour, wardrobeHandleFinish: state.wardrobeHandleFinish,
  };
}

export function visualiserQuoteItems(state: VisualiserQuoteConfig): QuoteItem[] {
  if (isJoinery(state.productCategory)) {
    const model = wardrobeModelById(state.wardrobeModel);
    if (model.kind === 'walk-in') {
      const hardware = handleFinish(state.wardrobeHandleFinish);
      return [{ name: `Walk-in wardrobe — ${model.name}`, quantity: 1, options: [
        ...walkInSpecifications(model.id),
        { label: 'Finish', value: state.wardrobeColour },
        { label: 'Hardware', value: `${hardware.code} ${hardware.name}` },
      ] }];
    }
    return [{ name: `${state.productCategory === 'shelving' ? 'Shelving' : 'Wardrobe'} — ${model.name}`, quantity: 1,
      options: [
        { label: 'Width', value: `${state.wardrobeWidthMm} mm` },
        { label: 'Height', value: `${wardrobeHeight(model)} mm` },
        { label: 'Finish', value: state.wardrobeColour },
        { label: 'Hardware', value: state.wardrobeHandleFinish },
      ] }];
  }
  return state.windows.map((window, index) => {
    const isCurtain = state.productCategory === 'curtain';
    return {
      name: isCurtain ? `${window.curtainType === 'sheer' ? 'Sheer' : 'Blockout'} Curtains` : blindLabel(window.blindType),
      quantity: 1,
      options: [
        { label: 'Window', value: String(index + 1) },
        { label: 'Fabric', value: window.fabricColour },
        { label: 'Hardware', value: window.hardwareColour },
        { label: 'Size', value: isCurtain ? window.curtainSize : sizeLabel(window.windowSize) },
        { label: 'Operation', value: isCurtain ? window.curtainOperation : window.operation },
        ...(isCurtain ? [{ label: 'Mount', value: window.curtainMount }] : []),
      ],
    };
  });
}
