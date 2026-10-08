"use client";

import React, { useState, useEffect } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, CartesianGrid 
} from "recharts";
import { 
  Activity, 
  MapPin, 
  Building2, 
  IndianRupee, 
  Layers, 
  Filter, 
  Sparkles, 
  Share2, 
  Flame,
  TrendingUp,
  Briefcase
} from "lucide-react";
import { 
  api, 
  SkillItem, 
  SalaryItem, 
  CoOccurrenceItem, 
  HiringHotspots, 
  MetaItem, 
  TrendData 
} from "@/lib/api";
import { BentoCard } from "@/components/BentoCard";
import { formatINR, formatINRShort } from "@/lib/indiaFormat";

interface BentoDashboardProps {
  refreshKey?: number;
  onOpenSync?: () => void;
}

export const BentoDashboard: React.FC<BentoDashboardProps> = ({ refreshKey, onOpenSync }) => {
  // Global Filters
  const [selectedRole, setSelectedRole] = useState<number | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = useState<number | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<string>("6m");

  // Salary Metric View Toggle (Median vs Average)
  const [salaryView, setSalaryView] = useState<"median" | "average">("median");

  // Metadata options
  const [roles, setRoles] = useState<MetaItem[]>([]);
  const [locations, setLocations] = useState<MetaItem[]>([]);

  // Analytics states
  const [topSkills, setTopSkills] = useState<SkillItem[]>([]);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [salaries, setSalaries] = useState<SalaryItem[]>([]);
  const [coOccurrences, setCoOccurrences] = useState<CoOccurrenceItem[]>([]);
  const [hiringMap, setHiringMap] = useState<HiringHotspots | null>(null);
  const [selectedCoOccurSkill, setSelectedCoOccurSkill] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial dropdown options
  useEffect(() => {
    async function loadMeta() {
      try {
        const [rData, lData] = await Promise.all([
          api.getRoles(),
          api.getLocations(),
        ]);
        setRoles(rData);
        setLocations(lData);
      } catch (err) {
        console.error("Failed loading metadata:", err);
      }
    }
    loadMeta();
  }, [refreshKey]);

  // Fetch dashboard data on filter change or when refreshKey increments
  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [skillsRes, trendsRes, salariesRes, hiringRes, coRes] = await Promise.all([
          api.getTopSkills(selectedRole, selectedLocation, timeRange),
          api.getTrends(),
          api.getSalaries(selectedRole, selectedLocation),
          api.getHiringMap(selectedCoOccurSkill),
          api.getCoOccurrence(selectedCoOccurSkill),
        ]);
        setTopSkills(skillsRes);
        setTrendData(trendsRes);
        setSalaries(salariesRes);
        setHiringMap(hiringRes);
        setCoOccurrences(coRes);
      } catch (err) {
        console.error("Failed loading analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [selectedRole, selectedLocation, timeRange, selectedCoOccurSkill, refreshKey]);

  // Indo-Western Studio Palette: Kesar Ochre, Peacock Teal, Royal Gold, Indigo, Sky
  const studioPalette = ["#EAB308", "#14B8A6", "#6366F1", "#F59E0B", "#0D9488", "#38BDF8"];

  // Prepare salary chart data in LPA
  const salaryChartData = salaries.slice(0, 7).map((item) => ({
    role_title: item.role_title,
    median_lpa: Number((item.median_salary / 100000).toFixed(1)),
    avg_lpa: Number((item.avg_salary / 100000).toFixed(1)),
    raw_median: item.median_salary,
    raw_avg: item.avg_salary,
  }));

  return (
    <div className="space-y-6">
      {/* 1. Global Filter Header (Bespoke Glass Dock with Lintel Trim) */}
      <section className="glass-panel p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 lintel-border">
        {/* Architectural Lintel Top Highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 via-teal-400/30 to-transparent" />

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 shadow-inner">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium tracking-tight text-[#EDEDED]">
              India Tech Market Intelligence
            </h2>
            <p className="text-xs text-[#8F97A6]">
              Real-time analytics across Indian tech hubs, roles, and hiring velocity
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role selector */}
          <select
            value={selectedRole || ""}
            onChange={(e) => setSelectedRole(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-xl bg-[#0A0D14] border border-white/[0.08] px-3 py-1.5 text-xs text-[#EDEDED] focus:outline-none focus:border-amber-400/40 transition shadow-inner"
          >
            <option value="" className="bg-[#111622] text-white">All Career Tracks (National)</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id} className="bg-[#111622] text-white">
                {r.title}
              </option>
            ))}
          </select>

          {/* Location selector (Indian Tech Metros) */}
          <select
            value={selectedLocation || ""}
            onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-xl bg-[#0A0D14] border border-white/[0.08] px-3 py-1.5 text-xs text-[#EDEDED] focus:outline-none focus:border-amber-400/40 transition shadow-inner"
          >
            <option value="" className="bg-[#111622] text-white">All Indian Metros & Hubs</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id} className="bg-[#111622] text-white">
                {l.city}, {l.state} {l.is_remote_friendly ? "⚡" : ""}
              </option>
            ))}
          </select>

          {/* Segmented Control for Time Range */}
          <div className="flex items-center rounded-xl bg-[#0A0D14] border border-white/[0.08] p-1 shadow-inner">
            {[
              { id: "1m", label: "30D" },
              { id: "3m", label: "90D" },
              { id: "6m", label: "6M" },
              { id: "1y", label: "1Y" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  timeRange === t.id
                    ? "bg-white/[0.12] text-[#EDEDED] shadow-[0_1px_3px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] border border-amber-400/20"
                    : "text-[#8F97A6] hover:text-[#EDEDED]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {onOpenSync && (
            <button
              onClick={onOpenSync}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-teal-500/15 hover:from-amber-500/25 hover:to-teal-500/25 px-3 py-1.5 text-xs font-medium text-amber-200 border border-amber-500/30 transition shadow-inner"
              title="Open Live Market Ingestion Radar"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400"></span>
              </span>
              <span>Sync Live Postings</span>
            </button>
          )}

          {(selectedRole || selectedLocation) && (
            <button
              onClick={() => {
                setSelectedRole(undefined);
                setSelectedLocation(undefined);
                setTimeRange("6m");
              }}
              className="text-xs text-amber-300 hover:text-white underline underline-offset-4 font-mono transition"
            >
              Reset
            </button>
          )}
        </div>
      </section>

      {/* 2. Bespoke 3D Bento Grid (Asymmetric Studio Rhythm) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* =========================================================================
            CELL A: Large 2x2 - Skill Demand Momentum (Delicate Spline Curves)
        ========================================================================== */}
        <BentoCard className="lg:col-span-2 lg:row-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 shadow-inner">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-medium tracking-tight text-[#EDEDED]">
                    Skill Demand Momentum
                  </h3>
                  <p className="text-xs text-[#8F97A6]">
                    6-month posting trajectory across Indian tech companies
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-[11px] font-mono text-teal-300 border border-teal-500/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                  Live Indian Trajectory
                </span>
              </div>
            </div>

            {/* Plotted skill pills */}
            {trendData && (
              <div className="flex flex-wrap items-center gap-2 my-2">
                {trendData.skills.map((s, idx) => {
                  const color = studioPalette[idx % studioPalette.length];
                  return (
                    <span
                      key={s}
                      className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-mono border backdrop-blur-sm shadow-sm"
                      style={{
                        borderColor: `${color}40`,
                        backgroundColor: `${color}12`,
                        color: color,
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                      {s}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Spline Area Chart */}
          <div className="h-[290px] w-full mt-4">
            {trendData && trendData.series.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData.series}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    {trendData.skills.map((s, idx) => {
                      const color = studioPalette[idx % studioPalette.length];
                      return (
                        <linearGradient key={s} id={`studio-color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                          <stop offset="60%" stopColor={color} stopOpacity={0.12} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="period" stroke="#8F97A6" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8F97A6" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 22, 34, 0.95)",
                      borderColor: "rgba(234, 179, 8, 0.2)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#EDEDED",
                      boxShadow: "0 15px 30px rgba(0,0,0,0.7)",
                      backdropFilter: "blur(12px)",
                    }}
                  />
                  {trendData.skills.map((s, idx) => {
                    const color = studioPalette[idx % studioPalette.length];
                    return (
                      <Area
                        key={s}
                        type="monotone"
                        dataKey={s}
                        stroke={color}
                        strokeWidth={2.2}
                        fillOpacity={1}
                        fill={`url(#studio-color-${idx})`}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-mono text-[#8F97A6]">
                Syncing momentum series...
              </div>
            )}
          </div>
        </BentoCard>

        {/* =========================================================================
            CELL B: Tall 1x2 - Top Hiring Hotspots (Indian Tech Giants & Hubs)
        ========================================================================== */}
        <BentoCard className="lg:col-span-1 lg:row-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 shadow-inner">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-medium tracking-tight text-[#EDEDED]">
                  Indian Tech Hotspots
                </h3>
                <p className="text-xs text-[#8F97A6]">Leading employers and active metros</p>
              </div>
            </div>

            {/* Indian Companies List */}
            <div className="mt-3 space-y-2.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8F97A6]">
                Top Hiring Organizations
              </span>
              {hiringMap?.companies.slice(0, 5).map((comp) => (
                <div
                  key={comp.company_name}
                  className="flex items-center justify-between rounded-xl bg-[#0A0D14]/75 p-2.5 border border-white/[0.05] hover:border-amber-400/25 transition group shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300 font-mono font-semibold text-xs border border-amber-500/20 group-hover:border-amber-400/40 transition">
                      {comp.company_name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-medium text-[#EDEDED] truncate">{comp.company_name}</p>
                      <p className="text-[10px] text-[#8F97A6]">{comp.industry}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-medium text-[#EDEDED] tabular-nums">{comp.posting_count} roles</span>
                    <p className="text-[11px] font-mono text-teal-300 font-medium tabular-nums">
                      {formatINR(comp.avg_offered_salary)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Indian Tech Metros List */}
            <div className="mt-5 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8F97A6]">
                Premier Indian Metros
              </span>
              {hiringMap?.locations.slice(0, 4).map((loc) => (
                <div
                  key={`${loc.city}-${loc.state}`}
                  className="flex items-center justify-between rounded-xl bg-[#0A0D14]/50 p-2 border border-white/[0.04]"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-sky-400" />
                    <span className="text-xs text-[#EDEDED] font-medium">
                      {loc.city}
                    </span>
                    <span className="text-[10px] text-[#8F97A6] font-mono">
                      ({loc.state})
                    </span>
                    {loc.is_remote_friendly && (
                      <span className="rounded bg-teal-500/10 px-1.5 py-0.2 text-[9px] font-mono text-teal-300 border border-teal-500/20">
                        Pan-India OK
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-300 tabular-nums">{loc.posting_count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] text-[11px] text-[#8F97A6] flex items-center justify-between">
            <span>Spatial Coverage</span>
            <span className="text-amber-300 font-mono font-medium">10 Indian Metros</span>
          </div>
        </BentoCard>

        {/* =========================================================================
            CELL C: Wide 2x1 - Salary Spectrum 3D Pill Cylinders (Median vs Average)
        ========================================================================== */}
        <BentoCard className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 shadow-inner">
                <IndianRupee className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-medium tracking-tight text-[#EDEDED]">
                  Salary Spectrum by Career Track
                </h3>
                <p className="text-xs text-[#8F97A6]">
                  Annual CTC in ₹ Lakhs Per Annum (LPA) calculated via PostgreSQL PERCENTILE_CONT
                </p>
              </div>
            </div>

            {/* Animated Median vs Average Toggle */}
            <div className="flex items-center rounded-xl bg-[#0A0D14] p-1 border border-white/[0.08] shadow-inner text-xs">
              <button
                onClick={() => setSalaryView("median")}
                className={`rounded-lg px-3 py-1 font-mono transition-all ${
                  salaryView === "median"
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm"
                    : "text-[#8F97A6] hover:text-[#EDEDED]"
                }`}
              >
                Median CTC
              </button>
              <button
                onClick={() => setSalaryView("average")}
                className={`rounded-lg px-3 py-1 font-mono transition-all ${
                  salaryView === "average"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                    : "text-[#8F97A6] hover:text-[#EDEDED]"
                }`}
              >
                Average CTC
              </button>
            </div>
          </div>

          {/* 3D-styled Pill Cylinders */}
          <div className="h-[220px] w-full">
            {salaryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salaryChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
                >
                  <defs>
                    <linearGradient id="cylinder-teal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.95} />
                      <stop offset="85%" stopColor="#0D9488" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#115E59" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="cylinder-amber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.95} />
                      <stop offset="85%" stopColor="#D97706" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#B45309" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="role_title"
                    stroke="#8F97A6"
                    fontSize={10}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#8F97A6"
                    fontSize={10}
                    tickFormatter={(val) => `₹${val}L`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`₹${value} LPA`, salaryView === "median" ? "Median CTC" : "Average CTC"]}
                    contentStyle={{
                      backgroundColor: "rgba(17, 22, 34, 0.95)",
                      borderColor: "rgba(234, 179, 8, 0.2)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#EDEDED",
                      boxShadow: "0 15px 30px rgba(0,0,0,0.7)",
                      backdropFilter: "blur(12px)",
                    }}
                  />
                  <Bar 
                    dataKey={salaryView === "median" ? "median_lpa" : "avg_lpa"} 
                    fill={salaryView === "median" ? "url(#cylinder-teal)" : "url(#cylinder-amber)"} 
                    radius={[8, 8, 2, 2]} 
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-mono text-[#8F97A6]">
                Loading Indian compensation spectrum...
              </div>
            )}
          </div>
        </BentoCard>

        {/* =========================================================================
            CELL D: 1x1 - Skill Synergy Network (Visual Connector Layout)
        ========================================================================== */}
        <BentoCard className="lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 shadow-inner">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-medium tracking-tight text-[#EDEDED]">
                    Skill Synergy Network
                  </h3>
                  <p className="text-xs text-[#8F97A6]">Co-occurring pairs in Indian job postings</p>
                </div>
              </div>
            </div>

            {/* Visual Connected Pairs */}
            <div className="space-y-2 mt-2">
              {coOccurrences.slice(0, 5).map((co, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-[#0A0D14]/70 px-3 py-2 border border-white/[0.05] hover:border-amber-400/25 transition shadow-sm"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-amber-200 font-medium">
                      {co.related_skill_name || co.skill_a_name}
                    </span>
                    <span className="text-teal-400/70">↔</span>
                    <span className="font-mono text-teal-300 font-medium">
                      {co.skill_b_name || "Focus"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-mono text-[#EDEDED] border border-white/[0.08] tabular-nums">
                      {co.co_occurrence_count} pairs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-[#8F97A6] font-mono mt-3 pt-2 border-t border-white/[0.06]">
            Synergy weight computed via PostgreSQL self-join view <code className="text-amber-300">v_skill_pairs</code>
          </p>
        </BentoCard>
      </div>

      {/* 3. Ranked Skill Intelligence (Studio Ledger Table with Lintel Highlight) */}
      <section className="glass-panel p-6 lintel-border">
        {/* Architectural Lintel Top Highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 via-teal-400/30 to-transparent" />
        <div className="pointer-events-none absolute top-0 left-8 right-8 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 shadow-inner">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-medium tracking-tight text-[#EDEDED]">
                Ranked Skill Intelligence
              </h3>
              <p className="text-xs text-[#8F97A6]">
                National demand share, active posting density, and associated CTC in India
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-[#8F97A6]">
            Tracking top {topSkills.length} industry skills
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#8F97A6] font-mono uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-medium">Rank</th>
                <th className="pb-3 font-medium">Skill Name</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Indian Postings</th>
                <th className="pb-3 font-medium">Market Demand</th>
                <th className="pb-3 font-medium text-right">Average Base CTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {topSkills.map((s, idx) => (
                <tr key={s.skill_id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="py-3.5 font-mono text-[#8F97A6]">#{idx + 1}</td>
                  <td className="py-3.5 font-medium text-[#EDEDED] flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
                    {s.skill_name}
                  </td>
                  <td className="py-3.5">
                    <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-[#94A3B8] border border-white/[0.06]">
                      {s.category_name}
                    </span>
                  </td>
                  <td className="py-3.5 text-[#EDEDED] font-mono font-medium tabular-nums">{s.posting_count} roles</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-28 rounded-full bg-[#0A0D14] overflow-hidden border border-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-teal-400"
                          style={{ width: `${Math.min(s.demand_pct, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono font-medium text-slate-200 tabular-nums">{s.demand_pct}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-right font-mono font-medium text-teal-300 tabular-nums">
                    {formatINR(s.avg_salary)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
