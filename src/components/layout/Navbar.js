"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  FaSearch,
  FaShoppingCart,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaHeart,
  FaChevronDown,
  FaChevronLeft,
  FaBell,
  FaStar,
  FaShoppingBag,
  FaCog,
  FaLeaf,
  FaFileAlt,
  FaChartLine,
  FaUsers,
  FaFolder,
  FaBox,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { productService } from "@/services";
import Input from "../common/Input";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { itemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const searchInputRef = useRef(null);

  const isAdmin = user?.role === "ADMIN";
  const isSeller = user?.role === "SELLER";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const suggestions = await productService.getSearchSuggestions(searchQuery);
          setSearchSuggestions(suggestions.slice(0, 5));
          setShowSuggestions(suggestions.length > 0);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    };
    const timer = setTimeout(fetchSuggestions, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setIsMobileMenuOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, router]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setIsMobileMenuOpen(false);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  }, [router]);

  const handleLogout = useCallback(async () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    router.push("/");
  }, [logout, router]);

  const isActive = (href) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200/80"
        : "bg-white border-b border-gray-100"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 group">
            <span className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] group-hover:bg-[position:right] transition-all duration-500">
              AI Shop
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-6 lg:mx-8 relative" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="relative group">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-gray-200 rounded-full text-sm focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors text-sm" />
              </div>

              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                  {searchSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
                    >
                      <FaSearch className="text-gray-400 text-xs" />
                      {suggestion}
                    </button>
                  ))}
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionClick(searchQuery)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5"
                    >
                      <FaStar className="text-[10px]" />
                      AI Search for &quot;{searchQuery}&quot;
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {[
              { href: "/products", label: "Products", icon: FaBox },
              { href: "/grocery", label: "Grocery", icon: FaLeaf },
              { href: "/custom-order", label: "Custom Order", icon: FaFileAlt },
              { href: "/categories", label: "Categories", icon: FaFolder },
              { href: "/search", label: "Search", icon: FaSearch },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive(link.href)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.icon && <link.icon className="text-xs" />}
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute inset-x-1 -bottom-1 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {!loading && isAuthenticated && (
              <Link
                href="/wishlist"
                className={`relative p-2 rounded-lg transition-all duration-200 ${
                  isActive("/wishlist")
                    ? "text-red-500 bg-red-50"
                    : "text-gray-500 hover:text-red-500 hover:bg-red-50"
                }`}
                title="Wishlist"
              >
                <FaHeart size={18} className="sm:text-[20px]" />
              </Link>
            )}

            <Link
              href="/cart"
              className={`relative p-2 rounded-lg transition-all duration-200 ${
                isActive("/cart")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              }`}
              title="Cart"
            >
              <FaShoppingCart size={18} className="sm:text-[20px]" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] sm:text-xs min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] rounded-full flex items-center justify-center font-bold shadow-sm">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Search Button */}
            <button
              onClick={() => {
                const next = !showSuggestions;
                setShowSuggestions(next);
                if (next) setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="md:hidden p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              aria-label="Search"
            >
              <FaSearch size={18} />
            </button>

             {/* User Menu */}
             {!loading && isAuthenticated && (
               <div className="relative" ref={userMenuRef}>
                 <button
                   onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                   className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                     isUserMenuOpen
                       ? "text-blue-600 bg-blue-50"
                       : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                   }`}
                 >
                   <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-sm">
                     {user?.name?.charAt(0)?.toUpperCase() || "U"}
                   </div>
                   <span className="hidden md:inline text-xs sm:text-sm font-medium text-gray-700 max-w-[80px] truncate">
                     {user?.name || "User"}
                   </span>
                   <FaChevronDown className={`hidden lg:block text-[10px] text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`} />
                 </button>

                 {isUserMenuOpen && (
                   <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                     {/* User Header */}
                     <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                       <p className="text-sm font-bold text-gray-900 truncate">{user?.name || "User"}</p>
                       <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                       <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                         isAdmin
                           ? "bg-purple-100 text-purple-700"
                           : isSeller
                             ? "bg-blue-100 text-blue-700"
                             : "bg-gray-100 text-gray-700"
                       }`}>
                         {user?.role}
                       </span>
                     </div>

                     {/* Quick Links */}
                     <div className="py-2 max-h-[60vh] overflow-y-auto overscroll-contain">
                       {[
                         { href: "/profile", label: "My Profile", icon: FaUser },
                         { href: "/orders", label: "My Orders", icon: FaShoppingBag },
                         { href: "/reviews", label: "My Reviews", icon: FaStar },
                         { href: "/wishlist", label: "Wishlist", icon: FaHeart },
                         { href: "/payments", label: "Payments", icon: FaShoppingBag },
                         ...(isAuthenticated ? [{ href: "/offers", label: "My Offers", icon: FaStar }] : []),
                       ].map((link) => (
                         <Link
                           key={link.href}
                           href={link.href}
                           onClick={() => setIsUserMenuOpen(false)}
                           className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                         >
                           <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                             <link.icon className="text-gray-500 text-xs" />
                           </div>
                           {link.label}
                         </Link>
                       ))}

                       {isAdmin && (
                         <>
                           <div className="mx-4 my-2 border-t border-gray-100" />
                           <p className="px-4 py-1.5 text-[10px] font-bold text-purple-600 uppercase tracking-wider">Admin Panel</p>
                           {[
                             { href: "/admin", label: "Dashboard", icon: FaChartLine },
                             { href: "/admin/users", label: "Users", icon: FaUsers },
                             { href: "/admin/products", label: "Products", icon: FaFolder },
                             { href: "/admin/orders", label: "Orders", icon: FaShoppingBag },
                             { href: "/admin/categories", label: "Categories", icon: FaCog },
                             { href: "/admin/analytics/full", label: "Analytics", icon: FaChartLine },
                             { href: "/admin/recommendations", label: "Recommendations", icon: FaStar },
                             { href: "/admin/churn-predictions", label: "Churn Predictions", icon: FaBell },
                           ].map((link) => (
                             <Link
                               key={link.href}
                               href={link.href}
                               onClick={() => setIsUserMenuOpen(false)}
                               className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                             >
                               <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                 isActive(link.href) ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"
                               }`}>
                                 <link.icon className="text-xs" />
                               </div>
                               {link.label}
                             </Link>
                           ))}
                         </>
                       )}

                       {isSeller && (
                         <>
                           <div className="mx-4 my-2 border-t border-gray-100" />
                           <p className="px-4 py-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider">Seller Panel</p>
                           {[
                             { href: "/seller/orders", label: "Orders", icon: FaShoppingBag },
                             { href: "/seller/products", label: "My Products", icon: FaFolder },
                             { href: "/seller/products/add", label: "Add Product", icon: FaCog },
                           ].map((link) => (
                             <Link
                               key={link.href}
                               href={link.href}
                               onClick={() => setIsUserMenuOpen(false)}
                               className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                             >
                               <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                                 <link.icon className="text-gray-500 text-xs" />
                               </div>
                               {link.label}
                             </Link>
                           ))}
                         </>
                       )}
                     </div>

                     <div className="border-t border-gray-100">
                       <button
                         onClick={handleLogout}
                         className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                       >
                         <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                           <FaSignOutAlt className="text-red-500 text-xs" />
                         </div>
                         Logout
                       </button>
                     </div>
                   </div>
                 )}
               </div>
             )}
             {!loading && !isAuthenticated && (
               <div className="hidden md:flex items-center gap-2">
                 <Link
                   href="/login"
                   className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
                 >
                   Login
                 </Link>
                 <Link
                   href="/register"
                   className="text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                 >
                   Sign Up
                 </Link>
               </div>
             )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-all duration-200 ${
                isMobileMenuOpen
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Search (animated) */}
        <div className="md:hidden overflow-hidden transition-all duration-300" style={{ maxHeight: showSuggestions ? "300px" : "0px" }}>
          <div className="pb-3 pt-1" ref={mobileSearchRef}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl text-sm"
                />
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
              </div>
            </form>

            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                {searchSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
                  >
                    <FaSearch className="text-gray-400 text-xs" />
                    {suggestion}
                  </button>
                ))}
                <div className="px-4 py-2.5 border-t border-gray-100">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSuggestionClick(searchQuery)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5"
                  >
                    <FaStar className="text-[10px]" />
                    AI Search for &quot;{searchQuery}&quot;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu (animated) */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen ? "max-h-[80vh]" : "max-h-0"
        }`}
      >
        <div className="border-t border-gray-100 bg-white/95 backdrop-blur-lg">
          <div className="px-4 py-3 space-y-1">
            {[
              { href: "/products", label: "Products", icon: FaBox },
              { href: "/grocery", label: "Grocery", icon: FaLeaf },
              { href: "/custom-order", label: "Custom Order", icon: FaFileAlt },
              { href: "/categories", label: "Categories", icon: FaFolder },
              { href: "/search", label: "Search", icon: FaSearch },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                {link.icon && <link.icon className="text-sm" />}
                {link.label}
              </Link>
            ))}

             {!loading && isAuthenticated && (
              <>
                <div className="my-2 border-t border-gray-100" />
                <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account</p>
                {[
                  { href: "/profile", label: "My Profile", icon: FaUser },
                  { href: "/orders", label: "My Orders", icon: FaShoppingBag },
                  { href: "/reviews", label: "My Reviews", icon: FaStar },
                  { href: "/wishlist", label: "Wishlist", icon: FaHeart },
                  { href: "/payments", label: "Payments", icon: FaShoppingBag },
                  { href: "/offers", label: "My Offers", icon: FaStar },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(link.href)
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  >
                    <link.icon className="text-sm" />
                    {link.label}
                  </Link>
                ))}

                {isSeller && (
                  <>
                    <div className="my-2 border-t border-gray-100" />
                    <p className="px-4 py-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider">Seller Panel</p>
                    {[
                      { href: "/seller/orders", label: "Seller Orders" },
                      { href: "/seller/products", label: "My Products" },
                      { href: "/seller/products/add", label: "Add Product" },
                      { href: "/seller/custom-orders", label: "Custom Orders" },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-all"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </>
                )}

                {isAdmin && (
                  <>
                    <div className="my-2 border-t border-gray-100" />
                    <p className="px-4 py-2 text-[10px] font-bold text-purple-600 uppercase tracking-wider">Admin Panel</p>
                    {[
                      { href: "/admin", label: "Dashboard" },
                      { href: "/admin/users", label: "Users" },
                      { href: "/admin/products", label: "Products" },
                      { href: "/admin/orders", label: "Orders" },
                      { href: "/admin/analytics/full", label: "Analytics" },
                      { href: "/admin/recommendations", label: "Recommendations" },
                      { href: "/admin/churn-predictions", label: "Churn Predictions" },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </>
                )}

                <div className="my-2 border-t border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <FaSignOutAlt className="text-sm" />
                  Logout
                </button>
              </>
            )}

             {!loading && !isAuthenticated && (
              <div className="pt-3 mt-2 border-t border-gray-100 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-sm transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
