"use client";

import React from "react";
import { 
  Activity, 
  Compass, 
  Database, 
  ExternalLink, 
  Sparkles, 
  TrendingUp, 
  Building2, 
  MapPin,
  IndianRupee
} from "lucide-react";
import { SummaryKPI } from "@/lib/api";
import { formatINR } from "@/lib/indiaFormat";

interface NavbarProps {
  activeTab: "dashboard" | "career" | "admin";
  setActiveTab: (tab: "dashboard" | "career" | "admin") => void;
  kpi: SummaryKPI | null;
  onOpenSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, kpi, onOpenSync }) => {
  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/[0.08] bg-[#111622]/85 p-2 sm:p-2.5 backdrop-blur-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8),0_0_1px_1px_rgba(234,179,8,0.06),inset_0_1px_0_rgba(255,255,255,0.12)]">
        
        {/* Indo-Western Architectural Lintel Top Highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 via-teal-400/30 to-transparent" />
        <div className="pointer-events-none absolute top-0 left-12 right-12 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        {/* Brand / Logo */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#EAB308] via-amber-400 to-[#0D9488] p-0.5 shadow-lg shadow-amber-500/15">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0A0D14]">
              <Activity className="h-4 w-4 text-amber-300" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-400"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-medium tracking-tight text-[#EDEDED]">
                Skill<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-100 to-teal-300">Pulse</span>
              </span>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-mono tracking-wider text-amber-300 border border-amber-500/20">
                INDIA TECH
              </span>
            </div>
            <p className="text-[10px] text-[#8F97A6] hidden md:block">
              National Market Intelligence & DAG Career Paths
            </p>
          </div>
        </div>

        {/* Center: Live Macro Ticker Metrics (India Tech) */}
        {kpi && (
          <div className="hidden xl:flex items-center gap-2.5 rounded-full bg-[#0A0D14]/75 px-4 py-1.5 border border-white/[0.06] shadow-inner text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-[#8F97A6] text-[11px]">Postings:</span>
              <span className="font-mono font-medium text-slate-200 tabular-nums">{kpi.total_postings.toLocaleString()}</span>
            </div>

            <span className="text-white/10">•</span>

            <div className="flex items-center gap-1.5">
              <IndianRupee className="h-3 w-3 text-teal-400" />
              <span className="text-[#8F97A6] text-[11px]">Avg CTC:</span>
              <span className="font-mono font-medium text-teal-300 tabular-nums">{formatINR(kpi.market_avg_salary)}</span>
            </div>

            <span className="text-white/10">•</span>

            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-300" />
              <span className="text-[#8F97A6] text-[11px]">Top Skill:</span>
              <span className="font-mono font-medium text-amber-200">{kpi.top_skill_name}</span>
            </div>

            <span className="text-white/10">•</span>

            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-sky-400" />
              <span className="text-[#8F97A6] text-[11px]">Hubs:</span>
              <span className="font-mono text-[10px] text-sky-300">BLR • HYD • DEL • PNQ</span>
            </div>
          </div>
        )}

        {/* Right Nav Tabs & Live Market Sync Trigger */}
        <div className="flex items-center gap-2">
          {/* Live Market Sync Drawer Trigger Button */}
          {onOpenSync && (
            <button
              onClick={onOpenSync}
              className="relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-teal-500/15 to-amber-500/10 hover:from-amber-500/25 hover:to-teal-500/25 px-3 py-1.5 text-xs font-medium text-[#EDEDED] border border-amber-500/30 hover:border-amber-400/50 shadow-sm transition-all group"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400"></span>
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-teal-200 group-hover:text-white">
                Live Market Sync
              </span>
            </button>
          )}

          <nav className="flex items-center rounded-xl bg-[#0A0D14]/75 p-1 border border-white/[0.06] shadow-inner">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-white/[0.12] text-[#EDEDED] shadow-[0_1px_3px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] border border-amber-400/20"
                  : "text-[#8F97A6] hover:text-[#EDEDED]"
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-amber-400" />
              <span>Labor Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab("career")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "career"
                  ? "bg-white/[0.12] text-[#EDEDED] shadow-[0_1px_3px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] border border-teal-400/20"
                  : "text-[#8F97A6] hover:text-[#EDEDED]"
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-teal-400" />
              <span>Career Roadmap</span>
            </button>

            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "admin"
                  ? "bg-white/[0.12] text-[#EDEDED] shadow-[0_1px_3px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] border border-white/[0.08]"
                  : "text-[#8F97A6] hover:text-[#EDEDED]"
              }`}
            >
              <Database className="h-3.5 w-3.5 text-indigo-400" />
              <span>Data Ingestion</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
