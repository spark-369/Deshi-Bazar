"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaStore,
  FaUserShield,
  FaBox,
  FaArrowRight,
  FaShieldAlt,
  FaBolt,
  FaPhone,
  FaCheckCircle,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { Input, Button, Card } from "@/components/common";

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, verify2FA } = useAuth();

  const defaultRole = searchParams.get("role")?.toUpperCase() || "BUYER";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: defaultRole,
    latitude: null,
    longitude: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAEmail, setTwoFAEmail] = useState("");

  useEffect(() => {
    setFormData((prev) => ({ ...prev, role: defaultRole }));
  }, [defaultRole]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const passwordChecks = [
    { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
    { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
    { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
    { id: "number", label: "One number", test: (v) => /\d/.test(v) },
    {
      id: "special",
      label: "One special character",
      test: (v) => /[^A-Za-z0-9]/.test(v),
    },
  ];

  const passedChecks = passwordChecks.filter((c) =>
    c.test(formData.password),
  ).length;
  const passwordScore = Math.round((passedChecks / passwordChecks.length) * 100);

  const strengthLevels = [
    { label: "Too weak", color: "bg-red-500", text: "text-red-600" },
    { label: "Weak", color: "bg-orange-500", text: "text-orange-600" },
    { label: "Fair", color: "bg-yellow-500", text: "text-yellow-600" },
    { label: "Good", color: "bg-lime-500", text: "text-lime-600" },
    { label: "Strong", color: "bg-green-500", text: "text-green-600" },
  ];
  const strength =
    passwordScore === 0
      ? null
      : strengthLevels[Math.min(Math.ceil(passedChecks / 1) - 1, 4)];

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

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

      setLoading(true);

      try {
        const result = await register({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          latitude,
          longitude,
          enable2FA: true,
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
          err.data?.error ||
            err.message ||
            "Registration failed. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [formData, register, router],
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

  const roles = [
    {
      value: "BUYER",
      label: "Buyer",
      description: "Shop and buy products",
      icon: <FaUser className="text-2xl" />,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      value: "SELLER",
      label: "Seller",
      description: "List and sell products",
      icon: <FaStore className="text-2xl" />,
      gradient: "from-green-500 to-emerald-600",
    },
    {
      value: "ADMIN",
      label: "Admin",
      description: "Manage the platform",
      icon: <FaUserShield className="text-2xl" />,
      gradient: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Info */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg mb-3">
              <FaBox className="text-3xl text-white" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
              {defaultRole === "SELLER"
                ? "Start Selling Today"
                : "Create Your Account"}
            </h1>

            <p className="text-md text-gray-600 mb-3 leading-snug max-w-xl">
              {defaultRole === "SELLER"
                ? "Join thousands of sellers on our AI-powered marketplace."
                : "Join our AI-powered marketplace for smart shopping."}
            </p>
          </div>

          <Card className="p-5">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {!requires2FA ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  I want to register as:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((role) => (
                    <label
                      key={role.value}
                      className={`
                        cursor-pointer border-2 rounded-lg p-3 text-center transition-all duration-300 relative overflow-hidden group
                        ${
                          formData.role === role.value
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div
                        className={`mx-auto mb-1.5 w-8 h-8 rounded-lg flex items-center justify-center ${formData.role === role.value ? role.gradient : "bg-gray-100"} text-white`}
                      >
                        {role.icon}
                      </div>
                      <div className="text-xs font-semibold text-gray-900">
                        {role.label}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                        {role.description}
                      </div>
                      {formData.role === role.value && (
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      )}
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 mt-6">
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    icon={<FaUser />}
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    icon={<FaEnvelope />}
                    required
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    icon={<FaPhone />}
                  />

                  <div>
                    <Input
                      label="Password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      icon={<FaLock />}
                      required
                    />

                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                strength?.color || "bg-gray-200"
                              }`}
                              style={{ width: `${passwordScore}%` }}
                            ></div>
                          </div>
                          {strength && (
                            <span
                              className={`text-xs font-semibold ${strength.text}`}
                            >
                              {strength.label}
                            </span>
                          )}
                        </div>

                        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                          {passwordChecks.map((check) => {
                            const passed = check.test(formData.password);
                            return (
                              <li
                                key={check.id}
                                className={`flex items-center gap-1.5 text-xs ${
                                  passed
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {passed ? (
                                  <FaCheck className="w-3 h-3" />
                                ) : (
                                  <FaTimes className="w-3 h-3" />
                                )}
                                {check.label}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div>
                    <Input
                      label="Confirm Password"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      icon={<FaLock />}
                      required
                    />

                    {formData.confirmPassword && (
                      <p
                        className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${
                          formData.password === formData.confirmPassword
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {formData.password === formData.confirmPassword ? (
                          <>
                            <FaCheck className="w-3 h-3" />
                            Passwords match
                          </>
                        ) : (
                          <>
                            <FaTimes className="w-3 h-3" />
                            Passwords do not match
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={loading}
                  >
                    Create Account
                  </Button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 group"
                    >
                      Sign in
                      <FaArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handle2FASubmit} className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                    <FaShieldAlt className="text-3xl text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Verify Your Email
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
                  Verify & Create Account
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

            {defaultRole === "SELLER" && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  By creating a seller account, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// useSearchParams must be rendered inside a Suspense boundary for the page to
// be prerenderable at build time (required for `next build` to succeed).
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <RegisterPageInner />
    </Suspense>
  );
}
