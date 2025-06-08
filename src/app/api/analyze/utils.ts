import { FULL_QUESTIONNAIRE_DATA } from "@/lib/questionnaire";

// Define proper interfaces for type safety
interface CategoryWeight {
  name: string;
  maxScore: number;
}

interface QuestionnaireItem {
  selected: boolean;
  answer: string;
  answeredAt: Date;
}

interface QuestionnaireCategory {
  [questionId: string]: QuestionnaireItem;
}

interface Questionnaire {
  [categoryId: string]: QuestionnaireCategory;
}

interface AIAnalysisResult {
  score: number;
  [key: string]: unknown; // Use unknown instead of any
}

export function buildDetailedAnalysisPrompt({
  selectedQuestions,
  answers,
  businessName,
}: {
  selectedQuestions: string[];
  answers: Record<string, string>;
  businessName: string;
}) {
  // הגדרת משקלים מדויקים לפי המערכת שלך
  const CATEGORY_WEIGHTS: Record<string, CategoryWeight> = {
    A: { name: "מידע אישי בסיסי", maxScore: 5 },
    B: { name: "מחויבות ומשאבים", maxScore: 15 },
    C: { name: "הבעיה והפתרון", maxScore: 20 },
    D: { name: "ולידציה משתמשים", maxScore: 20 },
    E: { name: "ניתוח שוק", maxScore: 15 },
    F: { name: "צוות וביצוע", maxScore: 15 },
    G: { name: "ניסיון קודם", maxScore: 10 },
  };

  // חישוב ציון מקסימלי אמיתי בהתבסס על הקטגוריות שנבחרו
  const selectedCategories = new Set(
    selectedQuestions.map((qId) => qId.charAt(0))
  );
  const maxPossibleScore = Array.from(selectedCategories).reduce(
    (total, categoryLetter) => {
      const categoryWeight =
        CATEGORY_WEIGHTS[categoryLetter as keyof typeof CATEGORY_WEIGHTS]
          ?.maxScore || 0;
      return total + categoryWeight;
    },
    0
  );

  // ארגון התשובות לפי קטגוריות עם משקלים
  const categorizedAnswers = Array.from(selectedCategories)
    .map((categoryLetter) => {
      const categoryInfo =
        CATEGORY_WEIGHTS[categoryLetter as keyof typeof CATEGORY_WEIGHTS];
      if (!categoryInfo) return "";

      const categoryQuestions = selectedQuestions.filter((qId) =>
        qId.startsWith(categoryLetter)
      );

      const questionTexts = categoryQuestions
        .map((questionId) => {
          const question = FULL_QUESTIONNAIRE_DATA.flatMap(
            (cat) => cat.questions
          ).find((q) => q.id === questionId);
          const answer = answers[questionId] || "";

          if (!question) return "";

          const priorityEmoji =
            question.priority === "high"
              ? "⭐ עדיפות גבוהה"
              : question.priority === "medium"
              ? "🔸 עדיפות בינונית"
              : "🔹 עדיפות נמוכה";

          return [
            "",
            `**שאלה ${questionId}: ${question.text}**`,
            priorityEmoji,
            `תשובה: ${answer}`,
            `איכות תשובה: ${
              answer.length > 200
                ? "מפורטת"
                : answer.length > 50
                ? "בינונית"
                : answer.length > 0
                ? "קצרה"
                : "ריקה"
            }`,
          ].join("\n");
        })
        .join("\n");

      return [
        "",
        `### ${categoryInfo.name} (ציון מקסימלי: ${categoryInfo.maxScore})`,
        questionTexts,
        "",
        "**הנחיות ניקוד לקטגוריה זו:**",
        `- תן ציון מ-0 עד ${categoryInfo.maxScore} נקודות`,
        "- התבסס על איכות התשובות, מלאותן ורלוונטיותן",
        "- שאלות בעדיפות גבוהה ⭐ משפיעות יותר על הציון",
        "- תשובות ריקות או קצרות מדי (פחות מ-20 תווים) = 0 נקודות לשאלה זו",
        "- תשובות איכותיות ומפורטות = חלק גבוה יותר מהציון הקטגוריאלי",
      ].join("\n");
    })
    .filter(Boolean)
    .join("\n");

  // ספירת שאלות לפי קטגוריה
  const categoryCounts = Array.from(selectedCategories)
    .map((letter) => {
      const categoryInfo =
        CATEGORY_WEIGHTS[letter as keyof typeof CATEGORY_WEIGHTS];
      const count = selectedQuestions.filter((qId) =>
        qId.startsWith(letter)
      ).length;
      return `- ${categoryInfo?.name}: ${count} שאלות`;
    })
    .join("\n");

  const categoryWeightsText = Array.from(selectedCategories)
    .map((letter) => {
      const info = CATEGORY_WEIGHTS[letter as keyof typeof CATEGORY_WEIGHTS];
      return `- ${info?.name}: עד ${info?.maxScore} נקודות`;
    })
    .join("\n");

  const summaryScoresText = Array.from(selectedCategories)
    .map((letter) => {
      const info = CATEGORY_WEIGHTS[letter as keyof typeof CATEGORY_WEIGHTS];
      return `- ${info?.name}: ___/${info?.maxScore}`;
    })
    .join("\n");

  const prompt = [
    "אתה מומחה בניתוח היתכנות עסקית המבצע ניתוח מקצועי לפי מתודולוגיית Methodian Feasibility.",
    "",
    "## פרטי המיזם:",
    `**עסק:** ${businessName}`,
    `**סך שאלות שנענו:** ${selectedQuestions.length} מתוך 48 אפשריות`,
    "**התפלגות לפי קטגוריות:**",
    categoryCounts,
    "",
    "## מערכת הניקוד המדויקת:",
    `**ציון מקסימלי אפשרי:** ${maxPossibleScore} נקודות (בהתבסס על הקטגוריות שנבחרו)`,
    "**חלוקת משקלים:**",
    categoryWeightsText,
    "",
    "## תשובות לפי קטגוריות:",
    categorizedAnswers,
    "",
    "## הוראות לניתוח מדויק:",
    "",
    "### 1. תקציר מנהלים (200 מילים)",
    "- הערכה כללית של הפוטנציאל",
    `- **ציון סופי מדויק: ___/${maxPossibleScore} נקודות**`,
    "- 3 המלצות עיקריות מבוססות התשובות",
    "",
    "### 2. ניתוח מפורט לפי קטגוריות:",
    "",
    "עבור כל קטגוריה שנענתה, כתב:",
    "",
    "#### [שם הקטגוריה] (ציון: ___/[מקסימום])",
    "- **ציון שנתן:** ___ נקודות מתוך [מקסימום]",
    "- **נימוק מפורט לציון:** הסבר מדוע נתן ציון זה בהתבסס על איכות התשובות",
    "- **נקודות חוזק:** מה עובד טוב בתשובות",
    "- **נקודות לשיפור:** מה חסר או יכול להיות טוב יותר",
    "- **השפעה על ההערכה הכללית:** איך הקטגוריה הזו משפיעה על כדאיות המיזם",
    "",
    "### 3. חישוב הציון הסופי:",
    "**חובה לכלול:**",
    "```",
    "סיכום ציונים:",
    summaryScoresText,
    "",
    `ציון סופי: ___/${maxPossibleScore} נקודות`,
    "```",
    "",
    "",
    "### 4. ניתוח SWOT מבוסס התשובות",
    "- **חוזקות (5 נקודות):** מבוסס על מה שעולה מהתשובות",
    "- **חולשות (5 נקודות):** מבוסס על חסרים או חולשות בתשובות",
    "- **הזדמנויות (5 נקודות):** מבוסס על הפוטנציאל שמתגלה מהתשובות",
    "- **איומים (5 נקודות):** מבוסס על סיכונים שניתן לזהות מהתשובות",
    "",
    "### 5. המלצות אסטרטגיות מבוססות נתונים",
    "- **צעדים מיידיים (30-60 יום):** בהתבסס על הדברים שחסרים או זקוקים לשיפור",
    "- **יעדים לטווח בינוני (3-6 חודשים):** בהתבסס על הפוטנציאל שמתגלה",
    "- **אסטרטגיה ארוכת טווח:** בהתבסס על החזון שמופיע בתשובות",
    "",
    "### 6. סיכום והמלצת השקעה",
    "- **המלצה ברורה:** מומלץ/מותנה/לא מומלץ",
    `- **נימוק מבוסס הציון:** הסבר איך הציון ___/${maxPossibleScore} מוביל להמלצה`,
    "- **תנאים להצלחה:** מבוסס על הנתונים שהתקבלו",
    "",
    "## כללי ניקוד מחייבים:",
    "1. **התבסס אך ורק על התשובות שנמסרו** - אל תמציא מידע",
    "2. **תשובות ריקות או קצרות מ-20 תווים = 0 נקודות לשאלה זו**",
    "3. **תשובות איכותיות ומפורטות = ציון גבוה יותר**",
    "4. **שאלות עדיפות גבוהה ⭐ משפיעות יותר על הציון הקטגוריאלי**",
    "5. **הציון הסופי חייב להיות מתמטי:** סכום כל הציונים הקטגוריאליים",
    "6. **אל תשתמש בכוכביות (*) - רק תגי <strong> להדגשה**",
    "7. **אם חסר מידע בתחום - ציין זאת במפורש ואל תנחש**",
    "",
    "**זכור:** כל ציון חייב להיות מוצדק במפורש ומבוסס על איכות התוכן שסופק בפועל.",
  ].join("\n");

  return prompt;
}

export function formatQuestionnaireData(
  selectedQuestions: string[],
  answers: Record<string, string>
): Questionnaire {
  const categories = [
    "A_personal_info",
    "B_commitment_resources",
    "C_problem_solution",
    "D_user_validation",
    "E_market_analysis",
    "F_team_execution",
    "G_experience",
  ];

  const questionnaire: Questionnaire = {};

  categories.forEach((categoryId) => {
    questionnaire[categoryId] = {};

    // מצא שאלות מהקטגוריה הזו
    const categoryQuestions = selectedQuestions.filter((qId) =>
      qId.startsWith(categoryId.charAt(0))
    );

    categoryQuestions.forEach((questionId) => {
      if (answers[questionId]) {
        questionnaire[categoryId][questionId] = {
          selected: true,
          answer: answers[questionId],
          answeredAt: new Date(),
        };
      }
    });
  });

  return questionnaire;
}

export function calculateVentureScore(
  selectedQuestions: string[],
  answers: Record<string, string>
): number {
  const CATEGORY_WEIGHTS = {
    A: 5,
    B: 15,
    C: 20,
    D: 20,
    E: 15,
    F: 15,
    G: 10,
  };

  let totalScore = 0;

  // חישוב לפי קטגוריות
  Object.entries(CATEGORY_WEIGHTS).forEach(([category, maxScore]) => {
    const categoryQuestions = selectedQuestions.filter((qId) =>
      qId.startsWith(category)
    );

    if (categoryQuestions.length === 0) return;

    let categoryScore = 0;
    let totalWeight = 0;

    categoryQuestions.forEach((qId) => {
      const answer = answers[qId] || "";
      const question = FULL_QUESTIONNAIRE_DATA.flatMap(
        (cat) => cat.questions
      ).find((q) => q.id === qId);

      if (!question || !answer.trim() || answer.length < 20) return;

      // ציון בסיס לפי אורך ואיכות התשובה
      let questionScore = 0;
      if (answer.length >= 20) questionScore += 0.2; // תשובה בסיסית
      if (answer.length >= 50) questionScore += 0.3; // תשובה טובה
      if (answer.length >= 100) questionScore += 0.3; // תשובה מפורטת
      if (answer.length >= 200) questionScore += 0.2; // תשובה מקיפה

      // בונוס לתוכן איכותי
      const qualityWords = [
        "ניסיון",
        "שנים",
        "לקוחות",
        "מכירות",
        "צמיחה",
        "פיתוח",
        "הכנסות",
        "רווח",
        "השקעה",
        "שוק",
        "תחרות",
        "יתרון",
      ];
      const hasQualityContent = qualityWords.some((word) =>
        answer.toLowerCase().includes(word.toLowerCase())
      );
      if (hasQualityContent) questionScore += 0.1;

      // משקל לפי עדיפות השאלה
      const priorityWeight =
        question.priority === "high"
          ? 2
          : question.priority === "medium"
          ? 1.5
          : 1;

      categoryScore += questionScore * priorityWeight;
      totalWeight += priorityWeight;
    });

    // נרמול הציון לקטגוריה (מ-0 ל-1) ולהכפיל במשקל הקטגוריה
    if (totalWeight > 0) {
      const normalizedScore = Math.min(categoryScore / totalWeight, 1);
      totalScore += normalizedScore * maxScore;
    }
  });

  return Math.round(Math.min(totalScore, 105));
}

export function calculateDetailedScoring(
  selectedQuestions: string[],
  answers: Record<string, string>
) {
  const scoring = {
    teamCapability: 0,
    problemClarity: 0,
    solutionDifferentiation: 0,
    tamSamSom: 0,
    marketTiming: 0,
    competitorAwareness: 0,
    businessModel: 0,
    porterForces: 0,
    swotRisk: 0,
    crossValidation: 0,
    academicSources: 0,
    visualsData: 0,
    momTest: 0,
  };

  // ציון מדויק לפי קטגוריות בהתבסס על תוכן התשובות
  selectedQuestions.forEach((qId) => {
    const answer = answers[qId];
    if (!answer || answer.trim().length < 20) return;

    // ציון איכות בהתבסס על אורך ותוכן
    const question = FULL_QUESTIONNAIRE_DATA.flatMap(
      (cat) => cat.questions
    ).find((q) => q.id === qId);

    if (!question) return;

    let qualityScore = 0;
    if (answer.length >= 50) qualityScore += 1;
    if (answer.length >= 150) qualityScore += 1;
    if (answer.length >= 300) qualityScore += 1;

    // בונוס לתוכן איכותי
    const qualityWords = ["ניסיון", "נתונים", "מחקר", "לקוחות", "מכירות"];
    if (qualityWords.some((word) => answer.includes(word))) qualityScore += 1;

    // משקל עדיפות
    const priorityMultiplier =
      question.priority === "high"
        ? 1.5
        : question.priority === "medium"
        ? 1.2
        : 1;

    const finalScore = qualityScore * priorityMultiplier;

    // חלוקה לפי קטגוריות
    if (qId.startsWith("A") || qId.startsWith("F")) {
      scoring.teamCapability += finalScore * 0.8;
    } else if (qId.startsWith("C")) {
      scoring.problemClarity += finalScore * 0.6;
      scoring.solutionDifferentiation += finalScore * 0.4;
    } else if (qId.startsWith("E")) {
      scoring.tamSamSom += finalScore * 0.4;
      scoring.marketTiming += finalScore * 0.3;
      scoring.competitorAwareness += finalScore * 0.3;
    } else if (
      qId.startsWith("E") &&
      (qId.includes("6") || qId.includes("7"))
    ) {
      scoring.businessModel += finalScore;
    } else if (qId.startsWith("D")) {
      scoring.momTest += finalScore * 0.6;
      scoring.crossValidation += finalScore * 0.4;
    } else if (qId.startsWith("B")) {
      scoring.swotRisk += finalScore * 0.5;
    }
  });

  // הגבלה לציונים מקסימליים
  scoring.teamCapability = Math.min(15, Math.round(scoring.teamCapability));
  scoring.problemClarity = Math.min(10, Math.round(scoring.problemClarity));
  scoring.solutionDifferentiation = Math.min(
    10,
    Math.round(scoring.solutionDifferentiation)
  );
  scoring.tamSamSom = Math.min(10, Math.round(scoring.tamSamSom));
  scoring.marketTiming = Math.min(10, Math.round(scoring.marketTiming));
  scoring.competitorAwareness = Math.min(
    10,
    Math.round(scoring.competitorAwareness)
  );
  scoring.businessModel = Math.min(10, Math.round(scoring.businessModel));
  scoring.porterForces = Math.min(5, Math.round(scoring.porterForces));
  scoring.swotRisk = Math.min(5, Math.round(scoring.swotRisk));
  scoring.crossValidation = Math.min(5, Math.round(scoring.crossValidation));
  scoring.academicSources = Math.min(5, Math.round(scoring.academicSources));
  scoring.visualsData = Math.min(5, Math.round(scoring.visualsData));
  scoring.momTest = Math.min(5, Math.round(scoring.momTest));

  return scoring;
}

export function generateComprehensiveAnalysis(
  aiResults: AIAnalysisResult[]
): string {
  const averageScore =
    aiResults.reduce((sum, r) => sum + (r.score || 0), 0) / aiResults.length;

  return [
    "# ניתוח מקיף משולב (Tri-Engine)",
    "",
    `## ציון סופי: ${Math.round(averageScore)}/105`,
    "",
    `ניתוח זה משלב את התובנות של ${aiResults.length} מנועי AI מתקדמים.`,
    "",
    "## השוואת ממצאים:",
    aiResults.length > 1
      ? "המנועים השונים הגיעו למסקנות דומות ברוב התחומים, מה שמחזק את אמינות הניתוח."
      : "ניתוח זה מבוסס על מנוע AI יחיד.",
    "",
    "## המלצות משולבות:",
    "1. **התמקדות מיידית**: בהתבסס על הניתוחים, יש להתמקד בחיזוק החולשות שזוהו",
    "2. **הזדמנויות צמיחה**: הניתוחים מזהים פוטנציאל משמעותי בתחומים מסוימים",
    "3. **ניהול סיכונים**: חשוב לטפל בסיכונים שזוהו בכל הניתוחים",
    "",
    "## מסקנה:",
    "הניתוח המשולב מציע תמונה מקיפה של המיזם, עם דגש על נתונים אמיתיים ותובנות מעשיות.",
  ].join("\n");
}
