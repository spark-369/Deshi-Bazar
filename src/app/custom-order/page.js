"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { orderService, productService } from "@/services";
import { api } from "@/services";
import { locationService } from "@/services/locationService";
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
  FaStore,
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

  // Structured shipping address (dropdowns populated from profile)
  const [shipCountry, setShipCountry] = useState("Bangladesh");
  const [shipDivision, setShipDivision] = useState("");
  const [shipDistrict, setShipDistrict] = useState("");
  const [shipPostalCode, setShipPostalCode] = useState("");

  // Billing address comes from the selected seller's profile
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCountry, setBillingCountry] = useState("Bangladesh");
  const [billingDivision, setBillingDivision] = useState("");
  const [billingDistrict, setBillingDistrict] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
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
        const p = data.profile;
        setShippingAddress(p.address || "");
        setShipCountry(p.country || "Bangladesh");
        setShipDivision(p.division || "");
        setShipDistrict(p.district || "");
        setShipPostalCode(p.postalCode || "");
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  useEffect(() => {
    const loadDivisions = async () => {
      try {
        const data = await locationService.getDivisions();
        setDivisions(data.divisions || []);
      } catch (error) {
        console.error("Error fetching divisions:", error);
      }
    };
    loadDivisions();
  }, []);

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
        longitude,
      });

      // Update local state
      setBuyerLatitude(latitude.toString());
      setBuyerLongitude(longitude.toString());

      // Also update user profile state if needed
      setUserProfile((prev) => ({
        ...prev,
        profile: {
          ...prev?.profile,
          latitude,
          longitude,
        },
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
      if (sellerList.length > 0) {
        setSelectedSeller(sellerList[0].id);
        getSellerLocation(sellerList[0].id, sellerList[0]);
      }
    } catch (error) {
      console.error("Failed to fetch sellers:", error);
    }
  };

  const getSellerLocation = async (sellerId, sellerObj) => {
    if (!sellerId) return;

    // Populate billing address from the selected seller's profile
    const seller = sellerObj || sellers.find((s) => s.id === sellerId);
    const sp = seller?.profile;
    if (sp) {
      setBillingAddress(sp.address || "");
      setBillingCountry(sp.country || "Bangladesh");
      setBillingDivision(sp.division || sp.state || "");
      setBillingDistrict(sp.district || sp.city || "");
      setBillingPostalCode(sp.postalCode || sp.zipCode || "");
    }

    try {
      const sellerData = await api.get(`/api/users/${sellerId}`);
      if (
        sellerData.latitude !== undefined &&
        sellerData.longitude !== undefined
      ) {
        setSellerLatitude(sellerData.latitude.toString());
        setSellerLongitude(sellerData.longitude.toString());
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
        productId: item.id || null,
        quantity: parseFloat(item.selectedQuantity),
        unit: item.unit || "piece",
        price: item.price || null,
      }));

      const orderData = {
        items,
        sellerId: selectedSeller,
        shippingAddress,
        shipCountry,
        shipDivision,
        shipDistrict,
        shipPostalCode,
        billingAddress,
        billingCountry,
        billingDivision,
        billingDistrict,
        billingPostalCode,
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
        <Card className="w-full max-w-md p-6 sm:p-10 rounded-3xl shadow-xl border border-gray-100 text-center bg-white/80 backdrop-blur-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
            <FaShoppingCart className="text-white text-2xl sm:text-3xl" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
            Please Login
          </h2>
          <p className="text-gray-500 mb-6 sm:mb-8">
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
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow">
              <FaShoppingCart className="text-white text-base sm:text-lg" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Custom Grocery Order
              </h1>
              <p className="text-gray-500 mt-0.5 text-xs sm:text-sm">
                Create personalized orders from fresh grocery items
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between items-center max-w-3xl mx-auto relative">
            {/* Progress Line */}
            <div className="absolute top-3 sm:top-4 left-4 sm:left-8 right-4 sm:right-8 h-0.5 bg-gray-200 z-0">
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
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                    s === step
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow shadow-blue-500/30 scale-110"
                      : s < step
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow"
                        : "bg-white text-gray-400 border-2 border-gray-200"
                  }`}
                >
                  {s < step ? (
                    <FaCheck size={12} className="sm:hidden" />
                  ) : (
                    <span className="text-xs sm:text-base font-bold">{s}</span>
                  )}
                  {s < step && (
                    <FaCheck size={14} className="hidden sm:block" />
                  )}
                </div>
                <span
                  className={`text-[9px] sm:text-xs font-medium mt-1 sm:mt-2 transition-colors ${
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
                message.includes("successfully") ? "bg-green-500" : "bg-red-500"
              }`}
            />
            {message}
          </div>
        )}

        {/* Step 1: Subcategory & Product Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                Choose Your Products
              </h2>
              <p className="text-gray-500 text-xs sm:text-base px-4">
                Browse through our grocery sub-categories and select the items
                you need
              </p>
            </div>

            <div className="flex items-center justify-between bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                  <FaBox className="text-white text-xs sm:text-sm" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Parent Category
                  </p>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    Grocery
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">
                  Sub-categories
                </p>
                <p className="font-semibold text-blue-600 text-sm sm:text-base">
                  {grocerySubcategories.length}
                </p>
              </div>
            </div>

            {/* Subcategory Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {grocerySubcategories.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <FaBox className="text-lg sm:text-2xl text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-base sm:text-lg">
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
                      <div className="p-3 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-lg sm:rounded-xl shadow-sm flex items-center justify-center border border-gray-200">
                            {subcat.image ? (
                              <img
                                src={subcat.image}
                                alt={subcat.name}
                                className="w-4 h-4 sm:w-7 sm:h-7 rounded object-cover"
                              />
                            ) : (
                              <FaBox className="text-gray-400 text-xs sm:text-lg" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm sm:text-lg">
                              {subcat.name}
                            </h3>
                            {subcat.description && (
                              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-1">
                                {subcat.description}
                              </p>
                            )}
                          </div>
                          {selectedCount > 0 && (
                            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium shadow-sm whitespace-nowrap">
                              {selectedCount} selected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product List */}
                      <div className="p-5 max-h-[400px] overflow-y-auto">
                        {loading && products.length === 0 ? (
                          <div className="text-center py-6 sm:py-8">
                            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2 sm:mb-3"></div>
                            <p className="text-gray-500 text-xs sm:text-sm">
                              Loading products...
                            </p>
                          </div>
                        ) : products.length === 0 ? (
                          <div className="text-center py-6 sm:py-8">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                              <FaBox className="text-lg sm:text-2xl text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm">
                              No products available
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 sm:space-y-3">
                            {products.map((product) => {
                              const isSelected = !!selectedProducts.find(
                                (p) => p.id === product.id,
                              );
                              return (
                                <div
                                  key={product.id}
                                  className={`group rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200 cursor-pointer ${
                                    isSelected
                                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 shadow-md"
                                      : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                  }`}
                                  onClick={() =>
                                    toggleProductSelection(product)
                                  }
                                >
                                  <div className="flex items-start gap-2 sm:gap-4">
                                    {/* Product Image */}
                                    <div className="flex-shrink-0">
                                      {product.images &&
                                      product.images.length > 0 ? (
                                        <img
                                          src={product.images[0]}
                                          alt={product.name}
                                          className="w-10 h-10 sm:w-14 sm:h-14 object-cover rounded-md sm:rounded-lg border border-gray-100 group-hover:shadow-md transition-shadow"
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "/file.svg";
                                          }}
                                        />
                                      ) : (
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-100 rounded-md sm:rounded-lg border border-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-colors">
                                          <FaBox className="text-gray-400 text-xs sm:text-sm" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base truncate">
                                        {product.name}
                                      </h4>
                                      {product.description && (
                                        <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5 line-clamp-1">
                                          {product.description}
                                        </p>
                                      )}
                                      <div className="flex items-center justify-between mt-2 sm:mt-3">
                                        <span className="text-sm sm:text-lg font-bold text-green-600">
                                          {product.price?.toFixed(2)} Tk.
                                        </span>
                                        <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded">
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
              <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 xs:gap-4 mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                      <FaShoppingCart className="text-white text-xs sm:text-sm" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                        Selected Products
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {selectedProducts.length} item
                        {selectedProducts.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">
                    {selectedProducts
                      .reduce(
                        (sum, item) =>
                          sum + item.price * (item.selectedQuantity || 1),
                        0,
                      )
                      .toFixed(2)}{" "}
                    Tk.
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex flex-col xs:flex-row xs:items-center justify-between bg-white/60 p-2 sm:p-3 rounded-lg gap-2 xs:gap-3"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-6 h-6 sm:w-8 sm:h-8 object-cover rounded"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/file.svg";
                              }}
                            />
                          ) : (
                            <FaBox className="text-gray-400 text-xs sm:text-sm" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                            {product.name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500">
                            {product.price?.toFixed(2)} Tk. each
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end xs:self-auto">
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
                          className="w-14 sm:w-16 px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center gap-3 xs:gap-4 pt-4">
              <Button
                onClick={() => setSelectedProducts([])}
                variant="ghost"
                size="lg"
                disabled={selectedProducts.length === 0}
                className="w-full xs:w-auto"
              >
                <FaTrash className="mr-2" />
                Clear All
              </Button>
              <Button
                onClick={goToNextStep}
                variant="primary"
                size="lg"
                disabled={selectedProducts.length === 0}
                className="w-full xs:w-auto xs:min-w-[200px]"
              >
                Next: Review Selection
                <FaArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Review Selection */}
        {step === 2 && (
          <Card className="p-4 sm:p-8 lg:p-12">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <FaShoppingCart className="text-white text-lg sm:text-2xl" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                Review Your Selection
              </h2>
              <p className="text-gray-500 text-xs sm:text-base">
                Verify your selected items before proceeding
              </p>
            </div>

            {reviewItems.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FaBox className="text-lg sm:text-2xl text-gray-400" />
                </div>
                <p className="text-gray-500 text-base sm:text-lg mb-4">
                  No items selected
                </p>
                <Button onClick={() => setStep(1)} variant="primary">
                  Go Back to Select Items
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-8">
                  {reviewItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col xs:flex-row xs:items-center justify-between p-3 sm:p-4 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow gap-3 xs:gap-4"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/file.svg";
                              }}
                            />
                          ) : (
                            <FaBox className="text-gray-400 text-xs sm:text-sm" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate max-w-[160px] sm:max-w-none">
                            {item.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {item.price?.toFixed(2)} Tk. each
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:gap-4">
                        <span className="text-xs sm:text-sm text-gray-500">
                          Qty: {item.selectedQuantity}
                        </span>
                        <span className="font-bold text-green-600 text-sm sm:text-lg">
                          {(item.price * item.selectedQuantity).toFixed(2)} Tk.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 sm:p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-2 sm:mb-3 text-sm sm:text-base">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">
                      {reviewItems.reduce(
                        (sum, item) => sum + item.selectedQuantity,
                        0,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-gray-200">
                    <span className="text-gray-600 text-sm sm:text-base">
                      Total Price:
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">
                      {reviewItems
                        .reduce(
                          (sum, item) =>
                            sum + item.price * item.selectedQuantity,
                          0,
                        )
                        .toFixed(2)}{" "}
                      Tk.
                    </span>
                  </div>
                </div>

                <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center gap-3 xs:gap-4 mt-6 sm:mt-8">
                  <Button
                    onClick={goToPrevStep}
                    variant="ghost"
                    size="lg"
                    className="w-full xs:w-auto"
                  >
                    <FaArrowLeft className="mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={goToNextStep}
                    variant="primary"
                    size="lg"
                    className="w-full xs:w-auto xs:min-w-[200px]"
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
          <Card className="p-4 sm:p-8 lg:p-12">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <FaBox className="text-white text-lg sm:text-2xl" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                Order Details
              </h2>
              <p className="text-gray-500 text-xs sm:text-base">
                Provide shipping and payment information
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                goToNextStep();
              }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                    Select Seller *
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 text-blue-500">
                      <FaStore />
                    </div>
                    <select
                      value={selectedSeller}
                      onChange={(e) => {
                        setSelectedSeller(e.target.value);
                        if (e.target.value) {
                          const selected = sellers.find(
                            (s) => s.id === e.target.value,
                          );
                          getSellerLocation(e.target.value, selected);
                        }
                      }}
                      className="w-full appearance-none rounded-lg sm:rounded-xl border border-gray-200 bg-white py-2 sm:py-3 pl-9 sm:pl-11 pr-9 sm:pr-10 text-sm text-gray-900 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="" disabled>
                        Choose a seller…
                      </option>
                      {sellers.map((seller) => (
                        <option key={seller.id} value={seller.id}>
                          {seller.name || seller.email}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 text-gray-400">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                  {sellers.length === 0 && (
                    <p className="mt-2 text-sm text-gray-400">
                      No sellers available.
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                    Shipping Address *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Country
                      </label>
                      <select
                        value={shipCountry}
                        onChange={(e) => setShipCountry(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
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
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
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
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm disabled:opacity-70"
                        required
                      >
                        <option value="">
                          {shipDivision ? "Select District" : "Select Division first"}
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
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs text-gray-500 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="House, road, area"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Items with Quantities
                </label>
                <div className="space-y-2 sm:space-y-3">
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col xs:flex-row xs:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base truncate block">
                          {item.name}
                        </span>
                        <span className="text-[10px] sm:text-sm text-gray-500 ml-0 mt-0.5 sm:ml-2 sm:mt-0 sm:inline">
                          ({item.price?.toFixed(2)} Tk. each)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
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
                          className="w-full xs:w-20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center bg-white text-gray-900 text-sm"
                          required
                        />
                        <span className="text-[10px] sm:text-sm text-gray-400 whitespace-nowrap">
                          {item.unit || "piece"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Payment Method
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-blue-600 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full" />
                  </div>
                  <span className="text-gray-700 font-medium text-xs sm:text-sm">
                    Cash on Delivery (COD)
                  </span>
                </div>
                <input
                  type="hidden"
                  value="cod"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Shipping Method
                </label>
                <select
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="overnight">Overnight</option>
                </select>
              </div>

              <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Buyer Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={buyerLatitude}
                  onChange={(e) => setBuyerLatitude(e.target.value)}
                  placeholder="Enter buyer latitude"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 text-sm"
                />
              </div>

              <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Buyer Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={buyerLongitude}
                  onChange={(e) => setBuyerLongitude(e.target.value)}
                  placeholder="Enter buyer longitude"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 text-sm"
                />
              </div>

              <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Special Instructions (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for the seller..."
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white text-gray-900 text-sm"
                />
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 sm:p-6 border border-gray-100">
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1 xs:gap-0 text-base sm:text-lg font-bold">
                  <span className="text-gray-600 text-sm sm:text-base">
                    Order Total:
                  </span>
                  <span className="text-xl sm:text-2xl text-green-600">
                    {orderItems
                      .reduce(
                        (sum, item) => sum + item.price * item.selectedQuantity,
                        0,
                      )
                      .toFixed(2)}{" "}
                    Tk.
                  </span>
                </div>
              </div>

              <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center gap-3 xs:gap-4 pt-3 sm:pt-4">
                <Button
                  type="button"
                  onClick={goToPrevStep}
                  variant="ghost"
                  size="lg"
                  className="w-full xs:w-auto"
                >
                  <FaArrowLeft className="mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full xs:w-auto xs:min-w-[200px]"
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
          <Card className="p-4 sm:p-8 lg:p-12">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <FaCheck className="text-white text-lg sm:text-2xl" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                Confirm Your Order
              </h2>
              <p className="text-gray-500 text-xs sm:text-base">
                Review all details before placing your order
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaBox className="text-blue-600 text-xs sm:text-sm" />
                  </div>
                  Seller Information
                </h3>
                <p className="text-gray-600 ml-8 sm:ml-10 text-xs sm:text-sm">
                  {sellers.find((s) => s.id === selectedSeller)?.name ||
                    sellers.find((s) => s.id === selectedSeller)?.email}
                </p>
              </div>

              <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-3 h-3 sm:w-5 sm:h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  Shipping Address
                </h3>
                <p className="text-gray-600 ml-8 sm:ml-10 text-xs sm:text-sm">
                  {shippingAddress}
                </p>
              </div>

              <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-3 h-3 sm:w-5 sm:h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  Items ({orderItems.length})
                </h3>
                <div className="space-y-2 ml-8 sm:ml-10">
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col xs:flex-row xs:justify-between xs:items-center p-2 sm:p-3 bg-gray-50 rounded-lg gap-1 xs:gap-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] sm:text-sm text-gray-500">
                          {item.selectedQuantity} × {item.unit || "piece"}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm self-end xs:self-auto">
                        {(item.price * item.selectedQuantity).toFixed(2)} Tk.
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-3 h-3 sm:w-5 sm:h-5 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                  Payment Method
                </h3>
                <p className="text-gray-600 ml-8 sm:ml-10 text-xs sm:text-sm">
                  Cash on Delivery
                </p>
              </div>

              {notes && (
                <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-100 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 sm:w-5 sm:h-5 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </div>
                    Special Instructions
                  </h3>
                  <p className="text-gray-600 ml-8 sm:ml-10 text-xs sm:text-sm">
                    {notes}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-100 mb-6 sm:mb-8">
              <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1 xs:gap-0">
                <div>
                  <p className="text-gray-600 text-xs sm:text-base">
                    Total Amount Due
                  </p>
                  <p className="text-[10px] sm:text-sm text-gray-500">
                    {orderItems.reduce(
                      (sum, item) => sum + item.selectedQuantity,
                      0,
                    )}{" "}
                    items
                  </p>
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-green-600">
                  {orderItems
                    .reduce(
                      (sum, item) => sum + item.price * item.selectedQuantity,
                      0,
                    )
                    .toFixed(2)}{" "}
                  Tk.
                </span>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center gap-3 xs:gap-4 pt-3 sm:pt-4">
              <Button
                type="button"
                onClick={goToPrevStep}
                variant="ghost"
                size="lg"
                className="w-full xs:w-auto"
              >
                <FaArrowLeft className="mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                variant="success"
                size="lg"
                disabled={loading}
                className="w-full xs:w-auto xs:min-w-[200px]"
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
