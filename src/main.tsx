import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'

// biome-ignore lint/style/noNonNullAssertion: The root element is guaranteed to be present in the HTML
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
