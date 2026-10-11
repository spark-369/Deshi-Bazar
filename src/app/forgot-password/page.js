"use client";

import { useState } from "react";
import Link from "next/link";
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { authService } from "@/services";
import { Input, Button, Card } from "@/components/common";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await authService.forgotPassword(email);
      setSuccess(
        result.message ||
          "If an account with that email exists, a password reset link has been sent.",
      );
      setEmail("");
    } catch (err) {
      setError(
        err.data?.error || err.message || "Failed to send reset email. Please try again.",
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
            Forgot Password
          </h2>
          <p className="mt-2 text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <FaCheckCircle className="mt-0.5 flex-shrink-0" />
                <span>{success}</span>
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
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <FaArrowLeft className="text-xs" />
                Back to login
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
