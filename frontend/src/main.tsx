import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BrowserRouter } from 'react-router-dom'  
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  responsiveFontSizes
} from '@mui/material'

// Create refined, elegant theme
let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4A90E2', // refined blue
      light: '#81b4f7',
      dark: '#2767b2',
      contrastText: '#fff'
    },
    secondary: {
      main: '#FFC15E', // warm amber accent
      light: '#ffd280',
      dark: '#e6a53a',
      contrastText: '#333'
    },
    background: {
      default: '#f4f7fb', // soft gray-blue background
      paper: '#ffffff'
    },
    text: {
      primary: '#1f2d3d',
      secondary: '#607181'
    },
    divider: 'rgba(0,0,0,0.08)'
  },

  shape: {
    borderRadius: 10
  },

  typography: {
    fontFamily: `'Inter', 'Segoe UI', Roboto, Arial, sans-serif`,
    h1: { fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontSize: 26, fontWeight: 600 },
    h6: { fontSize: 20, fontWeight: 600 },
    subtitle1: { fontSize: 16, color: '#607181' },
    body1: { fontSize: 16, fontWeight: 400, lineHeight: 1.6 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: 0.2
    }
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          transition: 'all 0.2s ease',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(74,144,226,0.25)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.08)'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#ffffff',
          color: '#1f2d3d',
          boxShadow: '0 1px 6px rgba(0,0,0,0.08)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12
        }
      }
    }
  }
})

// Make fonts responsive for different screen sizes
theme = responsiveFontSizes(theme)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>  {/* ✅ Wrap your App here */}
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)