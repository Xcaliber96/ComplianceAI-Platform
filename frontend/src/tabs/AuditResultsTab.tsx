import { Box, Card, CardContent, Chip, Divider, FormControlLabel, Switch, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useFilters } from '../store/filters'
import FeedbackDialog from '../components/FeedbackDialog'

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

  useEffect(() => {
    // Mock data; replace with backend result cache or query parameterized by filters
    setItems([
      { id: 'R1', requirement: 'Access controls policy', department: 'IT', country: 'US', state: 'CA', compliant: true, risk: 'Low', gapNarrative: 'Controls documented and reviewed quarterly', evidenceRefs: ['policy_v3.pdf'] },
      { id: 'R2', requirement: 'Vendor risk assessment', department: 'Finance', country: 'US', state: 'NY', compliant: false, risk: 'High', gapNarrative: 'No annual assessment for top vendors', evidenceRefs: ['vendors_2024.xlsx'] },
      { id: 'R3', requirement: 'Data retention schedule', department: 'Legal', country: 'IN', state: 'DL', compliant: false, risk: 'Medium', gapNarrative: 'Retention SOP missing for HR records', evidenceRefs: ['retention_sop.docx'] }
    ])
  }, [])

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

          <FeedbackDialog
            open={feedbackOpen}
            onClose={() => setFeedbackOpen(false)}
            onSubmit={(payload) => {
              // TODO: POST to a feedback endpoint with { itemId: activeItem?.id, ...payload }
              console.log('feedback', { itemId: activeItem?.id, ...payload })
            }}
          />
        </CardContent>
      </Card>
    </Box>
  )
}
