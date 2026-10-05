"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaEnvelope, FaLock, FaPhone, FaShieldAlt, FaCheckCircle } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { Input, Button, Card } from "@/components/common";

export default function LoginPage() {
  const router = useRouter();
  const { login, verify2FA } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
    latitude: null,
    longitude: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAEmail, setTwoFAEmail] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      // Automatically capture location on submit
      let latitude = formData.latitude;
      let longitude = formData.longitude;

      if (
        latitude == null &&
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 8000,
              enableHighAccuracy: true,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch {
          // Geolocation failed or denied — continue without it
        }
      }

      try {
        const result = await login({
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          latitude,
          longitude,
        });

        if (result.requires2FA) {
          setRequires2FA(true);
          setTempToken(result.tempToken);
          setTwoFAEmail(result.email);
        } else {
          router.push("/");
        }
      } catch (err) {
        setError(
          err.data?.error || err.message || "Login failed. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [formData, login, router],
  );

  const handle2FASubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        const result = await verify2FA(tempToken, twoFACode);
        router.push("/");
      } catch (err) {
        setError(
          err.data?.error || err.message || "2FA verification failed. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [tempToken, twoFACode, verify2FA, router],
  );

  const handleResendCode = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tempToken}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to resend code");
      }
    } catch (err) {
      setError(err.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  }, [tempToken]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            AI Shop
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            {requires2FA ? "Two-Factor Authentication" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-gray-600">
            {requires2FA
              ? `Enter the 6-digit code sent to ${twoFAEmail}`
              : "Sign in to your account"}
          </p>
        </div>

        <Card className="p-8">
          {!requires2FA ? (
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
                value={formData.email}
                onChange={handleChange}
                required
              />

              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                icon={<FaPhone />}
                value={formData.phone}
                onChange={handleChange}
              />

              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                icon={<FaLock />}
                value={formData.password}
                onChange={handleChange}
                required
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handle2FASubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                  <FaShieldAlt className="text-3xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-600">
                  We sent a 6-digit verification code to
                </p>
                <p className="text-sm font-semibold text-blue-600 mt-1">
                  {twoFAEmail}
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5, 6].map((digit) => (
                    <div
                      key={digit}
                      className="w-10 h-12 bg-white border-2 border-blue-200 rounded-lg flex items-center justify-center text-lg font-bold text-gray-900 shadow-sm"
                    >
                      {twoFACode[digit - 1] || ""}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-center text-gray-500">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <Input
                label=""
                name="code"
                type="text"
                placeholder="000000"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                required
                className="text-center text-2xl tracking-widest"
              />

              <Button type="submit" className="w-full" loading={loading}>
                <FaCheckCircle className="mr-2" />
                Verify & Sign In
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 transition-colors"
                >
                  <FaShieldAlt className="text-xs" />
                  Didn't receive the code? Resend
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {requires2FA ? (
                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false);
                    setTempToken(null);
                    setTwoFACode("");
                    setTwoFAEmail("");
                    setError("");
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Back to login
                </button>
              ) : (
                <>
                  Don't have an account?{" "}
                  <Link
                    href="/register"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
