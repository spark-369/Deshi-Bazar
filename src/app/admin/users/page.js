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
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Loading users...</p>
        </div>
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">View and manage all platform users</p>
          </div>
          <Button onClick={() => router.push('/admin')} variant="outline" className="w-full sm:w-auto">
            Back to Dashboard
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 truncate">Total Users</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.total}</p>
              </div>
              <FaUserShield className="text-blue-500 text-sm sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 truncate">Admins</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{stats.admins}</p>
              </div>
              <FaUserShield className="text-purple-500 text-sm sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 truncate">Sellers</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{stats.sellers}</p>
              </div>
              <FaStore className="text-blue-500 text-sm sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 truncate">Verified</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{stats.verified}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">{stats.unverified} unverified</p>
              </div>
              <FaCheck className="text-green-500 text-sm sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="SELLER">Seller</option>
              <option value="BUYER">Buyer</option>
            </select>
            <Button onClick={fetchUsers} variant="outline" className="flex items-center justify-center gap-2 w-full xs:w-auto">
              <FaSearch className="text-sm" /> Search
            </Button>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-10 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-10 sm:py-12 text-gray-500 px-4">
                <FaUserShield className="text-3xl sm:text-4xl mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base">No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Verified</th>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Orders</th>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Spent</th>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Churn Risk</th>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                {getRoleIcon(u.role)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                  {u.name || 'No name'}
                                </div>
                                <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                <div className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">
                                  {new Date(u.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="text-xs sm:text-sm border border-gray-300 rounded px-1.5 sm:px-2 py-1 focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="BUYER">Buyer</option>
                              <option value="SELLER">Seller</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 hidden sm:table-cell">
                            <button
                              onClick={() => handleVerify(u.id, !u.isVerified)}
                              className={`p-1.5 sm:p-2 rounded-full ${
                                u.isVerified
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                  : 'bg-red-100 text-red-600 hover:bg-red-200'
                              }`}
                              title={u.isVerified ? 'Unverify' : 'Verify'}
                            >
                              {u.isVerified ? <FaCheck className="text-xs sm:text-sm" /> : <FaTimes className="text-xs sm:text-sm" />}
                            </button>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                            {u._count?.orders || 0}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 hidden lg:table-cell">
                            Tk.{u.profile?.totalSpent?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 hidden md:table-cell">
                            {getChurnBadge(u.churnPrediction)}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <button
                                onClick={() => viewUserDetail(u)}
                                className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="View Details"
                              >
                                <FaEye className="text-xs sm:text-sm" />
                              </button>
                              {!u.isVerified && (
                                <button
                                  onClick={() => handleVerify(u.id, true)}
                                  className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded"
                                  title="Verify User"
                                >
                                  <FaCheck className="text-xs sm:text-sm" />
                                </button>
                              )}
                              <button
                                onClick={() => handleBan(u.id)}
                                className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded"
                                title="Ban User"
                              >
                                <FaBan className="text-xs sm:text-sm" />
                              </button>
                              <button
                                onClick={() => handleDelete(u.id)}
                                className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Delete User"
                              >
                                <FaTrash className="text-xs sm:text-sm" />
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 border-t">
                    <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                      Showing {((pagination.page - 1) * 20) + 1} to {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} users
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        className="w-full sm:w-auto"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                        className="w-full sm:w-auto"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 max-w-2xl w-full mx-0 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold">User Details</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700 p-1">
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Name</p>
                    <p className="text-sm sm:text-base font-medium">{selectedUser.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Email</p>
                    <p className="text-sm sm:text-base font-medium break-all">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Role</p>
                    <p>{getRoleBadge(selectedUser.role)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Verified</p>
                    <p className="text-sm sm:text-base">{selectedUser.isVerified ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Phone</p>
                    <p className="text-sm sm:text-base">{selectedUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Joined</p>
                    <p className="text-sm sm:text-base">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border-t pt-3 sm:pt-4">
                  <h3 className="text-sm sm:text-base font-semibold mb-2">Profile Statistics</h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Total Spent</p>
                      <p className="text-base sm:text-lg font-bold text-green-600">
                        Tk.{selectedUser.profile?.totalSpent?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Purchase Count</p>
                      <p className="text-base sm:text-lg font-bold">{selectedUser.profile?.purchaseCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Orders</p>
                      <p className="text-base sm:text-lg font-bold">{selectedUser._count?.orders || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Reviews</p>
                      <p className="text-base sm:text-lg font-bold">{selectedUser._count?.reviews || 0}</p>
                    </div>
                  </div>
                </div>

                {selectedUser.churnPrediction && (
                  <div className="border-t pt-3 sm:pt-4">
                    <h3 className="text-sm sm:text-base font-semibold mb-2">Churn Prediction</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {getChurnBadge(selectedUser.churnPrediction)}
                      <span className="text-xs sm:text-sm text-gray-600">
                        Score: {(selectedUser.churnPrediction.churnScore * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 sm:mt-6 flex justify-end">
                <Button onClick={() => setShowDetailModal(false)} className="w-full sm:w-auto">Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
