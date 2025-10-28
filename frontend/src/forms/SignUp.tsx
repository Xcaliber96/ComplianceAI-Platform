import React, { useState } from 'react'
import { auth } from './firebaseConfig'
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Divider
} from '@mui/material'
import { Google } from '@mui/icons-material'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'


export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailSignUp = async () => {
    setError('')
    setLoading(true)
    try {
      // Create user with email + password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName: name })
      alert('✅ Account created successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError('')
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      alert('✅ Signed up with Google successfully!')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
    >
      <Paper
        elevation={4}
        sx={{
          p: 5,
          width: 400,
          borderRadius: 3,
          boxShadow: '0 6px 18px rgba(0,0,0,0.08)'
        }}
      >
        <Typography variant="h5" fontWeight={600} mb={2} textAlign="center">
          Create Account 🚀
        </Typography>

        <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
          Sign up to access ComplianceAI
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
            onClick={handleEmailSignUp}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>

          <Divider sx={{ my: 2 }}>or</Divider>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<Google />}
            onClick={handleGoogleSignUp}
          >
            Sign up with Google
          </Button>
        </Stack>

        <Typography
          variant="body2"
          textAlign="center"
          mt={3}
          color="text.secondary"
        >
          Already have an account?{' '}
          <a
            href="/"
            style={{ color: '#4A90E2', textDecoration: 'none', fontWeight: 500 }}
          >
            Sign In
          </a>
        </Typography>
      </Paper>
    </Box>
  )
}
