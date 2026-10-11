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
  FaSearch,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { paymentService } from "@/services";

const METHOD_OPTIONS = ["bkash", "nagad", "cod"];

export default function PaymentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [editPayment, setEditPayment] = useState(null);
  const [editForm, setEditForm] = useState({ method: "", amount: 0, status: "PENDING" });
  const [editLoading, setEditLoading] = useState(false);

  const STATUS_OPTIONS = ["PENDING", "COMPLETED", "FAILED", "REFUNDED", "FLAGGED"];

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
  }, [isAuthenticated, search, statusFilter, pagination.page]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        status: statusFilter || undefined,
        page: pagination.page,
        limit: 20,
      };
      const data = await paymentService.getPayments(params);
      setPayments(Array.isArray(data) ? data : data.payments || []);
      if (data.pagination) {
        setPagination({
          page: data.pagination.page || 1,
          totalPages: data.pagination.totalPages || 1,
          total: data.pagination.total || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
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
        className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border whitespace-nowrap ${styles[status] || styles.PENDING}`}
      >
        {status}
      </span>
    );
  };

  // Resolve the linked order reference and type for a payment
  const getOrderRef = (payment) => {
    if (payment.customOrder) {
      return {
        type: "Custom",
        number: payment.customOrder.orderNumber,
        status: payment.customOrder.status,
      };
    }
    if (payment.order) {
      return {
        type: "Order",
        number: payment.order.orderNumber,
        status: payment.order.status,
      };
    }
    return { type: "N/A", number: "N/A", status: null };
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Order #",
      "Type",
      "Method",
      "Amount",
      "Status",
      "Transaction ID",
    ];
    const rows = payments.map((payment) => {
      const orderRef = getOrderRef(payment);
      return [
        new Date(payment.createdAt).toLocaleDateString(),
        orderRef.number,
        orderRef.type,
        payment.method,
        `Tk.${payment.amount?.toFixed(2)}`,
        payment.status,
        payment.transactionId || "N/A",
      ];
    });

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

  const openEdit = (payment) => {
    setEditPayment(payment);
    setEditForm({
      method: payment.method || "",
      amount: payment.amount || 0,
      status: payment.status || "PENDING",
    });
  };

  const closeEdit = () => {
    setEditPayment(null);
    setEditForm({ method: "", amount: 0, status: "PENDING" });
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
        status: editForm.status,
      });
      await fetchPayments();
      closeEdit();
    } catch (err) {
      alert(err.data?.error || err.message || "Failed to update payment");
    } finally {
      setEditLoading(false);
    }
  };

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

  const handleApprove = async (paymentId) => {
    try {
      await paymentService.approvePayment(paymentId);
      await fetchPayments();
    } catch (err) {
      alert(err.data?.error || err.message || "Failed to approve payment");
    }
  };

  if (authLoading || initialLoading) {
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
    return {
      label: "Total Spent",
      value: completedPayments.reduce((sum, p) => sum + p.amount, 0),
      colorClass: "text-green-600",
      iconClass: "text-green-500",
    };
  };

  const statConfig = getStatConfig();

  const startItem = (pagination.page - 1) * 20 + 1;
  const endItem = Math.min(pagination.page * 20, pagination.total);

  const renderPaymentCard = (payment) => {
    const orderRef = getOrderRef(payment);
    return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm sm:text-base font-semibold text-gray-900">
            #{orderRef.number}
          </p>
          <p className="text-xs text-gray-500">
            {orderRef.status
              ? orderRef.status.replace("_", " ")
              : "Unknown"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {getStatusBadge(payment.status)}
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {orderRef.type}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Date</p>
          <p className="font-medium text-gray-900">
            {new Date(payment.createdAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Method</p>
          <p className="font-medium text-gray-900 uppercase flex items-center gap-1.5">
            <FaCreditCard className="text-blue-600 text-xs" />
            {payment.method}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Amount</p>
          <p className="font-bold text-gray-900 text-base sm:text-lg">
            Tk. {payment.amount?.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Transaction</p>
          {payment.transactionId ? (
            <code className="text-xs bg-gray-100 px-2 py-1 rounded block truncate">
              {payment.transactionId}
            </code>
          ) : (
            <span className="text-gray-400 text-xs">-</span>
          )}
        </div>
      </div>

      {payment.isFlagged && (
        <div className="text-xs text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded-lg">
          {payment.flagReason || "Flagged for review"}
        </div>
      )}

      {canEditDelete && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEdit(payment)}
            className="flex items-center justify-center gap-1.5 flex-1"
          >
            <FaEdit className="text-xs" /> Edit
          </Button>
          {payment.status === "FLAGGED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApprove(payment.id)}
              className="flex items-center justify-center gap-1.5 flex-1 text-green-600 border-green-300 hover:bg-green-50"
            >
              <FaCheck className="text-xs" /> Approve
            </Button>
          )}
          {payment.status === "COMPLETED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRefund(payment.id)}
              className="flex items-center justify-center gap-1.5 flex-1 text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <FaUndo className="text-xs" /> Refund
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDeleteId(payment.id)}
            className="flex items-center justify-center gap-1.5 flex-1 text-red-600 border-red-300 hover:bg-red-50"
          >
            <FaTrash className="text-xs" /> Delete
          </Button>
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                Payment History
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                View and manage your payments
              </p>
            </div>
            {payments.length > 0 && (
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm"
              >
                <FaDownload /> Export CSV
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col xs:flex-row gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search payments..."
                value={search}
                                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full pl-9 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white w-full xs:w-auto"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="FLAGGED">Flagged</option>
            </select>
          </div>
        </div>

        {/* Stats Cards - role-based labels */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Total Payments
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                  {payments.length}
                </p>
              </div>
              <FaCreditCard className="text-blue-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {statConfig.label}
                </p>
                <p
                  className={`text-lg sm:text-xl lg:text-2xl font-bold ${statConfig.colorClass}`}
                >
                  Tk. {statConfig.value.toFixed(2)}
                </p>
              </div>
              <FaCheck className={`${statConfig.iconClass} text-lg sm:text-xl lg:text-2xl flex-shrink-0`} />
            </div>
          </Card>

          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Flagged
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                  {flaggedCount}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Requires review
                </p>
              </div>
              <FaExclamationTriangle className="text-orange-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
        </div>

        {/* Payments Table / Cards */}
        <Card>
          <CardContent className="p-0">
            {payments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaCreditCard className="text-3xl sm:text-4xl mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base">No payments found</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <div key={payment.id}>
                      {renderPaymentCard(payment)}
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction
                        </th>
                        {canEditDelete && (
                          <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                       {payments.map((payment) => {
                         const orderRef = getOrderRef(payment);
                         return (
                         <tr key={payment.id} className="hover:bg-gray-50">
                           <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                             {new Date(payment.createdAt).toLocaleDateString()}
                             <div className="text-xs text-gray-500">
                               {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                           </td>
                           <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                             <div>
                               <p className="text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-[150px]">
                                 #{orderRef.number}
                               </p>
                               <p className="text-xs text-gray-500 truncate max-w-[100px] sm:max-w-[150px]">
                                 {orderRef.status?.replace("_", " ")}
                               </p>
                             </div>
                           </td>
                           <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                             <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                               {orderRef.type}
                             </span>
                           </td>
                           <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                             <div className="flex items-center gap-1.5 sm:gap-2">
                               <FaCreditCard className="text-blue-600 text-xs sm:text-sm" />
                               <span className="text-xs sm:text-sm font-medium text-gray-900 uppercase">
                                 {payment.method}
                               </span>
                             </div>
                           </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">
                            Tk. {payment.amount?.toFixed(2)}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(payment.status)}
                            {payment.isFlagged && (
                              <p className="text-xs text-orange-600 mt-1 truncate">
                                {payment.flagReason || "Flagged for review"}
                              </p>
                            )}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {payment.transactionId ? (
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded block truncate max-w-[120px] sm:max-w-[180px]">
                                {payment.transactionId}
                              </code>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          {canEditDelete && (
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEdit(payment)}
                                  title="Edit payment"
                                  className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <FaEdit />
                                </button>
                                {payment.status === "FLAGGED" && (
                                  <button
                                    onClick={() => handleApprove(payment.id)}
                                    title="Approve payment"
                                    className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  >
                                    <FaCheck />
                                  </button>
                                )}
                                {payment.status === "COMPLETED" && (
                                  <button
                                    onClick={() => handleRefund(payment.id)}
                                    title="Refund payment"
                                    className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  >
                                    <FaUndo />
                                  </button>
                                )}
                                <button
                                  onClick={() => setDeleteId(payment.id)}
                                  title="Delete payment"
                                  className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          )}
                          </tr>
                         );
                       })}
                     </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t">
                    <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                      Showing {startItem} to {endItem} of{" "}
                      {pagination.total} payments
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() =>
                          setPagination((p) => ({
                            ...p,
                            page: p.page - 1,
                          }))
                        }
                        className="flex-1 sm:flex-none justify-center"
                      >
                        <FaChevronLeft className="mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() =>
                          setPagination((p) => ({
                            ...p,
                            page: p.page + 1,
                          }))
                        }
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
        {editPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm sm:max-w-md max-h-[90vh] flex flex-col">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Edit Payment
                </h2>
                <button
                  onClick={closeEdit}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <FaTimes />
                </button>
              </div>
              <form
                onSubmit={handleEditSubmit}
                className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="method"
                    value={editForm.method}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                    Amount (Tk.)
                  </label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.amount}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col-reverse xs:flex-row gap-3 pt-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={editLoading}
                  >
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm sm:max-w-md max-h-[90vh] flex flex-col">
              <div className="p-4 sm:p-6">
                <div className="text-center">
                  <FaExclamationTriangle className="text-3xl sm:text-4xl text-red-500 mx-auto mb-3 sm:mb-4" />
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    Delete Payment?
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                    This action cannot be undone. The payment record will be
                    permanently removed.
                  </p>
                  <div className="flex flex-col-reverse xs:flex-row gap-3">
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
          </div>
        )}
      </div>
    </div>
  );
}
