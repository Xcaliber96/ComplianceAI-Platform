import { Box, Card, CardContent, Chip, Divider, FormControlLabel, Switch, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Alert, Stack } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useFilters } from '../store/filters'
import FeedbackDialog from '../components/FeedbackDialog'
import { getDashboardSummary, getAuditLog, getTasks } from '../api/client'

type ResultItem = {
  id: string
  requirement: string
  department?: string
  country?: string
  state?: string
  compliant: boolean
  risk: 'Low' | 'Medium' | 'High'
  gapNarrative: string
  evidenceRefs?: string[]
}

export default function AuditResultsTab() {
  const filters = useFilters()
  const [showCharts, setShowCharts] = useState(true)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<ResultItem | null>(null)
  const [items, setItems] = useState<ResultItem[]>([])
  
  const [dashboard, setDashboard] = useState<any>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  
  // Regulatory monitoring
  const [detectedRegulations, setDetectedRegulations] = useState<any[]>([])
  const [scanMessage, setScanMessage] = useState('')

  useEffect(() => {
    loadDashboardData()
    loadMockData()
    loadDetectedRegulations()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [dashData, logs, tasksData] = await Promise.all([
        getDashboardSummary(),
        getAuditLog(20),
        getTasks()
      ])
      setDashboard(dashData)
      setAuditLogs(logs)
      setTasks(tasksData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const loadDetectedRegulations = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/detected_regulations')
      const data = await response.json()
      setDetectedRegulations(data)
    } catch (error) {
      console.error('Failed to load detected regulations:', error)
    }
  }

  const handleTriggerScan = async () => {
    try {
      setScanMessage('Scanning regulatory sources...')
      const response = await fetch('http://127.0.0.1:8000/api/trigger_regulatory_scan', {
        method: 'POST'
      })
      const result = await response.json()
      setScanMessage('Scan completed successfully')
      
      setTimeout(() => {
        loadDetectedRegulations()
        loadDashboardData()
      }, 2000)
    } catch (error) {
      setScanMessage('Scan failed')
      console.error(error)
    }
  }

  const loadMockData = () => {
    setItems([
      { id: 'R1', requirement: 'Access controls policy', department: 'IT', country: 'US', state: 'CA', compliant: true, risk: 'Low', gapNarrative: 'Controls documented and reviewed quarterly', evidenceRefs: ['policy_v3.pdf'] },
      { id: 'R2', requirement: 'Vendor risk assessment', department: 'Finance', country: 'US', state: 'NY', compliant: false, risk: 'High', gapNarrative: 'No annual assessment for top vendors', evidenceRefs: ['vendors_2024.xlsx'] },
      { id: 'R3', requirement: 'Data retention schedule', department: 'Legal', country: 'IN', state: 'DL', compliant: false, risk: 'Medium', gapNarrative: 'Retention SOP missing for HR records', evidenceRefs: ['retention_sop.docx'] }
    ])
  }

  const filtered = useMemo(() => {
    return items.filter(i =>
      (!filters.department || i.department === filters.department) &&
      (!filters.country || i.country === filters.country) &&
      (!filters.state || i.state === filters.state)
    )
  }, [items, filters.department, filters.country, filters.state])

  const compliancePct = useMemo(() => {
    if (!filtered.length) return 0
    const ok = filtered.filter(i => i.compliant).length
    return Math.round((ok / filtered.length) * 100)
  }, [filtered])

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={3}>
        {/* Dashboard Summary */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Dashboard Summary</Typography>
            <Divider sx={{ my: 2 }} />
            {dashboard && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Card sx={{ flex: 1 }} variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2">Total Tasks</Typography>
                    <Typography variant="h4">{dashboard.total_tasks}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1 }} variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2">Completed</Typography>
                    <Typography variant="h4" color="success.main">{dashboard.done}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1 }} variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2">Overdue</Typography>
                    <Typography variant="h4" color="warning.main">{dashboard.overdue}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1 }} variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2">Breached</Typography>
                    <Typography variant="h4" color="error.main">{dashboard.breached}</Typography>
                  </CardContent>
                </Card>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Regulatory Monitor */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Regulatory Monitor</Typography>
            <Typography variant="body2" color="text.secondary">
              Automatically detected regulations from Federal Register and other sources
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Button 
              variant="contained" 
              onClick={handleTriggerScan}
              sx={{ mb: 2 }}
            >
              Trigger Manual Scan
            </Button>

            {scanMessage && (
              <Alert severity="info" sx={{ mb: 2 }}>{scanMessage}</Alert>
            )}

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Auto-Detected Regulations (Last 30 Days): {detectedRegulations.length}
            </Typography>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detectedRegulations.map((reg: any) => (
                  <TableRow key={reg.id}>
                    <TableCell>{new Date(reg.timestamp).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={reg.entity_type} size="small" color="primary" />
                    </TableCell>
                    <TableCell>{reg.detail}</TableCell>
                    <TableCell>
                      <Chip label={reg.action} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
                {detectedRegulations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No regulations detected yet. Automatic scans run every 12 hours.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Audit Results */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Audit Results</Typography>
            <Typography variant="body2" color="text.secondary">
              Current Filters — Dept: {filters.department ?? 'All'}, Country: {filters.country ?? 'All'}, State: {filters.state ?? 'All'}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <FormControlLabel control={<Switch checked={showCharts} onChange={(_, v) => setShowCharts(v)} />} label="Show quick charts" />

            {showCharts && (
              <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
                <Card sx={{ flex: 1 }} variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2">Compliance %</Typography>
                    <Typography variant="h4">{compliancePct}%</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1 }} variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2">Risk distribution</Typography>
                    <Typography variant="body2">
                      {['Low','Medium','High'].map(r => {
                        const c = filtered.filter(i => i.risk === r).length
                        return `${r}: ${c} `
                      }).join(' | ')}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Requirement</TableCell>
                  <TableCell>Dept</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Compliance</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell>Gap Narrative</TableCell>
                  <TableCell>Evidence</TableCell>
                  <TableCell>Feedback</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.requirement}</TableCell>
                    <TableCell>{item.department}</TableCell>
                    <TableCell>{item.country}</TableCell>
                    <TableCell>{item.state}</TableCell>
                    <TableCell>
                      <Chip label={item.compliant ? 'Compliant' : 'Gap'} color={item.compliant ? 'success' : 'warning'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={item.risk} color={item.risk === 'High' ? 'error' : item.risk === 'Medium' ? 'warning' : 'success'} size="small" />
                    </TableCell>
                    <TableCell>{item.gapNarrative}</TableCell>
                    <TableCell>{item.evidenceRefs?.join(', ')}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => { setActiveItem(item); setFeedbackOpen(true) }}>Give Feedback</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Audit Log</Typography>
            <Divider sx={{ my: 2 }} />
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Detail</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{log.entity_type} #{log.entity_id}</TableCell>
                    <TableCell><Chip label={log.action} size="small" /></TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.detail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <FeedbackDialog
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          onSubmit={(payload) => {
            console.log('feedback', { itemId: activeItem?.id, ...payload })
          }}
        />
      </Stack>
    </Box>
  )
}
