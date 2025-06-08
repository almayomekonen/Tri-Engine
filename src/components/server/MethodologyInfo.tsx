import { Brain, Target, Zap } from "lucide-react";

export default function MethodologyInfo() {
  return (
    <div className="lg:col-span-1 bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-blue-400">
            מתודולוגיית Methodian
          </h2>
        </div>

        <div className="text-sm text-gray-300 space-y-3">
          <p className="text-gray-200 font-medium">
            ניתוח מקצועי מבוסס 7 קטגוריות עיקריות עם ציון עד 105 נקודות:
          </p>

          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>
                <strong>מידע אישי</strong> - רקע המייסד והנסיון
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>
                <strong>הבנת הבעיה</strong> - עומק הצורך ודחיפות הפתרון
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>
                <strong>הצעת הערך</strong> - בידול ויתרון תחרותי
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>
                <strong>וולידציה</strong> - הוכחת הביקוש והתאמה לשוק
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>
                <strong>ניתוח שוק</strong> - TAM/SAM/SOM ותחרות
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
              <span>
                <strong>צוות ויכולות</strong> - התאמת הצוות למשימה
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>
                <strong>ניסיון עסקי</strong> - רקע יזמי ומקצועי
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-3 text-blue-300 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          מנועי ה-AI
        </h3>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
            <span>ChatGPT-4</span>
            <span className="text-green-400">✓ פעיל</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
            <span>Gemini Pro</span>
            <span className="text-yellow-400">⚠ בבדיקה</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
            <span>ניתוח משולב</span>
            <span className="text-blue-400">📊 Tri-Engine</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-3 text-blue-300 flex items-center gap-2">
          <Target className="w-4 h-4" />
          איך זה עובד?
        </h3>
        <ol className="text-sm text-gray-300 list-decimal list-inside space-y-2">
          <li>מלא שאלון מותאם אישית (46-70 שאלות)</li>
          <li>בחר שאלות לפי הרלוונטיות למיזם שלך</li>
          <li>הניתוח מעובד דרך מנועי AI מתקדמים</li>
          <li>קבל דוח מקיף עם ציון 0-105 נקודות</li>
          <li>המלצות פעולה ספציפיות למיזם שלך</li>
        </ol>
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <p className="text-xs text-blue-300 text-center">
          💡 מערכת הניתוח מבוססת על מחקר של 500+ יזמים וניסיון של מומחי
          Methodian
        </p>
      </div>
    </div>
  );
}
