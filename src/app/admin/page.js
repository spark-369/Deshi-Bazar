"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services";
import {
  FaChartLine,
  FaUsers,
  FaBox,
  FaShoppingCart,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaUserPlus,
  FaFolder,
  FaUserCog,
  FaRobot,
} from "react-icons/fa";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@/components/common";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      fetchAnalytics();
    }
  }, [isAuthenticated, user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAnalytics(30);
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return null;
  }

  const stats = analytics?.overview || {};
  const salesForecast = analytics?.salesForecast || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your platform with AI-powered insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalRevenue?.toFixed(2) || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FaChartLine className="text-green-600 text-xl" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalOrders || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FaShoppingCart className="text-blue-600 text-xl" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalProducts || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FaBox className="text-purple-600 text-xl" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <FaUsers className="text-orange-600 text-xl" />
              </div>
            </div>
          </Card>
        </div>

        {/* AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Sales Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    ${salesForecast.predicted?.toFixed(2) || 0}
                  </p>
                  <p className="text-sm text-gray-600">Predicted revenue</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    salesForecast.trend === "GROWING"
                      ? "bg-green-100 text-green-700"
                      : salesForecast.trend === "DECLINING"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {salesForecast.trend || "STABLE"}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <p>
                  Confidence:{" "}
                  {Math.round((salesForecast.confidence || 0) * 100)}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.flaggedPayments > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <FaExclamationTriangle className="text-red-500" />
                    <span className="text-sm text-red-700">
                      {stats.flaggedPayments} flagged payments need review
                    </span>
                  </div>
                )}
                {stats.lowStockProducts > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <FaExclamationTriangle className="text-yellow-500" />
                    <span className="text-sm text-yellow-700">
                      {stats.lowStockProducts} products with low stock
                    </span>
                  </div>
                )}
                {stats.outOfStock > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <FaExclamationTriangle className="text-red-500" />
                    <span className="text-sm text-red-700">
                      {stats.outOfStock} products out of stock
                    </span>
                  </div>
                )}
                {stats.fakeReviews > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <FaExclamationTriangle className="text-yellow-500" />
                    <span className="text-sm text-yellow-700">
                      {stats.fakeReviews} fake reviews detected
                    </span>
                  </div>
                )}
                {!stats.flaggedPayments &&
                  !stats.lowStockProducts &&
                  !stats.outOfStock &&
                  !stats.fakeReviews && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <FaCheck className="text-green-500" />
                      <span className="text-sm text-green-700">
                        Everything looks good!
                      </span>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col"
                onClick={() => router.push("/admin/products")}
              >
                <FaBox className="text-2xl mb-2" />
                <span>Products</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col"
                onClick={() => router.push("/admin/users")}
              >
                <FaUserPlus className="text-2xl mb-2" />
                <span>Users</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col"
                onClick={() => router.push("/admin/categories")}
              >
                <FaFolder className="text-2xl mb-2" />
                <span>Categories</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col"
                onClick={() => router.push("/admin/orders")}
              >
                <FaShoppingCart className="text-2xl mb-2" />
                <span>All Orders</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col"
                onClick={() => router.push("/admin/analytics/full")}
              >
                <FaChartLine className="text-2xl mb-2" />
                <span>Analytics</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col"
                onClick={() => router.push("/admin/recommendations")}
              >
                <FaRobot className="text-2xl mb-2" />
                <span>Recommendations</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
