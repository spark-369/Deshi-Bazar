"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/services";
import { Card, Button, Input } from "@/components/common";
import {
  FaArrowLeft,
  FaImage,
  FaTag,
  FaBox,
  FaLeaf,
  FaCalendarAlt,
  FaCamera,
  FaVideo,
} from "react-icons/fa";
import { useRef } from "react";

export default function AddProductPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categoryMatches, setCategoryMatches] = useState([]);
  const [categoryMatchLoading, setCategoryMatchLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    images: [],
    price: "",
    originalPrice: "",
    stock: "",
    categoryId: "",
    isNegotiable: false,
    estimatedDeliveryDays: "",
    tags: "",
    // Grocery-specific fields
    productType: "REGULAR",
    unit: "",
    weight: "",
    expiryDate: "",
    isOrganic: false,
    freshness: "",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [draggedFiles, setDraggedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "SELLER")) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productService.getCategories(true);
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    if (isAuthenticated && user?.role === "SELLER") {
      fetchCategories();
    }
  }, [isAuthenticated, user]);

  // Fetch category matches when product name changes
  useEffect(() => {
    if (!formData.name || formData.name.trim().length < 2) {
      setCategoryMatches([]);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setCategoryMatchLoading(true);
      try {
        const response = await fetch(
          `/api/categories/match?productName=${encodeURIComponent(formData.name.trim())}&includeSubcategories=true`,
        );
        const data = await response.json();
        if (data.matches) {
          setCategoryMatches(data.matches);

          // Auto-select top match if no category is selected yet
          if (!formData.categoryId && data.topMatch) {
            setFormData((prev) => ({
              ...prev,
              categoryId: data.topMatch.id,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching category matches:", error);
      } finally {
        setCategoryMatchLoading(false);
      }
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData.name, formData.categoryId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()],
      }));
      setImageUrl("");
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    for (let file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, e.target.result],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setDraggedFiles(files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, e.target.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const openCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera access denied or not available");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    const dataURL = canvas.toDataURL("image/jpeg");
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, dataURL],
    }));
    setShowCamera(false);
    video.srcObject.getTracks().forEach((track) => track.stop());
  };

  const closeCamera = () => {
    setShowCamera(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.categoryId) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        images: formData.images,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice
          ? parseFloat(formData.originalPrice)
          : null,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        categoryId: formData.categoryId,
        isNegotiable: formData.isNegotiable,
        estimatedDeliveryDays: formData.estimatedDeliveryDays
          ? parseInt(formData.estimatedDeliveryDays)
          : null,
        shippingCostPerUnit: formData.shippingCostPerUnit
          ? parseFloat(formData.shippingCostPerUnit)
          : 0,
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        // Grocery-specific fields
        productType: formData.productType || "REGULAR",
        unit: formData.unit || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        isOrganic: formData.isOrganic || false,
        freshness: formData.freshness || null,
      };

      await productService.createProduct(productData);
      alert("Product created successfully!");
      router.push("/seller/products");
    } catch (error) {
      console.error("Error creating product:", error);
      alert(error.data?.error || error.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "SELLER") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/seller/products"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <FaArrowLeft className="mr-1.5 sm:mr-2" />
          Back to Products
        </Link>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Create a new listing for your store
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Basic Info */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                <FaBox className="text-blue-600 text-sm sm:text-base" />
                Basic Information
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                 <div>
                   <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                     Description
                   </label>
                   <textarea
                     name="description"
                     value={formData.description}
                     onChange={handleChange}
                     placeholder="Describe your product"
                     rows={3}
                     className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                   />
                 </div>

                 <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <div className="space-y-1 max-h-48 sm:max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-2 sm:p-3">
                      {categories.length === 0 ? (
                        <p className="text-gray-500 text-xs sm:text-sm">
                          No categories available
                        </p>
                      ) : (
                        categories.map((cat) => {
                          const hasChildren = cat.children && cat.children.length > 0;
                          const parentMatch = categoryMatches.find(m => m.id === cat.id);
                          return (
                            <div key={cat.id}>
                              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 sm:p-2 rounded">
                                <input
                                  type="radio"
                                  name="categoryId"
                                  value={cat.id}
                                  checked={formData.categoryId === cat.id}
                                  onChange={handleChange}
                                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-xs sm:text-sm font-medium text-gray-900 flex-1">
                                  {cat.name}
                                </span>
                                {parentMatch && (
                                  <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded ${parentMatch.score >= 0.7 ? 'bg-green-100 text-green-700' : parentMatch.score >= 0.4 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {parentMatch.percentage}%
                                  </span>
                                )}
                              </label>

                              {hasChildren && (
                                <div className="ml-4 sm:ml-6 mt-1 space-y-0.5 sm:space-y-1 border-l-2 border-gray-200 pl-2 sm:pl-3">
                                  {cat.children.map((child) => {
                                    const childMatch = categoryMatches.find(m => m.id === child.id);
                                    return (
                                     <label
                                       key={child.id}
                                       className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 sm:p-2 rounded"
                                     >
                                       <input
                                         type="radio"
                                         name="categoryId"
                                         value={child.id}
                                         checked={formData.categoryId === child.id}
                                         onChange={handleChange}
                                         className="border-gray-300 text-blue-600 focus:ring-blue-500"
                                       />
                                       <span className="text-xs sm:text-sm text-gray-700 flex-1">
                                         {child.name}
                                       </span>
                                     </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Tags (comma separated)
                    </label>
                   <Input
                     name="tags"
                     value={formData.tags}
                     onChange={handleChange}
                     placeholder="e.g. electronics, wireless, bluetooth"
                   />
                 </div>
              </div>
            </Card>

            {/* Camera Modal */}
            {showCamera && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 lg:col-span-2 p-3 sm:p-4">
                <div className="bg-white p-4 sm:p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-auto">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-xl font-bold">Camera Capture</h3>
                    <button
                      onClick={closeCamera}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      ×
                    </button>
                  </div>
                  <video
                    ref={videoRef}
                    autoPlay
                    className="w-full h-48 sm:h-64 object-cover rounded mb-3 sm:mb-4 bg-black"
                  />
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={capturePhoto}
                      className="flex-1 bg-green-600"
                    >
                      <FaCamera className="mr-1" />
                      Capture
                    </Button>
                    <Button
                      onClick={closeCamera}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                <FaTag className="text-blue-600 text-sm sm:text-base" />
                Pricing & Stock
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Price *
                    </label>
                    <Input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Original Price
                    </label>
                    <Input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity
                    </label>
                    <Input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Estimated Delivery Days
                    </label>
                    <Input
                      type="number"
                      name="estimatedDeliveryDays"
                      value={formData.estimatedDeliveryDays}
                      onChange={handleChange}
                      placeholder="e.g. 5"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Shipping Cost per Unit (default 0 for free)
                  </label>
                  <Input
                    type="number"
                    name="shippingCostPerUnit"
                    value={formData.shippingCostPerUnit || ""}
                    onChange={handleChange}
                    placeholder="e.g. 2.50"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    This cost will be added per item in cart
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isNegotiable"
                    id="isNegotiable"
                    checked={formData.isNegotiable}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isNegotiable"
                    className="text-xs sm:text-sm text-gray-700"
                  >
                    Allow price negotiation
                  </label>
                </div>
              </div>
            </Card>

            {/* Images */}
            <Card className="p-4 sm:p-6 lg:col-span-2">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                <FaImage className="text-blue-600 text-sm sm:text-base" />
                Product Images
              </h2>

              <div className="space-y-4 sm:space-y-6">
                {/* URL Input */}
                <div className="flex flex-col xs:flex-row gap-2">
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image URL or drop file"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddImage}
                    className="whitespace-nowrap w-full xs:w-auto"
                  >
                    <FaImage className="mr-1" />
                    Add URL
                  </Button>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Or upload images
                  </label>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50"
                  />
                </div>

                {/* Images Preview */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="w-full h-24 sm:h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.parentNode.innerHTML = "Image error";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs opacity-0 group-hover:opacity-100 transition-all"
                        >
                          ×
                        </button>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-1 truncate">
                          {img.startsWith("data:")
                            ? "Uploaded"
                            : img.substring(img.lastIndexOf("/") + 1)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {formData.images.length === 0 && (
                  <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <FaImage className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
                      No images
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 max-w-xs mx-auto px-4">
                      Add URLs or drag & drop files
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <label className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 text-blue-800 rounded-lg text-xs sm:text-sm cursor-pointer hover:bg-blue-200">
                        📷 Paste URL
                      </label>
                      <label
                        htmlFor="file-upload"
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-800 rounded-lg text-xs sm:text-sm cursor-pointer hover:bg-green-200"
                      >
                        📁 Upload Files
                      </label>
                      <button
                        type="button"
                        onClick={openCamera}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-100 text-purple-800 rounded-lg text-xs sm:text-sm cursor-pointer hover:bg-purple-200"
                      >
                        📱 Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Grocery Settings */}
            <Card className="p-4 sm:p-6 lg:col-span-2">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                <FaLeaf className="text-green-600 text-sm sm:text-base" />
                Grocery Settings
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <input
                      type="radio"
                      name="productType"
                      id="productTypeRegular"
                      value="REGULAR"
                      checked={formData.productType === "REGULAR"}
                      onChange={handleChange}
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="productTypeRegular"
                      className="text-xs sm:text-sm text-gray-700"
                    >
                      Regular Product
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <input
                      type="radio"
                      name="productType"
                      id="productTypeGrocery"
                      value="GROCERY"
                      checked={formData.productType === "GROCERY"}
                      onChange={handleChange}
                      className="border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <label
                      htmlFor="productTypeGrocery"
                      className="text-xs sm:text-sm text-gray-700"
                    >
                      Grocery Item
                    </label>
                  </div>
                </div>

                {formData.productType === "GROCERY" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4 p-3 sm:p-4 bg-green-50 rounded-lg">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Unit (e.g., kg, piece, liter)
                      </label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select unit</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="g">Gram (g)</option>
                        <option value="piece">Piece</option>
                        <option value="pack">Pack</option>
                        <option value="liter">Liter</option>
                        <option value="ml">Milliliter (ml)</option>
                        <option value="dozen">Dozen</option>
                        <option value="bundle">Bundle</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Weight (grams)
                      </label>
                      <Input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="Weight in grams"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        <FaCalendarAlt className="inline mr-1" />
                        Expiry Date
                      </label>
                      <Input
                        type="date"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Freshness
                      </label>
                      <select
                        name="freshness"
                        value={formData.freshness}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select freshness</option>
                        <option value="fresh">Fresh</option>
                        <option value="frozen">Frozen</option>
                        <option value="dried">Dried</option>
                        <option value="chilled">Chilled</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-2">
                      <input
                        type="checkbox"
                        name="isOrganic"
                        id="isOrganic"
                        checked={formData.isOrganic}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <label
                        htmlFor="isOrganic"
                        className="text-xs sm:text-sm text-gray-700"
                      >
                        <FaLeaf className="inline text-green-600" />
                        Organic Product (certified organic)
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Submit */}
          <div className="mt-4 sm:mt-6 flex flex-col xs:flex-row justify-end gap-2 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full xs:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="w-full xs:w-auto">
              Create Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
