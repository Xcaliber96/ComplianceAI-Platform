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
  sendPasswordResetEmail,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "./firebaseConfig";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname.includes("localhost")
    ? "http://localhost:8000"
    : "https://api.nomioc.com");

export default function SignIn() {
  // console.log("🔥 FRONTEND FIREBASE PROJECT:", auth.app.options.projectId);
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
      if (err.code === "auth/invalid-email") message = "Invalid email format.";
      if (err.code === "auth/user-not-found")
        message = "No account found with this email.";
      setError(message);
      setSuccess("");
    }
  };

  const handleEmailSignIn = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      if (!user?.email) throw new Error("No user returned.");

      const idToken = await user.getIdToken(true);
      const payload = { idToken, uid: user.uid, email: user.email };

      localStorage.setItem("user_uid", user.uid);
      localStorage.setItem("user_email", user.email);

      const response = await fetch(`${BASE_URL}/session/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Invalid email or password.");
        if (response.status === 500) throw new Error("Server error — try again later.");
        throw new Error("Unexpected error occurred.");
      }

      // Successful login
      setSuccess("Signed in successfully!");

      // Check profile completeness
      try {
        const profileRes = await fetch(
          `${BASE_URL}/api/users/profile/${user.uid}`,
          { credentials: "include" }
        );

        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (!profile.department || profile.department.trim() === "") {
            return navigate("/dashboard/Onboarding");
          }
        }
      } catch (e) {
        console.warn("Profile check failed", e);
      }
      
      console.log("FRONTEND FIREBASE PROJECT:", auth.app.options.projectId);
      
      return navigate("/dashboard");
    } catch (err: any) {
      let message = "Something went wrong. Please try again.";
      if (err.code === "auth/invalid-email") message = "Invalid email.";
      if (err.code === "auth/user-not-found") message = "User not found.";
      if (err.code === "auth/wrong-password") message = "Incorrect password.";
      if (err.code === "auth/invalid-credential") message = "Invalid login.";
      if (err.message?.includes("failed to fetch"))
        message = "Cannot reach server. Try again later.";

      setError(message);
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      
      {/* LEFT SIDE — Brand panel with gradient */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 6,
        }}
      >
        <Box textAlign="left" maxWidth={420}>
          <Typography
            variant="overline"
            sx={{ color: "#94a3b8", letterSpacing: 2 }}
          >
            NOMIAI PLATFORM
          </Typography>

          <Typography
            variant="h3"
            sx={{
              color: "white",
              fontWeight: 800,
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            Compliance made simple.
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: "#cbd5e1",
              fontWeight: 400,
              maxWidth: 380,
            }}
          >
            Sign in to access your workspace, manage audits, and streamline compliance.
          </Typography>
        </Box>
      </Grid>

      {/* RIGHT SIDE — Form */}
      <Grid
        item
        xs={12}
        md={6}
        component={Paper}
        elevation={0}
        square
        sx={{
          backgroundColor: "#ffffff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 6,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 420 }}>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ mb: 1, color: "#0f172a" }}
          >
            Welcome back
          </Typography>

          <Typography variant="body2" sx={{ mb: 4, color: "#64748b" }}>
            Sign in to continue to your dashboard
          </Typography>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEmailSignIn();
            }}
          >
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
                  color: "#0f172a",
                  cursor: "pointer",
                  fontWeight: 600,
                  "&:hover": { textDecoration: "underline" },
                }}
                onClick={handleForgotPassword}
              >
                Forgot your password?
              </Typography>

              {success && <Alert severity="success">{success}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}

              {/* SIGN IN BUTTON */}
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.4,
                  mt: 1,
                  backgroundColor: "#0f172a",
                  fontWeight: 700,
                  color: "white",
                  borderRadius: "10px",
                  "&:hover": {
                    backgroundColor: "#020617",
                  },
                }}
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
                  borderRadius: "10px",
                  textTransform: "none",
                  borderColor: "#cbd5e1",
                  color: "#0f172a",
                  "&:hover": {
                    borderColor: "#0f172a",
                    backgroundColor: "#f8fafc",
                  },
                }}
              >
                Sign in with Google
              </Button>

              <Typography
                variant="body2"
                textAlign="center"
                sx={{ mt: 3, color: "#64748b" }}
              >
                Don’t have an account?{" "}
                <Link
                  to="/signup"
                  style={{
                    textDecoration: "none",
                    color: "#0f172a",
                    fontWeight: 600,
                  }}
                >
                  Sign up
                </Link>
              </Typography>
            </Stack>
          </form>
        </Box>
      </Grid>
    </Grid>
  );
}
