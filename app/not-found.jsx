"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
        >
          Go Back
        </button>
        <Link
          href="/"
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
