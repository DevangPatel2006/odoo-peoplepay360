import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './store';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ui/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
