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
    main: '#3E2723', // deep brown (Bistre)
    light: '#5D4037',
    dark: '#1B1211',
    contrastText: '#FFFFFF' // off-white text
  },
  secondary: {
    main: '#FBC02D', // warm golden yellow
    light: '#FFEB3B',
    dark: '#C49000',
    contrastText: '#1B1211'
  },
  background: {
    default: '#f4f4f430', 
    paper: '#FFFFFF'
  },
  text: {
    primary: '#2C1A18',
    secondary: '#5E503F'
  },
  divider: 'rgba(0,0,0,0.1)'
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

        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
   
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',

        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#ffffff',
          color: '#1f2d3d',
      
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