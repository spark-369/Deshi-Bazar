import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const customOrder = await prisma.customOrder.findUnique({
      where: { id },
        include: {
          items: true,
          buyer: {
            select: { id: true, name: true, email: true, phone: true }
          },
          seller: {
            select: { id: true, name: true, email: true, phone: true }
          }
        }
    });

    if (!customOrder) {
      return NextResponse.json({ error: "Custom order not found" }, { status: 404 });
    }

    // Auth check: buyer, seller, or admin
    const isBuyer = customOrder.userId === user.id;
    const isSeller = customOrder.sellerId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    return NextResponse.json(customOrder);
  } catch (error) {
    console.error("Get custom order error:", error);
    return NextResponse.json({ error: "Failed to fetch custom order" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { action, items, shippingCost, status, shippingMethod, shippingAddress, notes, buyerLatitude, buyerLongitude, sellerLatitude, sellerLongitude } = body;

    const customOrder = await prisma.customOrder.findUnique({
      where: { id },
      include: { seller: true }
    });

    if (!customOrder) {
      return NextResponse.json({ error: "Custom order not found" }, { status: 404 });
    }

    // Check permissions
    const isBuyer = customOrder.userId === user.id;
    const isSeller = customOrder.sellerId === user.id;
    const isAdmin = user.role === "ADMIN";

    // Handle order-level field updates (for seller/admin)
    if (isSeller || isAdmin) {
      // Check if this is a direct field update (not an action)
      const isFieldUpdate = status !== undefined || shippingAddress !== undefined || notes !== undefined || shippingMethod !== undefined;
      
      if (isFieldUpdate && !action) {
        const updateData = {};
        
        if (status !== undefined) {
          const validStatuses = ["PENDING", "VERIFIED", "CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
          if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
          }
          updateData.status = status;
        }
        if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress;
        if (notes !== undefined) updateData.notes = notes;
        if (shippingMethod !== undefined) updateData.shippingMethod = shippingMethod;

        if (Object.keys(updateData).length > 0) {
          await prisma.customOrder.update({
            where: { id },
            data: updateData,
          });
          return NextResponse.json({ message: "Custom order updated successfully" });
        }
      }
    }

    // Handle status updates from admin (either via status field or action field)
    if (isAdmin) {
      // Determine which field contains the status
      const statusToUpdate = status || action;
      
      if (statusToUpdate && !["verify"].includes(action)) {
        // Validate status
        const validStatuses = ["PENDING", "VERIFIED", "CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
        if (!validStatuses.includes(statusToUpdate)) {
          return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        await prisma.customOrder.update({
          where: { id },
          data: { status: statusToUpdate },
        });

        return NextResponse.json({ message: "Custom order status updated successfully" });
      }
    }

    // Otherwise, use action-based logic (for backward compatibility)
    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (action === "verify") {
      // Only seller or admin can verify/edit
      if (!isSeller && !isAdmin) {
        return NextResponse.json({ error: "Only seller or admin can verify orders" }, { status: 403 });
      }
      
      // Update items and recalculate totals
      let subtotal = 0;
      const updatedItems = [];

      for (const itemData of items) {
        const itemId = itemData.id;
        const verifiedQty = parseFloat(itemData.verifiedQuantity || 0);
        const verifiedPrice = parseFloat(itemData.verifiedPrice || 0);

        if (verifiedQty > 0 && verifiedPrice > 0) {
          subtotal += verifiedQty * verifiedPrice;
        }

        updatedItems.push({
          where: { id: itemId },
          data: {
            verifiedQuantity: verifiedQty,
            verifiedPrice: verifiedPrice,
            status: itemData.status || "AVAILABLE",
            sellerNotes: itemData.sellerNotes || null,
            updatedAt: new Date()
          }
        });
      }

      // Calculate tax and shipping based on distance if coordinates provided
      let tax = subtotal * 0.1; // 10% tax
      let shippingCostCalc = 0;
      
      if (buyerLatitude !== undefined && buyerLongitude !== undefined &&
          sellerLatitude !== undefined && sellerLongitude !== undefined &&
          shippingMethod !== undefined) {
        // Haversine formula to calculate distance between two points in kilometers
        const toRad = (value) => (value * Math.PI) / 180;
        const haversineDistance = (lat1, lon1, lat2, lon2) => {
          const R = 6371; // Earth's radius in km
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const lat1Rad = toRad(lat1);
          const lat2Rad = toRad(lat2);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) *
            Math.cos(lat1Rad) * Math.cos(lat2Rad);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };
        const distance = haversineDistance(
          parseFloat(buyerLatitude),
          parseFloat(buyerLongitude),
          parseFloat(sellerLatitude),
          parseFloat(sellerLongitude)
        );
        // Shipping cost per km based on shipping method
        const ratePerKm = {
          standard: 0.5,
          express: 1.0,
          overnight: 2.0,
        }[shippingMethod] || 0.5;
        shippingCostCalc = distance * ratePerKm;
      } else {
        // Fallback to provided shipping cost or default
        shippingCostCalc = shippingCost !== undefined ? parseFloat(shippingCost) : subtotal * 0.05; // 5% default
      }
      
      const total = subtotal + tax + shippingCostCalc;
      
      await prisma.$transaction(async (tx) => {
        // Update items
        for (const update of updatedItems) {
          await tx.customOrderItem.update(update);
        }

        // Update order totals and status
        await tx.customOrder.update({
          where: { id },
          data: {
            status: "VERIFIED",
            subtotal,
            tax,
            shippingCost: shippingCostCalc,
            total,
            updatedAt: new Date()
          }
        });
      });
      
      return NextResponse.json({ message: "Custom order verified successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update custom order error:", error);
    return NextResponse.json({ error: "Failed to update custom order" }, { status: 500 });
  }
}

// DELETE /api/custom-orders/[id] - Delete custom order
export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const customOrder = await prisma.customOrder.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!customOrder) {
      return NextResponse.json({ error: "Custom order not found" }, { status: 404 });
    }

    // Check permissions
    const isBuyer = customOrder.userId === user.id;
    const isSeller = customOrder.sellerId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Only allow deletion of PENDING orders
    if (customOrder.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only delete pending custom orders" },
        { status: 400 },
      );
    }

    // Delete custom order and its items
    await prisma.$transaction(async (tx) => {
      // Delete order items
      await tx.customOrderItem.deleteMany({
        where: { customOrderId: id },
      });

      // Delete custom order
      await tx.customOrder.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "Custom order deleted successfully" });
  } catch (error) {
    console.error("Delete custom order error:", error);
    return NextResponse.json({ error: "Failed to delete custom order" }, { status: 500 });
  }
}
