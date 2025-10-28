import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import { Google } from '@mui/icons-material';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './firebaseConfig.ts';
import { listenForUser } from './userListener';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user || !user.email) throw new Error('No user found after sign-in');

      const userEmail = user.email;

      const resp = await fetch('http://127.0.0.1:8000/add_user_to_gcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(`Backend error: ${resp.status} → ${msg}`);
      }

      console.log('Synced user:', userEmail);
      listenForUser(); 

      alert('Signed in successfully & GCS access assigned!');
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;

      await fetch('http://127.0.0.1:8000/add_user_to_gcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      alert('✅ Signed in with Google & GCS access assigned!');
    } catch (err: any) {
      console.error('❌ Google sign-in error:', err);
      setError(err.message);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
    >
      <Paper elevation={4} sx={{ p: 5, width: 380, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={600} mb={2} textAlign="center">
          Welcome Back 👋
        </Typography>

        <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
          Sign in to your ComplianceAI account
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <Typography variant="body2" color="error" textAlign="center">
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 1 }}
            onClick={handleEmailSignIn}
          >
            Sign In
          </Button>

          <Divider sx={{ my: 2 }}>or</Divider>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<Google />}
            onClick={handleGoogleSignIn}
          >
            Sign in with Google
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
