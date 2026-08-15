import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import './styles.css'

const container = document.getElementById('root')
if (!container) throw new Error('The #root element is missing from index.html.')

createRoot(container).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
