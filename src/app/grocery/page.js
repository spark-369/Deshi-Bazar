"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { productService } from "@/services";
import { Card, Button } from "@/components/common";
import {
  FaLeaf,
  FaSearch,
  FaFilter,
  FaShoppingCart,
  FaHeart,
  FaBox,
  FaCalendarAlt,
  FaCheck,
  FaTag,
} from "react-icons/fa";

export default function GroceryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterFresh, setFilterFresh] = useState(false);
  const [filterOrganic, setFilterOrganic] = useState(false);

  useEffect(() => {
    fetchGroceryProducts();
    fetchCategories();
  }, []);

  const fetchGroceryProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts({
        productType: "GROCERY",
        status: "ACTIVE",
      });
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching grocery products:", error);
      try {
        const allData = await productService.getProducts({ status: "ACTIVE" });
        const groceryProducts = (allData.products || []).filter(
          (p) => p.productType === "GROCERY" || !p.productType,
        );
        setProducts(groceryProducts);
      } catch (err) {
        console.error("Fallback also failed:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories(true);
      const groceryCats = (data || []).filter(
        (cat) =>
          cat.name.toLowerCase().includes("grocery") ||
          cat.name.toLowerCase().includes("food") ||
          cat.name.toLowerCase().includes("vegetable") ||
          cat.name.toLowerCase().includes("fruit") ||
          cat.name.toLowerCase().includes("meat") ||
          cat.name.toLowerCase().includes("dairy"),
      );
      setCategories(groceryCats);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.categoryId === selectedCategory;
    const matchesFresh = !filterFresh || product.freshness === "fresh";
    const matchesOrganic = !filterOrganic || product.isOrganic;

    return matchesSearch && matchesCategory && matchesFresh && matchesOrganic;
  });

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const renderFreshnessBadge = (freshness) => {
    const colors = {
      fresh: "bg-emerald-100 text-emerald-700",
      frozen: "bg-cyan-100 text-cyan-700",
      dried: "bg-amber-100 text-amber-700",
      chilled: "bg-sky-100 text-sky-700",
    };
    return freshness ? (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[freshness.toLowerCase()] || "bg-gray-100 text-gray-700"}`}
      >
        {freshness.charAt(0).toUpperCase() + freshness.slice(1)}
      </span>
    ) : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50/30 flex items-center justify-center p-4">
        <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <FaLeaf className="text-white text-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-violet-700 text-white py-10 sm:py-14 md:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-10 sm:top-10 sm:left-20 w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full blur-2xl"></div>
          <div className="absolute top-24 sm:top-40 right-10 sm:right-32 w-32 h-32 sm:w-48 sm:h-48 bg-white rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 sm:bottom-20 left-1/4 sm:left-1/3 w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full blur-xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <FaLeaf className="text-2xl sm:text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Fresh Groceries
              </h1>
              <p className="text-green-100 text-sm sm:text-base md:text-lg mt-1">
                Farm-fresh vegetables, fruits, and daily essentials
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 -mt-8 sm:-mt-10 relative z-10">
        {/* Search and Filters Card */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg border-0">
          {/* Search Bar */}
          <div className="relative mb-4 sm:mb-6">
            <div className="absolute inset-y-0 left-3 sm:left-4 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400 text-sm" />
            </div>
            <input
              type="text"
              placeholder="Search groceries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm transition-all text-sm sm:text-base"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
            <span className="text-xs sm:text-sm font-semibold text-gray-600 mr-1">
              Filters:
            </span>
            <button
              onClick={() => setFilterFresh(!filterFresh)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                filterFresh
                  ? "bg-green-100 text-green-700 border border-green-200 shadow-sm"
                  : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ${
                  filterFresh ? "bg-green-500" : "border-2 border-gray-300"
                }`}
              >
                {filterFresh && (
                  <FaCheck className="text-white text-[10px] sm:text-xs" />
                )}
              </div>
              <span className="hidden xs:inline sm:inline">Fresh</span>
              <span className="xs:hidden sm:hidden">Fresh</span>
            </button>

            <button
              onClick={() => setFilterOrganic(!filterOrganic)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                filterOrganic
                  ? "bg-green-100 text-green-700 border border-green-200 shadow-sm"
                  : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ${
                  filterOrganic ? "bg-green-500" : "border-2 border-gray-300"
                }`}
              >
                {filterOrganic && (
                  <FaCheck className="text-white text-[10px] sm:text-xs" />
                )}
              </div>
              Organic
            </button>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              <FaTag className="text-gray-400 flex-shrink-0 text-xs sm:text-sm" />
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === "all"
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    selectedCategory === cat.id
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FaBox className="text-green-600 text-sm sm:text-base" />
            <span className="text-xs sm:text-sm text-gray-600">
              {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""}
            </span>
          </div>
          {filterFresh || filterOrganic ? (
            <button
              onClick={() => {
                setFilterFresh(false);
                setFilterOrganic(false);
              }}
              className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="p-6 sm:p-10 md:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <FaBox className="text-3xl sm:text-4xl text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              No groceries found
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6">
              Try adjusting your search or filters
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFilterFresh(false);
                setFilterOrganic(false);
                setSelectedCategory("all");
              }}
              className="text-sm"
            >
              Clear All Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
                  {/* Product Image */}
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 relative overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaBox className="text-4xl sm:text-5xl text-gray-300" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isOrganic && (
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                          ORGANIC
                        </span>
                      )}
                      {product.freshness === "fresh" && (
                        <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                          FRESH
                        </span>
                      )}
                    </div>

                    {/* Expiry Warning */}
                    {(isExpired(product.expiryDate) ||
                      isExpiringSoon(product.expiryDate)) && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full shadow-lg">
                        {isExpired(product.expiryDate) ? "EXPIRED" : "EXPIRING"}
                      </span>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 text-xs sm:text-sm"
                        >
                          <FaShoppingCart className="mr-1 text-[10px] sm:text-xs" />
                          <span className="hidden xs:inline sm:inline">
                            Add to Cart
                          </span>
                          <span className="xs:hidden sm:hidden">+Cart</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      {renderFreshnessBadge(product.freshness)}
                      {product.unit && (
                        <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                          {product.weight ? `${product.weight}g` : ""}{" "}
                          {product.unit}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base line-clamp-2 group-hover:text-green-600 transition-colors">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="text-xs text-gray-500 mb-2 sm:mb-3 line-clamp-2 hidden sm:block">
                        {product.description}
                      </p>
                    )}

                    {/* Expiry Date */}
                    {product.expiryDate && (
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400 mb-2">
                        <FaCalendarAlt className="text-gray-300" />
                        <span>
                          {isExpired(product.expiryDate)
                            ? "Expired"
                            : `Best by ${new Date(
                                product.expiryDate,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}`}
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-lg sm:text-xl font-bold text-green-600">
                          {product.price?.toFixed(2)} Tk.
                        </span>
                        {product.originalPrice &&
                          product.originalPrice > product.price && (
                            <span className="ml-1.5 text-xs sm:text-sm text-gray-400 line-through">
                              {product.originalPrice?.toFixed(2)} Tk.
                            </span>
                          )}
                      </div>
                      <div className="flex gap-0.5">
                        <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all">
                          <FaHeart className="text-xs sm:text-sm" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-all">
                          <FaShoppingCart className="text-xs sm:text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
