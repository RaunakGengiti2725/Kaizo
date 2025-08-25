import { Component, ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Recipes runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-2">Something went wrong.</h2>
          <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-auto">
            {String(this.state.error?.message || 'Unknown error')}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

