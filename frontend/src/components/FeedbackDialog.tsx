import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (payload: { verdict: 'compliant' | 'non_compliant' | 'unclear', notes: string }) => void
}

export default function FeedbackDialog({ open, onClose, onSubmit }: Props) {
  const [verdict, setVerdict] = useState<'compliant' | 'non_compliant' | 'unclear'>('unclear')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    onSubmit({ verdict, notes })
    setNotes('')
    setVerdict('unclear')
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>User Feedback</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <ToggleButtonGroup
            exclusive
            value={verdict}
            onChange={(_, v) => v && setVerdict(v)}
          >
            <ToggleButton value="compliant">Compliant</ToggleButton>
            <ToggleButton value="non_compliant">Non-compliant</ToggleButton>
            <ToggleButton value="unclear">Unclear</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline rows={4}
            placeholder="Explain why this is or isn't compliant; mention evidence or context"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Submit</Button>
      </DialogActions>
    </Dialog>
  )
}
