"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  CircularProgressbar,
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Clock,
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  Download,
  Share,
  Info,
} from "lucide-react";
import type { AnalysisResult, DetailedAnalysisResult } from "@/types";

const ScoreCard = ({
  title,
  score,
  maxScore,
  icon,
  description,
}: {
  title: string;
  score: number;
  maxScore: number;
  icon: string;
  description: string;
}) => {
  const percentage = Math.round((score / maxScore) * 100);

  const getColor = () => {
    if (percentage >= 75) return "#4ade80";
    if (percentage >= 50) return "#facc15";
    return "#f87171";
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start">
        <div className="w-16 h-16 mr-4">
          <CircularProgressbar
            value={percentage}
            text={`${score}/${maxScore}`}
            styles={buildStyles({
              textSize: "28px",
              pathColor: getColor(),
              textColor: getColor(),
              trailColor: "rgba(255,255,255,0.1)",
            })}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <span className="text-2xl mr-2">{icon}</span>
            <h3 className="font-bold text-lg text-white">{title}</h3>
          </div>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

const LoadingIndicator = ({ stage }: { stage: string }) => (
  <div className="bg-gray-800 rounded-xl p-8 shadow-lg text-center">
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain className="w-6 h-6 text-blue-400 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">מנתח את המיזם שלך</h3>
        <p className="text-gray-400">{stage}</p>
      </div>

      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>משך זמן משוער: 2-3 דקות</span>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
        <div className="flex flex-col items-center space-y-2 p-3 bg-blue-500/10 rounded-lg">
          <Zap className="w-5 h-5 text-blue-400" />
          <span className="text-xs text-blue-400">ChatGPT</span>
        </div>
        <div className="flex flex-col items-center space-y-2 p-3 bg-purple-500/10 rounded-lg">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-xs text-purple-400">Gemini</span>
        </div>
        <div className="flex flex-col items-center space-y-2 p-3 bg-green-500/10 rounded-lg">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <span className="text-xs text-green-400">ניתוח משולב</span>
        </div>
      </div>
    </div>
  </div>
);

interface EnhancedResultDisplayProps {
  result: AnalysisResult;
  detailedResult?: DetailedAnalysisResult;
  loading?: boolean;
  stage?: string;
}

export default function EnhancedResultDisplay({
  result,
  detailedResult,
  loading = false,
  stage = "מכין ניתוח...",
}: EnhancedResultDisplayProps) {
  const [activeTab, setActiveTab] = useState<string>("chatgpt");
  const [isReady, setIsReady] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsReady(true);
      // Auto-select first available tab
      if (
        result.chatgpt &&
        activeTab !== "chatgpt" &&
        activeTab !== "gemini" &&
        activeTab !== "comprehensive"
      ) {
        setActiveTab("chatgpt");
      } else if (result.gemini && !result.chatgpt) {
        setActiveTab("gemini");
      } else if (result.comprehensive && !result.chatgpt && !result.gemini) {
        setActiveTab("comprehensive");
      }
    }
  }, [loading, result, activeTab]);

  if (loading) {
    return <LoadingIndicator stage={stage} />;
  }

  if (!isReady) {
    return <div className="animate-pulse">טוען תוצאות...</div>;
  }

  const { gemini, chatgpt, comprehensive } = result;

  // Extract scoring data if available
  const hasScoring = detailedResult?.scoring?.breakdown;

  const categoryScores = hasScoring
    ? [
        {
          title: "מייסדים וצוות",
          score: hasScoring.teamCapability,
          maxScore: 15,
          icon: "👥",
          description: "יכולת הצוות והתאמת המייסדים",
        },
        {
          title: "הרעיון והמשתמשים",
          score: hasScoring.problemClarity + hasScoring.solutionDifferentiation,
          maxScore: 20,
          icon: "💡",
          description: "בהירות הבעיה ודיפרנציאציית הפתרון",
        },
        {
          title: "הבנת השוק",
          score: hasScoring.tamSamSom + hasScoring.marketTiming,
          maxScore: 20,
          icon: "📊",
          description: "ריאליות TAM/SAM/SOM ותזמון שוק",
        },
        {
          title: "נוף תחרותי",
          score: hasScoring.competitorAwareness,
          maxScore: 10,
          icon: "🏆",
          description: "מיפוי תחרות ויתרונות תחרותיים",
        },
        {
          title: "מודל עסקי",
          score: hasScoring.businessModel + hasScoring.porterForces,
          maxScore: 20,
          icon: "💰",
          description: "הכנסות, עלויות ואסטרטגיית צמיחה",
        },
        {
          title: "סיכונים ומציאות",
          score: hasScoring.swotRisk,
          maxScore: 10,
          icon: "⚠️",
          description: "זיהוי סיכונים ואמצעי מיטיגציה",
        },
        {
          title: "ולידציה וביצוע",
          score: hasScoring.crossValidation + hasScoring.momTest,
          maxScore: 5,
          icon: "✅",
          description: "תיקוף השוק ותכנית פעולה",
        },
      ]
    : [];

  const totalScore = detailedResult?.score || 0;
  const maxScore = detailedResult?.maxScore || 105;
  const scorePercentage = Math.round((totalScore / maxScore) * 100);

  const getScoreColor = () => {
    if (scorePercentage >= 75) return "#4ade80";
    if (scorePercentage >= 50) return "#facc15";
    return "#f87171";
  };

  const getScoreMessage = () => {
    if (scorePercentage >= 75) return "מיזם עם פוטנציאל גבוה מאוד";
    if (scorePercentage >= 50) return "מיזם מבטיח עם הזדמנויות לשיפור";
    return "מיזם הדורש עבודה נוספת להצלחה";
  };

  const exportReport = () => {
    // Implementation for exporting PDF report
    console.log("Exporting report...");
  };

  const shareResults = () => {
    setShowShareOptions(!showShareOptions);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg space-y-6">
      {/* Success Header */}
      <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-center justify-center gap-3 mb-2">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-bold text-green-400">
            ניתוח הושלם בהצלחה!
          </h2>
        </div>
        <p className="text-gray-300">המיזם שלך נותח על ידי מערכות AI מתקדמות</p>
      </div>

      {/* Overall Score Section */}
      {detailedResult && (
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="w-48 h-48 mx-auto lg:mx-0">
              <CircularProgressbarWithChildren
                value={scorePercentage}
                styles={buildStyles({
                  pathColor: getScoreColor(),
                  textSize: "16px",
                  pathTransitionDuration: 1.5,
                  textColor: "#f88",
                  trailColor: "rgba(255,255,255,0.1)",
                })}
              >
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-1">
                    {totalScore}
                  </div>
                  <div className="text-sm text-gray-400">מתוך {maxScore}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {scorePercentage}%
                  </div>
                </div>
              </CircularProgressbarWithChildren>
            </div>

            <div className="text-center lg:text-right flex-1">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text mb-2">
                ניתוח מיזם {detailedResult.ventureId}
              </h2>
              <p
                className="text-xl text-white mb-2"
                style={{ color: getScoreColor() }}
              >
                {getScoreMessage()}
              </p>
              <p className="text-gray-300 mb-4">
                ניתוח זה מבוסס על {detailedResult.progressPercentage}% מהשאלון
                המלא, ומשלב תובנות מ-
                {Object.keys(detailedResult.results).length} מנועי AI מתקדמים.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <button
                  onClick={exportReport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  הורד דוח PDF
                </button>
                <div className="relative">
                  <button
                    onClick={shareResults}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors"
                  >
                    <Share className="w-4 h-4" />
                    שתף תוצאות
                  </button>
                  {showShareOptions && (
                    <div className="absolute top-full mt-2 right-0 bg-gray-700 border border-gray-600 rounded-lg p-3 shadow-lg z-10">
                      <div className="space-y-2 text-sm">
                        <button className="block w-full text-left px-3 py-2 hover:bg-gray-600 rounded">
                          העתק קישור
                        </button>
                        <button className="block w-full text-left px-3 py-2 hover:bg-gray-600 rounded">
                          שלח באימייל
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/30 text-sm mt-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-300 mb-1">
                      💡 תובנה מרכזית:
                    </p>
                    <p className="text-gray-300">
                      הניתוח מראה שהמיזם שלך{" "}
                      {scorePercentage >= 75
                        ? "בעל פוטנציאל גבוה ומבוסס היטב. המשך בכיוון הנוכחי עם התמקדות בהוצאה לפועל."
                        : scorePercentage >= 50
                        ? "מבטיח אך דורש שיפורים משמעותיים בתחומים מסוימים לפני המשך פיתוח."
                        : "מצריך חשיבה מחודשת במספר היבטים מרכזיים לפני המשך השקעה."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Scores */}
          {hasScoring && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Target className="w-5 h-5" />
                ניתוח קטגוריות מפורט
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryScores.map((category) => (
                  <ScoreCard key={category.title} {...category} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Analysis Tabs */}
      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          ניתוח AI מפורט
        </h3>

        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full bg-gray-700 p-1 rounded-lg mb-6">
            {chatgpt && (
              <TabsTrigger
                value="chatgpt"
                className={`flex-1 py-3 px-4 rounded-md transition-all ${
                  activeTab === "chatgpt"
                    ? "bg-blue-500 text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-gray-600"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">ChatGPT</span>
                </div>
              </TabsTrigger>
            )}
            {gemini && (
              <TabsTrigger
                value="gemini"
                className={`flex-1 py-3 px-4 rounded-md transition-all ${
                  activeTab === "gemini"
                    ? "bg-purple-500 text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-gray-600"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">Gemini</span>
                </div>
              </TabsTrigger>
            )}
            {comprehensive && (
              <TabsTrigger
                value="comprehensive"
                className={`flex-1 py-3 px-4 rounded-md transition-all ${
                  activeTab === "comprehensive"
                    ? "bg-green-500 text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-gray-600"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">ניתוח מקיף</span>
                </div>
              </TabsTrigger>
            )}
          </TabsList>

          {chatgpt && (
            <TabsContent value="chatgpt" className="mt-0">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-6">
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{chatgpt}</ReactMarkdown>
                </div>
              </div>
            </TabsContent>
          )}

          {gemini && (
            <TabsContent value="gemini" className="mt-0">
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-6">
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{gemini}</ReactMarkdown>
                </div>
              </div>
            </TabsContent>
          )}

          {comprehensive && (
            <TabsContent value="comprehensive" className="mt-0">
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-6">
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{comprehensive}</ReactMarkdown>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Next Steps Section */}
      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          צעדים הבאים מומלצים
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">📝</span>
              <h4 className="font-medium text-white">השלם את השאלון</h4>
            </div>
            <p className="text-sm text-gray-300">
              השלם שאלות נוספות כדי לקבל ניתוח עמוק יותר ולשפר את הציון הכולל.
            </p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">📊</span>
              <h4 className="font-medium text-white">חקור נתוני שוק</h4>
            </div>
            <p className="text-sm text-gray-300">
              בדוק את הנתונים והתחזיות לגבי TAM/SAM/SOM שלך עם מקורות חיצוניים.
            </p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">👥</span>
              <h4 className="font-medium text-white">דבר עם לקוחות</h4>
            </div>
            <p className="text-sm text-gray-300">
              בצע ראיונות Mom Test עם 5-10 לקוחות פוטנציאליים לתיקוף הרעיון.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          ניתוח זה נוצר על ידי מערכת Methodian AI • זמן יצירה:{" "}
          {new Date().toLocaleString("he-IL")}
        </p>
      </div>
    </div>
  );
}
