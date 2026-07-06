import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster position="top-right" richColors closeButton duration={3500} gap={8} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
