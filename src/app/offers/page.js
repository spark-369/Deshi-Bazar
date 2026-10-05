"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { offerService } from "@/services";
import { Card, Button } from "@/components/common";
import { FaTag, FaCheck, FaTimes, FaReply, FaClock } from "react-icons/fa";

export default function OffersPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [offers, setOffers] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sent");
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOffers();
    }
  }, [isAuthenticated]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const [sent, received] = await Promise.all([
        offerService.getOffers("sent"),
        offerService.getOffers("received"),
      ]);
      setOffers({ sent, received });
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (offerId, action, counterOffer = null) => {
    setResponding(offerId);
    try {
      await offerService.respondToOffer(offerId, action, counterOffer);
      fetchOffers();
    } catch (error) {
      console.error("Error responding to offer:", error);
      alert(error.data?.error || error.message || "Failed to respond to offer");
    } finally {
      setResponding(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ACCEPTED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      COUNTERED: "bg-blue-100 text-blue-800",
      EXPIRED: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.PENDING}`}
      >
        {status}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentOffers = activeTab === "sent" ? offers.sent : offers.received;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            My Offers
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Manage your bargaining offers
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("sent")}
            className={`pb-2 sm:pb-3 px-1 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "sent"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Offers I Made ({offers.sent.length})
          </button>
          <button
            onClick={() => setActiveTab("received")}
            className={`pb-2 sm:pb-3 px-1 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === "received"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Offers I Received ({offers.received.length})
          </button>
        </div>

        {/* Offers List */}
        {currentOffers.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <FaTag className="text-4xl sm:text-5xl text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
              {activeTab === "sent"
                ? "No offers sent yet"
                : "No offers received yet"}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto px-4">
              {activeTab === "sent"
                ? "Start bargaining on negotiable products to see your offers here"
                : "When buyers make offers on your products, they will appear here"}
            </p>
            <Link href="/products">
              <Button className="w-full sm:w-auto">Browse Products</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {currentOffers.map((offer) => (
              <Card key={offer.id} className="p-4 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Product Info */}
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {offer.product?.images?.[0] ? (
                        <img
                          src={offer.product.images[0]}
                          alt={offer.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs sm:text-sm">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/products/${offer.productId}`}
                        className="font-medium text-gray-900 hover:text-blue-600 text-sm sm:text-base"
                      >
                        {offer.product?.name}
                      </Link>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Original Price: {offer.product?.price?.toFixed(2)} Tk.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {getStatusBadge(offer.status)}
                        {offer.product?.isNegotiable && (
                          <span className="text-xs text-green-600">
                            Negotiable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Offer Details */}
                  <div className="text-left md:text-right flex-shrink-0">
                    <div className="mb-2">
                      <p className="text-xs sm:text-sm text-gray-500">
                        Your Offer
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">
                        {offer.initialOffer?.toFixed(2)} Tk.
                      </p>
                    </div>
                    {offer.counterOffer && (
                      <div className="mb-2">
                        <p className="text-xs sm:text-sm text-gray-500">
                          Counter Offer
                        </p>
                        <p className="text-base sm:text-lg font-semibold text-blue-600">
                          {offer.counterOffer?.toFixed(2)} Tk.
                        </p>
                      </div>
                    )}
                    {offer.aiSuggestedPrice && (
                      <p className="text-xs text-gray-500">
                         Suggested: Tk.{offer.aiSuggestedPrice?.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions - For received offers */}
                {activeTab === "received" && offer.status === "PENDING" && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleResponse(offer.id, "accept")}
                      loading={responding === offer.id}
                      className="w-full sm:w-auto"
                    >
                      <FaCheck className="mr-1" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleResponse(offer.id, "reject")}
                      loading={responding === offer.id}
                      className="w-full sm:w-auto"
                    >
                      <FaTimes className="mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const counter = prompt("Enter counter offer amount:");
                        if (counter && !isNaN(counter)) {
                          handleResponse(
                            offer.id,
                            "counter",
                            parseFloat(counter),
                          );
                        }
                      }}
                      loading={responding === offer.id}
                      className="w-full sm:w-auto"
                    >
                      <FaReply className="mr-1" /> Counter
                    </Button>
                  </div>
                )}

                {/* Actions - For sent offers with counter offer */}
                {activeTab === "sent" &&
                  offer.status === "COUNTERED" &&
                  offer.counterOffer && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                          handleResponse(offer.id, "accept_counter");
                        }}
                        loading={responding === offer.id}
                        className="w-full sm:w-auto"
                      >
                        <FaCheck className="mr-1" /> Accept Counter (
                        {offer.counterOffer?.toFixed(2)} Tk.)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const counter = prompt(
                            "Enter your new offer amount:",
                            offer.counterOffer,
                          );
                          if (counter && !isNaN(counter)) {
                            handleResponse(
                              offer.id,
                              "counter",
                              parseFloat(counter),
                            );
                          }
                        }}
                        loading={responding === offer.id}
                        className="w-full sm:w-auto"
                      >
                        <FaReply className="mr-1" /> Counter Again
                      </Button>
                    </div>
                  )}

                {/* Timestamps */}
                <div className="mt-3 sm:mt-4 flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <FaClock /> Created:{" "}
                    {new Date(offer.createdAt).toLocaleDateString()}
                  </span>
                  {offer.acceptedAt && (
                    <span className="text-green-600">
                      Accepted:{" "}
                      {new Date(offer.acceptedAt).toLocaleDateString()}
                    </span>
                  )}
                  {offer.rejectedAt && (
                    <span className="text-red-600">
                      Rejected:{" "}
                      {new Date(offer.rejectedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
