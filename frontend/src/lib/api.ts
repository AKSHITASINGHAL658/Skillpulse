const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface SummaryKPI {
  total_postings: number;
  total_companies: number;
  total_skills: number;
  market_avg_salary: number;
  top_skill_name: string;
}

export interface SkillItem {
  skill_id: number;
  skill_name: string;
  category_name: string;
  posting_count: number;
  demand_pct: number;
  avg_salary: number;
}

export interface TrendData {
  series: Array<Record<string, any>>;
  skills: string[];
}

export interface SalaryItem {
  role_title: string;
  posting_count: number;
  avg_salary: number;
  median_salary: number;
  min_salary: number;
  max_salary: number;
}

export interface CoOccurrenceItem {
  related_skill_id: number;
  related_skill_name: string;
  co_occurrence_count: number;
  category_name?: string;
  skill_a_name?: string;
  skill_b_name?: string;
}

export interface HiringHotspots {
  companies: Array<{
    company_name: string;
    industry: string;
    posting_count: number;
    avg_offered_salary: number;
  }>;
  locations: Array<{
    city: string;
    state: string;
    is_remote_friendly: boolean;
    posting_count: number;
    avg_salary: number;
  }>;
}

export interface RecommendationResponse {
  recommendation: {
    id: number;
    user_id: number;
    target_role_id: number;
    target_role_title: string;
    role_category: string;
    readiness_score: number;
    generated_at: string;
  };
  items: Array<{
    id: number;
    step_no: number;
    skill_id: number;
    skill_name: string;
    category_name: string;
    prereq_skill_id: number | null;
    prereq_skill_name: string | null;
    demand_pct: number;
    reason: string;
  }>;
  roadmap_steps: Array<{
    step_no: number;
    skills: Array<any>;
  }>;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  target_role_id: number | null;
  target_role_title: string | null;
  role_category: string | null;
  skills: Array<{
    skill_id: number;
    skill_name: string;
    category_name: string;
    proficiency: number;
    acquired_date: string;
  }>;
}

export interface MetaItem {
  id: number;
  title?: string;
  name?: string;
  city?: string;
  state?: string;
  category?: string;
  category_name?: string;
  description?: string;
  is_remote_friendly?: boolean;
}

export const api = {
  getSummary: async (): Promise<SummaryKPI> => {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    return res.json();
  },

  getTopSkills: async (roleId?: number, locationId?: number, timeRange = "6m"): Promise<SkillItem[]> => {
    const params = new URLSearchParams();
    if (roleId) params.append("role_id", roleId.toString());
    if (locationId) params.append("location_id", locationId.toString());
    params.append("time_range", timeRange);
    const res = await fetch(`${API_BASE}/analytics/top-skills?${params.toString()}`);
    return res.json();
  },

  getTrends: async (skillIds?: string): Promise<TrendData> => {
    const params = new URLSearchParams();
    if (skillIds) params.append("skill_ids", skillIds);
    const res = await fetch(`${API_BASE}/analytics/trends?${params.toString()}`);
    return res.json();
  },

  getSalaries: async (roleId?: number, locationId?: number): Promise<SalaryItem[]> => {
    const params = new URLSearchParams();
    if (roleId) params.append("role_id", roleId.toString());
    if (locationId) params.append("location_id", locationId.toString());
    const res = await fetch(`${API_BASE}/analytics/salaries?${params.toString()}`);
    return res.json();
  },

  getCoOccurrence: async (skillId?: number): Promise<CoOccurrenceItem[]> => {
    const params = new URLSearchParams();
    if (skillId) params.append("skill_id", skillId.toString());
    const res = await fetch(`${API_BASE}/analytics/co-occurrence?${params.toString()}`);
    return res.json();
  },

  getHiringMap: async (skillId?: number): Promise<HiringHotspots> => {
    const params = new URLSearchParams();
    if (skillId) params.append("skill_id", skillId.toString());
    const res = await fetch(`${API_BASE}/analytics/hiring-map?${params.toString()}`);
    return res.json();
  },

  // User Profile & Career Compass
  getUserProfile: async (): Promise<UserProfile> => {
    const res = await fetch(`${API_BASE}/users/me`);
    return res.json();
  },

  updateTargetRole: async (roleId: number) => {
    const res = await fetch(`${API_BASE}/users/target-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_role_id: roleId }),
    });
    return res.json();
  },

  updateUserSkill: async (skillId: number, proficiency: number) => {
    const res = await fetch(`${API_BASE}/users/skills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill_id: skillId, proficiency }),
    });
    return res.json();
  },

  deleteUserSkill: async (skillId: number) => {
    const res = await fetch(`${API_BASE}/users/skills/${skillId}`, {
      method: "DELETE",
    });
    return res.json();
  },

  getLatestRecommendation: async (): Promise<RecommendationResponse> => {
    const res = await fetch(`${API_BASE}/recommendations/latest`);
    return res.json();
  },

  generateRecommendation: async (): Promise<RecommendationResponse> => {
    const res = await fetch(`${API_BASE}/recommendations/generate`, {
      method: "POST",
    });
    return res.json();
  },

  // Metadata
  getRoles: async (): Promise<MetaItem[]> => {
    const res = await fetch(`${API_BASE}/meta/roles`);
    return res.json();
  },

  getLocations: async (): Promise<MetaItem[]> => {
    const res = await fetch(`${API_BASE}/meta/locations`);
    return res.json();
  },

  getSkills: async (): Promise<MetaItem[]> => {
    const res = await fetch(`${API_BASE}/meta/skills`);
    return res.json();
  },

  // Admin
  getAliases: async () => {
    const res = await fetch(`${API_BASE}/admin/aliases`);
    return res.json();
  },

  createAlias: async (aliasName: string, skillId: number) => {
    const res = await fetch(`${API_BASE}/admin/aliases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias_name: aliasName, skill_id: skillId }),
    });
    return res.json();
  },

  uploadCSV: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/admin/import-csv`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  refreshViews: async () => {
    const res = await fetch(`${API_BASE}/admin/refresh-views`, {
      method: "POST",
    });
    return res.json();
  },

  // Scraper Engine
  triggerScraper: async (query: string, location: string = "Bengaluru", source: string = "all", limit: number = 25) => {
    const res = await fetch(`${API_BASE}/scraper/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, location, source, limit }),
    });
    return res.json();
  },

  getScraperStatus: async (): Promise<ScraperStatusResponse> => {
    const res = await fetch(`${API_BASE}/scraper/status`);
    return res.json();
  },
};

export interface ScraperTask {
  task_id: string;
  query: string;
  location: string;
  source: string;
  limit: number;
  status: "running" | "completed" | "failed";
  total_found: number;
  total_processed: number;
  newly_inserted: number;
  skills_extracted_count: number;
  recent_skills: string[];
  logs: string[];
  started_at: string;
  completed_at: string | null;
  error: string | null;
}

export interface ScraperStatusResponse {
  status: "idle" | "running" | "completed" | "failed";
  message?: string;
  active_task: ScraperTask | null;
  history_count: number;
}

