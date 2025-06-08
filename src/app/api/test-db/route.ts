// app/api/test-db/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Venture } from "@/lib/mongodb";

export async function GET() {
  try {
    // התחברות למסד הנתונים
    await dbConnect();

    // ספירת ventures קיימים
    const count = await Venture.countDocuments({});

    return NextResponse.json({
      status: "success",
      message: "MongoDB connection successful!",
      totalVentures: count,
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
