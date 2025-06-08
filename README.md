# Methodian Deep Research | ניתוח עסקי מעמיק

פלטפורמת Methodian מציעה פתרון מבוסס AI לליווי יזמים בשלבים מוקדמים, עם דגש על מחקר, ולידציה, ותכנון MVP.

## אופטימיזציות ביצועים

הפרויקט כולל מספר אופטימיזציות לשיפור הביצועים:

- **דחיסת קבצים**: שימוש ב-compression-webpack-plugin לדחיסת קבצי JS, CSS, HTML ו-SVG
- **הסרת קונסולות בפרודקשן**: הסרה אוטומטית של console.log בסביבת פרודקשן
- **אופטימיזציית CSS**: שימוש ב-critters להזרקת CSS קריטי inline
- **ניתוח Bundle**: כלי לניתוח גודל ה-bundle (`npm run analyze`)
- **קאשינג מתקדם**: הגדרות קאש אופטימליות עבור נכסים סטטיים

## פקודות שימושיות

```bash
# התקנת תלויות
npm install

# הרצת סביבת פיתוח
npm run dev

# בניית גרסת פרודקשן
npm run build

# הרצת גרסת פרודקשן
npm run start

# ניתוח גודל ה-bundle
npm run analyze
```

## מבנה הפרויקט

הפרויקט משתמש בארכיטקטורת App Router של Next.js עם API Routes לניתוח עסקי מבוסס AI.

## הגדרה

1. התקן את התלויות:

```bash
npm install
```

2. צור קובץ `.env.local` וקבע את מפתחות ה-API הבאים:

```
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key
```

3. הפעל את השרת:

```bash
npm run dev
```

## מבנה המערכת

- **דף ראשי**: תבנית הקלט של המידע העסקי וקבלת הניתוח
- **מנועי ניתוח**: מערכת משלבת ניתוח מ-Gemini ומ-ChatGPT
- **תצוגת UI**: ממשק להצגת הניתוחים מכל מנוע

## טכנולוגיות

- Next.js
- React
- Tailwind CSS
- Google Gemini API
- OpenAI API

## תכונות

- ניתוח עסקי מקיף על בסיס מתודולוגיית Methodian
- ניתוח מקביל מכמה מנועי AI
- ממשק משתמש מודרני ואינטואיטיבי
- תמיכה בעברית מלאה

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
