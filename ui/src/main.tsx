import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import 'leaflet/dist/leaflet.css'
import './styles/index.css'
import App from './App.tsx'

async function prepareApp() {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser')
    return worker.start({
      onUnhandledRequest: 'bypass',
    })
  }

  // Register the PWA service worker only if we are not mocking
  // This prevents scope conflict with MSW
  const updateSW = registerSW({
    onNeedRefresh() {
      if (confirm('A new version of the map is available. Reload to update?')) {
        updateSW(true)
      }
    },
  })

  // Deregister any stale MSW service worker from a previous mock session.
  // Prevents intercepted requests when VITE_USE_MOCKS is toggled off.
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
      registrations
        .filter((r) => r.active?.scriptURL.includes('mockServiceWorker'))
        .map((r) => r.unregister()),
    )
  }
  return Promise.resolve()
}

prepareApp().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})
