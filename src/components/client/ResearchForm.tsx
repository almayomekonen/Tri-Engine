"use client";

import { useState } from "react";
import type { FormData } from "@/types";

interface ResearchFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  loading: boolean;
}

export default function ResearchForm({ onSubmit, loading }: ResearchFormProps) {
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    problem: "",
    solution: "",
    targetMarket: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 rounded-xl p-6 shadow-lg space-y-6 mb-8"
    >
      <h2 className="text-2xl font-bold mb-6 text-center border-b border-gray-700 pb-4">
        פרטי המיזם שלך
      </h2>

      <div>
        <label className="block text-sm font-medium mb-2 text-blue-300">
          שם העסק/רעיון
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-700 rounded-lg bg-gray-900 text-white"
          value={formData.businessName}
          onChange={(e) =>
            setFormData({ ...formData, businessName: e.target.value })
          }
          required
          placeholder="שם העסק או הרעיון שלך"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-blue-300">
          איזו בעיה אתה פותר?
        </label>
        <textarea
          className="w-full p-3 border border-gray-700 rounded-lg h-24 bg-gray-900 text-white"
          value={formData.problem}
          onChange={(e) =>
            setFormData({ ...formData, problem: e.target.value })
          }
          required
          placeholder="תאר את הבעיה שהמיזם שלך פותר בצורה מפורטת"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-blue-300">
          מה הפתרון שלך?
        </label>
        <textarea
          className="w-full p-3 border border-gray-700 rounded-lg h-24 bg-gray-900 text-white"
          value={formData.solution}
          onChange={(e) =>
            setFormData({ ...formData, solution: e.target.value })
          }
          required
          placeholder="תאר כיצד המוצר או השירות שלך פותר את הבעיה"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-blue-300">
          מי קהל היעד?
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-700 rounded-lg bg-gray-900 text-white"
          value={formData.targetMarket}
          onChange={(e) =>
            setFormData({ ...formData, targetMarket: e.target.value })
          }
          required
          placeholder="תאר את קהל היעד שלך בצורה ספציפית"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition transform hover:scale-[1.01] mt-4"
      >
        {loading ? "מנתח..." : "התחל ניתוח Deep Research"}
      </button>
    </form>
  );
}
