"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaTrash,
  FaMinus,
  FaPlus,
  FaShoppingCart,
  FaArrowRight,
  FaMoneyBillWave,
  FaMobile,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { orderService, api, paymentService } from "@/services";
import { Card, Button, Input } from "@/components/common";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const {
    cart,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  } = useCart();
  const [processing, setProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [mobileNumber, setMobileNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [orderCreated, setOrderCreated] = useState(null);
  const [shippingMethod, setShippingMethod] = useState("standard");

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile();
    }
  }, [isAuthenticated, user]);

  const fetchUserProfile = async () => {
    try {
      const data = await api.get("/api/users/profile");
      setUserProfile(data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateQuantity(itemId, newQuantity);
  };

  const handleRemove = async (itemId) => {
    await removeFromCart(itemId);
  };

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      // Build shipping address from user profile
      const addressParts = [];
      if (userProfile?.profile?.address)
        addressParts.push(userProfile.profile.address);
      if (userProfile?.profile?.city)
        addressParts.push(userProfile.profile.city);
      if (userProfile?.profile?.state)
        addressParts.push(userProfile.profile.state);
      if (userProfile?.profile?.zipCode)
        addressParts.push(userProfile.profile.zipCode);
      if (userProfile?.profile?.country)
        addressParts.push(userProfile.profile.country);

      const shippingAddress =
        addressParts.length > 0
          ? addressParts.join(", ")
          : "No address on file";

      const orderData = {
        shippingMethod,
        shippingAddress,
      };
      const order = await orderService.createOrder(orderData);
      if (order) {
        setOrderCreated(order);
        setShowPaymentModal(true);
      }
    } catch (error) {
      alert(error.response?.data?.error || "Failed to place order");
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!orderCreated) return;

    setProcessing(true);
    try {
      const billingAddress = orderCreated.shippingAddress;

      // Process payment
      const payment = await paymentService.processPayment({
        orderId: orderCreated.id,
        amount: orderCreated.total,
        method: paymentMethod,
        billingAddress,
        transactionId: transactionId || undefined,
        mobileNumber: mobileNumber || undefined,
      });

      if (payment) {
        alert("Payment successful! Order confirmed.");
        router.push("/orders");
      }
    } catch (error) {
      alert(error.response?.data?.error || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const items = cart?.items || [];
  const totalPrice = cart?.totalPrice || 0;
  const discount = cart?.discount || 0;
  const finalPrice = cart?.finalPrice || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-6">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link href="/products">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.productId}`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600"
                      >
                        {item.product?.name}
                      </Link>
                      <p className="text-gray-500 text-sm mt-1">
                        {item.product?.category?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {item.offerPrice &&
                        item.offerPrice < item.originalPrice ? (
                          <>
                            <span className="text-lg font-bold text-green-600">
                              ${item.finalPrice?.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              ${item.originalPrice?.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            ${item.originalPrice?.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Quantity & Actions */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                            className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                            disabled={item.quantity <= 1}
                          >
                            <FaMinus size={12} />
                          </button>
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                            className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            <FaPlus size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <div className="flex justify-between">
                <Link href="/products">
                  <Button variant="outline">Continue Shopping</Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Clear entire cart?")) clearCart();
                  }}
                >
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({items.length} items)</span>
                    <span>${totalPrice?.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  
                  <div className="pt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipping Method
                    </label>
                    <select
                      value={shippingMethod}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="standard">Standard (3-5 days)</option>
                      <option value="express">Express (1-2 days)</option>
                      <option value="overnight">Overnight (Next day)</option>
                    </select>
                  </div>
                  
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${finalPrice?.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleCheckout}
                  loading={processing}
                >
                  Proceed to Checkout <FaArrowRight className="ml-2" />
                </Button>

                {/* Suggested Items */}
                {cart?.suggestedItems?.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Frequently Bought Together
                    </h3>
                    <div className="space-y-2">
                      {cart.suggestedItems.slice(0, 3).map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                        >
                          <span>🛍️</span>
                          <span className="line-clamp-1">{product.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && orderCreated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Complete Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Order Total: <span className="font-bold text-lg">${orderCreated.total?.toFixed(2)}</span>
              </p>
              <p className="text-gray-600 mb-4">
                Shipping to: {orderCreated.shippingAddress}
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-2 ${
                    paymentMethod === "cod"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300"
                  }`}
                >
                  <FaMoneyBillWave size={24} className={paymentMethod === "cod" ? "text-blue-500" : "text-gray-400"} />
                  <span className="text-sm font-medium">Cash on Delivery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bkash")}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-2 ${
                    paymentMethod === "bkash"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300"
                  }`}
                >
                  <FaMobile size={24} className={paymentMethod === "bkash" ? "text-blue-500" : "text-gray-400"} />
                  <span className="text-sm font-medium">bKash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("nagad")}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-2 ${
                    paymentMethod === "nagad"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300"
                  }`}
                >
                  <FaMobile size={24} className={paymentMethod === "nagad" ? "text-blue-500" : "text-gray-400"} />
                  <span className="text-sm font-medium">Nagad</span>
                </button>
              </div>

              {(paymentMethod === "bkash" || paymentMethod === "nagad") && (
                <>
                  <div className="mb-4">
                    <Input
                      label="Mobile Number"
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <Input
                      label="Transaction ID"
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter transaction ID"
                      required
                    />
                  </div>
                </>
              )}

              {paymentMethod === "cod" && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  <strong>Note:</strong> Cash on Delivery - Please keep exact amount ready at the time of delivery.
                </div>
              )}
            </div>

              <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPaymentModal(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handlePayment}
                loading={processing}
                disabled={
                  processing ||
                  ((paymentMethod === "bkash" || paymentMethod === "nagad") &&
                    (!mobileNumber || !transactionId))
                }
              >
                Pay ${orderCreated.total?.toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
