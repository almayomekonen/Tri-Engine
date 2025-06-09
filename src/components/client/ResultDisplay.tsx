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

// Enhanced text formatter for better readability
const formatAnalysisText = (text: string): string => {
  if (!text) return text;

  let formatted = text;

  // Add spacing after main headers
  formatted = formatted.replace(
    /(תקציר מנהלים|ניתוח מפורט לפי קטגוריות|חישוב הציון הסופי|ניתוח SWOT|המלצות אסטרטגיות|סיכום והמלצת השקעה)/g,
    "\n\n# $1\n\n"
  );

  // Format category headers with scores
  formatted = formatted.replace(
    /(מידע אישי בסיסי|מחויבות ומשאבים|הבעיה והפתרון|ולידציה משתמשים|ניתוח שוק|צוות וביצוע|ניסיון קודם)\s*\(ציון:\s*(\d+\/\d+)\)/g,
    "\n\n## $1\n\n**📊 ציון: $2**\n"
  );

  // Format sub-sections with icons
  formatted = formatted.replace(/(ציון שנתן):/g, "\n\n### 🎯 $1:");

  formatted = formatted.replace(/(נימוק מפורט לציון):/g, "\n\n### 📝 $1:");

  formatted = formatted.replace(/(נקודות חוזק):/g, "\n\n### ✅ $1:");

  formatted = formatted.replace(/(נקודות לשיפור):/g, "\n\n### 🔧 $1:");

  formatted = formatted.replace(/(השפעה על ההערכה הכללית):/g, "\n\n### 📈 $1:");

  // Format SWOT sections with emojis
  formatted = formatted.replace(/(חוזקות)\s*\([^)]+\):/g, "\n\n### 💪 $1:");

  formatted = formatted.replace(/(חולשות)\s*\([^)]+\):/g, "\n\n### ⚠️ $1:");

  formatted = formatted.replace(/(הזדמנויות)\s*\([^)]+\):/g, "\n\n### 🚀 $1:");

  formatted = formatted.replace(/(איומים)\s*\([^)]+\):/g, "\n\n### 🔺 $1:");

  // Format recommendation timeframes
  formatted = formatted.replace(
    /(צעדים מיידיים)\s*\([^)]+\):/g,
    "\n\n### ⚡ $1:"
  );

  formatted = formatted.replace(
    /(יעדים לטווח בינוני)\s*\([^)]+\):/g,
    "\n\n### 🎯 $1:"
  );

  formatted = formatted.replace(/(אסטרטגיה ארוכת טווח)\s*:/g, "\n\n### 🌟 $1:");

  // Format final recommendation parts
  formatted = formatted.replace(/(המלצה ברורה):/g, "\n\n### 🏆 $1:");

  formatted = formatted.replace(/(נימוק מבוסס הציון):/g, "\n\n### 📊 $1:");

  formatted = formatted.replace(/(תנאים להצלחה):/g, "\n\n### 🔑 $1:");

  // Add spacing around score summaries
  formatted = formatted.replace(
    /(סיכום ציונים:|ציון סופי:)/g,
    "\n\n**📈 $1**\n\n"
  );

  // Format numbered recommendations
  formatted = formatted.replace(
    /(\d+)\s+(המלצות עיקריות?):/g,
    "\n\n## 🎯 $2\n\n"
  );

  // Add line breaks before bullet points
  formatted = formatted.replace(/^([•\-\*])/gm, "\n$1");

  // Clean up multiple newlines but preserve intentional spacing
  formatted = formatted.replace(/\n{4,}/g, "\n\n\n");

  // Ensure proper spacing at the beginning
  formatted = formatted.trim();

  return formatted;
};

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
    <div className="category-item score-section">
      <div className="category-header">
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
            <h3 className="category-name">{title}</h3>
          </div>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

const LoadingIndicator = ({ stage }: { stage: string }) => {
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 2, 95));
    }, 1000);

    const timeInterval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getEstimatedTimeLeft = () => {
    const averageTime = 45;
    const remaining = Math.max(averageTime - timeElapsed, 5);
    return `עוד כ-${remaining} שניות`;
  };

  return (
    <div className="bg-gray-800 rounded-xl p-8 shadow-lg text-center">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24">
            <div className="progress-indicator">
              <div
                className={`progress-bar ${
                  progress >= 75
                    ? "progress-high"
                    : progress >= 50
                    ? "progress-medium"
                    : "progress-low"
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <CircularProgressbar
              value={progress}
              text={`${progress}%`}
              styles={buildStyles({
                textSize: "16px",
                pathColor: "#3b82f6",
                textColor: "#3b82f6",
                trailColor: "rgba(255,255,255,0.1)",
                pathTransitionDuration: 0.8,
              })}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-bold text-white">מנתח את המיזם שלך</h3>
          <p className="text-blue-400 font-medium">{stage}</p>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>זמן שעבר: {formatTime(timeElapsed)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span>{getEstimatedTimeLeft()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          <div
            className={`flex flex-col items-center space-y-2 p-3 rounded-lg transition-all ${
              timeElapsed > 5
                ? "bg-blue-500/20 border border-blue-500/50"
                : "bg-gray-700"
            }`}
          >
            <Zap
              className={`w-5 h-5 ${
                timeElapsed > 5 ? "text-blue-400" : "text-gray-400"
              }`}
            />
            <span
              className={`text-xs ${
                timeElapsed > 5 ? "text-blue-400" : "text-gray-400"
              }`}
            >
              ChatGPT
            </span>
            {timeElapsed > 5 && (
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
          </div>

          <div
            className={`flex flex-col items-center space-y-2 p-3 rounded-lg transition-all ${
              timeElapsed > 15
                ? "bg-blue-500/20 border border-blue-500/50"
                : "bg-gray-700"
            }`}
          >
            <Sparkles
              className={`w-5 h-5 ${
                timeElapsed > 15 ? "text-blue-400" : "text-gray-400"
              }`}
            />
            <span
              className={`text-xs ${
                timeElapsed > 15 ? "text-blue-400" : "text-gray-400"
              }`}
            >
              Gemini
            </span>
            {timeElapsed > 15 && (
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
          </div>

          <div
            className={`flex flex-col items-center space-y-2 p-3 rounded-lg transition-all ${
              timeElapsed > 30
                ? "bg-green-500/20 border border-green-500/50"
                : "bg-gray-700"
            }`}
          >
            <TrendingUp
              className={`w-5 h-5 ${
                timeElapsed > 30 ? "text-green-400" : "text-gray-400"
              }`}
            />
            <span
              className={`text-xs ${
                timeElapsed > 30 ? "text-green-400" : "text-gray-400"
              }`}
            >
              ניתוח משולב
            </span>
            {timeElapsed > 30 && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>

        <div className="alert-info">
          <p className="text-blue-300 mb-2">
            💡 <strong>מה קורה כרגע?</strong>
          </p>
          <p className="text-gray-300">
            המערכת מנתחת את התשובות שלך באמצעות שני מנועי AI מתקדמים. כל מנוע
            בוחן היבטים שונים של המיזם ומספק תובנות ייחודיות.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="text-xs text-gray-400 hover:text-white transition-colors underline"
        >
          בטל ונסה שוב
        </button>
      </div>
    </div>
  );
};

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
          maxScore: 15,
          icon: "💰",
          description: "הכנסות, עלויות ואסטרטגיית צמיחה",
        },
        {
          title: "סיכונים ומציאות",
          score: hasScoring.swotRisk,
          maxScore: 5,
          icon: "⚠️",
          description: "זיהוי סיכונים ואמצעי מיטיגציה",
        },
        {
          title: "ולידציה וביצוע",
          score: hasScoring.crossValidation + hasScoring.momTest,
          maxScore: 10,
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
    console.log("Exporting report...");
  };

  const shareResults = () => {
    setShowShareOptions(!showShareOptions);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg space-y-6">
      {/* Success Header */}
      <div className="alert-success text-center">
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
                  <div className="score-value text-4xl font-bold text-white mb-1">
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
              <h2 className="text-3xl font-bold text-white mb-2">
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

              <div className="alert-info mt-4">
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
            <div className="section-divider">
              <h3 className="score-title text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Target className="w-5 h-5" />
                ניתוח קטגוריות מפורט
              </h3>
              <div className="category-breakdown grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryScores.map((category) => (
                  <ScoreCard key={category.title} {...category} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Analysis Tabs */}
      <div className="section-divider">
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
                    ? "bg-blue-500 text-white shadow-lg"
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
                <div className="analysis-content prose prose-invert max-w-none">
                  <ReactMarkdown>{formatAnalysisText(chatgpt)}</ReactMarkdown>
                </div>
              </div>
            </TabsContent>
          )}

          {gemini && (
            <TabsContent value="gemini" className="mt-0">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-6">
                <div className="analysis-content prose prose-invert max-w-none">
                  <ReactMarkdown>{formatAnalysisText(gemini)}</ReactMarkdown>
                </div>
              </div>
            </TabsContent>
          )}

          {comprehensive && (
            <TabsContent value="comprehensive" className="mt-0">
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-6">
                <div className="analysis-content prose prose-invert max-w-none">
                  <ReactMarkdown>
                    {formatAnalysisText(comprehensive)}
                  </ReactMarkdown>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Next Steps Section */}
      <div className="section-divider">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          צעדים הבאים מומלצים
        </h3>
        <div className="action-items grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="action-item action-priority-medium">
            <div className="action-checkbox"></div>
            <div className="action-content">
              <div className="action-title flex items-center mb-3">
                <span className="text-2xl mr-3">📝</span>
                <h4 className="font-medium text-white">השלם את השאלון</h4>
              </div>
              <p className="action-description text-sm text-gray-300">
                השלם שאלות נוספות כדי לקבל ניתוח עמוק יותר ולשפר את הציון הכולל.
              </p>
            </div>
          </div>

          <div className="action-item action-priority-high">
            <div className="action-checkbox"></div>
            <div className="action-content">
              <div className="action-title flex items-center mb-3">
                <span className="text-2xl mr-3">📊</span>
                <h4 className="font-medium text-white">חקור נתוני שוק</h4>
              </div>
              <p className="action-description text-sm text-gray-300">
                בדוק את הנתונים והתחזיות לגבי TAM/SAM/SOM שלך עם מקורות
                חיצוניים.
              </p>
            </div>
          </div>

          <div className="action-item action-priority-low">
            <div className="action-checkbox"></div>
            <div className="action-content">
              <div className="action-title flex items-center mb-3">
                <span className="text-2xl mr-3">👥</span>
                <h4 className="font-medium text-white">דבר עם לקוחות</h4>
              </div>
              <p className="action-description text-sm text-gray-300">
                בצע ראיונות Mom Test עם 5-10 לקוחות פוטנציאליים לתיקוף הרעיון.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {detailedResult && (
        <div className="executive-summary">
          <div className="executive-summary-title">📋 תקציר מנהלים</div>
          <div className="executive-summary-content">
            <div className="metric-box grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="metric-value">{scorePercentage}%</div>
                <div className="metric-label">ציון כולל</div>
              </div>
              <div className="text-center">
                <div className="metric-value">
                  {detailedResult.progressPercentage}%
                </div>
                <div className="metric-label">השלמת שאלון</div>
              </div>
              <div className="text-center">
                <div className="metric-value">
                  {Object.keys(detailedResult.results).length}
                </div>
                <div className="metric-label">מנועי AI</div>
              </div>
            </div>
            <p>
              המיזם שלך {getScoreMessage().toLowerCase()}. הניתוח מבוסס על מספר
              קריטריונים מרכזיים כולל יכולת הצוות, בהירות הבעיה, הבנת השוק ומודל
              עסקי.
            </p>
          </div>
        </div>
      )}

      {/* SWOT Analysis Visual */}
      {hasScoring && (
        <div className="section-divider">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            ניתוח SWOT מהיר
          </h3>
          <div className="swot-grid">
            <div className="swot-item swot-strengths">
              <div className="swot-title">💪 חוזקות</div>
              <ul className="text-sm text-gray-300">
                <li>צוות מנוסה ומחויב</li>
                <li>פתרון חדשני לבעיה קיימת</li>
                <li>הבנה טובה של השוק</li>
              </ul>
            </div>

            <div className="swot-item swot-weaknesses">
              <div className="swot-title">⚠️ חולשות</div>
              <ul className="text-sm text-gray-300">
                <li>צורך בהשקעה נוספת</li>
                <li>תלות בטכנולוגיה חיצונית</li>
                <li>מחסור בנתוני ולידציה</li>
              </ul>
            </div>

            <div className="swot-item swot-opportunities">
              <div className="swot-title">🚀 הזדמנויות</div>
              <ul className="text-sm text-gray-300">
                <li>שוק צומח במהירות</li>
                <li>פוטנציאל להרחבה גלובלית</li>
                <li>שותפויות אסטרטגיות</li>
              </ul>
            </div>

            <div className="swot-item swot-threats">
              <div className="swot-title">🔺 איומים</div>
              <ul className="text-sm text-gray-300">
                <li>כניסת מתחרים גדולים</li>
                <li>שינויים רגולטוריים</li>
                <li>תלות במשאבים חיצוניים</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Timeline for Next Steps */}
      <div className="section-divider">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          לוח זמנים מומלץ
        </h3>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-title">שבועיים הראשונים</div>
            <div className="timeline-date">ימים 1-14</div>
            <div className="timeline-content">
              השלמת השאלון, ביצוע ראיונות לקוחות ראשוניים, וגיבוש תכנית מפורטת.
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-title">חודש ראשון</div>
            <div className="timeline-date">ימים 15-30</div>
            <div className="timeline-content">
              פיתוח MVP, איסוף נתוני שוק נוספים, והתחלת תהליך גיוס השקעות.
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-title">רבעון ראשון</div>
            <div className="timeline-date">חודשים 2-3</div>
            <div className="timeline-content">
              השקה מוגבלת, בדיקת התאמה למוצר-שוק, ואיטרציות על הפתרון.
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      {hasScoring && (
        <div className="section-divider">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            הערכת סיכונים
          </h3>
          <div className="risk-matrix">
            <div className="risk-cell risk-low">סיכון נמוך</div>
            <div className="risk-cell risk-medium">סיכון בינוני</div>
            <div className="risk-cell risk-high">סיכון גבוה</div>
            <div className="risk-cell risk-medium">טכנולוגי</div>
            <div className="risk-cell risk-low">שוק</div>
            <div className="risk-cell risk-medium">תחרותי</div>
            <div className="risk-cell risk-high">מימון</div>
            <div className="risk-cell risk-medium">צוות</div>
            <div className="risk-cell risk-low">רגולטורי</div>
          </div>
        </div>
      )}

      {/* Recommendations Summary */}
      <div className="final-recommendation">
        <div className="final-title">🏆 המלצה סופית</div>
        <div className="recommendations">
          <div className="recommendation-item">
            <div className="recommendation-title">
              ⚡ צעדים מיידיים (7 ימים)
            </div>
            <p className="text-gray-300">
              השלם את השאלון המלא, בצע 3-5 ראיונות לקוחות, וזהה את החסמים
              העיקריים.
            </p>
          </div>

          <div className="recommendation-item">
            <div className="recommendation-title">
              🎯 יעדים לטווח בינוני (30 ימים)
            </div>
            <p className="text-gray-300">
              פתח MVP, אמת את התאמה למוצר-שוק, והכן מצגת למשקיעים פוטנציאליים.
            </p>
          </div>

          <div className="recommendation-item">
            <div className="recommendation-title">
              🌟 אסטרטגיה ארוכת טווח (90 ימים)
            </div>
            <p className="text-gray-300">
              השק גרסה ראשונה, גייס השקעה או השקעה ראשונית, והתחל לבנות צוות
              מורחב.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          ניתוח זה נוצר על ידי מערכת Methodian AI • זמן יצירה:{" "}
          {new Date().toLocaleString("he-IL")} •
          <span
            className={`tag ${
              scorePercentage >= 75
                ? "tag-high"
                : scorePercentage >= 50
                ? "tag-medium"
                : "tag-low"
            }`}
          >
            {scorePercentage >= 75
              ? "פוטנציאל גבוה"
              : scorePercentage >= 50
              ? "פוטנציאל בינוני"
              : "דורש שיפור"}
          </span>
        </p>
      </div>
    </div>
  );
}
