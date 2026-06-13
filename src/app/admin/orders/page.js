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
} from "react-icons/fa";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "" });

  // Modal states
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
      // Get token from localStorage
      const token = localStorage.getItem("token");

      let endpoint = "";
      let bodyData = { status: status.toUpperCase() };

      if (orderType === "custom") {
        // For custom orders, use the item endpoint with PUT
        endpoint = `/api/custom-orders/${orderId}`;
      } else {
        // For regular orders, use the collection endpoint with PUT and include orderId
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
      // Get token from localStorage
      const token = localStorage.getItem("token");

      // Determine endpoint based on order type
      const endpoint =
        order.orderType === "custom"
          ? `/api/custom-orders/${order.id}`
          : `/api/orders/${order.id}`;

      // Fetch the full order details with auth
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

      // Add predictedDeliveryDate for regular orders
      if (
        selectedOrder.orderType !== "custom" &&
        editForm.predictedDeliveryDate
      ) {
        updateData.predictedDeliveryDate = editForm.predictedDeliveryDate;
      }

      // Add shippingCost for custom orders
      if (selectedOrder.orderType === "custom") {
        updateData.shippingCost = parseFloat(editForm.shippingCost) || 0;
      }

      // Get token from localStorage
      const token = localStorage.getItem("token");

      let endpoint = "";
      let bodyData = updateData;

      if (selectedOrder.orderType === "custom") {
        // For custom orders, use the item endpoint with PUT
        endpoint = `/api/custom-orders/${selectedOrder.id}`;
      } else {
        // For regular orders, use the collection endpoint with PUT and include orderId
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
      // Get token from localStorage
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
  };

  const renderOrders = (orderList, isCustom = false) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Order #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Customer
            </th>
            {isCustom && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Seller
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Items
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orderList.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-medium">
                #{order.orderNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <p className="font-medium">
                    {order?.customer?.name || order?.buyer?.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.customer?.email || "N/A"}
                  </p>
                </div>
              </td>
              {isCustom && (
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.seller?.name || "N/A"}
                </td>
              )}
              <td className="px-6 py-4">
                <div className="text-sm">
                  {order.items?.length || 0} item(s)
                  <p className="text-xs text-gray-500 truncate max-w-xs">
                    {order.items
                      ?.map((i) => i.product?.name || i.customItemName)
                      .join(", ")}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-semibold">
                ${order.total?.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewOrder(order)}
                    className="flex items-center gap-1"
                  >
                    <FaEye /> View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editOrder(order)}
                    className="flex items-center gap-1"
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteOrder(order)}
                    className="flex items-center gap-1 text-red-600 border-red-300"
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all regular and custom orders
            </p>
          </div>
          <Button
            onClick={fetchOrders}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FaFilter />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <FaEye className="text-blue-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Regular Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <FaCheckCircle className="text-green-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Custom Orders</p>
                <p className="text-2xl font-bold">{customOrders.length}</p>
              </div>
              <FaShippingFast className="text-purple-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {
                    [...orders, ...customOrders].filter(
                      (o) => o.status === "PENDING",
                    ).length
                  }
                </p>
              </div>
              <FaFilter className="text-yellow-500 text-2xl" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "all"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            All Orders ({totalOrders})
          </button>
          <button
            onClick={() => setActiveTab("regular")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "regular"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Regular ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "custom"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Custom ({customOrders.length})
          </button>
        </div>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : activeTab === "all" ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-4">Regular Orders</h2>
                  {orders.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No regular orders found
                    </p>
                  ) : (
                    renderOrders(orders, false)
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-4">Custom Orders</h2>
                  {customOrders.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No custom orders found
                    </p>
                  ) : (
                    renderOrders(customOrders, true)
                  )}
                </div>
              </div>
            ) : activeTab === "regular" ? (
              orders.length === 0 ? (
                <p className="text-gray-500 text-center py-12">
                  No regular orders found
                </p>
              ) : (
                renderOrders(orders, false)
              )
            ) : customOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-12">
                No custom orders found
              </p>
            ) : (
              renderOrders(customOrders, true)
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Order Modal */}
      {isViewModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Order Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-medium">#{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedOrder.status]}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">
                    {selectedOrder?.user?.name ||
                      selectedOrder?.buyer?.name ||
                      "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedOrder?.user?.email ||
                      selectedOrder?.buyer?.email ||
                      "N/A"}
                  </p>
                </div>
                {selectedOrder.seller && (
                  <div>
                    <p className="text-sm text-gray-600">Seller</p>
                    <p className="font-medium">{selectedOrder.seller.name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedOrder.seller.email}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-green-600">
                    ${selectedOrder.total?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Items</p>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex justify-between">
                      <div>
                        <p className="font-medium">
                          {item.product?.name || item.customItemName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity || item.requestedQuantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        $
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
                  <p className="text-gray-800">{selectedOrder.notes}</p>
                </div>
              )}

              {selectedOrder.delivery && (
                <div>
                  <p className="text-sm text-gray-600">Delivery</p>
                  <p>Carrier: {selectedOrder.delivery.carrier || "N/A"}</p>
                  <p>
                    Tracking: {selectedOrder.delivery.trackingNumber || "N/A"}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Edit Order</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
              {selectedOrder.orderType === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Cost ($)
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={saveEdit} className="flex items-center gap-2">
                <FaSave /> Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-red-600">
              Confirm Delete
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete order{" "}
              <strong>#{selectedOrder.orderNumber}</strong>? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
              >
                <FaTrash /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
