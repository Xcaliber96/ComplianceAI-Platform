// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material";

declare module "@mui/material/styles" {
  interface Palette {
    primary: Palette["primary"];
  }
  interface PaletteOptions {
    primary?: PaletteOptions["primary"];
  }
}

let theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#294936",
      dark: "#223D2D",
      light: "#EFF3EF",
      contrastText: "#FFFFFF",
    },

    secondary: {
      main: "#1A2D22",
    },

    background: {
      default: "#F8FAF9",
      paper: "#FFFFFF",
    },

    text: {
      primary: "#1A2D22",
      secondary: "#5D5D5D",
    },
  },

  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },

  shape: {
    borderRadius: 10,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "10px 20px",
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "#223D2D",
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          transition: "all 0.2s ease",
        },
      },
    },
  },
});

// Make all typography responsive
theme = responsiveFontSizes(theme);

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
