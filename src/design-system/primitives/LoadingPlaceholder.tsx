import { tokens } from '../tokens';

import type { CSSProperties } from 'react';


import './loadingPlaceholder.css';

/** Reserve space immediately; reveal the skeleton only if the real content is still waiting. */
export function LoadingPlaceholder({ label = 'Loading content', layout = 'split', isPage = false }: {
  label?: string; layout?: 'split' | 'rows' | 'text'; isPage?: boolean;
}) {
  const style = {
    '--loading-paper': tokens.paper, '--loading-shape': tokens.band,
    '--loading-highlight': tokens.card, '--loading-font': tokens.body,
  } as CSSProperties;
  return <div className={`loading-placeholder${isPage ? ' loading-placeholder-page' : ''}`} style={style}
    role="status" aria-label={label} aria-busy="true">
    <div className={`loading-placeholder-content loading-placeholder-${layout}`} aria-hidden="true">
      <div className="loading-placeholder-heading" />
      <div className="loading-placeholder-caption" />
      <div className="loading-placeholder-body">
        {layout === 'split' && <div className="loading-placeholder-image" />}
        <div className="loading-placeholder-fields">
          <div /><div /><div />
          <div className="loading-placeholder-action" />
        </div>
      </div>
    </div>
  </div>;
}
