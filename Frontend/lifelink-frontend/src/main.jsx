import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ArticlesProvider } from './context/ArticlesContext.jsx'
import { HospitalsProvider } from './context/HospitalsContext.jsx'
import { SystemSettingsProvider } from './context/SystemSettingsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SystemSettingsProvider>
      <AuthProvider>
        <ArticlesProvider>
          <HospitalsProvider>
            <App />
          </HospitalsProvider>
        </ArticlesProvider>
      </AuthProvider>
    </SystemSettingsProvider>
  </StrictMode>,
)
