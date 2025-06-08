import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Circle,
  Info,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Target,
  Star,
  Zap,
  BookOpen,
  TrendingUp,
  Copy,
  Eye,
  EyeOff,
  Lightbulb,
  Save,
  Play,
  FastForward,
  TestTube,
  Trash2,
} from "lucide-react";
import { FULL_QUESTIONNAIRE_DATA } from "@/lib/questionnaire";
import { loadDemoAnswers, loadEssentialDemoAnswers } from "@/lib/demo-answers";
import type { QuestionnaireFormData } from "@/types";

interface QuestionnaireData {
  businessName: string;
  email: string;
  phone: string;
  city: string;
  selectedQuestions: string[];
  answers: Record<string, string>;
  autoSave: boolean;
}

interface PerfectQuestionnaireFormProps {
  onSubmit: (formData: QuestionnaireFormData) => Promise<void>;
  loading: boolean;
}

export default function PerfectQuestionnaireForm({
  onSubmit,
  loading,
}: PerfectQuestionnaireFormProps) {
  const [formData, setFormData] = useState<QuestionnaireData>({
    businessName: "",
    email: "",
    phone: "",
    city: "",
    selectedQuestions: [],
    answers: {},
    autoSave: true,
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["A_personal_info"])
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [showExamples, setShowExamples] = useState<Record<string, boolean>>({});
  const [smartMode, setSmartMode] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (formData.autoSave && formData.businessName) {
      const saveTimeout = setTimeout(() => {
        localStorage.setItem("methodian_draft", JSON.stringify(formData));
        setLastSaved(new Date());
      }, 2000);
      return () => clearTimeout(saveTimeout);
    }
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem("methodian_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, []);

  // חישוב התקדמות וזמן משוער
  useEffect(() => {
    const totalQuestions = FULL_QUESTIONNAIRE_DATA.reduce(
      (sum, cat) => sum + cat.questions.length,
      0
    );
    const completedAnswers = Object.keys(formData.answers).filter(
      (key) =>
        formData.selectedQuestions.includes(key) &&
        formData.answers[key]?.trim()
    ).length;

    setProgress(Math.round((completedAnswers / totalQuestions) * 100));

    // חישוב זמן משוער
    const selectedCategoriesTime = FULL_QUESTIONNAIRE_DATA.filter((cat) =>
      formData.selectedQuestions.some((qId) => qId.startsWith(cat.id.charAt(0)))
    ).reduce((sum, cat) => sum + cat.estimatedTime, 0);

    setEstimatedTime(selectedCategoriesTime);
  }, [formData.selectedQuestions, formData.answers]);

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "border-blue-500 bg-blue-500/10 text-blue-400",
      purple: "border-purple-500 bg-purple-500/10 text-purple-400",
      green: "border-green-500 bg-green-500/10 text-green-400",
      red: "border-red-500 bg-red-500/10 text-red-400",
      yellow: "border-yellow-500 bg-yellow-500/10 text-yellow-400",
      orange: "border-orange-500 bg-orange-500/10 text-orange-400",
      teal: "border-teal-500 bg-teal-500/10 text-teal-400",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <Star className="w-4 h-4 text-yellow-400" />;
      case "medium":
        return <Target className="w-4 h-4 text-blue-400" />;
      case "low":
        return <BookOpen className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleQuestion = (questionId: string) => {
    const newSelected = [...formData.selectedQuestions];
    if (newSelected.includes(questionId)) {
      const index = newSelected.indexOf(questionId);
      newSelected.splice(index, 1);
      const newAnswers = { ...formData.answers };
      delete newAnswers[questionId];
      setFormData({
        ...formData,
        selectedQuestions: newSelected,
        answers: newAnswers,
      });
    } else {
      newSelected.push(questionId);
      setFormData({
        ...formData,
        selectedQuestions: newSelected,
      });
    }
  };

  const updateAnswer = (questionId: string, answer: string) => {
    setFormData({
      ...formData,
      answers: {
        ...formData.answers,
        [questionId]: answer,
      },
    });
  };

  const updateBasicInfo = (
    field: keyof Omit<
      QuestionnaireData,
      "selectedQuestions" | "answers" | "autoSave"
    >,
    value: string
  ) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const getCategoryProgress = (categoryId: string) => {
    const category = FULL_QUESTIONNAIRE_DATA.find(
      (cat) => cat.id === categoryId
    );
    if (!category) return 0;

    const categoryQuestions = category.questions.map((q) => q.id);
    const answeredQuestions = categoryQuestions.filter(
      (qId) =>
        formData.selectedQuestions.includes(qId) &&
        formData.answers[qId]?.trim()
    );

    return Math.round(
      (answeredQuestions.length / category.questions.length) * 100
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "שם העסק חובה";
    }

    if (!formData.email.trim()) {
      newErrors.email = "אימייל חובה";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "אימייל לא תקין";
    }

    if (formData.selectedQuestions.length === 0) {
      newErrors.questions = "יש לבחור לפחות שאלה אחת";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit({
        businessName: formData.businessName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        selectedQuestions: formData.selectedQuestions,
        answers: formData.answers,
        engines: ["chatgpt", "gemini"],
      });
      // Clear draft after successful submission
      localStorage.removeItem("methodian_draft");
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const toggleSmartMode = () => {
    setSmartMode(!smartMode);
    if (!smartMode) {
      // במצב חכם - בחר שאלות מומלצות
      const recommendedQuestions = FULL_QUESTIONNAIRE_DATA.flatMap(
        (cat) => cat.questions
      )
        .filter((q) => q.priority === "high")
        .map((q) => q.id);

      setFormData({
        ...formData,
        selectedQuestions: [
          ...new Set([...formData.selectedQuestions, ...recommendedQuestions]),
        ],
      });
    }
  };

  const copyExample = (questionId: string, example: string) => {
    updateAnswer(questionId, example);
    navigator.clipboard.writeText(example);
  };

  const toggleExample = (questionId: string) => {
    setShowExamples((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const selectAllInCategory = (categoryId: string) => {
    const category = FULL_QUESTIONNAIRE_DATA.find(
      (cat) => cat.id === categoryId
    );
    if (!category) return;

    const categoryQuestionIds = category.questions.map((q) => q.id);
    const newSelected = [
      ...new Set([...formData.selectedQuestions, ...categoryQuestionIds]),
    ];

    setFormData({
      ...formData,
      selectedQuestions: newSelected,
    });
  };

  // *** פונקציות טעינת תשובות דמה לטסטים ***
  const handleLoadFullDemoAnswers = () => {
    const demoData = loadDemoAnswers();
    setFormData(demoData);
    // פתח את כל הקטגוריות
    setExpandedCategories(
      new Set(FULL_QUESTIONNAIRE_DATA.map((cat) => cat.id))
    );
  };

  const handleLoadEssentialDemoAnswers = () => {
    const demoData = loadEssentialDemoAnswers();
    setFormData(demoData);
    // פתח את כל הקטגוריות
    setExpandedCategories(
      new Set(FULL_QUESTIONNAIRE_DATA.map((cat) => cat.id))
    );
  };

  const clearAllData = () => {
    setFormData({
      businessName: "",
      email: "",
      phone: "",
      city: "",
      selectedQuestions: [],
      answers: {},
      autoSave: true,
    });
    setExpandedCategories(new Set(["A_personal_info"]));
    localStorage.removeItem("methodian_draft");
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-2xl space-y-6">
      {/* Header מעודכן */}
      <div className="text-center border-b border-gray-700 pb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
            שאלון Methodian המתקדם
          </h2>
        </div>

        <p className="text-gray-300 text-lg mb-4">
          ניתוח היתכנות מקצועי על בסיס{" "}
          {FULL_QUESTIONNAIRE_DATA.reduce(
            (sum, cat) => sum + cat.questions.length,
            0
          )}{" "}
          שאלות איכותיות
        </p>

        {/* Progress Bar מעודכן */}
        <div className="relative mb-4">
          <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-400">
              התקדמות: {progress}% • {formData.selectedQuestions.length}/
              {FULL_QUESTIONNAIRE_DATA.reduce(
                (sum, cat) => sum + cat.questions.length,
                0
              )}{" "}
              שאלות
            </p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">
                זמן משוער: {estimatedTime} דקות
              </span>
            </div>
          </div>
        </div>

        {/* Auto-save status */}
        {formData.autoSave && lastSaved && (
          <div className="flex items-center justify-center gap-2 text-xs text-green-400">
            <Save className="w-3 h-3" />
            נשמר אוטומטית ב-{lastSaved.toLocaleTimeString("he-IL")}
          </div>
        )}

        {/* Smart Mode Toggle */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={toggleSmartMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              smartMode
                ? "bg-green-500/20 border border-green-500 text-green-400"
                : "bg-gray-700 border border-gray-600 text-gray-300 hover:border-gray-500"
            }`}
          >
            <Zap
              className={`w-4 h-4 ${
                smartMode ? "text-green-400" : "text-gray-400"
              }`}
            />
            מצב חכם - שאלות מומלצות
          </button>
          {smartMode && (
            <div className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
              נבחרו שאלות בעדיפות גבוהה
            </div>
          )}
        </div>

        {/* Demo Data Controls - לפיתוח ובדיקות */}
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-4">
          <h4 className="text-orange-400 font-medium mb-3 flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            🧪 כלי פיתוח ובדיקות
          </h4>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={handleLoadFullDemoAnswers}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
            >
              <Play className="w-4 h-4" />
              מלא תשובות מלאות (
              {FULL_QUESTIONNAIRE_DATA.reduce(
                (sum, cat) => sum + cat.questions.length,
                0
              )}{" "}
              שאלות)
            </button>
            <button
              onClick={handleLoadEssentialDemoAnswers}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-sm"
            >
              <FastForward className="w-4 h-4" />
              מלא תשובות חיוניות (26 שאלות)
            </button>
            <button
              onClick={clearAllData}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              נקה הכל
            </button>
          </div>
          <p className="text-xs text-orange-300 mt-2 text-center">
            כפתורים אלה מזינים תשובות אוטומטיות לטסטים מהירים ופיתוח
          </p>
        </div>
      </div>

      {/* User Guidance מעודכן */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-5 rounded-xl border border-blue-500/30 mb-6">
        <h3 className="font-bold text-blue-400 mb-3 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          מדריך למילוי מושלם
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>שאלות בעדיפות גבוהה חשובות ביותר</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Target className="w-4 h-4 text-blue-400" />
              <span>ענה בפירוט עם דוגמאות ספציפיות</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Clock className="w-4 h-4 text-green-400" />
              <span>כל קטגוריה מציינת זמן משוער</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Lightbulb className="w-4 h-4 text-purple-400" />
              <span>השתמש בדוגמאות כהשראה או העתק אותן</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-6 shadow-lg border border-gray-600">
          <h3 className="text-xl font-bold mb-5 flex items-center text-white">
            <div className="p-2 bg-blue-500 rounded-lg mr-3">
              <User className="w-5 h-5 text-white" />
            </div>
            פרטים בסיסיים
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center">
                שם העסק / המיזם *
                <Star className="w-3 h-3 text-red-400 mr-1" />
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) =>
                    updateBasicInfo("businessName", e.target.value)
                  }
                  className={`w-full p-4 pl-12 border rounded-xl bg-gray-900 text-white transition-all focus:ring-2 focus:ring-blue-500 ${
                    errors.businessName
                      ? "border-red-500"
                      : "border-gray-600 focus:border-blue-500"
                  }`}
                  placeholder="מה שם העסק או הרעיון שלך?"
                />
              </div>
              {errors.businessName && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  {errors.businessName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center">
                אימייל ליצירת קשר *
                <Star className="w-3 h-3 text-red-400 mr-1" />
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateBasicInfo("email", e.target.value)}
                  className={`w-full p-4 pl-12 border rounded-xl bg-gray-900 text-white transition-all focus:ring-2 focus:ring-blue-500 ${
                    errors.email
                      ? "border-red-500"
                      : "border-gray-600 focus:border-blue-500"
                  }`}
                  placeholder="האימייל שלך"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                טלפון (אופציונלי)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateBasicInfo("phone", e.target.value)}
                  className="w-full p-4 pl-12 border border-gray-600 rounded-xl bg-gray-900 text-white transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="מספר טלפון"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                עיר (אופציונלי)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateBasicInfo("city", e.target.value)}
                  className="w-full p-4 pl-12 border border-gray-600 rounded-xl bg-gray-900 text-white transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="באיזו עיר העסק ממוקם?"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Questions by Category */}
        {FULL_QUESTIONNAIRE_DATA.map((category) => {
          const categoryProgress = getCategoryProgress(category.id);
          const isExpanded = expandedCategories.has(category.id);
          const colorClasses = getColorClasses(category.color);

          return (
            <div
              key={category.id}
              className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-600"
            >
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`w-full p-6 flex items-center justify-between hover:bg-gray-600/50 transition-all ${
                  isExpanded ? colorClasses : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl p-3 bg-gray-800 rounded-xl">
                    {category.icon}
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {category.title}
                    </h3>
                    <p className="text-sm text-gray-300 mb-2">
                      {category.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        משקל: {category.weight} נקודות
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {category.estimatedTime} דקות
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {isExpanded && (
                    <div // 🎯 שנה מ-button ל-div
                      onClick={(e) => {
                        e.stopPropagation();
                        selectAllInCategory(category.id);
                      }}
                      className="text-xs px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors cursor-pointer" // 🎯 הוסף cursor-pointer
                    >
                      בחר הכל
                    </div>
                  )}
                  <div className="text-center">
                    <div
                      className={`text-lg font-bold ${
                        categoryProgress > 0
                          ? "text-green-400"
                          : "text-gray-400"
                      }`}
                    >
                      {categoryProgress}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {
                        category.questions.filter(
                          (q) =>
                            formData.selectedQuestions.includes(q.id) &&
                            formData.answers[q.id]?.trim()
                        ).length
                      }
                      /{category.questions.length}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Category Questions */}
              {isExpanded && (
                <div className="border-t border-gray-600 p-6 space-y-6 bg-gray-800/50">
                  {category.questions.map((question) => {
                    const isSelected = formData.selectedQuestions.includes(
                      question.id
                    );
                    const answer = formData.answers[question.id] || "";
                    const hasError = errors[question.id];
                    const showExample = showExamples[question.id];

                    return (
                      <div
                        key={question.id}
                        className={`border-2 rounded-xl p-5 transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/5 shadow-lg"
                            : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                        }`}
                      >
                        {/* Question Header */}
                        <div className="flex items-start gap-4">
                          <div
                            className="mt-1 cursor-pointer"
                            onClick={() => toggleQuestion(question.id)}
                          >
                            {isSelected ? (
                              <CheckCircle className="w-6 h-6 text-blue-400" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-400 hover:text-blue-400 transition-colors" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <p
                                className="font-semibold text-white text-lg flex items-center gap-2 cursor-pointer"
                                onClick={() => toggleQuestion(question.id)}
                              >
                                {question.text}
                                {question.required && (
                                  <Star className="w-4 h-4 text-red-400" />
                                )}
                                {getPriorityIcon(question.priority)}
                              </p>
                              <div className="flex items-center gap-2">
                                {question.example && (
                                  <button
                                    onClick={() => toggleExample(question.id)}
                                    className="p-1 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 transition-colors"
                                    title="הצג/הסתר דוגמה"
                                  >
                                    {showExample ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Example Display */}
                            {question.example && showExample && (
                              <div className="mt-3 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs text-purple-300 flex items-center gap-1">
                                    <Lightbulb className="w-3 h-3" />
                                    דוגמה להשראה:
                                  </p>
                                  <button
                                    onClick={() =>
                                      copyExample(
                                        question.id,
                                        question.example!
                                      )
                                    }
                                    className="text-xs px-2 py-1 bg-purple-500/20 border border-purple-500/50 rounded text-purple-400 hover:bg-purple-500/30 transition-colors flex items-center gap-1"
                                  >
                                    <Copy className="w-3 h-3" />
                                    העתק
                                  </button>
                                </div>
                                <p className="text-sm text-purple-100">
                                  {question.example}
                                </p>
                              </div>
                            )}

                            {question.helpText && (
                              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {question.helpText}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Answer Input */}
                        {isSelected && (
                          <div className="mt-5 pr-10">
                            {question.type === "textarea" ? (
                              <textarea
                                value={answer}
                                onChange={(e) =>
                                  updateAnswer(question.id, e.target.value)
                                }
                                placeholder={question.placeholder}
                                className={`w-full p-4 border rounded-xl bg-gray-900 text-white resize-none transition-all focus:ring-2 focus:ring-blue-500 ${
                                  hasError
                                    ? "border-red-500"
                                    : "border-gray-600 focus:border-blue-500"
                                }`}
                                rows={5}
                                maxLength={question.maxLength}
                              />
                            ) : (
                              <input
                                type={question.type}
                                value={answer}
                                onChange={(e) =>
                                  updateAnswer(question.id, e.target.value)
                                }
                                placeholder={question.placeholder}
                                className={`w-full p-4 border rounded-xl bg-gray-900 text-white transition-all focus:ring-2 focus:ring-blue-500 ${
                                  hasError
                                    ? "border-red-500"
                                    : "border-gray-600 focus:border-blue-500"
                                }`}
                                maxLength={question.maxLength}
                              />
                            )}
                            <div className="flex justify-between items-center mt-2">
                              {hasError && (
                                <p className="text-red-400 text-sm flex items-center gap-1">
                                  <Info className="w-4 h-4" />
                                  {hasError}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mr-auto">
                                {answer.length}/{question.maxLength || 500}{" "}
                                תווים
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit Button */}
        <div className="pt-6">
          {errors.questions && (
            <p className="text-red-400 text-sm mb-4 text-center flex items-center justify-center gap-2">
              <Info className="w-4 h-4" />
              {errors.questions}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || formData.selectedQuestions.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white p-5 rounded-xl font-bold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-green-700 disabled:opacity-50 transition-all transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin h-6 w-6 border-t-2 border-white rounded-full"></div>
                מנתח את המיזם שלך באמצעות Tri-Engine...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Zap className="w-6 h-6" />
                התחל ניתוח מקיף ({formData.selectedQuestions.length} שאלות
                נבחרו)
              </div>
            )}
          </button>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              🤖 הניתוח יכלול ChatGPT + Gemini + ניתוח משולב
            </p>
            <p className="text-xs text-gray-500 mt-1">
              משך זמן משוער: 2-3 דקות • ציון מקצועי 0-105 נקודות
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
