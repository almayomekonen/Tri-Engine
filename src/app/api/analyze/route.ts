// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Venture } from "@/lib/mongodb";
import { isLegacyRequest, isQuestionnaireRequest } from "./types";
import { handleLegacyRequest, handleQuestionnaireRequest } from "./handlers";

// הגבלת זמן ל-4 דקות במקום 5 כדי להשאיר מרווח ביטחון
const TIMEOUT_DURATION = 4 * 60 * 1000; // 4 דקות

export async function POST(request: NextRequest) {
  // יצירת timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("Analysis timeout after 4 minutes"));
    }, TIMEOUT_DURATION);
  });

  try {
    console.log("API route called, connecting to MongoDB...");

    // חיבור מהיר למסד נתונים עם timeout
    const dbConnectPromise = dbConnect();
    await Promise.race([dbConnectPromise, timeoutPromise]);
    console.log("MongoDB connection successful");

    console.log("Parsing request body...");
    const body = await request.json();
    console.log(
      "Request type:",
      isLegacyRequest(body)
        ? "Legacy"
        : isQuestionnaireRequest(body)
        ? "Questionnaire"
        : "Unknown"
    );

    let handlerPromise: Promise<NextResponse>;

    if (isLegacyRequest(body)) {
      console.log("Processing legacy request...");
      handlerPromise = handleLegacyRequest(body);
    } else if (isQuestionnaireRequest(body)) {
      console.log("Processing questionnaire request...");
      handlerPromise = handleQuestionnaireRequest(body);
    } else {
      console.log("Invalid request format");
      return NextResponse.json(
        { error: "פורמט בקשה לא תקין - נדרש פורמט שאלון או פורמט קלאסי" },
        { status: 400 }
      );
    }

    // הרצה עם timeout
    const response = await Promise.race([handlerPromise, timeoutPromise]);
    console.log("Request processed successfully");
    return response;
  } catch (error) {
    console.error("Analysis error:", error);

    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        {
          error: "זמן הניתוח עבר את המותר",
          details:
            "הניתוח לוקח זמן רב מדי. נסה להפחית את מספר השאלות או לבחור מנוע AI יחיד",
          suggestion:
            "אנא נסה שוב עם פחות שאלות או עם מנוע AI יחיד במקום כמה מנועים",
        },
        { status: 408 } // Request Timeout
      );
    }

    return NextResponse.json(
      {
        error: "שגיאה בניתוח",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const ventureId = searchParams.get("ventureId");
    const email = searchParams.get("email");

    if (!ventureId && !email) {
      return NextResponse.json(
        { error: "נדרש venture ID או email" },
        { status: 400 }
      );
    }

    const query = ventureId
      ? { venture_id: ventureId }
      : { "basicInfo.email": email };

    const ventures = await Venture.find(query)
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      ventures: ventures.map((v) => ({
        ventureId: v.venture_id,
        businessName: v.basicInfo.businessName,
        score: v.scoring?.total || 0,
        maxScore: v.scoring?.maxPossible || 105,
        status: v.status,
        progress: v.progressPercentage,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get analysis error:", error);
    return NextResponse.json({ error: "שגיאה בשליפת הניתוח" }, { status: 500 });
  }
}
