"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@/components/common";
import {
  FaCreditCard,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaDownload,
  FaClock,
  FaEdit,
  FaTrash,
  FaUndo,
} from "react-icons/fa";
import { paymentService } from "@/services";

const METHOD_OPTIONS = [
  "bkash",
  "nagad",
  "cod",
];

export default function PaymentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editPayment, setEditPayment] = useState(null);
  const [editForm, setEditForm] = useState({ method: "", amount: 0 });
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPayments();
    }
  }, [isAuthenticated]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPayments();
      setPayments(Array.isArray(data) ? data : data.payments || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
      COMPLETED: "bg-green-100 text-green-800 border-green-300",
      FAILED: "bg-red-100 text-red-800 border-red-300",
      REFUNDED: "bg-gray-100 text-gray-800 border-gray-300",
      FLAGGED: "bg-orange-100 text-orange-800 border-orange-300",
    };
    return (
      <span
        className={`px-3 py-1 text-xs font-medium rounded-full border ${styles[status] || styles.PENDING}`}
      >
        {status}
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Order #",
      "Method",
      "Amount",
      "Status",
      "Transaction ID",
    ];
    const rows = payments.map((payment) => [
      new Date(payment.createdAt).toLocaleDateString(),
      payment.order?.orderNumber || "N/A",
      payment.method,
      `$${payment.amount?.toFixed(2)}`,
      payment.status,
      payment.transactionId || "N/A",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // --- Edit handlers ---
  const openEdit = (payment) => {
    setEditPayment(payment);
    setEditForm({ method: payment.method || "", amount: payment.amount || 0 });
  };

  const closeEdit = () => {
    setEditPayment(null);
    setEditForm({ method: "", amount: 0 });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await paymentService.updatePayment(editPayment.id, {
        method: editForm.method,
        amount: parseFloat(editForm.amount),
      });
      await fetchPayments();
      closeEdit();
    } catch (err) {
      alert(err.data?.error || err.message || "Failed to update payment");
    } finally {
      setEditLoading(false);
    }
  };

  // --- Delete handlers ---
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await paymentService.deletePayment(deleteId);
      await fetchPayments();
      setDeleteId(null);
    } catch (err) {
      alert(err.data?.error || err.message || "Failed to delete payment");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Refund handler ---
  const handleRefund = async (paymentId) => {
    if (!window.confirm("Are you sure you want to refund this payment?"))
      return;
    try {
      await paymentService.refundPayment(paymentId);
      await fetchPayments();
    } catch (err) {
      alert(err.data?.error || err.message || "Failed to refund payment");
    }
  };

  // --- Approve handler ---
  const handleApprove = async (paymentId) => {
    try {
      await paymentService.approvePayment(paymentId);
      await fetchPayments();
    } catch (err) {
      alert(err.data?.error || err.message || "Failed to approve payment");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const completedPayments = payments.filter((p) => p.status === "COMPLETED");

  const totalSpent = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  const flaggedCount = payments.filter((p) => p.isFlagged).length;

  const canEditDelete = ["SELLER", "ADMIN"].includes(user?.role);

  // Role-specific stat label and value
  const getStatConfig = () => {
    if (user?.role === "ADMIN") {
      return {
        label: "Total Revenue",
        value: completedPayments.reduce((sum, p) => sum + p.amount, 0),
        colorClass: "text-green-600",
        iconClass: "text-green-500",
      };
    }
    if (user?.role === "SELLER") {
      return {
        label: "Total Earnings",
        value: completedPayments.reduce((sum, p) => sum + p.amount, 0),
        colorClass: "text-green-600",
        iconClass: "text-green-500",
      };
    }
    // BUYER
    return {
      label: "Total Spent",
      value: completedPayments.reduce((sum, p) => sum + p.amount, 0),
      colorClass: "text-green-600",
      iconClass: "text-green-500",
    };
  };

  const statConfig = getStatConfig();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Payment History
            </h1>
            <p className="text-gray-600 mt-1">View and manage your payments</p>
          </div>
          {payments.length > 0 && (
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FaDownload />
              Export CSV
            </Button>
          )}
        </div>

        {/* Stats Cards - role-based labels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <FaCreditCard className="text-blue-500 text-2xl" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{statConfig.label}</p>
                <p className={`text-2xl font-bold ${statConfig.colorClass}`}>
                  ${statConfig.value.toFixed(2)}
                </p>
              </div>
              <FaCheck className={statConfig.iconClass + " text-2xl"} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flagged</p>
                <p className="text-2xl font-bold text-orange-600">
                  {flaggedCount}
                </p>
                <p className="text-xs text-gray-500">Requires review</p>
              </div>
              <FaExclamationTriangle className="text-orange-500 text-2xl" />
            </div>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardContent className="p-0">
            {payments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaCreditCard className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No payments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Transaction
                      </th>
                      {canEditDelete && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.createdAt).toLocaleDateString()}
                          <div className="text-xs text-gray-500">
                            {new Date(payment.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              #{payment.order?.orderNumber || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payment.order?.status?.replace("_", " ")}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaCreditCard className="text-blue-600" />
                            <span className="text-sm font-medium text-gray-900 uppercase">
                              {payment.method}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          ${payment.amount?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                          {payment.isFlagged && (
                            <p className="text-xs text-orange-600 mt-1">
                              {payment.flagReason || "Flagged for review"}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.transactionId ? (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {payment.transactionId}
                            </code>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        {canEditDelete && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEdit(payment)}
                                title="Edit payment"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <FaEdit />
                              </button>
                              {payment.status === "FLAGGED" && (
                                <button
                                  onClick={() => handleApprove(payment.id)}
                                  title="Approve payment"
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                  <FaCheck />
                                </button>
                              )}
                              {payment.status === "COMPLETED" && (
                                <button
                                  onClick={() => handleRefund(payment.id)}
                                  title="Refund payment"
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                >
                                  <FaUndo />
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteId(payment.id)}
                                title="Delete payment"
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      {editPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Edit Payment
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  name="method"
                  value={editForm.method}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {METHOD_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($)
                </label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.amount}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" loading={editLoading}>
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEdit}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
            <div className="text-center">
              <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Delete Payment?
              </h2>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. The payment record will be
                permanently removed.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleDelete}
                  loading={deleteLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <FaTrash className="mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteId(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
