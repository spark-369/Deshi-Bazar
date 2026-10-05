"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/services";
import { Card, Button } from "@/components/common";
import { FaPlus, FaEdit, FaTrash, FaEye, FaBox } from "react-icons/fa";

export default function SellerProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "SELLER")) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!isAuthenticated || user?.role !== "SELLER") return;

      try {
        setLoading(true);
        const data = await productService.getProducts({
          sellerId: user.id,
          limit: 100,
        });
        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isAuthenticated, user]);

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await productService.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-yellow-100 text-yellow-800",
      OUT_OF_STOCK: "bg-red-100 text-red-800",
      DELETED: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${colors[status] || colors.INACTIVE}`}
      >
        {status}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "SELLER") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Products</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage your product listings
            </p>
          </div>
          <Link href="/seller/products/add">
            <Button className="w-full sm:w-auto flex items-center justify-center gap-2">
              <FaPlus />
              Add Product
            </Button>
          </Link>
        </div>

        {products.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <FaBox className="mx-auto text-3xl sm:text-5xl text-gray-300 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
              No products yet
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto px-4">
              Start selling by adding your first product
            </p>
            <Link href="/seller/products/add">
              <Button className="w-full sm:w-auto">Add Your First Product</Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3">
              {products.map((product) => (
                <Card key={product.id} className="p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FaBox />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {product.category?.name}
                      </p>
                      <div className="mt-1">
                        {getStatusBadge(product.status)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <span className="text-gray-900 font-medium ml-1">
                           Tk.{product.price?.toFixed(2)}
                      </span>
                      {product.originalPrice &&
                        product.originalPrice > product.price && (
                          <span className="text-gray-400 line-through ml-1">
                            ${product.originalPrice?.toFixed(2)}
                          </span>
                        )}
                    </div>
                    <div>
                      <span className="text-gray-500">Stock:</span>
                      <span className="text-gray-900 font-medium ml-1">
                        {product.stock}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Rating:</span>
                      <span className="text-gray-900 font-medium ml-1">
                        {product.averageRating?.toFixed(1) || "N/A"} ({product.reviewCount})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Link
                      href={`/products/${product.id}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <FaEye className="mr-1" /> View
                      </Button>
                    </Link>
                    <Link
                      href={`/seller/products/${product.id}/edit`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <FaEdit className="mr-1" /> Edit
                      </Button>
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <Card className="hidden md:block overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Stock
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rating
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 lg:h-12 lg:w-12 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                              {product.images?.[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <FaBox className="text-gray-400 text-sm lg:text-base" />
                                </div>
                              )}
                            </div>
                            <div className="ml-3 lg:ml-4">
                              <div className="text-xs lg:text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {product.category?.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-xs lg:text-sm font-medium text-gray-900">
                            Tk.{product.price?.toFixed(2)}
                          </div>
                          {product.originalPrice &&
                            product.originalPrice > product.price && (
                              <div className="text-xs text-gray-500 line-through">
                                ${product.originalPrice?.toFixed(2)}
                              </div>
                            )}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">
                          {product.stock}
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          {getStatusBadge(product.status)}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">
                          {product.averageRating?.toFixed(1) || "N/A"} (
                          {product.reviewCount})
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center gap-1 lg:gap-2">
                            <Link
                              href={`/products/${product.id}`}
                              className="p-1 lg:p-1.5 text-blue-600 hover:text-blue-800"
                              title="View"
                            >
                              <FaEye />
                            </Link>
                            <Link
                              href={`/seller/products/${product.id}/edit`}
                              className="p-1 lg:p-1.5 text-yellow-600 hover:text-yellow-800"
                              title="Edit"
                            >
                              <FaEdit />
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-1 lg:p-1.5 text-red-600 hover:text-red-800"
                              title="Delete"
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
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
