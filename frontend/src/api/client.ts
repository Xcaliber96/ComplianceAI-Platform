import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: false
})

export type DriveFile = { id: string; name: string }

export async function fetchFiles(source: string) {
  const form = new FormData()
  form.append('source', source)
  const { data } = await api.post('/fetch_files', form)
  return data
}

export async function downloadDriveFile(fileId: string) {
  const form = new FormData()
  form.append('file_id', fileId)
  const { data } = await api.post('/download_file', form)
  return data
}

export async function uploadForInternalAudit(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/internal_compliance_audit', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function runExternalIntelligence(industry: string) {
  const { data } = await api.get('/external_intelligence', {
    params: { industry }
  })
  return data
}

export async function runRagCompliance(file: File, regulations: string) {
  const form = new FormData()
  form.append('file', file)
  form.append('regulations', regulations)
  const { data } = await api.post('/rag_compliance_analysis', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function getSourceGraph(platform: string) {
  const { data } = await api.get('/source_graph', { params: { platform } })
  return data
}
