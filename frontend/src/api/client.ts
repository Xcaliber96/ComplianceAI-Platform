import axios from "axios";

const rawEnvBase = import.meta.env.VITE_API_BASE_URL;

// 🔍 startup debug
console.log("[client.ts] raw VITE_API_BASE_URL:", rawEnvBase);
console.log("[client.ts] window.location.hostname:", window.location.hostname);

export const BASE_URL =
  rawEnvBase && rawEnvBase.trim() !== ""
    ? rawEnvBase.trim()
    : window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://api.nomioc.com";

console.log("[client.ts] RESOLVED BASE_URL:", BASE_URL);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn("Session expired or unauthorized. Please log in again.");
      // Optional:  redirect to login or clear local session here
    }
    return Promise.reject(err);
  }
);
export async function fetchWorkspace(user_id: string) {
  const res = await apiClient.get(`/api/workspace/${user_id}/regulations`);
  return res.data;
}

export async function toggleRegulation(user_id: string, reg_id: string) {
  try {
    const res = await apiClient.post(`/api/workspace/${user_id}/toggle/${reg_id}`);
    return res.data;
  } catch (err: any) {
    console.error("Toggle regulation failed:", err);
    throw err;
  }
}
export async function fetchStateRegulations(state: string, query: string) {
  const res = await apiClient.get("/api/regulations/state", {
    params: { state, q: query },
  });

  return res.data.results; // backend returns { results: [...] }
}

export async function wizardSearch(params: {
  sourceType: "government" | "state";
  mode: "topic" | "packageId" | "ruleNumber";
  query: string;
  state?: string;
}) {
  const res = await apiClient.post("/api/regulations/wizard_search", params);

  if (Array.isArray(res.data)) {
    return res.data;
  }

  if (res.data && res.data.results) {
    return res.data.results;
  }

  return [];
}

export async function getLocalPackages() {
  const res = await apiClient.get("/api/regulations/local/packages");
  return res.data; // { count, packages }
}
export async function getGranulesForPackage(packageId: string) {
  const res = await apiClient.get(`/api/regulations/local/granules/${packageId}`);
  return res.data; // { package_id, count, granules }
}
export async function localGranuleSearch(query: string) {
  const res = await apiClient.get("/api/regulations/local_search", {
    params: { q: query }
  });
  return res.data; // { query, results_count, results }
}
export async function getAllLocalGranules() {
  const res = await apiClient.get("/api/regulations/local/granules");
  return res.data; // { count, granules }
}
export async function searchFederalRegulations(query: string) {
  if (!query || query.trim() === "") {
    return { error: "Empty query" };
  }

  const res = await apiClient.get("/api/regulations/search", {
    params: { q: query },
  });

  return res.data;
}

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const res = await apiClient.get(`/api/users/profile/${uid}`);
  return res.data;
}
export const updateUserProfile = async (profile: {
  uid: string;
  display_name: string;   // used for full_name too
  company_name: string;
  full_name: string;
  department: string;
  job_title?: string;
  industry?: string;
}) => {
  const form = new FormData();

  form.append("uid", profile.uid);

  // Send BOTH fields
  form.append("display_name", profile.display_name);
  form.append("full_name", profile.display_name);  // ⭐ important

  form.append("company_name", profile.company_name);
  form.append("department", profile.department);

  if (profile.job_title) form.append("job_title", profile.job_title);
  if (profile.industry) form.append("industry", profile.industry);

  const { data } = await apiClient.post(`/api/users/setup_profile`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
};

export const getRegulation = async (packageId: string) => {
  if (!packageId) throw new Error("Package ID is required");

  const { data } = await apiClient.get("/regulations", {
    params: { q: packageId },
  });

  return data;
};

export interface UserProfile {
  uid: string;
  display_name: string;
  full_name?: string;
  company_name: string;
  job_title?: string;
  department: string;
  industry?: string;
}
export const uploadToFileHub = async (
  file: File,
  user_uid: string,
  file_type: string,
  used_for: string,
  department: string      
) => {
  const form = new FormData();
  form.append("file", file);
  form.append("user_uid", user_uid);
  form.append("file_type", file_type);
  form.append("used_for", used_for);
  form.append("department", department);   

  const { data } = await apiClient.post("/api/filehub/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
};

export const getDirectFileUrl = (file_id: string, user_uid: string) => {
  return `${BASE_URL}/api/filehub/${file_id}/direct?user_uid=${user_uid}`;
};

export const getFileHubFiles = async (user_uid: string) => {
  const { data } = await apiClient.get(`/api/filehub`, {
    params: { user_uid },
  })
  return data.files
}

export const getBasicUserInfo = async (uid: string) => {
  if (!uid) return { display_name: "Unknown" };

  const { data } = await apiClient.get(`/api/users/basic_info/${uid}`);
  return data;
};

export const viewFileHubFile = async (file_id: string, user_uid: string) => {
  const response = await apiClient.get(`/api/filehub/${file_id}`, {
    params: { user_uid },
    responseType: "blob", 
  })
  return response
}

export const deleteFileHubFile = async (file_id: string, user_uid: string) => {
  const { data } = await apiClient.delete(`/api/filehub/${file_id}`, {
    params: { user_uid },
  })
  return data
}

export const downloadFileHubFile = async (file_id: string, user_uid: string) => {
  // This will return a real file download stream
  const url = `${BASE_URL}/api/filehub/${file_id}/download?user_uid=${user_uid}`

  const link = document.createElement("a")
  link.href = url
  link.download = ""
  link.click()
}

export type DriveFile = { id: string; name: string }
export async function checkBackendReady() {
  try {
    const res = await fetch(`${BASE_URL}/`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export const getAllFiles = async () => {
  const response = await apiClient.get("/api/files");
  return response.data;
};

// Delete a file
export const deleteFileHubItem = async (fileId: string) => {
  const response = await apiClient.delete(`/api/files/${fileId}`);
  return response.data;
};

export async function loginWithFirebaseToken(user: any) {

  const idToken = await user.getIdToken();
  const { data } = await apiClient.post(
    "/session/login",
    {
      idToken,
      uid: user.uid,
      email: user.email,
    },
    {
      withCredentials: true,  // ensures session cookie is stored
      headers: { "Content-Type": "application/json" }, // explicit for clarity
    }
  );
  console.log("LOGIN DEBUG — FRONTEND SENDING:");
  console.log("→ idToken (first 50 chars):", idToken.substring(0, 50) + "...");
  console.log("→ uid:", user.uid);
  console.log("→ email:", user.email);
  console.log("→ BASE_URL:", BASE_URL);
  return data;
}
export async function getCurrentSession() {
  const res = await fetch(`${BASE_URL}/session/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}
export async function logoutSession() {
  const { data } = await apiClient.post('/session/logout')
  return data
}

export async function analyzeCompany(companyName: string) {
  try {
    const formData = new FormData()
    formData.append('company_name', companyName)

const response = await apiClient.post(`/api/analyze`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
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

const response = await apiClient.post(`/api/competitors`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})

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
export const getSampleRegulations = async () => {
  const { data } = await apiClient.get("/api/regulations/library");
  return data.library; // returns array of {name, region, description}
};
export async function importRegulations(user_uid: string, regulations: any[]) {
  const res = await apiClient.post("/api/regulations/import", {
    user_uid,
    regulations,
  });

  return res.data;
}

export const runRagCompliance = async (
  file: File,
  regulations: string,
  supplierId: string
) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('regulations', regulations)
  formData.append('supplierid', supplierId) 

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
export const createTask = async (taskData: {
    obligation_id: number
    assigned_to: string
    sla_due: string
    supplier_id?: string | null
    user_uid: string         
  }) => {
    const formData = new FormData()
    formData.append("obligation_id", taskData.obligation_id.toString())
    formData.append("assigned_to", taskData.assigned_to)
    formData.append("sla_due", taskData.sla_due)
    formData.append("user_uid", taskData.user_uid) 

    if (taskData.supplier_id) {
      formData.append("supplier_id", taskData.supplier_id) // ✅ added
    }

    const response = await apiClient.post("/api/task", formData, {
      headers: { "Content-Type": "multipart/form-data" },
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
export const runAuditOnFile = async (fileId: string, user_uid: string) => {
  return apiClient
    .get(`/api/audit/run/${fileId}`, {
      params: { user_uid },
    })
    .then((res) => res.data);
};
export async function extractFile(fileId: string, user_uid: string) {
  const res = await fetch(
    `${BASE_URL}/api/filehub/${fileId}/extract?user_uid=${user_uid}`
  );

  if (!res.ok) {
    throw new Error("Extraction failed");
  }

  return res.json();
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
