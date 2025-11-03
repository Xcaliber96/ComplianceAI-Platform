import React, { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
  Paper,
} from '@mui/material'
import { getCompetitors } from '../api/client'
import { Sparkles } from 'lucide-react'

export default function CompetitorsPage() {
  const [companyName, setCompanyName] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insight, setInsight] = useState<string | null>(null)
  const theme = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) {
      setError('Please enter a company name.')
      return
    }
    setError(null)
    setResults(null)
    setInsight(null)
    setLoading(true)
    try {
      const data = await getCompetitors(companyName)
      setResults(data)
    } catch (err) {
      console.error(err)
      setError('Could not fetch competitors. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateInsights = async () => {
    setLoading(true)
    setInsight('Generating market insights...')
    // Normally call your backend here (e.g. /api/analyze_competitors)
    setTimeout(() => {
      setInsight(
        `📊 ${companyName} operates in a highly competitive ecosystem with strong players like ${results?.competitors?.slice(0, 3).join(', ')}. 
        The landscape suggests significant innovation in consumer tech, hardware, and software integration.`
      )
      setLoading(false)
    }, 2000)
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* HEADER */}
      <Stack spacing={1} mb={5}>
        <Typography variant="h3" fontWeight={700} color="primary">
          NomiAI
        </Typography>
        <Typography variant="h5" fontWeight={600}>
          Competitor Intelligence
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Discover your competitors, explore SEC filings, and generate instant AI insights.
        </Typography>
      </Stack>

      {/* INPUT FORM */}
      <form onSubmit={handleSubmit}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Company Name"
            variant="outlined"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ minWidth: 140, height: 56, borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
          </Button>
        </Stack>
      </form>

      {error && (
        <Typography color="error" mt={2}>
          {error}
        </Typography>
      )}

      {/* LOADING */}
      {loading && !results && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={5}>
          <CircularProgress />
        </Box>
      )}

      {/* RESULTS */}
      {results && (
        <Box mt={6}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Competitors for <strong>{results.company}</strong>
          </Typography>

          <Grid container spacing={2}>
            {results.competitors.map((name: string, idx: number) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    height: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    transition: '0.3s',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent>
                    <Typography fontWeight={600} variant="subtitle1">
                      {name}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* INSIGHT BUTTON */}
          <Box display="flex" justifyContent="flex-end" mt={4}>
            <Button
              onClick={handleGenerateInsights}
              variant="outlined"
              startIcon={<Sparkles size={18} />}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Generate AI Insights
            </Button>
          </Box>

          {/* AI INSIGHT */}
          {insight && (
            <Paper
              sx={{
                mt: 3,
                p: 3,
                borderRadius: 3,
                background: theme.palette.mode === 'light' ? '#f9fafb' : '#1e1e1e',
              }}
              elevation={0}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {insight}
              </Typography>
            </Paper>
          )}

          {/* FILINGS TABLE */}
          <Divider sx={{ my: 4 }} />
          <Typography variant="h6" fontWeight={600} mb={2}>
            Latest SEC Filings
          </Typography>
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={1}>
            <Table>
              <TableHead sx={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Form</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Filing Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(results.filings || {}).flatMap(
                  ([company, docs]: [string, any]) =>
                    docs.map(([form, date]: [string, string], i: number) => (
                      <TableRow key={`${company}-${i}`}>
                        <TableCell>{company}</TableCell>
                        <TableCell>{form}</TableCell>
                        <TableCell>{date}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}
    </Container>
  )
}
