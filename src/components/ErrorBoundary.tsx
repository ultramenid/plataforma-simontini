import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  label: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Safety net for render-phase crashes in an independent functional area.
 * Not a replacement for async/event-handler error handling — those still need
 * their own try/catch and per-component state. Wrap per area so a single
 * component crash doesn't take the whole route down (CLAUDE.md engineering rules).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.label}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[120px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
          <div>
            <p className="mb-1 font-medium text-foreground">
              {this.props.label} failed to load.
            </p>
            <p className="text-[12px]">Other parts of the page are unaffected.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}