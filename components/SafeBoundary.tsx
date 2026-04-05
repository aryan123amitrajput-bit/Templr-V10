import React, { Component, ErrorInfo, ReactNode } from 'react';
import SafePage from './SafePage';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class SafeBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleGlobalError = (event: ErrorEvent | PromiseRejectionEvent) => {
    let error: Error;
    if (event instanceof ErrorEvent) {
      error = event.error || new Error(event.message);
    } else {
      const reason = event.reason;
      error = reason instanceof Error ? reason : new Error(typeof reason === 'string' ? reason : 'Network or unknown error occurred');
    }
    
    // Only trigger full page error for critical network/fetch errors if desired,
    // but the prompt implies we want to show it for "Network Error Many Types of Error"
    const msg = error.message.toLowerCase();
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('timeout') || msg.includes('offline')) {
      this.setState({ hasError: true, error });
    }
  };

  public componentDidMount() {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleGlobalError);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleGlobalError);
  }

  public resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return <SafePage error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
    }

    return this.props.children;
  }
}

export default SafeBoundary;
