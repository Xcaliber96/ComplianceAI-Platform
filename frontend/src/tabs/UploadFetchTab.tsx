import { Box, Button, Card, CardContent, Divider, Stack, TextField, Typography, List, ListItem, ListItemText, Alert, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { useState, useEffect } from 'react'
import { downloadDriveFile, fetchFiles, uploadForInternalAudit, createObligation, getObligations, type Obligation } from '../api/client'
import { useFilters } from '../store/filters'

export default function UploadFetchTab() {
  const [source, setSource] = useState('Google')
  const [driveFiles, setDriveFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string>('')

  // Obligation management
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [newObligation, setNewObligation] = useState({
    description: '',
    regulation: '',
    due_date: ''
  })

  // Auto-generation
  const [selectedRegulation, setSelectedRegulation] = useState('GDPR')
  const [daysOffset, setDaysOffset] = useState(90)

  const filters = useFilters()

  useEffect(() => {
    loadObligations()
  }, [])

  const loadObligations = async () => {
    try {
      const data = await getObligations()
      setObligations(data)
    } catch (error) {
      console.error('Failed to load obligations:', error)
    }
  }

  const handleFetch = async () => {
    const res = await fetchFiles(source)
    setDriveFiles(res?.files ?? [])
  }

  const handleDownload = async (id: string) => {
    const res = await downloadDriveFile(id)
    setMessage(`Downloaded: ${res?.path ?? 'unknown path'}`)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    try {
      const res = await uploadForInternalAudit(selectedFile)
      setMessage(`Audit started: ${res?.status ?? 'ok'} (items: ${res?.total_requirements ?? 0})`)
    } finally {
      setUploading(false)
    }
  }

  const handleCreateObligation = async () => {
    if (!newObligation.description || !newObligation.regulation || !newObligation.due_date) {
      setMessage('Please fill all obligation fields')
      return
    }
    try {
      await createObligation(newObligation)
      setMessage('Obligation created successfully')
      setNewObligation({ description: '', regulation: '', due_date: '' })
      loadObligations()
    } catch (error) {
      setMessage('Failed to create obligation')
      console.error(error)
    }
  }

  const handleAutoGenerate = async () => {
    try {
      const formData = new FormData()
      formData.append('regulation', selectedRegulation)
      formData.append('due_date_offset_days', daysOffset.toString())
      
      const response = await fetch('http://127.0.0.1:8000/api/auto_generate_compliance', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      
      if (result.status === 'success') {
        setMessage(`Auto-generated ${result.obligations_created} obligations and ${result.tasks_created} tasks for ${selectedRegulation}`)
        loadObligations()
      } else {
        setMessage(result.error || 'Auto-generation failed')
      }
    } catch (error) {
      setMessage('Auto-generation failed')
      console.error(error)
    }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={3}>
        {/* Auto-Generate Compliance Section */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Auto-Generate Compliance Plan</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Automatically create obligations and tasks from regulation templates
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Regulation</InputLabel>
                <Select
                  value={selectedRegulation}
                  onChange={(e) => setSelectedRegulation(e.target.value)}
                  label="Select Regulation"
                >
                  <MenuItem value="GDPR">GDPR (3 obligations, 6 tasks)</MenuItem>
                  <MenuItem value="SOX">SOX (2 obligations, 4 tasks)</MenuItem>
                  <MenuItem value="SOC2">SOC2 (2 obligations, 4 tasks)</MenuItem>
                  <MenuItem value="HIPAA">HIPAA (2 obligations, 4 tasks)</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Days Until Due"
                type="number"
                size="small"
                value={daysOffset}
                onChange={(e) => setDaysOffset(Number(e.target.value))}
                helperText="Default deadline offset from today"
              />
              
              <Button 
                variant="contained" 
                onClick={handleAutoGenerate}
              >
                Auto-Generate Full Compliance Plan
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Create Obligation Section */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Create Compliance Obligation</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Define new compliance requirements and deadlines manually
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Stack spacing={2}>
              <TextField
                label="Description"
                size="small"
                fullWidth
                value={newObligation.description}
                onChange={(e) => setNewObligation({ ...newObligation, description: e.target.value })}
                placeholder="e.g., Implement GDPR data retention policy"
              />
              <TextField
                label="Regulation"
                size="small"
                value={newObligation.regulation}
                onChange={(e) => setNewObligation({ ...newObligation, regulation: e.target.value })}
                placeholder="e.g., GDPR, SOX, SOC2"
              />
              <TextField
                label="Due Date"
                size="small"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newObligation.due_date}
                onChange={(e) => setNewObligation({ ...newObligation, due_date: e.target.value })}
              />
              <Button variant="contained" onClick={handleCreateObligation}>
                Create Obligation
              </Button>
            </Stack>

            {obligations.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Existing Obligations ({obligations.length}):</Typography>
                <List dense>
                  {obligations.map((ob: any) => (
                    <ListItem key={ob.id}>
                      <ListItemText
                        primary={`${ob.regulation}: ${ob.description}`}
                        secondary={`Due: ${new Date(ob.due_date).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </CardContent>
        </Card>

        {/* File Fetch Section */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Fetch Files from Cloud Storage</Typography>
            <Typography variant="body2" color="text.secondary">
              Current Filters — Dept: {filters.department ?? 'All'}, Country: {filters.country ?? 'All'}, State: {filters.state ?? 'All'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Source"
                size="small"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                helperText="Use 'Google' for Google Drive"
              />
              <Button variant="outlined" onClick={handleFetch}>Fetch Files</Button>
            </Stack>

            <List dense>
              {driveFiles.map((f) => (
                <ListItem key={f.id} secondaryAction={
                  <Button size="small" onClick={() => handleDownload(f.id)}>Download</Button>
                }>
                  <ListItemText primary={f.name} secondary={f.id} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Upload & Audit Section */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Upload Evidence & Run Audit</Typography>
            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={2} alignItems="center">
              <Button component="label" variant="contained">
                Choose PDF
                <input type="file" accept="application/pdf" hidden onChange={(e) => {
                  const file = e.target.files?.[0]
                  setSelectedFile(file ?? null)
                }} />
              </Button>
              <Typography variant="body2">{selectedFile?.name ?? 'No file selected'}</Typography>
              <Button variant="contained" disabled={!selectedFile || uploading} onClick={handleUpload}>
                {uploading ? 'Uploading...' : 'Upload & Start Internal Audit'}
              </Button>
            </Stack>

            {message && (
              <Alert severity={message.includes('success') || message.includes('started') || message.includes('Auto-generated') ? 'success' : message.includes('failed') || message.includes('Failed') ? 'error' : 'info'} sx={{ mt: 2 }}>
                {message}
              </Alert>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}