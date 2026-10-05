import prisma from "@/lib/prisma";
import { predictChurn } from "@/lib/ai";

/**
 * Compute and persist a churn prediction for a single buyer user.
 *
 * The prediction is derived from deterministic behavioral signals (no ML model
 * is required — `predictChurn()` in `src/lib/ai.js` is a lightweight heuristic):
 *   - days since the user's last purchase,
 *   - purchase frequency trend (derived from order date gaps), and
 *   - an approximate engagement score from account age vs. purchase count.
 *
 * The result is upserted into the `ChurnPrediction` table so the
 * `/admin/churn-predictions` page can read it without re-computing.
 *
 * @param {Object} u - Prisma user object. Must include `id`, `role`, `createdAt`,
 *   and `profile` with `purchaseCount` and `lastPurchaseDate`.
 * @returns {Promise<Object|null>} The persisted prediction, or null if the user
 *   is not eligible (not a buyer, or no purchase history).
 */
export async function computeAndPersistChurnPrediction(u) {
  // Only buyers with a purchase history are meaningful churn candidates.
  if (!u || u.role !== "BUYER" || !u.profile?.purchaseCount) return null;

  // Compute real behavioral signals from order history.
  const orders = await prisma.order.findMany({
    where: { userId: u.id },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const now = Date.now();
  const lastPurchaseDate = u.profile.lastPurchaseDate
    ? new Date(u.profile.lastPurchaseDate)
    : null;

  const daysSinceLastActivity = lastPurchaseDate
    ? Math.floor((now - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // Derive purchase frequency trend from order date gaps.
  let purchaseFrequencyTrend = "stable";
  if (orders.length >= 2) {
    const gaps = [];
    for (let i = 1; i < orders.length; i++) {
      gaps.push(
        (new Date(orders[i].createdAt).getTime() -
          new Date(orders[i - 1].createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }
    const firstHalf = gaps.slice(0, Math.floor(gaps.length / 2));
    const secondHalf = gaps.slice(Math.floor(gaps.length / 2));
    const avg = (arr) =>
      arr.reduce((s, g) => s + g, 0) / (arr.length || 1);
    const early = avg(firstHalf);
    const late = avg(secondHalf);
    if (late > early * 1.3) purchaseFrequencyTrend = "declining";
    else if (late < early * 0.7) purchaseFrequencyTrend = "increasing";
  }

  // Approximate engagement from account age vs purchase count.
  const accountAgeDays = Math.max(
    1,
    Math.floor((now - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
  );
  const avgSessionTime = Math.min(
    600,
    (u.profile.purchaseCount / accountAgeDays) * 600,
  );

  const prediction = await predictChurn({
    daysSinceLastActivity,
    purchaseFrequencyTrend,
    avgSessionTime,
  });

  // Persist so /admin/churn-predictions can read it.
  return prisma.churnPrediction.upsert({
    where: { userId: u.id },
    create: {
      userId: u.id,
      churnScore: prediction.churnScore,
      riskLevel: prediction.riskLevel,
      factors: prediction.factors,
    },
    update: {
      churnScore: prediction.churnScore,
      riskLevel: prediction.riskLevel,
      factors: prediction.factors,
    },
  });
}

/**
 * Ensure churn predictions exist for all eligible buyers. Used by the
 * `/api/admin/churn-predictions` endpoint so the page works even when the
 * admin has not visited the users page first (which previously populated the
 * table lazily).
 *
 * @returns {Promise<number>} Number of predictions computed/upserted.
 */
export async function ensureChurnPredictionsExist() {
  const buyers = await prisma.user.findMany({
    where: { role: "BUYER" },
    select: {
      id: true,
      role: true,
      createdAt: true,
      profile: {
        select: {
          purchaseCount: true,
          lastPurchaseDate: true,
        },
      },
    },
  });

  let computed = 0;
  for (const buyer of buyers) {
    if (!buyer.profile?.purchaseCount) continue;
    try {
      await computeAndPersistChurnPrediction(buyer);
      computed += 1;
    } catch (e) {
      console.error(`Churn prediction failed for user ${buyer.id}:`, e);
    }
  }

  return computed;
}
