import { getSession } from "./mongodb";

/**
 * בודק תקינות סשן לפי מזהה
 *
 * @param sessionId מזהה סשן לבדיקה
 * @returns האם הסשן תקין וקיים
 */
export async function validateSession(
  sessionId: string | null
): Promise<boolean> {
  try {
    if (!sessionId) {
      return false;
    }

    const session = await getSession(sessionId);
    return !!session;
  } catch (error) {
    console.error(`Session validation error for ${sessionId}:`, error);
    return false;
  }
}
