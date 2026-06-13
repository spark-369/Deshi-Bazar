"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaBox,
  FaCheck,
  FaShippingFast,
  FaCheckCircle,
  FaEye,
  FaDownload,
  FaEdit,
  FaSave,
  FaPlus,
  FaTrash,
  FaTimes,
  FaInfoCircle,
  FaUser,
  FaMapMarkerAlt,
  FaFileInvoice,
  FaDollarSign,
  FaClipboardList,
  FaTag,
  FaArrowLeft,
} from "react-icons/fa";
import { orderService } from "@/services/orderService";
import { Button, Input } from "@/components/common";

/* ── reusable modal backdrop ─────────────────────────────────────────── */
function Modal({ open, onClose, title, children, width = "max-w-3xl" }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* panel */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ── status badge helper ─────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    REQUESTED: "bg-yellow-100 text-yellow-800 border-yellow-200",
    VERIFIED: "bg-blue-100 text-blue-800 border-blue-200",
    CONFIRMED: "bg-green-100 text-green-800 border-green-200",
    PROCESSING: "bg-indigo-100 text-indigo-800 border-indigo-200",
    OUT_FOR_DELIVERY: "bg-amber-100 text-amber-800 border-amber-200",
    SHIPPED: "bg-purple-100 text-purple-800 border-purple-200",
    DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    RETURNED: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
        styles[status] || "bg-gray-100 text-gray-800 border-gray-200"
      }`}
    >
      {status}
    </span>
  );
}

/* ── VIEW MODAL: normal (product) order ─────────────────────────────── */
function ProductOrderViewModal({ order, onClose }) {
  if (!order) return null;

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={`Order #${order.orderNumber}`}
    >
      <div className="space-y-6">
        {/* Order info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Buyer
            </label>
            <div className="flex items-center">
              <FaUser className="text-gray-400 mr-2" />
              <span className="text-gray-900 font-medium">
                {order.user?.name || order.user?.email || "N/A"}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Buyer Phone
            </label>
            <span className="text-gray-900">
              {order.user?.phone || "Not provided"}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Order Date
            </label>
            <span className="text-gray-900">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Shipping Address
            </label>
            <div className="flex items-start">
              <FaMapMarkerAlt className="text-gray-400 mr-2 mt-1" />
              <span className="text-gray-900">
                {order.shippingAddress || "Not provided"}
              </span>
            </div>
          </div>
          {order.notes && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Notes
              </label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {order.notes}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Shipping Method
            </label>
            <span className="text-gray-900">
              {order.shippingMethod || "Not set"}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Distance
            </label>
            <span className="text-gray-900">
              {order.distance ? `${order.distance.toFixed(2)} km` : "N/A"}
            </span>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Predicted Delivery Date
            </label>
            <span className="text-gray-900">
              {order.predictedDeliveryDate
                ? new Date(order.predictedDeliveryDate).toLocaleDateString()
                : "Not set"}
            </span>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Status
          </label>
          <StatusBadge status={order.status} />
        </div>

        {/* Items */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Order Items ({order.items?.length || 0})
          </h4>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <img
                  src={item.product?.images?.[0] || "/file.svg"}
                  alt={item.product?.name}
                  className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/file.svg";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {item.product?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    ${item.finalPrice?.toFixed(2)} each × {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ${(item.finalPrice * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${order.subtotal?.toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount</span>
              <span className="font-medium text-green-600">
                -${order.discount?.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (10%)</span>
            <span className="font-medium">${order.tax?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              ${order.shippingCost?.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total</span>
            <span className="text-green-600">${order.total?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ── EDIT MODAL: normal (product) order ─────────────────────────────── */
function ProductOrderEditModal({ order, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    status: order?.status || "PENDING",
    shippingAddress: order?.shippingAddress || "",
    notes: order?.notes || "",
    shippingMethod: order?.shippingMethod || "standard",
    predictedDeliveryDate: order?.predictedDeliveryDate
      ? new Date(order.predictedDeliveryDate).toISOString().split("T")[0]
      : "",
  });

  // Update form when order changes
  useEffect(() => {
    if (order) {
      setForm({
        status: order.status || "PENDING",
        shippingAddress: order.shippingAddress || "",
        notes: order.notes || "",
        shippingMethod: order.shippingMethod || "standard",
        predictedDeliveryDate: order.predictedDeliveryDate
          ? new Date(order.predictedDeliveryDate).toISOString().split("T")[0]
          : "",
      });
    }
  }, [order]);

  if (!order) return null;

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={`Edit Order #${order.orderNumber}`}
    >
      <div className="space-y-5">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Status
          </label>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>

        {/* Shipping Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shipping Address
          </label>
          <textarea
            value={form.shippingAddress}
            onChange={(e) => update("shippingAddress", e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter shipping address..."
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter order notes..."
          />
        </div>

        {/* Shipping Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shipping Method
          </label>
          <select
            value={form.shippingMethod}
            onChange={(e) => update("shippingMethod", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="standard">Standard</option>
            <option value="express">Express</option>
            <option value="overnight">Overnight</option>
          </select>
        </div>

        {/* Predicted Delivery Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Predicted Delivery Date
          </label>
          <input
            type="date"
            value={form.predictedDeliveryDate}
            onChange={(e) => update("predictedDeliveryDate", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => onSave({ ...order, ...form })}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" /> Save Changes
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── VIEW MODAL: custom order ───────────────────────────────────────── */
function CustomOrderViewModal({ order, onClose }) {
  if (!order) return null;
  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={`Custom Order #${order.orderNumber}`}
    >
      <div className="space-y-6">
        {/* Order info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Buyer
            </label>
            <div className="flex items-center">
              <FaUser className="text-gray-400 mr-2" />
              <span className="text-gray-900 font-medium">
                {order.buyer?.name || order.buyer?.email || "N/A"}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Buyer Phone
            </label>
            <span className="text-gray-900">
              {order.buyer?.phone || "Not provided"}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Order Date
            </label>
            <span className="text-gray-900">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Shipping Address
            </label>
            <div className="flex items-start">
              <FaMapMarkerAlt className="text-gray-400 mr-2 mt-1" />
              <span className="text-gray-900">
                {order.shippingAddress || "Not provided"}
              </span>
            </div>
          </div>
          {order.notes && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Notes
              </label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {order.notes}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Shipping Method
            </label>
            <span className="text-gray-900">
              {order.shippingMethod || "Not set"}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Distance
            </label>
            <span className="text-gray-900">
              {order.distance ? `${order.distance.toFixed(2)} km` : "N/A"}
            </span>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Status
          </label>
          <StatusBadge status={order.status} />
        </div>

        {/* Items */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Order Items ({order.items?.length || 0})
          </h4>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                  <h5 className="font-semibold text-gray-900">
                    {item.customItemName}
                  </h5>
                  <span className="text-sm text-gray-500">
                    Requested: {item.requestedQuantity} {item.unit || "units"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Verified Qty:</span>
                    <p className="font-medium text-gray-900">
                      {item.verifiedQuantity ?? "—"} {item.unit || "units"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Price/Unit:</span>
                    <p className="font-medium text-gray-900">
                      ${item.verifiedPrice?.toFixed(2) ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium text-gray-900">{item.status}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Item Total:</span>
                    <p className="font-bold text-blue-600">
                      $
                      {(
                        Number(item.verifiedQuantity || 0) *
                        Number(item.verifiedPrice || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
                {item.sellerNotes && (
                  <p className="mt-2 text-sm text-gray-500 italic bg-gray-50 p-2 rounded">
                    Note: {item.sellerNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${order.subtotal?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (10%)</span>
            <span className="font-medium">${order.tax?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              ${order.shippingCost?.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total</span>
            <span className="text-green-600">${order.total?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ── EDIT MODAL: custom order ───────────────────────────────────────── */
function CustomOrderEditModal({ order, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    status: order?.status || "PENDING",
    shippingCost: order?.shippingCost ?? "",
    shippingAddress: order?.shippingAddress || "",
    notes: order?.notes || "",
    shippingMethod: order?.shippingMethod || "standard",
  });

  // Update form when order changes
  useEffect(() => {
    if (order) {
      setForm({
        status: order.status || "PENDING",
        shippingCost: order.shippingCost ?? "",
        shippingAddress: order.shippingAddress || "",
        notes: order.notes || "",
        shippingMethod: order.shippingMethod || "standard",
      });
    }
  }, [order]);

  if (!order) return null;

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateItem = (itemId, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: (prev.items || order.items).map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const items = form.items || order.items;

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={`Edit Custom Order #${order.orderNumber}`}
      width="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Order-level fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Status
            </label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Shipping Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipping Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.shippingCost}
              onChange={(e) => update("shippingCost", e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Shipping Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipping Address
            </label>
            <textarea
              value={form.shippingAddress}
              onChange={(e) => update("shippingAddress", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter shipping address..."
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter order notes..."
            />
          </div>

          {/* Shipping Method */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipping Method
            </label>
            <select
              value={form.shippingMethod}
              onChange={(e) => update("shippingMethod", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="standard">Standard</option>
              <option value="express">Express</option>
              <option value="overnight">Overnight</option>
            </select>
          </div>
        </div>

        {/* Items editor */}
        <div>
          <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <FaBox className="mr-2 text-blue-600" />
            Edit Items ({items?.length || 0})
          </h5>
          <div className="space-y-4">
            {items?.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h6 className="font-semibold text-gray-900">
                    {item.customItemName}
                  </h6>
                  <span className="text-sm text-gray-500">
                    Requested: {item.requestedQuantity} {item.unit || "units"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Verified Quantity */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Verified Quantity
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.verifiedQuantity ?? ""}
                      onChange={(e) =>
                        updateItem(item.id, "verifiedQuantity", e.target.value)
                      }
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Verified Price */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Price per Unit ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.verifiedPrice ?? ""}
                      onChange={(e) =>
                        updateItem(item.id, "verifiedPrice", e.target.value)
                      }
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Item Status */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Item Status
                    </label>
                    <select
                      value={item.status || "AVAILABLE"}
                      onChange={(e) =>
                        updateItem(item.id, "status", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="UNAVAILABLE">Unavailable</option>
                      <option value="ADJUSTED">Adjusted</option>
                    </select>
                  </div>

                  {/* Item Total (read-only) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Item Total
                    </label>
                    <span className="text-lg font-bold text-blue-600">
                      $
                      {(
                        Number(item.verifiedQuantity || 0) *
                        Number(item.verifiedPrice || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Seller Notes */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Seller Notes
                  </label>
                  <input
                    type="text"
                    value={item.sellerNotes || ""}
                    onChange={(e) =>
                      updateItem(item.id, "sellerNotes", e.target.value)
                    }
                    placeholder="Add notes for this item..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() =>
              onSave({
                ...order,
                ...form,
                items,
              })
            }
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" /> Save All Changes
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                              */
/* ═══════════════════════════════════════════════════════════════════════ */
export default function SellerOrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("orders");
  const [productOrders, setProductOrders] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [viewingProductOrder, setViewingProductOrder] = useState(null);
  const [editingProductOrder, setEditingProductOrder] = useState(null);
  const [viewingCustomOrder, setViewingCustomOrder] = useState(null);
  const [editingCustomOrder, setEditingCustomOrder] = useState(null);

  // Saving / deleting state
  const [savingProductOrder, setSavingProductOrder] = useState(null);
  const [savingCustomOrder, setSavingCustomOrder] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch only regular (product) orders for the Product Orders tab
      const productData = await orderService.getRegularOrders({
        type: "seller",
      });
      setProductOrders(Array.isArray(productData) ? productData : []);
      // Fetch only custom orders for the Custom Orders tab
      const customData = await orderService.getCustomOrders({ type: "seller" });
      setCustomOrders(Array.isArray(customData) ? customData : []);
    } catch (err) {
      setError(err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* ── Product order actions ─────────────────────────────────────────── */

  const handleSaveProductOrderEdits = async (order) => {
    try {
      setSavingProductOrder(order.id);
      await orderService.updateOrderDetails(order.id, {
        status: order.status,
        shippingAddress: order.shippingAddress,
        notes: order.notes,
        shippingMethod: order.shippingMethod,
        predictedDeliveryDate: order.predictedDeliveryDate || null,
      });
      await fetchOrders();
      setEditingProductOrder(null);
    } catch (err) {
      setError(err.message || "Failed to save order changes");
    } finally {
      setSavingProductOrder(null);
    }
  };

  const handleDeleteProductOrder = async (orderId) => {
    if (
      !confirm(
        "Are you sure you want to delete this order? This action cannot be undone.",
      )
    )
      return;
    try {
      setDeletingOrder(orderId);
      await orderService.deleteOrder(orderId);
      await fetchOrders();
    } catch (err) {
      setError(err.message || "Failed to delete order");
    } finally {
      setDeletingOrder(null);
    }
  };

  /* ── Custom order actions ──────────────────────────────────────────── */

  const handleSaveCustomOrderEdits = async (order) => {
    try {
      setSavingCustomOrder(order.id);

      // First, update order-level fields (status, shippingAddress, notes, shippingMethod)
      await orderService.updateCustomOrderDetails(order.id, {
        status: order.status,
        shippingAddress: order.shippingAddress,
        notes: order.notes,
        shippingMethod: order.shippingMethod,
      });

      // Then, update items if they have been modified
      const updatedItems = order.items.map((item) => ({
        id: item.id,
        verifiedQuantity: parseFloat(item.verifiedQuantity || 0),
        verifiedPrice: parseFloat(item.verifiedPrice || 0),
        status: item.status || "AVAILABLE",
        sellerNotes: item.sellerNotes || "",
      }));
      const shippingCost = parseFloat(order.shippingCost) || 0;

      // Only call verify if items have verified quantities/prices
      const hasItemUpdates = updatedItems.some(
        (item) => item.verifiedQuantity > 0 || item.verifiedPrice > 0,
      );

      if (hasItemUpdates) {
        await orderService.verifyCustomOrder(
          order.id,
          updatedItems,
          shippingCost,
        );
      }

      await fetchOrders();
      setEditingCustomOrder(null);
    } catch (err) {
      setError(err.message || "Failed to save custom order changes");
    } finally {
      setSavingCustomOrder(null);
    }
  };

  const handleDeleteCustomOrder = async (orderId) => {
    if (
      !confirm(
        "Are you sure you want to delete this custom order? This action cannot be undone.",
      )
    )
      return;
    try {
      setDeletingOrder(orderId);
      await orderService.deleteCustomOrder(orderId);
      await fetchOrders();
    } catch (err) {
      setError(err.message || "Failed to delete custom order");
    } finally {
      setDeletingOrder(null);
    }
  };

  /* ── Render: loading / error ───────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchOrders}>Retry</Button>
        </div>
      </div>
    );
  }

  /* ── Render: main page ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-1 text-gray-600">
            View and manage all your product and custom orders
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-6 w-fit">
          <button
            onClick={() => {
              setActiveTab("orders");
              setViewingProductOrder(null);
              setEditingProductOrder(null);
              setViewingCustomOrder(null);
              setEditingCustomOrder(null);
            }}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "orders"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <FaBox className="inline mr-2" />
            Regular Orders ({productOrders.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("custom");
              setViewingProductOrder(null);
              setEditingProductOrder(null);
              setViewingCustomOrder(null);
              setEditingCustomOrder(null);
            }}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "custom"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <FaClipboardList className="inline mr-2" />
            Custom Orders ({customOrders.length})
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  ORDERS TAB (Normal/Product Orders)                           */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {productOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <FaBox className="mx-auto text-4xl text-gray-300 mb-4" />
                <p className="text-gray-500">No orders found.</p>
              </div>
            ) : (
              productOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Order header bar */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">
                        #{order.orderNumber}
                      </h3>
                      <StatusBadge status={order.status} />
                      <span className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        Buyer: {order.user?.name || order.buyer?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingProductOrder(order)}
                      >
                        <FaEye className="mr-1" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProductOrder(order)}
                      >
                        <FaEdit className="mr-1" /> Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteProductOrder(order.id)}
                        disabled={deletingOrder === order.id}
                      >
                        <FaTrash className="mr-1" />{" "}
                        {deletingOrder === order.id ? "..." : "Delete"}
                      </Button>
                    </div>
                  </div>

                  {/* Collapsed summary row */}
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          Items:{" "}
                          <span className="font-medium text-gray-900">
                            {order.items?.length || 0}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-xl font-bold text-green-600">
                          ${order.total?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/*  CUSTOM ORDERS TAB                                            */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "custom" && (
          <div className="space-y-4">
            {customOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <FaClipboardList className="mx-auto text-4xl text-gray-300 mb-4" />
                <p className="text-gray-500">No custom orders found.</p>
              </div>
            ) : (
              customOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Order header bar */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">
                        #{order.orderNumber}
                      </h3>
                      <StatusBadge status={order.status} />
                      <span className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        Buyer:{" "}
                        {order.buyer?.name || order.buyer?.email || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingCustomOrder(order)}
                      >
                        <FaEye className="mr-1" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCustomOrder(order)}
                      >
                        <FaEdit className="mr-1" /> Edit All Details
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteCustomOrder(order.id)}
                        disabled={deletingOrder === order.id}
                      >
                        <FaTrash className="mr-1" />{" "}
                        {deletingOrder === order.id ? "..." : "Delete"}
                      </Button>
                    </div>
                  </div>

                  {/* Collapsed summary row */}
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          Items:{" "}
                          <span className="font-medium text-gray-900">
                            {order.items?.length || 0}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-xl font-bold text-green-600">
                          ${order.total?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODALS                                                        */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* Product order – View */}
      <ProductOrderViewModal
        order={viewingProductOrder}
        onClose={() => setViewingProductOrder(null)}
      />

      {/* Product order – Edit */}
      <ProductOrderEditModal
        order={editingProductOrder}
        onClose={() => setEditingProductOrder(null)}
        onSave={handleSaveProductOrderEdits}
        saving={savingProductOrder === editingProductOrder?.id}
      />

      {/* Custom order – View */}
      <CustomOrderViewModal
        order={viewingCustomOrder}
        onClose={() => setViewingCustomOrder(null)}
      />

      {/* Custom order – Edit */}
      <CustomOrderEditModal
        order={editingCustomOrder}
        onClose={() => setEditingCustomOrder(null)}
        onSave={handleSaveCustomOrderEdits}
        saving={savingCustomOrder === editingCustomOrder?.id}
      />
    </div>
  );
}
