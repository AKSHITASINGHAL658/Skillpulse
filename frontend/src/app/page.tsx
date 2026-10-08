"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { BentoDashboard } from "@/components/BentoDashboard";
import { CareerCompass } from "@/components/CareerCompass";
import { AdminPortal } from "@/components/AdminPortal";
import { Constellation3D } from "@/components/Constellation3D";
import { LiveMarketSync } from "@/components/LiveMarketSync";
import { IndianMotifBackground } from "@/components/IndianMotifBackground";
import { api, SummaryKPI } from "@/lib/api";
import { Database, Server, LayoutDashboard, Sparkles, MapPin } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "career" | "admin">("dashboard");
  const [kpi, setKpi] = useState<SummaryKPI | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  const fetchKPI = useCallback(async () => {
    try {
      const data = await api.getSummary();
      setKpi(data);
    } catch (err) {
      console.error("Failed fetching summary KPI:", err);
    }
  }, []);

  useEffect(() => {
    fetchKPI();
  }, [fetchKPI, dashboardRefreshKey]);

  const handleSyncComplete = useCallback(() => {
    setDashboardRefreshKey((prev) => prev + 1);
    fetchKPI();
  }, [fetchKPI]);

  return (
    <div className="relative min-h-screen bg-[#0A0D14] text-[#EDEDED] flex flex-col justify-between selection:bg-[#EAB308]/30 selection:text-white">
      {/* Indo-Western Minimalist Sacred Geometry & Watermark Layers */}
      <IndianMotifBackground />

      {/* Atmospheric Ambient Lighting Gradients */}
      <div className="ambient-glow" />
      <div className="ambient-glow-secondary" />

      {/* Floating Glass Dock Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        kpi={kpi} 
        onOpenSync={() => setIsSyncModalOpen(true)}
      />

      {/* Main Container */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 flex-1 space-y-6">
        {/* Spatial 3D Hero Constellation Canvas (Visible on dashboard and career views) */}
        {activeTab !== "admin" && (
          <div className="w-full">
            <Constellation3D key={dashboardRefreshKey} />
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <BentoDashboard 
            refreshKey={dashboardRefreshKey} 
            onOpenSync={() => setIsSyncModalOpen(true)}
          />
        )}
        {activeTab === "career" && <CareerCompass />}
        {activeTab === "admin" && (
          <AdminPortal 
            onOpenSync={() => setIsSyncModalOpen(true)} 
          />
        )}
      </main>

      {/* Live Market Ingestion Modal / Drawer */}
      <LiveMarketSync
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncComplete={handleSyncComplete}
      />

      {/* Editorial Footer with India Tech Badges */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#0E121A]/70 backdrop-blur-xl py-6 text-xs text-[#8F97A6]">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#EDEDED]">SkillPulse India</span>
            <span>•</span>
            <span className="text-[#8F97A6]">National Skill Demand Analytics & Recursive DAG Engine</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 border border-white/[0.06] text-[11px] text-[#94A3B8]">
              <Database className="h-3 w-3 text-sky-400" />
              PostgreSQL 16 (13 BCNF, Recursive CTE, MV)
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 border border-white/[0.06] text-[11px] text-[#94A3B8]">
              <Server className="h-3 w-3 text-emerald-400" />
              FastAPI + psycopg3
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 border border-white/[0.06] text-[11px] text-[#94A3B8]">
              <MapPin className="h-3 w-3 text-[#E2D4C0]" />
              Bengaluru • Hyderabad • Gurugram • Pune
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
