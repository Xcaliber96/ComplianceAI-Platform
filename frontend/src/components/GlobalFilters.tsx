import { Box, FormControl, InputLabel, MenuItem, Select, Button } from '@mui/material'
import { useFilters } from '../store/filters'

export default function GlobalFilters() {
  const filters = useFilters()

  return (
    <Box sx={{ p: 2, display: 'flex', gap: 2, borderBottom: '1px solid #eee' }}>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Department</InputLabel>
        <Select
          value={filters.department ?? ''}
          onChange={(e) => filters.setDepartment(e.target.value || null)}
          label="Department"
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="IT">IT</MenuItem>
          <MenuItem value="Finance">Finance</MenuItem>
          <MenuItem value="Legal">Legal</MenuItem>
          <MenuItem value="HR">HR</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Country</InputLabel>
        <Select
          value={filters.country ?? ''}
          onChange={(e) => filters.setCountry(e.target.value || null)}
          label="Country"
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="US">US</MenuItem>
          <MenuItem value="IN">India</MenuItem>
          <MenuItem value="UK">UK</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>State</InputLabel>
        <Select
          value={filters.state ?? ''}
          onChange={(e) => filters.setState(e.target.value || null)}
          label="State"
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="CA">California</MenuItem>
          <MenuItem value="NY">New York</MenuItem>
          <MenuItem value="DL">Delhi</MenuItem>
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        size="small"
        onClick={() => {
          filters.setDepartment(null)
          filters.setCountry(null)
          filters.setState(null)
        }}
      >
        Clear
      </Button>
    </Box>
  )
}
