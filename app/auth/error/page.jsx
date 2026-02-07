"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const prettyError =
    {
      AccessDenied: "Access denied. Your account is not authorized.",
      OAuthSignin: "Error connecting to Google. Try again.",
      OAuthCallback: "Google callback failed.",
      OAuthCreateAccount: "Could not create account.",
      EmailSignin: "Email sign-in error.",
      CredentialsSignin: "Invalid credentials.",
      Default: "An unknown error occurred.",
    }[error] || "An unknown error occurred.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>

        <p className="text-gray-700 mb-6">{prettyError}</p>

        <Link
          href="/auth/signin"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go back to Sign In
        </Link>
      </div>
    </div>
  );
}
