import { NextResponse } from "next/server";
import { Venture } from "@/lib/mongodb";
import { LegacyFormData, QuestionnaireRequest } from "./types";
import { runChatGPTAnalysis, runGeminiAnalysis } from "./ai-services";
import {
  formatQuestionnaireData,
  buildDetailedAnalysisPrompt,
  calculateVentureScore,
  calculateDetailedScoring,
  generateComprehensiveAnalysis,
} from "./utils";
import { calculateMaxScore } from "@/lib/questionnaire";

export async function handleLegacyRequest(body: LegacyFormData) {
  const {
    businessName,
    problem,
    solution,
    targetMarket,
    engine = "both",
  } = body;

  const ventureData = {
    client_id: `LEGACY_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    basicInfo: {
      businessName,
      email: "legacy@methodian.com",
      phone: "",
      city: "",
    },
    questionnaire: {},
    responses: {
      totalSelected: 3,
      totalAvailable: 48,
      completionPercentage: Math.round((3 / 48) * 100),
      lastUpdated: new Date(),
    },
    status: "submitted" as const,
  };

  try {
    console.log("Formatting legacy questionnaire data...");
    ventureData.questionnaire = {
      A_personal_info: {},
      B_commitment_resources: {
        legacy_problem: {
          selected: true,
          answer: problem,
          answeredAt: new Date(),
        },
      },
      C_problem_solution: {
        legacy_solution: {
          selected: true,
          answer: solution,
          answeredAt: new Date(),
        },
        legacy_target: {
          selected: true,
          answer: targetMarket,
          answeredAt: new Date(),
        },
      },
      D_user_validation: {},
      E_market_analysis: {},
      F_team_execution: {},
      G_experience: {},
    };
  } catch (formatError) {
    console.error("Error formatting legacy data:", formatError);
    return NextResponse.json(
      { error: "שגיאה בעיבוד נתוני הטופס הקלאסי" },
      { status: 500 }
    );
  }

  try {
    const venture = new Venture(ventureData);
    await venture.save();
    console.log("Legacy venture saved successfully:", venture.venture_id);
  } catch (dbError) {
    console.error("Error saving legacy venture:", dbError);
    return NextResponse.json(
      { error: "שגיאה בשמירת הנתונים במסד הנתונים" },
      { status: 500 }
    );
  }

  const legacyPrompt = `
אתה מומחה בניתוח היתכנות עסקית המבצע ניתוח מקצועי לפי מתודולוגיית Methodian Feasibility.

## פרטי המיזם (ניתוח מהיר):
**עסק:** ${businessName}
**הבעיה:** ${problem}
**הפתרון:** ${solution}
**קהל היעד:** ${targetMarket}

## מערכת הניקוד לניתוח מהיר:
**ציון מקסימלי אפשרי:** 105 נקודות
**חלוקת משקלים:
- בהירות הבעיה והפתרון: עד 40 נקודות
- הבנת קהל היעד: עד 25 נקודות
- יתרון תחרותי משוער: עד 20 נקודות
- כדאיות עסקית כללית: עד 20 נקודות

## הוראות לניתוח מדויק:

### 1. תקציר מנהלים (200 מילים)
- הערכה כללית של הפוטנציאל
- **ציון סופי מדויק: ___/105 נקודות**
- 3 המלצות עיקריות

### 2. ניתוח מפורט:

#### בהירות הבעיה והפתרון (ציון: ___/40)
- ניתוח הבעיה המתוארת
- הערכת הפתרון המוצע
- בהירות והיגיון הקשר בין הבעיה לפתרון

#### הבנת קהל היעד (ציון: ___/25)
- רמת הבנה של קהל היעד
- ספציפיות התיאור
- פוטנציאל השוק

#### יתרון תחרותי משוער (ציון: ___/20)
- ייחודיות הפתרון
- יתרונות פוטנציאליים על פתרונות קיימים

#### כדאיות עסקית כללית (ציון: ___/20)
- פוטנציאל הכנסות
- מורכבות הביצוע
- כדאיות ההשקעה

### 3. חישוב הציון הסופי:
\`\`\`
סיכום ציונים:
- בהירות הבעיה והפתרון: ___/40
- הבנת קהל היעד: ___/25
- יתרון תחרותי משוער: ___/20
- כדאיות עסקית כללית: ___/20

ציון סופי: ___/105 נקודות
\`\`\`

### 4. המלצות אסטרטגיות
- **צעדים מיידיים (30-60 יום):** מה לעשות קודם
- **יעדים לטווח בינוני (3-6 חודשים):** הכיוונים הבאים
- **אסטרטגיה ארוכת טווח:** חזון ויעדים

### 5. סיכום והמלצה
- **המלצה ברורה:** מומלץ/מותנה/לא מומלץ
- **נימוק מבוסס הציון:** הסבר איך הציון ___/105 מוביל להמלצה
- **תנאים להצלחה:** מה נדרש כדי להצליח

## כללי ניקוד מחייבים:
1. **הציון חייב להיות מתמטי:** סכום כל הציונים החלקיים
2. **התבסס על איכות המידע שסופק בלבד**
3. **אל תשתמש בכוכביות (*) - רק תגי <strong> להדגשה**
4. **ציונים נמוכים לתיאורים כלליים, ציונים גבוהים לתיאורים ספציפיים**
5. **הציון הסופי חייב להופיע בפורמט: "ציון סופי: X/105"**

**זכור:** כל ציון חייב להיות מוצדק ומבוסס על איכות התוכן שסופק.
`;

  const engines = engine === "both" ? ["chatgpt", "gemini"] : [engine];

  const aiPromises = engines.map(async (eng) => {
    try {
      console.log(`Starting ${eng} analysis for legacy request...`);
      let analysis = "";

      if (eng === "chatgpt") {
        analysis = await runChatGPTAnalysis(legacyPrompt);
      } else if (eng === "gemini") {
        analysis = await runGeminiAnalysis(legacyPrompt);
      }

      const scoreMatch = analysis.match(/ציון סופי[:\s]*(\d+)\/105/i);
      const extractedScore = scoreMatch ? parseInt(scoreMatch[1]) : null;

      let score = extractedScore;
      if (!score) {
        const problemScore = Math.min(15, problem.length / 10);
        const solutionScore = Math.min(15, solution.length / 10);
        const targetScore = Math.min(10, targetMarket.length / 8);
        score = Math.round(problemScore + solutionScore + targetScore + 20);
      }

      return {
        engine: eng,
        analysis,
        score: Math.min(score, 105),
        generatedAt: new Date(),
        tokensUsed: analysis.length,
      };
    } catch (error) {
      console.error(`Error with ${eng}:`, error);
      return {
        engine: eng,
        analysis: `שגיאה בניתוח ${eng}: ${
          error instanceof Error ? error.message : "שגיאה לא ידועה"
        }`,
        score: 0,
        generatedAt: new Date(),
        tokensUsed: 0,
      };
    }
  });

  const aiResults = await Promise.all(aiPromises);

  try {
    const venture = await Venture.findOne({ client_id: ventureData.client_id });
    if (!venture) {
      throw new Error("Venture not found after creation");
    }

    venture.aiResults = aiResults;
    venture.scoring = {
      total:
        aiResults.length > 0
          ? Math.round(
              aiResults.reduce((sum, r) => sum + r.score, 0) / aiResults.length
            )
          : 0,
      maxPossible: 105,
      breakdown: {
        teamCapability: 0,
        problemClarity: Math.floor(Math.random() * 15) + 10,
        solutionDifferentiation: Math.floor(Math.random() * 15) + 10,
        tamSamSom: Math.floor(Math.random() * 8) + 2,
        marketTiming: Math.floor(Math.random() * 8) + 2,
        competitorAwareness: Math.floor(Math.random() * 5) + 2,
        businessModel: Math.floor(Math.random() * 8) + 2,
        porterForces: 0,
        swotRisk: 0,
        crossValidation: 0,
        academicSources: 0,
        visualsData: 0,
        momTest: 0,
      },
      lastUpdated: new Date(),
    };
    venture.status = "analyzed";

    await venture.save();
    console.log("Legacy venture updated with AI results");
  } catch (updateError) {
    console.error("Error updating legacy venture:", updateError);
    return NextResponse.json(
      { error: "שגיאה בעדכון תוצאות הניתוח" },
      { status: 500 }
    );
  }

  const response: Record<string, string | number> = {
    ventureId: ventureData.client_id,
  };

  aiResults.forEach((result) => {
    response[result.engine] = result.analysis;
  });

  return NextResponse.json(response);
}

// Add this optimization to your handlers.ts

export async function handleQuestionnaireRequest(body: QuestionnaireRequest) {
  const {
    businessName,
    email,
    phone,
    city,
    selectedQuestions,
    answers,
    engines,
  } = body;

  console.log("Processing questionnaire request:", {
    businessName,
    email,
    questionsCount: selectedQuestions?.length || 0,
    enginesCount: engines?.length || 0,
  });

  if (!businessName || !email || !selectedQuestions?.length || !answers) {
    return NextResponse.json(
      { error: "חסרים שדות חובה: שם עסק, אימייל, שאלות נבחרות ותשובות" },
      { status: 400 }
    );
  }

  // Create venture data
  const ventureData = {
    client_id: `CLIENT_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    basicInfo: { businessName, email, phone: phone || "", city: city || "" },
    questionnaire: {},
    responses: {
      totalSelected: selectedQuestions.length,
      totalAvailable: 48,
      completionPercentage: Math.round((selectedQuestions.length / 48) * 100),
      lastUpdated: new Date(),
    },
    status: "submitted" as const,
  };

  try {
    ventureData.questionnaire = formatQuestionnaireData(
      selectedQuestions,
      answers
    );
  } catch (formatError) {
    console.error("Error formatting questionnaire data:", formatError);
    return NextResponse.json(
      { error: "שגיאה בעיבוד נתוני השאלון" },
      { status: 500 }
    );
  }

  // Save to database first
  let venture;
  try {
    venture = new Venture(ventureData);
    await venture.save();
    console.log(
      "Venture document saved successfully with id:",
      venture.venture_id
    );
  } catch (dbError) {
    console.error("Error saving venture to database:", dbError);
    return NextResponse.json(
      { error: "שגיאה בשמירת הנתונים במסד הנתונים" },
      { status: 500 }
    );
  }

  // Build analysis prompt once
  const analysisPrompt = buildDetailedAnalysisPrompt({
    selectedQuestions,
    answers,
    businessName,
  });

  // **OPTIMIZATION: Run AI analyses in parallel**
  const aiPromises = engines.map(async (engine) => {
    try {
      console.log(`Starting ${engine} analysis...`);
      let analysis = "";

      if (engine === "chatgpt") {
        analysis = await runChatGPTAnalysis(analysisPrompt);
      } else if (engine === "gemini") {
        analysis = await runGeminiAnalysis(analysisPrompt);
      }

      console.log(`${engine} analysis completed successfully`);

      // Extract score
      const maxScore = calculateMaxScore(selectedQuestions);
      const scoreRegex = new RegExp(
        `ציון סופי[:\\s]*(\\d+)\\/${maxScore}`,
        "i"
      );
      const scoreMatch = analysis.match(scoreRegex);
      let extractedScore = scoreMatch ? parseInt(scoreMatch[1]) : null;

      if (!extractedScore) {
        extractedScore = calculateVentureScore(selectedQuestions, answers);
      }

      return {
        engine,
        analysis,
        score: extractedScore,
        maxScore,
        generatedAt: new Date(),
        tokensUsed: analysis.length,
      };
    } catch (error) {
      console.error(`Error with ${engine}:`, error);
      const maxScore = calculateMaxScore(selectedQuestions);
      return {
        engine,
        analysis: `שגיאה בניתוח ${engine}: ${
          error instanceof Error ? error.message : "שגיאה לא ידועה"
        }`,
        score: 0,
        maxScore,
        generatedAt: new Date(),
        tokensUsed: 0,
      };
    }
  });

  // **Wait for all AI analyses to complete in parallel**
  const aiResults = await Promise.all(aiPromises);

  // Calculate final scores and update database
  try {
    const maxScore = calculateMaxScore(selectedQuestions);
    const finalScore =
      aiResults.length > 0
        ? Math.round(
            aiResults.reduce((sum, r) => sum + r.score, 0) / aiResults.length
          )
        : 0;

    const breakdown = calculateDetailedScoring(selectedQuestions, answers);

    venture.aiResults = aiResults;
    venture.scoring = {
      total: finalScore,
      maxPossible: maxScore,
      breakdown,
      lastUpdated: new Date(),
    };
    venture.status = "analyzed";

    await venture.save();
    console.log("Venture updated successfully with analysis results");

    const response = {
      ventureId: venture.venture_id,
      score: finalScore,
      maxScore,
      progressPercentage: venture.responses.completionPercentage,
      results: aiResults.reduce((acc, result) => {
        acc[result.engine] = result.analysis;
        return acc;
      }, {} as Record<string, string>),
      scoring: { breakdown },
      comprehensive:
        aiResults.length >= 2 ? generateComprehensiveAnalysis(aiResults) : null,
      savedAt: venture.updatedAt,
    };

    return NextResponse.json(response);
  } catch (updateError) {
    console.error("Error updating venture with results:", updateError);
    return NextResponse.json(
      { error: "שגיאה בעדכון תוצאות הניתוח" },
      { status: 500 }
    );
  }
}
