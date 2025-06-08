import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Venture } from "@/lib/mongodb";
import { isLegacyRequest, isQuestionnaireRequest } from "./types";
import { handleLegacyRequest, handleQuestionnaireRequest } from "./handlers";

export async function POST(request: NextRequest) {
  try {
    console.log("API route called, connecting to MongoDB...");

    try {
      await dbConnect();
      console.log("MongoDB connection successful");
    } catch (dbError) {
      console.error("MongoDB connection failed:", dbError);
      return NextResponse.json(
        {
          error: "שגיאה בחיבור למסד הנתונים",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 }
      );
    }

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

    if (isLegacyRequest(body)) {
      console.log("Processing legacy request...");
      return await handleLegacyRequest(body);
    }

    if (isQuestionnaireRequest(body)) {
      console.log("Processing questionnaire request...");
      try {
        const response = await handleQuestionnaireRequest(body);
        console.log("Questionnaire request processed successfully");
        return response;
      } catch (handlerError) {
        console.error("Error in questionnaire handler:", handlerError);
        return NextResponse.json(
          {
            error: "שגיאה בעיבוד השאלון",
            details:
              handlerError instanceof Error
                ? handlerError.message
                : String(handlerError),
          },
          { status: 500 }
        );
      }
    }

    console.log("Invalid request format");
    return NextResponse.json(
      { error: "פורמט בקשה לא תקין - נדרש פורמט שאלון או פורמט קלאסי" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Analysis error:", error);
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
