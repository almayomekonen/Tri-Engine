export interface LegacyFormData {
  businessName: string;
  problem: string;
  solution: string;
  targetMarket: string;
  engine?: string;
}

export interface QuestionnaireRequest {
  businessName: string;
  email: string;
  phone?: string;
  city?: string;
  selectedQuestions: string[];
  answers: Record<string, string>;
  engines: ("chatgpt" | "gemini" | "perplexity")[];
}

export function isLegacyRequest(body: unknown): body is LegacyFormData {
  return (
    typeof body === "object" &&
    body !== null &&
    "problem" in body &&
    "solution" in body &&
    "targetMarket" in body
  );
}

export function isQuestionnaireRequest(
  body: unknown
): body is QuestionnaireRequest {
  return (
    typeof body === "object" &&
    body !== null &&
    "selectedQuestions" in body &&
    "answers" in body &&
    "email" in body
  );
}
