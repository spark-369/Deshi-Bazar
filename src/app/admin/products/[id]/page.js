"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { productService, api } from "@/services";
import { Card, Button, Input } from "@/components/common";
import { FaArrowLeft, FaImage, FaTag, FaBox } from "react-icons/fa";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    images: [],
    price: "",
    originalPrice: "",
    stock: "",
    categoryId: "",
    sellerId: "",
    isNegotiable: false,
    estimatedDeliveryDays: "",
    tags: "",
    status: "ACTIVE",
  });
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || user?.role !== "ADMIN" || !params.id) return;

      try {
        setLoading(true);

        const categoriesData = await productService.getCategories();
        setCategories(categoriesData);

        const usersData = await api.get("/api/admin/users?role=SELLER");
        setSellers(usersData.users || []);

        const productData = await api.get(`/api/admin/products/${params.id}`);
        setProduct(productData);

        setFormData({
          name: productData.name || "",
          description: productData.description || "",
          images: productData.images || [],
          price: productData.price?.toString() || "",
          originalPrice: productData.originalPrice?.toString() || "",
          stock: productData.stock?.toString() || "",
          categoryId: productData.categoryId || "",
          sellerId: productData.sellerId || "",
          isNegotiable: productData.isNegotiable || false,
          estimatedDeliveryDays:
            productData.estimatedDeliveryDays?.toString() || "",
          tags: Array.isArray(productData.tags)
            ? productData.tags.join(", ")
            : typeof productData.tags === "object"
              ? Object.values(productData.tags).join(", ")
              : productData.tags || "",
          status: productData.status || "ACTIVE",
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, params.id]);

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

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.price ||
      !formData.categoryId ||
      !formData.sellerId
    ) {
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
        sellerId: formData.sellerId,
        isNegotiable: formData.isNegotiable,
        estimatedDeliveryDays: formData.estimatedDeliveryDays
          ? parseInt(formData.estimatedDeliveryDays)
          : null,
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        status: formData.status,
      };

      await api.put(`/api/admin/products/${params.id}`, productData);

      alert("Product updated successfully!");
      router.push("/admin/products");
    } catch (error) {
      console.error("Error updating product:", error);
      alert(error.data?.error || error.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await api.delete(`/api/admin/products/${params.id}`);
      alert("Product deleted successfully!");
      router.push("/admin/products");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(error.data?.error || error.message || "Failed to delete product");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Back Button */}
        <Link
          href="/admin/products"
          className="inline-flex items-center text-sm sm:text-base text-gray-600 hover:text-gray-900 mb-4 sm:mb-6"
        >
          <FaArrowLeft className="mr-1.5 sm:mr-2 text-sm" />
          Back to Products
        </Link>

        <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Edit Product
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Update product details
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 border-red-600 hover:bg-red-50 w-full sm:w-auto"
          >
            Delete Product
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Basic Info */}
            <Card className="p-4 sm:p-5 lg:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <FaBox className="text-blue-600 text-sm sm:text-base" />
                Basic Information
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your product"
                    rows={4}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <optgroup key={cat.id} label={cat.name}>
                        <option value={cat.id}>{cat.name}</option>
                        {cat.children?.map((child) => (
                          <option key={child.id} value={child.id}>
                            — {child.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seller *
                  </label>
                  <select
                    name="sellerId"
                    value={formData.sellerId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select a seller</option>
                    {sellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.name || seller.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="DELETED">Deleted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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

            {/* Pricing */}
            <Card className="p-4 sm:p-5 lg:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <FaTag className="text-blue-600 text-sm sm:text-base" />
                Pricing & Stock
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Days
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

                <div className="flex items-center gap-2 pt-1">
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
                    className="text-sm text-gray-700"
                  >
                    Allow price negotiation
                  </label>
                </div>
              </div>
            </Card>

            {/* Images */}
            <Card className="p-4 sm:p-5 lg:p-6 lg:col-span-2">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <FaImage className="text-blue-600 text-sm sm:text-base" />
                Product Images
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col xs:flex-row gap-2">
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Enter image URL"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddImage}
                    className="w-full xs:w-auto"
                  >
                    Add Image
                  </Button>
                </div>

                {formData.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {formData.images.map((img, index) => (
                      <div
                        key={index}
                        className="relative group aspect-square"
                      >
                        <img
                          src={img}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/150?text=No+Image";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <FaImage className="mx-auto text-3xl sm:text-4xl text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">
                      No images added yet
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Submit */}
          <div className="mt-4 sm:mt-6 flex flex-col-reverse xs:flex-row justify-end gap-2 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full xs:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="w-full xs:w-auto"
            >
              Update Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
