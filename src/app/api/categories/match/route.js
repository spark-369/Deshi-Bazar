import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { matchCategoryZeroShot } from "@/lib/ai";

// GET /api/categories/match - Match product name to categories using zero-shot classification
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productName = searchParams.get("productName");
    const includeSubcategories =
      searchParams.get("includeSubcategories") !== "false";

    if (!productName || productName.trim().length === 0) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 },
      );
    }

    // Fetch all active parent categories (exclude subcategories)
    const whereClause = {
      isActive: true,
      parentId: null,
    };

    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
    });

    // Build category list for matching (only parent categories)
    const categoryList = [];
    const categoryMap = new Map();

    categories.forEach((cat) => {
      categoryList.push(cat.name);
      categoryMap.set(cat.name, {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        parentId: null,
        isParent: true,
      });
    });

    // Perform zero-shot classification
    const matchResult = await matchCategoryZeroShot(productName, categoryList);

    // Enrich matches with category details
    const enrichedMatches = matchResult.matches.map((match) => {
      const categoryInfo = categoryMap.get(match.category) || {};
      return {
        ...match,
        ...categoryInfo,
      };
    });

    // Get top match details
    let topMatch = null;
    if (matchResult.topMatch) {
      const topCategoryInfo =
        categoryMap.get(matchResult.topMatch.category) || {};
      topMatch = {
        ...matchResult.topMatch,
        ...topCategoryInfo,
      };
    }
    return NextResponse.json({
      productName,
      topMatch,
      matches: enrichedMatches,
      totalCategories: categoryList.length,
      includeSubcategories,
    });
  } catch (error) {
    console.error("Category matching error:", error);
    return NextResponse.json(
      { error: "Failed to match categories" },
      { status: 500 },
    );
  }
}
