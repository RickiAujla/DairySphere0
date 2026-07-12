import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './providers/theme-provider';
import { ErrorBoundary } from './components/error-boundary';
import RootLayout from './components/layout/root-layout';
import GlobalLayout from './components/layout/global-layout';
import Dashboard from './pages/dashboard';
import NotFoundPage from './pages/not-found';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <BrowserRouter>
          <RootLayout>
            <GlobalLayout>
              <Routes>
                {/* Core route mappings */}
                <Route path="/" element={<Dashboard />} />
                
                {/* Catch-all 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </GlobalLayout>
          </RootLayout>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
