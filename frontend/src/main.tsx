import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import App from '@/app/App';
import '@/i18n/config';
import 'leaflet/dist/leaflet.css';
import '@/styles/index.css';
import { DocumentLang } from '@/i18n/DocumentLang';
import { CompareSelectionProvider } from '@/app/context/CompareSelectionContext';
import { Toaster } from '@/app/components/ui/sonner';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <CompareSelectionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="relic-theme" disableTransitionOnChange>
        <DocumentLang />
        <App />
        <Toaster richColors closeButton position="top-right" />
      </ThemeProvider>
    </CompareSelectionProvider>
  </BrowserRouter>,
);
