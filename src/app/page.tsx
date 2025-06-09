"use client";

import { useState } from "react";
import ResearchForm from "@/components/client/ResearchForm";
import PerfectQuestionnaireForm from "@/components/client/QuestionnaireForm";
import EnhancedResultDisplay from "@/components/client/ResultDisplay";

import MethodologyInfo from "@/components/server/MethodologyInfo";
import PageHeader from "@/components/ui/PageHeader";
import { GlobalStyles } from "@/components/ui/styles";
import {
  FileText,
  ClipboardList,
  BarChart3,
  Zap,
  Clock,
  Target,
} from "lucide-react";
import type {
  FormData,
  AnalysisResult,
  QuestionnaireFormData,
  DetailedAnalysisResult,
} from "@/types";

type FormMode = "simple" | "advanced" | "results";

interface TabButtonProps {
  mode: FormMode;
  icon: React.ElementType;
  title: string;
  description: string;
  time?: string;
  complexity?: string;
}

export default function Home() {
  const [activeMode, setActiveMode] = useState<FormMode>("advanced");
  const [loading, setLoading] = useState(false);
  const [analysisStage, setAnalysisStage] = useState("מכין ניתוח...");
  const [result, setResult] = useState<AnalysisResult>({
    gemini: null,
    chatgpt: null,
    comprehensive: null,
  });
  const [detailedResult, setDetailedResult] = useState<
    DetailedAnalysisResult | undefined
  >(undefined);

  // Handle legacy form submission (simple mode)
  const handleSimpleSubmit = async (formData: FormData) => {
    setLoading(true);
    setActiveMode("results");
    setAnalysisStage("מעבד נתונים בסיסיים...");

    try {
      setAnalysisStage("מנתח עם ChatGPT...");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, engine: "both" }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      setAnalysisStage("מנתח עם Gemini...");

      const data = await response.json();

      setAnalysisStage("מכין ניתוח מקיף...");

      setResult({
        gemini: data.gemini || null,
        chatgpt: data.chatgpt || null,
        comprehensive: null,
      });
      setDetailedResult(undefined);

      setAnalysisStage("ניתוח הושלם!");
    } catch (error) {
      console.error("Error:", error);
      alert(
        `שגיאה בניתוח: ${
          error instanceof Error ? error.message : "שגיאה לא ידועה"
        }`
      );
      setActiveMode("simple");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionnaireSubmit = async (formData: QuestionnaireFormData) => {
    setLoading(true);
    setActiveMode("results");

    // Enhanced loading stages with realistic timing
    const stages = [
      { text: "מעבד נתוני השאלון...", duration: 1000 },
      { text: "מכין פרומפט מותאם אישית...", duration: 2000 },
      { text: "שולח לניתוח ChatGPT-4...", duration: 15000 },
      { text: "מנתח עם Gemini Pro...", duration: 15000 },
      { text: "מחשב ציונים מפורטים...", duration: 3000 },
      { text: "יוצר ניתוח משולב...", duration: 2000 },
      { text: "שומר תוצאות במסד נתונים...", duration: 1000 },
      { text: "מכין תצוגה סופית...", duration: 1000 },
    ];

    let currentStage = 0;

    // Start the loading progression
    const progressInterval = setInterval(() => {
      if (currentStage < stages.length - 1) {
        currentStage++;
        setAnalysisStage(stages[currentStage].text);
      }
    }, 5000); // Change stage every 5 seconds

    try {
      setAnalysisStage(stages[0].text);

      console.log("Submitting questionnaire form data:", {
        businessName: formData.businessName,
        email: formData.email,
        questionCount: formData.selectedQuestions.length,
        engines: formData.engines,
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", response.status, errorText);
        throw new Error(
          `Server responded with ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Analysis completed successfully:", data);

      // Set results
      setDetailedResult({
        ventureId: data.ventureId,
        score: data.score,
        maxScore: data.maxScore,
        progressPercentage: data.progressPercentage,
        results: data.results,
        scoring: data.scoring,
        comprehensive: data.comprehensive,
        savedAt: new Date(),
      });

      setResult({
        gemini: data.results?.gemini || null,
        chatgpt: data.results?.chatgpt || null,
        comprehensive: data.comprehensive || null,
      });

      setAnalysisStage("ניתוח הושלם בהצלחה! 🎉");
    } catch (error) {
      console.error("Error in questionnaire submission:", error);
      alert(
        `שגיאה בניתוח: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      setActiveMode("advanced");
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const TabButton = ({
    mode,
    icon: Icon,
    title,
    description,
    time,
    complexity,
  }: TabButtonProps) => (
    <button
      onClick={() => setActiveMode(mode)}
      className={`flex-1 p-6 rounded-xl border-2 transition-all hover:scale-[1.02] ${
        activeMode === mode
          ? "border-blue-500 bg-blue-500/10 text-blue-400 shadow-lg"
          : "border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className={`p-3 rounded-lg ${
            activeMode === mode ? "bg-blue-500/20" : "bg-gray-600/50"
          }`}
        >
          <Icon size={28} />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-lg mb-1">{title}</h3>
          <p className="text-sm opacity-80 mb-2">{description}</p>
          {(time || complexity) && (
            <div className="flex items-center justify-center gap-4 text-xs">
              {time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{time}</span>
                </div>
              )}
              {complexity && (
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>{complexity}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <PageHeader />

        {/* Tab Navigation */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-5xl mx-auto">
          <TabButton
            mode="simple"
            icon={FileText}
            title="ניתוח מהיר"
            description="4 שאלות בסיסיות לניתוח ראשוני של הרעיון"
            time="2 דק'"
            complexity="בסיסי"
          />
          <TabButton
            mode="advanced"
            icon={ClipboardList}
            title="שאלון מתקדם"
            description="ניתוח מקצועי מעמיק עם ציון פורמלי"
            time="15-25 דק'"
            complexity="מקצועי"
          />
          <TabButton
            mode="results"
            icon={BarChart3}
            title="תוצאות הניתוח"
            description="צפייה בניתוח המקיף שנוצר"
            complexity="סופי"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <MethodologyInfo />

            {/* Progress Summary for Advanced Mode */}
            {detailedResult && activeMode === "results" && (
              <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-600">
                <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  סיכום ציונים
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">ציון כללי:</span>
                    <span className="text-blue-400 font-bold text-lg">
                      {detailedResult.score}/{detailedResult.maxScore}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">השלמת שאלון:</span>
                    <span className="text-green-400 font-medium">
                      {detailedResult.progressPercentage}%
                    </span>
                  </div>
                  <div className="mt-3 bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
                      style={{
                        width: `${
                          (detailedResult.score / detailedResult.maxScore) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    {detailedResult.score >= detailedResult.maxScore * 0.75
                      ? "🎉 ציון מעולה!"
                      : detailedResult.score >= detailedResult.maxScore * 0.5
                      ? "👍 ציון טוב"
                      : "💪 יש מקום לשיפור"}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-4 border border-purple-500/30">
              <h3 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                טיפים מהירים
              </h3>
              <ul className="text-sm text-gray-300 space-y-1">
                {activeMode === "simple" && (
                  <>
                    <li>• תהיה ספציפי בתיאור הבעיה</li>
                    <li>• הסבר את הערך הייחודי שלך</li>
                    <li>• זהה בדיוק את קהל היעד</li>
                  </>
                )}
                {activeMode === "advanced" && (
                  <>
                    <li>• השתמש בדוגמאות לקבלת השראה</li>
                    <li>• שאלות בעדיפות גבוהה חשובות יותר</li>
                    <li>• תשובות מפורטות = ניתוח עמוק יותר</li>
                  </>
                )}
                {activeMode === "results" && (
                  <>
                    <li>• קרא את כל הטאבים לתמונה מלאה</li>
                    <li>• התמקד בצעדים הבאים</li>
                    <li>• שמור את הדוח לעיון עתידי</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeMode === "simple" && (
              <>
                <div className="mb-6 p-5 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                  <h3 className="text-blue-400 font-bold text-lg mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    ניתוח מהיר לבדיקת כדאיות ראשונית
                  </h3>
                  <p className="text-gray-300">
                    מלא 4 שאלות בסיסיות וקבל ניתוח ראשוני של המיזם שלך תוך 2-3
                    דקות. מתאים לרעיונות בשלבים מוקדמים או לבדיקה מהירה של
                    כדאיות.
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-sm text-blue-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      2-3 דקות
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      ניתוח בסיסי
                    </span>
                  </div>
                </div>
                <ResearchForm onSubmit={handleSimpleSubmit} loading={loading} />
              </>
            )}

            {activeMode === "advanced" && (
              <>
                <div className="mb-6 p-5 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                  <h3 className="text-purple-400 font-bold text-lg mb-2 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    שאלון מקצועי מעמיק עם ציון פורמלי
                  </h3>
                  <p className="text-gray-300 mb-3">
                    שאלון מקצועי המבוסס על מתודולוגיית Methodian Feasibility.
                    בחר את השאלות הרלוונטיות למיזם שלך וקבל ניתוח מקיף עם ציון
                    0-105.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-purple-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      15-25 דקות
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      ניתוח מקצועי
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      שמירה אוטומטית
                    </span>
                  </div>
                </div>
                <PerfectQuestionnaireForm
                  onSubmit={handleQuestionnaireSubmit}
                  loading={loading}
                />
              </>
            )}

            {activeMode === "results" && (
              <>
                {result.gemini ||
                result.chatgpt ||
                result.comprehensive ||
                loading ? (
                  <>
                    <div className="mb-6 p-5 bg-green-900/20 border border-green-500/30 rounded-xl">
                      <h3 className="text-green-400 font-bold text-lg mb-2 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        תוצאות הניתוח המקיף
                      </h3>
                      <p className="text-gray-300">
                        ניתוח מקיף של המיזם העסקי שלך, מבוסס על הנתונים שסיפקת.
                        התוצאות כוללות ניתוח מפורט, ציון היתכנות, והמלצות פעולה.
                      </p>
                    </div>
                    <EnhancedResultDisplay
                      result={result}
                      detailedResult={detailedResult}
                      loading={loading}
                      stage={analysisStage}
                    />
                  </>
                ) : (
                  <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-600">
                    <div className="max-w-md mx-auto">
                      <div className="text-6xl mb-6">📈</div>
                      <h3 className="text-2xl font-bold text-gray-400 mb-3">
                        אין עדיין תוצאות ניתוח
                      </h3>
                      <p className="text-gray-500 mb-8 leading-relaxed">
                        בחר באחד מהטפסים כדי להתחיל ניתוח מקצועי של המיזם שלך.
                        קבל תובנות עמוקות ומקצועיות תוך דקות ספורות.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={() => setActiveMode("simple")}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          ניתוח מהיר
                        </button>
                        <button
                          onClick={() => setActiveMode("advanced")}
                          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <ClipboardList className="w-4 h-4" />
                          שאלון מתקדם
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <GlobalStyles />
    </main>
  );
}
