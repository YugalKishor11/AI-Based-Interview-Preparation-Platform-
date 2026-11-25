import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { validateEnv } from './config/env';
import './styles/index.css';

// Fail-fast environment validation at application boot
validateEnv();

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
