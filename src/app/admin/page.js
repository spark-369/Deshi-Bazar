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
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return null;
  }

  const stats = analytics?.overview || {};
  const salesForecast = analytics?.salesForecast || {};

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage your platform with smart insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 truncate">
                  Total Revenue
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  Tk.{stats.totalRevenue?.toFixed(2) || 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0">
                <FaChartLine className="text-green-600 text-sm sm:text-xl" />
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 truncate">
                  Total Orders
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {stats.totalOrders || 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
                <FaShoppingCart className="text-blue-600 text-sm sm:text-xl" />
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 truncate">
                  Total Products
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {stats.totalProducts || 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-full flex-shrink-0">
                <FaBox className="text-purple-600 text-sm sm:text-xl" />
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 truncate">
                  Total Users
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {stats.totalUsers || 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-100 rounded-full flex-shrink-0">
                <FaUsers className="text-orange-600 text-sm sm:text-xl" />
              </div>
            </div>
          </Card>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                Sales Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    Tk.{salesForecast.predicted?.toFixed(2) || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Predicted revenue
                  </p>
                </div>
                <div
                  className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-sm font-medium self-start xs:self-auto ${
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

              {/* Confidence bar */}
              <div className="mb-3 sm:mb-4">
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-1">
                  <span>Confidence</span>
                  <span className="font-medium text-gray-700">
                    {Math.round((salesForecast.confidence || 0) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (salesForecast.confidence || 0) >= 0.5
                        ? "bg-green-500"
                        : (salesForecast.confidence || 0) > 0
                          ? "bg-yellow-500"
                          : "bg-gray-300"
                    }`}
                    style={{
                      width: `${Math.round(
                        (salesForecast.confidence || 0) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Explanatory factors */}
              {salesForecast.factors && salesForecast.factors.length > 0 && (
                <ul className="space-y-1">
                  {salesForecast.factors.map((factor, i) => (
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {stats.flaggedPayments > 0 && (
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-red-50 rounded-lg">
                    <FaExclamationTriangle className="text-red-500 text-sm sm:text-base flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-red-700">
                      {stats.flaggedPayments} flagged payments need review
                    </span>
                  </div>
                )}
                {stats.lowStockProducts > 0 && (
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-yellow-50 rounded-lg">
                    <FaExclamationTriangle className="text-yellow-500 text-sm sm:text-base flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-yellow-700">
                      {stats.lowStockProducts} products with low stock
                    </span>
                  </div>
                )}
                {stats.outOfStock > 0 && (
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-red-50 rounded-lg">
                    <FaExclamationTriangle className="text-red-500 text-sm sm:text-base flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-red-700">
                      {stats.outOfStock} products out of stock
                    </span>
                  </div>
                )}
                {stats.fakeReviews > 0 && (
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-yellow-50 rounded-lg">
                    <FaExclamationTriangle className="text-yellow-500 text-sm sm:text-base flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-yellow-700">
                      {stats.fakeReviews} fake reviews detected
                    </span>
                  </div>
                )}
                {!stats.flaggedPayments &&
                  !stats.lowStockProducts &&
                  !stats.outOfStock &&
                  !stats.fakeReviews && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 rounded-lg">
                      <FaCheck className="text-green-500 text-sm sm:text-base flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-green-700">
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
            <CardTitle className="text-base sm:text-lg">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col"
                onClick={() => router.push("/admin/products")}
              >
                <FaBox className="text-lg sm:text-2xl mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm">Products</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col"
                onClick={() => router.push("/admin/users")}
              >
                <FaUserPlus className="text-lg sm:text-2xl mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm">Users</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col"
                onClick={() => router.push("/admin/categories")}
              >
                <FaFolder className="text-lg sm:text-2xl mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm">Categories</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col"
                onClick={() => router.push("/admin/orders")}
              >
                <FaShoppingCart className="text-lg sm:text-2xl mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm">All Orders</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col"
                onClick={() => router.push("/admin/analytics/full")}
              >
                <FaChartLine className="text-lg sm:text-2xl mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm">Analytics</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col"
                onClick={() => router.push("/admin/recommendations")}
              >
                <FaRobot className="text-lg sm:text-2xl mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm">Recs</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
