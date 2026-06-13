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
  FaDownload,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaBox,
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Product Management
            </h1>
            <p className="text-gray-600 mt-1">
              View, edit, and manage all products
            </p>
          </div>
          <div className="flex gap-3">
            {selectedProducts.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2"
              >
                Bulk Actions ({selectedProducts.length})
              </Button>
            )}
            <Button onClick={() => router.push("/admin")} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <FaBox className="text-blue-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {products.filter((p) => p.status === "ACTIVE").length}
                </p>
              </div>
              <FaCheck className="text-green-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {products.filter((p) => p.status === "OUT_OF_STOCK").length}
                </p>
              </div>
              <FaTimes className="text-red-500 text-2xl" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {products.filter((p) => p.stock <= 5 && p.stock > 0).length}
                </p>
              </div>
              <FaExclamationTriangle className="text-yellow-500 text-2xl" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="flex items-center gap-2"
            >
              <FaFilter /> Apply
            </Button>
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaBox className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No products found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 w-12">
                          <input
                            type="checkbox"
                            checked={
                              selectedProducts.length === products.length &&
                              products.length > 0
                            }
                            onChange={toggleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Seller
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Rating
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => toggleSelectOne(product.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-12 w-12 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
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
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.category?.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  ID: {product.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {product.seller?.name || "Unknown"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              ${product.originalPrice?.toFixed(2)}
                            </div>
                            {product.originalPrice && (
                              <div className="text-xs text-gray-500 line-through">
                                ${product.price.toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
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
                          <td className="px-6 py-4">
                            <select
                              value={product.status}
                              onChange={(e) =>
                                handleStatusChange(product.id, e.target.value)
                              }
                              className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${
                                product.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : product.status === "INACTIVE"
                                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                    : product.status === "OUT_OF_STOCK"
                                      ? "bg-red-100 text-red-800 hover:bg-red-200"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                              }`}
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="INACTIVE">Inactive</option>
                              <option value="OUT_OF_STOCK">Out of Stock</option>
                              <option value="DELETED">Deleted</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <span>
                                {product.averageRating?.toFixed(1) || "N/A"}
                              </span>
                              <span className="text-gray-400">
                                ({product.reviewCount})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  router.push(`/admin/products/${product.id}`)
                                }
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit Product"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() =>
                                  router.push(`/products/${product.id}`)
                                }
                                className="p-2 text-green-600 hover:bg-green-50 rounded"
                                title="View Public Page"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
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

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <p className="text-sm text-gray-600">
                      Showing {(pagination.page - 1) * 20 + 1} to{" "}
                      {Math.min(pagination.page * 20, pagination.total)} of{" "}
                      {pagination.total} products
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() =>
                          setPagination((p) => ({ ...p, page: p.page - 1 }))
                        }
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() =>
                          setPagination((p) => ({ ...p, page: p.page + 1 }))
                        }
                      >
                        Next
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Bulk Actions</h2>
              <p className="text-gray-600 mb-4">
                Apply action to {selectedProducts.length} selected products:
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setBulkAction("activate");
                    handleBulkAction();
                  }}
                  className="w-full px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-left"
                >
                  Activate All
                </button>
                <button
                  onClick={() => {
                    setBulkAction("deactivate");
                    handleBulkAction();
                  }}
                  className="w-full px-4 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-left"
                >
                  Deactivate All
                </button>
                <button
                  onClick={() => {
                    setBulkAction("feature");
                    handleBulkAction();
                  }}
                  className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-left"
                >
                  Mark as Featured
                </button>
                <button
                  onClick={() => {
                    setBulkAction("delete");
                    handleBulkAction();
                  }}
                  className="w-full px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-left"
                >
                  Delete Selected
                </button>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkModal(false);
                    setSelectedProducts([]);
                  }}
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
