import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { SessionProvider } from './context/SessionContext';
import './index.css';
import { AppThemeProvider } from './theme/AppThemeProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppThemeProvider>
      <SessionProvider>
        <App />
      </SessionProvider>
    </AppThemeProvider>
  </StrictMode>,
);
