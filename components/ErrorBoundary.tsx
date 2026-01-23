import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center p-4">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong.</h1>
                    <button
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold uppercase tracking-wider"
                        onClick={() => window.location.reload()}
                    >
                        Reload
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
