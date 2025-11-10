import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tabs,
  Tab
} from '@mui/material'
import { useState, useEffect } from 'react'
import {
  runExternalIntelligence,
  runRagCompliance,
  createTask,
  getTasks,
  getObligations,
  uploadEvidence,
  transitionTask
} from '../api/client'
import { useFilters } from '../store/filters'
import { useSelectedFiles } from '../store/selectedFiles'

const BG_MAIN = "#fcfcfc"
const CARD_BORDER = "#232323"
const CARD_BG = "#fff"
const HEADING_BLACK = "#151515"

function formatExternalIntelligenceLog(result) {
  if (!result.details || !Array.isArray(result.details)) return JSON.stringify(result)
  let logOut = `[External Intelligence]\n`
  result.details.forEach((finding) => {
    logOut += `Source: ${finding.source}\n`
    if (finding.headline) logOut += `Headline: ${finding.headline}\n`
    if (finding.key_risks && finding.key_risks.length) {
      logOut += `Key Risks:\n`
      finding.key_risks.forEach(risk => { logOut += `- ${risk}\n` })
    }
    if (finding.regulation_news && finding.regulation_news.length) {
      logOut += `Regulation News:\n`
      finding.regulation_news.forEach(news => {
        logOut += `- ${news.regulation}: ${news.summary}\n  Read more: ${news.link}\n`
      })
    }
    logOut += `\n`
  })
  return logOut
}

function formatRagLog(result) {
  if (!result.details || !Array.isArray(result.details)) return JSON.stringify(result)
  let logOut = `[RAG Analysis]\nSupplier: ${result.supplier}\nFindings:\n`
  result.details.forEach((finding, idx) => {
    logOut += `${idx + 1}. Requirement: ${finding.requirement}\n   Status: ${finding.status}\n   Details: ${finding.details}\n   Evidence: ${finding.evidence}\n\n`
  })
  return logOut
}

export default function RunAuditTab() {
  const [tabIndex, setTabIndex] = useState(0)
  const [industry, setIndustry] = useState('Finance')
  const [regulations, setRegulations] = useState('SOX, GDPR, SOC2')
  const [file, setFile] = useState<File | null>(null)
  const [log, setLog] = useState<string>('')
  const [tasks, setTasks] = useState<any[]>([])
  const [obligations, setObligations] = useState<any[]>([])
  const [newTask, setNewTask] = useState({ obligation_id: '', assigned_to: '', sla_due: '' })
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const filters = useFilters()
  const { selectedFiles } = useSelectedFiles()
  const [keywords, setKeywords] = useState<string[]>([])
  const [supplierId, setSupplierId] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState<Array<{ id: string, name: string }>>([])

  useEffect(() => {
    loadData()
    fetchSuppliers()
    const saved = window.localStorage.getItem('keywords')
    if (saved) {
      try { setKeywords(JSON.parse(saved)) }
      catch { console.warn('Failed to parse saved keywords') }
    }
  }, [])

  const loadData = async () => {
    try {
      const [tasksData, obligationsData] = await Promise.all([getTasks(), getObligations()])
      setTasks(tasksData)
      setObligations(obligationsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/suppliers')
      const json = await resp.json()
      setSuppliers(json)
    } catch (err) {
      setSuppliers([])
    }
  }

  const handleExternal = async () => {
    const res = await runExternalIntelligence(industry)
    setLog(prev => prev + '\n' + formatExternalIntelligenceLog(res))
  }

  const handleRag = async () => {
    if (!file || !supplierId) {
      setLog(prev => prev + '\n⚠️ Please choose a PDF file and supplier before running compliance.')
      return
    }
    const res = await runRagCompliance(file, regulations, supplierId)
    setLog(prev => prev + '\n' + formatRagLog(res))
  }

  const handleCreateTask = async () => {
    if (!newTask.obligation_id || !newTask.assigned_to || !newTask.sla_due || !supplierId) {
      setLog(prev => prev + '\n[Error] Please fill all task fields and select a supplier.')
      return
    }
    try {
      await createTask({
        obligation_id: parseInt(newTask.obligation_id),
        assigned_to: newTask.assigned_to,
        sla_due: newTask.sla_due,
        supplier_id: supplierId
      })
      setLog(prev => prev + `\n[Success] Task created for supplier ${supplierId}!`)
      setNewTask({ obligation_id: '', assigned_to: '', sla_due: '' })
      loadData()
    } catch (error) {
      console.error(error)
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

  // Common InputLabel sx
  const labelProps = {
    sx: {
      backgroundColor: "#fff",
      px: 0.6,
      zIndex: 2,
      left: 8,
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        width: "100%",
        bgcolor: BG_MAIN,
        py: 4,
      }}
    >
      {/* Tab Bar */}
      <Tabs
        value={tabIndex}
        onChange={(e, v) => setTabIndex(v)}
        indicatorColor="primary"
        textColor="inherit"
        centered
        sx={{
          mb: 3,
          ".MuiTabs-indicator": { bgcolor: HEADING_BLACK, height: 4, borderRadius: 2 },
          ".MuiTab-root": {
            fontWeight: 600,
            fontSize: "1.13rem",
            minWidth: 180,
            textTransform: "none",
            color: "#232323",
            "&.Mui-selected": { color: HEADING_BLACK }
          }
        }}
      >
        <Tab label="Select Supplier & Remediation" />
        <Tab label="Manage Tasks" />
        <Tab label="Upload Evidence" />
        <Tab label="External Intelligence & RAG" />
        <Tab label="Activity Log" />
      </Tabs>
      <Stack spacing={4} maxWidth="900px" mx="auto" alignItems="stretch">
        {/* Tab 0: Select Supplier & Remediation */}
        {tabIndex === 0 && (
          <Card elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${CARD_BORDER}`,
              background: CARD_BG,
              boxShadow: "0 1px 10px 0 rgba(35,35,35,0.04)",
            }}>
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Typography variant="h6" fontWeight={700}
                sx={{ color: HEADING_BLACK, mb: 1.5, letterSpacing: 0.1 }}>
                Select Supplier for Audit
              </Typography>
              <Divider sx={{ my: 2, borderColor: CARD_BORDER }} />
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel {...labelProps}>Select Supplier</InputLabel>
                <Select
                  value={supplierId ?? ""}
                  onChange={e => setSupplierId(e.target.value)}
                  label="Select Supplier"
                  sx={{
                    borderRadius: 4,
                    bgcolor: "#fff",
                    fontWeight: 500,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: CARD_BORDER }
                  }}>
                  <MenuItem value="">Choose supplier</MenuItem>
                  {suppliers.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="h6" fontWeight={700}
                sx={{ color: HEADING_BLACK, mt: 4, mb: 1.5, letterSpacing: 0.1 }}>
                Create Remediation Task
              </Typography>
              <Divider sx={{ my: 2, borderColor: CARD_BORDER }} />
              <Stack spacing={2}>
                <FormControl fullWidth size="small" variant="outlined">
                  <InputLabel {...labelProps}>Select Obligation</InputLabel>
                  <Select
                    value={newTask.obligation_id}
                    onChange={(e) =>
                      setNewTask({ ...newTask, obligation_id: e.target.value })
                    }
                    label="Select Obligation"
                    sx={{
                      borderRadius: 4,
                      bgcolor: "#fff",
                      fontWeight: 500,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: CARD_BORDER }
                    }}>
                    {obligations.map((ob: any) => (
                      <MenuItem key={ob.id} value={ob.id}>
                        {ob.regulation}: {ob.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" variant="outlined">
                  <TextField
                    size="small"
                    label="Assigned To (email)"
                    value={newTask.assigned_to}
                    onChange={(e) =>
                      setNewTask({ ...newTask, assigned_to: e.target.value })
                    }
                    placeholder="john@company.com"
                    InputLabelProps={labelProps}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 4,
                        bgcolor: "#fff",
                        border: `1px solid ${CARD_BORDER}`,
                      }
                    }}
                  />
                </FormControl>
                <FormControl fullWidth size="small" variant="outlined">
                  <TextField
                    size="small"
                    label="SLA Due Date"
                    type="date"
                    InputLabelProps={{ shrink: true, ...labelProps }}
                    value={newTask.sla_due}
                    onChange={(e) =>
                      setNewTask({ ...newTask, sla_due: e.target.value })
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 4,
                        bgcolor: "#fff",
                        border: `1px solid ${CARD_BORDER}`,
                      }
                    }}
                  />
                </FormControl>
                <Button
                  variant="contained"
                  sx={{
                    py: 1.4, borderRadius: 7, textTransform: "none",
                    fontSize: "1.07rem", fontWeight: 700, background: HEADING_BLACK,
                    boxShadow: "none", color: "#fff", letterSpacing: 0.4,
                    "&:hover": { background: "#232323", opacity: 0.97 }
                  }}
                  onClick={handleCreateTask}>
                  Create Task
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Tab 1: Manage Tasks */}
        {tabIndex === 1 && (
          <Card elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${CARD_BORDER}`,
              background: CARD_BG,
              boxShadow: "0 1px 10px 0 rgba(35,35,35,0.04)",
            }}>
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Typography variant="h6" fontWeight={700}
                sx={{ color: HEADING_BLACK, mb: 1.5, letterSpacing: 0.1 }}>
                Manage Tasks
              </Typography>
              <Divider sx={{ my: 2, borderColor: CARD_BORDER }} />
              <List dense sx={{ backgroundColor: "#fff", borderRadius: 4, p: 1 }}>
                {tasks.map((task: any) => (
                  <ListItem
                    key={task.id}
                    sx={{
                      borderRadius: 3,
                      mb: 0.7, backgroundColor: "#fff",
                      border: `1px solid ${CARD_BORDER}`,
                      "&:last-child": { mb: 0 }
                    }}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        {task.state === 'TODO' && (
                          <Button
                            size="small"
                            onClick={() => handleTransition(task.id, 'IN_PROGRESS')}
                            sx={{ textTransform: "none", fontWeight: 700, color: HEADING_BLACK }}
                          >Start</Button>
                        )}
                        {task.state === 'IN_PROGRESS' && (
                          <Button
                            size="small"
                            onClick={() => handleTransition(task.id, 'REVIEW')}
                            sx={{ textTransform: "none", fontWeight: 700, color: HEADING_BLACK }}
                          >Review</Button>
                        )}
                        {task.state === 'REVIEW' && (
                          <Button
                            size="small"
                            onClick={() => handleTransition(task.id, 'DONE')}
                            sx={{ textTransform: "none", fontWeight: 700, color: HEADING_BLACK }}
                          >Done</Button>
                        )}
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography fontWeight={700} sx={{ color: "#232323" }}>
                          Task #{task.id} - {task.assigned_to}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Chip
                            label={task.state}
                            size="small"
                            color={task.state === 'DONE' ? 'success' : 'default'}
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="caption" sx={{ color: "#232323", opacity: 0.7 }}>
                            Due: {new Date(task.sla_due).toLocaleDateString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Upload Evidence */}
        {tabIndex === 2 && (
          <Card elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${CARD_BORDER}`,
              background: CARD_BG,
              boxShadow: "0 1px 10px 0 rgba(35,35,35,0.04)",
            }}>
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Typography variant="h6" fontWeight={700}
                sx={{ color: HEADING_BLACK, mb: 1.5, letterSpacing: 0.1 }}>
                Upload Evidence
              </Typography>
              <Divider sx={{ my: 2, borderColor: CARD_BORDER }} />
              <Stack spacing={2}>
                <FormControl fullWidth size="small" variant="outlined">
                  <InputLabel {...labelProps}>Select Task</InputLabel>
                  <Select
                    value={selectedTaskId ?? ''}
                    onChange={(e) => setSelectedTaskId(Number(e.target.value))}
                    label="Select Task"
                    sx={{
                      borderRadius: 4,
                      bgcolor: "#fff",
                      fontWeight: 500,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: CARD_BORDER }
                    }}>
                    {tasks.map((task: any) => (
                      <MenuItem key={task.id} value={task.id}>
                        Task #{task.id} - {task.assigned_to}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  component="label"
                  variant="contained"
                  sx={{
                    borderRadius: 4,
                    fontSize: "1rem",
                    fontWeight: 700,
                    background: "#f6f6f6",
                    color: HEADING_BLACK,
                    "&:hover": { backgroundColor: "#f1f1f1" }
                  }}>
                  Choose Evidence File
                  <input
                    type="file"
                    hidden
                    onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                  />
                </Button>
                <Typography variant="body2" sx={{ color: "#232323", fontWeight: 700 }}>
                  {evidenceFile?.name ?? 'No file selected'}
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    py: 1.4, borderRadius: 7, textTransform: "none",
                    fontSize: "1.07rem", fontWeight: 700, background: HEADING_BLACK,
                    color: "#fff", boxShadow: "none",
                    "&:hover": { background: "#232323", opacity: 0.97 },
                    "&:disabled": { backgroundColor: "#ececec", color: "#bdbdbd" }
                  }}
                  disabled={!evidenceFile || !selectedTaskId}
                  onClick={handleUploadEvidence}>
                  Upload Evidence
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: External Intelligence & RAG */}
        {tabIndex === 3 && (
          <Card elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${CARD_BORDER}`,
              background: CARD_BG,
              boxShadow: "0 1px 10px 0 rgba(35,35,35,0.04)",
            }}>
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Typography variant="h6" fontWeight={700}
                sx={{ color: HEADING_BLACK, mb: 1.5, letterSpacing: 0.1 }}>
                External Intelligence & RAG
              </Typography>
              <Divider sx={{ my: 2, borderColor: CARD_BORDER }} />
              <Stack spacing={2}>
                <FormControl fullWidth size="small" variant="outlined">
                  <TextField
                    size="small"
                    label="Industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    InputLabelProps={labelProps}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 4,
                        bgcolor: "#fff",
                        border: `1px solid ${CARD_BORDER}`,
                      }
                    }}
                  />
                </FormControl>
                <FormControl fullWidth size="small" variant="outlined">
                  <TextField
                    size="small"
                    label="Regulations (comma-separated)"
                    value={regulations}
                    onChange={(e) => setRegulations(e.target.value)}
                    InputLabelProps={labelProps}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 4,
                        bgcolor: "#fff",
                        border: `1px solid ${CARD_BORDER}`,
                      }
                    }}
                  />
                </FormControl>
                <Button
                  component="label"
                  variant="contained"
                  sx={{
                    borderRadius: 4,
                    fontSize: "1rem",
                    fontWeight: 700,
                    background: "#f6f6f6",
                    color: HEADING_BLACK,
                    "&:hover": { backgroundColor: "#f1f1f1" }
                  }}>
                  Choose Evidence PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </Button>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    sx={{
                      py: 1.2, px: 3, borderRadius: 4, fontWeight: 700,
                      borderColor: CARD_BORDER, color: HEADING_BLACK, background: "#fff",
                      "&:hover": { borderColor: "#191919", backgroundColor: "#f1f1f1" }
                    }}
                    onClick={handleExternal}>
                    Fetch External Intelligence
                  </Button>
                  <Button
                    variant="contained"
                    sx={{
                      py: 1.4, borderRadius: 7, textTransform: "none", fontSize: "1.07rem",
                      fontWeight: 700, background: HEADING_BLACK, color: "#fff", boxShadow: "none",
                      "&:hover": { background: "#232323", opacity: 0.97 },
                      "&:disabled": { backgroundColor: "#ececec", color: "#bdbdbd" }
                    }}
                    disabled={!file || !supplierId}
                    onClick={handleRag}>
                    Run RAG Compliance
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Tab 4: Activity Log */}
        {tabIndex === 4 && (
          <Card elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${CARD_BORDER}`,
              background: CARD_BG,
              boxShadow: "0 1px 10px 0 rgba(35,35,35,0.04)",
            }}>
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Typography variant="h6" fontWeight={700}
                sx={{ color: HEADING_BLACK, mb: 1.5, letterSpacing: 0.1 }}>
                Activity Log
              </Typography>
              <Divider sx={{ my: 2, borderColor: CARD_BORDER }} />
              <TextField
                label="Run Log"
                value={log}
                multiline
                rows={10}
                fullWidth
                InputProps={{ readOnly: true }}
                InputLabelProps={labelProps}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 4,
                    bgcolor: "#fff",
                    border: `1px solid ${CARD_BORDER}`,
                  }
                }}
              />
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  )
}
