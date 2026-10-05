"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/services";
import ProductCard from "@/components/product/ProductCard";
import { Card, Button, Input } from "@/components/common";
import {
  FaSearch,
  FaMicrophone,
  FaFilter,
  FaHistory,
  FaTimes,
  FaSearchPlus,
  FaMagic,
} from "react-icons/fa";

// Voice search uses the browser's native Web Speech API (SpeechRecognition).
// This requires no model download and no ML runtime, so it stays well within
// serverless limits and works immediately in supported browsers (Chrome/Edge/
// Safari). recognitionStart() resolves with the transcribed text.
function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  return recognition;
}

function recognitionStart(onInstance) {
  return new Promise((resolve, reject) => {
    const recognition = getSpeechRecognition();
    if (!recognition) {
      reject(
        new Error(
          "Speech recognition is not supported in this browser. Try Chrome or Edge.",
        ),
      );
      return;
    }

    // Expose the instance so callers can stop it (e.g. on user toggle).
    if (typeof onInstance === "function") onInstance(recognition);

    let settled = false;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };

    recognition.onresult = (event) => {
      const transcript = (event?.results?.[0]?.[0]?.transcript || "").trim();
      settle(resolve, transcript);
    };
    recognition.onerror = (event) => {
      const error = event?.error || "speech-recognition-error";
      // Non-fatal errors: "no-speech" / "aborted" (user cancelled) and "network"
      // (speech service unreachable/blocked — common in Firefox/Safari or when the
      // browser cannot reach the recognition backend). Resolve with an empty
      // transcript so the UI shows a friendly message instead of throwing.
      if (
        error === "no-speech" ||
        error === "aborted" ||
        error === "network"
      ) {
        settle(resolve, "");
      } else {
        settle(reject, new Error(error));
      }
    };
    recognition.onend = () => {
      // If we get here without a result, treat it as no speech.
      settle(resolve, "");
    };

    try {
      recognition.start();
    } catch (err) {
      settle(reject, err);
    }
  });
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "relevance",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiPowered, setAiPowered] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      // Recent searches are owned by the backend (SearchHistory table).
      (async () => {
        try {
          const searches = await productService.getRecentSearches();
          if (Array.isArray(searches)) setRecentSearches(searches);
        } catch (error) {
          console.error("Error loading recent searches:", error);
        }
      })();
    } else {
      const saved = localStorage.getItem("recentSearches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    }
  }, [isAuthenticated]);

  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    if (searchQuery.trim()) {
      setQuery(searchQuery);
      handleSearch(searchQuery);
    }
  }, [searchQuery]);

  // Debounced suggestion fetching
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await productService.getSearchSuggestions(query);
        setSuggestions(data.slice(0, 8));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [query]);

  const saveRecentSearch = (searchQuery) => {
    if (!searchQuery.trim()) return;

    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 10);
    setRecentSearches(updated);

    // Authenticated users: history is persisted server-side by /api/search.
    // Anonymous users: fall back to localStorage.
    if (!isAuthenticated) {
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    }
  };

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    saveRecentSearch(searchQuery);

    try {
      const params = {
        q: searchQuery,
        ...filters,
      };

      if (filters.category) params.categoryId = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      params.sortBy = filters.sortBy;

      const data = await productService.searchProducts(params);
      setSearchResults(data.products || []);
      setAiPowered(data.aiPowered || false);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setVoiceError("");
    setQuery(suggestion);
    setSuggestions([]);
    handleSearch(suggestion);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setVoiceError("");
    setSuggestions([]);
    router.push(`/search?q=${encodeURIComponent(query)}`);
    handleSearch();
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);

    if (isAuthenticated) {
      try {
        await productService.clearRecentSearches();
      } catch (error) {
        console.error("Error clearing recent searches:", error);
      }
    } else {
      localStorage.removeItem("recentSearches");
    }
  };

  const recognitionRef = useRef(null);

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
  };

  const handleVoiceSearch = async () => {
    // If we're already listening, stop and let the handlers process the result.
    if (isListening) {
      stopVoiceSearch();
      return;
    }

    setVoiceError("");

    if (!getSpeechRecognition()) {
      setVoiceError(
        "Voice search is not supported in this browser. Try Chrome or Edge.",
      );
      return;
    }

    setVoiceStatus("Listening… speak now");
    setIsListening(true);

    try {
      const transcript = await recognitionStart((instance) => {
        recognitionRef.current = instance;
      });

      if (!transcript) {
        setVoiceError("No speech detected. Please try again.");
        return;
      }

      setQuery(transcript);
      router.push(`/search?q=${encodeURIComponent(transcript)}`);
      handleSearch(transcript);
    } catch (err) {
      console.error("Voice transcription error:", err);
      setVoiceError(
        "Voice search failed: " +
          (err?.message || "unable to transcribe audio") +
          ". Check your microphone and try again.",
      );
    } finally {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceStatus("");
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span
        key={i}
        className={i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
            Search Products
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setVoiceError("");
                    setQuery(e.target.value);
                  }}
                  placeholder="Search for products..."
                  className="pl-10 pr-4 py-3 text-lg w-full"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 touch-manipulation"
                      >
                        <FaSearch className="text-gray-400 text-xs flex-shrink-0" />
                        <span className="truncate">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 sm:w-auto">
                <Button
                  type="submit"
                  className="px-4 sm:px-6 flex-1 sm:flex-none"
                >
                  Search
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVoiceSearch}
                  className="px-3 sm:px-4"
                  title="Voice search"
                >
                  <FaMicrophone
                    className={isListening ? "text-red-500 animate-pulse" : ""}
                  />
                </Button>

                <Button
                  type="button"
                  variant={aiPowered ? "primary" : "outline"}
                  onClick={() => handleSearch()}
                  className="px-3 sm:px-4 flex items-center gap-1 sm:gap-2 whitespace-nowrap"
                  title="AI-powered search"
                >
                  <FaMagic className="text-xs sm:text-sm" />
                  <span className="hidden sm:inline">AI</span>
                  <span className="sm:hidden">AI</span>
                </Button>
              </div>
            </div>
          </form>

          {voiceError && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span className="flex-1">{voiceError}</span>
              <button
                type="button"
                onClick={() => setVoiceError("")}
                className="text-amber-500 hover:text-amber-700"
                aria-label="Dismiss"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {voiceStatus && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <span className="flex-1">{voiceStatus}</span>
            </div>
          )}

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <FaFilter />
              Filters
            </button>

            {query && (
              <span className="text-sm text-gray-500 block sm:inline">
                {searchResults.length} results for "{query}"
                {aiPowered && (
                  <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                    AI Powered
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="p-4 mt-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      setFilters({ ...filters, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Categories</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="home">Home & Garden</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price
                  </label>
                  <Input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, minPrice: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price
                  </label>
                  <Input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, maxPrice: e.target.value })
                    }
                    placeholder="Any"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters({ ...filters, sortBy: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-col xs:flex-row gap-2">
                <Button
                  onClick={() => handleSearch()}
                  className="w-full xs:w-auto"
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      category: "",
                      minPrice: "",
                      maxPrice: "",
                      sortBy: "relevance",
                    });
                  }}
                  className="w-full xs:w-auto"
                >
                  Clear
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Search Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl h-80 animate-pulse"
              ></div>
            ))}
          </div>
        ) : query ? (
          searchResults.length > 0 ? (
            <>
              {aiPowered && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
                  <FaMagic className="text-purple-600" />
                  <span className="text-purple-800 text-sm">
                    AI-powered semantic search results
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <FaSearchPlus className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No results found
              </h3>
              <p className="text-gray-500 mb-6">
                Try different keywords or filters
              </p>
              <Button onClick={() => handleSearch()}>
                <FaMagic className="mr-2" />
                Try AI Search
              </Button>
            </Card>
          )
        ) : (
          <div className="space-y-8">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FaHistory />
                    Recent Searches
                  </h2>
                  <button
                    onClick={clearRecentSearches}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(search);
                        handleSearch(search);
                      }}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Tips */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Search Tips
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li>• Use specific keywords for better results</li>
                <li>• Try voice search for hands-free searching</li>
                <li>• Use AI Search for semantic understanding</li>
                <li>• Combine filters to narrow down results</li>
              </ul>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <SearchPageInner />
    </Suspense>
  );
}
