function cleanAnalysisOutput(analysis: string): string {
  if (!analysis) return analysis;

  return analysis

    .replace(/<strong>(.*?)<\/strong>/g, "$1")
    .replace(/<b>(.*?)<\/b>/g, "$1")
    .replace(/<em>(.*?)<\/em>/g, "$1")
    .replace(/<i>(.*?)<\/i>/g, "$1")
    .replace(/<u>(.*?)<\/u>/g, "$1")
    .replace(/<code>(.*?)<\/code>/g, "$1")
    .replace(/<pre>(.*?)<\/pre>/g, "$1")

    .replace(/<h[1-6]>(.*?)<\/h[1-6]>/g, "$1")

    .replace(/<ul>/g, "")
    .replace(/<\/ul>/g, "")
    .replace(/<ol>/g, "")
    .replace(/<\/ol>/g, "")
    .replace(/<li>(.*?)<\/li>/g, "- $1")

    .replace(/<a href="(.*?)">(.*?)<\/a>/g, "$2")

    .replace(/<[^>]*>/g, "")

    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")

    .replace(/^#{1,6}\s+/gm, "")

    .replace(/^\s*[-\*\+]\s+/gm, "- ")
    .replace(/^\s*\d+\.\s+/gm, "")

    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")

    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "$1")

    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/^\s+|\s+$/gm, "")
    .trim();
}

export async function runChatGPTAnalysis(prompt: string): Promise<string> {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelay * attempt)
        );
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
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
                  "אתה מומחה ניתוח עסקי מהדרג הגבוה ביותר המבצע ניתוח מדויק לפי מתודולוגיית Methodian Feasibility. אתה מקפיד על דיוק מתמטי מוחלט בחישוב ציונים ומתבסס אך ורק על הנתונים המסופקים. כל ציון שאתה נותן חייב להיות מוצדק ומבוסס על איכות התוכן בפועל. השב בטקסט רגיל ללא כל עיצוב, HTML או Markdown.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 16000,
            temperature: 0.1,
            top_p: 0.9,
            frequency_penalty: 0.1,
            presence_penalty: 0.1,
          }),
        }
      );

      if (response.status === 429) {
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, baseDelay * attempt * 2)
          );
          continue;
        }
        throw new Error("ChatGPT API rate limit exceeded after retries");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `ChatGPT API error: ${response.statusText} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      const data = await response.json();
      const analysis = data.choices?.[0]?.message?.content;

      if (!analysis) {
        throw new Error("ChatGPT returned empty analysis");
      }

      // ניקוי הפלט לטקסט נקי
      return cleanAnalysisOutput(analysis);
    } catch (error) {
      if (attempt === maxRetries) {
        if (error instanceof Error && error.message.includes("rate limit")) {
          return `ניתוח ChatGPT זמנית לא זמין

מערכת ChatGPT עמוסה כרגע

הניתוח נוצר באמצעות Gemini Pro בלבד. 
תוכל לנסות שוב מאוחר יותר לקבלת ניתוח משולב.`;
        }

        return `שגיאה בניתוח ChatGPT

לא הצלחנו להתחבר לשירות ChatGPT

שגיאה: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`;
      }
    }
  }

  return "שגיאה בניתוח ChatGPT: מספר ניסיונות מוצו";
}

export async function runGeminiAnalysis(prompt: string): Promise<string> {
  const maxRetries = 3;
  const baseDelay = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelay * attempt)
        );
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-06-05:generateContent?key=${process.env.GEMINI_API_KEY}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `אתה מומחה ניתוח עסקי ברמה הגבוהה ביותר המבצע Deep Research מקיף באמצעות יכולות החשיבה המתקדמות שלך. אתה מקפיד על דיוק מתמטי מוחלט בחישוב ציונים ומתבסס אך ורק על הנתונים המסופקים.

בצע ניתוח עמוק ומקיף עם חשיבה אנליטית מתקדמת. השתמש בכל יכולות הניתוח העסקי שלך, כולל:
- ניתוח רב-ממדי של מודלים עסקיים
- הערכה קריטית של הנחות שוק
- חשיבה אסטרטגית ארוכת טווח
- זיהוי סיכונים נסתרים והזדמנויות

חשוב: השב בטקסט רגיל ללא כל עיצוב, HTML, Markdown או תווי פורמט מיוחדים.

${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 65536,
          temperature: 0.05,
          topP: 0.85,
          topK: 40,
          candidateCount: 1,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: "אתה מומחה ניתוח עסקי עם יכולות חשיבה אנליטית מתקדמת. השתמש בחשיבה עמוקה ושיטתית לניתוח כל היבט של המיזם העסקי. השב בטקסט רגיל בלבד ללא כל עיצוב.",
            },
          ],
        },
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 429) {
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, baseDelay * attempt * 2)
          );
          continue;
        }
        throw new Error("Gemini Pro API rate limit exceeded after retries");
      }

      if (response.status === 503) {
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, baseDelay * attempt * 2)
          );
          continue;
        }
        throw new Error("Gemini Pro service temporarily unavailable");
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: "Failed to parse error response" };
        }

        if (errorData.error?.message?.includes("SAFETY")) {
          throw new Error("Content blocked by Gemini Pro safety filters");
        }

        if (errorData.error?.message?.includes("QUOTA")) {
          throw new Error("Gemini Pro quota exceeded");
        }

        if (errorData.error?.message?.includes("API_KEY")) {
          throw new Error("Gemini Pro API key invalid");
        }

        throw new Error(
          `Gemini Pro API error: ${response.statusText} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
      }

      const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!analysis) {
        throw new Error("Gemini Pro returned empty analysis");
      }

      // ניקוי הפלט לטקסט נקי
      return cleanAnalysisOutput(analysis);
    } catch (error) {
      if (attempt === maxRetries) {
        if (error instanceof Error && error.message.includes("rate limit")) {
          return `ניתוח Gemini Pro זמנית לא זמין

מערכת Gemini Pro עמוסה כרגע

הניתוח נוצר באמצעות ChatGPT-4o בלבד. 
תוכל לנסות שוב מאוחר יותר לקבלת ניתוח משולב.`;
        }

        if (error instanceof Error && error.message.includes("quota")) {
          return `מיצוי מכסת Gemini Pro

מכסת השימוש ב-Gemini Pro מוצתה

הניתוח נוצר באמצעות ChatGPT-4o בלבד. 
המכסה תתחדש בהתאם לתוכנית שלך.`;
        }

        if (
          error instanceof Error &&
          error.message.includes("safety filters")
        ) {
          return `ניתוח Gemini Pro נחסם

התוכן נחסם על ידי מסנני הבטיחות של Gemini Pro

זה יכול לקרות עם תוכן עסקי מסוים. הניתוח נוצר באמצעות ChatGPT-4o בלבד.`;
        }

        if (error instanceof Error && error.message.includes("API key")) {
          return `בעיית API Key של Gemini Pro

API Key לא תקין או חסר

הניתוח נוצר באמצעות ChatGPT-4o בלבד.
אנא בדוק את הגדרות ה-API Key.`;
        }

        return `שגיאה בניתוח Gemini Pro

לא הצלחנו להתחבר לשירות Gemini Pro

שגיאה: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`;
      }
    }
  }

  return "שגיאה בניתוח Gemini Pro: מספר ניסיונות מוצו";
}

export async function runGeminiExperimentalAnalysis(
  prompt: string
): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `אתה מומחה ניתוח עסקי ברמה הגבוהה ביותר עם יכולות חשיבה אדפטיבית מתקדמת. בצע ניתוח Deep Research מקיף. השב בטקסט רגיל בלבד ללא עיצוב.

${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 32768,
            temperature: 0.05,
            topP: 0.9,
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (analysis) {
        return cleanAnalysisOutput(analysis);
      }
    }
  } catch (error) {
    console.log(error);
  }

  return runGeminiAnalysis(prompt);
}
