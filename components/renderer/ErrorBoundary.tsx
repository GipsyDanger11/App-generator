'use client';
import React from 'react';

interface State { hasError: boolean; error: Error | null }
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: (err: Error) => React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error) { console.error('[Renderer] caught', error); }
  render() {
    if (this.state.hasError && this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}
