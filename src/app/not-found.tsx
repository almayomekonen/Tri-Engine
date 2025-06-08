import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold mb-4">404 - דף לא נמצא</h1>
      <p className="mb-6">העמוד המבוקש לא נמצא.</p>
      <Link href="/" className="text-blue-500 hover:underline">
        חזרה לדף הבית
      </Link>
    </div>
  );
}
