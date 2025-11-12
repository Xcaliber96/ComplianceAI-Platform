import React, { useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Stack,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Google, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithPopup,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "./firebaseConfig";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname.includes("localhost")
    ? "http://localhost:8000"
    : "https://api.nomioc.com");

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
const handleForgotPassword = async () => {
  if (!email) {
    setError("Please enter your email first.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    setSuccess("Password reset email sent! Check your inbox.");
    setError("");
  } catch (err: any) {
    let message = "Failed to send reset email.";
    if (err.code === "auth/invalid-email") message = "Please enter a valid email.";
    if (err.code === "auth/user-not-found") message = "No account found with this email.";
    setError(message);
    setSuccess("");
  }
};
  const handleEmailSignIn = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user?.email) throw new Error("No user found after sign-in");

      // Get Firebase token and create backend session
      const idToken = await user.getIdToken();
      const payload = {
        idToken,
        uid: user.uid,
        email: user.email,
      };
      const response = await fetch(`${BASE_URL}/session/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Handle specific server response errors
        if (response.status === 401) {
          throw new Error("Invalid email or password");
        } else if (response.status === 500) {
          throw new Error("Server error — please try again later");
        } else {
          throw new Error(`Unexpected error: ${response.status}`);
        }
      }

      setSuccess("Signed in successfully!");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
  let message = "Something went wrong. Please try again.";

  if (err.code) {
    switch (err.code) {
      case "auth/invalid-email":
        message = "Please enter a valid email address.";
        break;
      case "auth/user-not-found":
        message = "No account found with this email.";
        break;
      case "auth/wrong-password":
        message = "Incorrect password. Please try again.";
        break;
      case "auth/invalid-credential":
        message = "Invalid email or password.";
        break;
      default:
        message = "Authentication failed. Please try again.";
    }
  } else if (err.message?.includes("failed to fetch")) {
    message = "Server connection issue — please try again in a few seconds.";
  }

  setError(message);
  setSuccess("");
} finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      {/* 🌄 Left Side Image */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1670956007923-b78e45e011d8?auto=format&fit=crop&q=80&w=1600')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom right, rgba(0,0,0,0.6), rgba(0,0,0,0.3))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box textAlign="center" px={4}>
            <Typography
              variant="h3"
              sx={{
                color: "white",
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 800,
              }}
            >
              Welcome to NomiAI
            </Typography>
            <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.7)" }}>
              Simplify your compliance. Empower your business.
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* ✉️ Right Side – Sign-in Form */}
      <Grid
        item
        xs={12}
        md={6}
        component={Paper}
        elevation={6}
        square
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 4, md: 8 },
          backgroundColor: "#ffffff",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            textAlign="center"
            sx={{ mb: 2, color: "#333", fontFamily: "'Montserrat', sans-serif" }}
          >
            Sign In
          </Typography>
          <Typography
            variant="body2"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Access your dashboard securely
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Typography
              variant="body2"
              sx={{
                textAlign: "right",
                color: "#7F2458",
                cursor: "pointer",
                fontWeight: 500,
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={handleForgotPassword}
            >
              Forgot your password?
            </Typography>

            {success && <Alert severity="success">{success}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}

            <Button
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.4,
                mt: 1,
                background: "linear-gradient(90deg, #7F2458, #F15BB5)",
                fontWeight: 600,
                borderRadius: "8px",
                "&:hover": {
                  background: "linear-gradient(90deg, #F15BB5, #7F2458)",
                },
              }}
              onClick={handleEmailSignIn}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <Divider sx={{ my: 3 }}>or</Divider>

            <Button
              variant="outlined"
              startIcon={<Google />}
              fullWidth
              sx={{
                py: 1.2,
                borderRadius: "8px",
                textTransform: "none",
              }}
              // onClick={handleGoogleSignIn}
            >
              Sign in with Google
            </Button>

            <Typography
              variant="body2"
              textAlign="center"
              sx={{ mt: 3, color: "text.secondary" }}
            >
              Don’t have an account?{" "}
              <Link
                to="/signup"
                style={{
                  textDecoration: "none",
                  color: "#7F2458",
                  fontWeight: 600,
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Grid>
    </Grid>
  );
}
