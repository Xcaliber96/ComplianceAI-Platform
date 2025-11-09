import { Box, Button, Card, CardContent, Divider, Stack, TextField, Typography, List, ListItem, ListItemText, Alert, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { useState, useEffect } from 'react'
import { createObligation, getObligations, type Obligation } from '../api/client'

export default function CompliancePlanner() {
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [newObligation, setNewObligation] = useState({
    description: '',
    regulation: '',
    due_date: ''
  })

  const [selectedRegulation, setSelectedRegulation] = useState('GDPR')
  const [daysOffset, setDaysOffset] = useState(90)
  const [message, setMessage] = useState<string>('')

  useEffect(() => { loadObligations() }, [])

  const loadObligations = async () => {
    try {
      const data = await getObligations()
      setObligations(data)
    } catch (error) {
      console.error('Failed to load obligations:', error)
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
    <Box sx={{ p: 3 }}>
      <Stack spacing={4}>
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

              <Button variant="contained" onClick={handleAutoGenerate}>
                Auto-Generate Full Compliance Plan
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Manual Obligation Creation */}
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
                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                  Existing Obligations ({obligations.length})
                </Typography>
                <List dense>
                  {obligations.map((ob) => (
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

        {message && (
          <Alert severity={message.includes('success') || message.includes('Auto-generated') ? 'success' : 'error'}>
            {message}
          </Alert>
        )}
      </Stack>
    </Box>
  )
}
