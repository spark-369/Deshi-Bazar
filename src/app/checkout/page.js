"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaMobileAlt,
  FaMoneyBillWave,
  FaArrowLeft,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { orderService, paymentService, api } from "@/services";
import { Card, Button } from "@/components/common";

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { cart, loading: cartLoading, refreshCart } = useCart();
  const [processing, setProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  
  // Bkash payment fields
  const [mobileNumber, setMobileNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    if (!cartLoading && (!isAuthenticated || !cart || cart.items.length === 0)) {
      router.push("/cart");
    }
    if (isAuthenticated && user) {
      fetchUserProfile();
      // Get buyer's current location
      getBuyerLocation();
    }
  }, [isAuthenticated, user, cart, cartLoading, router]);

  const fetchUserProfile = async () => {
    try {
      const data = await api.get("/api/users/profile");
      setUserProfile(data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  const getBuyerLocation = async () => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by your browser");
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const { latitude, longitude } = position.coords;
      
      // Update user profile with coordinates
      await api.put("/api/users/profile", {
        latitude,
        longitude
      });
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        profile: {
          ...prev?.profile,
          latitude,
          longitude
        }
      }));
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Build shipping address from user profile (street address only)
      const p = userProfile?.profile || {};
      const shippingAddress = p.address || "No address on file";

      const addressFields = {
        shipCountry: p.country || "",
        shipDivision: p.division || "",
        shipDistrict: p.district || "",
        shipPostalCode: p.postalCode || "",
        billingCountry: p.country || "",
        billingDivision: p.division || "",
        billingDistrict: p.district || "",
        billingPostalCode: p.postalCode || "",
      };

      // Get buyer coordinates from user profile (placeholder - would need to add lat/lng to profile)
      const buyerLatitude = userProfile?.profile?.latitude || 23.8103; // Default to Dhaka
      const buyerLongitude = userProfile?.profile?.longitude || 90.4125; // Default to Dhaka

      // For seller coordinates, we'll use the first product's seller (simplified)
      // In a real app, you might want to calculate based on all sellers or use a warehouse location
      let sellerLatitude = 23.8103; // Default to Dhaka
      let sellerLongitude = 90.4125; // Default to Dhaka
      if (cart.items.length > 0 && cart.items[0]?.product?.sellerId) {
        // We would fetch the seller's profile here to get their coordinates
        // For now, using defaults
      }

      // Create the order first
      const orderData = {
        shippingMethod: "standard",
        shippingAddress,
        ...addressFields,
        buyerLatitude,
        buyerLongitude,
        sellerLatitude,
        sellerLongitude,
      };
      const order = await orderService.createOrder(orderData);

      // Process payment based on method
      if (paymentMethod === "bkash") {
        // Validate Bkash fields
        if (!mobileNumber || !transactionId) {
          alert("Please enter mobile number and transaction ID");
          setProcessing(false);
          return;
        }

        const paymentData = {
          orderId: order.id,
          amount: order.total,
          method: "bkash",
          shippingAddress,
          ...addressFields,
          transactionId,
          mobileNumber,
        };

        await paymentService.processPayment(paymentData);
      } else if (paymentMethod === "cod") {
        // For COD, create a pending payment record
        const paymentData = {
          orderId: order.id,
          amount: order.total,
          method: "cod",
          shippingAddress,
          ...addressFields,
        };

        await paymentService.processPayment(paymentData);
      }

      // Refresh cart and redirect to orders
      await refreshCart();
      alert("Order placed successfully!");
      router.push("/orders");
    } catch (error) {
console.error("Payment error:", error);
      alert(error.data?.error || error.message || "Failed to process order");
    } finally {
      setProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <Link href="/cart" className="text-blue-600 hover:underline">
            Go to Cart
          </Link>
        </div>
      </div>
    );
  }

  const items = cart.items || [];
  const totalPrice = cart.totalPrice || 0;
  const discount = cart.discount || 0;
  const tax = totalPrice * 0.1;
  const shippingCost = items.reduce((sum, item) => sum + (item.product?.shippingCostPerUnit || 0) * item.quantity, 0);
  const total = totalPrice + tax + shippingCost - discount;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="flex items-center text-gray-600 hover:text-blue-600 mb-4"
          >
            <FaArrowLeft className="mr-2" /> Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Order Summary */}
          <div>
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              
              {/* Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
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
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product?.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      ${(item.finalPrice * item.quantity)?.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${totalPrice?.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>${shippingCost?.toFixed(2)} (per item)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span>${tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>${total?.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Payment */}
          <div>
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Method
              </h2>

              {/* Payment Method Selection */}
              <div className="space-y-4 mb-6">
                {/* Bkash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bkash")}
                  className={`w-full p-4 border rounded-lg text-left ${
                    paymentMethod === "bkash"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FaMobileAlt className="text-pink-600 text-xl" />
                    <div>
                      <p className="font-medium text-gray-900">Bkash Payment</p>
                      <p className="text-sm text-gray-500">Pay with Bkash mobile banking</p>
                    </div>
                  </div>
                </button>

                {/* Cash on Delivery */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`w-full p-4 border rounded-lg text-left ${
                    paymentMethod === "cod"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FaMoneyBillWave className="text-green-600 text-xl" />
                    <div>
                      <p className="font-medium text-gray-900">Cash on Delivery</p>
                      <p className="text-sm text-gray-500">Pay when you receive</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Bkash Details */}
              {paymentMethod === "bkash" && (
                <div className="space-y-4 mb-6 p-4 bg-pink-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">Bkash Payment Details</h3>
                  <p className="text-sm text-gray-600">
                    Send {total?.toFixed(2)} to: <strong>01XXXXXXXXX</strong>
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction ID *
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter Bkash transaction ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    * Please ensure you have made the payment before placing order
                  </p>
                </div>
              )}

              {/* COD Info */}
              {paymentMethod === "cod" && (
                <div className="space-y-4 mb-6 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">Cash on Delivery</h3>
                  <p className="text-sm text-gray-600">
                    You will pay {total?.toFixed(2)} when the order is delivered to your address.
                  </p>
                </div>
              )}

              {/* Pay Button */}
              <Button
                className="w-full"
                onClick={handlePayment}
                loading={processing}
                disabled={processing}
              >
                {paymentMethod === "bkash" 
                  ? `Pay Tk.${total?.toFixed(2)} via Bkash` 
                  : "Place Order (Cash on Delivery)"}
              </Button>
            </Card>

            {/* Shipping Address */}
            <Card className="p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Shipping Address
              </h2>
              <div className="text-sm text-gray-600">
                {userProfile?.profile ? (
                  <>
                    <p>{userProfile.profile.address}</p>
                    <p>
                      {userProfile.profile.district}
                      {userProfile.profile.division
                        ? `, ${userProfile.profile.division}`
                        : ""}{" "}
                      {userProfile.profile.postalCode}
                    </p>
                    <p>{userProfile.profile.country}</p>
                  </>
                ) : (
                  <p className="text-gray-400">No address on file</p>
                )}
              </div>
              <Link
                href="/profile"
                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
              >
                Edit in Profile
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
