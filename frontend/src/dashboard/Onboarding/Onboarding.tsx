import React, { useState, useEffect } from "react";
 import {Box,Typography,TextField,Button,MenuItem,Stack,Paper,IconButton,Divider,Chip,
 } from "@mui/material";
 import ArrowBackIcon from "@mui/icons-material/ArrowBack";
 import { useNavigate } from "react-router-dom";
 import { updateUserProfile, getUserProfile } from "../../api/client";
 
 export default function Onboarding() {
 const navigate = useNavigate();
 const [fullName, setFullName] = useState("");
 const [displayName, setDisplayName] = useState("");
 const [jobTitle, setJobTitle] = useState("");
 const [companyName, setCompanyName] = useState("");
 const [department, setDepartment] = useState("");
 const [industry, setIndustry] = useState("");
 
 // Edit mode
 const [isEditing, setIsEditing] = useState(false);
 const [isSaving, setIsSaving] = useState(false);
 
 const departments = [
 "Compliance",
 "Information Security",
 "Legal",
 "Finance",
 "HR",
 "Operations",
 "IT",
 "Procurement",
 "Other",
 ];
 
 const industries = [
 "Technology",
 "Healthcare",
 "Finance",
 "Manufacturing",
 "Retail",
 "Education",
 "Government",
 "Other",
 ];
 
 const handleSave = async () => {
 if (!displayName || !companyName || !department) {
 alert("Please fill all required fields");
 return;
 }
 
 const uid = localStorage.getItem("user_uid");
 if (!uid) {
 alert("User session not found");
 return;
 }
 
 try {
 setIsSaving(true);
 await updateUserProfile({
 uid,
  display_name: displayName,
  full_name: fullName,     
  company_name: companyName,
  department,
  job_title: jobTitle,
  industry,
 });
 
 setIsEditing(false);
 
 // ⭐ Redirect now
 navigate("/dashboard");
 
 } catch (err) {
 console.error(err);
 alert("Saving failed");
 } finally {
 setIsSaving(false);
 }
 };
 
 useEffect(() => {
 const uid = localStorage.getItem("user_uid");
 if (!uid) return;
 
 (async () => {
 try {
 const profile = await getUserProfile(uid);

 setFullName(profile.full_name || "")
 setDisplayName(profile.display_name || "");
 setJobTitle(profile.job_title || "");
 setCompanyName(profile.company_name || "");
 setDepartment(profile.department || "");
 setIndustry(profile.industry || "");
 
 } catch (err) {
 console.error("Failed to load profile:", err);
 }
 })();
 }, []);
 return (
 <Box
 sx={{
 width: "100vw",
 height: "100vh",
 display: "flex",
 overflow: "hidden",
 background: "linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)",
 }}
 >
 {/* Back Button */}
 <IconButton
 onClick={() => navigate(-1)}
 sx={{
 position: "absolute",
 top: 32,
 left: 32,
 background: "rgba(15,23,42,0.05)",
 color: "#0f172a",
 "&:hover": { background: "rgba(15,23,42,0.12)" },
 }}
 >
 <ArrowBackIcon />
 </IconButton>
 
 {}
 <Box
 sx={{
 width: "45%",
 height: "100%",
 display: "flex",
 flexDirection: "column",
 justifyContent: "center",
 px: 10,
 borderRight: "1px solid rgba(148,163,184,0.4)",
 }}
 >
 <Box maxWidth={480}>
 <Typography
 variant="overline"
 sx={{
 letterSpacing: 2,
 fontWeight: 600,
 color: "#6b7280",
 }}
 >
 WORKSPACE SETUP
 </Typography>
 
 <Typography
 variant="h3"
 sx={{
 fontWeight: 800,
 mb: 2,
 color: "#020617",
 lineHeight: 1.1,
 }}
 >
 Organization profile
 </Typography>
 
 <Typography
 variant="h6"
 sx={{
 color: "#4b5563",
 lineHeight: 1.6,
 mb: 3,
 }}
 >
 Define who you are and how your organization operates so NomiAI
 can generate audit-ready views of your controls, teams, and risk
 exposure.
 </Typography>
 
 <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
 <Chip
 label="Single source of truth"
 variant="outlined"
 sx={{ borderRadius: "999px", borderColor: "#0f172a", color: "#0f172a" }}
 />
 <Chip
 label="Aligned with compliance teams"
 variant="outlined"
 sx={{
 borderRadius: "999px",
 borderColor: "#6b7280",
 color: "#6b7280",
 }}
 />
 </Stack>
 </Box>
 </Box>
 
 {/* RIGHT FORM SIDE */}
 <Box
 sx={{
 width: "55%",
 height: "100%",
 display: "flex",
 p: 6,
 justifyContent: "center",
 alignItems: "flex-start",
 overflowY: "auto",
 }}
 >
 <Box sx={{ width: "100%", maxWidth: 720 }}>
 <Paper
 sx={{
 width: "100%",
 p: 4,
 background: "#ffffff",
 border: "1px solid #e2e8f0",
 borderRadius: "18px",
 
 position: "relative",
 }}
 >
 {/* Top bar inside card */}
 <Box
 sx={{
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 mb: 3,
 }}
 >
 <Box>
 <Typography
 variant="subtitle2"
 sx={{ textTransform: "uppercase", color: "#6b7280", mb: 0.5 }}
 >
 Profile ownership
 </Typography>
 <Typography variant="h5" sx={{ fontWeight: 700, color: "#020617" }}>
 Workspace & role information
 </Typography>
 </Box>
 
 <Button
 variant="outlined"
 size="small"
 onClick={() => setIsEditing((prev) => !prev)}
 sx={{
 borderRadius: "999px",
 textTransform: "none",
 fontWeight: 600,
 px: 2.5,
 py: 0.75,
 borderColor: isEditing ? "#0f766e" : "#cbd5e1",
 color: isEditing ? "#0f766e" : "#0f172a",
 backgroundColor: isEditing ? "rgba(15,118,110,0.06)" : "#ffffff",
 "&:hover": {
 borderColor: "#0f766e",
 backgroundColor: "rgba(15,118,110,0.12)",
 },
 }}
 >
 {isEditing ? "Done editing" : "Edit profile"}
 </Button>
 </Box>
 
 <Divider sx={{ mb: 3 }} />
 
 {!isEditing && (
 <Typography
 variant="body2"
 sx={{
 mb: 3,
 color: "#6b7280",
 backgroundColor: "#f9fafb",
 borderRadius: "10px",
 p: 1.5,
 border: "1px dashed #e5e7eb",
 }}
 >
 This profile is currently <strong>locked</strong>. Click{" "}
 <strong>“Edit profile”</strong> to make changes. These details are
 used across audits, supplier reviews, and evidence tracking.
 </Typography>
 )}
 
 <Stack spacing={3}>
<TextField
  label="Full name *"
  fullWidth
  value={fullName}
  disabled={!isEditing}
  onChange={(e) => setFullName(e.target.value)}
/>

<TextField
  label="Display name"
  fullWidth
  value={displayName}
  disabled={!isEditing}
  onChange={(e) => setDisplayName(e.target.value)}
/>
  
 <TextField
 label="Job title"
 fullWidth
 value={jobTitle}
 disabled={!isEditing}
 onChange={(e) => setJobTitle(e.target.value)}
 placeholder="e.g., Chief Compliance Officer, Security Lead"
 />
 
 <TextField
 label="Company name *"
 fullWidth
 value={companyName}
 disabled={!isEditing}
 onChange={(e) => setCompanyName(e.target.value)}
 />
 
 <TextField
 select
 label="Primary department *"
 fullWidth
 value={department}
 disabled={!isEditing}
 onChange={(e) => setDepartment(e.target.value)}
 helperText="This is the function primarily responsible for compliance in your organization."
 >
 {departments.map((d) => (
 <MenuItem key={d} value={d}>
 {d}
 </MenuItem>
 ))}
 </TextField>
 
 <TextField
 select
 label="Industry"
 fullWidth
 value={industry}
 disabled={!isEditing}
 onChange={(e) => setIndustry(e.target.value)}
 >
 {industries.map((i) => (
 <MenuItem key={i} value={i}>
 {i}
 </MenuItem>
 ))}
 </TextField>
 </Stack>
 
 {/* BUTTONS */}
 <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
 <Button
 variant="contained"
 disabled={!isEditing || isSaving}
 onClick={handleSave}
 sx={{
 flex: 1,
 py: 1.4,
 borderRadius: "10px",
 fontWeight: 700,
 textTransform: "none",
 backgroundColor: "#0f172a",
 "&:hover": { backgroundColor: "#020617" },
 }}
 >
 {isSaving ? "Saving..." : "Save changes"}
 </Button>
 
 <Button
 variant="outlined"
 onClick={() => navigate("/dashboard")}
 sx={{
 flex: 1,
 py: 1.4,
 borderRadius: "10px",
 fontWeight: 600,
 textTransform: "none",
 borderColor: "#cbd5e1",
 color: "#0f172a",
 backgroundColor: "#ffffff",
 "&:hover": {
 borderColor: "#0f172a",
 backgroundColor: "#f9fafb",
 },
 }}
 >
 Skip for now
 </Button>
 </Box>
 </Paper>
 
 {/* Bottom hint */}
 <Typography
 variant="caption"
 sx={{ display: "block", mt: 2, color: "#6b7280" }}
 >
 Changes to this profile may be reflected in audit logs, supplier
 assessments, and remediation workflows initiated by NomiAI.
 </Typography>
 </Box>
 </Box>
 </Box>
 );
 }
