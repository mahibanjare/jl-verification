import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Apply the saved (or system) theme before first paint to avoid a flash.
(() => {
  try {
    const saved = localStorage.getItem('sheet-app-theme');
    const dark = saved
      ? saved === 'dark'
      : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', !!dark);
  } catch (e) { /* ignore */ }
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
