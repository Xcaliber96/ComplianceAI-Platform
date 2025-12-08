import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { ArrowLeft } from "lucide-react"; 
import { updateUserProfile, getUserProfile } from "../../api/client";

export default function OnboardingPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [department, setDepartment] = useState("");
  const [industry, setIndustry] = useState("");

  const [isEditing, setIsEditing] = useState(true);
  const [saving, setSaving] = useState(false);

  const departments = [
    "Compliance", "Information Security", "Legal", "Finance",
    "HR", "Operations", "IT", "Procurement", "Other",
  ];

  const industries = [
    "Technology", "Healthcare", "Finance", "Manufacturing",
    "Retail", "Education", "Government", "Other",
  ];

  async function handleSave() {
    if (!displayName || !companyName || !department) return alert("Fill all required fields");

    const uid = localStorage.getItem("user_uid");
    if (!uid) return alert("User session missing");

    try {
      setSaving(true);

      await updateUserProfile({
        uid,
        full_name: fullName,
        display_name: displayName,
        job_title: jobTitle,
        company_name: companyName,
        department,
        industry,
      });

      navigate("/dashboard/results");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const uid = localStorage.getItem("user_uid");
    if (!uid) return;

    (async () => {
      const p = await getUserProfile(uid);

      setFullName(p.full_name || "");
      setDisplayName(p.display_name || "");
      setJobTitle(p.job_title || "");
      setCompanyName(p.company_name || "");
      setDepartment(p.department || "");
      setIndustry(p.industry || "");
    })();
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-green-50/40 to-gray-100">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
         className="absolute top-6 left-6 z-50 p-2 bg-white rounded-xl shadow hover:bg-green-50 transition"
      >
        <ArrowLeft className="w-5 h-5 text-green-700"  />
      </button>

      {/* LEFT PANEL */}
      <div className="w-[45%] border-r border-gray-200 flex items-center px-14 bg-white/60 backdrop-blur-sm">
        <div className="max-w-lg">
          <p className="uppercase tracking-[0.2em] text-green-700 font-semibold">
            Workspace Setup
          </p>

          <h1 className="text-4xl font-bold mt-3 text-gray-900">
            Organization profile
          </h1>

          <p className="text-gray-600 text-lg mt-3 leading-relaxed">
            Define who you are and how your organization operates so NomiAI
            can generate audit-ready views of your controls, teams, and risk exposure.
          </p>

          <div className="flex gap-3 mt-6">
            <span className="px-3 py-1 text-xs rounded-full border border-green-700 text-green-700 bg-green-50">
              Single source of truth
            </span>
            <span className="px-3 py-1 text-xs rounded-full border border-green-300 text-green-800 bg-green-50/60">
              Compliance aligned
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-[55%] p-10 overflow-y-auto flex justify-center">
        <div className="w-full max-w-3xl">
          <Card className="border border-green-100 shadow-md rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-green-800">
                Workspace & role information
              </CardTitle>
              <CardDescription className="text-gray-600">
                These details help tailor your workspace, audit mapping, and compliance workflows.
              </CardDescription>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6 space-y-6">
              {/* FULL NAME */}
              <div className="space-y-2">
                <Label className="text-green-900">Full name *</Label>
                <Input
                  disabled={!isEditing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="focus-visible:ring-green-600"
                />
              </div>

              {/* DISPLAY NAME */}
              <div className="space-y-2">
                <Label className="text-green-900">Display name</Label>
                <Input
                  disabled={!isEditing}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="focus-visible:ring-green-600"
                />
              </div>

              {/* JOB TITLE */}
              <div className="space-y-2">
                <Label className="text-green-900">Job title</Label>
                <Input
                  disabled={!isEditing}
                  placeholder="e.g. Chief Compliance Officer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="focus-visible:ring-green-600"
                />
              </div>

              {/* COMPANY NAME */}
              <div className="space-y-2">
                <Label className="text-green-900">Company name *</Label>
                <Input
                  disabled={!isEditing}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="focus-visible:ring-green-600"
                />
              </div>

              {/* DEPARTMENT */}
              <div className="space-y-2">
                <Label className="text-green-900">Primary department *</Label>

<Select
  disabled={!isEditing}
  value={department}
  onValueChange={setDepartment}
>
  <SelectTrigger className="rounded-xl">
    <SelectValue placeholder="Select department" />
  </SelectTrigger>

  <SelectContent>
    {departments.map((d) => (
      <SelectItem key={d} value={d}>
        {d}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

                <p className="text-xs text-gray-500">
                  This is the department primarily responsible for compliance.
                </p>
              </div>

              {/* INDUSTRY */}
              <div className="space-y-2">
                <Label className="text-green-900">Industry</Label>
<Select
  disabled={!isEditing}
  value={industry}
  onValueChange={setIndustry}
>
  <SelectTrigger className="rounded-xl">
    <SelectValue placeholder="Select industry" />
  </SelectTrigger>

  <SelectContent>
    {industries.map((i) => (
      <SelectItem key={i} value={i}>
        {i}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 pt-4">
                <Button
                  disabled={!isEditing || saving}
                  onClick={handleSave}
                  className="flex-1 rounded-xl bg-green-700 text-white hover:bg-green-800"
                >
                  {saving ? "Saving..." : "Save changes"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard/results")}
                  className="flex-1 rounded-xl border-green-300 text-green-800 hover:bg-green-50"
                >
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-gray-500 mt-4">
            Profile updates may appear in audit logs, supplier assessments, and remediation workflows.
          </p>
        </div>
      </div>
    </div>
  );
}
