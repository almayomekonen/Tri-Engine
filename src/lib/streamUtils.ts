import { TextEncoder } from "util";
import { DetailedAnalysisResult } from "@/types";

/**
 * יוצר סטרים עם תווים יחידים במקום בלוקים שלמים לדמות את הצ'אט של ChatGPT
 * @param text הטקסט שצריך להציג בהדרגה
 * @param chunkSize כמות התווים בכל חלק
 * @param delayMs השהייה בין החלקים במילישניות
 * @returns מערך של אובייקטים עם חלקי תוכן
 */
export function createProgressiveChunks(
  text: string,
  chunkSize = 3,
  delayMs = 5
): Array<{ content: string; delay: number }> {
  const chunks: Array<{ content: string; delay: number }> = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    const end = Math.min(currentPosition + chunkSize, text.length);
    const chunk = text.substring(0, end); // תמיד שולח את כל התוכן עד לנקודה הנוכחית
    chunks.push({ content: chunk, delay: delayMs });
    currentPosition = end;
  }

  return chunks;
}

/**
 * שולח הודעת SSE לסטרים
 * @param controller בקר הסטרים
 * @param encoder מקודד טקסט
 * @param type סוג ההודעה
 * @param data נתוני ההודעה
 * @returns האם השליחה הצליחה
 */
export function sendSSEMessage(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  type: string,
  data: Record<string, unknown>
): boolean {
  try {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
    );
    return true;
  } catch (error) {
    // לא להעלות שגיאה במקרה של controller סגור - זה מצב תקין כשהמשתמש מתנתק
    if (
      error instanceof TypeError &&
      error.message.includes("Controller is already closed")
    ) {
      console.warn(`Client disconnected, cannot send message of type ${type}`);
    } else {
      console.error(`Error sending SSE message of type ${type}:`, error);
    }
    return false;
  }
}

/**
 * שולח תוכן של מנוע AI בצורה הדרגתית
 * @param controller בקר הסטרים
 * @param encoder מקודד טקסט
 * @param engineType סוג המנוע (chatgpt/gemini)
 * @param content תוכן מלא לשליחה
 * @param progressStart אחוז התקדמות התחלתי
 * @param progressEnd אחוז התקדמות סופי
 */
export async function streamEngineContent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  engineType: "chatgpt" | "gemini",
  content: string,
  progressStart: number,
  progressEnd: number
): Promise<boolean> {
  try {
    // יצירת שברי תוכן קטנים לסטרימינג הדרגתי
    const chunks = createProgressiveChunks(content);
    const totalChunks = chunks.length;

    for (let i = 0; i < chunks.length; i++) {
      const { content: chunkContent, delay } = chunks[i];

      // חישוב אחוז ההתקדמות היחסי
      const progressRatio = i / totalChunks;
      const currentProgress = Math.floor(
        progressStart + (progressEnd - progressStart) * progressRatio
      );

      // שליחת החלק הנוכחי - אם נכשל, הפסק את הסטרימינג
      const success = sendSSEMessage(
        controller,
        encoder,
        `${engineType}_chunk`,
        {
          content: chunkContent,
          progress: currentProgress,
        }
      );

      if (!success) {
        console.warn(`Stopping ${engineType} stream due to send failure`);
        return false;
      }

      // המתנה לפני שליחת החלק הבא
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // שליחת אירוע סיום
    sendSSEMessage(controller, encoder, `${engineType}_complete`, {
      content,
      progress: progressEnd,
    });

    return true;
  } catch (error) {
    console.error(`Error streaming ${engineType} content:`, error);
    return false;
  }
}

/**
 * יצירת אובייקט תוצאה מפורט לשליחה בסיום הניתוח
 */
export function createResultObject(
  sessionId: string,
  chatgptContent: string,
  geminiContent: string
): DetailedAnalysisResult {
  return {
    ventureId: sessionId,
    score: 75, // ציון ברירת מחדל - ניתן לחשב על בסיס הניתוח
    maxScore: 105,
    progressPercentage: 100,
    results: {
      chatgpt: chatgptContent,
      gemini: geminiContent,
    },
    comprehensive: "ניתוח מקיף משולב יתווסף בעתיד",
    savedAt: new Date(),
  };
}
