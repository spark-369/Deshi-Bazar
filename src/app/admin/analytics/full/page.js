"use client";

import { useEffect, useState } from 'react';
import { adminService } from '@/services';
import { Card, Button } from '@/components/common';
import {
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaTable,
  FaDownload,
  FaArrowLeft,
} from 'react-icons/fa';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function FullAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAnalytics(period);
      setAnalytics(data);
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!analytics) return;

    const headers = ['Date', 'Revenue', 'Orders'];
    const rows = Object.entries(analytics.chartData || {}).map(([date, data]) => [
      date,
      data.revenue,
      data.orders,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${period}d.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Prepare chart data
  const dailySalesData = Object.entries(analytics?.chartData || {})
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate order status distribution from recent orders
  const recentOrders = analytics?.recentOrders || [];
  const statusCounts = recentOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const orderStatusData = Object.entries(statusCounts).map(([name, value]) => {
    const colors = {
      PENDING: '#F59E0B',
      CONFIRMED: '#3B82F6',
      SHIPPED: '#8B5CF6',
      DELIVERED: '#10B981',
      CANCELLED: '#EF4444',
    };
    return { name, value, color: colors[name] || '#6B7280' };
  });

  // Transform category data for pie chart
  const categoryData = (analytics?.categories || []).map((cat, index) => ({
    name: cat.category,
    value: cat.count,
    color: COLORS[index % COLORS.length],
  }));

  // Transform top products for horizontal bar chart
  const topProductsData = (analytics?.topProducts || []).slice(0, 5).map(p => ({
    name: p.name?.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
    revenue: p.revenue,
    sold: p.sold,
  }));

  // Transform trending products
  const trendingProducts = analytics?.trendingProducts || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <FaArrowLeft />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Full Analytics</h1>
              <p className="text-gray-600 mt-1">Comprehensive analytics and insights</p>
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <Button onClick={downloadCSV} className="flex items-center gap-2">
              <FaDownload />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${analytics?.overview?.totalRevenue?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-green-600">Period: ${analytics?.overview?.periodRevenue?.toFixed(2) || '0.00'}</p>
              </div>
              <FaChartLine className="text-green-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{analytics?.overview?.totalOrders || 0}</p>
                <p className="text-xs text-blue-600">Pending: {analytics?.overview?.pendingOrders || 0}</p>
              </div>
              <FaChartBar className="text-blue-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{analytics?.overview?.totalProducts || 0}</p>
                <p className="text-xs text-yellow-600">Low stock: {analytics?.overview?.lowStockProducts || 0}</p>
              </div>
              <FaChartPie className="text-purple-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{analytics?.overview?.totalUsers || 0}</p>
                <p className="text-xs text-green-600">New: +{analytics?.overview?.newUsers || 0}</p>
              </div>
              <FaTable className="text-orange-500 text-2xl" />
            </div>
          </Card>
        </div>

        {/* Revenue and Orders Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Over Time */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Revenue Over Time</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3B82F6"
                      fill="#93C5FD"
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Daily Orders */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Daily Orders</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Products and Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Top Products</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      width={120}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'revenue' ? `$${value.toFixed(2)}` : value,
                        name === 'revenue' ? 'Revenue' : 'Sold'
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Category Distribution */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Category Distribution</h2>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {categoryData.map((cat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    ></div>
                    <span className="text-sm">{cat.category}: {cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Order Status and AI Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Status Breakdown */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Status Breakdown</h2>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} (${entry.value})`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {orderStatusData.map((status, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <span className="text-sm">
                      {status.name}: {status.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* AI Insights */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">AI Insights</h2>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Predicted Next 7 Days Revenue</p>
                  <p className="text-3xl font-bold text-blue-900">
                    ${analytics?.salesForecast?.predicted?.toFixed(2) || '0.00'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      analytics?.salesForecast?.trend === 'GROWING'
                        ? 'bg-green-100 text-green-700'
                        : analytics?.salesForecast?.trend === 'DECLINING'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}>
                      {analytics?.salesForecast?.trend || 'STABLE'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Confidence: {Math.round((analytics?.salesForecast?.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="text-xl font-bold">{analytics?.overview?.totalReviews || 0}</p>
                    <p className="text-xs text-red-600">Fake: {analytics?.overview?.fakeReviews || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Payments</p>
                    <p className="text-xl font-bold">{analytics?.overview?.totalPayments || 0}</p>
                    <p className="text-xs text-red-600">Flagged: {analytics?.overview?.flaggedPayments || 0}</p>
                  </div>
                </div>

                {trendingProducts.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Trending Products</h3>
                    <div className="space-y-2">
                      {trendingProducts.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                            {item.product.images?.[0] ? (
                              <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.product.name}</p>
                            <p className="text-xs text-gray-500">Score: {(item.trendScore * 100).toFixed(0)}%</p>
                          </div>
                          <p className="text-sm font-bold">${item.product.price?.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Raw Data Table */}
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Raw Data Table</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySalesData.slice(-10).reverse().map((day, index) => {
                    const dayOrders = recentOrders.filter(
                      o => new Date(o.createdAt).toISOString().split('T')[0] === day.date
                    );
                    const statusBreakdown = dayOrders.reduce((acc, o) => {
                      acc[o.status] = (acc[o.status] || 0) + 1;
                      return acc;
                    }, {});

                    return (
                      <tr key={index}>
                        <td className="px-6 py-4">{new Date(day.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">${day.revenue?.toFixed(2) || '0.00'}</td>
                        <td className="px-6 py-4">{day.orders}</td>
                        <td className="px-6 py-4 text-sm">
                          {Object.entries(statusBreakdown)
                            .map(([status, count]) => `${status}:${count}`)
                            .join(', ') || 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

