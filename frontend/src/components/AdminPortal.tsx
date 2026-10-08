"use client";

import React, { useState, useEffect } from "react";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Database, 
  Plus, 
  Tag, 
  Layers,
  ArrowRight,
  Download
} from "lucide-react";
import { api, MetaItem } from "@/lib/api";
import { BentoCard } from "@/components/BentoCard";

interface AliasItem {
  id: number;
  alias_name: string;
  skill_id: number;
  canonical_skill_name: string;
  category_name: string;
}

interface AdminPortalProps {
  onOpenSync?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onOpenSync }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  const [aliases, setAliases] = useState<AliasItem[]>([]);
  const [skills, setSkills] = useState<MetaItem[]>([]);
  const [newAliasName, setNewAliasName] = useState<string>("");
  const [selectedSkillId, setSelectedSkillId] = useState<number | "">("");

  const [refreshingMV, setRefreshingMV] = useState<boolean>(false);
  const [mvMessage, setMvMessage] = useState<string>("");

  const loadData = async () => {
    try {
      const [aliasRes, skillRes] = await Promise.all([
        api.getAliases(),
        api.getSkills(),
      ]);
      setAliases(aliasRes);
      setSkills(skillRes);
    } catch (err) {
      console.error("Failed loading admin metadata:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setImportResult(null);
    try {
      const result = await api.uploadCSV(file);
      setImportResult(result);
      setFile(null);
    } catch (err: any) {
      setImportResult({ status: "error", errors: [err.message || "Failed to process CSV file"] });
    } finally {
      setUploading(false);
    }
  };

  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAliasName || !selectedSkillId) return;

    try {
      await api.createAlias(newAliasName, Number(selectedSkillId));
      setNewAliasName("");
      setSelectedSkillId("");
      await loadData();
    } catch (err) {
      console.error("Failed to add alias:", err);
    }
  };

  const handleRefreshViews = async () => {
    setRefreshingMV(true);
    try {
      await api.refreshViews();
      setMvMessage("Materialized view refreshed!");
      setTimeout(() => setMvMessage(""), 4000);
    } catch (err) {
      setMvMessage("Refresh error");
    } finally {
      setRefreshingMV(false);
    }
  };

  // Helper to generate and download a sample CSV template with Indian market data
  const handleDownloadSampleCSV = () => {
    const csvContent =
      "company_name,role_title,role_category,city,state,title,experience_level,min_exp_yrs,salary_min,salary_max,employment_type,posted_date,skills\n" +
      "Flipkart,Java Backend Developer,Backend Engineering,Bengaluru,Karnataka,Lead Platform Architect,Senior,5.0,2400000,3600000,Full-Time,2026-10-01,\"Java,Spring Boot,PostgreSQL,Docker\"\n" +
      "Swiggy,Frontend Developer,Web Engineering,Hyderabad,Telangana,Senior React Architect,Senior,4.0,1800000,2800000,Full-Time,2026-10-02,\"ts,reactjs,next.js 14,tailwind\"\n" +
      "Razorpay,Machine Learning Engineer,AI & Machine Learning,Gurugram,Haryana,Staff Applied ML Scientist,Senior,6.0,3200000,5500000,Full-Time,2026-10-03,\"py,PyTorch,k8s,AWS Cloud\"\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "india_tech_postings_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <section className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 lintel-border">
        {/* Architectural Lintel Top Highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 via-teal-400/30 to-transparent" />
        <div className="pointer-events-none absolute top-0 left-8 right-8 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#EAB308] via-amber-400 to-[#0D9488] p-0.5 shadow-xl shadow-amber-500/10">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0A0D14]">
              <Database className="h-5 w-5 text-amber-300" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight text-[#EDEDED]">
              Data Ingestion & Taxonomy Admin
            </h2>
            <p className="text-xs text-[#8F97A6]">
              Atomically ingest Indian tech job postings via PostgreSQL <code className="text-amber-300">sp_import_posting</code> with synonym normalization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshViews}
            disabled={refreshingMV}
            className="flex items-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] px-4 py-2 text-xs font-mono font-medium text-[#EDEDED] transition shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshingMV ? "animate-spin text-amber-300" : ""}`} />
            <span>Refresh Materialized View</span>
          </button>
          {mvMessage && (
            <span className="text-xs text-teal-300 font-mono font-medium animate-pulse">{mvMessage}</span>
          )}
        </div>
      </section>

      {/* Live Web Scraping Engine Card */}
      {onOpenSync && (
        <section className="glass-panel p-5 border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-[#111622] to-teal-950/20 relative overflow-hidden lintel-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 shadow-inner">
                <RefreshCw className="h-5 w-5 text-amber-300" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-400"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#EDEDED]">
                    Live Web Scraping Engine (LinkedIn, Internshala, Indeed)
                  </h3>
                  <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-mono text-teal-300 border border-teal-500/20">
                    ONLINE
                  </span>
                </div>
                <p className="text-xs text-[#8F97A6]">
                  Asynchronously harvest real-time job openings, extract technical skills using canonical regex rules, and write directly into PostgreSQL.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenSync}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-indigo-600/20 transition-all border border-white/20 active:scale-[0.99] whitespace-nowrap"
            >
              <span>Launch Live Market Sync</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* 2. Drag-and-Drop CSV Importer & Alias Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CSV Ingestion Card */}
        <BentoCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-[#E2D4C0]" />
                <h3 className="text-sm font-medium tracking-tight text-[#EDEDED]">
                  Batch Ingestion Pipeline (CSV)
                </h3>
              </div>
              <button
                onClick={handleDownloadSampleCSV}
                className="flex items-center gap-1.5 text-xs font-mono text-[#E2D4C0] hover:text-white transition"
              >
                <Download className="h-3 w-3" />
                <span>Sample India CSV</span>
              </button>
            </div>

            <p className="text-xs text-[#8F97A6] mb-4 leading-relaxed">
              Upload raw job posting rows. Skills like <code className="text-[#E2D4C0]">py</code>, <code className="text-[#E2D4C0]">k8s</code>, and <code className="text-[#E2D4C0]">reactjs</code> will automatically normalize to canonical skills via PostgreSQL stored procedure.
            </p>

            {/* Dropzone container */}
            <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/[0.1] bg-[#0B0D12]/70 hover:border-[#E2D4C0]/40 p-6 text-center cursor-pointer transition group">
              <UploadCloud className="h-8 w-8 text-[#525866] group-hover:text-[#E2D4C0] transition mb-2" />
              <span className="text-xs font-medium text-[#EDEDED]">
                Click or drag & drop CSV file
              </span>
              <span className="text-[11px] font-mono text-[#8F97A6] mt-1">
                Accepts .csv with Indian tech posting format
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {file && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.04] p-3 border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#E2D4C0]" />
                  <span className="text-xs font-mono text-[#EDEDED]">{file.name}</span>
                </div>
                <span className="text-[10px] font-mono text-[#8F97A6]">
                  {(file.size / 1024).toFixed(1)} KB ready
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-mono text-[#8F97A6]">
              {file ? "File selected" : "Awaiting input"}
            </span>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex items-center gap-2 rounded-xl bg-white/[0.12] hover:bg-white/[0.18] disabled:opacity-40 px-4 py-2 text-xs font-mono font-medium text-[#EDEDED] border border-white/[0.08] shadow-sm transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${uploading ? "animate-spin text-[#E2D4C0]" : ""}`} />
              <span>{uploading ? "Executing Procedure..." : "Trigger sp_import_posting"}</span>
            </button>
          </div>

          {/* Import Result Notification */}
          {importResult && (
            <div
              className={`mt-4 rounded-xl p-4 text-xs font-mono border ${
                importResult.status === "completed" && importResult.errors?.length === 0
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-300"
              }`}
            >
              <div className="flex items-center gap-2 font-medium mb-1">
                {importResult.status === "completed" && importResult.errors?.length === 0 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>Import Status: {importResult.status}</span>
              </div>
              <p>Imported: {importResult.imported_rows} | Skipped: {importResult.skipped_rows}</p>
            </div>
          )}
        </BentoCard>

        {/* Alias Mapper Card */}
        <BentoCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-medium tracking-tight text-[#EDEDED]">
                  Canonical Alias Dictionary
                </h3>
              </div>
              <span className="text-xs font-mono text-[#8F97A6]">
                {aliases.length} aliases mapped
              </span>
            </div>

            <p className="text-xs text-[#8F97A6] mb-4">
              Define synonyms and shortcuts to automatically resolve incoming raw tokens to canonical skills in BCNF normalization.
            </p>

            {/* Create new alias form */}
            <form onSubmit={handleAddAlias} className="space-y-3 rounded-2xl bg-[#0B0D12]/70 p-4 border border-white/[0.06]">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8F97A6] block mb-1">
                  Alias / Synonym:
                </label>
                <input
                  type="text"
                  placeholder="e.g. py3, springboot, k8s..."
                  value={newAliasName}
                  onChange={(e) => setNewAliasName(e.target.value)}
                  className="w-full rounded-xl bg-[#12161F] border border-white/[0.08] px-3 py-2 text-xs text-[#EDEDED] focus:outline-none focus:border-[#E2D4C0]/40 shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8F97A6] block mb-1">
                  Canonical Target Skill:
                </label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl bg-[#12161F] border border-white/[0.08] px-3 py-2 text-xs text-[#EDEDED] focus:outline-none focus:border-[#E2D4C0]/40 shadow-inner"
                >
                  <option value="">Select target canonical skill...</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category_name})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!newAliasName || !selectedSkillId}
                className="w-full rounded-xl bg-white/[0.12] hover:bg-white/[0.18] disabled:opacity-40 py-2 text-xs font-mono font-medium text-[#EDEDED] border border-white/[0.08] transition shadow-sm"
              >
                Register Canonical Alias
              </button>
            </form>
          </div>

          {/* Quick alias chips list */}
          <div className="pt-4 mt-4 border-t border-white/[0.06]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#525866] block mb-2">
              Recent Synonym Mappings
            </span>
            <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto">
              {aliases.slice(0, 14).map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B0D12] px-2.5 py-1 text-[11px] font-mono text-[#EDEDED] border border-white/[0.06]"
                >
                  <span className="text-[#E2D4C0] font-medium">{a.alias_name}</span>
                  <span className="text-[#525866]">→</span>
                  <span className="text-[#94A3B8]">{a.canonical_skill_name}</span>
                </span>
              ))}
            </div>
          </div>
        </BentoCard>
      </div>
    </div>
  );
};
