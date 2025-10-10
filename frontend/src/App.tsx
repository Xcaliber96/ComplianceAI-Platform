import { Box, Container, Tab, Tabs, Typography } from '@mui/material'
import { useState } from 'react'
import GlobalFilters from './components/GlobalFilters'
import UploadFetchTab from './tabs/UploadFetchTab'
import RunAuditTab from './tabs/RunAuditTab'
import AuditResultsTab from './tabs/AuditResultsTab'


export default function App() {
  const [tab, setTab] = useState(0)
  return (
    <Box>
      <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
        <Typography variant="h5">TreuAI</Typography>
      </Box>


      <GlobalFilters />


      <Container maxWidth="lg" sx={{ pt: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Upload & Fetch" />
          <Tab label="Run Audit" />
          <Tab label="Audit Results" />
        </Tabs>


        {tab === 0 && <UploadFetchTab />}
        {tab === 1 && <RunAuditTab />}
        {tab === 2 && <AuditResultsTab />}
      </Container>
    </Box>
  )
}