import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Drawer,
  IconButton,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import {
  extractFile,
  runAuditOnFile,
  getDirectFileUrl,
  BASE_URL,
} from "../../api/client";

const BG_MAIN = "#fcfcfc";
const CARD_BORDER = "#232323";
const CARD_BG = "#ffffff";
const HEADING_BLACK = "#151515";

// 🔍 top-level debug
console.log("🔎 [AuditRunner] component module loaded");
console.log("🌐 [AuditRunner] BASE_URL from client.ts:", BASE_URL);
console.log("🌐 [AuditRunner] window.location:", {
  origin: window.location.origin,
  hostname: window.location.hostname,
  href: window.location.href,
});

type Metadata = {
  mandatory_metadata?: {
    document_type?: string | null;
    category?: string | null;
    company_names?: string[];
    supplier_name?: string | null;
    country?: string | null;
    jurisdiction?: string | null;
    industry?: string | null;
    department_owner?: string | null;
    effective_date?: string | null;
    last_updated?: string | null;
  };
  risks_obligations?: {
    regulations_mentioned?: string[];
    frameworks_mentioned?: string[];
    risk_keywords?: string[];
    risk_summary?: string | null;
  };
  compliance_clauses?: Record<string, any>;
  enforcement_deadlines?: Record<string, any>;
};

// TEMP URL PATCH (in case something still generates "://...")
const FALLBACK_BASE_URL = "http://localhost:8000";
function fixUrl(url: string) {
  if (url.startsWith("://")) {
    const fixed = `${FALLBACK_BASE_URL}${url.replace("://", "")}`;
    console.warn("⚠️ [AuditRunner] fixUrl patched bad URL:", {
      original: url,
      fixed,
    });
    return fixed;
  }
  return url;
}

type AuditFinding = {
  requirement?: string;
  status?: string;
  details?: string;
  evidence?: string;
  [key: string]: any;
};

export default function AuditRunner() {
  const { id } = useParams<{ id: string }>();
  const user_uid = localStorage.getItem("user_uid") || "";

  console.log("🧩 [AuditRunner] params / localStorage:", { id, user_uid });

  const [metaLoading, setMetaLoading] = useState(true);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  // 1) Load extracted metadata for this file on mount
  useEffect(() => {
    console.log("[AuditRunner/useEffect] running with deps:", { id, user_uid });

    if (!id || !user_uid) {
      console.error(
        "❌ [AuditRunner/useEffect] Missing id or user_uid",
        { id, user_uid }
      );
      setMetaError("Missing file id or user session.");
      setMetaLoading(false);
      return;
    }

    const debugDirectUrl = getDirectFileUrl(id, user_uid);
    console.log("[AuditRunner/useEffect] Direct file URL from client:", {
      id,
      user_uid,
      directUrl: debugDirectUrl,
    });

    async function loadMetadata() {
      console.log("[AuditRunner/loadMetadata] START", { id, user_uid });
      try {
        setMetaLoading(true);
        setMetaError(null);

        const resp = await extractFile(id, user_uid);
        console.log("[AuditRunner/loadMetadata] extractFile response:", resp);

        // resp shape: { status, file_id, file_name, extraction: {...} }
        setMetadata(resp.extraction);
        setFileName(resp.file_name);
      } catch (err: any) {
        console.error("[AuditRunner/loadMetadata] Metadata load error:", err);
        setMetaError("Failed to load extracted metadata.");
      } finally {
        console.log("[AuditRunner/loadMetadata] FINISH");
        setMetaLoading(false);
      }
    }

    loadMetadata();
  }, [id, user_uid]);

  const handleRunAudit = async () => {
    console.log("[AuditRunner/handleRunAudit] clicked", {
      id,
      user_uid,
      BASE_URL,
    });

    if (!id || !user_uid) {
      console.error(
        "❌ [AuditRunner/handleRunAudit] Missing id or user_uid",
        { id, user_uid }
      );
      return;
    }

    try {
      setAuditLoading(true);
      setAuditError(null);
      setFindings([]);

      console.log("[AuditRunner/handleRunAudit] calling runAuditOnFile...", {
        fileId: id,
        user_uid,
      });

      const resp = await runAuditOnFile(id, user_uid).catch((err) => {
        console.error("❌ [AuditRunner/handleRunAudit] Axios error (patched):", err);

        // try to dump useful axios fields if present
        // (defensive: only access if they exist)
        const cfg: any = (err && err.config) || {};
        const req: any = (err && err.request) || {};

        console.log("[AuditRunner/handleRunAudit] err.config summary:", {
          baseURL: cfg.baseURL,
          url: cfg.url,
          method: cfg.method,
          params: cfg.params,
          fullUrl: `${cfg.baseURL || ""}${cfg.url || ""}`,
        });
        console.log("[AuditRunner/handleRunAudit] err.request summary:", {
          responseURL: req.responseURL,
          status: req.status,
          readyState: req.readyState,
        });

        throw err;
      });

      console.log("[AuditRunner/handleRunAudit] Backend response:", resp);

      // resp shape: { status, file, results, total }
      if (resp.status !== "success") {
        console.error(
          "❌ [AuditRunner/handleRunAudit] resp.status not success:",
          resp.status
        );
        setAuditError("Audit failed on backend.");
        return;
      }

      setFileName(resp.file ?? fileName);
      const nextFindings = Array.isArray(resp.results) ? resp.results : [];
      console.log(
        "[AuditRunner/handleRunAudit] Parsed findings length:",
        nextFindings.length
      );
      setFindings(nextFindings);
    } catch (err: any) {
      console.error("❌ [AuditRunner/handleRunAudit] Audit run error:", err);
      setAuditError("Audit run failed.");
    } finally {
      console.log("[AuditRunner/handleRunAudit] FINISH");
      setAuditLoading(false);
    }
  };

  const docMeta = metadata?.mandatory_metadata || {};
  const riskMeta = metadata?.risks_obligations || {};

  const supplierName =
    docMeta.supplier_name ||
    (docMeta.company_names && docMeta.company_names[0]) ||
    null;

  const regulationsList = riskMeta.regulations_mentioned || [];
  const frameworksList = riskMeta.frameworks_mentioned || [];

  const rawDocLink = id && user_uid ? getDirectFileUrl(id, user_uid) : "";
  const docLink = fixUrl(rawDocLink);

  console.log("[AuditRunner] docLink debug:", {
    id,
    user_uid,
    rawDocLink,
    fixedDocLink: docLink,
  });

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        width: "100%",
        bgcolor: BG_MAIN,
        py: 4,
      }}
    >
      <Grid container spacing={3}>
        {/* LEFT: Document profile */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${CARD_BORDER}`,
              background: CARD_BG,
              boxShadow: "0 1px 10px rgba(35,35,35,0.04)",
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: HEADING_BLACK, mb: 1 }}
              >
                Document Profile
              </Typography>
              <Divider sx={{ my: 1.5, borderColor: CARD_BORDER }} />

              {metaLoading && (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <CircularProgress size={24} />
                  <Typography sx={{ mt: 1 }} variant="body2">
                    Reading extracted metadata…
                  </Typography>
                </Box>
              )}

              {!metaLoading && metaError && (
                <Typography color="error" variant="body2">
                  {metaError}
                </Typography>
              )}

              {!metaLoading && !metaError && (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#64748b", mb: 0.5 }}
                  >
                    File
                  </Typography>
                  <Typography sx={{ fontWeight: 600, mb: 1.5 }}>
                    {fileName || `File ID: ${id}`}
                  </Typography>

                  {docLink && (
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{
                        mb: 2,
                        borderRadius: 3,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                      onClick={() => {
                        console.log("[AuditRunner] Opening PDF link:", docLink);
                        window.open(docLink, "_blank");
                      }}
                    >
                      Open PDF
                    </Button>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#64748b", mb: 0.5 }}
                  >
                    Detected Supplier
                  </Typography>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>
                    {supplierName || "Not clearly detected"}
                  </Typography>

                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#64748b", mb: 0.5 }}
                  >
                    Document Type / Category
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    {docMeta.document_type && (
                      <Chip
                        label={docMeta.document_type}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    )}
                    {docMeta.category && (
                      <Chip
                        label={docMeta.category}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    )}
                  </Box>

                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#64748b", mb: 0.5 }}
                  >
                    Jurisdiction / Country
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    {docMeta.country && (
                      <Chip
                        label={docMeta.country}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    )}
                    {docMeta.jurisdiction && (
                      <Chip
                        label={docMeta.jurisdiction}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    )}
                  </Box>

                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#64748b", mb: 0.5 }}
                  >
                    Expected Owner Department
                  </Typography>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>
                    {docMeta.department_owner || "Not inferred"}
                  </Typography>

                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#64748b", mb: 0.5 }}
                  >
                    Regulations Mentioned
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    {regulationsList.length ? (
                      regulationsList.map((r) => (
                        <Chip
                          key={r}
                          label={r}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        None clearly detected
                      </Typography>
                    )}
                  </Box>

                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#64748b", mb: 0.5 }}
                  >
                    Frameworks Mentioned
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    {frameworksList.length ? (
                      frameworksList.map((f) => (
                        <Chip
                          key={f}
                          label={f}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        None clearly detected
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      borderRadius: 3,
                      py: 1.4,
                      mb: 1.5,
                      textTransform: "none",
                      fontWeight: 700,
                      background: HEADING_BLACK,
                      "&:hover": { background: "#111827" },
                    }}
                    onClick={handleRunAudit}
                    disabled={auditLoading}
                  >
                    {auditLoading ? "Running Audit…" : "Run Compliance Audit"}
                  </Button>

                  <Button
                    variant="text"
                    fullWidth
                    startIcon={<InfoOutlinedIcon />}
                    sx={{
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      console.log("[AuditRunner] Opening metadata drawer");
                      setDrawerOpen(true);
                    }}
                  >
                    View full extracted metadata
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT: Audit results */}
        <Grid item xs={12} md={8}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${CARD_BORDER}`,
              background: CARD_BG,
              boxShadow: "0 1px 10px rgba(35,35,35,0.04)",
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: HEADING_BLACK }}
              >
                Audit Results
              </Typography>
              <Divider sx={{ my: 1.5, borderColor: CARD_BORDER }} />

              {auditLoading && (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 1.5 }} variant="body2">
                    Running RAG compliance checks on this document…
                  </Typography>
                </Box>
              )}

              {!auditLoading && auditError && (
                <Typography color="error" variant="body2">
                  {auditError}
                </Typography>
              )}

              {!auditLoading && !auditError && findings.length === 0 && (
                <Box sx={{ py: 4, textAlign: "center", color: "#64748b" }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    No audit has been run yet for this file.
                  </Typography>
                  <Typography variant="body2">
                    Use the “Run Compliance Audit” button on the left to
                    generate findings.
                  </Typography>
                </Box>
              )}

              {!auditLoading && !auditError && findings.length > 0 && (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#64748b", mb: 1 }}
                  >
                    Total findings: {findings.length}
                  </Typography>

                  <List>
                    {findings.map((f, idx) => (
                      <ListItem
                        key={idx}
                        sx={{
                          mb: 1.5,
                          borderRadius: 3,
                          border: "1px solid #e2e8f0",
                          alignItems: "flex-start",
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mb: 0.5,
                              }}
                            >
                              <Typography sx={{ fontWeight: 700 }}>
                                {f.requirement || `Requirement #${idx + 1}`}
                              </Typography>
                              {f.status && (
                                <Chip
                                  label={f.status}
                                  size="small"
                                  sx={{
                                    fontWeight: 600,
                                    bgcolor:
                                      f.status === "Compliant"
                                        ? "#22c55e"
                                        : f.status === "Risk"
                                        ? "#eab308"
                                        : "#ef4444",
                                    color: "#fff",
                                  }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              {f.details && (
                                <Typography
                                  variant="body2"
                                  sx={{ mb: 0.5, color: "#0f172a" }}
                                >
                                  {f.details}
                                </Typography>
                              )}
                              {f.evidence && (
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#64748b" }}
                                >
                                  Evidence: {f.evidence}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Drawer for raw metadata JSON */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => {
          console.log("[AuditRunner] Closing metadata drawer");
          setDrawerOpen(false);
        }}
      >
        <Box sx={{ width: 400, p: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 1,
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Extracted Metadata
            </Typography>
            <IconButton
              onClick={() => {
                console.log("[AuditRunner] X icon clicked, closing drawer");
                setDrawerOpen(false);
              }}
            >
              ✕
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              fontFamily: "monospace",
              fontSize: 12,
              whiteSpace: "pre-wrap",
              maxHeight: "80vh",
              overflow: "auto",
              bgcolor: "#f8fafc",
              p: 1.5,
              borderRadius: 1,
              border: "1px solid #e2e8f0",
            }}
          >
            {metadata ? (
              JSON.stringify(metadata, null, 2)
            ) : (
              <Typography variant="body2" color="text.secondary">
                No metadata available.
              </Typography>
            )}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
