// StrictMode desactivado temporalmente para evitar doble ejecución de efectos
// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ThemeProvider from './components/ThemeProvider'
import { BrandingProvider } from './contexts/BrandingContext'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <BrandingProvider>
      <App />
    </BrandingProvider>
  </ThemeProvider>
)
