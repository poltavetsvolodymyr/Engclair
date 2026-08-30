import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/components/App'

import './styles/tokens.css'
// Must come after tokens.css: theme blocks share its specificity and win on
// source order.
import './styles/themes.css'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
