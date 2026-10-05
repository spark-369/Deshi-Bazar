"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@/components/common";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaShoppingCart,
  FaStar,
  FaStore,
  FaExclamationTriangle,
} from "react-icons/fa";

const RISK_BADGES = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-green-100 text-green-700",
};

const ROLE_BADGES = {
  ADMIN: "bg-purple-100 text-purple-700",
  SELLER: "bg-blue-100 text-blue-700",
  BUYER: "bg-green-100 text-green-700",
};

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = params?.id;

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError("");
      const data = await adminService.getUser(userId);
      setDetail(data);
    } catch (err) {
      setError(err?.data?.error || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
      router.push("/login");
      return;
    }
    if (isAuthenticated && user?.role === "ADMIN") {
      fetchUser();
    }
  }, [authLoading, isAuthenticated, user, router, fetchUser]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
            Loading user details...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/users")}
            className="mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Users
          </Button>
          <Card className="text-center py-12">
            <p className="text-red-600 font-medium mb-2">{error}</p>
            <p className="text-gray-500 text-sm">
              The user may have been deleted or the link is invalid.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  const profile = detail.profile || {};
  const churn = detail.churnPrediction;
  const counts = detail._count || {};

  const churnScorePct = churn
    ? Math.round((churn.churnScore || 0) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/users")}
          >
            <FaArrowLeft className="mr-2" />
            Back
          </Button>
          <span className="text-xs sm:text-sm text-gray-500 truncate ml-2">
            ID: {detail.id}
          </span>
        </div>

        {/* Profile Header Card */}
        <Card className="mb-4 sm:mb-6">
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FaUser className="text-blue-600 text-2xl sm:text-3xl" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {detail.name || "Unnamed User"}
                </h1>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 truncate">
                  <FaEnvelope className="flex-shrink-0" />
                  {detail.email}
                </p>
                {detail.phone && (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 truncate">
                    <FaPhone className="flex-shrink-0" />
                    {detail.phone}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                <span
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    ROLE_BADGES[detail.role] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {detail.role}
                </span>
                {detail.isVerified ? (
                  <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-700 flex items-center gap-1">
                    <FaCheckCircle /> Verified
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                    <FaTimesCircle /> Unverified
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            icon={<FaShoppingCart className="text-blue-600" />}
            label="Orders"
            value={counts.orders ?? 0}
          />
          <StatCard
            icon={<FaStar className="text-yellow-500" />}
            label="Reviews"
            value={counts.reviews ?? 0}
          />
          <StatCard
            icon={<FaShieldAlt className="text-purple-600" />}
            label="Total Spent"
            value={`Tk.${(profile.totalSpent || 0).toFixed(2)}`}
          />
          <StatCard
            icon={<FaStore className="text-green-600" />}
            label="Purchases"
            value={profile.purchaseCount ?? 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <DetailRow label="Name" value={detail.name || "N/A"} />
                <DetailRow
                  label="Email"
                  value={detail.email}
                  className="break-all"
                />
                <DetailRow label="Phone" value={detail.phone || "N/A"} />
                <DetailRow label="Role" value={detail.role} />
                <DetailRow
                  label="Verified"
                  value={detail.isVerified ? "Yes" : "No"}
                />
                <DetailRow
                  label="2FA Enabled"
                  value={detail.twoFactorEnabled ? "Yes" : "No"}
                />
                <DetailRow
                  label="Joined"
                  value={new Date(detail.createdAt).toLocaleString()}
                />
              </dl>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <DetailRow label="Bio" value={profile.bio || "N/A"} />
                <DetailRow
                  label="Address"
                  value={profile.address || "N/A"}
                />
                <DetailRow
                  label="City / District"
                  value={profile.city || profile.district || "N/A"}
                />
                <DetailRow
                  label="Division"
                  value={profile.division || "N/A"}
                />
                <DetailRow
                  label="Country"
                  value={profile.country || "N/A"}
                />
                <DetailRow
                  label="Postal Code"
                  value={profile.postalCode || profile.zipCode || "N/A"}
                />
                <DetailRow
                  label="Last Purchase"
                  value={
                    profile.lastPurchaseDate
                      ? new Date(profile.lastPurchaseDate).toLocaleDateString()
                      : "N/A"
                  }
                />
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Churn Prediction */}
        {churn && (
          <Card className="mt-4 sm:mt-6 border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaExclamationTriangle className="text-yellow-500" />
                Churn Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start ${
                    RISK_BADGES[churn.riskLevel] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {churn.riskLevel} RISK
                </span>
                <span className="text-sm text-gray-600">
                  Churn Score:{" "}
                  <span className="font-semibold">{churnScorePct}%</span>
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${
                    churnScorePct > 60
                      ? "bg-red-500"
                      : churnScorePct > 30
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${churnScorePct}%` }}
                />
              </div>
              {churn.factors && churn.factors.length > 0 && (
                <ul className="space-y-1">
                  {churn.factors.map((factor, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs sm:text-sm text-gray-500"
                    >
                      <span className="text-gray-300 mt-0.5">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <Card className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 truncate">
            {label}
          </p>
          <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
            {value}
          </p>
        </div>
        <div className="p-2 bg-gray-50 rounded-full flex-shrink-0">{icon}</div>
      </div>
    </Card>
  );
}

function DetailRow({ label, value, className = "" }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
      <dt className="text-xs sm:text-sm text-gray-500">{label}</dt>
      <dd
        className={`text-sm sm:text-base font-medium text-gray-900 ${className}`}
      >
        {value}
      </dd>
    </div>
  );
}

