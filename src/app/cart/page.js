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
import { orderService, api, paymentService, locationService } from "@/services";
import { Card, Button, Input } from "@/components/common";
import AddressDisplay from "@/components/common/AddressDisplay";

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

  // Custom shipping address (pre-filled from profile)
  const [shipCountry, setShipCountry] = useState("Bangladesh");
  const [shipDivision, setShipDivision] = useState("");
  const [shipDistrict, setShipDistrict] = useState("");
  const [shipPostalCode, setShipPostalCode] = useState("");
  const [shipAddress, setShipAddress] = useState("");
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile();
      loadDivisions();
    }
  }, [isAuthenticated, user]);

  const fetchUserProfile = async () => {
    try {
      const data = await api.get("/api/users/profile");
      setUserProfile(data);
      const p = data?.profile || {};
      setShipCountry(p.country || "Bangladesh");
      setShipDivision(p.division || "");
      setShipDistrict(p.district || "");
      setShipPostalCode(p.postalCode || "");
      setShipAddress(p.address || "");
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  const loadDivisions = async () => {
    try {
      const data = await locationService.getDivisions();
      setDivisions(data.divisions || []);
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  };

  useEffect(() => {
    const loadDistricts = async () => {
      if (!shipDivision) {
        setDistricts([]);
        return;
      }
      try {
        const data = await locationService.getDistricts(shipDivision);
        setDistricts(data.districts || []);
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };
    loadDistricts();
  }, [shipDivision]);

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
    // Validate shipping address before opening payment
    if (!shipAddress || !shipDivision || !shipDistrict || !shipPostalCode) {
      alert("Please fill in the complete shipping address.");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!paymentMethod) return;

    setProcessing(true);
    try {
      // Create the order only after payment is initiated
      const shippingAddress = shipAddress || "No address on file";
      const orderData = {
        shippingMethod,
        shippingAddress,
        shipCountry,
        shipDivision,
        shipDistrict,
        shipPostalCode,
      };
      const order = await orderService.createOrder(orderData);
      if (!order) {
        throw new Error("Failed to create order");
      }
      setOrderCreated(order);

      // Process payment
      const payment = await paymentService.processPayment({
        orderId: order.id,
        amount: order.total,
        method: paymentMethod,
        billingAddress: shippingAddress,
        transactionId: transactionId || undefined,
        mobileNumber: mobileNumber || undefined,
      });

      if (payment) {
        alert("Payment successful! Order confirmed.");
        router.push("/orders");
      }
    } catch (error) {
      alert(
        error.data?.error ||
          error.message ||
          "Payment failed. Please try again.",
      );
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-10 sm:py-16 px-4">
            <FaShoppingCart className="text-4xl sm:text-6xl text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
              Your cart is empty
            </h2>
            <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link href="/products">
              <Button className="w-full sm:w-auto">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="md:col-span-1 lg:col-span-2 space-y-3 sm:space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden mx-auto sm:mx-0">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <Link
                        href={`/products/${item.productId}`}
                        className="text-sm sm:text-base md:text-lg font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                      >
                        {item.product?.name}
                      </Link>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                        {item.product?.category?.name}
                      </p>
                      <div className="flex items-baseline justify-center sm:justify-start gap-2 mt-1.5 sm:mt-2">
                        {item.offerPrice &&
                        item.offerPrice < item.originalPrice ? (
                          <>
                            <span className="text-base sm:text-lg md:text-xl font-bold text-green-600">
                               Tk.{item.finalPrice?.toFixed(2)}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-400 line-through">
                               Tk.{item.originalPrice?.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                             Tk.{item.originalPrice?.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Quantity & Actions */}
                      <div className="flex flex-col xs:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-3 mt-3 sm:mt-4">
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                            className="p-1.5 sm:p-2 bg-gray-100 rounded-lg hover:bg-gray-200 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center touch-manipulation"
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <FaMinus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <span className="w-10 sm:w-12 text-center font-medium text-sm sm:text-base">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                            className="p-1.5 sm:p-2 bg-gray-100 rounded-lg hover:bg-gray-200 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center touch-manipulation"
                            aria-label="Increase quantity"
                          >
                            <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-2 text-red-500 hover:text-red-700 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center touch-manipulation"
                          aria-label="Remove item"
                        >
                          <FaTrash className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Link href="/products" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Continue Shopping
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Clear entire cart?")) clearCart();
                  }}
                  className="w-full sm:w-auto"
                >
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1 lg:col-span-1">
              <Card className="p-4 sm:p-6 lg:sticky lg:top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex justify-between text-sm sm:text-base text-gray-600">
                    <span>Subtotal ({items.length} items)</span>
                    <span>Tk.{totalPrice?.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm sm:text-base text-green-600">
                      <span>Discount</span>
                      <span>-Tk.{discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm sm:text-base text-gray-600">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>

                  <div className="pt-2 sm:pt-3">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Shipping Method
                    </label>
                    <select
                      value={shippingMethod}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="standard">Standard (3-5 days)</option>
                      <option value="express">Express (1-2 days)</option>
                      <option value="overnight">Overnight (Next day)</option>
                    </select>
                  </div>

                  {/* Custom Shipping Address */}
                  <div className="pt-3 sm:pt-4 border-t space-y-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-800">
                      Shipping Address
                    </h3>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Country
                      </label>
                      <select
                        value={shipCountry}
                        onChange={(e) => setShipCountry(e.target.value)}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Bangladesh">Bangladesh</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Division
                      </label>
                      <select
                        value={shipDivision}
                        onChange={(e) => {
                          setShipDivision(e.target.value);
                          setShipDistrict("");
                          setShipPostalCode("");
                        }}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Division</option>
                        {divisions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        District / City
                      </label>
                      <select
                        value={shipDistrict}
                        onChange={(e) => {
                          setShipDistrict(e.target.value);
                          setShipPostalCode("");
                        }}
                        disabled={!shipDivision}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-70"
                        required
                      >
                        <option value="">
                          {shipDivision
                            ? "Select District"
                            : "Select Division first"}
                        </option>
                        {districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="number"
                        min="1000"
                        max="9999"
                        value={shipPostalCode}
                        onChange={(e) => setShipPostalCode(e.target.value)}
                        placeholder="e.g. 1205"
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={shipAddress}
                        onChange={(e) => setShipAddress(e.target.value)}
                        placeholder="House, road, area"
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="border-t pt-2 sm:pt-3 flex justify-between text-base sm:text-lg font-bold">
                    <span>Total</span>
                    <span>Tk.{finalPrice?.toFixed(2)}</span>
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
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2 sm:mb-3">
                      Frequently Bought Together
                    </h3>
                    <div className="space-y-2">
                      {cart.suggestedItems.slice(0, 3).map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600"
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
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Complete Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-2">
                Order Total:{" "}
                <span className="font-bold text-base sm:text-lg">
                  {finalPrice?.toFixed(2)} Tk.
                </span>
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 break-words">
                Shipping to:{" "}
                <AddressDisplay
                  order={{
                    shippingAddress: shipAddress,
                    shipCountry,
                    shipDivision,
                    shipDistrict,
                    shipPostalCode,
                  }}
                  type="shipping"
                />
              </p>

              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-1.5 sm:gap-2 ${
                    paymentMethod === "cod"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300"
                  }`}
                >
                  <FaMoneyBillWave
                    size={20}
                    className={
                      paymentMethod === "cod"
                        ? "text-blue-500"
                        : "text-gray-400"
                    }
                  />
                  <span className="text-xs sm:text-sm font-medium">
                    Cash on Delivery
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bkash")}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-1.5 sm:gap-2 ${
                    paymentMethod === "bkash"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300"
                  }`}
                >
                  <FaMobile
                    size={20}
                    className={
                      paymentMethod === "bkash"
                        ? "text-blue-500"
                        : "text-gray-400"
                    }
                  />
                  <span className="text-xs sm:text-sm font-medium">bKash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("nagad")}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-1.5 sm:gap-2 ${
                    paymentMethod === "nagad"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300"
                  }`}
                >
                  <FaMobile
                    size={20}
                    className={
                      paymentMethod === "nagad"
                        ? "text-blue-500"
                        : "text-gray-400"
                    }
                  />
                  <span className="text-xs sm:text-sm font-medium">Nagad</span>
                </button>
              </div>

              {(paymentMethod === "bkash" || paymentMethod === "nagad") && (
                <>
                  <div className="mb-3 sm:mb-4">
                    <Input
                      label="Mobile Number"
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      required
                    />
                  </div>
                  <div className="mb-3 sm:mb-4">
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
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs sm:text-sm text-yellow-800">
                  <strong>Note:</strong> Cash on Delivery - Please keep exact
                  amount ready at the time of delivery.
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
                Pay Tk.{finalPrice?.toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}