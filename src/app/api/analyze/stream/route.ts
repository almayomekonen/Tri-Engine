import { NextRequest } from "next/server";
import { buildDetailedAnalysisPrompt } from "../utils";
import { DetailedAnalysisResult } from "@/types";

// Define the session interface
interface AnalysisSession {
  prompt: string;
  progress: number;
  chatgptContent: string;
  geminiContent: string;
  isComplete: boolean;
  businessName: string;
  createdAt: Date;
}

// Store active analysis sessions
const ACTIVE_SESSIONS = new Map<string, AnalysisSession>();

// Clean up sessions older than 30 minutes
function cleanupOldSessions() {
  const now = new Date();
  ACTIVE_SESSIONS.forEach((session, id) => {
    const sessionAge = now.getTime() - session.createdAt.getTime();
    // If session is older than 30 minutes (1800000 ms), remove it
    if (sessionAge > 1800000) {
      ACTIVE_SESSIONS.delete(id);
      console.log(`Cleaned up expired session: ${id}`);
    }
  });
}

// Run cleanup every 5 minutes
setInterval(cleanupOldSessions, 300000);

// Helper function to validate session ID
function validateSession(sessionId: string | null): boolean {
  if (!sessionId) return false;
  return ACTIVE_SESSIONS.has(sessionId);
}

// Handle different HTTP methods
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const sessionId = crypto.randomUUID();

    // Create analysis prompt from the form data
    const prompt = buildDetailedAnalysisPrompt({
      selectedQuestions: data.selectedQuestions || [],
      answers: data.answers || {},
      businessName: data.businessName || "My Business",
    });

    // Store session with creation timestamp
    ACTIVE_SESSIONS.set(sessionId, {
      prompt,
      progress: 0,
      chatgptContent: "",
      geminiContent: "",
      isComplete: false,
      businessName: data.businessName || "My Business",
      createdAt: new Date(),
    });

    // Begin analysis in the background
    startAnalysis(sessionId);

    // Return the session ID
    return new Response(JSON.stringify({ sessionId }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error starting analysis:", error);
    return new Response(JSON.stringify({ error: "Failed to start analysis" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

export async function HEAD(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    // Check if the session exists
    if (!validateSession(sessionId)) {
      console.log(`HEAD: Invalid session ID: ${sessionId}`);
      return new Response(null, {
        status: 400,
      });
    }

    // Session is valid
    return new Response(null, {
      status: 200,
    });
  } catch (error) {
    console.error("Error in HEAD request:", error);
    return new Response(null, {
      status: 500,
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    // Validate the session ID
    if (!sessionId || !ACTIVE_SESSIONS.has(sessionId)) {
      return new Response("Event stream requires a valid sessionId", {
        status: 400,
      });
    }

    // Get the session (we've validated it exists)
    const session = ACTIVE_SESSIONS.get(sessionId)!;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send initial status
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "status",
              message: "מתחיל ניתוח מקיף...",
              progress: session.progress,
            })}\n\n`
          )
        );

        // Send chatgpt_start event immediately if progress >= 10
        if (session.progress >= 10) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "chatgpt_start",
                message: "מתחיל ניתוח ChatGPT...",
              })}\n\n`
            )
          );
        }

        // If we already have chatgpt content, send it
        if (session.chatgptContent) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "chatgpt_chunk",
                content: session.chatgptContent,
                progress: Math.min(50, session.progress),
              })}\n\n`
            )
          );

          // If progress is at least 50, ChatGPT is complete
          if (session.progress >= 50) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "chatgpt_complete",
                  content: session.chatgptContent,
                  progress: 50,
                })}\n\n`
              )
            );

            // And Gemini might have started
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "gemini_start",
                  message: "מתחיל ניתוח Gemini...",
                })}\n\n`
              )
            );
          }
        }

        // If we already have gemini content, send it
        if (session.geminiContent) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "gemini_chunk",
                content: session.geminiContent,
                progress: Math.min(95, 50 + session.progress / 2),
              })}\n\n`
            )
          );

          // If the session is complete, Gemini is also complete
          if (session.isComplete) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "gemini_complete",
                  content: session.geminiContent,
                  progress: 95,
                })}\n\n`
              )
            );
          }
        }

        // If the session is already complete, send the complete event
        if (session.isComplete) {
          // Create a result object to send back
          const result: DetailedAnalysisResult = {
            ventureId: sessionId,
            score: 75, // Default score - can be calculated based on analysis
            maxScore: 105,
            progressPercentage: 100,
            results: {
              chatgpt: session.chatgptContent,
              gemini: session.geminiContent,
            },
            comprehensive: "ניתוח מקיף משולב יתווסף בעתיד",
            savedAt: new Date(),
          };

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                progress: 100,
                result: result,
              })}\n\n`
            )
          );

          // And close the stream
          ACTIVE_SESSIONS.delete(sessionId);
          controller.close();
          return;
        }

        // Set up interval to check for updates
        const interval = setInterval(() => {
          // Check if session still exists
          if (!ACTIVE_SESSIONS.has(sessionId)) {
            clearInterval(interval);
            controller.close();
            return;
          }

          const updatedSession = ACTIVE_SESSIONS.get(sessionId)!;

          // Keep track of local session state to detect changes
          const sessionState = {
            progress: session.progress,
            chatgptContent: session.chatgptContent,
            geminiContent: session.geminiContent,
            isComplete: session.isComplete,
          };

          // Check for progress changes
          const progressChanged =
            updatedSession.progress !== sessionState.progress;

          // Check for new ChatGPT content
          if (updatedSession.progress >= 10 && sessionState.progress < 10) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "chatgpt_start",
                  message: "מתחיל ניתוח ChatGPT...",
                })}\n\n`
              )
            );
          }

          // Send current state if ChatGPT content changed
          if (updatedSession.chatgptContent !== sessionState.chatgptContent) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "chatgpt_chunk",
                  content: updatedSession.chatgptContent,
                  progress: Math.min(50, updatedSession.progress),
                })}\n\n`
              )
            );
          }

          // Send chatgpt_complete if we're at 50% but weren't before
          if (
            updatedSession.progress >= 50 &&
            sessionState.progress < 50 &&
            updatedSession.chatgptContent
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "chatgpt_complete",
                  content: updatedSession.chatgptContent,
                  progress: 50,
                })}\n\n`
              )
            );

            // Also send gemini_start event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "gemini_start",
                  message: "מתחיל ניתוח Gemini...",
                })}\n\n`
              )
            );
          }

          // Send current state if Gemini content changed
          if (updatedSession.geminiContent !== sessionState.geminiContent) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "gemini_chunk",
                  content: updatedSession.geminiContent,
                  progress: Math.min(95, 50 + updatedSession.progress / 2),
                })}\n\n`
              )
            );
          }

          // Send gemini_complete if we're at 95% but weren't before
          if (
            updatedSession.progress >= 95 &&
            sessionState.progress < 95 &&
            updatedSession.geminiContent
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "gemini_complete",
                  content: updatedSession.geminiContent,
                  progress: 95,
                })}\n\n`
              )
            );
          }

          // Send general progress update if it changed
          if (progressChanged) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "status",
                  message:
                    updatedSession.progress >= 50
                      ? "Gemini מנתח את המיזם..."
                      : "ChatGPT מנתח את המיזם...",
                  progress: updatedSession.progress,
                })}\n\n`
              )
            );
          }

          // Check if analysis is complete
          if (updatedSession.isComplete && !sessionState.isComplete) {
            // Create a result object to send back
            const result: DetailedAnalysisResult = {
              ventureId: sessionId,
              score: 75, // Default score - can be calculated based on analysis
              maxScore: 105,
              progressPercentage: 100,
              results: {
                chatgpt: updatedSession.chatgptContent,
                gemini: updatedSession.geminiContent,
              },
              comprehensive: "ניתוח מקיף משולב יתווסף בעתיד",
              savedAt: new Date(),
            };

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "complete",
                  progress: 100,
                  result: result,
                })}\n\n`
              )
            );

            // Clean up
            clearInterval(interval);
            ACTIVE_SESSIONS.delete(sessionId);
            controller.close();
          }

          // Update our local session reference with the current values
          Object.assign(session, updatedSession);
        }, 1000); // Check for updates every second

        // Handle client disconnect
        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Error in GET stream:", error);
    return new Response(JSON.stringify({ error: "Stream error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

async function startAnalysis(sessionId: string) {
  const session = ACTIVE_SESSIONS.get(sessionId);
  if (!session) return;

  try {
    // Start ChatGPT Analysis - update progress incrementally
    ACTIVE_SESSIONS.set(sessionId, {
      ...session,
      progress: 5,
    });

    // Add a small delay to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Update to 10% - ChatGPT starting
    if (!ACTIVE_SESSIONS.has(sessionId)) return; // Session was deleted
    ACTIVE_SESSIONS.set(sessionId, {
      ...ACTIVE_SESSIONS.get(sessionId)!,
      progress: 10,
    });

    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update to 20% - ChatGPT in progress
    if (!ACTIVE_SESSIONS.has(sessionId)) return; // Session was deleted
    ACTIVE_SESSIONS.set(sessionId, {
      ...ACTIVE_SESSIONS.get(sessionId)!,
      progress: 20,
    });

    // Simulate getting partial ChatGPT results
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Update to 30% with initial content
    if (!ACTIVE_SESSIONS.has(sessionId)) return; // Session was deleted
    ACTIVE_SESSIONS.set(sessionId, {
      ...ACTIVE_SESSIONS.get(sessionId)!,
      chatgptContent: "מנתח את המיזם... התוצאות יופיעו בקרוב.",
      progress: 30,
    });

    // Simulate more ChatGPT progress
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Run the actual ChatGPT analysis
    let chatgptResult = "";
    try {
      chatgptResult = await runChatGPTAnalysis(session.prompt);
    } catch (e) {
      console.error("Error in ChatGPT analysis:", e);
      chatgptResult = "שגיאה בניתוח ChatGPT. נסה שוב מאוחר יותר.";
    }

    if (!ACTIVE_SESSIONS.has(sessionId)) return; // Session was deleted

    // ChatGPT complete
    ACTIVE_SESSIONS.set(sessionId, {
      ...ACTIVE_SESSIONS.get(sessionId)!,
      chatgptContent: chatgptResult,
      progress: 50,
    });

    // Small delay before starting Gemini
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Update to 60% - Gemini in progress
    if (!ACTIVE_SESSIONS.has(sessionId)) return; // Session was deleted
    ACTIVE_SESSIONS.set(sessionId, {
      ...ACTIVE_SESSIONS.get(sessionId)!,
      progress: 60,
    });

    // Simulate getting partial Gemini results
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Update to 70% with initial Gemini content
    if (!ACTIVE_SESSIONS.has(sessionId)) return; // Session was deleted
    ACTIVE_SESSIONS.set(sessionId, {
      ...ACTIVE_SESSIONS.get(sessionId)!,
      geminiContent: "מנתח את המיזם באמצעות Gemini... התוצאות יופיעו בקרוב.",
      progress: 70,
    });

    // Simulate more Gemini progress
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Run the actual Gemini analysis
    let geminiResult = "";
    try {
      geminiResult = await runGeminiAnalysis(session.prompt);
    } catch (e) {
      console.error("Error in Gemini analysis:", e);
      geminiResult = "שגיאה בניתוח Gemini. נסה שוב מאוחר יותר.";
    }

    if (!ACTIVE_SESSIONS.has(sessionId)) return; // Session was deleted

    // Gemini almost complete
    ACTIVE_SESSIONS.set(sessionId, {
      ...ACTIVE_SESSIONS.get(sessionId)!,
      geminiContent: geminiResult,
      progress: 95,
    });

    // Small delay before finalizing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Complete the analysis
    if (!ACTIVE_SESSIONS.has(sessionId)) return; // Session was deleted
    ACTIVE_SESSIONS.set(sessionId, {
      ...ACTIVE_SESSIONS.get(sessionId)!,
      progress: 100,
      isComplete: true,
    });
  } catch (error) {
    console.error("Analysis error:", error);

    if (ACTIVE_SESSIONS.has(sessionId)) {
      const currentSession = ACTIVE_SESSIONS.get(sessionId)!;

      // Make sure we have at least some content if there was an error
      const chatgptContent =
        currentSession.chatgptContent || "שגיאה בניתוח, אין תוכן";
      const geminiContent =
        currentSession.geminiContent || "שגיאה בניתוח, אין תוכן";

      ACTIVE_SESSIONS.set(sessionId, {
        ...currentSession,
        chatgptContent,
        geminiContent,
        progress: 100,
        isComplete: true,
      });
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
    return `# ניתוח מיזם - Gemini

## שגיאה בקריאה ל-API האמיתי

מחזיר ניתוח דוגמה במקום.

## הערכה כללית
המיזם מציג פוטנציאל עסקי טוב עם נקודות ייחודיות בשוק. נדרשת עבודה נוספת על אסטרטגיית החדירה לשוק.

## נקודות מפתח:
1. הבעיה שהמיזם פותר היא אמיתית ומשמעותית
2. קיים שוק יעד ברור עם צורך מוכח
3. המודל העסקי דורש ליטוש נוסף

## סיכונים מרכזיים:
* תחרות גוברת בתחום
* אתגרי פיתוח טכנולוגיים
* חסמי כניסה לשוק

## צעדים מומלצים להמשך:
* גיבוש תוכנית עסקית מפורטת
* ביצוע מחקר שוק מעמיק
* פיתוח אסטרטגיית שיווק ממוקדת`;
  }
}
