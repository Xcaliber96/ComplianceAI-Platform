import React, { useCallback } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Divider,
} from "@mui/material";
import { Google } from "@mui/icons-material";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "./firebaseConfig.ts";
import { listenForUser } from "./userListener";

export default function SignIn() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleEmailSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (!user || !user.email) throw new Error("No user found after sign-in");

      const userEmail = user.email;
      const resp = await fetch("http://127.0.0.1:8000/add_user_to_gcs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!resp.ok) throw new Error(`Backend error: ${resp.status}`);
      console.log("Synced user:", userEmail);
      listenForUser();
      alert("Signed in successfully & GCS access assigned!");
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;
      await fetch("http://127.0.0.1:8000/add_user_to_gcs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      alert("✅ Signed in with Google & GCS access assigned!");
    } catch (err: any) {
      console.error("❌ Google sign-in error:", err);
      setError(err.message);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* 🖼️ Background Image */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "url('https://images.unsplash.com/photo-1670956007923-b78e45e011d8?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=1632')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "brightness(0.6)", // darken for readability
          zIndex: 0,
        }}
      />

      {/* 🖤 Gradient Overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(to bottom right, rgba(0,0,0,0.7), rgba(0,0,0,0.4))",
          zIndex: 1,
        }}
      />

      {/* 🔹 Sign-In Form */}
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ position: "relative", zIndex: 2 }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 5,
            width: 400,
            borderRadius: 4,
            backdropFilter: "blur(16px)",
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
          }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            mb={2}
            textAlign="center"
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              color: "#fff",
            }}
          >
            Welcome Back
          </Typography>

          <Typography
            variant="body2"
            color="rgba(255,255,255,0.7)"
            textAlign="center"
            mb={4}
          >
            Sign in to your ComplianceAI account
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                  "&:hover fieldset": { borderColor: "#00D1FF" },
                },
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
              }}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                  "&:hover fieldset": { borderColor: "#00D1FF" },
                },
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
              }}
            />

            {error && (
              <Typography variant="body2" color="#ff6f61" textAlign="center">
                {error}
              </Typography>
            )}

            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{
                mt: 2,
                py: 1.2,
                background:
                  "linear-gradient(90deg, #00D1FF 0%, #F15BB5 100%)",
                color: "#fff",
                fontWeight: 600,
                borderRadius: "50px",
                "&:hover": {
                  background:
                    "linear-gradient(90deg, #F15BB5 0%, #00D1FF 100%)",
                },
              }}
              onClick={handleEmailSignIn}
            >
              Sign In
            </Button>

            <Divider
              sx={{
                my: 3,
                color: "rgba(255,255,255,0.5)",
                "&::before, &::after": { borderColor: "rgba(255,255,255,0.3)" },
              }}
            >
              or
            </Divider>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<Google />}
              onClick={handleGoogleSignIn}
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.4)",
                "&:hover": {
                  borderColor: "#00D1FF",
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              Sign in with Google
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
