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
} from 'react-icons/fa';

export default function AdminRecommendationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
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
  }, [isAuthenticated, user, search, userIdFilter, minScore, pagination.page]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        userId: userIdFilter || undefined,
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
    if (!userIdFilter) {
      alert('Please enter a User ID for AI recommendations');
      return;
    }
    if (!confirm(`Generate AI recommendations for user ${userIdFilter}?`)) return;

    try {
      const result = await recommendationService.generateAIRecommendations(userIdFilter);
      alert(`Generated ${result.count} recommendations!`);
      fetchRecommendations();
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert(error.response?.data?.error || 'Failed to generate recommendations');
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recommendation Management</h1>
            <p className="text-gray-600 mt-1">AI-powered product recommendations</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/admin')} variant="outline">
              Back to Dashboard
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
              <FaDownload /> Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Recommendations</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <FaBox className="text-blue-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {recommendations.length > 0
                    ? (recommendations.reduce((sum, r) => sum + (r.score || 0), 0) / recommendations.length).toFixed(2)
                    : '0.00'}
                </p>
              </div>
              <FaSync className="text-green-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Confidence</p>
                <p className="text-2xl font-bold text-purple-600">
                  {recommendations.filter(r => r.score >= 0.8).length}
                </p>
              </div>
              <FaRobot className="text-purple-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold text-orange-600">
                  {new Set(recommendations.map(r => r.userId)).size}
                </p>
              </div>
              <FaUser className="text-orange-500 text-2xl" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search recommendations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="text"
              placeholder="Filter by User ID"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Min Score (0-1)"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              step="0.1"
              min="0"
              max="1"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleGenerateAI} variant="outline" className="flex items-center gap-2">
              <FaRobot /> Generate AI
            </Button>
            <Button onClick={fetchRecommendations} variant="outline" className="flex items-center gap-2">
              <FaFilter /> Apply
            </Button>
          </div>
        </Card>

        {/* Recommendations Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaBox className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No recommendations found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommended To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recommendations.map((rec) => (
                        <tr key={rec.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-sm font-medium">
                                  {rec.userId?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  User {rec.userId?.substring(0, 8)}
                                </div>
                                <div className="text-xs text-gray-500">ID: {rec.userId?.substring(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {rec.product?.images?.[0] && (
                                <img src={rec.product.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                  {rec.product?.name || 'Unknown Product'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ${rec.product?.price?.toFixed(2) || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {rec.recommendedTo?.images?.[0] && (
                                <img src={rec.recommendedTo.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {rec.recommendedTo?.name || 'Unknown'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ${rec.recommendedTo?.price?.toFixed(2) || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-medium ${
                              rec.score >= 0.8 ? 'text-green-600' :
                              rec.score >= 0.5 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {(rec.score * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={rec.reason}>
                            {rec.reason || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(rec)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(rec.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
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

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <p className="text-sm text-gray-600">
                      Showing {((pagination.page - 1) * 20) + 1} to {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} recommendations
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
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

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Recommendation</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Why this product is recommended..."
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleUpdate}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
