import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/app/App'
import '@/styles/index.css'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { TypographyProvider } from '@/shared/typography/TypographyProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TypographyProvider>
        <App />
      </TypographyProvider>
    </ThemeProvider>
  </StrictMode>,
)
