import { Component, type ReactNode } from 'react';
import { tokens } from '@/ds';

/** Keeps site navigation usable if a lazy chunk or page renderer fails. */
export class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main role="alert" style={{ minHeight: '65vh', padding: '140px 5vw 64px', background: tokens.paper, color: tokens.ink }}>
      <h1 style={{ fontFamily: tokens.display }}>This page couldn’t load.</h1>
      <p>Please reload the page to try again. Your saved basket is still available.</p>
      <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '12px 24px', background: tokens.accent, color: tokens.onAccent }}>Reload page</button>
    </main>;
  }
}
