import React from 'react';

import { LoadingIndicator } from '@/ds';

import Canvas2DBlindRenderer from './Canvas2DBlindRenderer';
import { useVisualiserStore } from './useVisualiserStore';
const Canvas2DCurtainRenderer = React.lazy(() => import('./Canvas2DCurtainRenderer'));
// Opening and closing updates only the preview, without rerendering the options panel.
export function BlindWindowPreview(props: Omit<React.ComponentProps<typeof Canvas2DBlindRenderer>, 'rollPosition'>) {
  const position = useVisualiserStore(s => s.rollPosition);
  const dayPosition = useVisualiserStore(s => s.honeycombDayPosition);
  return <Canvas2DBlindRenderer {...props} rollPosition={position} honeycombDayPosition={dayPosition} />;
}
export function CurtainWindowPreview(props: Omit<React.ComponentProps<typeof Canvas2DCurtainRenderer>, 'openness'>) {
  const position = useVisualiserStore(s => s.rollPosition);
  return <React.Suspense fallback={<LoadingIndicator overlay label="Loading curtains" />}><Canvas2DCurtainRenderer {...props} openness={1 - position} /></React.Suspense>;
}
