import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Bot,
  Brain,
  Zap,
  CheckCircle,
  AlertCircle,
  Copy,
  Download,
} from "lucide-react";
import type { DetailedAnalysisResult } from "@/types";

interface StreamingData {
  type: string;
  message?: string;
  content?: string;
  progress?: number;
  error?: string;
  result?: DetailedAnalysisResult;
}

interface StreamingAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  businessName: string;
  onComplete: (result: DetailedAnalysisResult) => void;
}

export default function StreamingAnalysisModal({
  isOpen,
  onClose,
  sessionId,
  businessName,
  onComplete,
}: StreamingAnalysisModalProps) {
  const [chatgptContent, setChatgptContent] = useState("");
  const [geminiContent, setGeminiContent] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [chatgptStatus, setChatgptStatus] = useState<
    "pending" | "running" | "complete" | "error"
  >("pending");
  const [geminiStatus, setGeminiStatus] = useState<
    "pending" | "running" | "complete" | "error"
  >("pending");

  const chatgptRef = useRef<HTMLDivElement>(null);
  const geminiRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStreamData = useCallback(
    (data: StreamingData) => {
      // Reset the timeout on each data packet
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (!isComplete && !hasError) {
            setHasError(true);
            setStatus("תם הזמן להשלמת הניתוח. אנא נסה שוב מאוחר יותר.");
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }
          }
        }, 60000); // 1 minute of inactivity
      }

      switch (data.type) {
        case "status":
          setStatus(data.message || "");
          if (data.progress !== undefined) {
            setProgress(data.progress);
          }
          break;

        case "chatgpt_start":
          setChatgptStatus("running");
          setStatus("ChatGPT מנתח את המיזם...");
          break;

        case "chatgpt_chunk":
          setChatgptStatus("running");
          setChatgptContent(data.content || "");
          if (data.progress !== undefined) {
            setProgress(data.progress);
          }
          break;

        case "chatgpt_complete":
          setChatgptStatus("complete");
          setChatgptContent(data.content || "");
          break;

        case "gemini_start":
          setGeminiStatus("running");
          setStatus("Gemini מנתח את המיזם...");
          break;

        case "gemini_chunk":
          setGeminiStatus("running");
          setGeminiContent(data.content || "");
          if (data.progress !== undefined) {
            setProgress(data.progress);
          }
          break;

        case "gemini_complete":
          setGeminiStatus("complete");
          setGeminiContent(data.content || "");
          break;

        case "complete":
          setIsComplete(true);
          setStatus("הניתוח הושלם בהצלחה!");
          setProgress(100);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // Call onComplete with the analysis result
          if (data.result) {
            onComplete(data.result);
          }
          break;

        case "error":
          setHasError(true);
          setStatus(data.error || "שגיאה בניתוח");
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }
          break;

        default:
          console.log("Unknown data type:", data.type);
      }
    },
    [
      isComplete,
      hasError,
      onComplete,
      setStatus,
      setProgress,
      setChatgptStatus,
      setChatgptContent,
      setGeminiStatus,
      setGeminiContent,
      setIsComplete,
      setHasError,
      timeoutRef,
      eventSourceRef,
    ]
  );

  // Use useCallback to memoize the startStreaming function
  const startStreaming = useCallback(async () => {
    try {
      // No need to initialize, session already created
      if (!sessionId) {
        throw new Error("No session ID provided");
      }

      // First perform a HEAD request to check if the session is valid
      const checkResponse = await fetch(
        `/api/analyze/stream?sessionId=${sessionId}`,
        {
          method: "HEAD",
          cache: "no-store",
        }
      );

      if (!checkResponse.ok) {
        throw new Error("Session has expired or is invalid");
      }

      // Set up the EventSource for streaming updates
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create EventSource with special URL parameter to prevent caching
      const url = `/api/analyze/stream?sessionId=${sessionId}&_=${Date.now()}`;

      // Create EventSource
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      let reconnectAttempts = 0;
      const MAX_RECONNECT_ATTEMPTS = 3;

      eventSource.onmessage = (event) => {
        try {
          reconnectAttempts = 0; // Reset reconnect attempts on successful message
          const data: StreamingData = JSON.parse(event.data);
          handleStreamData(data);
        } catch (e) {
          console.error("Failed to parse streaming data:", e);
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        reconnectAttempts++;

        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          // Close the connection and don't try to reconnect after max attempts
          eventSource.close();
          setHasError(true);
          setStatus(
            "שגיאה בחיבור לשירות הניתוח לאחר מספר ניסיונות. אנא נסה שוב מאוחר יותר."
          );
        }
      };
    } catch (error) {
      console.error("Streaming error:", error);
      setHasError(true);
      setStatus(
        error instanceof Error ? error.message : "שגיאה בחיבור לשירות הניתוח"
      );
    }
  }, [sessionId, handleStreamData, setHasError, setStatus]);

  useEffect(() => {
    if (!isOpen) return;

    setChatgptContent("");
    setGeminiContent("");
    setStatus("מתחיל ניתוח...");
    setProgress(0);
    setIsComplete(false);
    setHasError(false);
    setChatgptStatus("pending");
    setGeminiStatus("pending");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    startStreaming();

    // Set a global timeout for the whole analysis process
    timeoutRef.current = setTimeout(() => {
      if (!isComplete && !hasError) {
        setHasError(true);
        setStatus("תם הזמן להשלמת הניתוח. אנא נסה שוב מאוחר יותר.");
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      }
    }, 180000); // 3 minutes max for the entire analysis

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, isComplete, hasError, startStreaming]);

  // Auto-scroll to bottom as content updates
  useEffect(() => {
    if (chatgptRef.current) {
      chatgptRef.current.scrollTop = chatgptRef.current.scrollHeight;
    }
  }, [chatgptContent]);

  useEffect(() => {
    if (geminiRef.current) {
      geminiRef.current.scrollTop = geminiRef.current.scrollHeight;
    }
  }, [geminiContent]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        );
      case "running":
        return (
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        );
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const copyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    // You can add a toast notification here
  };

  const downloadContent = () => {
    const combinedContent = `
# ניתוח Methodian - ${businessName}

## ניתוח ChatGPT:
${chatgptContent}

## ניתוח Gemini:
${geminiContent}

---
נוצר באמצעות Methodian AI Analysis Platform
`;

    const blob = new Blob([combinedContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `methodian-analysis-${businessName}-${
      new Date().toISOString().split("T")[0]
    }.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                ניתוח מתקדם - {businessName}
              </h2>
              <p className="text-gray-400 text-sm">{status}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isComplete && (
              <button
                onClick={downloadContent}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors"
              >
                <Download className="w-4 h-4" />
                הורד דוח
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-sm text-gray-400">התקדמות:</span>
            <span className="text-sm font-medium text-white">{progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          <div className="flex-1 flex flex-col bg-gray-800 rounded-xl border border-gray-600">
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-white">ChatGPT Analysis</span>
                {getStatusIcon(chatgptStatus)}
              </div>
              {chatgptContent && (
                <button
                  onClick={() => copyContent(chatgptContent)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="העתק תוכן"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            <div
              ref={chatgptRef}
              className="flex-1 p-4 overflow-y-auto text-sm text-gray-300 whitespace-pre-wrap"
            >
              {chatgptContent || (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p>ממתין לניתוח ChatGPT...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-gray-800 rounded-xl border border-gray-600">
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-white">Gemini Analysis</span>
                {getStatusIcon(geminiStatus)}
              </div>
              {geminiContent && (
                <button
                  onClick={() => copyContent(geminiContent)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="העתק תוכן"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            <div
              ref={geminiRef}
              className="flex-1 p-4 overflow-y-auto text-sm text-gray-300 whitespace-pre-wrap"
            >
              {geminiContent || (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Brain className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p>ממתין לניתוח Gemini...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {(isComplete || hasError) && (
          <div className="border-t border-gray-700 p-6">
            <div className="flex items-center justify-center gap-4">
              {isComplete ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-green-400 font-medium">
                    ניתוח הושלם בהצלחה! כעת תוכל לסגור ולראות את התוצאות
                    המסוכמות.
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <span className="text-red-400 font-medium">
                    אירעה שגיאה בתהליך הניתוח. אנא נסה שנית.
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
