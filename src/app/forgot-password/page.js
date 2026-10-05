"use client";

import { useState } from "react";
import Link from "next/link";
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { authService } from "@/services/authService";
import { Input, Button, Card } from "@/components/common";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(
        err.data?.error || err.message || "Something went wrong. Please try again.",
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
            AI Shop
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Forgot Password?
          </h2>
          <p className="mt-2 text-gray-600">
            {sent
              ? "Check your inbox for a reset link"
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <Card className="p-8">
          {sent ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <FaCheckCircle className="text-3xl text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Email Sent
                </h3>
                <p className="text-sm text-gray-600">
                  If an account exists for{" "}
                  <span className="font-medium text-gray-900">{email}</span>, we
                  sent a password reset link. The link is valid for 1 hour.
                </p>
                <p className="text-xs text-gray-500">
                  Didn&apos;t receive the email? Check your spam folder or try
                  again.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSent(false);
                    setError("");
                  }}
                >
                  Try another email
                </Button>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <FaArrowLeft className="text-xs" />
                  Back to Sign In
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
                label="Email Address"
                name="email"
                type="email"
                placeholder="you@example.com"
                icon={<FaEnvelope />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" className="w-full" loading={loading}>
                Send Reset Link
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <FaArrowLeft className="text-xs" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}