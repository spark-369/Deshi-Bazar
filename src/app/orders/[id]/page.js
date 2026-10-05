"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/services/orderService";
import { Card, Button } from "@/components/common";
import AddressDisplay from "@/components/common/AddressDisplay";
import {
  FaArrowLeft,
  FaBox,
  FaTruck,
  FaCreditCard,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaMapMarkerAlt,
  FaTag,
  FaFileInvoice,
  FaPhone,
} from "react-icons/fa";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { user, isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customOrder, setCustomOrder] = useState(null);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    fetchOrder();
  }, [id, isAuthenticated]);

  const fetchOrder = async () => {
    setLoading(true);

    setOrder(null);
    setCustomOrder(null);

    try {
      // try custom order first
      try {
        const custom = await orderService.getCustomOrder(id);

        if (custom?.id) {
          setCustomOrder(custom);
          return;
        }
      } catch (err) {
        // ignore custom order 404
        if (err.status !== 404) {
          throw err;
        }
      }

      // try normal order
      const normal = await orderService.getOrder(id);

      if (normal?.id) {
        setOrder(normal);
        return;
      }

      router.replace("/orders");
    } catch (error) {
      console.error("Error fetching order:", error);
      router.replace("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      if (isCustom) {
        await orderService.deleteCustomOrder(orderId);
      } else {
        await orderService.cancelOrder(orderId);
      }
      router.push("/orders");
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Failed to cancel order");
    }
  };

  const isCustom = !!customOrder;
  const currentOrder = isCustom ? customOrder : order;

  // Get seller phone for both normal and custom orders
  const getSellerPhone = () => {
    if (isCustom) {
      return currentOrder?.seller?.phone;
    }
    // For normal orders, get from first product's seller
    if (currentOrder?.items?.length > 0) {
      return currentOrder.items[0]?.product?.seller?.phone;
    }
    return null;
  };

  const getSellerName = () => {
    if (isCustom) {
      return currentOrder?.seller?.name;
    }
    // For normal orders, get from first product's seller
    if (currentOrder?.items?.length > 0) {
      return currentOrder.items[0]?.product?.seller?.name;
    }
    return null;
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
      VERIFIED: "bg-orange-100 text-orange-700 border-orange-200",
      CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
      SHIPPED: "bg-purple-100 text-purple-700 border-purple-200",
      PROCESSING: "bg-indigo-100 text-indigo-700 border-indigo-200",
      OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700 border-amber-200",
      DELIVERED: "bg-green-100 text-green-700 border-green-200",
      CANCELLED: "bg-red-100 text-red-700 border-red-200",
      RETURNED: "bg-gray-100 text-gray-700 border-gray-200",
      REQUESTED: "bg-blue-100 text-blue-700 border-blue-200",
    };
    return (
      <span
        className={`px-4 py-2 text-sm font-semibold rounded-full border ${styles[status] || styles.PENDING}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: <FaClock className="text-yellow-500" />,
      VERIFIED: <FaCheckCircle className="text-orange-500" />,
      CONFIRMED: <FaCheckCircle className="text-blue-500" />,
      SHIPPED: <FaTruck className="text-purple-500" />,
      PROCESSING: <FaBox className="text-indigo-500" />,
      OUT_FOR_DELIVERY: <FaTruck className="text-amber-500" />,
      DELIVERED: <FaCheckCircle className="text-green-500" />,
      CANCELLED: <FaTimesCircle className="text-red-500" />,
      RETURNED: <FaTimesCircle className="text-gray-500" />,
      REQUESTED: <FaBox className="text-blue-500" />,
    };
    return icons[status] || <FaBox className="text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <FaBox className="text-white text-2xl" />
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-10 rounded-3xl shadow-xl border border-gray-100 text-center bg-white/80 backdrop-blur-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FaBox className="text-2xl text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-500 mb-8">
            The order you're looking for doesn't exist.
          </p>
          <Link href="/orders">
            <Button variant="primary" size="lg" className="w-full">
              Back to Orders
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/orders"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Orders
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Order #{currentOrder.orderNumber}
                {isCustom && (
                  <span className="ml-2 text-sm font-normal bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Custom Order
                  </span>
                )}
              </h1>
              <p className="text-gray-500 mt-1">
                Placed on{" "}
                {new Date(currentOrder.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center border border-gray-100">
                {getStatusIcon(currentOrder.status)}
              </div>
              {getStatusBadge(currentOrder.status)}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items - Main Column */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaBox className="text-blue-600" />
                  Order Items
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {isCustom
                  ? currentOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-6 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center border border-gray-100 flex-shrink-0">
                            <FaBox className="text-blue-600 text-xl" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {item.customItemName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                              <span className="text-gray-600">
                                Requested: {item.requestedQuantity.toFixed(1)}{" "}
                                {item.unit || "units"}
                              </span>
                              {item.verifiedQuantity !== undefined && (
                                <span className="text-green-600 font-medium">
                                  Verified: {item.verifiedQuantity?.toFixed(1)}{" "}
                                   {item.unit || "units"} @ Tk.
                                   {item.verifiedPrice?.toFixed(2)}
                                </span>
                              )}
                            </div>
                            {item.sellerNotes && (
                              <p className="text-sm text-gray-500 mt-2 italic bg-gray-50 p-2 rounded border-l-2 border-gray-200">
                                Note: {item.sellerNotes}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  item.status === "AVAILABLE"
                                    ? "bg-green-100 text-green-700"
                                    : item.status === "REQUESTED"
                                      ? "bg-blue-100 text-blue-700"
                                      : item.status === "ADJUSTED"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-gray-900">
                              Tk.
                              {(
                                item.itemTotal ??
                                (item.verifiedQuantity ||
                                  item.requestedQuantity) *
                                  (item.verifiedPrice || 0)
                              ).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  : currentOrder.items?.map((item) => (
                      <div
                        key={item.id}
                        className="p-6 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <img
                            src={item.product?.images?.[0] || "/file.svg"}
                            alt={item.product?.name}
                            className="w-16 h-16 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/file.svg";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {item.product?.name}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              ${item.finalPrice?.toFixed(2)} each
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-semibold text-gray-600">
                              Qty: {item.quantity}
                            </p>
                            <p className="text-xl font-bold text-gray-900 mt-1">
                              ${(item.finalPrice * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaFileInvoice className="text-green-600" />
                  Order Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      Tk.
                      {currentOrder.subtotal?.toFixed(2) ||
                        currentOrder.total?.toFixed(2)}
                    </span>
                  </div>
                  {currentOrder.tax !== undefined && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">
                        Tk.{currentOrder.tax.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {currentOrder.shippingCost !== undefined && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">
                        Tk.{currentOrder.shippingCost.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-green-600">
                      Tk.{currentOrder.total?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Shipping Details */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-purple-600" />
                  Shipping Details
                </h2>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      Shipping Address
                    </p>
                    <p className="font-medium text-gray-900 whitespace-pre-line">
                      <AddressDisplay order={currentOrder} type="shipping" />
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      Billing Address
                    </p>
                    <p className="font-medium text-gray-900 whitespace-pre-line">
                      <AddressDisplay order={currentOrder} type="billing" />
                    </p>
                  </div>
                  {currentOrder.shippingMethod && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">
                        Shipping Method
                      </p>
                      <p className="font-medium text-gray-900">
                        {currentOrder.shippingMethod}
                      </p>
                    </div>
                  )}
                  {currentOrder.buyerLatitude !== undefined &&
                    currentOrder.buyerLongitude !== undefined &&
                    currentOrder.sellerLatitude !== undefined &&
                    currentOrder.sellerLongitude !== undefined && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          Buyer Location
                        </p>
                        <p className="font-medium text-gray-900">
                          {currentOrder.buyerLatitude},{" "}
                          {currentOrder.buyerLongitude}
                        </p>
                      </div>
                    )}
                  {currentOrder.buyerLatitude !== undefined &&
                    currentOrder.buyerLongitude !== undefined &&
                    currentOrder.sellerLatitude !== undefined &&
                    currentOrder.sellerLongitude !== undefined && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          Seller Location
                        </p>
                        <p className="font-medium text-gray-900">
                          {currentOrder.sellerLatitude},{" "}
                          {currentOrder.sellerLongitude}
                        </p>
                      </div>
                    )}
                  {/* Predicted Delivery Date - for normal orders only */}
                  {!isCustom && currentOrder.predictedDeliveryDate && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-600 mb-1 font-medium">
                        Predicted Delivery Date
                      </p>
                      <p className="font-semibold text-blue-900">
                        {new Date(
                          currentOrder.predictedDeliveryDate,
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                  {/* Seller Contact - for both normal and custom orders */}
                  {getSellerPhone() && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <p className="text-sm text-green-600 mb-1 font-medium flex items-center gap-1">
                        <FaPhone className="text-xs" />
                        Seller Contact
                      </p>
                      <p className="font-semibold text-green-900">
                        {getSellerName()}
                      </p>
                      <p className="text-green-800">
                        {getSellerPhone()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Payment Details */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaCreditCard className="text-green-600" />
                  Payment Details
                </h2>
                <div className="space-y-3">
                  {currentOrder.payments && currentOrder.payments.length > 0 ? (
                    currentOrder.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">
                            Payment Method
                          </span>
                          <span className="font-medium">
                            {payment.method || "Cash on Delivery"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Payment Status</span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              payment.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : payment.status === "FLAGGED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {payment.status || "Pending"}
                          </span>
                        </div>
                        {payment.transactionId && (
                          <div className="pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-600 mb-1">
                              Transaction ID
                            </p>
                            <p className="font-mono bg-gray-50 px-3 py-1.5 rounded-lg text-sm">
                              {payment.transactionId}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No payment record found.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Actions */}
            {(currentOrder.status === "PENDING" ||
              currentOrder.status === "REQUESTED") && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaTag className="text-red-600" />
                    Actions
                  </h2>
                  <Button
                    variant="danger"
                    size="lg"
                    className="w-full"
                    onClick={() => handleCancelOrder(currentOrder.id)}
                  >
                    <FaTimesCircle className="mr-2" />
                    Cancel Order
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
