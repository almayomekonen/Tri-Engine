import { NextRequest, NextResponse } from "next/server";
import { TextEncoder } from "util";
import { createSession, updateSession, getSession } from "@/lib/mongodb";
import { validateSession } from "@/lib/validate";
import {
  sendSSEMessage,
  streamEngineContent,
  createResultObject,
} from "@/lib/streamUtils";
import { buildDetailedAnalysisPrompt } from "../utils";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { businessName, selectedQuestions, answers } = data;

    if (!businessName || !selectedQuestions || !answers) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // בניית פרומפט מהתשובות שהתקבלו
    const prompt = buildDetailedAnalysisPrompt({
      selectedQuestions,
      answers,
      businessName,
    });

    // Create a new session
    const sessionId = await createSession({
      prompt,
      businessName,
      progress: 0,
      isComplete: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("Error in POST /api/analyze/stream:", error);
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// HEAD request for session validation
export async function HEAD(request: NextRequest) {
  try {
    // Get the session ID from the request URL
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return new Response(null, { status: 400 });
    }

    // Validate the session
    const isValid = await validateSession(sessionId);

    if (!isValid) {
      return new Response(null, { status: 404 });
    }

    // Session is valid
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Error in HEAD /api/analyze/stream:", error);
    return new Response(null, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the session ID from the request URL
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, must-revalidate",
        },
      });
    }

    // Check if the session exists and is valid
    const isValid = await validateSession(sessionId);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, must-revalidate",
          },
        }
      );
    }

    // Get session data
    const session = await getSession(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, must-revalidate",
        },
      });
    }

    // Initialize the encoder and create a stream
    const encoder = new TextEncoder();
    let isControllerActive = true;

    // Create a new ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Add listener for client disconnection
          request.signal.addEventListener("abort", () => {
            console.log(
              `Client disconnected from stream for session: ${sessionId}`
            );
            isControllerActive = false;
          });

          // Send initial message
          if (isControllerActive) {
            sendSSEMessage(controller, encoder, "connected", {
              message: "Stream connected",
              sessionId,
            });
          }

          // If analysis is not already complete, start it
          if (!session.isComplete) {
            // Background start of analysis process
            startAnalysis(sessionId, session.prompt);
          }

          // Initial progress
          if (isControllerActive) {
            sendSSEMessage(controller, encoder, "progress", {
              progress: session.progress || 0,
            });
          }

          // For already existing results, stream them immediately
          if (session.chatgptContent && isControllerActive) {
            await streamEngineContent(
              controller,
              encoder,
              "chatgpt",
              session.chatgptContent,
              session.progress >= 50 ? 45 : session.progress,
              50
            );
          }

          if (session.geminiContent && isControllerActive) {
            await streamEngineContent(
              controller,
              encoder,
              "gemini",
              session.geminiContent,
              session.progress >= 100 ? 95 : Math.max(session.progress, 50),
              100
            );
          }

          // If already complete, send completion event
          if (session.isComplete && isControllerActive) {
            const result = createResultObject(
              sessionId,
              session.chatgptContent || "",
              session.geminiContent || ""
            );

            sendSSEMessage(controller, encoder, "analysis_complete", {
              message: "Analysis complete",
              progress: 100,
              result,
            });
          }

          // Setup a polling interval to check for updates
          const interval = setInterval(async () => {
            try {
              // אם ה-controller לא פעיל, הפסק את הבדיקות
              if (!isControllerActive) {
                clearInterval(interval);
                return;
              }

              const updatedSession = await getSession(sessionId);
              if (!updatedSession) {
                if (isControllerActive) {
                  // ניסיון לשלוח הודעת שגיאה
                  try {
                    sendSSEMessage(controller, encoder, "error", {
                      error: "Session not found",
                    });
                  } catch (e) {
                    // במקרה של שגיאה בשליחה, סמן את ה-controller כלא פעיל
                    console.error("Error sending error message:", e);
                  } finally {
                    isControllerActive = false;
                    clearInterval(interval);
                  }
                }
                return;
              }

              // בדוק לתוכן ChatGPT חדש
              if (
                updatedSession.chatgptContent &&
                (!session.chatgptContent ||
                  session.chatgptContent !== updatedSession.chatgptContent) &&
                isControllerActive
              ) {
                // אם הסטרימינג נכשל (למשל, הלקוח התנתק), סמן את ה-controller כלא פעיל
                const streamSuccess = await streamEngineContent(
                  controller,
                  encoder,
                  "chatgpt",
                  updatedSession.chatgptContent,
                  updatedSession.progress >= 50 ? 45 : updatedSession.progress,
                  50
                );

                if (!streamSuccess) {
                  console.log(
                    `Stream closed during ChatGPT content for session: ${sessionId}`
                  );
                  isControllerActive = false;
                  clearInterval(interval);
                  return;
                }
              }

              // בדוק לתוכן Gemini חדש
              if (
                updatedSession.geminiContent &&
                (!session.geminiContent ||
                  session.geminiContent !== updatedSession.geminiContent) &&
                isControllerActive
              ) {
                // אם הסטרימינג נכשל (למשל, הלקוח התנתק), סמן את ה-controller כלא פעיל
                const streamSuccess = await streamEngineContent(
                  controller,
                  encoder,
                  "gemini",
                  updatedSession.geminiContent,
                  updatedSession.progress >= 100
                    ? 95
                    : Math.max(updatedSession.progress, 50),
                  100
                );

                if (!streamSuccess) {
                  console.log(
                    `Stream closed during Gemini content for session: ${sessionId}`
                  );
                  isControllerActive = false;
                  clearInterval(interval);
                  return;
                }
              }

              // שליחת עדכוני התקדמות
              if (
                updatedSession.progress !== session.progress &&
                isControllerActive
              ) {
                try {
                  sendSSEMessage(controller, encoder, "progress", {
                    progress: updatedSession.progress,
                  });
                } catch (e) {
                  console.error("Error sending progress update:", e);
                  isControllerActive = false;
                  clearInterval(interval);
                  return;
                }
              }

              // בדוק אם הניתוח הושלם
              if (
                updatedSession.isComplete &&
                !session.isComplete &&
                isControllerActive
              ) {
                try {
                  const result = createResultObject(
                    sessionId,
                    updatedSession.chatgptContent || "",
                    updatedSession.geminiContent || ""
                  );

                  sendSSEMessage(controller, encoder, "analysis_complete", {
                    message: "Analysis complete",
                    progress: 100,
                    result,
                  });
                } catch (e) {
                  console.error("Error sending completion event:", e);
                  isControllerActive = false;
                  clearInterval(interval);
                  return;
                }
              }

              // עדכון העותק המקומי של הסשן
              Object.assign(session, updatedSession);
            } catch (error) {
              console.error("Error in polling interval:", error);
              if (isControllerActive) {
                try {
                  sendSSEMessage(controller, encoder, "error", {
                    error: "Error updating stream",
                    message:
                      error instanceof Error ? error.message : "Unknown error",
                  });
                } catch (e) {
                  // התעלם משגיאות כשמנסים לשלוח הודעות שגיאה
                  console.error("Error sending error message:", e);
                } finally {
                  // בכל מקרה של שגיאה בבדיקות, עדיף לנקות את המשאבים
                  isControllerActive = false;
                  clearInterval(interval);
                }
              }
            }
          }, 1000);

          // Clean up on stream close
          request.signal.addEventListener("abort", () => {
            console.log(
              `Client disconnected from stream for session: ${sessionId}`
            );
            isControllerActive = false;
            clearInterval(interval);
          });

          return () => {
            isControllerActive = false;
            clearInterval(interval);
          };
        } catch (error) {
          console.error("Error in stream start:", error);
          if (isControllerActive) {
            try {
              sendSSEMessage(controller, encoder, "error", {
                error: "Stream error",
                message:
                  error instanceof Error ? error.message : "Unknown error",
              });
            } catch (e) {
              // Ignore errors when trying to send error messages
              console.error("Error sending error message:", e);
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform, no-store, must-revalidate",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Error in GET stream:", error);
    return new Response(
      JSON.stringify({
        error: "Server error processing event stream",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, must-revalidate",
        },
      }
    );
  }
}

// Start the analysis process
async function startAnalysis(sessionId: string, prompt: string) {
  console.log(`Starting analysis for session: ${sessionId}`);

  try {
    // Update progress to 5%
    await updateSession(sessionId, { progress: 5 });

    // Start ChatGPT analysis
    await updateSession(sessionId, { progress: 10 });
    console.log(`ChatGPT analysis started for session: ${sessionId}`);

    // Run ChatGPT analysis
    const chatgptResult = await runChatGPTAnalysis(prompt);

    // Update progress and store the ChatGPT result
    await updateSession(sessionId, {
      progress: 50,
      chatgptContent: chatgptResult,
    });
    console.log(`ChatGPT analysis completed for session: ${sessionId}`);

    // Start Gemini analysis
    console.log(`Gemini analysis started for session: ${sessionId}`);

    // Run Gemini analysis
    const geminiResult = await runGeminiAnalysis(prompt);

    // Update progress, store the Gemini result, and mark as complete
    await updateSession(sessionId, {
      progress: 100,
      geminiContent: geminiResult,
      isComplete: true,
    });
    console.log(`Gemini analysis completed for session: ${sessionId}`);
    console.log(`Analysis complete for session: ${sessionId}`);
  } catch (error) {
    console.error(`Error in analysis for session ${sessionId}:`, error);

    // Make sure to store partial results if we have them
    const session = await getSession(sessionId);
    if (session) {
      const updates: {
        progress: number;
        isComplete: boolean;
        chatgptContent?: string;
        geminiContent?: string;
      } = {
        progress: 100,
        isComplete: true,
      };

      // Use placeholder content for failed engines
      if (!session.chatgptContent) {
        updates.chatgptContent =
          "לא ניתן היה להשלים את הניתוח. אנא נסה שוב מאוחר יותר.";
      }

      if (!session.geminiContent) {
        updates.geminiContent =
          "לא ניתן היה להשלים את הניתוח. אנא נסה שוב מאוחר יותר.";
      }

      await updateSession(sessionId, updates);
    }
  }
}

async function runChatGPTAnalysis(prompt: string): Promise<string> {
  try {
    // פנייה אמיתית ל-API של ChatGPT לקבלת ניתוח מקיף
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "אתה מומחה ניתוח עסקי. בצע ניתוח מקיף ומסודר ומפורט לכל שאלה ותשובה שסופקה. תן ניתוח מפורט ומעמיק לפי כל המידע שניתן.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 16000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`ChatGPT API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return content;
  } catch (error) {
    console.error("Error calling ChatGPT API:", error);

    // במקרה של שגיאה, החזר את המוקאפ כגיבוי
    return `# ניתוח מקיף - ChatGPT
    
## שגיאה בקריאה ל-API האמיתי

מחזיר ניתוח דוגמה במקום.

## סיכום
המיזם נראה מבטיח עם פוטנציאל שוק משמעותי. ישנם מספר אתגרים שיש להתמודד איתם אך הרעיון הבסיסי חזק.

## חוזקות
1. פתרון לבעיה אמיתית בשוק
2. יתרון תחרותי ברור
3. מודל עסקי בר-קיימא

## חולשות
1. דרוש מימון התחלתי משמעותי
2. תחרות מתפתחת בשוק
3. אתגרי רגולציה אפשריים

## המלצות
* לבצע בדיקת היתכנות טכנולוגית מקיפה
* לפתח אב-טיפוס מינימלי להדגמה
* לגייס שותפים אסטרטגיים בתחום`;
  }
}

async function runGeminiAnalysis(prompt: string): Promise<string> {
  try {
    // פנייה אמיתית ל-API של Gemini לקבלת ניתוח מקיף
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `אתה מומחה ניתוח עסקי. בצע ניתוח מקיף ומסודר ומפורט לכל שאלה ותשובה שסופקה. תן ניתוח מפורט ומעמיק לפי כל המידע שניתן.\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 32768,
          temperature: 0.05,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return content;
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    // במקרה של שגיאה, החזר את המוקאפ כגיבוי
    return `# ניתוח מקיף - Gemini

## שגיאה בקריאה ל-API האמיתי

מחזיר ניתוח דוגמה במקום.

## סיכום
המיזם מציג פוטנציאל עסקי, אך ישנם מספר נקודות שדורשות שיפור וחשיבה נוספת.

## חוזקות
1. חדשנות בתחום מתפתח
2. פתרון לבעיה קיימת
3. מודל הכנסות ברור

## חולשות
1. חסרים נתוני שוק מדויקים יותר
2. תכנית השיווק דורשת פיתוח
3. סיכונים טכנולוגיים לא מטופלים במלואם

## המלצות
* לבצע מחקר שוק מעמיק יותר
* לפתח תכנית פיננסית מפורטת יותר
* להתמקד בפיתוח אב-טיפוס מינימלי למשוב ראשוני מלקוחות`;
  }
}
