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
  signInWithPopup,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "./firebaseConfig";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const handleEmailSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (!user?.email) throw new Error("No user found after sign-in");

      // ✅ Get Firebase token and create backend session
      const idToken = await user.getIdToken();
      await fetch("http://localhost:8000/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // allow cookies
        body: JSON.stringify({ idToken }),
      });

      setSuccess("✅ Signed in successfully!");
      setError("");

      // Redirect to dashboard
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
      setError(err.message);
      setSuccess("");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const idToken = await result.user.getIdToken();
      await fetch("http://localhost:8000/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });

      setSuccess("✅ Signed in with Google!");
      setError("");

      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
      setError(err.message);
      setSuccess("");
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
            />

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

            {success && <Alert severity="success">{success}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}

            <Button
              variant="contained"
              fullWidth
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
              Sign In
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
              onClick={handleGoogleSignIn}
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
