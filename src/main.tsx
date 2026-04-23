import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// React の初回描画完了後にスプラッシュをフェードアウト
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const splash = document.getElementById('splash')
    if (!splash) return
    splash.style.transition = 'opacity 0.5s ease-out'
    splash.style.opacity = '0'
    setTimeout(() => splash.remove(), 500)
  })
})
