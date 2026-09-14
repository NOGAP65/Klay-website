import React from 'react';
import { useVisualiserStore } from './useVisualiserStore';
import Canvas2DBlindRenderer from './Canvas2DBlindRenderer';
const Canvas2DCurtainRenderer = React.lazy(() => import('./Canvas2DCurtainRenderer'));
// Opening and closing updates only the preview, without rerendering the options panel.
export function BlindWindowPreview(props: Omit<React.ComponentProps<typeof Canvas2DBlindRenderer>, 'rollPosition'>) {
  const position = useVisualiserStore(s => s.rollPosition);
  return <Canvas2DBlindRenderer {...props} rollPosition={position} />;
}
export function CurtainWindowPreview(props: Omit<React.ComponentProps<typeof Canvas2DCurtainRenderer>, 'openness'>) {
  const position = useVisualiserStore(s => s.rollPosition);
  return <React.Suspense fallback={<img src={props.photoUrl} alt="" style={{ display: 'block', width: '100%' }} />}><Canvas2DCurtainRenderer {...props} openness={1 - position} /></React.Suspense>;
}
