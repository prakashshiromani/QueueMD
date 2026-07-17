import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import ToastProvider from "./components/providers/ToastProvider";
import ErrorBoundary from "./components/providers/ErrorBoundary";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider />
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
