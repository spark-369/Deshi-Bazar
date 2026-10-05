"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { orderService } from "@/services/orderService";
import { Button } from "@/components/common";
import AddressDisplay from "@/components/common/AddressDisplay";
import {
  FaCheck,
  FaArrowLeft,
  FaUser,
  FaMapMarkerAlt,
  FaBox,
  FaClipboardList,
  FaDollarSign,
  FaFileInvoice,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

export default function SellerCustomOrderDetail() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getCustomOrder(id);
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
      router.push("/seller/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedItems = order.items.map((item) => ({
        id: item.id,
        verifiedQuantity: Number(item.verifiedQuantity) || 0,
        verifiedPrice: Number(item.verifiedPrice) || 0,
        status: item.status || "AVAILABLE",
        sellerNotes: item.sellerNotes || "",
      }));
      const shippingCost = Number(order.shippingCost) || 0;
      await orderService.verifyCustomOrder(id, updatedItems, shippingCost);
      await fetchOrder();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      await orderService.confirmCustomOrder(id);
      await fetchOrder();
    } catch (error) {
      console.error("Error confirming:", error);
      alert("Confirm failed");
    } finally {
      setConfirming(false);
    }
  };

  const updateItemField = (itemId, field, value) => {
    const newItems = order.items.map((item) =>
      item.id === itemId ? { ...item, [field]: value } : item,
    );
    setOrder({ ...order, items: newItems });
  };

  const updateOrderField = (field, value) => {
    setOrder({ ...order, [field]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested order could not be found.
          </p>
          <Button onClick={() => router.push("/seller/orders")}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const isSeller = user?.role === "SELLER" && order.sellerId === user.id;
  const isBuyer = user?.role === "BUYER" && order.userId === user.id;
  const isAdmin = user?.role === "ADMIN";

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "VERIFIED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Custom Order #{order.orderNumber}
            </h1>
            <p className="mt-1 text-gray-600">
              Manage and verify custom order items
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
                order.status,
              )}`}
            >
              {order.status}
            </span>
            <Button variant="outline" onClick={() => router.back()}>
              <FaArrowLeft className="mr-2" />
              Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaFileInvoice className="mr-2 text-blue-600" />
                  Order Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Buyer
                    </label>
                    <div className="flex items-center">
                      <FaUser className="text-gray-400 mr-2" />
                      <span className="text-gray-900 font-medium">
                        {order.buyer.name || order.buyer.email}
                      </span>
                    </div>
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
                        <AddressDisplay order={order} type="shipping" />
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Billing Address
                    </label>
                    <div className="flex items-start">
                      <FaMapMarkerAlt className="text-gray-400 mr-2 mt-1" />
                      <span className="text-gray-900">
                        <AddressDisplay order={order} type="billing" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaBox className="mr-2 text-blue-600" />
                  Order Items ({order.items.length})
                </h2>
              </div>
               <div className="p-6">
                 <div className="space-y-4">
                   {order.items.map((item) => {
                     const productStock = item.product?.stock;
                     const isInsufficientStock =
                       productStock !== undefined &&
                       productStock !== null &&
                       item.requestedQuantity > productStock;

                     return (
                     <div
                       key={item.id}
                       className={`border rounded-lg p-4 ${
                         isInsufficientStock
                           ? "border-red-300 bg-red-50"
                           : "border-gray-200 hover:shadow-md transition-shadow"
                       }`}
                     >
                       {isInsufficientStock && (
                         <div className="mb-3 px-3 py-2 bg-red-100 border border-red-200 rounded-md">
                           <p className="text-xs font-medium text-red-700">
                             Insufficient stock: requested {item.requestedQuantity}{" "}
                             {item.unit || "units"} but only {productStock} available
                           </p>
                         </div>
                       )}
                       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                         <h3 className="text-lg font-semibold text-gray-900">
                           {item.customItemName}
                         </h3>
                         <span className="text-sm text-gray-500">
                           Requested: {item.requestedQuantity}{" "}
                           {item.unit || "units"}
                         </span>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                         <div>
                           <label className="block text-xs font-medium text-gray-500 mb-1">
                             Verified Quantity
                           </label>
                           <input
                             type="number"
                             step="0.01"
                             value={item.verifiedQuantity ?? ""}
                             onChange={async (e) => {
                                const value = e.target.value;
                                updateItemField(
                                  item.id,
                                  "verifiedQuantity",
                                  value,
                                );
                                if (value && (item.verifiedPrice === null || item.verifiedPrice === undefined)) {
                                  try {
                                    const result = await orderService.autoPriceItem(id, item.customItemName);
                                    if (result.price !== null) {
                                      updateItemField(item.id, "verifiedPrice", result.price.toString());
                                    }
                                  } catch (error) {
                                    console.error("Error auto-pricing item:", error);
                                  }
                                }
                              }}
                             placeholder="0.00"
                             disabled={!isSeller && !isAdmin}
                             className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:border-blue-500 ${
                               isInsufficientStock
                                 ? "border-red-300 bg-red-50 text-red-700 focus:ring-red-500 focus:border-red-500"
                                 : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                             }`}
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-medium text-gray-500 mb-1">
                             Price per Unit
                           </label>
                           <input
                             type="number"
                             step="0.01"
                             value={item.verifiedPrice ?? ""}
                             onChange={(e) =>
                               updateItemField(
                                 item.id,
                                 "verifiedPrice",
                                 e.target.value,
                               )
                             }
                             placeholder="0.00"
                             disabled={!isSeller && !isAdmin}
                             className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:border-blue-500 ${
                               isInsufficientStock
                                 ? "border-red-300 bg-red-50 text-red-700 focus:ring-red-500 focus:border-red-500"
                                 : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                             }`}
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-medium text-gray-500 mb-1">
                             Status
                           </label>
                           <select
                             value={item.status || "AVAILABLE"}
                             onChange={(e) =>
                               updateItemField(item.id, "status", e.target.value)
                             }
                             className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:border-blue-500 ${
                               isInsufficientStock
                                 ? "border-red-300 bg-red-50 text-red-700 focus:ring-red-500 focus:border-red-500"
                                 : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                             }`}
                             disabled={!isSeller && !isAdmin}
                           >
                             <option value="AVAILABLE">Available</option>
                             <option value="UNAVAILABLE">Unavailable</option>
                             <option value="ADJUSTED">Adjusted</option>
                           </select>
                         </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Item Total
                          </label>
                          <span className={`text-lg font-bold ${
                            isInsufficientStock ? "text-red-600" : "text-blue-600"
                          }`}>
                            $
                            {(
                              Number(item.verifiedQuantity || 0) *
                              Number(item.verifiedPrice || 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                       </div>

                       <div className="mt-3">
                         <label className="block text-xs font-medium text-gray-500 mb-1">
                           Seller Notes
                         </label>
                         <input
                           type="text"
                           value={item.sellerNotes || ""}
                           onChange={(e) =>
                             updateItemField(
                               item.id,
                               "sellerNotes",
                               e.target.value,
                             )
                           }
                           placeholder="Add notes for this item..."
                           disabled={!isSeller && !isAdmin}
                           className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:border-blue-500 ${
                             isInsufficientStock
                               ? "border-red-300 bg-red-50 text-red-700 focus:ring-red-500 focus:border-red-500"
                               : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                           }`}
                         />
                       </div>
                     </div>
                     );
                   })}
                 </div>
               </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaDollarSign className="mr-2 text-blue-600" />
                  Order Summary
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      ${order.subtotal?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (10%):</span>
                    <span className="font-medium">
                      ${order.tax?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shipping:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={order.shippingCost ?? ""}
                      onChange={(e) =>
                        updateOrderField("shippingCost", e.target.value)
                      }
                      className="w-24 text-right px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!isSeller && !isAdmin}
                    />
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-green-600">
                        $
                        {(
                          (order.subtotal || 0) +
                          (order.tax || 0) +
                          (Number(order.shippingCost) || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaClipboardList className="mr-2 text-blue-600" />
                  Actions
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {/* Seller Actions */}
                {(isSeller || isAdmin) && order.status === "PENDING" && (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-semibold"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-2" />
                        Save & Verify Order
                      </>
                    )}
                  </Button>
                )}

                {/* Buyer Actions */}
                {isBuyer && order.status === "VERIFIED" && (
                  <Button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold"
                  >
                    {confirming ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Confirming...
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-2" />
                        Confirm Order
                      </>
                    )}
                  </Button>
                )}

                {/* No Actions Available */}
                {!((isSeller || isAdmin) && order.status === "PENDING") &&
                  !(isBuyer && order.status === "VERIFIED") && (
                    <p className="text-center text-gray-500 py-4">
                      {order.status === "CONFIRMED"
                        ? "Order has been confirmed"
                        : "No actions available for this order status"}
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
