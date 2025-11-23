export enum CheckStatus {
  PASS = 'PASS',
  WARN = 'WARN',
  FAIL = 'FAIL',
}

export enum Category {
  LAYOUT = 'LAYOUT',
  TYPOGRAPHY = 'TYPOGRAPHY',
  IMAGERY = 'IMAGERY',
  CONTENT = 'CONTENT',
  COLOR = 'COLOR',
}

export interface CheckItem {
  category: Category;
  status: CheckStatus;
  title: string;
  description: string;
  location?: string; // Text description like "Page 1 footer"
  visualZone?: 'TOP_LEFT' | 'TOP_CENTER' | 'TOP_RIGHT' | 'MIDDLE_LEFT' | 'CENTER' | 'MIDDLE_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_CENTER' | 'BOTTOM_RIGHT' | 'FULL_PAGE';
}

export interface DocumentSpecs {
  pageCount: number;
  detectedDimensions: string;
  colorProfileEstimate: string;
  hasCropMarks: boolean;
}

export interface PreflightReport {
  overallScore: number;
  summary: string;
  finalVerdict: 'READY_FOR_PRINT' | 'NEEDS_REVIEW' | 'DO_NOT_PRINT';
  checks: CheckItem[];
  specs: DocumentSpecs;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  progressStep: string;
  error: string | null;
  report: PreflightReport | null;
}

export type Tab = 'PREFLIGHT' | 'GENERATOR' | 'EDITOR';
