// types/index.ts

// Legacy types (keep for backward compatibility)
export interface FormData {
  businessName: string;
  problem: string;
  solution: string;
  targetMarket: string;
}

export interface AnalysisResult {
  gemini: string | null;
  chatgpt: string | null;
  comprehensive: string | null;
}

export type EngineType = "gemini" | "chatgpt" | "comprehensive";

// New questionnaire types
export interface QuestionnaireFormData {
  // Basic information
  businessName: string;
  email: string;
  phone?: string;
  city?: string;

  // Selected questions and answers
  selectedQuestions: string[];
  answers: Record<string, string>;

  // Analysis preferences
  engines: ("chatgpt" | "gemini" | "perplexity")[];
}

export interface DetailedAnalysisResult {
  ventureId: string;
  score: number;
  maxScore: number;
  progressPercentage: number;
  results: Record<string, string>; // engine -> analysis
  comprehensive: string | null;
  savedAt: Date;
  scoring?: {
    total: number;
    maxPossible: number;
    breakdown: ScoringBreakdown;
    lastUpdated: Date;
  };
}

export interface ScoringBreakdown {
  teamCapability: number;
  problemClarity: number;
  solutionDifferentiation: number;
  tamSamSom: number;
  marketTiming: number;
  competitorAwareness: number;
  businessModel: number;
  porterForces: number;
  swotRisk: number;
  crossValidation: number;
  academicSources: number;
  visualsData: number;
  momTest: number;
}

export interface VentureHistory {
  ventureId: string;
  businessName: string;
  score: number;
  maxScore: number;
  status: "draft" | "submitted" | "analyzed" | "completed";
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

// Question selection state for UI
export interface QuestionSelectionState {
  selectedQuestions: Set<string>;
  answers: Record<string, string>;
  currentCategory: string;
  completedCategories: Set<string>;
}

// Form validation
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

// Analysis request/response types
export interface AnalysisRequest {
  businessName: string;
  email: string;
  phone?: string;
  city?: string;
  selectedQuestions: string[];
  answers: Record<string, string>;
  engines: ("chatgpt" | "gemini" | "perplexity")[];
}

export interface AnalysisResponse {
  ventureId: string;
  score: number;
  maxScore: number;
  progressPercentage: number;
  results: Record<string, string>;
  comprehensive: string | null;
  savedAt: Date;
  error?: string;
}

export interface HistoryResponse {
  ventures: VentureHistory[];
  error?: string;
}

// UI Component Props
export interface QuestionCardProps {
  question: {
    id: string;
    text: string;
    placeholder: string;
    example?: string;
    helpText?: string;
    required: boolean;
    type: "text" | "textarea" | "number" | "email";
    maxLength?: number;
  };
  selected: boolean;
  answer: string;
  onToggle: (questionId: string) => void;
  onAnswerChange: (questionId: string, answer: string) => void;
}

export interface CategoryCardProps {
  category: {
    id: string;
    title: string;
    description: string;
    icon: string;
    weight: number;
    questions: unknown[];
  };
  selectedQuestions: Set<string>;
  answers: Record<string, string>;
  onQuestionToggle: (questionId: string) => void;
  onAnswerChange: (questionId: string, answer: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

// Progress tracking
export interface ProgressData {
  totalQuestions: number;
  selectedQuestions: number;
  completedAnswers: number;
  categoryProgress: Record<string, number>;
  overallProgress: number;
  estimatedTimeRemaining: number; // in minutes
}

// Export utility type for form handling
export type FormFieldValue = string | number | boolean | string[];
export type FormErrors = Record<string, string>;
export type FormTouched = Record<string, boolean>;
