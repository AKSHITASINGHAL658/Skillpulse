"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Radio, 
  Search, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Terminal, 
  RefreshCw, 
  Database,
  ArrowRight,
  Globe2,
  Cpu
} from "lucide-react";
import { api, ScraperStatusResponse, ScraperTask } from "@/lib/api";

interface LiveMarketSyncProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

const PRESET_ROLES = [
  "Full Stack Developer",
  "Java Backend Developer",
  "React / Next.js Engineer",
  "DevOps & Kubernetes Engineer",
  "Applied AI / ML Engineer",
  "Data Analyst"
];

const PRESET_CITIES = [
  { label: "Bengaluru (Silicon Plateau)", value: "Bengaluru" },
  { label: "Hyderabad (Cyberabad)", value: "Hyderabad" },
  { label: "Pune (Oxford of the East)", value: "Pune" },
  { label: "Gurugram (NCR Tech Hub)", value: "Gurugram" },
  { label: "Remote (Pan-India)", value: "Remote (India)" },
];

export const LiveMarketSync: React.FC<LiveMarketSyncProps> = ({ isOpen, onClose, onSyncComplete }) => {
  const [query, setQuery] = useState("Full Stack Developer");
  const [location, setLocation] = useState("Bengaluru");
  const [source, setSource] = useState<"all" | "linkedin" | "internshala" | "indeed">("all");
  const [limit, setLimit] = useState(15);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskStatus, setTaskStatus] = useState<ScraperStatusResponse | null>(null);
  const [hasTriggeredComplete, setHasTriggeredComplete] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll scraper status when open or running
  useEffect(() => {
    if (!isOpen) return;

    const checkStatus = async () => {
      try {
        const status = await api.getScraperStatus();
        setTaskStatus(status);

        if (status.status === "completed" && !hasTriggeredComplete) {
          setHasTriggeredComplete(true);
          if (onSyncComplete) {
            onSyncComplete();
          }
        }
      } catch (err) {
        console.error("Error fetching scraper status:", err);
      }
    };

    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 1500);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen, hasTriggeredComplete, onSyncComplete]);

  // Scroll logs to bottom automatically
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [taskStatus?.active_task?.logs]);

  if (!isOpen) return null;

  const activeTask = taskStatus?.active_task;
  const isRunning = taskStatus?.status === "running" || isSubmitting;

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isRunning) return;

    try {
      setIsSubmitting(true);
      setHasTriggeredComplete(false);
      await api.triggerScraper(query.trim(), location, source, limit);
      // Immediate poll
      const status = await api.getScraperStatus();
      setTaskStatus(status);
    } catch (err) {
      console.error("Failed to trigger scraper:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-black/75 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/[0.12] bg-[#111622]/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_2px_1px_rgba(234,179,8,0.1)] backdrop-blur-2xl flex flex-col max-h-[92vh] lintel-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Indo-Western Architectural Lintel Top Highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 via-teal-400/30 to-transparent" />
        <div className="pointer-events-none absolute top-0 left-8 right-8 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-gradient-to-r from-amber-500/[0.05] via-transparent to-teal-500/[0.05]">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 shadow-inner">
              <Radio className="h-5 w-5 animate-pulse text-amber-300" />
              {isRunning && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-400"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#EDEDED] tracking-tight">
                  Live Market Radar & Ingestion
                </h3>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/30">
                  PostgreSQL Pipeline
                </span>
              </div>
              <p className="text-xs text-[#8F97A6]">
                Scrape live tech openings from LinkedIn, Internshala & Indeed with canonical skill extraction.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[#8F97A6] hover:bg-white/[0.08] hover:text-[#EDEDED] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 flex-1">
          {/* Query Configuration Form */}
          <form onSubmit={handleTrigger} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target Role Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#EDEDED] flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-indigo-400" />
                  Target Tech Role / Keywords
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Full Stack Developer, Python, Spring Boot..."
                  disabled={isRunning}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#12161F] px-3.5 py-2.5 text-xs text-[#EDEDED] placeholder-[#8F97A6]/50 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50"
                />
              </div>

              {/* Metro Hub Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#EDEDED] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  Indian Metro Hub
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isRunning}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#12161F] px-3.5 py-2.5 text-xs text-[#EDEDED] focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50"
                >
                  {PRESET_CITIES.map((c) => (
                    <option key={c.value} value={c.value} className="bg-[#12161F] text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#8F97A6] mr-1">Presets:</span>
              {PRESET_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setQuery(r)}
                  disabled={isRunning}
                  className={`rounded-lg px-2 py-0.5 text-[10px] transition-colors border ${
                    query === r
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                      : "bg-white/[0.03] text-[#8F97A6] border-white/[0.06] hover:text-[#EDEDED] hover:bg-white/[0.06]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Source Toggles & Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Source Selector */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-[#EDEDED] flex items-center gap-1.5">
                  <Globe2 className="h-3.5 w-3.5 text-sky-400" />
                  Target Job Portal
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#12161F] border border-white/[0.08]">
                  {(
                    [
                      { id: "all", label: "Multi-Source" },
                      { id: "linkedin", label: "LinkedIn" },
                      { id: "internshala", label: "Internshala" },
                      { id: "indeed", label: "Indeed" },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSource(s.id)}
                      disabled={isRunning}
                      className={`rounded-lg py-1.5 text-center text-[11px] font-medium transition-all ${
                        source === s.id
                          ? "bg-indigo-500/25 text-[#EDEDED] shadow-sm border border-indigo-500/40"
                          : "text-[#8F97A6] hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingestion Limit */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#EDEDED] flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-amber-400" />
                  Max Openings
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  step="5"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#12161F] px-3.5 py-2.5 text-xs text-[#EDEDED] focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Submit Trigger Button with Radar Effect */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isRunning || !query.trim()}
                className={`relative w-full overflow-hidden rounded-2xl py-3 px-4 font-medium text-xs sm:text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2.5 ${
                  isRunning
                    ? "bg-indigo-900/60 cursor-not-allowed border border-indigo-500/30"
                    : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 border border-white/20 active:scale-[0.99]"
                }`}
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Synchronizing Market Postings & Mapping DAG...</span>
                  </>
                ) : (
                  <>
                    <div className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400"></span>
                    </div>
                    <span>Fetch Live Openings & Ingest to SkillPulse</span>
                    <ArrowRight className="h-4 w-4 text-emerald-300" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Active Job Progress Section */}
          {activeTask && (
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#12161F]/90 p-4.5">
              {/* Progress Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="rounded-xl bg-white/[0.03] p-2.5 border border-white/[0.05]">
                  <span className="text-[10px] text-[#8F97A6] block uppercase tracking-wider">Raw Found</span>
                  <span className="font-mono text-lg font-semibold text-[#EDEDED]">{activeTask.total_found}</span>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-2.5 border border-white/[0.05]">
                  <span className="text-[10px] text-[#8F97A6] block uppercase tracking-wider">Processed</span>
                  <span className="font-mono text-lg font-semibold text-sky-400">{activeTask.total_processed}</span>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-2.5 border border-white/[0.05]">
                  <span className="text-[10px] text-[#8F97A6] block uppercase tracking-wider">New Postings</span>
                  <span className="font-mono text-lg font-semibold text-emerald-400">{activeTask.newly_inserted}</span>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-2.5 border border-white/[0.05]">
                  <span className="text-[10px] text-[#8F97A6] block uppercase tracking-wider">Extracted Skills</span>
                  <span className="font-mono text-lg font-semibold text-[#E2D4C0]">{activeTask.skills_extracted_count}</span>
                </div>
              </div>

              {/* Extracted Canonical Skills Cloud */}
              {activeTask.recent_skills && activeTask.recent_skills.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-medium text-[#EDEDED] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#E2D4C0]" />
                    Canonical Skills Identified in Stream:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTask.recent_skills.map((skill, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-time Log Stream Terminal */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#8F97A6]">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                    Live Execution Telemetry
                  </span>
                  <span className="font-mono text-[10px]">
                    Status: <span className={isRunning ? "text-amber-400" : "text-emerald-400 font-semibold"}>{activeTask.status.toUpperCase()}</span>
                  </span>
                </div>

                <div className="max-h-44 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#090C12] p-3 font-mono text-[11px] text-[#8F97A6] space-y-1 shadow-inner">
                  {activeTask.logs.map((log, index) => (
                    <div key={index} className="leading-relaxed flex items-start gap-2">
                      <span className="text-white/20 select-none">{String(index + 1).padStart(2, "0")}</span>
                      <span className="text-slate-300">{log}</span>
                    </div>
                  ))}
                  {isRunning && (
                    <div className="flex items-center gap-2 text-indigo-400 animate-pulse pt-1">
                      <span className="text-white/20 select-none">--</span>
                      <span>Streaming real-time job attributes & normalizing canonical entities...</span>
                    </div>
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-3 bg-[#0B0D12]/80 text-xs text-[#8F97A6]">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-sky-400" />
            <span>Direct BCNF Ingestion • Auto MV Refresh</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl px-4 py-1.5 font-medium text-xs bg-white/[0.06] hover:bg-white/[0.12] text-[#EDEDED] transition-colors border border-white/[0.08]"
          >
            {activeTask?.status === "completed" ? "Done & View Updates" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
