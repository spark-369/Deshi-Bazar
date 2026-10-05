"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaBox,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
} from "@/components/common";

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      fetchProducts();
      fetchCategories();
      fetchSellers();
    }
  }, [
    isAuthenticated,
    user,
    statusFilter,
    categoryFilter,
    sellerFilter,
    pagination.page,
  ]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
        sellerId: sellerFilter || undefined,
        page: pagination.page,
        limit: 20,
      };
      const data = await adminService.getProducts(params);
      setProducts(data.products || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await fetch("/api/admin/users?role=SELLER");
      const data = await response.json();
      setSellers(data.users || []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/admin/products?id=${productId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await adminService.updateProducts([productId], "updateStatus", {
        status: newStatus,
      });
      fetchProducts();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.length === 0) return;

    try {
      if (bulkAction === "delete") {
        if (!confirm(`Delete ${selectedProducts.length} products?`)) return;
        await adminService.updateProducts(selectedProducts, "delete");
      } else if (bulkAction === "feature") {
        await adminService.updateProducts(selectedProducts, "feature");
      } else if (bulkAction === "activate") {
        await adminService.updateProducts(selectedProducts, "updateStatus", {
          status: "ACTIVE",
        });
      } else if (bulkAction === "deactivate") {
        await adminService.updateProducts(selectedProducts, "updateStatus", {
          status: "INACTIVE",
        });
      }

      setShowBulkModal(false);
      setBulkAction("");
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error("Error performing bulk action:", error);
      alert("Bulk action failed");
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const toggleSelectOne = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const startItem = (pagination.page - 1) * 20 + 1;
  const endItem = Math.min(pagination.page * 20, pagination.total);

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

  const allSelected =
    selectedProducts.length === products.length && products.length > 0;
  const someSelected = selectedProducts.length > 0 && !allSelected;

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-yellow-100 text-yellow-800";
      case "OUT_OF_STOCK":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Product Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              View, edit, and manage all products
            </p>
          </div>
          <div className="flex flex-col xs:flex-row gap-2 w-full">
            {selectedProducts.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowBulkModal(true)}
                className="flex items-center justify-center gap-2 w-full xs:w-auto"
              >
                Bulk Actions ({selectedProducts.length})
              </Button>
            )}
            <Button
              onClick={() => router.push("/admin")}
              variant="outline"
              className="w-full xs:w-auto"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Total Products
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                  {pagination.total}
                </p>
              </div>
              <FaBox className="text-blue-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Active
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {products.filter((p) => p.status === "ACTIVE").length}
                </p>
              </div>
              <FaCheck className="text-green-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Out of Stock
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
                  {products.filter((p) => p.status === "OUT_OF_STOCK").length}
                </p>
              </div>
              <FaTimes className="text-red-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Low Stock
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">
                  {products.filter((p) => p.stock <= 5 && p.stock > 0).length}
                </p>
              </div>
              <FaExclamationTriangle className="text-yellow-500 text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="DELETED">Deleted</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={sellerFilter}
              onChange={(e) => {
                setSellerFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Sellers</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
            <Button
              onClick={fetchProducts}
              variant="outline"
              className="flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <FaFilter /> Apply
            </Button>
          </div>
        </Card>

        {/* Products Table / Cards */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaBox className="text-4xl mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base">No products found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 w-12">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected;
                            }}
                            onChange={toggleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seller
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rating
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 lg:px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(
                                product.id,
                              )}
                              onChange={() => toggleSelectOne(product.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 lg:h-12 lg:w-12 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                                {product.images?.[0] ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                                    <FaBox />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-[200px] lg:max-w-xs">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {product.category?.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  ID: {product.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {product.seller?.name || "Unknown"}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Tk.{product.price?.toFixed(2)}
                            </div>
                            {product.originalPrice &&
                              product.originalPrice > product.price && (
                                <div className="text-xs text-gray-500 line-through">
                                  ${product.originalPrice.toFixed(2)}
                                </div>
                              )}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`text-sm font-medium ${
                                product.stock === 0
                                  ? "text-red-600"
                                  : product.stock <= 5
                                    ? "text-yellow-600"
                                    : "text-gray-900"
                              }`}
                            >
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <select
                              value={product.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  product.id,
                                  e.target.value,
                                )
                              }
                              className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer font-medium ${getStatusColor(
                                product.status,
                              )}`}
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="INACTIVE">Inactive</option>
                              <option value="OUT_OF_STOCK">Out of Stock</option>
                              <option value="DELETED">Deleted</option>
                            </select>
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span>
                                {product.averageRating?.toFixed(1) || "N/A"}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({product.reviewCount})
                              </span>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/admin/products/${product.id}`,
                                  )
                                }
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Product"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() =>
                                  router.push(`/products/${product.id}`)
                                }
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="View Public Page"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Product"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-4 space-y-3 hover:bg-gray-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <FaBox />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(
                                product.id,
                              )}
                              onChange={() => toggleSelectOne(product.id)}
                              className="rounded flex-shrink-0"
                            />
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {product.category?.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            ID: {product.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm pl-7">
                        <div>
                          <span className="text-gray-500 text-xs">Seller</span>
                          <p className="text-gray-900 truncate">
                            {product.seller?.name || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Price</span>
                          <p className="text-gray-900 font-medium">
                            Tk.{product.price?.toFixed(2)}
                          </p>
                          {product.originalPrice &&
                            product.originalPrice > product.price && (
                              <p className="text-xs text-gray-500 line-through">
                                ${product.originalPrice.toFixed(2)}
                              </p>
                            )}
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Stock</span>
                          <p
                            className={`font-medium ${
                              product.stock === 0
                                ? "text-red-600"
                                : product.stock <= 5
                                  ? "text-yellow-600"
                                  : "text-gray-900"
                            }`}
                          >
                            {product.stock}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Rating</span>
                          <p className="text-gray-900">
                            {product.averageRating?.toFixed(1) || "N/A"}
                            <span className="text-xs text-gray-400">
                              {" "}
                              ({product.reviewCount})
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pl-7">
                        <select
                          value={product.status}
                          onChange={(e) =>
                            handleStatusChange(product.id, e.target.value)
                          }
                          className={`text-xs px-3 py-1.5 rounded-full border-0 cursor-pointer font-medium ${getStatusColor(
                            product.status,
                          )}`}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="OUT_OF_STOCK">Out of Stock</option>
                          <option value="DELETED">Deleted</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              router.push(`/admin/products/${product.id}`)
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/products/${product.id}`)
                            }
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View Public Page"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t">
                    <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                      Showing {startItem} to {endItem} of{" "}
                      {pagination.total} products
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() =>
                          setPagination((p) => ({
                            ...p,
                            page: p.page - 1,
                          }))
                        }
                        className="flex-1 sm:flex-none justify-center"
                      >
                        <FaChevronLeft className="mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() =>
                          setPagination((p) => ({
                            ...p,
                            page: p.page + 1,
                          }))
                        }
                        className="flex-1 sm:flex-none justify-center"
                      >
                        Next
                        <FaChevronRight className="ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Bulk Action Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Bulk Actions
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Apply action to {selectedProducts.length} selected product
                  {selectedProducts.length !== 1 ? "s" : ""}:
                </p>
              </div>
              <div className="p-4 sm:p-6 space-y-2 overflow-y-auto flex-1">
                <button
                  onClick={() => {
                    setBulkAction("activate");
                    handleBulkAction();
                  }}
                  className="w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-left text-sm font-medium transition-colors"
                >
                  Activate All
                </button>
                <button
                  onClick={() => {
                    setBulkAction("deactivate");
                    handleBulkAction();
                  }}
                  className="w-full px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 text-left text-sm font-medium transition-colors"
                >
                  Deactivate All
                </button>
                <button
                  onClick={() => {
                    setBulkAction("feature");
                    handleBulkAction();
                  }}
                  className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-left text-sm font-medium transition-colors"
                >
                  Mark as Featured
                </button>
                <button
                  onClick={() => {
                    setBulkAction("delete");
                    handleBulkAction();
                  }}
                  className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-left text-sm font-medium transition-colors"
                >
                  Delete Selected
                </button>
              </div>
              <div className="p-4 sm:p-6 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkModal(false);
                    setSelectedProducts([]);
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
