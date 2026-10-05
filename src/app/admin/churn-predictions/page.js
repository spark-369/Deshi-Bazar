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
  FaChevronLeft,
  FaChevronRight,
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
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    riskLevel: '',
    minScore: '',
    maxScore: '',
    email: '',
    sortBy: 'churnScore',
    sortOrder: 'desc',
  });

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      fetchPredictions();
    }
  }, [isAuthenticated, user, filters.riskLevel, filters.minScore, filters.maxScore, filters.email, filters.sortBy, filters.sortOrder, pagination.page]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (!params.riskLevel) delete params.riskLevel;
      if (!params.email) delete params.email;
      if (!params.minScore) delete params.minScore;
      if (!params.maxScore) delete params.maxScore;
      if (!params.sortBy) delete params.sortBy;
      if (!params.sortOrder) delete params.sortOrder;

      const data = await adminService.getChurnPredictions(params);
      setPredictions(data.predictions || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0, limit: 20 });
    } catch (error) {
      console.error('Churn predictions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const applyFilters = () => {
    fetchPredictions();
  };

  const resetFilters = () => {
    setFilters({
      riskLevel: '',
      minScore: '',
      maxScore: '',
      email: '',
      sortBy: 'churnScore',
      sortOrder: 'desc',
    });
  };

  const downloadCSV = () => {
    const headers = ['User ID', 'Name', 'Email', 'Churn Score', 'Risk Level', 'Predicted Date'];
    const rows = predictions.map(p => [
      p.user?.id || '',
      p.user?.name || '',
      p.user?.email || '',
      p.churnScore?.toFixed(4) || '0',
      p.riskLevel,
      p.predictedAt ? new Date(p.predictedAt).toLocaleDateString() : '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'churn_predictions.csv';
    a.click();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return null;
  }

  const riskDistribution = predictions.reduce((acc, p) => {
    acc[p.riskLevel] = (acc[p.riskLevel] || 0) + 1;
    return acc;
  }, {});

  const riskChartData = Object.entries(riskDistribution).map(([name, value]) => ({
    name,
    value,
    color: RISK_COLORS[name] || '#6B7280',
  }));

  const highRiskUsers = predictions.filter(p => p.riskLevel === 'HIGH');
  const mediumRiskUsers = predictions.filter(p => p.riskLevel === 'MEDIUM');
  const lowRiskUsers = predictions.filter(p => p.riskLevel === 'LOW');

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  const renderPredictionCard = (prediction) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
            {prediction.user?.name || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500 truncate">{prediction.user?.email}</p>
          <p className="text-xs text-gray-400">ID: {prediction.user?.id?.substring(0, 8)}...</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${RISK_BADGES[prediction.riskLevel] || 'bg-gray-100 text-gray-700'}`}>
          {prediction.riskLevel}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs text-gray-500 mb-1">Churn Score</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  prediction.churnScore > 0.7 ? 'bg-red-500' :
                  prediction.churnScore > 0.4 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${prediction.churnScore * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium whitespace-nowrap">
              {(prediction.churnScore * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Predicted</span>
          <span className="text-gray-900 font-medium">
            {prediction.predictedAt ? new Date(prediction.predictedAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/admin/users/${prediction.user?.id}`)}
          className="w-full"
        >
          View User
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-sm"
            >
              <FaArrowLeft /> Back to Dashboard
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                Churn Predictions
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                AI-powered customer churn risk analysis
              </p>
            </div>
          </div>
          <div className="flex flex-col xs:flex-row gap-2 w-full">
            <Button onClick={downloadCSV} className="flex items-center justify-center gap-2 w-full xs:w-auto text-sm">
              <FaDownload /> Export CSV
            </Button>
          </div>
        </div>

        {/* Risk Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <Card className="p-3 sm:p-4 lg:p-6 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">High Risk</p>
                <p className="text-lg sm:text-xl lg:text-3xl font-bold text-red-600">{highRiskUsers.length}</p>
                <p className="text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">Immediate attention needed</p>
              </div>
              <FaExclamationTriangle className="text-red-500 text-lg sm:text-xl lg:text-3xl flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-3 sm:p-4 lg:p-6 border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">Medium Risk</p>
                <p className="text-lg sm:text-xl lg:text-3xl font-bold text-yellow-600">{mediumRiskUsers.length}</p>
                <p className="text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">Monitor closely</p>
              </div>
              <FaExclamationTriangle className="text-yellow-500 text-lg sm:text-xl lg:text-3xl flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-3 sm:p-4 lg:p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">Low Risk</p>
                <p className="text-lg sm:text-xl lg:text-3xl font-bold text-green-600">{lowRiskUsers.length}</p>
                <p className="text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">Stable customers</p>
              </div>
              <FaCheck className="text-green-500 text-lg sm:text-xl lg:text-3xl flex-shrink-0" />
            </div>
          </Card>
        </div>

        {/* Risk Distribution Chart */}
        {riskChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg lg:text-xl">Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-72 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={70}
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
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FaFilter /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                <select
                  value={filters.riskLevel}
                  onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="text"
                  placeholder="Search by email"
                  value={filters.email}
                  onChange={(e) => handleFilterChange('email', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="churnScore">Churn Score</option>
                    <option value="predictedAt">Date</option>
                    <option value="riskLevel">Risk Level</option>
                  </select>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row gap-2 mt-4 w-full xs:w-auto">
              <Button onClick={applyFilters} className="flex items-center justify-center gap-2 w-full xs:w-auto text-sm">
                <FaSearch /> Apply Filters
              </Button>
              <Button variant="outline" onClick={resetFilters} className="w-full xs:w-auto text-sm">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Predictions Table / Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Churn Predictions ({pagination.total} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaUsers className="text-3xl sm:text-4xl mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base">No churn predictions found</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {predictions.map((prediction) => (
                    <div key={prediction.id}>{renderPredictionCard(prediction)}</div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Churn Score
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Risk Level
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Predicted
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {predictions.map((prediction) => (
                        <tr key={prediction.id} className="hover:bg-gray-50">
                          <td className="px-4 lg:px-6 py-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[150px] lg:max-w-[200px]">
                                {prediction.user?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[150px] lg:max-w-[200px]">
                                {prediction.user?.email}
                              </p>
                              <p className="text-xs text-gray-400">
                                ID: {prediction.user?.id?.substring(0, 8)}...
                              </p>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    prediction.churnScore > 0.7 ? 'bg-red-500' :
                                    prediction.churnScore > 0.4 ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${prediction.churnScore * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium whitespace-nowrap">
                                {(prediction.churnScore * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${RISK_BADGES[prediction.riskLevel] || 'bg-gray-100 text-gray-700'}`}>
                              {prediction.riskLevel}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {prediction.predictedAt ? new Date(prediction.predictedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/users/${prediction.user?.id}`)}
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t">
                    <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left truncate">
                      Showing {startItem} to {endItem} of {pagination.total} predictions
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        className="flex-1 sm:flex-none justify-center"
                      >
                        <FaChevronLeft className="mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        className="flex-1 sm:flex-none justify-center"
                      >
                        Next
                        <FaChevronRight className="ml-1" />
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
              <CardTitle className="flex items-center gap-2 text-red-600 text-base sm:text-lg">
                <FaExclamationTriangle />
                High Risk Customers Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                {highRiskUsers.length} customer(s) are at high risk of churning. Consider reaching out with retention offers.
              </p>
              <div className="space-y-2 sm:space-y-3">
                {highRiskUsers.slice(0, 5).map((prediction) => (
                  <div key={prediction.id} className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 p-3 sm:p-4 bg-red-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{prediction.user?.name}</p>
                      <p className="text-xs text-gray-600 truncate">{prediction.user?.email}</p>
                    </div>
                    <div className="flex items-center gap-3 xs:gap-4">
                      <div className="text-left xs:text-right">
                        <p className="text-xs text-gray-600">Churn Score</p>
                        <p className="text-base sm:text-lg font-bold text-red-600">
                          {(prediction.churnScore * 100).toFixed(1)}%
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/users/${prediction.user?.id}`)}
                        className="w-full xs:w-auto"
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
