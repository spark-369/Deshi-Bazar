"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FaLock, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { authService } from "@/services";
import { Input, Button, Card } from "@/components/common";

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid password reset link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await authService.resetPassword(token, password);
      setSuccess(
        result.message ||
          "Your password has been reset successfully. You can now log in.",
      );
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.data?.error || err.message || "Failed to reset password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            Deshi Bazar
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <Card className="p-8">
          {success ? (
            <div className="space-y-6 text-center">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <FaCheckCircle className="mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
              <p className="text-sm text-gray-600">
                Redirecting to login...
              </p>
              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <FaArrowLeft className="text-xs" />
                  Go to login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Input
                label="New Password"
                name="password"
                type="password"
                placeholder="••••••••"
                icon={<FaLock />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />

              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                icon={<FaLock />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button type="submit" className="w-full" loading={loading}>
                Reset Password
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <FaArrowLeft className="text-xs" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-gray-50" />}
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
