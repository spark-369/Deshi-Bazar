"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/services';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/common';
import {
  FaUsers,
  FaExclamationTriangle,
  FaCheck,
  FaSearch,
  FaFilter,
  FaArrowLeft,
  FaDownload,
} from 'react-icons/fa';
import {
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
  Legend,
} from 'recharts';

const RISK_COLORS = {
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#10B981',
};

const RISK_BADGES = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-green-100 text-green-700',
};

export default function ChurnPredictionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    riskLevel: '',
    minScore: '',
    maxScore: '',
    userId: '',
    sortBy: 'churnScore',
    sortOrder: 'desc',
  });

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      fetchPredictions();
    }
  }, [isAuthenticated, user, filters]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (!params.riskLevel) delete params.riskLevel;
      if (!params.userId) delete params.userId;
      if (!params.minScore) delete params.minScore;
      if (!params.maxScore) delete params.maxScore;

      const data = await adminService.getChurnPredictions(params);
      setPredictions(data.predictions || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Churn predictions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchPredictions();
  };

  const resetFilters = () => {
    setFilters({
      riskLevel: '',
      minScore: '',
      maxScore: '',
      userId: '',
      sortBy: 'churnScore',
      sortOrder: 'desc',
    });
  };

  const downloadCSV = () => {
    const headers = ['User ID', 'Name', 'Email', 'Churn Score', 'Risk Level', 'Predicted Date'];
    const rows = predictions.map(p => [
      p.user.id,
      p.user.name,
      p.user.email,
      p.churnScore?.toFixed(4) || '0',
      p.riskLevel,
      new Date(p.predictedAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'churn_predictions.csv';
    a.click();
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

  // Calculate risk distribution for chart
  const riskDistribution = predictions.reduce((acc, p) => {
    acc[p.riskLevel] = (acc[p.riskLevel] || 0) + 1;
    return acc;
  }, {});

  const riskChartData = Object.entries(riskDistribution).map(([name, value]) => ({
    name,
    value,
    color: RISK_COLORS[name] || '#6B7280',
  }));

  // Get high risk users
  const highRiskUsers = predictions.filter(p => p.riskLevel === 'HIGH');
  const mediumRiskUsers = predictions.filter(p => p.riskLevel === 'MEDIUM');
  const lowRiskUsers = predictions.filter(p => p.riskLevel === 'LOW');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2"
            >
              <FaArrowLeft />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Churn Predictions</h1>
              <p className="text-gray-600 mt-1">AI-powered customer churn risk analysis</p>
            </div>
          </div>
          <Button onClick={downloadCSV} className="flex items-center gap-2">
            <FaDownload />
            Export CSV
          </Button>
        </div>

        {/* Risk Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">High Risk</p>
                <p className="text-3xl font-bold text-red-600">{highRiskUsers.length}</p>
                <p className="text-xs text-gray-500 mt-1">Immediate attention needed</p>
              </div>
              <FaExclamationTriangle className="text-red-500 text-3xl" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Medium Risk</p>
                <p className="text-3xl font-bold text-yellow-600">{mediumRiskUsers.length}</p>
                <p className="text-xs text-gray-500 mt-1">Monitor closely</p>
              </div>
              <FaExclamationTriangle className="text-yellow-500 text-3xl" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Low Risk</p>
                <p className="text-3xl font-bold text-green-600">{lowRiskUsers.length}</p>
                <p className="text-xs text-gray-500 mt-1">Stable customers</p>
              </div>
              <FaCheck className="text-green-500 text-3xl" />
            </div>
          </Card>
        </div>

        {/* Risk Distribution Chart */}
        {riskChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaFilter />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                <select
                  value={filters.riskLevel}
                  onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Score</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.0"
                  value={filters.minScore}
                  onChange={(e) => handleFilterChange('minScore', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="1.0"
                  value={filters.maxScore}
                  onChange={(e) => handleFilterChange('maxScore', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <Input
                  type="text"
                  placeholder="Search by user ID"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="churnScore">Churn Score</option>
                    <option value="predictedAt">Date</option>
                    <option value="riskLevel">Risk Level</option>
                  </select>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button onClick={applyFilters} className="flex items-center gap-2">
                <FaSearch />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Predictions Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Churn Predictions ({pagination.total} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaUsers className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No churn predictions found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Churn Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Predicted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {predictions.map((prediction) => (
                        <tr key={prediction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{prediction.user.name}</p>
                              <p className="text-sm text-gray-500">{prediction.user.email}</p>
                              <p className="text-xs text-gray-400">ID: {prediction.user.id.substring(0, 8)}...</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    prediction.churnScore > 0.7
                                      ? 'bg-red-500'
                                      : prediction.churnScore > 0.4
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                  }`}
                                  style={{ width: `${prediction.churnScore * 100}%` }}
                                ></div>
                              </div>
                              <span className="font-medium">
                                {(prediction.churnScore * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${RISK_BADGES[prediction.riskLevel] || 'bg-gray-100 text-gray-700'}`}>
                              {prediction.riskLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(prediction.predictedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/users/${prediction.user.id}`)}
                            >
                              View User
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} predictions
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => handleFilterChange('page', pagination.page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => handleFilterChange('page', pagination.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* High Risk Alert */}
        {highRiskUsers.length > 0 && (
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <FaExclamationTriangle />
                High Risk Customers Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {highRiskUsers.length} customer(s) are at high risk of churning. Consider reaching out with retention offers.
              </p>
              <div className="space-y-2">
                {highRiskUsers.slice(0, 5).map((prediction) => (
                  <div key={prediction.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">{prediction.user.name}</p>
                      <p className="text-sm text-gray-600">{prediction.user.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Churn Score</p>
                        <p className="text-lg font-bold text-red-600">
                          {(prediction.churnScore * 100).toFixed(1)}%
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/users/${prediction.user.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
