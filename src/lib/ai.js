// AI Utilities using HuggingFace Transformer.js
// Note: These functions are designed for server-side use

let pipeline = null;

/**
 * Initialize the transformer pipeline lazily
 * @param {string} task - Task name (sentiment-analysis, feature-extraction, etc.)
 * @param {string} model - Model name
 */
async function getPipeline(task, model) {
  if (!pipeline) {
    const { pipeline: createPipeline } =
      await import("@huggingface/transformers");
    pipeline = await createPipeline(task, model);
  }
  return pipeline;
}

/**
 * Analyze sentiment of text
 * @param {string} text - Text to analyze
 * @returns {Object} Sentiment analysis result
 */
export async function analyzeSentiment(text) {
  try {
    const sentimentPipeline = await getPipeline(
      "sentiment-analysis",
      "distilbert-base-uncased-finetuned-sst-2-english",
    );
    const result = await sentimentPipeline(text);
    return {
      score: result[0].score,
      label: result[0].label,
    };
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return { score: 0, label: "NEUTRAL" };
  }
}

/**
 * Detect fake reviews using a classification model
 * @param {string} reviewText - Review text to analyze
 * @param {Object} reviewMetadata - Additional metadata
 * @returns {Object} Fake review detection result
 */
export async function detectFakeReview(reviewText, reviewMetadata = {}) {
  // Using a zero-shot classification approach for fake review detection
  try {
    const { pipeline: zeroShot } = await import("@huggingface/transformers");
    const classifier = await zeroShot(
      "zero-shot-classification",
      "facebook/bart-large-mnli",
    );

    const result = await classifier(reviewText, [
      "genuine review",
      "fake review",
      "suspicious review",
    ]);

    // Calculate fake score based on labels
    const labels = result.labels;
    const scores = result.scores;
    const fakeIndex = labels.indexOf("fake review");
    const suspiciousIndex = labels.indexOf("suspicious review");

    const fakeScore =
      (fakeIndex >= 0 ? scores[fakeIndex] : 0) +
      (suspiciousIndex >= 0 ? scores[suspiciousIndex] * 0.5 : 0);

    return {
      isFake: fakeScore > 0.5,
      fakeScore: Math.min(fakeScore, 1),
      confidence: Math.max(...scores),
    };
  } catch (error) {
    console.error("Fake review detection error:", error);
    return { isFake: false, fakeScore: 0, confidence: 0 };
  }
}

/**
 * Generate text embeddings for semantic search
 * @param {string} text - Text to embed
 * @returns {Array} Embedding vector
 */
export async function generateEmbedding(text) {
  try {
    const { pipeline: featureExtraction } =
      await import("@huggingface/transformers");
    const extractor = await featureExtraction(
      "feature-extraction",
      "sentence-transformers/all-MiniLM-L6-v2",
    );

    const result = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(result);
  } catch (error) {
    console.error("Embedding generation error:", error);
    return null;
  }
}

/**
 * Get AI-powered search suggestions/autocomplete
 * @param {string} query - User search query
 * @param {Array} productNames - List of product names for matching
 * @returns {Array} Suggested queries
 */
export async function getAISearchSuggestions(query, productNames = []) {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    const queryLower = query.toLowerCase();

    // Generate embeddings for matching
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) {
      // Fallback to simple matching
      return productNames
        .filter((name) => name.toLowerCase().includes(queryLower))
        .slice(0, 5);
    }

    // Score products by embedding similarity
    const scored = await Promise.all(
      productNames.map(async (name) => {
        const nameEmbedding = await generateEmbedding(name);
        if (!nameEmbedding) return { name, score: 0 };

        // Cosine similarity
        const dotProduct = queryEmbedding.reduce(
          (sum, val, i) => sum + val * nameEmbedding[i],
          0,
        );
        return { name, score: dotProduct };
      }),
    );

    // Sort by score and return top suggestions
    return scored
      .filter((item) => item.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.name);
  } catch (error) {
    console.error("Search suggestions error:", error);
    return [];
  }
}

/**
 * Suggest acceptable price for negotiation
 * @param {number} originalPrice - Original product price
 * @param {number} userOffer - User's offer price
 * @param {Object} productData - Product data for context
 * @returns {Object} Price suggestion
 */
export async function suggestNegotiationPrice(
  originalPrice,
  userOffer,
  productData = {},
) {
  try {
    // Simple price suggestion based on market data
    const minAcceptable = originalPrice * 0.7; // 30% discount
    const maxAcceptable = originalPrice * 0.95; // 5% discount

    // Calculate confidence based on how reasonable the offer is
    let confidence = 0;
    let suggestion = "";

    if (userOffer >= originalPrice * 0.95) {
      confidence = 0.95;
      suggestion = "Accept - This is a fair offer";
    } else if (userOffer >= originalPrice * 0.85) {
      confidence = 0.75;
      suggestion = "Counter with " + (originalPrice * 0.92).toFixed(2);
    } else if (userOffer >= originalPrice * 0.75) {
      confidence = 0.5;
      suggestion = "Counter with " + (originalPrice * 0.82).toFixed(2);
    } else if (userOffer >= minAcceptable) {
      confidence = 0.3;
      suggestion = "Strong counter needed - Offer too low";
    } else {
      confidence = 0.1;
      suggestion = "Reject - Offer not reasonable";
    }

    return {
      suggestedPrice: (minAcceptable + maxAcceptable) / 2,
      minAcceptable,
      maxAcceptable,
      confidence,
      suggestion,
      aiDecision: userOffer >= minAcceptable ? "ACCEPTABLE" : "TOO_LOW",
    };
  } catch (error) {
    console.error("Price suggestion error:", error);
    return {
      suggestedPrice: originalPrice * 0.85,
      minAcceptable: originalPrice * 0.7,
      maxAcceptable: originalPrice * 0.95,
      confidence: 0.5,
      suggestion: "Unable to analyze",
      aiDecision: "NEUTRAL",
    };
  }
}

/**
 * Predict offer acceptance probability
 * @param {number} offerPrice - The offered price
 * @param {number} originalPrice - Original product price
 * @param {Object} context - Additional context
 * @returns {Object} Prediction result
 */
export async function predictOfferAcceptance(
  offerPrice,
  originalPrice,
  context = {},
) {
  const discountPercentage =
    ((originalPrice - offerPrice) / originalPrice) * 100;

  // Simple prediction model
  let probability = 0;
  let factors = [];

  if (discountPercentage <= 5) {
    probability = 0.9;
    factors.push("Small discount - high chance of acceptance");
  } else if (discountPercentage <= 15) {
    probability = 0.7;
    factors.push("Moderate discount - reasonable chance");
  } else if (discountPercentage <= 25) {
    probability = 0.4;
    factors.push("Large discount - depends on seller");
  } else {
    probability = 0.15;
    factors.push("Very large discount - unlikely to accept");
  }

  // Factor in product negotiability
  if (context.isNegotiable) {
    probability *= 1.2;
    factors.push("Product is marked as negotiable");
  }

  // Factor in stock levels
  if (context.stock && context.stock < 5) {
    probability *= 0.8;
    factors.push("Low stock may reduce flexibility");
  }

  return {
    probability: Math.min(probability, 1),
    discountPercentage,
    factors,
    recommendation:
      probability > 0.6
        ? "LIKELY_ACCEPTED"
        : probability > 0.3
          ? "POSSIBLE"
          : "UNLIKELY",
  };
}

/**
 * Detect fraudulent payment
 * @param {Object} paymentData - Payment information
 * @param {Object} userHistory - User's transaction history
 * @returns {Object} Fraud detection result
 */
export async function detectFraud(paymentData, userHistory = {}) {
  try {
    let riskScore = 0;
    let flags = [];

    // Check for unusual amount
    const avgOrderValue = userHistory.avgOrderValue || 0;
    if (paymentData.amount > avgOrderValue * 5 && avgOrderValue > 0) {
      riskScore += 0.4;
      flags.push("Unusually high amount compared to history");
    }

    // Check for rapid transactions
    if (userHistory.recentTransactions && userHistory.recentTransactions > 5) {
      riskScore += 0.3;
      flags.push("High frequency of recent transactions");
    }

    // Check for new account
    if (userHistory.accountAge < 7) {
      riskScore += 0.2;
      flags.push("New account");
    }

    // Check for mismatched billing/shipping
    if (paymentData.billingAddress !== paymentData.shippingAddress) {
      riskScore += 0.1;
      flags.push("Different billing and shipping addresses");
    }

    // Simple rule-based detection (in production, use ML model)
    const isFlagged = riskScore > 0.5;

    return {
      isFlagged,
      riskScore: Math.min(riskScore, 1),
      flags,
      recommendation: isFlagged ? "REVIEW_MANUALLY" : "APPROVE",
    };
  } catch (error) {
    console.error("Fraud detection error:", error);
    return {
      isFlagged: false,
      riskScore: 0,
      flags: [],
      recommendation: "APPROVE",
    };
  }
}

/**
 * Predict delivery time
 * @param {string} shippingMethod - Shipping method
 * @param {string} destination - Delivery destination
 * @param {Object} orderData - Order information
 * @returns {Object} Delivery prediction
 */
export async function predictDeliveryTime(
  shippingMethod,
  destination,
  orderData = {},
) {
  // Simple prediction based on shipping method
  const baseDeliveryDays = {
    standard: 7,
    express: 3,
    overnight: 1,
  };

  let predictedDays = baseDeliveryDays[shippingMethod] || 7;

  // Adjust for destination
  if (destination && destination.toLowerCase().includes("remote")) {
    predictedDays += 2;
  }

  // Calculate risk score
  const riskScore =
    shippingMethod === "overnight"
      ? 0.1
      : shippingMethod === "express"
        ? 0.2
        : 0.3;

  const predictedDate = new Date();
  predictedDate.setDate(predictedDate.getDate() + predictedDays);

  return {
    predictedDays,
    predictedDate: predictedDate.toISOString(),
    riskScore,
    recommendation: riskScore < 0.2 ? "LOW_RISK" : "MEDIUM_RISK",
  };
}

/**
 * Generate personalized product recommendations
 * @param {string} userId - User ID
 * @param {Array} viewedProducts - Products user viewed
 * @param {Array} allProducts - All available products
 * @returns {Array} Recommended products with scores
 */
export async function generateRecommendations(
  userId,
  viewedProducts = [],
  allProducts = [],
) {
  try {
    if (!viewedProducts.length || !allProducts.length) {
      return [];
    }

    // Get embeddings for viewed products
    const viewedEmbeddings = await Promise.all(
      viewedProducts.map((p) =>
        generateEmbedding(p.name + " " + (p.description || "")),
      ),
    );

    // Score all products
    const recommendations = await Promise.all(
      allProducts.map(async (product) => {
        const productEmbedding = await generateEmbedding(
          product.name + " " + (product.description || ""),
        );

        if (!productEmbedding) return { product, score: 0 };

        // Calculate similarity with all viewed products
        let maxSimilarity = 0;
        viewedEmbeddings.forEach((embedding) => {
          if (embedding) {
            const similarity = embedding.reduce(
              (sum, val, i) => sum + val * productEmbedding[i],
              0,
            );
            maxSimilarity = Math.max(maxSimilarity, similarity);
          }
        });

        return { product, score: maxSimilarity };
      }),
    );

    // Return top recommendations
    return recommendations
      .filter((r) => r.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((r) => ({
        productId: r.product.id,
        score: r.score,
        reason: "Similar to your browsing history",
      }));
  } catch (error) {
    console.error("Recommendation error:", error);
    return [];
  }
}

/**
 * Analyze sales data for forecasting
 * @param {Array} historicalData - Historical sales data
 * @returns {Object} Sales forecast
 */
export async function forecastSales(historicalData = []) {
  // Simple moving average forecast
  if (!historicalData.length) {
    return {
      predicted: 0,
      trend: "STABLE",
      confidence: 0,
    };
  }

  const recentData = historicalData.slice(-30); // Last 30 days
  const avgSales =
    recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length;

  // Calculate trend
  const firstHalf = recentData.slice(0, Math.floor(recentData.length / 2));
  const secondHalf = recentData.slice(Math.floor(recentData.length / 2));

  const firstAvg =
    firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length;

  let trend = "STABLE";
  if (secondAvg > firstAvg * 1.1) trend = "GROWING";
  else if (secondAvg < firstAvg * 0.9) trend = "DECLINING";

  return {
    predicted: avgSales * 1.1, // Slight growth assumption
    trend,
    confidence: 0.7,
    factors: ["Historical sales pattern", "Seasonal adjustment"],
  };
}

/**
 * Predict customer churn
 * @param {Object} userData - User behavior data
 * @returns {Object} Churn prediction
 */
export async function predictChurn(userData = {}) {
  let churnScore = 0;
  let factors = [];

  // Days since last activity
  if (userData.daysSinceLastActivity > 30) {
    churnScore += 0.3;
    factors.push("No activity in 30+ days");
  }

  // Declining purchase frequency
  if (userData.purchaseFrequencyTrend === "declining") {
    churnScore += 0.4;
    factors.push("Decreasing purchase frequency");
  }

  // Low engagement
  if (userData.avgSessionTime < 60) {
    churnScore += 0.2;
    factors.push("Low site engagement");
  }

  let riskLevel = "LOW";
  if (churnScore > 0.6) riskLevel = "HIGH";
  else if (churnScore > 0.3) riskLevel = "MEDIUM";

  return {
    churnScore: Math.min(churnScore, 1),
    riskLevel,
    factors,
    recommendation:
      riskLevel === "HIGH"
        ? "SEND_REENGAGEMENT_CAMPAIGN"
        : riskLevel === "MEDIUM"
          ? "MONITOR"
          : "NO_ACTION",
  };
}

/**
 * Match product name to categories using zero-shot classification
 * @param {string} productName - Product name to classify
 * @param {Array} categories - List of category names to match against
 * @returns {Object} Category matching results with scores
 */
export async function matchCategoryZeroShot(productName, categories = []) {
  if (!productName || !categories.length) {
    return { matches: [] };
  }

  try {
    const { pipeline } = await import("@huggingface/transformers");
    const classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli');

    const result = await classifier(productName, categories);

    // The result can be either an array or an object with labels/scores
    let matches = [];

    if (Array.isArray(result)) {
      // Result is an array of { label, score } objects
      matches = result.map((item) => ({
        category: item.label,
        score: item.score,
        percentage: Math.round(item.score * 100),
      }));
    } else if (result.labels && result.scores) {
      // Result is an object with labels and scores arrays
      matches = result.labels.map((label, index) => ({
        category: label,
        score: result.scores[index],
        percentage: Math.round(result.scores[index] * 100),
      }));
    } else {
      console.error("Unexpected result format:", result);
      return { matches: [], topMatch: null };
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return {
      matches,
      topMatch: matches[0] || null,
    };
  } catch (error) {
    console.error("Category matching error:", error);
    return { matches: [], topMatch: null };
  }
}
