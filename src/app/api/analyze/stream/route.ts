import { NextRequest } from "next/server";
import { buildDetailedAnalysisPrompt } from "../utils";
import { DetailedAnalysisResult } from "@/types";
import {
  createSession,
  getSession,
  updateSession,
  validateSession,
} from "@/lib/sessionService";

// Define the session interface in mongodb.ts now

// No need for active sessions map anymore as we use MongoDB
// const ACTIVE_SESSIONS = new Map<string, AnalysisSession>();

// No need for cleanup as MongoDB TTL index handles it automatically
// function cleanupOldSessions() {...}
// setInterval(cleanupOldSessions, 300000);

// Helper function now uses MongoDB
// function validateSession(sessionId: string | null): boolean {...}

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

    // Create session in MongoDB
    await createSession({
      sessionId,
      prompt,
      businessName: data.businessName || "My Business",
    });

    // Begin analysis in the background
    startAnalysis(sessionId, prompt);

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

    console.log(`HEAD request received for sessionId: ${sessionId}`);

    // Check if the session exists in MongoDB
    const isValid = await validateSession(sessionId);

    if (!isValid) {
      console.log(`HEAD: Invalid session ID: ${sessionId}`);
      return new Response(null, {
        status: 400,
        headers: {
          "Cache-Control": "no-store, must-revalidate",
        },
      });
    }

    // Session is valid
    console.log(`HEAD: Valid session ID: ${sessionId}`);
    return new Response(null, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in HEAD request:", error);
    return new Response(null, {
      status: 500,
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    console.log(`GET stream request for sessionId: ${sessionId}`);

    // Validate the session ID using MongoDB
    if (!sessionId) {
      console.log(`Invalid or missing sessionId: ${sessionId}`);
      return new Response("Event stream requires a valid sessionId", {
        status: 400,
        headers: {
          "Cache-Control": "no-store, must-revalidate",
          "Content-Type": "text/plain",
        },
      });
    }

    // Get the session from MongoDB
    const session = await getSession(sessionId);

    if (!session) {
      console.log(`Session not found for ID: ${sessionId}`);
      return new Response("Session not found or expired", {
        status: 400,
        headers: {
          "Cache-Control": "no-store, must-revalidate",
          "Content-Type": "text/plain",
        },
      });
    }

    console.log(
      `Valid session found for: ${sessionId}, progress: ${session.progress}`
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // דגל לסימון האם ה-controller פעיל
        let isControllerActive = true;

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
          // No need to delete from Map, but we'll add a session expiry in MongoDB
          controller.close();
          return;
        }

        // Set up interval to check for updates from MongoDB
        const interval = setInterval(async () => {
          // בדיקה אם ה-controller עדיין פעיל
          if (!isControllerActive) {
            clearInterval(interval);
            return;
          }

          try {
            // Check if session still exists in MongoDB
            const updatedSession = await getSession(sessionId);

            if (!updatedSession) {
              console.log(
                `Session ${sessionId} no longer exists, closing stream`
              );
              clearInterval(interval);

              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "error",
                      error: "Session expired or not found",
                    })}\n\n`
                  )
                );
                controller.close();
              } catch (err) {
                console.log(
                  "Controller already closed, can't send error message",
                  err
                );
              }

              isControllerActive = false;
              return;
            }

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
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "chatgpt_start",
                      message: "מתחיל ניתוח ChatGPT...",
                    })}\n\n`
                  )
                );
              } catch (error: unknown) {
                console.error(
                  "Error sending chatgpt_start:",
                  error instanceof Error ? error.message : "Unknown error"
                );
                isControllerActive = false;
                clearInterval(interval);
                return;
              }
            }

            // Check for ChatGPT content changes
            const chatgptContentChanged =
              updatedSession.chatgptContent !== sessionState.chatgptContent;

            if (chatgptContentChanged && isControllerActive) {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "chatgpt_chunk",
                      content: updatedSession.chatgptContent,
                      progress: Math.min(50, updatedSession.progress),
                    })}\n\n`
                  )
                );

                // Update local copy
                session.chatgptContent = updatedSession.chatgptContent;
              } catch (error: unknown) {
                console.error(
                  "Error sending chatgpt_chunk:",
                  error instanceof Error ? error.message : "Unknown error"
                );
                isControllerActive = false;
                clearInterval(interval);
                return;
              }
            }

            // Check for ChatGPT completion
            if (updatedSession.progress >= 50 && sessionState.progress < 50) {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "chatgpt_complete",
                      content: updatedSession.chatgptContent,
                      progress: 50,
                    })}\n\n`
                  )
                );

                // Also send Gemini start
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "gemini_start",
                      message: "מתחיל ניתוח Gemini...",
                    })}\n\n`
                  )
                );
              } catch (error: unknown) {
                console.error(
                  "Error sending chatgpt_complete:",
                  error instanceof Error ? error.message : "Unknown error"
                );
                isControllerActive = false;
                clearInterval(interval);
                return;
              }
            }

            // Check for Gemini content changes
            const geminiContentChanged =
              updatedSession.geminiContent !== sessionState.geminiContent;

            if (geminiContentChanged && isControllerActive) {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "gemini_chunk",
                      content: updatedSession.geminiContent,
                      progress: Math.min(95, 50 + updatedSession.progress / 2),
                    })}\n\n`
                  )
                );

                // Update local copy
                session.geminiContent = updatedSession.geminiContent;
              } catch (err) {
                console.error("Error sending gemini_chunk:", err);
                isControllerActive = false;
                clearInterval(interval);
                return;
              }
            }

            // Check for completion
            if (updatedSession.isComplete && !sessionState.isComplete) {
              // Send gemini_complete event
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "gemini_complete",
                      content: updatedSession.geminiContent,
                      progress: 95,
                    })}\n\n`
                  )
                );

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

                // Send complete event
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "complete",
                      progress: 100,
                      result: result,
                    })}\n\n`
                  )
                );
              } catch (err) {
                console.error("Error sending gemini_complete:", err);
                isControllerActive = false;
                clearInterval(interval);
                return;
              }
            }

            // Update progress
            if (progressChanged && isControllerActive) {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "status",
                      progress: updatedSession.progress,
                    })}\n\n`
                  )
                );

                // Update local copy
                session.progress = updatedSession.progress;
              } catch (err) {
                console.error("Error sending progress update:", err);
                isControllerActive = false;
                clearInterval(interval);
                return;
              }
            }

            // Update isComplete
            if (updatedSession.isComplete !== sessionState.isComplete) {
              session.isComplete = updatedSession.isComplete;
            }
          } catch (error) {
            console.error("Error checking for session updates:", error);
            // Don't close the stream, just log the error and continue
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
