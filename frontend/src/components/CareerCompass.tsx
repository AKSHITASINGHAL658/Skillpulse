"use client";

import React, { useState, useEffect } from "react";
import { 
  Compass, 
  Sparkles, 
  Star, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Target,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Award
} from "lucide-react";
import { 
  api, 
  UserProfile, 
  RecommendationResponse, 
  MetaItem 
} from "@/lib/api";
import { BentoCard } from "@/components/BentoCard";

export const CareerCompass: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [roles, setRoles] = useState<MetaItem[]>([]);
  const [availableSkills, setAvailableSkills] = useState<MetaItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  // Add Skill state
  const [newSkillId, setNewSkillId] = useState<number | "">("");
  const [newProficiency, setNewProficiency] = useState<number>(3);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profData, rolesData, allSkills, recData] = await Promise.all([
        api.getUserProfile(),
        api.getRoles(),
        api.getSkills(),
        api.getLatestRecommendation(),
      ]);
      setProfile(profData);
      setRoles(rolesData);
      setAvailableSkills(allSkills);
      setRecommendation(recData);
    } catch (err) {
      console.error("Failed loading Career Compass data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update target role
  const handleRoleChange = async (roleId: number) => {
    try {
      await api.updateTargetRole(roleId);
      setGenerating(true);
      const updatedRec = await api.generateRecommendation();
      setRecommendation(updatedRec);
      const updatedProf = await api.getUserProfile();
      setProfile(updatedProf);
    } catch (err) {
      console.error("Error setting role:", err);
    } finally {
      setGenerating(false);
    }
  };

  // Add skill to user profile
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillId) return;

    try {
      await api.updateUserSkill(Number(newSkillId), newProficiency);
      setNewSkillId("");
      const updatedProf = await api.getUserProfile();
      setProfile(updatedProf);
      const updatedRec = await api.generateRecommendation();
      setRecommendation(updatedRec);
    } catch (err) {
      console.error("Failed to add skill:", err);
    }
  };

  // Delete skill
  const handleDeleteSkill = async (skillId: number) => {
    try {
      await api.deleteUserSkill(skillId);
      const updatedProf = await api.getUserProfile();
      setProfile(updatedProf);
      const updatedRec = await api.generateRecommendation();
      setRecommendation(updatedRec);
    } catch (err) {
      console.error("Failed to delete skill:", err);
    }
  };

  // Trigger manual generation
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const rec = await api.generateRecommendation();
      setRecommendation(rec);
    } catch (err) {
      console.error("Failed generating recommendation:", err);
    } finally {
      setGenerating(false);
    }
  };

  const readiness = Number(recommendation?.recommendation?.readiness_score || 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Target Role Selection */}
      <section className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 lintel-border">
        {/* Architectural Lintel Top Highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 via-teal-400/30 to-transparent" />
        <div className="pointer-events-none absolute top-0 left-8 right-8 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#EAB308] via-amber-400 to-[#0D9488] p-0.5 shadow-xl shadow-amber-500/10">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0A0D14]">
              <Compass className="h-5 w-5 text-amber-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-medium tracking-tight text-[#EDEDED]">
                Career Compass
              </h2>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/25">
                Personalized Career Path
              </span>
              <span className="hidden sm:inline-block rounded-full bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-mono text-teal-300 border border-teal-500/25">
                Recursive DAG Engine
              </span>
            </div>
            <p className="text-xs text-[#8F97A6]">
              Personalized learning milestones calculated against India tech postings and prerequisite graphs
            </p>
          </div>
        </div>

        {/* Target Role Selector & Action Button */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#8F97A6]">
              Target Goal:
            </label>
            <select
              value={profile?.target_role_id || ""}
              onChange={(e) => handleRoleChange(Number(e.target.value))}
              className="rounded-xl bg-[#0A0D14] border border-white/[0.08] px-3 py-2 text-xs font-medium text-[#EDEDED] focus:outline-none focus:border-amber-400/40 transition shadow-inner"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#111622] text-white">
                  {r.title} ({r.category})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-teal-500/20 hover:from-amber-500/30 hover:to-teal-500/30 px-4 py-2 text-xs font-mono font-medium text-[#EDEDED] border border-amber-400/30 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-amber-300 ${generating ? "animate-spin" : ""}`} />
            <span>{generating ? "Computing DAG..." : "Recompute Roadmap"}</span>
          </button>
        </div>
      </section>

      {/* 2. Readiness Metric + User Skills Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Readiness Score Card with Mandala Flourish Watermark */}
        <BentoCard className="flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Watermark Seal (Mandala Yantra) Glowing proportionally to Readiness */}
          <div 
            className="pointer-events-none absolute -bottom-10 -right-10 w-48 h-48 transition-all duration-700"
            style={{
              opacity: Math.max(0.035, (readiness / 100) * 0.12),
              filter: readiness >= 50 ? "drop-shadow(0 0 12px rgba(234, 179, 8, 0.2))" : "none"
            }}
          >
            <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" className="w-full h-full text-amber-300 animate-[spin_120s_linear_infinite]">
              <circle cx="100" cy="100" r="90" strokeDasharray="3 3" strokeWidth="0.8" />
              <circle cx="100" cy="100" r="65" strokeWidth="0.6" />
              <circle cx="100" cy="100" r="40" strokeDasharray="2 2" strokeWidth="0.8" />
              <circle cx="100" cy="100" r="4" fill="currentColor" />
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((d) => (
                <ellipse key={d} cx="100" cy="100" rx="42" ry="12" transform={`rotate(${d} 100 100)`} strokeWidth="0.5" />
              ))}
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-medium tracking-tight text-[#EDEDED]">
                  Target Role Readiness
                </h3>
              </div>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-mono text-amber-300 border border-amber-500/20">
                Score
              </span>
            </div>

            {/* Bespoke 3D Radial Readiness Gauge */}
            <div className="flex items-center justify-center my-4">
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-[#0A0D14] border border-white/[0.08] shadow-[inset_0_4px_16px_rgba(0,0,0,0.85)]">
                <svg className="h-full w-full rotate-[-90deg]">
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    stroke={readiness >= 70 ? "#14B8A6" : readiness >= 40 ? "#EAB308" : "#6366F1"}
                    strokeWidth="10"
                    strokeDasharray="402"
                    strokeDashoffset={402 - (402 * readiness) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-mono font-medium text-[#EDEDED] tabular-nums">{readiness}%</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/80">Market Readiness</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-[#8F97A6] px-2 leading-relaxed">
              {readiness >= 75
                ? "Outstanding market qualification! You possess primary competencies for this role in India."
                : readiness >= 40
                ? "Progressing steadily. Complete the recommended prerequisite DAG milestones below to achieve market readiness."
                : "Foundational phase. Target prerequisite skills first to unlock advanced downstream frameworks."}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#8F97A6]">
            <span>Roadmap Stages</span>
            <span className="font-mono text-amber-300 font-medium">
              {recommendation?.roadmap_steps?.length || 0} Phases
            </span>
          </div>
        </BentoCard>

        {/* Owned Skills Management Card */}
        <BentoCard className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-medium tracking-tight text-[#EDEDED]">My Verified Skill Inventory</h3>
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[9px] font-mono text-teal-300 border border-teal-500/20">
                  Active Skills
                </span>
              </div>
              <span className="text-xs font-mono text-[#8F97A6] tabular-nums">
                {profile?.skills.length || 0} skills active
              </span>
            </div>

            {/* Owned skills pill tags */}
            <div className="flex flex-wrap gap-2.5 my-3">
              {profile?.skills.map((s) => (
                <div
                  key={s.skill_id}
                  className="relative flex items-center gap-2.5 rounded-xl bg-[#0A0D14]/80 px-3 py-1.5 border border-white/[0.08] hover:border-amber-400/30 transition group shadow-sm"
                >
                  {/* Subtle carved corner */}
                  <div className="pointer-events-none absolute top-1 left-1 w-1 h-1 border-t border-l border-amber-400/30" />

                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-[#EDEDED]">{s.skill_name}</p>
                      <span className="text-[9px] font-mono text-teal-400 opacity-70">Verified</span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-2.5 w-2.5 ${
                            star <= s.proficiency
                              ? "fill-[#EAB308] text-[#EAB308]"
                              : "text-[#525866]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSkill(s.skill_id)}
                    className="opacity-0 group-hover:opacity-100 text-[#525866] hover:text-rose-400 transition ml-1"
                    title="Remove skill"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add skill form */}
          <form onSubmit={handleAddSkill} className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-[#8F97A6] flex items-center gap-1">
              <Plus className="h-3.5 w-3.5 text-amber-400" />
              Add Skill:
            </span>

            <select
              value={newSkillId}
              onChange={(e) => setNewSkillId(e.target.value ? Number(e.target.value) : "")}
              className="rounded-xl bg-[#0A0D14] border border-white/[0.08] px-3 py-1.5 text-xs text-[#EDEDED] focus:outline-none focus:border-amber-400/40 flex-1 min-w-[160px] shadow-inner"
            >
              <option value="" className="bg-[#111622] text-white">Select technology to log...</option>
              {availableSkills
                .filter((as) => !profile?.skills.some((ps) => ps.skill_id === as.id))
                .map((as) => (
                  <option key={as.id} value={as.id} className="bg-[#111622] text-white">
                    {as.name} ({as.category_name})
                  </option>
                ))}
            </select>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-[#8F97A6]">Rating:</span>
              <select
                value={newProficiency}
                onChange={(e) => setNewProficiency(Number(e.target.value))}
                className="rounded-xl bg-[#0A0D14] border border-white/[0.08] px-2.5 py-1.5 text-xs text-[#EDEDED] focus:outline-none focus:border-amber-400/40 shadow-inner"
              >
                <option value={1} className="bg-[#111622] text-white">1 ★ (Novice)</option>
                <option value={2} className="bg-[#111622] text-white">2 ★★ (Beginner)</option>
                <option value={3} className="bg-[#111622] text-white">3 ★★★ (Intermediate)</option>
                <option value={4} className="bg-[#111622] text-white">4 ★★★★ (Advanced)</option>
                <option value={5} className="bg-[#111622] text-white">5 ★★★★★ (Expert)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!newSkillId}
              className="rounded-xl bg-white/[0.12] hover:bg-white/[0.18] disabled:opacity-40 px-3.5 py-1.5 text-xs font-mono font-medium text-[#EDEDED] border border-white/[0.08] transition shadow-sm"
            >
              Save Rating
            </button>
          </form>
        </BentoCard>
      </div>

      {/* 3. ROADMAP STEPPER CARD: Step-by-Step Dependency DAG Visualizer */}
      <section className="glass-panel p-6 lintel-border">
        {/* Architectural Lintel Top Highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 via-teal-400/30 to-transparent" />
        <div className="pointer-events-none absolute top-0 left-8 right-8 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 shadow-inner">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium tracking-tight text-[#EDEDED]">
                  Recursive Dependency Learning Roadmap (DAG)
                </h3>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-mono text-amber-300 border border-amber-500/30">
                  Prerequisite Path
                </span>
              </div>
              <p className="text-xs text-[#8F97A6]">
                Computed via PostgreSQL recursive CTE: foundational prerequisites must precede downstream specializations
              </p>
            </div>
          </div>

          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-mono text-amber-300 border border-amber-500/25">
            {recommendation?.items?.length || 0} Milestones Recommended
          </span>
        </div>

        {/* Stepper Timeline */}
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-amber-400 before:via-teal-500 before:to-transparent">
          {recommendation?.roadmap_steps?.map((step) => (
            <div key={step.step_no} className="relative flex items-start gap-4">
              {/* Step indicator node */}
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#111622] border-2 border-amber-400 shadow-[0_0_12px_rgba(234,179,8,0.3)] font-mono text-xs text-amber-300 font-medium">
                P{step.step_no}
              </div>

              {/* Step card container */}
              <div className="flex-1 rounded-2xl bg-[#0A0D14]/75 p-5 border border-white/[0.08] hover:border-amber-400/25 transition shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-2.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-amber-300">
                      Phase {step.step_no}: {step.step_no === 1 ? "Foundational Prerequisites & Core Baseline" : `Downstream Ecosystem Level ${step.step_no}`}
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#8F97A6] font-mono tabular-nums">
                    {step.skills.length} target skills
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {step.skills.map((item: any) => (
                    <div
                      key={item.id}
                      className="relative overflow-hidden rounded-xl bg-[#111622]/90 p-4 border border-white/[0.07] hover:border-amber-400/35 transition border-t border-t-amber-500/40 shadow-sm"
                    >
                      {/* Carved Corner Accent */}
                      <div className="pointer-events-none absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-amber-400/40" />
                      <div className="pointer-events-none absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-amber-400/40" />

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-teal-400" />
                          <span className="text-sm font-medium text-[#EDEDED]">{item.skill_name}</span>
                        </div>
                        <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-teal-300 border border-teal-500/25 tabular-nums">
                          {item.demand_pct}% Demand
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#8F97A6] my-1">
                        <span className="font-mono text-[10px] text-[#525866]">Category:</span>
                        <span className="text-slate-300 font-mono text-[11px]">{item.category_name}</span>
                      </div>

                      {item.prereq_skill_name && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-300 my-2 bg-amber-500/5 p-2 rounded-lg border border-amber-500/20">
                          <span className="text-[10px] font-mono text-[#8F97A6]">Prerequisite:</span>
                          <span className="font-mono font-medium text-amber-200">{item.prereq_skill_name}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-[#8F97A6] mt-2 border-t border-white/[0.04] pt-2 leading-relaxed">
                        ⚡ {item.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {(!recommendation?.roadmap_steps || recommendation.roadmap_steps.length === 0) && (
            <div className="p-8 text-center text-[#8F97A6] text-xs font-mono">
              All prerequisites satisfied for the selected role!
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
