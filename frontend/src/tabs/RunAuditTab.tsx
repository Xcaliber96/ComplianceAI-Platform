import { Box, Button, Card, CardContent, Divider, Stack, TextField, Typography, Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText, Chip, Alert } from '@mui/material'
import { useState, useEffect } from 'react'
import { runExternalIntelligence, runRagCompliance, createTask, getTasks, getObligations, uploadEvidence, transitionTask } from '../api/client'
import { useFilters } from '../store/filters'

export default function RunAuditTab() {
  const [industry, setIndustry] = useState('Finance')
  const [regulations, setRegulations] = useState('SOX, GDPR, SOC2')
  const [file, setFile] = useState<File | null>(null)
  const [log, setLog] = useState<string>('')

  // Task management
  const [tasks, setTasks] = useState<any[]>([])
  const [obligations, setObligations] = useState<any[]>([])
  const [newTask, setNewTask] = useState({
    obligation_id: '',
    assigned_to: '',
    sla_due: ''
  })
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)

  const filters = useFilters()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [tasksData, obligationsData] = await Promise.all([
        getTasks(),
        getObligations()
      ])
      setTasks(tasksData)
      setObligations(obligationsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleExternal = async () => {
    const res = await runExternalIntelligence(industry)
    setLog(prev => prev + `\n[External Intelligence] ${JSON.stringify(res)}`)
  }

  const handleRag = async () => {
    if (!file) return
    const res = await runRagCompliance(file, regulations)
    setLog(prev => prev + `\n[RAG Analysis] ${JSON.stringify(res)}`)
  }

  const handleCreateTask = async () => {
    if (!newTask.obligation_id || !newTask.assigned_to || !newTask.sla_due) {
      setLog(prev => prev + '\n[Error] Please fill all task fields')
      return
    }
    try {
      await createTask({
        obligation_id: parseInt(newTask.obligation_id),
        assigned_to: newTask.assigned_to,
        sla_due: newTask.sla_due
      })
      setLog(prev => prev + '\n[Success] Task created!')
      setNewTask({ obligation_id: '', assigned_to: '', sla_due: '' })
      loadData()
    } catch (error) {
      setLog(prev => prev + `\n[Error] Failed to create task: ${error}`)
    }
  }

  const handleUploadEvidence = async () => {
    if (!evidenceFile || !selectedTaskId) return
    try {
      await uploadEvidence(selectedTaskId, evidenceFile, 'user@company.com')
      setLog(prev => prev + `\n[Success] Evidence uploaded for task ${selectedTaskId}`)
      setEvidenceFile(null)
      loadData()
    } catch (error) {
      setLog(prev => prev + `\n[Error] Evidence upload failed`)
    }
  }

  const handleTransition = async (taskId: number, newState: string) => {
    try {
      await transitionTask(taskId, newState, 'user@company.com')
      setLog(prev => prev + `\n[Success] Task ${taskId} transitioned to ${newState}`)
      loadData()
    } catch (error) {
      setLog(prev => prev + `\n[Error] Transition failed`)
    }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={3}>
        {/* Create Task Section */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Create Remediation Task</Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Obligation</InputLabel>
                <Select
                  value={newTask.obligation_id}
                  onChange={(e) => setNewTask({ ...newTask, obligation_id: e.target.value })}
                  label="Select Obligation"
                >
                  {obligations.map((ob: any) => (
                    <MenuItem key={ob.id} value={ob.id}>
                      {ob.regulation}: {ob.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Assigned To (email)"
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                placeholder="john@company.com"
              />
              <TextField
                size="small"
                label="SLA Due Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newTask.sla_due}
                onChange={(e) => setNewTask({ ...newTask, sla_due: e.target.value })}
              />
              <Button variant="contained" onClick={handleCreateTask}>Create Task</Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Task Management Section */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Manage Tasks</Typography>
            <Divider sx={{ my: 2 }} />
            <List dense>
              {tasks.map((task: any) => (
                <ListItem
                  key={task.id}
                  sx={{ border: '1px solid #eee', borderRadius: 1, mb: 1 }}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      {task.state === 'TODO' && <Button size="small" onClick={() => handleTransition(task.id, 'IN_PROGRESS')}>Start</Button>}
                      {task.state === 'IN_PROGRESS' && <Button size="small" onClick={() => handleTransition(task.id, 'REVIEW')}>Review</Button>}
                      {task.state === 'REVIEW' && <Button size="small" onClick={() => handleTransition(task.id, 'DONE')}>Done</Button>}
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={`Task #${task.id} - ${task.assigned_to}`}
                    secondary={
                      <>
                        <Chip label={task.state} size="small" color={task.state === 'DONE' ? 'success' : 'default'} sx={{ mr: 1 }} />
                        Due: {new Date(task.sla_due).toLocaleDateString()}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Evidence Upload Section */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Upload Evidence</Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Task</InputLabel>
                <Select
                  value={selectedTaskId ?? ''}
                  onChange={(e) => setSelectedTaskId(Number(e.target.value))}
                  label="Select Task"
                >
                  {tasks.map((task: any) => (
                    <MenuItem key={task.id} value={task.id}>Task #{task.id} - {task.assigned_to}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button component="label" variant="contained">
                Choose Evidence File
                <input type="file" hidden onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)} />
              </Button>
              <Typography variant="body2">{evidenceFile?.name ?? 'No file selected'}</Typography>
              <Button variant="contained" disabled={!evidenceFile || !selectedTaskId} onClick={handleUploadEvidence}>
                Upload Evidence
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* External Intelligence Section */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">External Intelligence & RAG</Typography>
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
            </Stack>
          </CardContent>
        </Card>

        {/* Log Section */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Activity Log</Typography>
            <Divider sx={{ my: 2 }} />
            <TextField
              label="Run Log"
              value={log}
              multiline
              rows={10}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
