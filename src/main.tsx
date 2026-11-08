import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.scss';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Check index.html for the root mount point.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
