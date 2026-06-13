"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaSearch,
  FaShoppingCart,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaHeart,
  FaBox,
  FaLeaf,
  FaFileAlt,
  FaChartLine,
  FaUsers,
  FaFolder,
  FaShoppingBag,
  FaStore,
  FaCog,
  FaBell,
  FaMagic,
  FaStar,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { productService } from "@/services";
import Input from "../common/Input";

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  const isAdmin = user?.role === "ADMIN";
  const isSeller = user?.role === "SELLER";

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length >= 2) {
        try {
          const suggestions = await productService.getSearchSuggestions(searchQuery);
          setSearchSuggestions(suggestions.slice(0, 6));
          setShowSuggestions(suggestions.length > 0);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Shop
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products with AI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </form>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50">
                {searchSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                  >
                    <FaSearch className="text-gray-400 text-xs" />
                    {suggestion}
                  </button>
                ))}
                <div className="px-4 py-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(searchQuery)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <FaMagic className="text-xs" />
                    AI Search for "{searchQuery}"
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Products
            </Link>
            <Link
              href="/grocery"
              className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors"
            >
              <FaLeaf />
              Grocery
            </Link>
            <Link
              href="/custom-order"
              className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 transition-colors"
            >
              <FaFileAlt />
              Custom Order
            </Link>
            <Link
              href="/categories"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/search"
              className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors"
            >
              <FaSearch />
              Search
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/orders"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Orders
                </Link>
                <Link
                  href="/offers"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Bargaining
                </Link>
              </>
            )}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-3">
            {/* Wishlist */}
            {isAuthenticated && (
              <Link
                href="/wishlist"
                className="relative p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Wishlist"
              >
                <FaHeart size={20} />
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Shopping Cart"
            >
              <FaShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <FaUser size={20} />
                  <span className="hidden lg:inline text-sm font-medium truncate max-w-[100px]">
                    {user?.name || "User"}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 opacity-100 visible transition-all duration-200 z-50">
                    <div className="py-3">
                      {/* User Info */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isAdmin
                              ? "bg-purple-100 text-purple-700"
                              : isSeller
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {user?.role}
                          </span>
                        </div>
                      </div>

                      {/* Common Links */}
                      <Link
                        href="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                      >
                        <FaUser className="text-gray-400" />
                        My Profile
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                      >
                        <FaShoppingBag className="text-gray-400" />
                        My Orders
                      </Link>
                      <Link
                        href="/reviews"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                      >
                        <FaStar className="text-gray-400" />
                        My Reviews
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                      >
                        <FaHeart className="text-gray-400" />
                        Wishlist
                      </Link>
                      <Link
                        href="/offers"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                      >
                        <FaFileAlt className="text-gray-400" />
                        My Offers
                      </Link>
                      <Link
                        href="/payments"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                      >
                        <FaShoppingBag className="text-gray-400" />
                        Payments
                      </Link>

                      {/* Admin Panel */}
                      {isAdmin && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <p className="px-4 py-2 text-xs font-semibold text-purple-600 uppercase">
                            Admin Panel
                          </p>
                          <Link
                            href="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2"
                          >
                            <FaChartLine className="text-purple-500" />
                            Dashboard
                          </Link>
                          <Link
                            href="/admin/users"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2"
                          >
                            <FaUsers className="text-purple-500" />
                            Users
                          </Link>
                          <Link
                            href="/admin/products"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2"
                          >
                            <FaBox className="text-purple-500" />
                            Products
                          </Link>
                          <Link
                            href="/admin/orders"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2"
                          >
                            <FaShoppingBag className="text-purple-500" />
                            Orders
                          </Link>
                          <Link
                            href="/admin/categories"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2"
                          >
                            <FaFolder className="text-purple-500" />
                            Categories
                          </Link>
                          <Link
                            href="/admin/analytics/full"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2"
                          >
                            <FaChartLine className="text-purple-500" />
                            Analytics
                          </Link>
                          <Link
                            href="/admin/recommendations"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2"
                          >
                            <FaMagic className="text-purple-500" />
                            Recommendations
                          </Link>
                          <Link
                            href="/admin/churn-predictions"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2"
                          >
                            <FaBell className="text-purple-500" />
                            Churn Predictions
                          </Link>
                        </>
                      )}

                      {/* Seller Panel */}
                      {isSeller && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <p className="px-4 py-2 text-xs font-semibold text-blue-600 uppercase">
                            Seller Panel
                          </p>
                          <Link
                            href="/seller/orders"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                          >
                            <FaShoppingBag className="text-blue-500" />
                            Orders
                          </Link>
                          <Link
                            href="/seller/products"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                          >
                            <FaBox className="text-blue-500" />
                            My Products
                          </Link>
                          <Link
                            href="/seller/products/add"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                          >
                            <FaStore className="text-blue-500" />
                            Add Product
                          </Link>
                          <Link
                            href="/seller/custom-orders"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                          >
                            <FaFileAlt className="text-blue-500" />
                            Custom Orders
                          </Link>
                        </>
                      )}

                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <FaSignOutAlt />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 bg-gray-50">
            <form onSubmit={handleSearch} className="mb-4">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </form>
            <div className="space-y-1">
              <Link
                href="/products"
                onClick={() => setIsMenuOpen(false)}
                className="block py-2.5 px-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
              >
                Products
              </Link>
              <Link
                href="/grocery"
                onClick={() => setIsMenuOpen(false)}
                className="block py-2.5 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg font-medium flex items-center gap-2"
              >
                <FaLeaf className="text-sm" />
                Grocery
              </Link>
              <Link
                href="/custom-order"
                onClick={() => setIsMenuOpen(false)}
                className="block py-2.5 px-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg font-medium flex items-center gap-2"
              >
                <FaFileAlt className="text-sm" />
                Custom Order
              </Link>
              <Link
                href="/categories"
                onClick={() => setIsMenuOpen(false)}
                className="block py-2.5 px-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
              >
                Categories
              </Link>
              <Link
                href="/search"
                onClick={() => setIsMenuOpen(false)}
                className="block py-2.5 px-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium flex items-center gap-2"
              >
                <FaSearch className="text-sm" />
                Search
              </Link>

              {isAuthenticated && (
                <>
                  <div className="border-t border-gray-200 my-2" />
                  <Link
                    href="/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2.5 px-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                  >
                    Orders
                  </Link>
                  <Link
                    href="/offers"
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2.5 px-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                  >
                    Bargaining
                  </Link>
                  <Link
                    href="/reviews"
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2.5 px-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                  >
                    Reviews
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2.5 px-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                  >
                    Wishlist
                  </Link>

                  {isSeller && (
                    <>
                      <div className="border-t border-gray-200 my-2" />
                      <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                        Seller Panel
                      </p>
                      <Link
                        href="/seller/orders"
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-2.5 px-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                      >
                        Seller Orders
                      </Link>
                      <Link
                        href="/seller/products"
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-2.5 px-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                      >
                        My Products
                      </Link>
                      <Link
                        href="/seller/products/add"
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-2.5 px-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                      >
                        Add Product
                      </Link>
                      <Link
                        href="/seller/custom-orders"
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-2.5 px-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                      >
                        Custom Orders
                      </Link>
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <div className="border-t border-gray-200 my-2" />
                      <p className="px-3 py-2 text-xs font-semibold text-purple-600 uppercase">
                        Admin Panel
                      </p>
                      <Link
                        href="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-2.5 px-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg font-medium"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/admin/users"
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-2.5 px-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg font-medium"
                      >
                        Users
                      </Link>
                      <Link
                        href="/admin/products"
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-2.5 px-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg font-medium"
                      >
                        Products
                      </Link>
                      <Link
                        href="/admin/orders"
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-2.5 px-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg font-medium"
                      >
                        Orders
                      </Link>
                      <Link
                        href="/admin/analytics/full"
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-2.5 px-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg font-medium"
                      >
                        Analytics
                      </Link>
                      <Link
                        href="/admin/recommendations"
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-2.5 px-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg font-medium"
                      >
                        Recommendations
                      </Link>
                      <Link
                        href="/admin/churn-predictions"
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-2.5 px-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg font-medium"
                      >
                        Churn Predictions
                      </Link>
                    </>
                  )}
                </>
              )}

              {isAuthenticated && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left py-2.5 px-3 text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center gap-2"
                >
                  <FaSignOutAlt />
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
