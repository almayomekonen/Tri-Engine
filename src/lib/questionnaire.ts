// השאלון המלא והמחודש - questionnaire-data.ts
export interface QuestionnaireQuestion {
  id: string;
  text: string;
  placeholder: string;
  example?: string;
  helpText?: string;
  required: boolean;
  type: "text" | "textarea" | "number" | "email";
  maxLength?: number;
  priority: "high" | "medium" | "low"; // עדיפות לסיווג השאלות
}

export interface QuestionnaireCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string; // צבע לקטגוריה
  weight: number;
  estimatedTime: number; // זמן משוער בדקות
  questions: QuestionnaireQuestion[];
}

export const FULL_QUESTIONNAIRE_DATA: QuestionnaireCategory[] = [
  {
    id: "A_personal_info",
    title: "מידע אישי בסיסי",
    description: "פרטים אישיים בסיסיים של המייסד",
    icon: "👤",
    color: "blue",
    weight: 5,
    estimatedTime: 3,
    questions: [
      {
        id: "A1",
        text: "שם מלא",
        placeholder: "הכנס את שמך המלא",
        required: true,
        type: "text",
        maxLength: 100,
        priority: "high",
      },
      {
        id: "A2",
        text: "כתובת אימייל",
        placeholder: "example@email.com",
        required: true,
        type: "email",
        maxLength: 100,
        priority: "high",
      },
      {
        id: "A3",
        text: "מספר טלפון",
        placeholder: "05X-XXXXXXX",
        required: true,
        type: "text",
        maxLength: 20,
        priority: "high",
      },
      {
        id: "A4",
        text: "באיזו עיר ומדינה אתה נמצא?",
        placeholder: "תל אביב, ישראל",
        required: true,
        type: "text",
        maxLength: 100,
        priority: "high",
      },
      {
        id: "A5",
        text: "האם אתה כרגע מועסק?",
        placeholder: "כן/לא",
        required: true,
        type: "text",
        maxLength: 10,
        priority: "high",
      },
      {
        id: "A6",
        text: "אם כן, איפה אתה עובד, וכמה אתה מרוויח חודשית (בקירוב)?",
        placeholder: "שם החברה, תפקיד, הכנסה חודשית בש״ח",
        required: false,
        type: "textarea",
        maxLength: 200,
        priority: "medium",
      },
    ],
  },
  {
    id: "B_commitment_resources",
    title: "מחויבות ומשאבים",
    description: "זמן, כסף ומשאבים שהמייסד יכול להשקיע",
    icon: "⏰",
    color: "purple",
    weight: 15,
    estimatedTime: 5,
    questions: [
      {
        id: "B1",
        text: "כמה שעות בשבוע אתה יכול להשקיע במיזם הזה באופן ריאלי?",
        placeholder: "מספר שעות בשבוע",
        required: true,
        type: "text",
        maxLength: 50,
        priority: "high",
      },
      {
        id: "B2",
        text: "כמה הון אתה אישית מוכן ויכול להשקיע לפני הפנייה למשקיעים חיצוניים?",
        placeholder: "סכום בש״ח",
        required: true,
        type: "text",
        maxLength: 100,
        priority: "high",
      },
      {
        id: "B3",
        text: "מה מניע אותך אישית לפתור את הבעיה הזו?",
        placeholder: "הסבר את המוטיבציה האישית שלך",
        required: true,
        type: "textarea",
        maxLength: 500,
        priority: "high",
      },
      {
        id: "B4",
        text: "האם חווית את הבעיה הזו בעצמך או ראית מישהו קרוב אליך חווה אותה?",
        placeholder: "כן/לא",
        required: true,
        type: "text",
        maxLength: 10,
        priority: "high",
      },
      {
        id: "B5",
        text: "אם כן, תאר את הרגע הכי כואב או מתסכל הקשור לזה.",
        placeholder: "תאר חוויה ספציפית",
        required: false,
        type: "textarea",
        maxLength: 500,
        priority: "medium",
      },
    ],
  },
  {
    id: "C_problem_solution",
    title: "הבעיה והפתרון",
    description: "הגדרת הבעיה והפתרון המוצע",
    icon: "💡",
    color: "green",
    weight: 20,
    estimatedTime: 8,
    questions: [
      {
        id: "C1",
        text: "מה הבעיה שאתה פותר?",
        placeholder: "תאר את הבעיה בפירוט",
        required: true,
        type: "textarea",
        maxLength: 500,
        priority: "high",
      },
      {
        id: "C2",
        text: "מי חווה את הבעיה הזו? תאר אותם בפירוט רב ככל האפשר.",
        placeholder: "תאר את קהל היעד המדויק",
        required: true,
        type: "textarea",
        maxLength: 500,
        priority: "high",
      },
      {
        id: "C3",
        text: "באיזו תדירות ועוצמה הם נתקלים בה?",
        placeholder: "תאר את תדירות וחומרת הבעיה",
        required: true,
        type: "textarea",
        maxLength: 300,
        priority: "high",
      },
      {
        id: "C4",
        text: "מה הפתרון שלך (סיכום של 1-2 משפטים)?",
        placeholder: "תאר את הפתרון בקצרה",
        required: true,
        type: "textarea",
        maxLength: 200,
        priority: "high",
      },
      {
        id: "C5",
        text: "איזה סוג של אנשים או ארגונים ישלמו על הפתרון הזה?",
        placeholder: "תאר את הלקוחות המשלמים",
        required: true,
        type: "textarea",
        maxLength: 300,
        priority: "high",
      },
    ],
  },
  {
    id: "D_user_validation",
    title: "ולידציה משתמשים",
    description: "מחקר וולידציה עם משתמשים פוטנציאליים",
    icon: "✅",
    color: "teal",
    weight: 20,
    estimatedTime: 10,
    questions: [
      {
        id: "D1",
        text: "האם דיברת עם משתמשים אמיתיים או לקוחות פוטנציאליים על הבעיה הזו?",
        placeholder: "כן/לא",
        required: true,
        type: "text",
        maxLength: 10,
        priority: "high",
      },
      {
        id: "D2",
        text: "אם כן, כמה שיחות ניהלת?",
        placeholder: "מספר השיחות",
        required: false,
        type: "text",
        maxLength: 50,
        priority: "high",
      },
      {
        id: "D3",
        text: "מה למדת מהשיחות האלה (ציטוטים ספציפיים, דפוסים, או הפתעות)?",
        placeholder: "תובנות מהשיחות",
        required: false,
        type: "textarea",
        maxLength: 1000,
        priority: "high",
      },
      {
        id: "D4",
        text: "האם מישהו מהשיחות עמד בסתירה להנחות שלך או גרם לך לשנות כיוון?",
        placeholder: "תאר שינויים בגישה",
        required: false,
        type: "textarea",
        maxLength: 500,
        priority: "medium",
      },
      {
        id: "D5",
        text: "האם ניסית לבצע מבחנים כלשהם (סקר, מודעה, אבטיפוס, דף נחיתה, MVP)?",
        placeholder: "תאר מבחנים שעשית",
        required: true,
        type: "textarea",
        maxLength: 500,
        priority: "high",
      },
      {
        id: "D6",
        text: "מה היו התוצאות של המבחנים האלה?",
        placeholder: "תוצאות המבחנים",
        required: false,
        type: "textarea",
        maxLength: 500,
        priority: "medium",
      },
      {
        id: "D7",
        text: "האם ניסית לבקש כסף? האם מישהו שילם או הראה כוונת קנייה רצינית?",
        placeholder: "תאר ניסיונות מכירה",
        required: true,
        type: "textarea",
        maxLength: 500,
        priority: "high",
      },
      {
        id: "D8",
        text: "האם אתה חושב שמשתמשים יתעצבנו אם הפתרון שלך יעלם מחר? למה?",
        placeholder: "הסבר מדוע המוצר חיוני",
        required: true,
        type: "textarea",
        maxLength: 300,
        priority: "medium",
      },
    ],
  },
  {
    id: "E_market_analysis",
    title: "ניתוח שוק",
    description: "הבנת השוק והתחרות",
    icon: "📊",
    color: "red",
    weight: 15,
    estimatedTime: 8,
    questions: [
      {
        id: "E1",
        text: "באיזו מדינה או אזור אתה מתכנן להשיק את המוצר ראשון?",
        placeholder: "מדינה/אזור ההשקה",
        required: true,
        type: "text",
        maxLength: 100,
        priority: "high",
      },
      {
        id: "E2",
        text: "לאילו מדינות או שווקים אתה מתכנן להיכנס מאוחר יותר?",
        placeholder: "רשימת שווקים עתידיים",
        required: false,
        type: "textarea",
        maxLength: 200,
        priority: "medium",
      },
      {
        id: "E3",
        text: "מי 3 המתחרים הישירים העיקריים שלך?",
        placeholder: "רשימת מתחרים ישירים",
        required: true,
        type: "textarea",
        maxLength: 300,
        priority: "high",
      },
      {
        id: "E4",
        text: "איך אנשים פותרים את הבעיה היום בלי הפתרון שלך?",
        placeholder: "פתרונות נוכחיים בשוק",
        required: true,
        type: "textarea",
        maxLength: 400,
        priority: "high",
      },
      {
        id: "E5",
        text: "מה עושה את הפתרון שלך טוב יותר, מהיר יותר, או זול יותר?",
        placeholder: "יתרונות תחרותיים",
        required: true,
        type: "textarea",
        maxLength: 400,
        priority: "high",
      },
      {
        id: "E6",
        text: "מה המודל העסקי המתוכנן שלך (איך אתה מרוויח כסף)?",
        placeholder: "תאר את מודל ההכנסות",
        required: true,
        type: "textarea",
        maxLength: 400,
        priority: "high",
      },
      {
        id: "E7",
        text: "איזה מחיר תגבה ולמה?",
        placeholder: "מבנה תמחור ונימוק",
        required: true,
        type: "textarea",
        maxLength: 300,
        priority: "high",
      },
      {
        id: "E8",
        text: "מה הTAM (שוק כולל) המוערך שלך?",
        placeholder: "הערכת גודל השוק הכולל",
        required: false,
        type: "text",
        maxLength: 200,
        priority: "medium",
      },
      {
        id: "E9",
        text: "מה הSAM (שוק נגיש) המוערך שלך?",
        placeholder: "הערכת השוק הנגיש",
        required: false,
        type: "text",
        maxLength: 200,
        priority: "medium",
      },
      {
        id: "E10",
        text: "מה הSOM (שוק בר השגה) המוערך שלך?",
        placeholder: "הערכת השוק בר ההשגה",
        required: false,
        type: "text",
        maxLength: 200,
        priority: "medium",
      },
      {
        id: "E11",
        text: "אילו מחסומים רגולטוריים או תאימות עשויים להשפיע על הכניסה לשוק שלך?",
        placeholder: "אתגרים רגולטוריים",
        required: false,
        type: "textarea",
        maxLength: 400,
        priority: "low",
      },
    ],
  },
  {
    id: "F_team_execution",
    title: "צוות וביצוע",
    description: "הצוות הנוכחי ויכולות הביצוע",
    icon: "👥",
    color: "yellow",
    weight: 15,
    estimatedTime: 8,
    questions: [
      {
        id: "F1",
        text: "האם יש לך כרגע צוות? אם כן, פרט את חברי הצוות.",
        placeholder: "רשימת חברי צוות נוכחיים",
        required: true,
        type: "textarea",
        maxLength: 400,
        priority: "high",
      },
      {
        id: "F2",
        text: "מהן הכישורים והתפקידים העיקריים שלהם?",
        placeholder: "תיאור כישורים ותפקידים",
        required: false,
        type: "textarea",
        maxLength: 400,
        priority: "high",
      },
      {
        id: "F3",
        text: "האם עבדתם יחד בעבר? באיזה הקשר?",
        placeholder: "היסטוריית עבודה משותפת",
        required: false,
        type: "textarea",
        maxLength: 300,
        priority: "medium",
      },
      {
        id: "F4",
        text: "אילו יכולות או כישורים חשובים חסרים בצוות הנוכחי שלכם?",
        placeholder: "חסרים בצוות",
        required: true,
        type: "textarea",
        maxLength: 300,
        priority: "high",
      },
      {
        id: "F5",
        text: "מה הדבר הכי מרשים שהצוות שלכם עשה (בנה, פתר, או השיג)?",
        placeholder: "הישג מרשים של הצוות",
        required: false,
        type: "textarea",
        maxLength: 400,
        priority: "medium",
      },
      {
        id: "F6",
        text: "כמה מהר אתה יכול לבנות MVP או להגיע ללקוח משלם ראשון?",
        placeholder: "זמן משוער להגעה ל-MVP",
        required: true,
        type: "text",
        maxLength: 100,
        priority: "high",
      },
      {
        id: "F7",
        text: "מהם 3 אבני הדרך הניתנות למדידה העיקריות שאתה מצפה להשיג ב-6 החודשים הקרובים?",
        placeholder: "אבני דרך ל-6 חודשים",
        required: true,
        type: "textarea",
        maxLength: 400,
        priority: "high",
      },
      {
        id: "F8",
        text: "מה החזון לטווח הארוך למיזם הזה?",
        placeholder: "חזון ארוך טווח",
        required: true,
        type: "textarea",
        maxLength: 500,
        priority: "medium",
      },
      {
        id: "F9",
        text: "מה יגרום לך לזנוח את הפרויקט?",
        placeholder: "תנאים לזניחת הפרויקט",
        required: false,
        type: "textarea",
        maxLength: 300,
        priority: "low",
      },
      {
        id: "F10",
        text: "איך נראה הצלחה עבורך ב-12 החודשים הקרובים?",
        placeholder: "הגדרת הצלחה לשנה",
        required: true,
        type: "textarea",
        maxLength: 400,
        priority: "high",
      },
      {
        id: "F11",
        text: "מה הכי מפחיד אותך במיזם הזה?",
        placeholder: "חששות עיקריים",
        required: false,
        type: "textarea",
        maxLength: 300,
        priority: "medium",
      },
    ],
  },
  {
    id: "G_experience",
    title: "ניסיון קודם",
    description: "רקע יזמי והישגים קודמים",
    icon: "🎯",
    color: "orange",
    weight: 10,
    estimatedTime: 5,
    questions: [
      {
        id: "G1",
        text: "האם עבדת על רעיונות סטארטאפ אחרים בעבר? מה קרה?",
        placeholder: "ניסיון יזמי קודם",
        required: false,
        type: "textarea",
        maxLength: 500,
        priority: "medium",
      },
      {
        id: "G2",
        text: "איזה כישור או ניסיון לא ברור מהעבר עושה אותך מתאים באופן יחיד לנצח בתחום הזה?",
        placeholder: "יתרון ייחודי מהרקע",
        required: false,
        type: "textarea",
        maxLength: 400,
        priority: "high",
      },
    ],
  },
];

// פונקציות עזר לחישוב ציונים
export function calculateMaxScore(selectedQuestions: string[]): number {
  const CATEGORY_WEIGHTS = {
    A: 5,
    B: 15,
    C: 20,
    D: 20,
    E: 15,
    F: 15,
    G: 10,
  };

  const selectedCategories = new Set(
    selectedQuestions.map((qId) => qId.charAt(0))
  );

  let maxScore = 0;
  selectedCategories.forEach((category) => {
    maxScore +=
      CATEGORY_WEIGHTS[category as keyof typeof CATEGORY_WEIGHTS] || 0;
  });

  return maxScore;
}

export function getQuestionById(
  questionId: string
): QuestionnaireQuestion | null {
  for (const category of FULL_QUESTIONNAIRE_DATA) {
    const question = category.questions.find((q) => q.id === questionId);
    if (question) return question;
  }
  return null;
}

export function getCategoryById(
  categoryId: string
): QuestionnaireCategory | null {
  return FULL_QUESTIONNAIRE_DATA.find((cat) => cat.id === categoryId) || null;
}
