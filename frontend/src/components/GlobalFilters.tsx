import { Box, FormControl, InputLabel, MenuItem, Select, Stack, Typography, Button } from '@mui/material'
import { useFilters } from '../store/filters'
import { useEffect, useMemo, useState } from 'react'

const departments = ['Legal', 'HR', 'Finance', 'IT', 'Operations']

export default function GlobalFilters() {
  const { department, country, state, setDepartment, setCountry, setState, reset } = useFilters()
  const [countries, setCountries] = useState<{ name: string; isoCode: string }[]>([])
  const [states, setStates] = useState<{ name: string; isoCode: string }[]>([])

  useEffect(() => {
    // Dynamically import the package
    import('react-country-state-city').then((module: any) => {
      module.Country.getAllCountries().then((list: any[]) => {
        setCountries(list.map((c: any) => ({ name: c.name, isoCode: c.isoCode })))
      })
    })
  }, [])
  useEffect(() => {
    import('react-country-state-city').then((module: any) => {
      console.log(module);
    });
  }, []);
  

  useEffect(() => {
    if (country) {
      import('react-country-state-city').then((module: any) => {
        module.State.getStatesOfCountry(country).then((list: any[]) => {
          setStates(list.map((s: any) => ({ name: s.name, isoCode: s.isoCode })))
        })
      })
    } else {
      setStates([])
    }
  }, [country])

  const countryLabel = useMemo(() => countries.find((c) => c.isoCode === country)?.name ?? '', [country, countries])
  const stateLabel = useMemo(() => states.find((s) => s.isoCode === state)?.name ?? '', [state, states])

  return (
    <Box sx={{ p: 2, borderBottom: '1px solid #eee', background: '#fafafa' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="subtitle1">Filters</Typography>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Department</InputLabel>
          <Select value={department ?? ''} label="Department" onChange={(e) => setDepartment(e.target.value || null)}>
            <MenuItem value=""><em>All</em></MenuItem>
            {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Country</InputLabel>
          <Select value={country ?? ''} label="Country" onChange={(e) => setCountry(e.target.value || null)}>
            <MenuItem value=""><em>All</em></MenuItem>
            {countries.map((c) => <MenuItem key={c.isoCode} value={c.isoCode}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }} disabled={!country}>
          <InputLabel>State</InputLabel>
          <Select value={state ?? ''} label="State" onChange={(e) => setState(e.target.value || null)}>
            <MenuItem value=""><em>All</em></MenuItem>
            {states.map((s) => <MenuItem key={s.isoCode} value={s.isoCode}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>

        <Button onClick={reset} variant="outlined">Clear</Button>
        <Typography variant="caption" color="text.secondary">
          Dept: {department ?? 'All'} | Country: {countryLabel || 'All'} | State: {stateLabel || 'All'}
        </Typography>
      </Stack>
    </Box>
  )
}
