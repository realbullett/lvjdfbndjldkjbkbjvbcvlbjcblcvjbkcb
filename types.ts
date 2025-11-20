export enum UrgencyLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export interface MedicalCondition {
  name: string;
  probability: number; // 0-100
  description: string;
  urgency: UrgencyLevel;
  symptoms_matched: string[];
  recommendations: string[];
}

export interface DiagnosisResponse {
  conditions: MedicalCondition[];
  disclaimer: string;
  general_advice: string;
}

export interface DiagnosisState {
  results: DiagnosisResponse | null;
  loading: boolean;
  error: string | null;
}