import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import PatientApp from './patient/PatientApp.jsx'

// The caregiver app (App.jsx) manages its own screens with internal state
// rather than URL routes, so it's mounted as-is under the catch-all "/*"
// route below and behaves exactly as it did before this split. Only the
// new, separate patient app gets its own URL prefix, so a caregiver's
// tablet can be pointed at /patient directly.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/patient/*" element={<PatientApp />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
