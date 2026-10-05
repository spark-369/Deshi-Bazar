"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/services";
import { Card, Button } from "@/components/common";
import {
  FaBox,
  FaShippingFast,
  FaCheck,
  FaTimes,
  FaClock,
  FaTrash,
  FaEye,
  FaDownload,
  FaFileCsv,
  FaFilePdf,
  FaFilter,
  FaCalendar,
  FaDollarSign,
  FaShoppingBag,
} from "react-icons/fa";

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const status = filter === "ALL" ? null : filter;
      const data = await orderService.getOrders(status);
      const ordersArray = Array.isArray(data) ? data : data.orders || [];
      setOrders(ordersArray);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
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
    };
    return (
      <span
        className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${styles[status] || styles.PENDING}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: <FaClock className="text-yellow-500" />,
      VERIFIED: <FaCheck className="text-orange-500" />,
      CONFIRMED: <FaCheck className="text-blue-500" />,
      SHIPPED: <FaShippingFast className="text-purple-500" />,
      PROCESSING: <FaBox className="text-indigo-500" />,
      OUT_FOR_DELIVERY: <FaShippingFast className="text-amber-500" />,
      DELIVERED: <FaCheck className="text-green-500" />,
      CANCELLED: <FaTimes className="text-red-500" />,
      RETURNED: <FaTimes className="text-gray-500" />,
    };
    return icons[status] || <FaBox className="text-gray-400" />;
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      await orderService.cancelOrder(orderId);
      fetchOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Failed to cancel order");
    }
  };

  const handleReturnOrder = async (orderId) => {
    if (!confirm("Request a return for this order?")) return;

    try {
      await orderService.returnOrder(orderId);
      fetchOrders();
    } catch (error) {
      console.error("Error returning order:", error);
      alert("Failed to process return request");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Order #", "Date", "Status", "Items", "Total"];
    const rows = orders.map((order) => [
      order.orderNumber,
      new Date(order.createdAt).toLocaleDateString(),
      order.status,
      order.items?.length || 0,
      order.total?.toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Export to PDF (simple text-based)
  const exportToPDF = () => {
    let content = `ORDERS REPORT\nGenerated: ${new Date().toLocaleString()}\n\n`;
    orders.forEach((order, index) => {
      content += `${index + 1}. Order #${order.orderNumber}\n`;
      content += `   Date: ${new Date(order.createdAt).toLocaleDateString()}\n`;
      content += `   Status: ${order.status}\n`;
      content += `   Items: ${order.items?.length || 0}\n`;
      content += `   Total: Tk.${order.total?.toFixed(2)}\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <FaBox className="text-white text-2xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <FaShoppingBag className="text-white text-lg sm:text-xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                My Orders
              </h1>
              <p className="text-sm sm:text-base text-gray-500 mt-0.5">
                Track and manage your orders
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaFilter className="text-blue-600 text-xs sm:text-sm" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              Filter by status
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {[
              "ALL",
              "PENDING",
              "CONFIRMED",
              "SHIPPED",
              "DELIVERED",
              "CANCELLED",
            ].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  filter === status
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                {status === "ALL" ? "All Orders" : status}
              </button>
            ))}
          </div>
        </div>

        {/* Export Buttons */}
        {orders.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2 border border-gray-200 w-full sm:w-auto"
            >
              <FaFileCsv className="text-green-600" />
              Export CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportToPDF}
              className="flex items-center gap-2 border border-gray-200 w-full sm:w-auto"
            >
              <FaFilePdf className="text-red-600" />
              Export PDF
            </Button>
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <FaBox className="text-3xl sm:text-4xl text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto px-4">
              {filter !== "ALL"
                ? `You don't have any ${filter.toLowerCase()} orders`
                : "Start shopping to see your orders here"}
            </p>
            <Link href="/products">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Browse Products
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center border border-gray-100 flex-shrink-0">
                      {getStatusIcon(order.status)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                          Order #{order.orderNumber}
                        </h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <FaCalendar className="text-gray-400" />
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FaShoppingBag className="text-gray-400" />
                          {order.items?.length || 0} item
                          {order.items?.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {order.items?.slice(0, 2).length > 0 && (
                        <div className="mt-1.5 text-xs sm:text-sm text-gray-400 truncate">
                          {order.items
                            ?.slice(0, 2)
                            .map(
                              (item) =>
                                item.product?.name ||
                                item.customItemName ||
                                "Custom Item",
                            )
                            .join(", ")}
                          {order.items?.length > 2 && (
                            <span className="text-gray-300">
                              {" "}
                              +{order.items.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Total & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="text-xs sm:text-sm text-gray-500">
                        Total
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-green-600">
                        {order.total?.toFixed(2)} Tk.
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Link
                        href={`/orders/${order.id}`}
                        className="flex-1 sm:flex-none"
                      >
                        <Button variant="ghost" size="sm" className="w-full">
                          <FaEye className="mr-1" />
                          View
                        </Button>
                      </Link>
                      {order.status === "VERIFIED" && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="w-full sm:w-auto"
                          onClick={async () => {
                            try {
                              await orderService.confirmCustomOrder(order.id);
                              fetchOrders();
                            } catch (error) {
                              console.error("Confirm error:", error);
                              alert("Failed to confirm");
                            }
                          }}
                        >
                          Confirm
                        </Button>
                      )}
                      {order.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="danger"
                          className="w-full sm:w-auto"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <FaTimes className="mr-1" />
                          Cancel
                        </Button>
                      )}
                      {order.status === "DELIVERED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full sm:w-auto border-gray-300"
                          onClick={() => handleReturnOrder(order.id)}
                        >
                          <FaTrash className="mr-1" />
                          Return
                        </Button>
                      )}
                      {order.status === "SHIPPED" && (
                        <Button
                          size="sm"
                          variant="success"
                          className="w-full sm:w-auto"
                          onClick={async () => {
                            try {
                              await orderService.updateOrder(
                                order.id,
                                "deliver",
                              );
                              fetchOrders();
                            } catch (error) {
                              console.error("Delivery error:", error);
                              alert("Failed to mark as delivered");
                            }
                          }}
                        >
                          <FaCheck className="mr-1" />
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
