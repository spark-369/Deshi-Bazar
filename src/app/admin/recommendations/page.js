'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { recommendationService } from '@/services';
import { Card, CardContent, Button, Input } from '@/components/common';
import {
  FaEdit,
  FaTrash,
  FaRobot,
  FaSearch,
  FaFilter,
  FaDownload,
  FaSync,
  FaUser,
  FaBox,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from 'react-icons/fa';

export default function AdminRecommendationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [minScore, setMinScore] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedRec, setSelectedRec] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ score: '', reason: '' });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchRecommendations();
    }
  }, [isAuthenticated, user, search, emailFilter, minScore, pagination.page]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        email: emailFilter || undefined,
        minScore: minScore ? parseFloat(minScore) : undefined,
        page: pagination.page,
        limit: 20,
        sortBy: 'score',
        sortOrder: 'desc',
      };
      const data = await recommendationService.getRecommendations(params);
      setRecommendations(data.recommendations || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      }));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!emailFilter) {
      alert('Please enter a user email to generate recommendations');
      return;
    }
    if (!confirm(`Generate recommendations for ${emailFilter}?`)) return;

    try {
      const result = await recommendationService.generateAIRecommendations(emailFilter);
      alert(`Generated ${result.count} recommendations!`);
      fetchRecommendations();
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert(error.data?.error || error.message || 'Failed to generate recommendations');
    }
  };

  const handleEdit = (rec) => {
    setSelectedRec(rec);
    setEditForm({
      score: rec.score?.toString() || '',
      reason: rec.reason || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedRec) return;
    try {
      await recommendationService.updateRecommendation(selectedRec.id, {
        score: parseFloat(editForm.score),
        reason: editForm.reason,
      });
      alert('Recommendation updated!');
      setShowEditModal(false);
      fetchRecommendations();
    } catch (error) {
      console.error('Error updating:', error);
      alert('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this recommendation?')) return;
    try {
      await recommendationService.deleteRecommendation(id);
      fetchRecommendations();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'User', 'Product', 'Recommended To', 'Score', 'Reason', 'Created At'];
    const rows = recommendations.map(r => [
      r.id.substring(0, 8),
      r.user?.name || 'N/A',
      r.product?.name || 'N/A',
      r.recommendedTo?.name || 'N/A',
      r.score?.toFixed(2),
      r.reason || '',
      new Date(r.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recommendations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  const startItem = (pagination.page - 1) * 20 + 1;
  const endItem = Math.min(pagination.page * 20, pagination.total);
  const avgScore = recommendations.length > 0
    ? (recommendations.reduce((sum, r) => sum + (r.score || 0), 0) / recommendations.length).toFixed(2)
    : '0.00';

  const renderRecCard = (rec) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 bg-blue-50 rounded-full flex items-center justify-center">
            <FaUser className="text-blue-600 text-sm sm:text-base" />
          </div>
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
              {rec.user?.email || rec.user?.name || `User ${rec.userId?.substring(0, 8)}`}
            </p>
            <p className="text-xs text-gray-500">ID: {rec.userId?.substring(0, 8)}...</p>
          </div>
        </div>
        <span className={`text-sm font-bold flex-shrink-0 ${
          rec.score >= 0.8 ? 'text-green-600' :
          rec.score >= 0.5 ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {(rec.score * 100).toFixed(0)}%
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2">
          <FaBox className="text-gray-400 mt-0.5 flex-shrink-0 text-xs" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Product</p>
            <p className="font-medium text-gray-900 truncate">
              {rec.product?.name || 'Unknown'}
            </p>
            <p className="text-xs text-gray-500">
                            Tk.{rec.product?.price?.toFixed(2) || 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <FaUser className="text-gray-400 mt-0.5 flex-shrink-0 text-xs" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Recommended To</p>
            <p className="font-medium text-gray-900 truncate">
              {rec.recommendedTo?.name || 'Unknown'}
            </p>
            <p className="text-xs text-gray-500">
                            Tk.{rec.recommendedTo?.price?.toFixed(2) || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {rec.reason && (
        <div className="text-sm">
          <p className="text-xs text-gray-500">Reason</p>
          <p className="text-gray-700 line-clamp-2">{rec.reason}</p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleEdit(rec)}
          className="flex items-center justify-center gap-1.5 flex-1"
        >
          <FaEdit className="text-xs" /> Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDelete(rec.id)}
          className="flex items-center justify-center gap-1.5 flex-1 text-red-600 border-red-300 hover:bg-red-50"
        >
          <FaTrash className="text-xs" /> Delete
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Recommendation Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Product recommendations
            </p>
          </div>
          <div className="flex flex-col xs:flex-row gap-2 w-full">
            <Button
              onClick={() => router.push('/admin')}
              variant="outline"
              className="w-full xs:w-auto"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="flex items-center justify-center gap-2 w-full xs:w-auto"
            >
              <FaDownload /> Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Recommendations</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{pagination.total}</p>
              </div>
              <FaBox className="text-blue-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Avg Score</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {avgScore}
                </p>
              </div>
              <FaSync className="text-green-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">High Confidence</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                  {recommendations.filter(r => r.score >= 0.8).length}
                </p>
              </div>
              <FaRobot className="text-purple-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Unique Users</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                  {new Set(recommendations.map(r => r.userId)).size}
                </p>
              </div>
              <FaUser className="text-orange-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search recommendations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <input
              type="text"
              placeholder="Filter by Email"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Min Score (0-1)"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              step="0.1"
              min="0"
              max="1"
              className="px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button
              onClick={handleGenerateAI}
              variant="outline"
              className="flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <FaRobot /> Generate AI
            </Button>
            <Button
              onClick={fetchRecommendations}
              variant="outline"
              className="flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <FaFilter /> Apply
            </Button>
          </div>
        </Card>

        {/* Recommendations Table / Cards */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaBox className="text-4xl mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base">No recommendations found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recommended To
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recommendations.map((rec) => (
                        <tr key={rec.id} className="hover:bg-gray-50">
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 text-xs sm:text-sm font-medium">
                                  {(rec.user?.email || rec.userId)?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">
                                  {rec.user?.email || rec.user?.name || `User ${rec.userId?.substring(0, 8)}`}
                                </div>
                                <div className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[200px]">
                                  ID: {rec.userId?.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              {rec.product?.images?.[0] && (
                                <img src={rec.product.images[0]} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">
                                  {rec.product?.name || 'Unknown Product'}
                                </div>
                                <div className="text-xs text-gray-500">
              Tk.{rec.product?.price?.toFixed(2) || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              {rec.recommendedTo?.images?.[0] && (
                                <img src={rec.recommendedTo.images[0]} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">
                                  {rec.recommendedTo?.name || 'Unknown'}
                                </div>
                                <div className="text-xs text-gray-500">
              Tk.{rec.recommendedTo?.price?.toFixed(2) || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <span className={`text-xs sm:text-sm font-medium ${
                              rec.score >= 0.8 ? 'text-green-600' :
                              rec.score >= 0.5 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {(rec.score * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-xs" title={rec.reason}>
                            {rec.reason || '-'}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEdit(rec)}
                                className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(rec.id)}
                                className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-200">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="p-4 space-y-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-sm font-medium">
                              {(rec.user?.email || rec.userId)?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {rec.user?.email || rec.user?.name || `User ${rec.userId?.substring(0, 8)}`}
                            </p>
                            <p className="text-xs text-gray-500">ID: {rec.userId?.substring(0, 8)}...</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold flex-shrink-0 ${
                          rec.score >= 0.8 ? 'text-green-600' :
                          rec.score >= 0.5 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {(rec.score * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm pl-1">
                        <div>
                          <p className="text-xs text-gray-500">Product</p>
                          <p className="font-medium text-gray-900 truncate">
                            {rec.product?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                                  Tk.{rec.product?.price?.toFixed(2) || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Recommended To</p>
                          <p className="font-medium text-gray-900 truncate">
                            {rec.recommendedTo?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                                  Tk.{rec.recommendedTo?.price?.toFixed(2) || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {rec.reason && (
                        <div className="text-sm pl-1">
                          <p className="text-xs text-gray-500">Reason</p>
                          <p className="text-gray-700 line-clamp-2">{rec.reason}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pl-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(rec)}
                          className="flex items-center justify-center gap-1.5 flex-1"
                        >
                          <FaEdit className="text-xs" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(rec.id)}
                          className="flex items-center justify-center gap-1.5 flex-1 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <FaTrash className="text-xs" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t">
                    <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                      Showing {startItem} to {endItem} of {pagination.total} recommendations
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        className="flex-1 sm:flex-none justify-center"
                      >
                        <FaChevronLeft className="mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
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

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm sm:max-w-md max-h-[90vh] flex flex-col">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Recommendation</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Score (0-1)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={editForm.score}
                    onChange={(e) => setEditForm({ ...editForm, score: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <textarea
                    value={editForm.reason}
                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Why this product is recommended..."
                  />
                </div>
              </div>
              <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col-reverse xs:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="w-full xs:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  className="w-full xs:w-auto"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
