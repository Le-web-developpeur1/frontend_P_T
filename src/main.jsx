import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { SystemProvider } from './context/SystemContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SystemProvider>
          <App />
          <Toaster position="top-right" />
        </SystemProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)