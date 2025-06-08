import dbConnect from "./mongodb";
import { AnalysisSession, IAnalysisSession } from "./mongodb";

const SESSION_EXPIRY_MINUTES = 30;

export async function createSession(sessionData: {
  sessionId: string;
  prompt: string;
  businessName: string;
}): Promise<IAnalysisSession> {
  await dbConnect();

  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + SESSION_EXPIRY_MINUTES);

  const newSession = new AnalysisSession({
    sessionId: sessionData.sessionId,
    prompt: sessionData.prompt,
    businessName: sessionData.businessName,
    progress: 0,
    chatgptContent: "",
    geminiContent: "",
    isComplete: false,
    createdAt: new Date(),
    expiresAt: expiryDate,
  });

  await newSession.save();
  console.log(
    `Session created: ${sessionData.sessionId}, expires: ${expiryDate}`
  );

  return newSession;
}

export async function getSession(
  sessionId: string
): Promise<IAnalysisSession | null> {
  await dbConnect();

  const session = await AnalysisSession.findOne({ sessionId });
  return session;
}

export async function updateSession(
  sessionId: string,
  updates: Partial<IAnalysisSession>
): Promise<IAnalysisSession | null> {
  await dbConnect();

  if (updates.sessionId) {
    delete updates.sessionId;
  }

  const session = await AnalysisSession.findOneAndUpdate(
    { sessionId },
    { $set: updates },
    { new: true }
  );

  return session;
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  await dbConnect();

  const result = await AnalysisSession.deleteOne({ sessionId });
  return result.deletedCount === 1;
}

export async function validateSession(
  sessionId: string | null
): Promise<boolean> {
  if (!sessionId) return false;

  await dbConnect();

  const session = await AnalysisSession.findOne({ sessionId });
  return !!session;
}

export async function cleanupOldSessions(): Promise<number> {
  await dbConnect();

  const now = new Date();
  const result = await AnalysisSession.deleteMany({ expiresAt: { $lt: now } });

  console.log(`Cleaned up ${result.deletedCount} expired sessions`);
  return result.deletedCount;
}
