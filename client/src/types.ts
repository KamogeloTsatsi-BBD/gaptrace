export type AnalysisStatus = 'full' | 'partial' | 'missing' | 'needs_review';
export type GapCategory = 'error_handling' | 'edge_cases' | 'permissions' | 'validation' | 'data_integrity' | 'performance' | 'ui_ux' | 'other';
export type Evidence = 'none' | Array<{ file: string; lines: string }>;

export interface Criterion {
  id: string;
  criterion_text: string;
  verifiable: boolean;
  status: AnalysisStatus;
  reason: string;
  evidence: Evidence;
  confidence?: number;
  category: GapCategory | null;
}

export interface AnalysisReport {
  id: string;
  created_at: string;
  requirement_text?: string;
  pr_reference?: string | null;
  criteria: Criterion[];
}

export interface CreateAnalysisPayload {
  requirementText: string;
  diffText?: string;
  prUrl?: string;
}

export interface InsightCategory {
  category: GapCategory;
  gap_count: number;
  gap_rate: number;
}

export interface InsightNarrative {
  finding: string;
  grounding_stat: string;
  hypothesis: string;
  suggested_action: string;
  severity: 'high' | 'medium' | 'low';
}

export interface InsightsData {
  substrate: { total_criteria: number; gap_count: number; gap_rate: number; categories: InsightCategory[] };
  narrative: InsightNarrative[];
}
