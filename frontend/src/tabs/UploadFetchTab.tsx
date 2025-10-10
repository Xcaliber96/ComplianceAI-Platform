import { Box, Button, Card, CardContent, Divider, Stack, TextField, Typography, List, ListItem, ListItemText } from '@mui/material'
import { useState } from 'react'
import { downloadDriveFile, fetchFiles, uploadForInternalAudit } from '../api/client'
import { useFilters } from '../store/filters'

export default function UploadFetchTab() {
  const [source, setSource] = useState('Google')
  const [driveFiles, setDriveFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string>('')

  const filters = useFilters()

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

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Upload & Fetch</Typography>
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

            {message && <Typography sx={{ mt: 2 }}>{message}</Typography>}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
