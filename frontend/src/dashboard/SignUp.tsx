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
} from "@mui/material";
import { Google } from "@mui/icons-material";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "./firebaseConfig";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleEmailSignUp = async () => {
    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await fetch("http://127.0.0.1:8000/add_user_to_gcs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      alert("✅ Account created successfully!");
      navigate("/signin");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await fetch("http://127.0.0.1:8000/add_user_to_gcs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: result.user.email }),
      });
      alert("✅ Signed up with Google!");
      navigate("/signin");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      {/* 🖼️ Left Side – Image */}
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
            background: "linear-gradient(to bottom right, rgba(0,0,0,0.6), rgba(0,0,0,0.3))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* ✅ Fixed Typography nesting */}
          <Box textAlign="center" px={4}>
            <Typography
              variant="h3"
              sx={{
                color: "white",
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 800,
              }}
            >
              Join NomiAI
            </Typography>
            <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.7)" }}>
              Start automating your compliance today.
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* ✉️ Right Side – Sign-up Form */}
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
            Create Account
          </Typography>
          <Typography
            variant="body2"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Get started with your secure dashboard
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
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              label="Confirm Password"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {error && (
              <Typography color="error" textAlign="center">
                {error}
              </Typography>
            )}

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
              onClick={handleEmailSignUp}
            >
              Sign Up
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
              onClick={handleGoogleSignUp}
            >
              Sign up with Google
            </Button>

            {/* ✨ Back to Sign In Link */}
            <Typography
              variant="body2"
              textAlign="center"
              sx={{ mt: 3, color: "text.secondary" }}
            >
              Already have an account?{" "}
              <Link
                to="/signin"
                style={{
                  textDecoration: "none",
                  color: "#7F2458",
                  fontWeight: 600,
                }}
              >
                Sign in
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Grid>
    </Grid>
  );
}
