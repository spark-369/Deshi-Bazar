"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { orderService, productService } from "@/services";
import { api } from "@/services";
import { Button, Card } from "@/components/common";
import {
  FaPlus,
  FaTrash,
  FaPaperPlane,
  FaSpinner,
  FaCheck,
  FaArrowRight,
  FaArrowLeft,
  FaBox,
  FaShoppingCart,
} from "react-icons/fa";

export default function CustomOrderPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [groceryCategory, setGroceryCategory] = useState(null);
  const [grocerySubcategories, setGrocerySubcategories] = useState([]);
  const [subcategoryProducts, setSubcategoryProducts] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [reviewItems, setReviewItems] = useState([]);

  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [buyerLatitude, setBuyerLatitude] = useState("");
  const [buyerLongitude, setBuyerLongitude] = useState("");
  const [sellerLatitude, setSellerLatitude] = useState("");
  const [sellerLongitude, setSellerLongitude] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchGroceryCategory();
      fetchUserProfile();
      // Get buyer's current location
      getBuyerLocation();
    }
  }, [isAuthenticated]);

  const fetchUserProfile = async () => {
    try {
      const data = await api.get("/api/users/profile");
      setUserProfile(data);
      if (data?.profile) {
        const parts = [];
        if (data.profile.address) parts.push(data.profile.address);
        if (data.profile.city) parts.push(data.profile.city);
        if (data.profile.state) parts.push(data.profile.state);
        if (data.profile.zipCode) parts.push(data.profile.zipCode);
        if (data.profile.country) parts.push(data.profile.country);
        setShippingAddress(parts.join(", ") || "");
      }
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
      setBuyerLatitude(latitude.toString());
      setBuyerLongitude(longitude.toString());
      
      // Also update user profile state if needed
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

  const fetchGroceryCategory = async () => {
    try {
      const data = await api.get("/api/categories", {
        params: {
          name: "Grocery",
        },
      });

      if (data && data.length > 0) {
        const groceryCat = data[0];
        setGroceryCategory(groceryCat);

        if (groceryCat.children && groceryCat.children.length > 0) {
          setGrocerySubcategories(groceryCat.children);
          groceryCat.children.forEach(async (subcat) => {
            try {
              const products = await productService.getProducts({
                categoryId: subcat.id,
                status: "ACTIVE",
                productType: "GROCERY",
              });
              setSubcategoryProducts((prev) => ({
                ...prev,
                [subcat.id]: products.products || [],
              }));
            } catch (error) {
              console.error("Failed to fetch products:", error);
              setSubcategoryProducts((prev) => ({
                ...prev,
                [subcat.id]: [],
              }));
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch grocery category:", error);
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await api.get("/api/users");
      const sellerList = response.filter((u) => u.role === "SELLER");
      setSellers(sellerList);
      if (sellerList.length > 0) setSelectedSeller(sellerList[0].id);
    } catch (error) {
      console.error("Failed to fetch sellers:", error);
    }
  };

  const getSellerLocation = async (sellerId) => {
    if (!sellerId) return;
    
    try {
      const sellerData = await api.get(`/api/users/${sellerId}`);
      if (sellerData.profile?.latitude !== undefined && sellerData.profile?.longitude !== undefined) {
        setSellerLatitude(sellerData.profile.latitude.toString());
        setSellerLongitude(sellerData.profile.longitude.toString());
      }
    } catch (error) {
      console.error("Error getting seller location:", error);
      // Use defaults if we can't get seller location
      setSellerLatitude("23.8103");
      setSellerLongitude("90.4125");
    }
  };

  const toggleProductSelection = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [...prev, { ...product, selectedQuantity: 1 }];
      }
    });
  };

  const updateSelectedQuantity = (productId, quantity) => {
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, selectedQuantity: Math.max(1, quantity) }
          : p,
      ),
    );
  };

  const removeSelectedProduct = (productId) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const goToNextStep = () => {
    if (step === 1) {
      if (selectedProducts.length === 0) {
        setMessage("Please select at least one product");
        return;
      }
      setReviewItems([...selectedProducts]);
      setStep(2);
    } else if (step === 2) {
      setOrderItems([...reviewItems]);
      fetchSellers();
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const goToPrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (orderItems.some((item) => !item.selectedQuantity)) {
      setMessage("Please set quantity for all items");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const items = orderItems.map((item) => ({
        name: item.name,
        quantity: parseFloat(item.selectedQuantity),
        unit: item.unit || "piece",
      }));

      const orderData = {
        items,
        sellerId: selectedSeller,
        shippingAddress,
        notes,
        paymentMethod,
        shippingMethod,
        buyerLatitude,
        buyerLongitude,
        sellerLatitude,
        sellerLongitude,
      };

      const result = await orderService.createCustomOrder(orderData);
      setMessage(
        `Custom order created successfully! Order #${result.orderNumber}`,
      );

      setTimeout(() => {
        router.push("/orders");
      }, 2000);
    } catch (error) {
      setMessage("Failed to create custom order: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-10 rounded-3xl shadow-xl border border-gray-100 text-center bg-white/80 backdrop-blur-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FaShoppingCart className="text-white text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Please Login
          </h2>
          <p className="text-gray-500 mb-8">
            Sign in to create custom grocery orders
          </p>
          <Button
            onClick={() => router.push("/login")}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaShoppingCart className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Custom Grocery Order
              </h1>
              <p className="text-gray-500 mt-1">
                Create personalized orders from fresh grocery items
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center max-w-3xl mx-auto relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-200 -z-1">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 rounded-full"
                style={{
                  width: `${((step - 1) / 3) * 100}%`,
                }}
              />
            </div>
            {[1, 2, 3, 4].map((s, index) => (
              <div key={s} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                    s === step
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-110"
                      : s < step
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg"
                        : "bg-white text-gray-400 border-2 border-gray-200"
                  }`}
                >
                  {s < step ? (
                    <FaCheck size={18} />
                  ) : (
                    <span className="text-lg font-bold">{s}</span>
                  )}
                </div>
                <span
                  className={`text-sm font-medium mt-3 transition-colors ${
                    s === step
                      ? "text-blue-600"
                      : s < step
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  {s === 1
                    ? "Select"
                    : s === 2
                      ? "Review"
                      : s === 3
                        ? "Details"
                        : "Confirm"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.includes("successfully")
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                message.includes("successfully")
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
            {message}
          </div>
        )}

        {/* Step 1: Subcategory & Product Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Your Products
              </h2>
              <p className="text-gray-500">
                Browse through our grocery sub-categories and select the items
                you need
              </p>
            </div>

            <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                  <FaBox className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Parent Category</p>
                  <p className="font-semibold text-gray-900">Grocery</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Sub-categories</p>
                <p className="font-semibold text-blue-600">
                  {grocerySubcategories.length}
                </p>
              </div>
            </div>

            {/* Subcategory Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {grocerySubcategories.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaBox className="text-2xl text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">
                    No sub-categories found
                  </p>
                </Card>
              ) : (
                grocerySubcategories.map((subcat) => {
                  const products = subcategoryProducts[subcat.id] || [];
                  const selectedCount = selectedProducts.filter((p) =>
                    products.some((prod) => prod.id === p.id),
                  ).length;

                  return (
                    <Card
                      key={subcat.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      {/* Subcategory Header */}
                      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-200">
                            {subcat.image ? (
                              <img
                                src={subcat.image}
                                alt={subcat.name}
                                className="w-7 h-7 rounded object-cover"
                              />
                            ) : (
                              <FaBox className="text-gray-400 text-lg" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">
                              {subcat.name}
                            </h3>
                            {subcat.description && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                {subcat.description}
                              </p>
                            )}
                          </div>
                          {selectedCount > 0 && (
                            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                              {selectedCount} selected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product List */}
                      <div className="p-5 max-h-[400px] overflow-y-auto">
                        {loading && products.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <p className="text-gray-500">
                              Loading products...
                            </p>
                          </div>
                        ) : products.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <FaBox className="text-2xl text-gray-400" />
                            </div>
                            <p className="text-gray-500">
                              No products available
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {products.map((product) => {
                              const isSelected = !!selectedProducts.find(
                                (p) => p.id === product.id,
                              );
                              return (
                                <div
                                  key={product.id}
                                  className={`group rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                                    isSelected
                                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 shadow-md"
                                      : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                  }`}
                                  onClick={() => toggleProductSelection(product)}
                                >
                                  <div className="flex items-start gap-4">
                                    {/* Product Image */}
                                    <div className="flex-shrink-0">
                                      {product.images &&
                                      product.images.length > 0 ? (
                                        <img
                                          src={product.images[0]}
                                          alt={product.name}
                                          className="w-14 h-14 object-cover rounded-lg border border-gray-100 group-hover:shadow-md transition-shadow"
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "/file.svg";
                                          }}
                                        />
                                      ) : (
                                        <div className="w-14 h-14 bg-gray-100 rounded-lg border border-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-colors">
                                          <FaBox className="text-gray-400" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {product.name}
                                      </h4>
                                      {product.description && (
                                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                                          {product.description}
                                        </p>
                                      )}
                                      <div className="flex items-center justify-between mt-3">
                                        <span className="text-lg font-bold text-green-600">
                                          ${product.price?.toFixed(2)}
                                        </span>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                          {product.unit || "piece"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Selection Checkbox */}
                                    <div className="flex-shrink-0">
                                      <div
                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                          isSelected
                                            ? "bg-blue-600 border-blue-600"
                                            : "border-gray-300 group-hover:border-blue-400"
                                        }`}
                                      >
                                        {isSelected && (
                                          <FaCheck className="text-white text-xs" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Selected Products Summary */}
            {selectedProducts.length > 0 && (
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <FaShoppingCart className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">
                        Selected Products
                      </h4>
                      <p className="text-sm text-gray-500">
                        {selectedProducts.length} item
                        {selectedProducts.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    $
                    {selectedProducts
                      .reduce(
                        (sum, item) =>
                          sum + item.price * (item.selectedQuantity || 1),
                        0,
                      )
                      .toFixed(2)}
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between bg-white/60 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-8 h-8 object-cover rounded"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/file.svg";
                              }}
                            />
                          ) : (
                            <FaBox className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${product.price?.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={product.selectedQuantity}
                          onChange={(e) =>
                            updateSelectedQuantity(
                              product.id,
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelectedProduct(product.id);
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button
                onClick={() => setSelectedProducts([])}
                variant="ghost"
                size="lg"
                disabled={selectedProducts.length === 0}
              >
                <FaTrash className="mr-2" />
                Clear All
              </Button>
              <Button
                onClick={goToNextStep}
                variant="primary"
                size="lg"
                disabled={selectedProducts.length === 0}
                className="min-w-[200px]"
              >
                Next: Review Selection
                <FaArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Review Selection */}
        {step === 2 && (
          <Card className="p-8 lg:p-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FaShoppingCart className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Review Your Selection
              </h2>
              <p className="text-gray-500">
                Verify your selected items before proceeding
              </p>
            </div>

            {reviewItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBox className="text-2xl text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-4">
                  No items selected
                </p>
                <Button
                  onClick={() => setStep(1)}
                  variant="primary"
                >
                  Go Back to Select Items
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-8">
                  {reviewItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/file.svg";
                              }}
                            />
                          ) : (
                            <FaBox className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            ${item.price?.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500">
                          Qty: {item.selectedQuantity}
                        </span>
                        <span className="font-bold text-green-600 text-lg">
                          $
                          {(item.price * item.selectedQuantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-semibold text-gray-900">
                      {reviewItems.reduce(
                        (sum, item) => sum + item.selectedQuantity,
                        0,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="text-2xl font-bold text-green-600">
                      $
                      {reviewItems
                        .reduce(
                          (sum, item) =>
                            sum + item.price * item.selectedQuantity,
                          0,
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <Button
                    onClick={goToPrevStep}
                    variant="ghost"
                    size="lg"
                  >
                    <FaArrowLeft className="mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={goToNextStep}
                    variant="primary"
                    size="lg"
                  >
                    Next: Order Details
                    <FaArrowRight className="ml-2" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

        {/* Step 3: Order Details */}
        {step === 3 && (
          <Card className="p-8 lg:p-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FaBox className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Order Details
              </h2>
              <p className="text-gray-500">
                Provide shipping and payment information
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                goToNextStep();
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-5 border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Seller *
                  </label>
                  <select
                    value={selectedSeller}
                    onChange={(e) => {
                      setSelectedSeller(e.target.value);
                      // Get seller's location when selected
                      if (e.target.value) {
                        getSellerLocation(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                    required
                  >
                    {sellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.name || seller.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Shipping Address *
                  </label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Full delivery address"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white text-gray-900"
                    required
                  />
                  {userProfile?.profile && (
                    <button
                      type="button"
                      onClick={() => {
                        const parts = [];
                        if (userProfile.profile.address)
                          parts.push(userProfile.profile.address);
                        if (userProfile.profile.city)
                          parts.push(userProfile.profile.city);
                        if (userProfile.profile.state)
                          parts.push(userProfile.profile.state);
                        if (userProfile.profile.zipCode)
                          parts.push(userProfile.profile.zipCode);
                        if (userProfile.profile.country)
                          parts.push(userProfile.profile.country);
                        setShippingAddress(parts.join(", "));
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Use profile address
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Items with Quantities
                </label>
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900">
                          {item.name}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          (${item.price?.toFixed(2)} each)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          value={item.selectedQuantity}
                          onChange={(e) => {
                            const newItems = [...orderItems];
                            newItems[index].selectedQuantity = Math.max(
                              1,
                              parseInt(e.target.value) || 1,
                            );
                            setOrderItems(newItems);
                          }}
                          className="w-20 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center bg-white text-gray-900"
                          required
                        />
                        <span className="text-sm text-gray-400">
                          {item.unit || "piece"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border-2 border-blue-600 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  </div>
                  <span className="text-gray-700 font-medium">
                    Cash on Delivery (COD)
                  </span>
                </div>
                <input
                  type="hidden"
                  value="cod"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Shipping Method
                </label>
                <select
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="overnight">Overnight</option>
                </select>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Buyer Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={buyerLatitude}
                  onChange={(e) => setBuyerLatitude(e.target.value)}
                  placeholder="Enter buyer latitude"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                />
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Buyer Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={buyerLongitude}
                  onChange={(e) => setBuyerLongitude(e.target.value)}
                  placeholder="Enter buyer longitude"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                />
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Seller Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={sellerLatitude}
                  onChange={(e) => setSellerLatitude(e.target.value)}
                  placeholder="Enter seller latitude"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                />
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Seller Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={sellerLongitude}
                  onChange={(e) => setSellerLongitude(e.target.value)}
                  placeholder="Enter seller longitude"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                />
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Special Instructions (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for the seller..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white text-gray-900"
                />
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-600">Order Total:</span>
                  <span className="text-2xl text-green-600">
                    $
                    {orderItems
                      .reduce(
                        (sum, item) => sum + item.price * item.selectedQuantity,
                        0,
                      )
                      .toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  onClick={goToPrevStep}
                  variant="ghost"
                  size="lg"
                >
                  <FaArrowLeft className="mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="min-w-[200px]"
                >
                  Next: Confirm Order
                  <FaArrowRight className="ml-2" />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Step 4: Confirm & Submit */}
        {step === 4 && (
          <Card className="p-8 lg:p-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FaCheck className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Confirm Your Order
              </h2>
              <p className="text-gray-500">
                Review all details before placing your order
              </p>
            </div>

            <div className="space-y-6 mb-8">
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaBox className="text-blue-600" />
                  </div>
                  Seller Information
                </h3>
                <p className="text-gray-600 ml-10">
                  {sellers.find((s) => s.id === selectedSeller)?.name ||
                    sellers.find((s) => s.id === selectedSeller)?.email}
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  Shipping Address
                </h3>
                <p className="text-gray-600 ml-10">{shippingAddress}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  Items ({orderItems.length})
                </h3>
                <div className="space-y-3 ml-10">
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.selectedQuantity} × {item.unit || "piece"}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${(item.price * item.selectedQuantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  Payment Method
                </h3>
                <p className="text-gray-600 ml-10">
                  Cash on Delivery
                </p>
              </div>

              {notes && (
                <div className="bg-white rounded-xl p-5 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    Special Instructions
                  </h3>
                  <p className="text-gray-600 ml-10">{notes}</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600">Total Amount Due</p>
                  <p className="text-sm text-gray-500">
                    {orderItems.reduce((sum, item) => sum + item.selectedQuantity, 0)} items
                  </p>
                </div>
                <span className="text-3xl font-bold text-green-600">
                  $
                  {orderItems
                    .reduce(
                      (sum, item) => sum + item.price * item.selectedQuantity,
                      0,
                    )
                    .toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button
                type="button"
                onClick={goToPrevStep}
                variant="ghost"
                size="lg"
              >
                <FaArrowLeft className="mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                variant="success"
                size="lg"
                disabled={loading}
                className="min-w-[240px]"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="mr-2" />
                    Place Order
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
