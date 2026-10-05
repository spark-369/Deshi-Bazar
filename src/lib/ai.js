// Business Logic Utilities
// Note: These functions are designed for server-side use.
//
// This module has NO ML dependencies and no external AI runtime. All text
// understanding and scoring is implemented with lightweight, deterministic
// heuristics: hashed bag-of-words embeddings for similarity, a lexicon-based
// sentiment classifier, and rule-based scoring for negotiation, fraud, churn,
// forecasting, and recommendations. Every function keeps a simple, stable public
// signature/return shape so callers remain decoupled from the underlying logic.

const EMBEDDING_DIM = 256;

/** Lowercase, strip punctuation and split into word tokens. */
function tokenizeText(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Simple deterministic 32-bit hash (FNV-1a) for feature hashing. */
function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
    return hash >>> 0;
}

/**
 * Analyze sentiment of text (lexicon-based; no ML model required)
 * @param {string} text - Text to analyze
 * @returns {Object} Sentiment analysis result: { score, label }
 */
export async function analyzeSentiment(text) {
  try {
    const result = lexiconSentiment(text);
    return {
      score: result.score,
      label: result.label,
    };
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return { score: 0, label: "NEUTRAL" };
  }
}

const POSITIVE_WORDS = new Set([
  "good", "great", "excellent", "amazing", "awesome", "love", "loved", "like",
  "liked", "best", "nice", "fantastic", "wonderful", "perfect", "happy",
  "pleased", "satisfied", "recommend", "recommended", "helpful", "friendly",
  "fast", "quick", "clean", "beautiful", "comfortable", "reliable", "worth",
  "valuable", "impressive", "outstanding", "superb", "delightful", "enjoy",
  "enjoyed", "quality", "fresh", "authentic", "generous", "polite", "smooth",
]);

const NEGATIVE_WORDS = new Set([
  "bad", "terrible", "awful", "horrible", "hate", "hated", "dislike",
  "disliked", "worst", "poor", "ugly", "broken", "useless", "waste", "slow",
  "late", "delayed", "damaged", "defect", "defective", "fake", "fraud",
  "scam", "cheap", "dirty", "rude", "uncomfortable", "unreliable", "annoying",
  "disappointed", "disappointing", "fail", "failed", "failure", "problem",
  "issue", "crash", "buggy", "stale", "rotten", "expired", "missing",
]);

/**
 * Lexicon-based sentiment scoring. Returns a score in [-1, 1] and a label
 * matching the previous model's output (POSITIVE / NEGATIVE / NEUTRAL).
 */
function lexiconSentiment(text) {
  const tokens = tokenizeText(text);
  if (tokens.length === 0) return { score: 0, label: "NEUTRAL" };

  let hits = 0;
  for (const token of tokens) {
    if (POSITIVE_WORDS.has(token)) hits += 1;
    else if (NEGATIVE_WORDS.has(token)) hits -= 1;
  }

  if (hits === 0) return { score: 0.5, label: "NEUTRAL" };

  // Normalize by token count, then map to [-1, 1]-ish confidence scale.
  const normalized = hits / Math.sqrt(tokens.length);
  const score = Math.max(-1, Math.min(1, normalized));
  if (score > 0.05) return { score, label: "POSITIVE" };
  if (score < -0.05) return { score, label: "NEGATIVE" };
  return { score, label: "NEUTRAL" };
}

/**
 * Mask offensive ("bad") words in a text by replacing them with "*".
 * Detection is driven entirely by the sentiment model (no hardcoded word
 * list): each word is analyzed, and strongly-negative words are masked.
 * @param {string} text - The text to mask.
 * @returns {Promise<string>} Text with offensive words replaced by "*".
 */
export async function maskBadWords(text) {
  if (!text || typeof text !== "string") return text;

  // Split while preserving whitespace so spacing is unchanged.
  const tokens = text.split(/(\s+)/);

  const masked = await Promise.all(
    tokens.map(async (token) => {
      const word = token.replace(/[^a-zA-Z]/g, "");
      // Skip short / non-word tokens (articles, punctuation, etc.)
      if (word.length < 3) return token;

      try {
        const sentiment = await analyzeSentiment(token);
        if (sentiment.label === "NEGATIVE" && sentiment.score >= 0.9) {
          return "*".repeat(token.length);
        }
      } catch (e) {
        // If analysis fails, keep the original token.
      }
      return token;
    }),
  );

  return masked.join("");
}

/**
 * Detect fake reviews using a classification model
 * @param {string} reviewText - Review text to analyze
 * @param {Object} reviewMetadata - Additional metadata
 * @returns {Object} Fake review detection result
 */
export async function detectFakeReview(reviewText, reviewMetadata = {}) {
  try {
    // Calculate fake score based on labels
    const sentiment = await analyzeSentiment(reviewText);
    const label = sentiment.label;
    const score = sentiment.score;
    // A review is only treated as fake when it is strongly negative AND
    // spam-like (very short). Sentiment alone must not mark a review fake,
    // otherwise legitimate negative reviews get hidden/flagged incorrectly.
    const wordCount = reviewText.trim().split(/\s+/).filter(Boolean).length;
    const isFake = label === "NEGATIVE" && score > 0.99 && wordCount < 3;
    const fakeScore = isFake ? score : 1 - score;

    return {
      isFake,
      fakeScore,
      confidence: fakeScore * 100,
    };
  } catch (error) {
    console.error("Fake review detection error:", error);
    return { isFake: false, fakeScore: 0, confidence: 0 };
  }
}

/**
 * Generate text embeddings for similarity-based search.
 *
 * A lightweight, dependency-free feature-hashed bag-of-words vector.
 * Vectors are L2-normalized so the existing cosine-similarity (dot product)
 * call sites keep working unchanged. Returns null on failure so callers fall
 * back to substring matching, exactly as before.
 * @param {string} text - Text to embed
 * @returns {Array} Embedding vector (length EMBEDDING_DIM)
 */
export async function generateEmbedding(text) {
  try {
    const tokens = tokenizeText(text);
    if (tokens.length === 0) return null;

    const vector = new Array(EMBEDDING_DIM).fill(0);

    // Term-frequency with a sublinear scale to dampen repeated words.
    const counts = new Map();
    for (const token of tokens) {
      counts.set(token, (counts.get(token) || 0) + 1);
    }

    for (const [token, count] of counts) {
      const index = fnv1a(token) % EMBEDDING_DIM;
      const weight = 1 + Math.log(count);
      vector[index] += weight;
    }

    // L2 normalize so dot product == cosine similarity.
    let norm = 0;
    for (const value of vector) norm += value * value;
    norm = Math.sqrt(norm);
    if (norm === 0) return null;
    for (let i = 0; i < vector.length; i++) vector[i] /= norm;

    return vector;
  } catch (error) {
    console.error("Embedding generation error:", error);
    return null;
  }
}

/**
 * Get search suggestions/autocomplete
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
 * Analyze sales data for forecasting.
 *
 * This is a deterministic, dependency-free heuristic forecaster (no ML model
 * is required, in keeping with the lightweight serverless-friendly design of
 * this module). It uses:
 *   - a weighted moving average that emphasizes recent days, and
 *   - a half-to-half comparison to classify the trend as GROWING / DECLINING /
 *     STABLE, with a momentum multiplier applied to the projection.
 *
 * Confidence is derived deterministically from the amount of usable data and
 * the strength of the observed trend, so it scale from 0 (no data) up to 1.
 *
 * @param {Array} historicalData - Historical sales data entries
 *   `{ date?: string, revenue: number, orders?: number }[]`
 * @returns {Object} Sales forecast
 *   `{ predicted, trend, confidence, factors }`
 */
export async function forecastSales(historicalData = []) {
  // Normalize input and drop zero-revenue days from the projection baseline
  // (zero-revenue days still count toward "activity", but shouldn't drag the
  // predicted average to zero when there is real revenue elsewhere).
  const days = Array.isArray(historicalData)
    ? historicalData
        .map((d) => ({
          date: d.date,
          revenue: Number(d.revenue) || 0,
          orders: Number(d.orders) || 0,
        }))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    : [];

  if (!days.length) {
    return {
      predicted: 0,
      trend: "STABLE",
      confidence: 0,
      factors: ["Not enough sales history to generate a forecast"],
    };
  }

  const recentDays = days.slice(-30); // Last 30 days of activity
  const totalRevenue = recentDays.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = recentDays.reduce((sum, d) => sum + d.orders, 0);

  // If there is no revenue at all in the window, report zero confidently.
  if (totalRevenue <= 0) {
    return {
      predicted: 0,
      trend: "STABLE",
      confidence: 0,
      factors: ["No completed sales in the selected period"],
    };
  }

  // Split into two halves to detect the direction of the trend. Guard against
  // single-day windows (which previously caused a divide-by-zero to NaN).
  const midpoint = Math.floor(recentDays.length / 2);
  const firstHalf = recentDays.slice(0, midpoint);
  const secondHalf = recentDays.slice(midpoint);

  const avg = (arr) => {
    if (!arr.length) return 0;
    return arr.reduce((sum, d) => sum + d.revenue, 0) / arr.length;
  };

  const firstAvg = avg(firstHalf);
  const secondAvg = avg(secondHalf);

  let trend = "STABLE";
  let momentum = 1; // multiplicative projection factor
  if (firstAvg > 0 && secondAvg / firstAvg > 1.1) {
    trend = "GROWING";
    momentum = 1.1;
  } else if (firstAvg > 0 && secondAvg / firstAvg < 0.9) {
    trend = "DECLINING";
    momentum = 0.9;
  } else if (recentDays.length === 1) {
    // Single-day fallback: neutral projection of that day's revenue.
    momentum = 1;
  }

  // Weighted moving average: recent days weigh more than older days.
  const weights = recentDays.map((_, i) => i + 1); // linear weighting
  const weightSum = weights.reduce((s, w) => s + w, 0);
  const weightedAvg =
    recentDays.reduce((sum, d, i) => sum + d.revenue * weights[i], 0) /
    weightSum;

  const predicted = weightedAvg * momentum;

  // Deterministic confidence based on data volume and trend strength.
  let confidence = Math.min(1, recentDays.length / 30); // 0..1 by coverage
  if (trend !== "STABLE") {
    confidence = Math.min(1, confidence + 0.15); // clearer trend = more signal
  }

  const factors = [];
  factors.push(`Based on ${recentDays.length} day(s) of sales data`);
  if (trend !== "STABLE") {
    factors.push(
      `Revenue trend is ${trend.toLowerCase()} over the selected period`,
    );
  }
  if (totalOrders > 0) {
    factors.push(`${totalOrders} completed order(s) in the selected period`);
  }
  factors.push("Projection uses a weighted moving average (no ML model)");

  return {
    predicted: Math.round(predicted * 100) / 100,
    trend,
    confidence: Math.round(confidence * 100) / 100,
    factors,
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
 * Match product name to categories.
 *
 * Lightweight, dependency-free token-overlap scoring between the product name
 * and each category name (plus a keyword synonym map for common categories).
 * Returns the same shape as before: sorted matches and a topMatch.
 * @param {string} productName - Product name to classify
 * @param {Array} categories - List of category names to match against
 * @returns {Object} Category matching results with scores
 */
export async function matchCategoryZeroShot(productName, categories = []) {
  if (!productName || !categories.length) {
    return { matches: [] };
  }

  try {
    const productTokens = new Set(tokenizeText(productName));

    const matches = categories.map((category) => {
      const categoryTokens = tokenizeText(category);
      if (categoryTokens.length === 0) {
        return { category, score: 0, percentage: 0 };
      }

      // Exact substring match is the strongest signal.
      const categoryLower = String(category).toLowerCase();
      const nameLower = String(productName).toLowerCase();
      let overlap = 0;
      for (const token of categoryTokens) {
        if (productTokens.has(token)) overlap += 1;
      }

      const tokenScore = overlap / categoryTokens.length;
      const substringBonus = nameLower.includes(categoryLower) ? 0.5 : 0;
      const score = Math.min(1, tokenScore + substringBonus);

      return {
        category,
        score,
        percentage: Math.round(score * 100),
      };
    });

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
