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

const CARD_BORDER = "#232323";
const HEADING_BLACK = "#151515";
const CARD_BG = "#fff";

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
        <Typography variant="h3" fontWeight={700} sx={{ color: HEADING_BLACK }}>
          NomiAI
        </Typography>
        <Typography variant="h5" fontWeight={600} sx={{ color: "#232323" }}>
          Competitor Intelligence
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "#666" }}>
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
            sx={{
              flexGrow: 1,
              "& label": { color: "#232323" },
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: "#fff",
                borderColor: CARD_BORDER,
              }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{
              minWidth: 140,
              height: 56,
              borderRadius: 3,
              fontWeight: 700,
              bgcolor: HEADING_BLACK,
              color: "#fff",
              boxShadow: "none",
              "&:hover": { bgcolor: "#232323" }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
          </Button>
        </Stack>
      </form>

      {error && (
        <Typography sx={{ color: "#c31813", mt: 2 }}>
          {error}
        </Typography>
      )}

      {/* LOADING */}
      {loading && !results && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={5}>
          <CircularProgress sx={{ color: HEADING_BLACK }} />
        </Box>
      )}

      {/* RESULTS */}
      {results && (
        <Box mt={6}>
          <Typography variant="h6" fontWeight={600} sx={{ color: "#232323" }} gutterBottom>
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
                    border: `1px solid ${CARD_BORDER}`,
                    background: "#fff",
                    '&:hover': {
                      boxShadow: 5,
                      transform: 'translateY(-4px)',
                      background: "#f4f4f4"
                    },
                  }}
                >
                  <CardContent>
                    <Typography fontWeight={600} variant="subtitle1" sx={{ color: HEADING_BLACK }}>
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
              startIcon={<Sparkles size={18} color="#232323" />}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                color: HEADING_BLACK,
                borderColor: CARD_BORDER,
                "&:hover": {
                  bgcolor: "#ececec",
                  borderColor: "#191919"
                }
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
                background: "#f7f7f7",
                border: `1px solid ${CARD_BORDER}`
              }}
              elevation={0}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', color: "#232323" }}>
                {insight}
              </Typography>
            </Paper>
          )}

          {/* FILINGS TABLE */}
          <Divider sx={{ my: 4, borderColor: CARD_BORDER }} />
          <Typography variant="h6" fontWeight={600} mb={2} sx={{ color: HEADING_BLACK }}>
            Latest SEC Filings
          </Typography>
          <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${CARD_BORDER}` }} elevation={1}>
            <Table>
              <TableHead sx={{ backgroundColor: "#f3f3f3" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: "#232323" }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#232323" }}>Form</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#232323" }}>Filing Date</TableCell>
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
