"use client";

import { useState, useEffect } from "react";
import { adminService, orderService } from "@/services";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@/components/common";
import AddressDisplay from "@/components/common/AddressDisplay";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaCheck,
  FaShippingFast,
  FaCheckCircle,
  FaFilter,
  FaDownload,
  FaTimes,
  FaSave,
  FaShoppingBag,
  FaUser,
  FaCalendar,
  FaDollarSign,
  FaBox,
} from "react-icons/fa";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "" });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: "",
    notes: "",
    shippingAddress: "",
    shippingMethod: "standard",
    predictedDeliveryDate: "",
    shippingCost: "",
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await adminService.getOrders(filters);
      const regular = (data.regular || []).map((order) => ({
        ...order,
        orderType: "regular",
        customer: order.user,
        seller: null,
      }));
      const custom = (data.custom || []).map((order) => ({
        ...order,
        orderType: "custom",
        customer: order.buyer,
        seller: order.seller,
      }));

      setOrders(regular);
      setCustomOrders(custom);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status, orderType = "regular") => {
    try {
      const token = localStorage.getItem("token");
      let endpoint = "";
      let bodyData = { status: status.toUpperCase() };

      if (orderType === "custom") {
        endpoint = `/api/custom-orders/${orderId}`;
      } else {
        endpoint = `/api/orders`;
        bodyData = { orderId, ...bodyData };
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) throw new Error(`Failed to update ${orderType} order`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update order status");
    }
    fetchOrders();
  };

  const viewOrder = async (order) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        order.orderType === "custom"
          ? `/api/custom-orders/${order.id}`
          : `/api/orders/${order.id}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch order details");

      const fullOrder = await response.json();
      setSelectedOrder(fullOrder);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
      alert("Failed to load order details");
    }
  };

  const editOrder = (order) => {
    setSelectedOrder(order);
    setEditForm({
      status: order.status,
      notes: order.notes || "",
      shippingAddress: order.shippingAddress || "",
      shippingMethod: order.shippingMethod || "standard",
      predictedDeliveryDate: order.predictedDeliveryDate
        ? new Date(order.predictedDeliveryDate).toISOString().split("T")[0]
        : "",
    });
    setIsEditModalOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedOrder) return;
    try {
      const updateData = {
        status: editForm.status,
        notes: editForm.notes,
        shippingAddress: editForm.shippingAddress,
        shippingMethod: editForm.shippingMethod,
      };

      if (
        selectedOrder.orderType !== "custom" &&
        editForm.predictedDeliveryDate
      ) {
        updateData.predictedDeliveryDate = editForm.predictedDeliveryDate;
      }

      if (selectedOrder.orderType === "custom") {
        updateData.shippingCost = parseFloat(editForm.shippingCost) || 0;
      }

      const token = localStorage.getItem("token");
      let endpoint = "";
      let bodyData = updateData;

      if (selectedOrder.orderType === "custom") {
        endpoint = `/api/custom-orders/${selectedOrder.id}`;
      } else {
        endpoint = `/api/orders`;
        bodyData = { orderId: selectedOrder.id, ...updateData };
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) throw new Error("Failed to update order");

      setIsEditModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error("Error saving edit:", error);
      alert("Failed to update order");
    }
  };

  const deleteOrder = async (order) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrder) return;
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        selectedOrder.orderType === "custom"
          ? `/api/custom-orders/${selectedOrder.id}`
          : `/api/orders/${selectedOrder.id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete order");

      setIsDeleteModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Failed to delete order");
    }
  };

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    VERIFIED: "bg-orange-100 text-orange-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-indigo-100 text-indigo-800",
    OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    SHIPPED: "bg-teal-100 text-teal-800",
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const renderOrderCard = (order, isCustom) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 bg-blue-50 rounded-lg flex items-center justify-center">
            <FaShoppingBag className="text-blue-600 text-sm sm:text-base" />
          </div>
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
              #{order.orderNumber}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2">
          <FaUser className="text-gray-400 mt-0.5 flex-shrink-0 text-xs" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Customer</p>
            <p className="font-medium text-gray-900 truncate">
              {order?.customer?.name || order?.buyer?.name || "N/A"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {order.customer?.email || "N/A"}
            </p>
          </div>
        </div>

        {isCustom && (
          <div className="flex items-start gap-2">
            <FaUser className="text-gray-400 mt-0.5 flex-shrink-0 text-xs" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Seller</p>
              <p className="font-medium text-gray-900 truncate">
                {order.seller?.name || "N/A"}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2">
          <FaBox className="text-gray-400 mt-0.5 flex-shrink-0 text-xs" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Items</p>
            <p className="font-medium text-gray-900">
              {order.items?.length || 0} item(s)
            </p>
            <p className="text-xs text-gray-500 truncate">
              {order.items
                ?.map((i) => i.product?.name || i.customItemName)
                .join(", ")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 sm:col-span-2">
          <FaShippingFast className="text-gray-400 mt-0.5 flex-shrink-0 text-xs" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Shipping Address</p>
            <p className="font-medium text-gray-900">
              <AddressDisplay order={order} type="shipping" />
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <FaDollarSign className="text-gray-400 mt-0.5 flex-shrink-0 text-xs" />
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="font-semibold text-green-600 text-base sm:text-lg">
              Tk.{order.total?.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 pt-2 border-t border-gray-100">
        <Button
          size="sm"
          variant="outline"
          onClick={() => viewOrder(order)}
          className="flex items-center justify-center gap-1.5 flex-1"
        >
          <FaEye className="text-xs" /> View
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => editOrder(order)}
          className="flex items-center justify-center gap-1.5 flex-1"
        >
          <FaEdit className="text-xs" /> Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => deleteOrder(order)}
          className="flex items-center justify-center gap-1.5 flex-1 text-red-600 border-red-300 hover:bg-red-50"
        >
          <FaTrash className="text-xs" /> Delete
        </Button>
      </div>
    </div>
  );

  const renderOrders = (orderList, isCustom) => (
    <>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {orderList.map((order) => (
          <div key={order.id}>{renderOrderCard(order, isCustom)}</div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              {isCustom && (
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
              )}
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orderList.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap font-medium">
                  #{order.orderNumber}
                </td>
                <td className="px-4 lg:px-6 py-4">
                  <div>
                    <p className="font-medium text-sm text-gray-900 truncate max-w-[150px] lg:max-w-[200px]">
                      {order?.customer?.name || order?.buyer?.name || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[150px] lg:max-w-[200px]">
                      {order.customer?.email || "N/A"}
                    </p>
                  </div>
                </td>
                {isCustom && (
                  <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {order.seller?.name || "N/A"}
                  </td>
                )}
                <td className="px-4 lg:px-6 py-4">
                  <div className="text-sm">
                    <p className="text-gray-900">
                      {order.items?.length || 0} item(s)
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[180px] lg:max-w-xs">
                      {order.items
                        ?.map((i) => i.product?.name || i.customItemName)
                        .join(", ")}
                    </p>
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap font-semibold text-sm">
              Tk.{order.total?.toFixed(2)}
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col lg:flex-row gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewOrder(order)}
                      className="flex items-center justify-center gap-1"
                    >
                      <FaEye /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editOrder(order)}
                      className="flex items-center justify-center gap-1"
                    >
                      <FaEdit /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteOrder(order)}
                      className="flex items-center justify-center gap-1 text-red-600 border-red-300"
                    >
                      <FaTrash /> Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalOrders = orders.length + customOrders.length;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Order Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage all regular and custom orders
            </p>
          </div>
          <div className="flex xs:flex-row flex-col gap-2 w-full xs:w-auto">
            <Button
              onClick={fetchOrders}
              variant="outline"
              className="flex items-center justify-center gap-2 w-full xs:w-auto"
            >
              <FaFilter /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Total Orders
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                  {totalOrders}
                </p>
              </div>
              <FaEye className="text-blue-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Regular Orders
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {orders.length}
                </p>
              </div>
              <FaCheckCircle className="text-green-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Custom Orders
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                  {customOrders.length}
                </p>
              </div>
              <FaShippingFast className="text-purple-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Pending
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">
                  {[...orders, ...customOrders].filter((o) => o.status === "PENDING").length}
                </p>
              </div>
              <FaFilter className="text-yellow-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 gap-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "all"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            All Orders ({totalOrders})
          </button>
          <button
            onClick={() => setActiveTab("regular")}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "regular"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Regular ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "custom"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Custom ({customOrders.length})
          </button>
        </div>

        {/* Orders Table / Cards */}
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : activeTab === "all" ? (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                    Regular Orders
                  </h2>
                  {orders.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 text-sm">
                      No regular orders found
                    </p>
                  ) : (
                    renderOrders(orders, false)
                  )}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                    Custom Orders
                  </h2>
                  {customOrders.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 text-sm">
                      No custom orders found
                    </p>
                  ) : (
                    renderOrders(customOrders, true)
                  )}
                </div>
              </div>
            ) : activeTab === "regular" ? (
              orders.length === 0 ? (
                <p className="text-gray-500 text-center py-12 text-sm">
                  No regular orders found
                </p>
              ) : (
                renderOrders(orders, false)
              )
            ) : customOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-12 text-sm">
                No custom orders found
              </p>
            ) : (
              renderOrders(customOrders, true)
            )}
          </CardContent>
        </Card>

        {/* View Order Modal */}
        {isViewModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md sm:max-w-lg lg:max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Order Details
                </h2>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order Number</p>
                    <p className="font-medium text-sm sm:text-base">
                      #{selectedOrder.orderNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[selectedOrder.status] || "bg-gray-100 text-gray-800"}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedOrder?.user?.name ||
                        selectedOrder?.buyer?.name ||
                        "N/A"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {selectedOrder?.user?.email ||
                        selectedOrder?.buyer?.email ||
                        "N/A"}
                    </p>
                  </div>
                  {selectedOrder.seller && (
                    <div>
                      <p className="text-sm text-gray-600">Seller</p>
                      <p className="font-medium text-sm sm:text-base">
                        {selectedOrder.seller.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {selectedOrder.seller.email}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-lg sm:text-xl font-bold text-green-600">
                      Tk.{selectedOrder.total?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="text-sm sm:text-base">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Items</p>
                  <div className="border border-gray-200 rounded-lg divide-y">
                    {selectedOrder.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 flex flex-col xs:flex-row xs:justify-between gap-2"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {item.product?.name || item.customItemName}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Qty: {item.quantity || item.requestedQuantity}
                          </p>
                        </div>
                        <p className="font-medium text-sm text-right">
                          Tk.
                          {(item.finalPrice || item.verifiedPrice || 0)?.toFixed(
                            2,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="text-sm sm:text-base text-gray-800">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {selectedOrder.delivery && (
                  <div>
                    <p className="text-sm text-gray-600">Delivery</p>
                    <p className="text-sm sm:text-base">
                      Carrier: {selectedOrder.delivery.carrier || "N/A"}
                    </p>
                    <p className="text-sm sm:text-base">
                      Tracking: {selectedOrder.delivery.trackingNumber || "N/A"}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-6 border-t border-gray-100">
                <Button
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Order Modal */}
        {isEditModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md sm:max-w-lg max-h-[90vh] flex flex-col">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Edit Order
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {selectedOrder.orderType === "custom" ? (
                      <>
                        <option value="PENDING">PENDING</option>
                        <option value="VERIFIED">VERIFIED</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </>
                    ) : (
                      <>
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Add notes..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {selectedOrder.orderType !== "custom" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shipping Address
                      </label>
                      <textarea
                        value={editForm.shippingAddress}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            shippingAddress: e.target.value,
                          }))
                        }
                        placeholder="Enter shipping address..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shipping Method
                      </label>
                      <select
                        value={editForm.shippingMethod}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            shippingMethod: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="standard">Standard</option>
                        <option value="express">Express</option>
                        <option value="overnight">Overnight</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Predicted Delivery Date
                      </label>
                      <input
                        type="date"
                        value={editForm.predictedDeliveryDate}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            predictedDeliveryDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
                {selectedOrder.orderType === "custom" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                       Shipping Cost (Tk.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.shippingCost}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          shippingCost: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col-reverse xs:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full xs:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEdit}
                  className="flex items-center justify-center gap-2 w-full xs:w-auto"
                >
                  <FaSave /> Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm sm:max-w-md max-h-[90vh] flex flex-col">
              <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-red-600 mb-3 sm:mb-4">
                  Confirm Delete
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Are you sure you want to delete order{" "}
                  <strong className="text-gray-900">
                    #{selectedOrder.orderNumber}
                  </strong>
                  ? This action cannot be undone.
                </p>
                <div className="flex flex-col-reverse xs:flex-row justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-full xs:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    className="bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2 w-full xs:w-auto"
                  >
                    <FaTrash /> Delete
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
