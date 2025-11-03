import axios from 'axios'

// Base URL - update if deploying to production
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export type DriveFile = { id: string; name: string }

export async function analyzeCompany(companyName: string) {
  try {
    const formData = new FormData()
    formData.append('company_name', companyName)

    const response = await axios.post(`${BASE_URL}/api/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  } catch (error: any) {
    console.error('Error analyzing company:', error)
    throw error
  }
}

// Fetch files from cloud storage (supports folder navigation)
export async function fetchFiles(source: string, folderId: string = 'root') {
  const form = new FormData()
  form.append('source', source)
  form.append('folder_id', folderId)
  const { data } = await apiClient.post('/api/fetch_files', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
// Download file directly via backend
export async function downloadDriveFile(fileId: string) {
  const form = new FormData()
  form.append('file_id', fileId)
  const { data } = await apiClient.post('/api/download_file', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// Trigger a real browser download
export async function downloadAndSaveDriveFile(fileId: string, fileName?: string) {
  try {
    const form = new FormData()
    form.append('file_id', fileId)

    // Ask backend to prepare the file
    const { data } = await apiClient.post('/api/download_file', form, { responseType: 'json' })
    if (data.error) throw new Error(data.error)

    // Fetch actual file bytes
    const response = await fetch(`/shared_downloads/${fileName || data.path.split('/').pop()}`)
    const blob = await response.blob()

    // Trigger browser download
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || data.path.split('/').pop()
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)

    return { success: true }
  } catch (error) {
    console.error('Download failed:', error)
    return { success: false, error }
  }
}

export async function getCompetitors(companyName: string) {
  try {
    const formData = new FormData();
    formData.append("company_name", companyName);

    const response = await axios.post(`${BASE_URL}/api/competitors`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching competitors:", error);
    throw error;
  }
}

export const uploadForInternalAudit = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post('/api/internal_compliance_audit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}


export const runExternalIntelligence = async (industry: string) => {
  const response = await apiClient.get('/api/external_intelligence', {
    params: { industry },
  })
  return response.data
}

export const runRagCompliance = async (file: File, regulations: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('regulations', regulations)
  const response = await apiClient.post('/api/rag_compliance_analysis', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const getSourceGraph = async (platform: string) => {
  const response = await apiClient.get('/api/source_graph', {
    params: { platform },
  })
  return response.data
}

export interface Obligation {
  id?: number
  description: string
  regulation: string
  due_date: string // ISO format: "2025-12-31"
}

export const createObligation = async (obligation: Obligation) => {
  const formData = new FormData()
  formData.append('description', obligation.description)
  formData.append('regulation', obligation.regulation)
  formData.append('due_date', obligation.due_date)
  const response = await apiClient.post('/api/obligation', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const getObligations = async () => {
  const response = await apiClient.get('/api/obligations')
  return response.data
}

export interface RemediationTask {
  id?: number
  obligation_id: number
  assigned_to: string
  sla_due: string
  state?: string
  checklist_template?: Record<string, any>
  breach_flag?: boolean
}

export const createTask = async (task: RemediationTask) => {
  const formData = new FormData()
  formData.append('obligation_id', task.obligation_id.toString())
  formData.append('assigned_to', task.assigned_to)
  formData.append('sla_due', task.sla_due)
  formData.append('checklist_template', JSON.stringify(task.checklist_template || {}))
  const response = await apiClient.post('/api/task', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const getTasks = async () => {
  const response = await apiClient.get('/api/tasks')
  return response.data
}

export const getTask = async (taskId: number) => {
  const response = await apiClient.get(`/api/task/${taskId}`)
  return response.data
}

export const transitionTask = async (taskId: number, newState: string, user: string = 'system') => {
  const formData = new FormData()
  formData.append('new_state', newState)
  formData.append('user', user)
  const response = await apiClient.post(`/api/task/${taskId}/transition`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export interface Evidence {
  id?: number
  task_id: number
  chromadb_id?: string
  valid?: boolean
  validation_errors?: string[]
  approved_by?: string
  approved_on?: string
  attestation_hash?: string
}

export const uploadEvidence = async (taskId: number, file: File, user: string = 'system') => {
  const formData = new FormData()
  formData.append('evidence_file', file)
  formData.append('user', user)
  const response = await apiClient.post(`/api/task/${taskId}/evidence`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const getEvidence = async (taskId: number) => {
  const response = await apiClient.get(`/api/task/${taskId}/evidence`)
  return response.data
}

export const attestEvidence = async (evidenceId: number, user: string) => {
  const formData = new FormData()
  formData.append('user', user)
  const response = await apiClient.post(`/api/evidence/${evidenceId}/attest`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export interface DashboardSummary {
  total_tasks: number
  done: number
  breached: number
  overdue: number
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await apiClient.get('/api/dashboard/summary')
  return response.data
}

export interface AuditLogEntry {
  id: number
  entity_type: string
  entity_id: number
  action: string
  user: string
  timestamp: string
  detail: string
}

export const getAuditLog = async (limit: number = 100): Promise<AuditLogEntry[]> => {
  const response = await apiClient.get('/api/audit_log', {
    params: { limit },
  })
  return response.data
}

export const healthCheck = async () => {
  const response = await apiClient.get('/')
  return response.data
}

// Export the axios instance for custom requests
export default apiClient
