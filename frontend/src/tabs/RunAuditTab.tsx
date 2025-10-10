import { Box, Button, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { runExternalIntelligence, runRagCompliance } from '../api/client'
import { useFilters } from '../store/filters'

export default function RunAuditTab() {
  const [industry, setIndustry] = useState('Finance')
  const [regulations, setRegulations] = useState('SOX, GDPR, SOC2')
  const [file, setFile] = useState<File | null>(null)
  const [log, setLog] = useState<string>('')

  const filters = useFilters()

  const handleExternal = async () => {
    const res = await runExternalIntelligence(industry)
    setLog(prev => prev + `\nExternal: ${JSON.stringify(res)}`)
  }

  const handleRag = async () => {
    if (!file) return
    const res = await runRagCompliance(file, regulations)
    setLog(prev => prev + `\nRAG: ${JSON.stringify(res)}`)
  }

  return (
    <Box sx={{ p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Run Audit</Typography>
          <Typography variant="body2" color="text.secondary">
            Current Filters — Dept: {filters.department ?? 'All'}, Country: {filters.country ?? 'All'}, State: {filters.state ?? 'All'}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={2}>
            <TextField size="small" label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            <TextField size="small" label="Regulations (comma-separated)" value={regulations} onChange={(e) => setRegulations(e.target.value)} />
            <Button component="label" variant="contained">
              Choose Evidence PDF
              <input type="file" accept="application/pdf" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Button>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={handleExternal}>Fetch External Intelligence</Button>
              <Button variant="contained" disabled={!file} onClick={handleRag}>Run RAG Compliance</Button>
            </Stack>
            <TextField label="Run Log" value={log} multiline rows={8} InputProps={{ readOnly: true }} />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
