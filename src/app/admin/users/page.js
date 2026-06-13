'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/services';
import {
  FaUserShield,
  FaUser,
  FaStore,
  FaSearch,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaEye,
  FaBan,
  FaTrash,
} from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [isAuthenticated, user, roleFilter, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        role: roleFilter || undefined,
        page: pagination.page,
        limit: 20,
      };
      const data = await adminService.getUsers(params);
      setUsers(data.users || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUser(userId, 'updateRole', { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleVerify = async (userId, verify) => {
    try {
      await adminService.updateUser(userId, verify ? 'verify' : 'unverify');
      fetchUsers();
    } catch (error) {
      console.error('Error updating verification:', error);
    }
  };

  const handleBan = async (userId) => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    try {
      await adminService.updateUser(userId, 'ban');
      fetchUsers();
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    try {
      await adminService.deleteUser(userId);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. They may have associated data.');
    }
  };

  const viewUserDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN': return <FaUserShield className="text-purple-600" />;
      case 'SELLER': return <FaStore className="text-blue-600" />;
      default: return <FaUser className="text-gray-600" />;
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      SELLER: 'bg-blue-100 text-blue-800',
      BUYER: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[role] || colors.BUYER}`}>
        {role}
      </span>
    );
  };

  const getChurnBadge = (churnPrediction) => {
    if (!churnPrediction) return null;

    const { riskLevel } = churnPrediction;
    const colors = {
      HIGH: 'bg-red-100 text-red-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[riskLevel] || colors.LOW}`}>
        {riskLevel}
      </span>
    );
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

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

  // Calculate stats
  const stats = {
    total: pagination.total,
    admins: users.filter(u => u.role === 'ADMIN').length,
    sellers: users.filter(u => u.role === 'SELLER').length,
    buyers: users.filter(u => u.role === 'BUYER').length,
    verified: users.filter(u => u.isVerified).length,
    unverified: users.filter(u => !u.isVerified).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">View and manage all platform users</p>
          </div>
          <Button onClick={() => router.push('/admin')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FaUserShield className="text-blue-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
              </div>
              <FaUserShield className="text-purple-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sellers</p>
                <p className="text-2xl font-bold text-blue-600">{stats.sellers}</p>
              </div>
              <FaStore className="text-blue-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                <p className="text-xs text-gray-500">{stats.unverified} unverified</p>
              </div>
              <FaCheck className="text-green-500 text-2xl" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="SELLER">Seller</option>
              <option value="BUYER">Buyer</option>
            </select>
            <Button onClick={fetchUsers} variant="outline" className="flex items-center gap-2">
              <FaSearch /> Search
            </Button>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaUserShield className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Churn Risk</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                {getRoleIcon(u.role)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {u.name || 'No name'}
                                </div>
                                <div className="text-sm text-gray-500">{u.email}</div>
                                <div className="text-xs text-gray-400">
                                  {new Date(u.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="BUYER">Buyer</option>
                              <option value="SELLER">Seller</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleVerify(u.id, !u.isVerified)}
                              className={`p-2 rounded-full ${
                                u.isVerified
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                  : 'bg-red-100 text-red-600 hover:bg-red-200'
                              }`}
                              title={u.isVerified ? 'Unverify' : 'Verify'}
                            >
                              {u.isVerified ? <FaCheck /> : <FaTimes />}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {u._count?.orders || 0}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            ${u.profile?.totalSpent?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4">
                            {getChurnBadge(u.churnPrediction)}
                          </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewUserDetail(u)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {!u.isVerified && (
                          <button
                            onClick={() => handleVerify(u.id, true)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Verify User"
                          >
                            <FaCheck />
                          </button>
                        )}
                        <button
                          onClick={() => handleBan(u.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                          title="Ban User"
                        >
                          <FaBan />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete User"
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
                      Showing {((pagination.page - 1) * 20) + 1} to {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} users
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

        {/* User Detail Modal */}
        {showDetailModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">User Details</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedUser.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p>{getRoleBadge(selectedUser.role)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Verified</p>
                    <p>{selectedUser.isVerified ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p>{selectedUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Joined</p>
                    <p>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Profile Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-lg font-bold text-green-600">
                        ${selectedUser.profile?.totalSpent?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Purchase Count</p>
                      <p className="text-lg font-bold">{selectedUser.profile?.purchaseCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Orders</p>
                      <p className="text-lg font-bold">{selectedUser._count?.orders || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Reviews</p>
                      <p className="text-lg font-bold">{selectedUser._count?.reviews || 0}</p>
                    </div>
                  </div>
                </div>

                {selectedUser.churnPrediction && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Churn Prediction</h3>
                    <div className="flex items-center gap-4">
                      {getChurnBadge(selectedUser.churnPrediction)}
                      <span className="text-sm text-gray-600">
                        Score: {(selectedUser.churnPrediction.churnScore * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setShowDetailModal(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
