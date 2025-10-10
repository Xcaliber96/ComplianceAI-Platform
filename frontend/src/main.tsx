import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6da3e7' },     // pastel blue
    secondary: { main: '#f7c873' },   // soft pastel yellow
    background: { default: '#f8fbfe', paper: '#ffffff' },
    text: { primary: '#283a45', secondary: '#8190a5' }
  },
  shape: {
    borderRadius: 12   // rounded cards/buttons
  },
  typography: {
    fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
    fontSize: 16,
    h4: { fontWeight: 700, fontSize: 28 },
    h6: { fontWeight: 600, fontSize: 20 },
    body1: { fontWeight: 400, fontSize: 16 }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
