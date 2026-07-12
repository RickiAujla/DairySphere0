import * as React from 'react';
import ErrorPage from '../pages/error';

interface Props {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // @ts-ignore
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled React Error trapped by Boundary:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: undefined });
  };

  public render() {
    const state = (this as any).state;
    const props = (this as any).props;
    
    if (state.hasError) {
      if (props.fallback) {
        return props.fallback;
      }
      return <ErrorPage error={state.error} reset={this.handleReset} />;
    }

    return props.children;
  }
}
export default ErrorBoundary;
